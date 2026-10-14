import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  FlaskConical,
  HardDrive,
  KeyRound,
  ListTree,
  Loader2,
  RotateCcw,
  Send,
  ShieldAlert,
  Sparkles,
  Unplug,
  Wand2,
  Compass,
  ScanEye,
} from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Callout } from '../../components/ui/Callout';
import { Tabs } from '../../components/ui/Tabs';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { KeyValueEditor } from '../../components/ui/KeyValueEditor';
import { MethodBadge, StatusBadge } from '../../components/ui/Badges';
import { EmptyState, FictionalTag } from '../../components/ui/misc';
import { HTTP_METHODS, type HttpMethod } from '../../data/http';
import { formatJson, parseJson } from '../../utils/json';
import { cn } from '../../utils/cn';
import { AUTH_MODES, buildUrl, effectiveHeaders, simulate, toCurl, toRawHttp, MOCK_BASE, type AuthMode, type KeyValue, type MockRequest, type MockResponse } from './mockApi';
import { PRESETS, PRESET_GROUP_LABEL, type LabPreset } from './presets';

const HEADER_SUGGESTIONS = ['Content-Type', 'Accept', 'Idempotency-Key', 'X-Request-Id', 'X-Demo-Simulate'];

const DEFAULT_REQ: MockRequest = { method: 'GET', url: `${MOCK_BASE}/products`, params: [{ key: 'limit', value: '3', enabled: true }], headers: [{ key: 'Accept', value: 'application/json', enabled: true }], body: '', auth: 'none' };

function fromPreset(p: LabPreset): MockRequest {
  return { method: p.method, url: p.url, params: p.params ? p.params.map((x) => ({ ...x })) : [], headers: p.headers ? p.headers.map((x) => ({ ...x })) : [], body: p.body ?? '', auth: p.auth };
}

const METHOD_COLOR: Record<string, string> = {
  GET: 'text-emerald-400',
  POST: 'text-sky-400',
  PUT: 'text-amber-400',
  PATCH: 'text-violet-400',
  DELETE: 'text-rose-400',
  HEAD: 'text-slate-400',
  OPTIONS: 'text-pink-400',
};

type ReqTab = 'params' | 'headers' | 'body' | 'auth';
type ResTab = 'body' | 'headers' | 'explain';

