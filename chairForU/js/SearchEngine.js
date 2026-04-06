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

    // Level 1: 精確匹配
    const exact = this.index.get(q);
    if (exact) return { results: [exact], matchType: 'exact' };

    // Level 2: 部分匹配（包含搜尋）
    const partial = this.allGuests.filter(g => g.key.includes(q) || q.includes(g.key));
    if (partial.length > 0) {
      return { results: partial.map(g => ({ tableId: g.tableId, tableName: g.tableName, location: g.location, guestName: g.guestName })), matchType: 'partial' };
    }

    // Level 3: 模糊匹配（Levenshtein ≤ 2）
    const fuzzy = this.allGuests
      .map(g => ({ ...g, dist: Utils.levenshtein(q, g.key) }))
      .filter(g => g.dist <= 2)
      .sort((a, b) => a.dist - b.dist);

    if (fuzzy.length > 0) {
      return { results: fuzzy.map(g => ({ tableId: g.tableId, tableName: g.tableName, location: g.location, guestName: g.guestName })), matchType: 'fuzzy' };
    }

    return { results: [], matchType: 'not_found' };
  }
}
