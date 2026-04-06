/**
 * 通用工具函數
 */
const Utils = {
  /**
   * 正規化字串：去頭尾空白、全形轉半形、統一小寫
   */
  normalize(str) {
    if (!str) return '';
    return str
      .trim()
      .replace(/[\uff01-\uff5e]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0))
      .replace(/\u3000/g, ' ')
      .toLowerCase();
  },

  /**
   * Levenshtein 距離（用於模糊比對）
   */
  levenshtein(a, b) {
    const m = a.length, n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        dp[i][j] = a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
      }
    }
    return dp[m][n];
  },

  /**
   * 防抖
   */
  debounce(fn, ms = 300) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  },

  /**
   * 顯示 / 隱藏 DOM 元素（帶 fade 動畫）
   */
  show(el) { el.classList.remove('hidden'); el.classList.add('visible'); },
  hide(el) { el.classList.remove('visible'); el.classList.add('hidden'); }
};
