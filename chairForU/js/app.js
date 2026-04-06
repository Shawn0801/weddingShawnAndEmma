/**
 * App — 座位查詢系統入口
 */
(async function initApp() {
  try {
    // 1. 載入設定
    const cfgRes = await fetch('./data/config.json');
    const config = await cfgRes.json();

    // 2. 載入資料
    const loader = new DataLoader(config);
    const data = await loader.load();

    // 3. 建立搜尋引擎
    const engine = new SearchEngine();
    engine.buildIndex(data.tables);

    // 4. 初始化 UI
    const ui = new UIRenderer({
      tables: data.tables,
      searchEngine: engine,
      onSearch(query) {
        const result = engine.search(query);
        ui.renderResult(result);
      }
    });

    // 5. 顯示輸入畫面
    ui.showScreen('input');

  } catch (err) {
    console.error('初始化失敗:', err);
    const el = document.getElementById('screen-loading');
    if (el) {
      const p = document.createElement('p');
      p.className = 'error-msg';
      p.textContent = '載入失敗，請重新整理頁面';
      const small = document.createElement('small');
      small.textContent = err.message;
      p.appendChild(document.createElement('br'));
      p.appendChild(small);
      el.textContent = '';
      el.appendChild(p);
    }
  }
})();
