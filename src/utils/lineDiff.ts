/**
 * LCS-based line diff producing aligned rows for a side-by-side view.
 * Adjacent removed/added runs are paired into "modified" rows.
 */

export type RowKind = 'same' | 'added' | 'removed' | 'modified';

export interface DiffRow {
  kind: RowKind;
  left?: { no: number; text: string };
  right?: { no: number; text: string };
}

export const MAX_DIFF_LINES = 3000;

export function lineDiff(aText: string, bText: string): DiffRow[] | null {
  const a = aText.split('\n');
  const b = bText.split('\n');
  if (a.length > MAX_DIFF_LINES || b.length > MAX_DIFF_LINES) return null;
  const n = a.length;
  const m = b.length;
  // LCS table (lengths of suffixes) using Uint16/32 rows to limit memory.
  const dp: Uint32Array[] = Array.from({ length: n + 1 }, () => new Uint32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const ops: Array<{ t: 'same' | 'del' | 'add'; i?: number; j?: number }> = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      ops.push({ t: 'same', i, j });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ t: 'del', i });
      i++;
    } else {
      ops.push({ t: 'add', j });
      j++;
    }
  }
  while (i < n) ops.push({ t: 'del', i: i++ });
  while (j < m) ops.push({ t: 'add', j: j++ });

  const rows: DiffRow[] = [];
  let k = 0;
  while (k < ops.length) {
    const op = ops[k];
    if (op.t === 'same') {
      rows.push({ kind: 'same', left: { no: op.i! + 1, text: a[op.i!] }, right: { no: op.j! + 1, text: b[op.j!] } });
      k++;
      continue;
    }
    const dels: number[] = [];
    const adds: number[] = [];
    while (k < ops.length && ops[k].t !== 'same') {
      if (ops[k].t === 'del') dels.push(ops[k].i!);
      else adds.push(ops[k].j!);
      k++;
    }
    const pairs = Math.max(dels.length, adds.length);
    for (let p = 0; p < pairs; p++) {
      const d = dels[p];
      const ad = adds[p];
      if (d !== undefined && ad !== undefined) rows.push({ kind: 'modified', left: { no: d + 1, text: a[d] }, right: { no: ad + 1, text: b[ad] } });
      else if (d !== undefined) rows.push({ kind: 'removed', left: { no: d + 1, text: a[d] } });
      else rows.push({ kind: 'added', right: { no: ad + 1, text: b[ad] } });
    }
  }
  return rows;
}
