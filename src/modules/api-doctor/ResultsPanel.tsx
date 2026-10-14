import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bug, ClipboardList, Download, FileJson, FileText, Lightbulb, ListChecks, ScanEye, Wrench } from 'lucide-react';
import type { Diagnosis, DiagnosticScenario, PathStep } from '../../types/diagnostics';
import { Tabs } from '../../components/ui/Tabs';
import { CheckRow } from '../../components/ui/Field';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { CopyButton } from '../../components/ui/CopyButton';
import { Callout } from '../../components/ui/Callout';
import { Progress } from '../../components/ui/misc';
import { downloadFile, fileStamp } from '../../utils/download';
import { useApp } from '../../context/AppContext';
import { EvidenceQuadrants, HypothesisList } from './EvidenceBoard';
import { CheckCard } from './CheckCard';
import { buildSummaryJson, buildSummaryText } from './summary';

type Tab = 'evidence' | 'hypotheses' | 'checklist' | 'checks' | 'summary';

interface Props {
  scenario: DiagnosticScenario;
  path: PathStep[];
  diagnosis: Diagnosis;
  complete: boolean;
  collected: Set<number>;
  onToggleEvidence: (i: number, v: boolean) => void;
  toolName?: string;
}

export function ResultsPanel({ scenario, path, diagnosis, complete, collected, onToggleEvidence, toolName = 'API Doctor' }: Props) {
  const [tab, setTab] = useState<Tab>(complete ? 'hypotheses' : 'evidence');
  const [notes, setNotes] = useState('');
  const { toast } = useApp();

  const evidence = scenario.evidence.map((label, i) => ({ label, collected: collected.has(i) }));
  const summaryInput = { scenario, path, diagnosis, evidence, notes, toolName };
  const summary = useMemo(() => buildSummaryText(summaryInput), [scenario, path, diagnosis, collected, notes]); // eslint-disable-line react-hooks/exhaustive-deps

  const exportTxt = () => {
    downloadFile(`drqa-${scenario.id}-${fileStamp()}.txt`, summary);
    toast('קובץ TXT נוצר והורד');
  };
  const exportJson = () => {
    downloadFile(`drqa-${scenario.id}-${fileStamp()}.json`, buildSummaryJson(summaryInput), 'application/json;charset=utf-8');
    toast('קובץ JSON נוצר והורד');
  };

  // The incident tree is layer-agnostic, so it doesn't pre-select the API bug category.
  const bugParams = new URLSearchParams(scenario.id === 'incident' ? {} : { type: 'api', scenario: scenario.id });
  if (scenario.code) bugParams.set('status', String(scenario.code));

  return (
    <section className="card overflow-hidden" aria-label="תוצאות החקירה">
      <div className="flex flex-col gap-3 border-b border-line p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-bold text-fg">{complete ? 'תוצאות החקירה' : 'תמונת מצב ביניים'}</h2>
          <p className="text-xs text-muted">{complete ? 'כל השאלות נענו. המשיכו לבדיקות המומלצות כדי להפוך השערות לממצאים.' : 'התוצאות מתעדכנות עם כל תשובה.'}</p>
        </div>
        <Tabs
          ariaLabel="תצוגות תוצאה"
          size="sm"
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'evidence', label: 'ראיות', icon: ScanEye },
            { id: 'hypotheses', label: 'השערות', icon: Lightbulb, count: diagnosis.hypotheses.filter((h) => h.score > 0).length },
            { id: 'checklist', label: 'צ׳קליסט', icon: ClipboardList, count: scenario.evidence.length },
            { id: 'checks', label: 'בדיקות', icon: Wrench, count: diagnosis.checks.length },
            { id: 'summary', label: 'סיכום', icon: FileText },
          ]}
        />
      </div>
      <div className="p-4 md:p-5">
        {tab === 'evidence' && <EvidenceQuadrants diagnosis={diagnosis} />}

        {tab === 'hypotheses' && (
          <div className="space-y-4">
            <Callout tone="warning" title="השערות אינן מסקנות">
              הדירוג משקף את התשובות שנתתם – לא ודאות. השערה הופכת לממצא רק אחרי בדיקה עם ראיה ישירה.
            </Callout>
            <HypothesisList diagnosis={diagnosis} />
          </div>
        )}

        {tab === 'checklist' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Progress value={collected.size} max={scenario.evidence.length} tone="success" className="flex-1" label="התקדמות איסוף ראיות" />
              <span className="text-xs text-muted">
                {collected.size}/{scenario.evidence.length} נאספו
              </span>
            </div>
            <div className="grid gap-2">
              {scenario.evidence.map((e, i) => (
                <CheckRow key={e} checked={collected.has(i)} onChange={(v) => onToggleEvidence(i, v)} label={e} />
              ))}
            </div>
            <p className="text-2xs text-subtle">הסימונים נשמרים רק בזיכרון הדף ונכללים בסיכום המיוצא.</p>
          </div>
        )}

        {tab === 'checks' && (
          <div className="space-y-2.5">
            {diagnosis.checks.map((c, i) => (
              <CheckCard key={c.id} check={c} index={i} defaultOpen={i === 0} />
            ))}
          </div>
        )}

        {tab === 'summary' && (
          <div className="space-y-4">
            <div>
              <label htmlFor="inv-notes" className="label">
                הערות החוקר/ת (לא נשמרות – רק נכללות בייצוא)
              </label>
              <textarea id="inv-notes" value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="input" placeholder="למשל: correlationId של הכשל, מה נבדק ומה עוד פתוח. אל תכללו טוקנים או מידע אמיתי." />
            </div>
            <CodeBlock code={summary} lang="text" title="investigation-summary.txt" maxHeight={460} wrap copy={false} />
            <div className="flex flex-wrap gap-2">
              <CopyButton text={summary} label="העתקת הסיכום" variant="secondary" size="md" />
              <button type="button" className="btn btn-secondary" onClick={exportTxt}>
                <Download className="size-4" aria-hidden />
                TXT
              </button>
              <button type="button" className="btn btn-secondary" onClick={exportJson}>
                <FileJson className="size-4" aria-hidden />
                JSON
              </button>
              <Link to={`/bug-report?${bugParams.toString()}`} className="btn btn-primary ms-auto">
                <Bug className="size-4" aria-hidden />
                המשך לדיווח באג
              </Link>
            </div>
          </div>
        )}
      </div>
      {tab !== 'summary' && (
        <div className="flex items-center justify-between border-t border-line bg-surface-2/40 px-4 py-3">
          <span className="flex items-center gap-2 text-xs text-muted">
            <ListChecks className="size-4 text-accent" aria-hidden />
            {diagnosis.checks.length} בדיקות מומלצות · {diagnosis.confirmed.length} ממצאים מאומתים
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setTab('summary')}>
            לסיכום וייצוא
          </button>
        </div>
      )}
    </section>
  );
}
