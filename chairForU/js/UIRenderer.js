/**
 * UIRenderer — 管理頁面狀態與 DOM 渲染
 * 狀態：loading → input → searching → result / not_found
 */
class UIRenderer {
  constructor({ tables, searchEngine, onSearch }) {
    this.tables = tables;
    this.searchEngine = searchEngine;
    this.onSearch = onSearch;

    // 所有賓客姓名（供 autocomplete，去重）
    this.allGuestNames = [...new Set(tables.flatMap(t => t.guests || []))];

    // DOM 快取
    this.screens = {
      loading: document.getElementById('screen-loading'),
      input: document.getElementById('screen-input'),
      result: document.getElementById('screen-result'),
      notFound: document.getElementById('screen-not-found'),
    };
    this.nameInput        = document.getElementById('guest-name');
    this.searchBtn        = document.getElementById('btn-search');
    this.retryBtns        = document.querySelectorAll('.btn-retry');
    this.nfModal          = document.getElementById('modal-not-found');
    this.resultInfo       = document.getElementById('result-info');
    this.mainHallGrid     = document.getElementById('grid-main-hall');
    this.privateRoomGrid  = document.getElementById('grid-private-room');
    this.autocompleteList = document.getElementById('autocomplete-list');

    this._bindEvents();
  }

  /* ── 事件綁定 ── */
  _bindEvents() {
    this.searchBtn.addEventListener('click', () => this._handleSearch());

    this.retryBtns.forEach(btn => btn.addEventListener('click', () => this.showScreen('input')));

    document.getElementById('btn-nf-close').addEventListener('click', () => {
      this.nfModal.classList.add('hidden');
    });
    this.nfModal.addEventListener('click', e => {
      if (e.target === this.nfModal) this.nfModal.classList.add('hidden');
    });

    // Autocomplete
    this.nameInput.addEventListener('input', () => this._handleAutocomplete());
    this.nameInput.addEventListener('keydown', e => {
      if (e.key === 'Escape') this._hideAutocomplete();
    });
    document.addEventListener('click', e => {
      if (!this.nameInput.contains(e.target) && !this.autocompleteList.contains(e.target)) {
        this._hideAutocomplete();
      }
    });
  }

  _handleSearch() {
    const query = this.nameInput.value.trim();
    if (!query) {
      this.nameInput.classList.add('shake');
      setTimeout(() => this.nameInput.classList.remove('shake'), 500);
      return;
    }
    this._hideAutocomplete();
    this.onSearch(query);
  }

  /* ── Autocomplete ── */
  _handleAutocomplete() {
    const q = this.nameInput.value.trim();
    if (!q) { this._hideAutocomplete(); return; }

    const matches = this.allGuestNames
      .filter(name => name.includes(q))
      .slice(0, 8);

    if (matches.length === 0) { this._hideAutocomplete(); return; }

    this.autocompleteList.innerHTML = '';
    matches.forEach(name => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.textContent = name;
      item.addEventListener('mousedown', e => {
        e.preventDefault(); // 避免 blur 先觸發把選單關掉
        this.nameInput.value = name;
        this._hideAutocomplete();
        this.nameInput.focus();
      });
      this.autocompleteList.appendChild(item);
    });
    this.autocompleteList.classList.remove('hidden');
  }

  _hideAutocomplete() {
    if (this.autocompleteList) {
      this.autocompleteList.classList.add('hidden');
      this.autocompleteList.innerHTML = '';
    }
  }

  /* ── 畫面切換 ── */
  showScreen(name) {
    Object.entries(this.screens).forEach(([key, el]) => {
      if (key === name) { Utils.show(el); } else { Utils.hide(el); }
    });
    if (name === 'input') {
      this.nameInput.value = '';
      this._hideAutocomplete();
      setTimeout(() => this.nameInput.focus(), 350);
    }
  }

  /* ── 渲染搜尋結果 ── */
  renderResult(searchResult) {
    const { results, matchType } = searchResult;

    if (matchType === 'not_found' || results.length === 0) {
      this.nfModal.classList.remove('hidden');
      return;
    }

    // 取第一筆（若多筆一樣也只高亮一張桌子）
    const match = results[0];
    this._renderInfo(match, results);
    this._renderTables(match.tableId);
    this.showScreen('result');
  }

  _esc(str) {
    const d = document.createElement('div');
    d.textContent = str;
    return d.innerHTML;
  }

  _renderInfo(match, allResults) {
    let html = `
      <p class="result-guest-name">${this._esc(match.guestName)}，您好！</p>
      <p class="result-table">您的座位在 <strong>${this._esc(match.tableName)}</strong></p>
      <p class="result-location">${match.location === 'private_room' ? '📍 包廂區' : '📍 大廳'}</p>
    `;
    if (allResults.length > 1) {
      html += `<p class="result-hint">找到多筆相似結果，已為您顯示最相符的座位</p>`;
    }
    this.resultInfo.innerHTML = html;
  }

  _renderTables(highlightId) {
    const mainTables    = this.tables.filter(t => t.location === 'main_hall');
    const privateTables = this.tables.filter(t => t.location === 'private_room');

    this.mainHallGrid.innerHTML    = mainTables.map(t => this._tableCard(t, highlightId)).join('');
    this.privateRoomGrid.innerHTML = privateTables.map(t => this._tableCard(t, highlightId)).join('');
  }

  _tableCard(table, highlightId) {
    const isActive = table.id === highlightId;
    return `
      <div class="table-card ${isActive ? 'table-active' : 'table-inactive'}" data-table-id="${table.id}">
        <span class="table-name">${this._esc(table.name)}</span>
      </div>
    `;
  }
}
