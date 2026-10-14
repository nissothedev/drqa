import { useMemo, useState } from 'react';
import { ChevronDown, Download, FileText, ListChecks, Plus, Trash2, Wand2 } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Callout } from '../../components/ui/Callout';
import { CopyButton } from '../../components/ui/CopyButton';
import { Field, Toggle } from '../../components/ui/Field';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { HTTP_METHODS, type HttpMethod } from '../../data/http';
import type { EndpointSpec, FieldSpec, FieldType, TestCase, TestCategory } from '../../types/testing';
import { downloadFile, fileStamp } from '../../utils/download';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';
import { CATEGORY_LABEL, generateTestCases, hasBody, toCsv, toText } from './generator';

const FIELD_TYPES: FieldType[] = ['string', 'integer', 'number', 'boolean', 'enum', 'email', 'date', 'array', 'object'];

const PRESETS: Record<string, { label: string; spec: EndpointSpec }> = {
  order: {
    label: 'POST /v1/orders',
    spec: {
      method: 'POST',
      path: '/v1/orders',
      authRequired: true,
      successStatus: 201,
      validationStatus: 422,
      duplicateCheck: true,
      fields: [
        { name: 'customerId', type: 'string', required: true, example: 'CUS-1001' },
        { name: 'sku', type: 'string', required: true, example: 'SKU-DS-1001' },
        { name: 'quantity', type: 'integer', required: true, min: 1, max: 10 },
        { name: 'couponCode', type: 'string', required: false, min: 4, max: 12, nullable: true },
        { name: 'notes', type: 'string', required: false, max: 200 },
      ],
    },
  },
  products: {
    label: 'GET /v1/products',
    spec: {
      method: 'GET',
      path: '/v1/products',
      authRequired: false,
      successStatus: 200,
      validationStatus: 400,
      duplicateCheck: false,
      fields: [
        { name: 'category', type: 'enum', required: false, allowed: ['lighting', 'accessories', 'stationery'] },
        { name: 'limit', type: 'integer', required: false, min: 1, max: 50 },
      ],
    },
  },
  user: {
    label: 'POST /v1/users',
    spec: {
      method: 'POST',
      path: '/v1/users',
      authRequired: true,
      successStatus: 201,
      validationStatus: 400,
      duplicateCheck: false,
      fields: [
        { name: 'email', type: 'email', required: true, unique: true },
        { name: 'displayName', type: 'string', required: true, min: 2, max: 50 },
        { name: 'role', type: 'enum', required: true, allowed: ['customer', 'admin'] },
        { name: 'marketingOptIn', type: 'boolean', required: false },
      ],
    },
  },
};

const PRIORITY_CLS: Record<TestCase['priority'], string> = { High: 'badge-danger', Medium: 'badge-warning', Low: 'badge-neutral' };

