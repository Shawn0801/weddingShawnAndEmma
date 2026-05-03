/**
 * DataLoader — 負責從不同資料來源載入賓客座位資料
 * 支援：google_sheets / json / api
 */
class DataLoader {
  constructor(config) {
    this.config = config;
    this.CACHE_KEY = 'wedding_seating_data';
    this.CACHE_TS_KEY = 'wedding_seating_ts';
  }

  /* ── 主要入口 ── */
  async load() {
    const isJson = !this.config.dataSource || this.config.dataSource === 'json';

    // JSON 來源是本地檔案，每次直接讀取，不使用快取
    if (!isJson) {
      const cached = this._readCache();
      if (cached) return cached;
    }

    // 依設定來源載入
    let data;
    switch (this.config.dataSource) {
      case 'google_sheets':
        data = await this._loadFromGoogleSheets();
        break;
      case 'api':
        data = await this._loadFromAPI();
        break;
      case 'json':
      default:
        data = await this._loadFromJSON();
        break;
    }

    // 驗證（JSON 不寫快取；其他來源才快取）
    this._validate(data);
    if (!isJson) this._writeCache(data);
    return data;
  }

  /* ── Google Sheets（公開發佈為 CSV） ── */
  async _loadFromGoogleSheets() {
    const { googleSheetId, googleSheetGid } = this.config;
    if (!googleSheetId) throw new Error('Google Sheet ID 未設定');

    const url = `https://docs.google.com/spreadsheets/d/${googleSheetId}/export?format=csv&gid=${googleSheetGid || 0}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('無法載入 Google Sheets 資料');

    const csv = await res.text();
    return this._parseCSV(csv);
  }

  /**
   * 解析 CSV → 標準 tables 格式
   * 預期欄位：guest_name, table_id, table_name, location
   */
  _parseCSV(csv) {
    const lines = csv.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length < 2) throw new Error('CSV 資料為空');

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    const idxName = headers.indexOf('guest_name');
    const idxTid = headers.indexOf('table_id');
    const idxTname = headers.indexOf('table_name');
    const idxLoc = headers.indexOf('location');

    if (idxName === -1 || idxTid === -1) {
      throw new Error('CSV 缺少必要欄位 (guest_name, table_id)');
    }

    const tableMap = new Map();

    for (let i = 1; i < lines.length; i++) {
      const cols = this._splitCSVLine(lines[i]);
      const guestName = (cols[idxName] || '').trim();
      const tableId = parseInt(cols[idxTid], 10);
      const tableName = (cols[idxTname] || `桌 ${tableId}`).trim();
      const location = (cols[idxLoc] || 'main_hall').trim();

      if (!guestName || isNaN(tableId)) continue;

      if (!tableMap.has(tableId)) {
        tableMap.set(tableId, { id: tableId, name: tableName, location, guests: [] });
      }
      tableMap.get(tableId).guests.push(guestName);
    }

    return { tables: Array.from(tableMap.values()).sort((a, b) => a.id - b.id) };
  }

  /** 處理含逗號的 CSV 欄位 */
  _splitCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (const ch of line) {
      if (ch === '"') { inQuotes = !inQuotes; continue; }
      if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue; }
      current += ch;
    }
    result.push(current);
    return result;
  }

  /* ── 靜態 JSON（清除舊快取，確保每次讀最新檔） ── */
  async _loadFromJSON() {
    this.clearCache();
    const res = await fetch(this.config.jsonPath || './data/seating-data.json');
    if (!res.ok) throw new Error('無法載入 JSON 資料');
    return res.json();
  }

  /* ── 自建 API ── */
  async _loadFromAPI() {
    if (!this.config.apiEndpoint) throw new Error('API endpoint 未設定，請更新 chairForU/data/config.json');
    const res = await fetch(this.config.apiEndpoint, { redirect: 'follow' });
    if (!res.ok) throw new Error('API 回應錯誤');
    return res.json();
  }

  /* ── 快取 ── */
  _readCache() {
    try {
      const ts = parseInt(localStorage.getItem(this.CACHE_TS_KEY), 10);
      if (!ts || Date.now() - ts > (this.config.cacheDuration || 3600) * 1000) return null;
      const raw = localStorage.getItem(this.CACHE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  _writeCache(data) {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      localStorage.setItem(this.CACHE_TS_KEY, String(Date.now()));
    } catch { /* quota exceeded — 忽略 */ }
  }

  clearCache() {
    localStorage.removeItem(this.CACHE_KEY);
    localStorage.removeItem(this.CACHE_TS_KEY);
  }

  /* ── 驗證 ── */
  _validate(data) {
    if (!data || !Array.isArray(data.tables) || data.tables.length === 0) {
      throw new Error('資料格式錯誤：缺少 tables 陣列');
    }
  }
}
