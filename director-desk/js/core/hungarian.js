/* 匈牙利算法（Kuhn–Munkres，O(n²m)）：最小化 n×m 代价矩阵的指派，要求 n ≤ m。
   返回 rowToCol 数组。用于“镜头 ↔ 剧本段落槽位”的全局最优匹配。 */
(function (g) {
  'use strict';
  const SC = (g.SC = g.SC || {});

  SC.hungarian = function (cost) {
    const n = cost.length;
    if (!n) return [];
    const m = cost[0].length;
    if (n > m) throw new Error('hungarian: 行数必须 ≤ 列数');
    const INF = 1e18;
    const u = new Float64Array(n + 1), v = new Float64Array(m + 1);
    const p = new Int32Array(m + 1), way = new Int32Array(m + 1);
    const minv = new Float64Array(m + 1);
    const used = new Uint8Array(m + 1);
    for (let i = 1; i <= n; i++) {
      p[0] = i;
      let j0 = 0;
      minv.fill(INF);
      used.fill(0);
      do {
        used[j0] = 1;
        const i0 = p[j0];
        let delta = INF, j1 = 0;
        const row = cost[i0 - 1];
        for (let j = 1; j <= m; j++) {
          if (used[j]) continue;
          const cur = row[j - 1] - u[i0] - v[j];
          if (cur < minv[j]) { minv[j] = cur; way[j] = j0; }
          if (minv[j] < delta) { delta = minv[j]; j1 = j; }
        }
        for (let j = 0; j <= m; j++) {
          if (used[j]) { u[p[j]] += delta; v[j] -= delta; }
          else minv[j] -= delta;
        }
        j0 = j1;
      } while (p[j0] !== 0);
      do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0);
    }
    const res = new Array(n).fill(-1);
    for (let j = 1; j <= m; j++) if (p[j]) res[p[j] - 1] = j - 1;
    return res;
  };
})(typeof window !== 'undefined' ? window : globalThis);