function numOrUndef(v: string): number | undefined {
  if (v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function CaseCard({ c }: { c: TestCase }) {
  const [open, setOpen] = useState(false);
  return (
    <article className={cn('rounded-xl border transition', open ? 'border-line-strong bg-surface-2/40' : 'border-line hover:border-line-strong')}>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center gap-3 p-3 text-start">
        <span className="hidden font-mono text-[11px] text-subtle sm:block" dir="ltr">
          {c.id}
        </span>
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">{c.title}</span>
        <span className="badge badge-neutral hidden md:inline-flex">{CATEGORY_LABEL[c.category]}</span>
        <span className={cn('badge', PRIORITY_CLS[c.priority])}>{c.priority}</span>
        <ChevronDown className={cn('size-4 shrink-0 text-subtle transition', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="space-y-3 border-t border-line p-4 text-sm animate-fade-in">
          <div className="font-mono text-[11px] text-subtle sm:hidden" dir="ltr">
            {c.id}
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-muted">תנאים מקדימים</div>
            <ul className="space-y-0.5 text-fg">
              {c.preconditions.map((p) => (
                <li key={p}>• {p}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-muted">נתוני בדיקה (בדויים)</div>
            <CodeBlock code={c.testData} lang={c.testData.trim().startsWith('{') ? 'json' : 'text'} maxHeight={220} />
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold text-muted">צעדים</div>
            <ol className="list-decimal space-y-0.5 ps-5 text-fg marker:text-subtle">
              {c.steps.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg border border-success/25 bg-success/[0.05] p-3">
            <div className="mb-1 text-xs font-semibold text-success">תוצאה צפויה</div>
            <p className="text-fg">{c.expected}</p>
          </div>
          <div className="flex justify-end">
            <CopyButton text={() => toText([c])} label="העתקת המקרה" variant="secondary" />
          </div>
        </div>
      )}
    </article>
  );
}

export default function TestDesignerPage() {
  const [spec, setSpec] = useState<EndpointSpec>(PRESETS.order.spec);
  const [filter, setFilter] = useState<TestCategory | 'all'>('all');
  const { toast } = useApp();

  const patch = (p: Partial<EndpointSpec>) => setSpec((s) => ({ ...s, ...p }));
  const patchField = (i: number, p: Partial<FieldSpec>) => setSpec((s) => ({ ...s, fields: s.fields.map((f, j) => (j === i ? { ...f, ...p } : f)) }));

  const nameErrors = useMemo(() => {
    const seen = new Set<string>();
    return spec.fields.map((f) => {
      if (!f.name.trim()) return 'שם חובה';
      if (seen.has(f.name)) return 'שם כפול';
      seen.add(f.name);
      if (f.min !== undefined && f.max !== undefined && f.min > f.max) return 'min > max';
      if (f.type === 'enum' && !f.allowed?.length) return 'נדרשים ערכים מותרים';
      return '';
    });
  }, [spec.fields]);
  const specValid = spec.path.trim().startsWith('/') && nameErrors.every((e) => !e);

  const cases = useMemo(() => (specValid ? generateTestCases(spec) : []), [spec, specValid]);
  const counts = useMemo(() => {
    const m = new Map<TestCategory, number>();
    for (const c of cases) m.set(c.category, (m.get(c.category) ?? 0) + 1);
    return m;
  }, [cases]);
  const visible = filter === 'all' ? cases : cases.filter((c) => c.category === filter);

  const exportCsv = () => {
    downloadFile(`drqa-test-cases-${spec.method}-${fileStamp()}.csv`, toCsv(cases), 'text/csv;charset=utf-8');
    toast(`יוצאו ${cases.length} מקרי בדיקה ל-CSV`);
  };

  return (
    <div>
      <PageHeader
        icon={ListChecks}
        eyebrow="API Test Designer"
        title="מתכנן בדיקות API"
        description="הגדירו endpoint ושדות – וקבלו סט מקרי בדיקה מובנה: חיוביים, שדות חסרים, טיפוסים, ערכי גבול, הרשאות, Content-Type וכפילויות. ייצוא ל-CSV או העתקה."
      />
      <Callout tone="info" title="מחולל דטרמיניסטי מבוסס תבניות" className="mb-5">
        המקרים נוצרים מחוקים קבועים (לא AI) – אותו קלט תמיד ייצור אותו פלט. זו נקודת פתיחה: התאימו את התוצאות הצפויות לחוזה ולדרישות האמיתיות שלכם.
      </Callout>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        {/* Spec */}
        <section className="card h-fit">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="section-title">הגדרת ה-endpoint</h2>
            <div className="flex flex-wrap gap-1">
              {Object.entries(PRESETS).map(([k, p]) => (
                <button key={k} type="button" className="btn btn-ghost btn-sm font-mono" dir="ltr" onClick={() => setSpec(p.spec)}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-4 p-4">
            <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
              <Field label="שיטה" htmlFor="td-method">
                <select id="td-method" className="input font-mono" value={spec.method} onChange={(e) => patch({ method: e.target.value as HttpMethod })} dir="ltr">
                  {HTTP_METHODS.filter((m) => m !== 'HEAD' && m !== 'OPTIONS').map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>
              <Field label="נתיב" htmlFor="td-path" error={spec.path.trim().startsWith('/') ? undefined : 'הנתיב חייב להתחיל ב-/'}>
                <input id="td-path" className="input input-mono" value={spec.path} onChange={(e) => patch({ path: e.target.value })} />
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="סטטוס הצלחה צפוי" htmlFor="td-success">
                <select id="td-success" className="input" value={spec.successStatus} onChange={(e) => patch({ successStatus: Number(e.target.value) })}>
                  {[200, 201, 202, 204].map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              <Field label="סטטוס שגיאת ולידציה (לפי החוזה)" htmlFor="td-validation">
                <select id="td-validation" className="input" value={spec.validationStatus} onChange={(e) => patch({ validationStatus: Number(e.target.value) as 400 | 422 })}>
                  <option value={400}>400 Bad Request</option>
                  <option value={422}>422 Unprocessable Content</option>
                </select>
              </Field>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Toggle checked={spec.authRequired} onChange={(v) => patch({ authRequired: v })} label="נדרש אימות" description="מוסיף מקרי 401 / 403" />
              <Toggle checked={spec.duplicateCheck} onChange={(v) => patch({ duplicateCheck: v })} label="דחיית בקשה כפולה" description="מוסיף מקרה 409 / אידמפוטנטיות" />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xs font-semibold text-muted">{hasBody(spec) ? 'שדות בגוף הבקשה' : 'פרמטרי query'}</h3>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => patch({ fields: [...spec.fields, { name: `field${spec.fields.length + 1}`, type: 'string', required: false }] })}>
                  <Plus className="size-3.5" aria-hidden />
                  הוספת שדה
                </button>
              </div>
              <div className="space-y-2">
                {spec.fields.map((f, i) => (
                  <div key={i} className={cn('rounded-xl border p-3', nameErrors[i] ? 'border-danger/40' : 'border-line bg-surface-2/40')}>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-[1.3fr_1fr_auto]">
                      <input className="input input-mono py-2" value={f.name} onChange={(e) => patchField(i, { name: e.target.value })} aria-label={`שם שדה ${i + 1}`} placeholder="fieldName" />
                      <select className="input py-2 font-mono text-xs" dir="ltr" value={f.type} onChange={(e) => patchField(i, { type: e.target.value as FieldType })} aria-label={`טיפוס שדה ${i + 1}`}>
                        {FIELD_TYPES.map((t) => (
                          <option key={t}>{t}</option>
                        ))}
                      </select>
                      <button type="button" className="btn btn-ghost btn-icon col-span-2 justify-self-end hover:text-danger sm:col-span-1" onClick={() => patch({ fields: spec.fields.filter((_, j) => j !== i) })} aria-label={`מחיקת שדה ${f.name}`}>
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                      <label className="flex items-center gap-1.5 text-muted">
                        <input type="checkbox" checked={f.required} onChange={(e) => patchField(i, { required: e.target.checked })} className="size-3.5" />
                        חובה
                      </label>
                      <label className="flex items-center gap-1.5 text-muted">
                        <input type="checkbox" checked={!!f.nullable} onChange={(e) => patchField(i, { nullable: e.target.checked })} className="size-3.5" />
                        nullable
                      </label>
                      <label className="flex items-center gap-1.5 text-muted">
                        <input type="checkbox" checked={!!f.unique} onChange={(e) => patchField(i, { unique: e.target.checked })} className="size-3.5" />
                        ייחודי
                      </label>
                      {['string', 'integer', 'number', 'array'].includes(f.type) && (
                        <span className="flex items-center gap-1.5">
                          <input className="input w-16 px-2 py-1 text-xs" inputMode="decimal" value={f.min ?? ''} onChange={(e) => patchField(i, { min: numOrUndef(e.target.value) })} placeholder="min" aria-label={`מינימום ${f.name}`} dir="ltr" />
                          <input className="input w-16 px-2 py-1 text-xs" inputMode="decimal" value={f.max ?? ''} onChange={(e) => patchField(i, { max: numOrUndef(e.target.value) })} placeholder="max" aria-label={`מקסימום ${f.name}`} dir="ltr" />
                          <span className="text-2xs text-subtle">{f.type === 'string' ? 'אורך' : f.type === 'array' ? 'פריטים' : 'ערך'}</span>
                        </span>
                      )}
                      {f.type === 'enum' && (
                        <input
                          className="input min-w-40 flex-1 px-2 py-1 font-mono text-xs"
                          dir="ltr"
                          value={(f.allowed ?? []).join(', ')}
                          onChange={(e) => patchField(i, { allowed: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                          placeholder="value1, value2"
                          aria-label={`ערכים מותרים ל-${f.name}`}
                        />
                      )}
                    </div>
                    {nameErrors[i] && <p className="mt-1.5 text-2xs text-danger">{nameErrors[i]}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Output */}
        <section className="card flex min-w-0 flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <h2 className="flex items-center gap-2 section-title">
              <Wand2 className="size-4 text-accent" aria-hidden />
              {cases.length} מקרי בדיקה
            </h2>
            <div className="flex flex-wrap gap-1.5">
              <CopyButton text={() => toText(visible)} label="העתקה" variant="secondary" />
              <button type="button" className="btn btn-primary btn-sm" onClick={exportCsv} disabled={!cases.length}>
                <Download className="size-3.5" aria-hidden />
                ייצוא CSV
              </button>
            </div>
          </div>
          {!specValid ? (
            <div className="p-6 text-center text-sm text-danger">תקנו את השגיאות בהגדרה כדי לייצר מקרי בדיקה.</div>
          ) : (
            <>
              <div className="flex flex-wrap gap-1.5 border-b border-line p-3">
                <button type="button" onClick={() => setFilter('all')} className={cn('chip', filter === 'all' && 'chip-active')}>
                  הכל · {cases.length}
                </button>
                {[...counts.entries()].map(([k, n]) => (
                  <button key={k} type="button" onClick={() => setFilter(k)} className={cn('chip', filter === k && 'chip-active')}>
                    {CATEGORY_LABEL[k]} · {n}
                  </button>
                ))}
              </div>
              <div className="max-h-[900px] space-y-2 overflow-y-auto p-3">
                {visible.map((c) => (
                  <CaseCard key={c.id} c={c} />
                ))}
              </div>
              <div className="flex items-center gap-2 border-t border-line px-4 py-2.5 text-2xs text-subtle">
                <FileText className="size-3.5" aria-hidden />
                ה-CSV כולל BOM לתמיכה בעברית ב-Excel ומתאים לייבוא ל-Jira / Azure DevOps Test Plans (עם מיפוי עמודות).
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
