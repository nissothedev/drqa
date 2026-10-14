import { Plus, Trash2 } from 'lucide-react';
import type { KeyValue } from '../../modules/api-request-lab/mockApi';
import { cn } from '../../utils/cn';

interface Props {
  rows: KeyValue[];
  onChange: (rows: KeyValue[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  label: string;
  suggestions?: string[];
}

export function KeyValueEditor({ rows, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value', label, suggestions }: Props) {
  const update = (i: number, patch: Partial<KeyValue>) => onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));
  const remove = (i: number) => onChange(rows.filter((_, j) => j !== i));
  const add = (key = '') => onChange([...rows, { key, value: '', enabled: true }]);
  const listId = `kv-${label.replace(/\s+/g, '-')}`;

  return (
    <div className="space-y-2" dir="ltr">
      {suggestions && (
        <datalist id={listId}>
          {suggestions.map((s) => (
            <option key={s} value={s} />
          ))}
        </datalist>
      )}
      <div className="hidden grid-cols-[28px_1fr_1.4fr_36px] gap-2 px-1 text-[11px] font-medium uppercase tracking-wider text-subtle sm:grid">
        <span />
        <span>Key</span>
        <span>Value</span>
        <span />
      </div>
      {rows.length === 0 && <p className="rounded-lg border border-dashed border-line px-3 py-3 text-center text-xs text-subtle" dir="rtl">אין שורות. הוסיפו שורה חדשה.</p>}
      {rows.map((r, i) => (
        <div key={i} className={cn('grid grid-cols-[28px_1fr_36px] items-center gap-2 sm:grid-cols-[28px_1fr_1.4fr_36px]', !r.enabled && 'opacity-55')}>
          <input type="checkbox" checked={r.enabled} onChange={(e) => update(i, { enabled: e.target.checked })} className="size-4 justify-self-center" aria-label={`${label} ${i + 1} פעיל`} />
          <input
            value={r.key}
            onChange={(e) => update(i, { key: e.target.value })}
            placeholder={keyPlaceholder}
            className="input input-mono py-2"
            aria-label={`${label} ${i + 1} מפתח`}
            list={suggestions ? listId : undefined}
          />
          <input
            value={r.value}
            onChange={(e) => update(i, { value: e.target.value })}
            placeholder={valuePlaceholder}
            className="input input-mono col-span-2 col-start-2 row-start-2 py-2 sm:col-span-1 sm:col-start-auto sm:row-start-auto"
            aria-label={`${label} ${i + 1} ערך`}
          />
          <button type="button" onClick={() => remove(i)} className="btn btn-ghost btn-icon justify-self-center hover:text-danger" aria-label={`מחיקת ${label} ${i + 1}`}>
            <Trash2 className="size-4" />
          </button>
        </div>
      ))}
      <button type="button" onClick={() => add()} className="btn btn-ghost btn-sm" dir="rtl">
        <Plus className="size-3.5" aria-hidden />
        הוספת שורה
      </button>
    </div>
  );
}
