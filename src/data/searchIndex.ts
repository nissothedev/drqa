import { MODULES } from './modules';
import { GLOSSARY } from './glossary';
import { ENTRY_POINTS, CHECKS } from '../modules/api-doctor/data';

export type SearchKind = 'module' | 'diagnosis' | 'term' | 'check';

export interface SearchItem {
  id: string;
  kind: SearchKind;
  title: string;
  subtitle: string;
  path: string;
  haystack: string;
}

export const SEARCH_KIND_LABEL: Record<SearchKind, string> = {
  module: 'מודול',
  diagnosis: 'אבחון',
  term: 'מונח',
  check: 'בדיקה מומלצת',
};

function norm(s: string): string {
  return s.toLowerCase().replace(/[֑-ׇ]/g, '').replace(/[״"׳']/g, '');
}

const items: SearchItem[] = [
  ...MODULES.map((m) => ({
    id: `m:${m.id}`,
    kind: 'module' as const,
    title: m.title,
    subtitle: m.description,
    path: m.path,
    haystack: norm([m.title, m.titleEn, m.description, ...m.keywords].join(' ')),
  })),
  ...ENTRY_POINTS.map((e) => ({
    id: `d:${e.id}`,
    kind: 'diagnosis' as const,
    title: e.label,
    subtitle: e.hint,
    path: `/api-doctor?entry=${encodeURIComponent(e.id)}`,
    haystack: norm([e.label, e.hint, e.scenarioId].join(' ')),
  })),
  ...GLOSSARY.map((t) => ({
    id: `t:${t.id}`,
    kind: 'term' as const,
    title: `${t.term} · ${t.he}`,
    subtitle: t.definition,
    path: `/knowledge?term=${encodeURIComponent(t.id)}`,
    haystack: norm([t.term, t.he, t.definition].join(' ')),
  })),
  ...Object.values(CHECKS).map((c) => ({
    id: `c:${c.id}`,
    kind: 'check' as const,
    title: c.title,
    subtitle: c.what,
    path: `/knowledge?check=${encodeURIComponent(c.id)}`,
    haystack: norm([c.title, c.what, c.why].join(' ')),
  })),
];

export function search(query: string, limit = 12): SearchItem[] {
  const q = norm(query.trim());
  if (!q) return [];
  const words = q.split(/\s+/).filter(Boolean);
  const scored: Array<{ item: SearchItem; score: number }> = [];
  for (const item of items) {
    const title = norm(item.title);
    let score = 0;
    let all = true;
    for (const w of words) {
      if (title.startsWith(w)) score += 6;
      else if (title.includes(w)) score += 4;
      else if (item.haystack.includes(w)) score += 1;
      else all = false;
    }
    if (!all) continue;
    if (item.kind === 'diagnosis') score += 3;
    if (item.kind === 'module') score += 1;
    scored.push({ item, score });
  }
  return scored.sort((a, b) => b.score - a.score).slice(0, limit).map((s) => s.item);
}
