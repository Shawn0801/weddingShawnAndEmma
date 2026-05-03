/**
 * SearchEngine — 多層級賓客搜尋
 * 搜尋順序：精確 → 部分匹配 → 模糊匹配
 */
class SearchEngine {
  constructor() {
    /** @type {Map<string, {tableId:number, tableName:string, location:string, guestName:string}>} */
    this.index = new Map();
    this.allGuests = [];
  }

  /** 從 tables 資料建立索引 */
  buildIndex(tables) {
    this.index.clear();
    this.allGuests = [];

    for (const table of tables) {
      for (const guest of table.guests) {
        const key = Utils.normalize(guest);
        const entry = {
          tableId: table.id,
          tableName: table.name,
          location: table.location,
          guestName: guest
        };
        this.index.set(key, entry);
        this.allGuests.push({ key, ...entry });
      }
    }
  }

  /**
   * 搜尋賓客
   * @param {string} query 使用者輸入
   * @returns {{results: Array, matchType: string}}
   */
  search(query) {
    const q = Utils.normalize(query);
    if (!q) return { results: [], matchType: 'empty' };

    // 精確匹配
    const exact = this.index.get(q);
    if (exact) return { results: [exact], matchType: 'exact' };

    return { results: [], matchType: 'not_found' };
  }
}
