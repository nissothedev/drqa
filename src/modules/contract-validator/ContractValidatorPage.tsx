import { useMemo, useState } from 'react';
import { AlertTriangle, BadgeCheck, CheckCircle2, CircleDashed, FileCheck2, FileWarning, Info, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Callout } from '../../components/ui/Callout';
import { MethodBadge } from '../../components/ui/Badges';
import { CopyButton } from '../../components/ui/CopyButton';
import { FictionalTag } from '../../components/ui/misc';
import { Tabs } from '../../components/ui/Tabs';
import { CONTRACTS } from '../../data/contracts';
import { formatJson, parseJson, type JsonValue } from '../../utils/json';
import { validate, type Schema, type ValidationError } from '../../utils/schemaValidator';
import { cn } from '../../utils/cn';

interface FieldRow {
  path: string;
  depth: number;
  type: string;
  required: boolean;
  constraints: string;
  status: 'ok' | 'missing' | 'error' | 'absent' | 'unchecked';
}

function describeConstraints(s: Schema): string {
  const c: string[] = [];
  if (s.enum) c.push(`enum: ${s.enum.map((e) => JSON.stringify(e)).join(' | ')}`);
  if (s.pattern) c.push(`pattern: ${s.pattern}`);
  if (s.format) c.push(`format: ${s.format}`);
  if (s.minimum !== undefined) c.push(`min: ${s.minimum}`);
  if (s.maximum !== undefined) c.push(`max: ${s.maximum}`);
  if (s.exclusiveMinimum !== undefined) c.push(`> ${s.exclusiveMinimum}`);
  if (s.minLength !== undefined) c.push(`minLength: ${s.minLength}`);
  if (s.maxLength !== undefined) c.push(`maxLength: ${s.maxLength}`);
  if (s.minItems !== undefined) c.push(`minItems: ${s.minItems}`);
  if (s.maxItems !== undefined) c.push(`maxItems: ${s.maxItems}`);
  return c.join(' · ');
}

