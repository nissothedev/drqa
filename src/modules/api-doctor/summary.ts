import type { Diagnosis, DiagnosticScenario, PathStep } from '../../types/diagnostics';
import { LAYER_LABEL } from './data/hypotheses';

const PHASE_LABEL: Record<string, string> = {
  symptom: 'זיהוי סימפטום',
  reproducibility: 'שחזור',
  environment: 'סביבה',
  request: 'בחינת הבקשה',
  response: 'בחינת התגובה',
  contract: 'השוואה לחוזה',
  followup: 'שאלות המשך',
};

export const LEVEL_LABEL = {
  stronger: 'נתמכת יותר בראיות שנאספו',
  possible: 'אפשרית',
  weaker: 'פחות סבירה כרגע',
} as const;

export interface SummaryInput {
  scenario: DiagnosticScenario;
  path: PathStep[];
  diagnosis: Diagnosis;
  evidence: { label: string; collected: boolean }[];
  notes?: string;
  generatedAt?: Date;
  toolName?: string;
}

/** Plain-text investigation summary suitable for a ticket or chat. Deterministic given its input. */
export function buildSummaryText({ scenario, path, diagnosis, evidence, notes, generatedAt = new Date(), toolName = 'API Doctor' }: SummaryInput): string {
  const lines: string[] = [];
  const hr = '─'.repeat(48);
  lines.push(`DRQA · ${toolName} — סיכום חקירה`);
  lines.push(`תרחיש: ${scenario.title}`);
  lines.push(`נוצר: ${generatedAt.toLocaleString('he-IL')}`);
  lines.push('הערה: סיכום זה מבוסס על תשובות החוקר/ת. השערות אינן ממצאים מאומתים.');
  lines.push(hr);

  lines.push('משמעות הסימפטום:');
  lines.push(scenario.meaning);
  lines.push('');

  lines.push('מסלול החקירה:');
  path.forEach((s, i) => {
    if (!s.option) return;
    lines.push(`${i + 1}. [${PHASE_LABEL[s.node.phase]}] ${s.node.question}`);
    lines.push(`   ← ${s.option.label}`);
  });
  lines.push('');

  const section = (title: string, items: string[], empty: string) => {
    lines.push(title);
    if (items.length === 0) lines.push(`  • ${empty}`);
    for (const it of items) lines.push(`  • ${it}`);
    lines.push('');
  };

  section('עובדות שנצפו (OBSERVED FACTS):', diagnosis.facts, 'לא נרשמו עובדות');
  section('ממצאים מאומתים (CONFIRMED FINDINGS):', diagnosis.confirmed, 'אין עדיין ממצא מאומת');
  section('הנחות לא מאומתות (UNVERIFIED ASSUMPTIONS):', diagnosis.assumptions, 'לא זוהו הנחות');

  lines.push('השערות לפי תמיכת הראיות (HYPOTHESES – לא מאומתות):');
  diagnosis.hypotheses
    .filter((h) => h.score > 0)
    .slice(0, 6)
    .forEach((h, i) => {
      lines.push(`  ${i + 1}. ${h.title} — ${LEVEL_LABEL[h.level]} (שכבה: ${LAYER_LABEL[h.layer]})`);
      if (h.support.length) lines.push(`     תומך: ${h.support.join(' | ')}`);
    });
  lines.push('');

  lines.push('רשימת ראיות:');
  for (const e of evidence) lines.push(`  [${e.collected ? 'x' : ' '}] ${e.label}`);
  lines.push('');

  lines.push('בדיקות מומלצות להמשך:');
  diagnosis.checks.forEach((c, i) => {
    lines.push(`  ${i + 1}. ${c.title}`);
    lines.push(`     מה לבדוק: ${c.what}`);
    lines.push(`     מה זה לא מוכיח: ${c.doesNotProve}`);
  });
  lines.push('');

  lines.push('מה הסימפטום לבדו אינו מוכיח:');
  for (const n of scenario.notProof) lines.push(`  • ${n}`);

  if (notes && notes.trim()) {
    lines.push('');
    lines.push('הערות החוקר/ת:');
    lines.push(notes.trim());
  }
  lines.push(hr);
  lines.push('כל הדוגמאות ב-DRQA בדויות (Demo Shop). אין לצרף טוקנים, סיסמאות או נתוני לקוחות אמיתיים.');
  return lines.join('\n');
}

export function buildSummaryJson(input: SummaryInput): string {
  const { scenario, path, diagnosis, evidence, notes, generatedAt = new Date(), toolName = 'API Doctor' } = input;
  return JSON.stringify(
    {
      tool: `DRQA ${toolName}`,
      generatedAt: generatedAt.toISOString(),
      scenario: { id: scenario.id, title: scenario.title },
      path: path.filter((s) => s.option).map((s) => ({ phase: s.node.phase, question: s.node.question, answer: s.option!.label })),
      observedFacts: diagnosis.facts,
      confirmedFindings: diagnosis.confirmed,
      unverifiedAssumptions: diagnosis.assumptions,
      hypotheses: diagnosis.hypotheses.filter((h) => h.score > 0).map((h) => ({ title: h.title, level: h.level, score: h.score, layer: h.layer, support: h.support })),
      evidence,
      recommendedChecks: diagnosis.checks.map((c) => ({ title: c.title, what: c.what, how: c.how, why: c.why, indicates: c.indicates, doesNotProve: c.doesNotProve, next: c.next })),
      notes: notes ?? '',
      disclaimer: 'Hypotheses are not confirmed findings. All examples are fictional (Demo Shop).',
    },
    null,
    2,
  );
}
