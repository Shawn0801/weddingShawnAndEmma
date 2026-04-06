/**
 * UIRenderer — 管理頁面狀態與 DOM 渲染
 * 狀態：loading → input → searching → result / not_found
 */
class UIRenderer {
  constructor({ tables, searchEngine, onSearch }) {
    this.tables = tables;
    this.searchEngine = searchEngine;
    this.onSearch = onSearch;

    // DOM 快取
    this.screens = {
      loading: document.getElementById('screen-loading'),
      input: document.getElementById('screen-input'),
      result: document.getElementById('screen-result'),
      notFound: document.getElementById('screen-not-found'),
    };
    this.nameInput = document.getElementById('guest-name');
    this.searchBtn = document.getElementById('btn-search');
    this.retryBtns = document.querySelectorAll('.btn-retry');
    this.resultInfo = document.getElementById('result-info');
    this.mainHallGrid = document.getElementById('grid-main-hall');
    this.privateRoomGrid = document.getElementById('grid-private-room');

    this._bindEvents();
  }

  /* ── 事件綁定 ── */
  _bindEvents() {
    this.searchBtn.addEventListener('click', () => this._handleSearch());
    this.nameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._handleSearch();
    });
    this.retryBtns.forEach(btn => btn.addEventListener('click', () => this.showScreen('input')));
  }

  _handleSearch() {
    const query = this.nameInput.value.trim();
    if (!query) {
      this.nameInput.classList.add('shake');
      setTimeout(() => this.nameInput.classList.remove('shake'), 500);
      return;
    }
    this.onSearch(query);
  }

  /* ── 畫面切換 ── */
  showScreen(name) {
    Object.entries(this.screens).forEach(([key, el]) => {
      if (key === name) { Utils.show(el); } else { Utils.hide(el); }
    });
    if (name === 'input') {
      this.nameInput.value = '';
      setTimeout(() => this.nameInput.focus(), 350);
    }
  }

  /* ── 渲染搜尋結果 ── */
  renderResult(searchResult) {
    const { results, matchType } = searchResult;

    if (matchType === 'not_found' || results.length === 0) {
      this.showScreen('notFound');
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
      <p class="result-table">您的座位在 <strong>${this._esc(match.tableName)}</strong>（第 ${this._esc(String(match.tableId))} 桌）</p>
      <p class="result-location">${match.location === 'private_room' ? '📍 包廂區' : '📍 主場地'}</p>
    `;
    if (allResults.length > 1) {
      html += `<p class="result-hint">找到多筆相似結果，已為您顯示最相符的座位</p>`;
    }
    this.resultInfo.innerHTML = html;
  }

  _renderTables(highlightId) {
    const mainTables = this.tables.filter(t => t.location === 'main_hall');
    const privateTables = this.tables.filter(t => t.location === 'private_room');

    this.mainHallGrid.innerHTML = mainTables.map(t => this._tableCard(t, highlightId)).join('');
    this.privateRoomGrid.innerHTML = privateTables.map(t => this._tableCard(t, highlightId)).join('');
  }

  _tableCard(table, highlightId) {
    const isActive = table.id === highlightId;
    return `
      <div class="table-card ${isActive ? 'table-active' : 'table-inactive'}">
        <span class="table-id">${this._esc(String(table.id))}</span>
        <span class="table-name">${this._esc(table.name)}</span>
      </div>
    `;
  }
}
