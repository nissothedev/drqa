import { useMemo } from 'react';
import { Ban, Circle, Copy, Lock, RotateCw, ShoppingCart, Trash2, TriangleAlert } from 'lucide-react';
import { copyText } from '../../utils/clipboard';
import { useApp } from '../../context/AppContext';
import { cn } from '../../utils/cn';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { curlFor, NET_REQUESTS, type DetailTab, type Filter, type MockNetRequest, type SimState, type SimTab } from './data';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'fetch', label: 'Fetch/XHR' },
  { id: 'document', label: 'Doc' },
  { id: 'script', label: 'JS' },
  { id: 'stylesheet', label: 'CSS' },
  { id: 'img', label: 'Img' },
];

function statusColor(s: number) {
  if (s >= 500) return 'text-red-400';
  if (s >= 400) return 'text-red-400';
  return 'text-slate-300';
}

export function visibleRequests(s: SimState): MockNetRequest[] {
  if (!s.placed) return [];
  const base = s.lostLog ? NET_REQUESTS.filter((r) => r.phase === 'error-page') : NET_REQUESTS;
  return s.filter === 'all' ? base : base.filter((r) => r.type === s.filter);
}

export function DevToolsSimulator({ state, set }: { state: SimState; set: (p: Partial<SimState>) => void }) {
  const { toast } = useApp();
  const list = useMemo(() => visibleRequests(state), [state]);
  const selected = list.find((r) => r.id === state.selected) ?? null;
  const consoleLines = useMemo(() => {
    if (!state.placed) return [];
    const reqs = state.lostLog ? NET_REQUESTS.filter((r) => r.phase === 'error-page') : NET_REQUESTS;
    const lines: Array<{ level: 'error' | 'warn'; text: string }> = reqs.filter((r) => r.console).map((r) => ({ level: 'error', text: r.console! }));
    if (!state.lostLog) lines.push({ level: 'error', text: 'Uncaught (in promise) OrderError: Order request failed with status 422  app.3f9c.js:2881' });
    lines.push({ level: 'warn', text: '[Demo Shop] Navigated to /checkout/error' });
    return lines;
  }, [state.placed, state.lostLog]);

  const placeOrder = () => {
    set({ placed: true, lostLog: !state.preserveLog, selected: null });
  };

  const copyCurl = async () => {
    if (!selected) return;
    const ok = await copyText(curlFor(selected));
    if (ok) {
      set({ curlCopied: selected.id === 'orders' || state.curlCopied });
      toast('פקודת cURL (בדויה) הועתקה ללוח');
    }
  };

  const page = state.placed ? 'error' : 'checkout';

  return (
    <div className="overflow-hidden rounded-2xl border border-line-strong bg-surface shadow-2xl">
      {/* Browser chrome */}
      <div className="flex items-center gap-3 border-b border-line bg-surface-2 px-3 py-2" dir="ltr">
        <span className="flex gap-1.5" aria-hidden>
          <span className="size-3 rounded-full bg-red-400/80" />
          <span className="size-3 rounded-full bg-amber-300/80" />
          <span className="size-3 rounded-full bg-emerald-400/80" />
        </span>
        <div className="flex min-w-0 flex-1 items-center gap-2 rounded-lg bg-bg-elevated px-3 py-1 text-xs text-muted">
          <Lock className="size-3 shrink-0 text-success" aria-hidden />
          <span className="truncate font-mono">https://shop.example.com/{page === 'checkout' ? 'checkout' : 'checkout/error'}</span>
        </div>
        <button type="button" className="btn btn-ghost btn-icon" aria-label="איפוס הסימולציה" title="איפוס" onClick={() => set({ placed: false, lostLog: false, selected: null })}>
          <RotateCw className="size-3.5" />
        </button>
      </div>

      {/* Fake page */}
      <div className="grid min-h-[150px] place-items-center bg-gradient-to-b from-surface to-surface-2 p-5">
        {page === 'checkout' ? (
          <div className="w-full max-w-sm rounded-xl border border-line bg-surface p-4 text-center shadow-lg">
            <div className="mb-1 flex items-center justify-center gap-2 text-sm font-bold text-fg">
              <ShoppingCart className="size-4 text-accent" aria-hidden />
              Demo Shop · קופה
            </div>
            <p className="mb-3 text-xs text-muted">Pulse Water Bottle × 1 · ‏39 ₪ (בדוי)</p>
            <button type="button" className="btn btn-primary btn-sm w-full" onClick={placeOrder}>
              ביצוע הזמנה
            </button>
          </div>
        ) : (
          <div className="w-full max-w-sm rounded-xl border border-danger/30 bg-danger/5 p-4 text-center">
            <TriangleAlert className="mx-auto mb-1 size-5 text-danger" aria-hidden />
            <div className="text-sm font-bold text-fg">אופס! ההזמנה נכשלה</div>
            <p className="text-xs text-muted">אירעה שגיאה. נסו שוב מאוחר יותר.</p>
            <p className="mt-2 text-2xs text-subtle">(הודעה כללית ב-UI – הראיה האמיתית נמצאת ב-Network)</p>
          </div>
        )}
      </div>

      {/* DevTools panel – Chrome-like, always LTR & dark */}
      <div className="border-t-2 border-slate-700 bg-[#1e1f24] text-[12px] text-slate-300" dir="ltr">
        <div className="flex items-center gap-0.5 border-b border-slate-700 bg-[#26272d] px-2" role="tablist" aria-label="DevTools panels">
          {(['elements', 'console', 'network'] as SimTab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={state.tab === t}
              onClick={() => set({ tab: t })}
              className={cn('relative px-3 py-2 capitalize transition', state.tab === t ? 'text-white' : 'text-slate-400 hover:text-slate-200')}
            >
              {t === 'console' && consoleLines.length > 0 && <span className="me-1 inline-block rounded bg-red-500/80 px-1 text-[10px] text-white">{consoleLines.filter((l) => l.level === 'error').length}</span>}
              {t}
              {state.tab === t && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-sky-400" />}
            </button>
          ))}
        </div>

        {state.tab === 'elements' && (
          <pre className="h-[300px] overflow-auto p-3 font-mono text-[11.5px] leading-5 text-slate-400">{`<html lang="he" dir="rtl">
  <body>
    <main id="checkout">
      <button class="place-order">ביצוע הזמנה</button>
    </main>
  </body>
</html>

(Elements אינו נדרש לשיעור זה – עברו ל-Network)`}</pre>
        )}

        {state.tab === 'console' && (
          <div className="h-[300px] overflow-auto font-mono text-[11.5px]">
            {consoleLines.length === 0 ? (
              <p className="p-3 text-slate-500">Console is empty. Place an order to generate activity.</p>
            ) : (
              consoleLines.map((l, i) => (
                <div key={i} className={cn('flex gap-2 border-b px-3 py-1.5', l.level === 'error' ? 'border-red-900/40 bg-red-950/40 text-red-300' : 'border-amber-900/30 bg-amber-950/30 text-amber-200')}>
                  <Ban className="mt-0.5 size-3 shrink-0" aria-hidden />
                  {l.text}
                </div>
              ))
            )}
          </div>
        )}

        {state.tab === 'network' && (
          <div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-slate-700 px-2 py-1.5">
              <Circle className="size-3 fill-red-500 text-red-500" aria-label="Recording" />
              <button type="button" onClick={() => set({ placed: false, lostLog: false, selected: null })} className="text-slate-400 hover:text-white" aria-label="Clear network log" title="Clear">
                <Trash2 className="size-3.5" />
              </button>
              <label className={cn('flex cursor-pointer items-center gap-1.5 rounded px-1.5 py-0.5', !state.preserveLog && 'ring-1 ring-amber-400/60')}>
                <input type="checkbox" checked={state.preserveLog} onChange={(e) => set({ preserveLog: e.target.checked })} className="size-3" />
                Preserve log
              </label>
              <span className="h-4 w-px bg-slate-700" aria-hidden />
              <div className="flex flex-wrap gap-0.5" role="radiogroup" aria-label="Request type filter">
                {FILTERS.map((f) => (
                  <button key={f.id} type="button" role="radio" aria-checked={state.filter === f.id} onClick={() => set({ filter: f.id })} className={cn('rounded px-2 py-0.5', state.filter === f.id ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-slate-700/60')}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid h-[300px] grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)]">
              <div className="overflow-auto border-slate-700 md:border-r">
                {list.length === 0 ? (
                  <div className="p-4 text-slate-500">
                    {state.placed ? 'No requests match this filter.' : 'Recording network activity… Perform a request (click "ביצוע הזמנה") to see it here.'}
                  </div>
                ) : (
                  <table className="w-full">
                    <thead className="sticky top-0 bg-[#26272d] text-left text-slate-400">
                      <tr>
                        <th className="px-2 py-1 font-normal">Name</th>
                        <th className="px-2 py-1 font-normal">Status</th>
                        <th className="hidden px-2 py-1 font-normal sm:table-cell">Type</th>
                        <th className="px-2 py-1 font-normal">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map((r) => (
                        <tr
                          key={r.id}
                          onClick={() => set({ selected: r.id, detailTab: state.detailTab })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              set({ selected: r.id });
                            }
                          }}
                          tabIndex={0}
                          aria-selected={state.selected === r.id}
                          className={cn('cursor-pointer border-b border-slate-800', state.selected === r.id ? 'bg-sky-900/50' : 'hover:bg-slate-700/40', r.status >= 400 && 'text-red-400')}
                        >
                          <td className="max-w-[140px] truncate px-2 py-1">{r.name}</td>
                          <td className={cn('px-2 py-1', statusColor(r.status))}>{r.status}</td>
                          <td className="hidden px-2 py-1 text-slate-400 sm:table-cell">{r.type === 'fetch' ? 'fetch' : r.type}</td>
                          <td className="px-2 py-1 text-slate-400">{r.timeMs} ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
                {state.lostLog && (
                  <div className="m-2 rounded border border-amber-500/40 bg-amber-500/10 p-2 text-amber-200">
                    The page navigated to /checkout/error and the log was cleared. Enable <b>Preserve log</b>, reset (⟳) and try again.
                  </div>
                )}
              </div>

              <div className="flex min-h-0 flex-col overflow-hidden border-t border-slate-700 md:border-t-0">
                {!selected ? (
                  <div className="p-4 text-slate-500">Select a request to inspect its details.</div>
                ) : (
                  <>
                    <div className="flex items-center gap-0.5 border-b border-slate-700 px-1">
                      {(['headers', 'payload', 'response', 'timing'] as DetailTab[]).map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => set({ detailTab: t })}
                          disabled={t === 'payload' && !selected.payload}
                          className={cn('relative px-2.5 py-1.5 capitalize disabled:opacity-40', state.detailTab === t ? 'text-white' : 'text-slate-400 hover:text-slate-200')}
                        >
                          {t}
                          {state.detailTab === t && <span className="absolute inset-x-1 bottom-0 h-0.5 bg-sky-400" />}
                        </button>
                      ))}
                      <button type="button" onClick={copyCurl} className="ms-auto flex items-center gap-1 rounded px-2 py-1 text-sky-300 hover:bg-slate-700" title="Right-click → Copy → Copy as cURL (bash)">
                        <Copy className="size-3" aria-hidden />
                        Copy as cURL
                      </button>
                    </div>
                    <div className="min-h-0 flex-1 overflow-auto p-3 font-mono text-[11.5px] leading-5">
                      {state.detailTab === 'headers' && (
                        <div className="space-y-3">
                          <div>
                            <div className="mb-1 font-sans font-semibold text-slate-200">▾ General</div>
                            <div><span className="text-slate-400">Request URL: </span>{selected.url}</div>
                            <div><span className="text-slate-400">Request Method: </span>{selected.method}</div>
                            <div><span className="text-slate-400">Status Code: </span><span className={statusColor(selected.status)}>● {selected.status}</span></div>
                          </div>
                          {selected.query && (
                            <div>
                              <div className="mb-1 font-sans font-semibold text-slate-200">▾ Query String Parameters</div>
                              {Object.entries(selected.query).map(([k, v]) => (
                                <div key={k}><span className="text-sky-300">{k}: </span>{v}</div>
                              ))}
                            </div>
                          )}
                          <div>
                            <div className="mb-1 font-sans font-semibold text-slate-200">▾ Response Headers</div>
                            {Object.entries(selected.responseHeaders).map(([k, v]) => (
                              <div key={k}><span className="text-sky-300">{k.toLowerCase()}: </span>{v}</div>
                            ))}
                          </div>
                          <div>
                            <div className="mb-1 font-sans font-semibold text-slate-200">▾ Request Headers</div>
                            {Object.entries(selected.requestHeaders).map(([k, v]) => (
                              <div key={k}><span className="text-sky-300">{k.toLowerCase()}: </span>{v}</div>
                            ))}
                          </div>
                        </div>
                      )}
                      {state.detailTab === 'payload' && (selected.payload ? <pre className="whitespace-pre-wrap text-emerald-300">{selected.payload}</pre> : <span className="text-slate-500">No payload for this request.</span>)}
                      {state.detailTab === 'response' && (selected.response ? <pre className="whitespace-pre-wrap text-amber-200">{selected.response}</pre> : <span className="text-slate-500">This request has no response data available.</span>)}
                      {state.detailTab === 'timing' &&
                        (selected.timing ? (
                          <div className="space-y-1.5">
                            {Object.entries(selected.timing).map(([k, v]) => {
                              const total = Object.values(selected.timing!).reduce((a, b) => a + b, 0);
                              return (
                                <div key={k} className="grid grid-cols-[90px_1fr_50px] items-center gap-2">
                                  <span className="capitalize text-slate-400">{k === 'waiting' ? 'Waiting (TTFB)' : k}</span>
                                  <span className="h-2 rounded bg-slate-700">
                                    <span className={cn('block h-2 rounded', k === 'waiting' ? 'bg-emerald-400' : 'bg-sky-400')} style={{ width: `${Math.max(1, (v / total) * 100)}%` }} />
                                  </span>
                                  <span className="text-right">{v} ms</span>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-slate-500">Total: {selected.timeMs} ms (simulated)</span>
                        ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      {selected && state.detailTab === 'headers' && selected.id === 'orders' && (
        <div className="border-t border-line p-3">
          <CodeBlock code={curlFor(selected)} lang="curl" title="Copy as cURL (fictional values)" maxHeight={160} copy={false} />
        </div>
      )}
    </div>
  );
}