/** Flattens schema properties into rows and marks each with the validation outcome. */
function fieldRows(schema: Schema, value: JsonValue | undefined, errors: ValidationError[]): FieldRow[] {
  const rows: FieldRow[] = [];
  const walk = (s: Schema, path: string, depth: number, required: boolean, v: JsonValue | undefined, present: boolean) => {
    if (path !== '$') {
      const errs = errors.filter((e) => e.path === path || (e.path.startsWith(path) && /^[.[]/.test(e.path.slice(path.length))));
      const own = errs.filter((e) => e.path === path);
      let status: FieldRow['status'] = 'ok';
      if (own.some((e) => e.keyword === 'required')) status = 'missing';
      else if (!present) status = 'absent';
      else if (own.length > 0) status = 'error';
      else if (errs.length > 0) status = 'unchecked';
      rows.push({ path, depth, type: Array.isArray(s.type) ? s.type.join(' | ') : s.type ?? 'any', required, constraints: describeConstraints(s), status });
    }
    const walkProps = (props: Record<string, Schema>, req: string[], base: string, v2: JsonValue | undefined) => {
      const obj = v2 && typeof v2 === 'object' && !Array.isArray(v2) ? (v2 as Record<string, JsonValue>) : undefined;
      for (const [k, child] of Object.entries(props)) {
        const has = !!obj && Object.prototype.hasOwnProperty.call(obj, k);
        walk(child, `${base}.${k}`, depth + 1, req.includes(k), has ? obj![k] : undefined, has);
      }
    };
    if (s.properties) walkProps(s.properties, s.required ?? [], path, v);
    // For arrays of objects, show the item fields using the first element as the sample.
    if (s.items?.properties) walkProps(s.items.properties, s.items.required ?? [], `${path}[0]`, Array.isArray(v) ? v[0] : undefined);
  };
  walk(schema, '$', 0, true, value, true);
  return rows;
}

const STATUS_META: Record<FieldRow['status'], { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  ok: { label: 'תקין', cls: 'text-success', icon: CheckCircle2 },
  missing: { label: 'חסר (חובה)', cls: 'text-danger', icon: XCircle },
  error: { label: 'שגוי', cls: 'text-danger', icon: XCircle },
  absent: { label: 'לא נשלח (רשות)', cls: 'text-subtle', icon: CircleDashed },
  unchecked: { label: 'שגיאה בתת-שדה', cls: 'text-warning', icon: AlertTriangle },
};

export default function ContractValidatorPage() {
  const [contractId, setContractId] = useState(CONTRACTS[0].id);
  const contract = CONTRACTS.find((c) => c.id === contractId)!;
  const [schemaText, setSchemaText] = useState(formatJson(contract.schema as JsonValue));
  const [payload, setPayload] = useState(formatJson(contract.samples[1].payload as JsonValue));
  const [view, setView] = useState<'errors' | 'fields'>('errors');

  const selectContract = (id: string) => {
    const c = CONTRACTS.find((x) => x.id === id)!;
    setContractId(id);
    setSchemaText(formatJson(c.schema as JsonValue));
    setPayload(formatJson((c.samples.find((s) => !s.expectValid) ?? c.samples[0]).payload as JsonValue));
  };

  const schemaParsed = useMemo(() => parseJson(schemaText), [schemaText]);
  const payloadParsed = useMemo(() => parseJson(payload), [payload]);
  const schemaOk = schemaParsed.ok && typeof schemaParsed.value === 'object' && schemaParsed.value !== null && !Array.isArray(schemaParsed.value);
  const result = useMemo(() => (schemaOk && payloadParsed.ok ? validate(payloadParsed.value, (schemaParsed as { value: Schema }).value) : null), [schemaOk, schemaParsed, payloadParsed]);
  const rows = useMemo(() => (result && schemaOk && payloadParsed.ok ? fieldRows((schemaParsed as { value: Schema }).value, payloadParsed.value, result.errors) : []), [result, schemaOk, schemaParsed, payloadParsed]);
  const schemaEdited = schemaText !== formatJson(contract.schema as JsonValue);

  const errorsText = result ? result.errors.map((e) => `${e.path} [${e.keyword}] ${e.message}`).join('\n') : '';

  return (
    <div>
      <PageHeader
        icon={FileCheck2}
        eyebrow="API Contract Validator"
        title="מאמת חוזי API"
        description="אימות payload מול JSON Schema מקומי: שדות חובה, טיפוסים, ערכים מותרים, טווחים ופורמטים – עם נתיב מדויק לכל שגיאה. האימות מתבצע בדפדפן בלבד."
      />

      <Callout tone="warning" title="עמידה בסכמה ≠ נכונות עסקית" className="mb-5">
        Payload שעובר את הסכמה יכול עדיין להכיל ערכים שגויים עסקית (מחיר לא נכון, לקוח לא קיים, מלאי חסר). אימות סכמה בודק מבנה וטיפוסים – לא היגיון עסקי.
      </Callout>

      {/* Contract picker */}
      <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" role="radiogroup" aria-label="בחירת חוזה">
        {CONTRACTS.map((c) => (
          <button
            key={c.id}
            type="button"
            role="radio"
            aria-checked={c.id === contractId}
            onClick={() => selectContract(c.id)}
            className={cn('card card-interactive flex flex-col gap-2 p-4 text-start', c.id === contractId && 'gradient-border')}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold text-fg">{c.title}</span>
              <span className={cn('badge', c.kind === 'request' ? 'badge-accent' : 'badge-violet')}>{c.kind === 'request' ? 'Request' : 'Response'}</span>
            </div>
            <div className="flex items-center gap-2" dir="ltr">
              <MethodBadge method={c.method} />
              <span className="truncate font-mono text-xs text-muted">{c.endpoint}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* Schema */}
        <section className="card flex min-w-0 flex-col">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <div className="flex items-center gap-2">
              <h2 className="section-title">JSON Schema</h2>
              <FictionalTag />
              {schemaEdited && <span className="badge badge-warning">נערך</span>}
            </div>
            <button type="button" className="btn btn-ghost btn-sm" disabled={!schemaEdited} onClick={() => setSchemaText(formatJson(contract.schema as JsonValue))}>
              <RotateCcw className="size-3.5" aria-hidden />
              שחזור הסכמה
            </button>
          </div>
          <div className="p-4">
            <label htmlFor="schema-text" className="sr-only">
              JSON Schema
            </label>
            <textarea id="schema-text" value={schemaText} onChange={(e) => setSchemaText(e.target.value)} rows={20} spellCheck={false} className="textarea-code" />
            {!schemaParsed.ok && !schemaParsed.empty && <p className="mt-2 text-xs text-danger">הסכמה אינה JSON תקין: {schemaParsed.error.message}</p>}
            {schemaParsed.ok && !schemaOk && <p className="mt-2 text-xs text-danger">הסכמה חייבת להיות אובייקט JSON.</p>}
            {result && result.unsupported.length > 0 && (
              <Callout tone="warning" className="mt-3" title="מילות מפתח שאינן נתמכות – לא נאכפות">
                <span dir="ltr" className="font-mono text-xs">
                  {result.unsupported.join(', ')}
                </span>
              </Callout>
            )}
            <details className="mt-3 rounded-xl border border-line p-3 text-xs text-muted">
              <summary className="cursor-pointer font-medium text-fg">
                <Info className="me-1 inline size-3.5 text-accent" aria-hidden />
                תת-קבוצת JSON Schema הנתמכת
              </summary>
              <p className="mt-2 leading-5">
                נתמך: <span className="font-mono" dir="ltr">type (כולל integer ומערך טיפוסים), enum, const, properties, required, additionalProperties, items, minItems, maxItems, uniqueItems, minLength, maxLength, pattern, format (email, date, date-time, uri, uuid), minimum, maximum, exclusiveMinimum, exclusiveMaximum, multipleOf</span>.
              </p>
              <p className="mt-1 leading-5">
                לא נתמך (ומדווח כאזהרה): <span className="font-mono" dir="ltr">$ref, oneOf, anyOf, allOf, not, if/then/else, patternProperties, dependentRequired</span>.
              </p>
            </details>
          </div>
        </section>

        {/* Payload + result */}
        <section className="flex min-w-0 flex-col gap-5">
          <div className="card">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
              <h2 className="section-title">Payload לבדיקה</h2>
              <div className="flex flex-wrap gap-1">
                {contract.samples.map((s) => (
                  <button key={s.id} type="button" className="btn btn-ghost btn-sm" onClick={() => setPayload(formatJson(s.payload as JsonValue))}>
                    {s.expectValid ? <BadgeCheck className="size-3.5 text-success" aria-hidden /> : <FileWarning className="size-3.5 text-warning" aria-hidden />}
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4">
              <label htmlFor="payload-text" className="sr-only">
                Payload
              </label>
              <textarea id="payload-text" value={payload} onChange={(e) => setPayload(e.target.value)} rows={10} spellCheck={false} className="textarea-code" />
              {payloadParsed.ok && (
                <button type="button" className="btn btn-ghost btn-sm mt-2" onClick={() => setPayload(formatJson(payloadParsed.value))}>
                  <Sparkles className="size-3.5" aria-hidden />
                  עיצוב
                </button>
              )}
            </div>
          </div>

          <div className="card overflow-hidden" aria-live="polite">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3">
              {!payloadParsed.ok ? (
                <span className="badge badge-danger">{payloadParsed.empty ? 'Payload ריק' : `JSON לא תקין${payloadParsed.error.line ? ` · שורה ${payloadParsed.error.line}` : ''}`}</span>
              ) : !result ? (
                <span className="badge badge-neutral">ממתין לסכמה תקינה</span>
              ) : result.valid ? (
                <span className="inline-flex items-center gap-2 font-semibold text-success">
                  <CheckCircle2 className="size-5" aria-hidden />
                  ה-Payload עומד בסכמה
                </span>
              ) : (
                <span className="inline-flex items-center gap-2 font-semibold text-danger">
                  <XCircle className="size-5" aria-hidden />
                  {result.errors.length} הפרות חוזה
                </span>
              )}
              {result && (
                <div className="flex items-center gap-2">
                  <Tabs
                    size="sm"
                    ariaLabel="תצוגת תוצאות"
                    value={view}
                    onChange={setView}
                    tabs={[
                      { id: 'errors', label: 'שגיאות', count: result.errors.length },
                      { id: 'fields', label: 'מפת שדות' },
                    ]}
                  />
                  {result.errors.length > 0 && <CopyButton text={errorsText} label="העתקה" />}
                </div>
              )}
            </div>
            <div className="max-h-[520px] overflow-auto p-4">
              {!payloadParsed.ok && !payloadParsed.empty && <p className="text-sm text-danger">{payloadParsed.error.message}</p>}
              {result && view === 'errors' && (result.valid ? (
                <p className="text-sm text-muted">לא נמצאו הפרות של הסכמה. זכרו: זה לא מוכיח שהערכים נכונים עסקית.</p>
              ) : (
                <ul className="space-y-2.5">
                  {result.errors.map((e, i) => (
                    <li key={`${e.path}-${e.keyword}-${i}`} className="rounded-xl border border-danger/20 bg-danger/[0.04] p-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <code className="code-inline">{e.path}</code>
                        <span className="badge badge-danger" dir="ltr">
                          {e.keyword}
                        </span>
                        <span className="font-mono text-[10px] text-subtle" dir="ltr">
                          {e.pointer || '/'}
                        </span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium text-fg">{e.message}</p>
                      <p className="mt-0.5 text-xs leading-5 text-muted">{e.hint}</p>
                      {(e.expected || e.actual) && (
                        <div className="mt-2 grid gap-1 font-mono text-[11px] sm:grid-cols-2" dir="ltr">
                          {e.expected && <span className="rounded bg-success/10 px-2 py-1 text-success">expected: {e.expected}</span>}
                          {e.actual && <span className="rounded bg-danger/10 px-2 py-1 text-danger">actual: {e.actual}</span>}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ))}
              {result && view === 'fields' && (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[520px] text-xs">
                    <thead>
                      <tr className="border-b border-line text-subtle">
                        <th className="py-2 text-start font-medium">שדה</th>
                        <th className="py-2 text-start font-medium">טיפוס</th>
                        <th className="py-2 text-start font-medium">חובה</th>
                        <th className="py-2 text-start font-medium">מגבלות</th>
                        <th className="py-2 text-start font-medium">סטטוס</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((r) => {
                        const M = STATUS_META[r.status];
                        return (
                          <tr key={r.path} className="border-b border-line/50 last:border-0">
                            <td className="py-2 font-mono text-fg" dir="ltr" style={{ paddingLeft: `${(r.depth - 1) * 14}px`, textAlign: 'left' }}>
                              {r.path.split(/\.(?=[^.]*$)/).pop()}
                            </td>
                            <td className="py-2 font-mono text-accent" dir="ltr">
                              {r.type}
                            </td>
                            <td className="py-2">{r.required ? <span className="badge badge-warning">חובה</span> : <span className="text-subtle">רשות</span>}</td>
                            <td className="max-w-[200px] truncate py-2 font-mono text-[10px] text-subtle" dir="ltr" title={r.constraints}>
                              {r.constraints}
                            </td>
                            <td className={cn('py-2', M.cls)}>
                              <span className="inline-flex items-center gap-1">
                                <M.icon className="size-3.5" aria-hidden />
                                {M.label}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