export default function RequestLabPage() {
  const [searchParams] = useSearchParams();
  const initialPreset = PRESETS.find((p) => p.id === searchParams.get('preset'));
  const [req, setReq] = useState<MockRequest>(() => (initialPreset ? fromPreset(initialPreset) : DEFAULT_REQ));
  const [activePreset, setActivePreset] = useState<string | null>(initialPreset?.id ?? null);
  const [reqTab, setReqTab] = useState<ReqTab>(initialPreset?.body ? 'body' : 'params');
  const [resTab, setResTab] = useState<ResTab>('explain');
  const [previewTab, setPreviewTab] = useState<'raw' | 'curl'>('raw');
  const [res, setRes] = useState<MockResponse | null>(null);
  const [sentReq, setSentReq] = useState<MockRequest | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (initialPreset) {
      setReq(fromPreset(initialPreset));
      setActivePreset(initialPreset.id);
    }
  }, [initialPreset]);

  const patch = (p: Partial<MockRequest>) => {
    setReq((r) => ({ ...r, ...p }));
    setActivePreset(null);
  };

  const loadPreset = (p: LabPreset) => {
    setReq(fromPreset(p));
    setActivePreset(p.id);
    setReqTab(p.body ? 'body' : p.params?.length ? 'params' : p.headers?.length ? 'headers' : 'auth');
    setRes(null);
  };

  const send = () => {
    setLoading(true);
    const snapshot = { ...req, params: req.params.map((x) => ({ ...x })), headers: req.headers.map((x) => ({ ...x })) };
    // Short UI delay for feedback only; the response time shown is simulated separately.
    window.setTimeout(() => {
      setRes(simulate(snapshot));
      setSentReq(snapshot);
      setResTab('explain');
      setLoading(false);
    }, 280);
  };

  const bodyAllowed = !['GET', 'HEAD'].includes(req.method);
  const bodyCheck = useMemo(() => (req.body.trim() ? parseJson(req.body) : null), [req.body]);
  const raw = useMemo(() => toRawHttp(req), [req]);
  const curl = useMemo(() => toCurl(req), [req]);
  const headerCount = Object.keys(effectiveHeaders(req)).length;

  const responseIsJson = res?.headers['Content-Type']?.includes('json');
  const prettyBody = useMemo(() => {
    if (!res?.body) return '';
    if (!responseIsJson) return res.body;
    const p = parseJson(res.body);
    return p.ok ? formatJson(p.value) : res.body;
  }, [res, responseIsJson]);

  const grouped = useMemo(() => {
    const g = new Map<LabPreset['group'], LabPreset[]>();
    for (const p of PRESETS) g.set(p.group, [...(g.get(p.group) ?? []), p]);
    return [...g.entries()];
  }, []);

  return (
    <div>
      <PageHeader
        icon={FlaskConical}
        eyebrow="API Request Lab"
        title="מעבדת בקשות API"
        description="בנו בקשה מול ה-API הבדוי של Demo Shop וקבלו תגובה מוסברת. הכל מחושב מקומית לפי חוקים קבועים – אף בקשה לא יוצאת לרשת."
        actions={
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setReq(DEFAULT_REQ);
              setActivePreset(null);
              setRes(null);
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
            איפוס
          </button>
        }
      />

      <Callout tone="privacy" title="סימולציה מקומית בלבד" className="mb-5">
        המעבדה לא מבצעת בקשות HTTP אמיתיות – גם לא ל-api.example.com. זמני התגובה מחושבים ומסומנים כ"מדומים". אל תזינו טוקנים או נתונים אמיתיים; השתמשו במצבי האימות הבדויים.
      </Callout>

      <div className="grid gap-5 xl:grid-cols-[260px_minmax(0,1fr)]">
        {/* Presets */}
        <aside className="card h-fit overflow-hidden xl:sticky xl:top-24">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <h2 className="section-title">תרחישים מוכנים</h2>
            <FictionalTag />
          </div>
          <div className="max-h-[70vh] space-y-4 overflow-y-auto p-3">
            {grouped.map(([group, list]) => (
              <div key={group}>
                <div className="mb-1.5 px-1 text-2xs font-semibold text-subtle">{PRESET_GROUP_LABEL[group]}</div>
                <div className="space-y-1">
                  {list.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => loadPreset(p)}
                      className={cn('flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-start text-xs transition', activePreset === p.id ? 'border-accent/50 bg-accent/10' : 'border-transparent hover:border-line hover:bg-surface-2')}
                    >
                      <MethodBadge method={p.method} className="w-14 justify-center" />
                      <span className="min-w-0 flex-1 truncate text-fg">{p.label}</span>
                      {p.expect ? <StatusBadge code={p.expect} showReason={false} size="sm" /> : <span className="badge badge-neutral">NET</span>}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="min-w-0 space-y-5">
          {/* Request builder */}
          <section className="card overflow-hidden">
            <form
              className="flex flex-col gap-2 border-b border-line p-3 sm:flex-row"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              dir="ltr"
            >
              <label className="sr-only" htmlFor="lab-method">
                HTTP method
              </label>
              <select
                id="lab-method"
                value={req.method}
                onChange={(e) => patch({ method: e.target.value as HttpMethod })}
                className={cn('input w-full font-mono font-bold sm:w-32', METHOD_COLOR[req.method])}
              >
                {HTTP_METHODS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
              <label className="sr-only" htmlFor="lab-url">
                URL
              </label>
              <input id="lab-url" value={req.url} onChange={(e) => patch({ url: e.target.value })} className="input input-mono flex-1" spellCheck={false} placeholder={`${MOCK_BASE}/products`} />
              <button type="submit" className="btn btn-primary sm:w-32" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                <span dir="rtl">{loading ? 'שולח…' : 'שליחה'}</span>
              </button>
            </form>

            <div className="p-4">
              <Tabs
                ariaLabel="חלקי הבקשה"
                variant="underline"
                value={reqTab}
                onChange={setReqTab}
                tabs={[
                  { id: 'params', label: 'Params', icon: ListTree, count: req.params.filter((p) => p.enabled && p.key).length },
                  { id: 'headers', label: 'Headers', icon: HardDrive, count: headerCount },
                  { id: 'body', label: 'Body', icon: Wand2 },
                  { id: 'auth', label: 'Auth', icon: KeyRound },
                ]}
              />
              <div className="pt-4">
                {reqTab === 'params' && <KeyValueEditor label="פרמטר" rows={req.params} onChange={(params) => patch({ params })} keyPlaceholder="limit" valuePlaceholder="20" />}
                {reqTab === 'headers' && (
                  <div className="space-y-3">
                    <KeyValueEditor label="כותרת" rows={req.headers} onChange={(headers: KeyValue[]) => patch({ headers })} keyPlaceholder="Content-Type" valuePlaceholder="application/json" suggestions={HEADER_SUGGESTIONS} />
                    <p className="text-xs leading-5 text-subtle">
                      טיפ: הכותרת <span className="code-inline">X-Demo-Simulate</span> עם הערכים 429 / 500 / 502 / 503 / 504 / timeout מדמה תקלות תשתית. כותרת Authorization מתווספת אוטומטית לפי לשונית Auth.
                    </p>
                  </div>
                )}
                {reqTab === 'body' && (
                  <div className="space-y-2">
                    {!bodyAllowed && <Callout tone="info">בשיטה {req.method} לא נשלח גוף בקשה. בחרו POST / PUT / PATCH כדי לשלוח גוף.</Callout>}
                    <textarea
                      value={req.body}
                      onChange={(e) => patch({ body: e.target.value })}
                      rows={11}
                      className="textarea-code"
                      spellCheck={false}
                      placeholder='{ "customerId": "CUS-1001" }'
                      aria-label="גוף הבקשה (JSON)"
                      disabled={!bodyAllowed}
                    />
                    <div className="flex flex-wrap items-center gap-2">
                      {bodyCheck && (bodyCheck.ok ? <span className="badge badge-success">JSON תקין</span> : <span className="badge badge-danger">JSON לא תקין{bodyCheck.error.line ? ` · שורה ${bodyCheck.error.line}` : ''}</span>)}
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={!bodyCheck?.ok}
                        onClick={() => {
                          if (bodyCheck?.ok) patch({ body: formatJson(bodyCheck.value) });
                        }}
                      >
                        <Sparkles className="size-3.5" aria-hidden />
                        עיצוב JSON
                      </button>
                      <span className="text-2xs text-subtle">הגוף נשאר בזיכרון הדף בלבד.</span>
                    </div>
                  </div>
                )}
                {reqTab === 'auth' && (
                  <div className="space-y-3">
                    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" role="radiogroup" aria-label="מצב אימות בדוי">
                      {(Object.keys(AUTH_MODES) as AuthMode[]).map((m) => (
                        <button
                          key={m}
                          type="button"
                          role="radio"
                          aria-checked={req.auth === m}
                          onClick={() => patch({ auth: m })}
                          className={cn('rounded-xl border p-3 text-start transition', req.auth === m ? 'border-accent/60 bg-accent/[0.07]' : 'border-line bg-surface-2/40 hover:border-line-strong')}
                        >
                          <div className="text-sm font-medium text-fg">{AUTH_MODES[m].label}</div>
                          <div className="mt-1 truncate font-mono text-[11px] text-subtle" dir="ltr">
                            {AUTH_MODES[m].header ? `Authorization: ${AUTH_MODES[m].header}` : '—'}
                          </div>
                        </button>
                      ))}
                    </div>
                    <Callout tone="warning">כל הטוקנים כאן בדויים לחלוטין. לעולם אל תדביקו טוקן אמיתי בכלי חיצוני, בצילום מסך או בדיווח באג.</Callout>
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-line bg-surface-2/30 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-semibold text-muted">הבקשה כפי שתישלח</h3>
                <Tabs
                  size="sm"
                  ariaLabel="פורמט תצוגת בקשה"
                  value={previewTab}
                  onChange={setPreviewTab}
                  tabs={[
                    { id: 'raw', label: 'Raw HTTP' },
                    { id: 'curl', label: 'cURL' },
                  ]}
                />
              </div>
              <CodeBlock code={previewTab === 'raw' ? raw : curl} lang={previewTab === 'raw' ? 'http' : 'curl'} maxHeight={240} />
            </div>
          </section>

          {/* Response */}
          <section className="card overflow-hidden" aria-live="polite" aria-busy={loading}>
            {!res ? (
              <div className="p-5">
                <EmptyState icon={Send} title="עדיין לא נשלחה בקשה" description="בחרו תרחיש מוכן או בנו בקשה משלכם ולחצו על שליחה. התגובה תופיע כאן עם הסבר." />
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-center gap-3 border-b border-line p-4">
                  {res.networkError ? (
                    <span className="inline-flex items-center gap-2 rounded-lg border border-danger/35 bg-danger/10 px-3 py-1 text-sm font-semibold text-danger">
                      <Unplug className="size-4" aria-hidden />
                      אין תגובת HTTP
                    </span>
                  ) : (
                    <StatusBadge code={res.status} size="lg" />
                  )}
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted" title="זמן מדומה – לא נמדד">
                    <Clock className="size-3.5" aria-hidden />
                    <span dir="ltr">{res.timeMs.toLocaleString('en-US')} ms</span>
                    <span className="badge badge-neutral">מדומה</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted">
                    <HardDrive className="size-3.5" aria-hidden />
                    <span dir="ltr">{res.sizeBytes} B</span>
                  </span>
                  {sentReq && (
                    <span className="ms-auto hidden min-w-0 items-center gap-2 md:flex" dir="ltr">
                      <MethodBadge method={sentReq.method} />
                      <span className="truncate font-mono text-xs text-subtle">{buildUrl(sentReq.url, sentReq.params).replace('https://', '')}</span>
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <Tabs
                    ariaLabel="חלקי התגובה"
                    variant="underline"
                    value={resTab}
                    onChange={setResTab}
                    tabs={[
                      { id: 'explain', label: 'הסבר', icon: ScanEye },
                      { id: 'body', label: 'Body' },
                      { id: 'headers', label: 'Headers', count: Object.keys(res.headers).length },
                    ]}
                  />
                  <div className="pt-4">
                    {resTab === 'body' &&
                      (res.networkError ? (
                        <CodeBlock code={res.networkError} lang="text" title="network error (simulated)" />
                      ) : prettyBody ? (
                        <CodeBlock code={prettyBody} lang={responseIsJson ? 'json' : 'text'} title={`response body · ${res.headers['Content-Type'] ?? ''}`} maxHeight={420} lineNumbers />
                      ) : (
                        <p className="rounded-lg border border-dashed border-line p-4 text-center text-sm text-muted">התגובה ללא גוף{res.status === 204 ? ' – 204 No Content הוא תקין.' : '.'}</p>
                      ))}
                    {resTab === 'headers' &&
                      (Object.keys(res.headers).length ? (
                        <div className="overflow-hidden rounded-xl border border-line" dir="ltr">
                          <table className="w-full text-left text-xs">
                            <tbody>
                              {Object.entries(res.headers).map(([k, v]) => (
                                <tr key={k} className="border-b border-line last:border-0">
                                  <th scope="row" className="w-1/3 bg-surface-2/60 px-3 py-2 font-mono font-medium text-accent">
                                    {k}
                                  </th>
                                  <td className="break-all px-3 py-2 font-mono text-fg">{v}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <p className="text-sm text-muted">אין כותרות – לא התקבלה תגובת HTTP.</p>
                      ))}
                    {resTab === 'explain' && (
                      <div className="space-y-4 animate-fade-in">
                        <p className="text-base font-medium leading-7 text-fg">{res.explanation.summary}</p>
                        {res.explanation.details.length > 0 && (
                          <ul className="space-y-1.5">
                            {res.explanation.details.map((d) => (
                              <li key={d} className="flex gap-2 text-sm leading-6 text-muted">
                                <span className="mt-2.5 size-1.5 shrink-0 rounded-full bg-accent" aria-hidden />
                                {d}
                              </li>
                            ))}
                          </ul>
                        )}
                        <div className="grid gap-3 md:grid-cols-2">
                          {res.explanation.nextChecks.length > 0 && (
                            <div className="rounded-xl border border-line bg-surface-2/50 p-3">
                              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-violet">
                                <Compass className="size-3.5" aria-hidden />
                                מה לבדוק עכשיו
                              </div>
                              <ul className="space-y-1 text-sm leading-6 text-fg">
                                {res.explanation.nextChecks.map((n) => (
                                  <li key={n}>• {n}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {res.explanation.notProof && (
                            <div className="rounded-xl border border-warning/25 bg-warning/[0.05] p-3">
                              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-warning">
                                <ShieldAlert className="size-3.5" aria-hidden />
                                מה זה לא מוכיח
                              </div>
                              <p className="text-sm leading-6 text-fg">{res.explanation.notProof}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line pt-3">
                          <span className="font-mono text-2xs text-subtle" dir="ltr">
                            mock rule: {res.rule}
                          </span>
                          {res.status >= 400 && (
                            <Link to={`/api-doctor?entry=http-${res.status}`} className="btn btn-secondary btn-sm">
                              אבחון {res.status} ב-API Doctor
                              <ArrowLeft className="size-3.5" aria-hidden />
                            </Link>
                          )}
                          {res.rule === 'network.dns' && (
                            <Link to="/api-doctor?entry=dns-failure" className="btn btn-secondary btn-sm">
                              תרחיש DNS ב-API Doctor
                              <ArrowLeft className="size-3.5" aria-hidden />
                            </Link>
                          )}
                          {res.rule === 'simulate.timeout' && (
                            <Link to="/api-doctor?entry=timeout" className="btn btn-secondary btn-sm">
                              תרחיש Timeout ב-API Doctor
                              <ArrowLeft className="size-3.5" aria-hidden />
                            </Link>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
