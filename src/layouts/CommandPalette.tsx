import { useEffect, useId, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpenText, CornerDownLeft, Search, Stethoscope, Wrench, LayoutGrid } from 'lucide-react';
import { Modal } from '../components/ui/Modal';
import { search, SEARCH_KIND_LABEL, type SearchItem, type SearchKind } from '../data/searchIndex';
import { cn } from '../utils/cn';

const KIND_ICON: Record<SearchKind, typeof Search> = {
  module: LayoutGrid,
  diagnosis: Stethoscope,
  term: BookOpenText,
  check: Wrench,
};

const SUGGESTIONS = ['400', '401 מול 403', 'CORS', 'timeout', 'Correlation ID', 'JSON diff'];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const navigate = useNavigate();
  const titleId = useId();
  const results = useMemo(() => search(q, 14), [q]);

  useEffect(() => {
    if (!open) {
      setQ('');
      setActive(0);
    }
  }, [open]);
  useEffect(() => setActive(0), [q]);

  const go = (item: SearchItem) => {
    onClose();
    navigate(item.path);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === 'Enter' && results[active]) {
      e.preventDefault();
      go(results[active]);
    }
  };

  return (
    <Modal open={open} onClose={onClose} bare labelledBy={titleId} className="max-w-2xl">
      <h2 id={titleId} className="sr-only">חיפוש ב-DRQA</h2>
      <div className="flex items-center gap-3 border-b border-line px-4">
        <Search className="size-5 text-accent" aria-hidden />
        <input
          data-autofocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={onKey}
          placeholder="חפשו קוד סטטוס, סימפטום, מונח או כלי…"
          className="h-14 w-full bg-transparent text-base text-fg outline-none placeholder:text-subtle"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls={`${titleId}-list`}
          aria-activedescendant={results[active] ? `${titleId}-${results[active].id}` : undefined}
          aria-label="חיפוש"
        />
        <kbd className="kbd">Esc</kbd>
      </div>
      <div className="max-h-[60vh] overflow-y-auto p-2">
        {q.trim() === '' ? (
          <div className="p-3">
            <div className="mb-2 text-xs font-medium text-subtle">חיפושים מוצעים</div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="chip" onClick={() => setQ(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : results.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted">לא נמצאו תוצאות עבור "{q}"</div>
        ) : (
          <ul id={`${titleId}-list`} role="listbox" className="space-y-0.5">
            {results.map((r, i) => {
              const Icon = KIND_ICON[r.kind];
              return (
                <li key={r.id} id={`${titleId}-${r.id}`} role="option" aria-selected={i === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(i)}
                    onClick={() => go(r)}
                    className={cn('flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-start transition', i === active ? 'bg-accent/10' : 'hover:bg-surface-2')}
                  >
                    <span className={cn('mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg border', i === active ? 'border-accent/40 text-accent' : 'border-line text-subtle')}>
                      <Icon className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="truncate text-sm font-medium text-fg">{r.title}</span>
                        <span className="badge badge-neutral shrink-0">{SEARCH_KIND_LABEL[r.kind]}</span>
                      </span>
                      <span className="mt-0.5 line-clamp-1 block text-xs text-muted">{r.subtitle}</span>
                    </span>
                    {i === active && <CornerDownLeft className="mt-2 size-4 shrink-0 text-accent" aria-hidden />}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="flex items-center justify-between border-t border-line px-4 py-2 text-2xs text-subtle">
        <span>
          <kbd className="kbd">↑</kbd> <kbd className="kbd">↓</kbd> ניווט · <kbd className="kbd">Enter</kbd> פתיחה
        </span>
        <span>החיפוש מקומי בלבד</span>
      </div>
    </Modal>
  );
}
