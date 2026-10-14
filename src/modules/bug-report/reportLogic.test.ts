import { describe, expect, it } from 'vitest';
import { buildReportJson, buildReportMarkdown, buildReportText, emptyReport, gateSummary, hasCertaintyWording, qualityChecks, scanSensitive, stepLines } from './reportLogic';
import type { BugReport } from '../../types/bugReport';

function apiReport(): BugReport {
  const r = emptyReport();
  return {
    ...r,
    category: 'api',
    title: 'POST /v1/orders מחזיר 422 כשהמיקוד חסר בקופה',
    environment: 'QA',
    build: '2026.10.2',
    reproducibility: 'always',
    frequency: '5/5',
    steps: '1. התחברו כמשתמש הבדוי demo.buyer\n2. הוסיפו מוצר לעגלה\n3. לחצו "ביצוע הזמנה"',
    expected: 'ההזמנה נוצרת (201) לפי החוזה',
    actual: 'מתקבל 422 – shippingAddress.zip חסר, למרות שהשדה מולא בטופס',
    api: { method: 'POST', endpoint: '/v1/orders', statusCode: '422', correlationId: 'demo-9f3e-0422', request: 'shippingAddress ללא zip', response: '{"errors":[{"field":"shippingAddress.zip"}]}', contract: 'zip הוא שדה חובה' },
    evidence: 'Payload מ-DevTools מראה שהשדה לא נשלח',
    hypotheses: 'ייתכן שמיפוי הטופס בצד הלקוח אינו כולל את zip – לא אומת',
    severity: 'High',
    priority: 'P2',
    impact: 'לקוחות לא יכולים להשלים הזמנה',
  };
}

describe('quality gate', () => {
  it('blocks an empty report with errors', () => {
    const g = gateSummary(qualityChecks(emptyReport()));
    expect(g.ready).toBe(false);
    expect(g.errors.map((e) => e.id)).toEqual(expect.arrayContaining(['category', 'title', 'steps', 'expected', 'actual', 'severity']));
  });

  it('passes a complete API report', () => {
    const g = gateSummary(qualityChecks(apiReport()));
    expect(g.errors).toEqual([]);
    expect(g.ready).toBe(true);
    expect(g.score).toBe(100);
  });

  it('requires API specifics only for API bugs', () => {
    const ui = { ...apiReport(), category: 'ui' as const };
    expect(qualityChecks(ui).some((c) => c.id.startsWith('api-'))).toBe(false);
    const missing = { ...apiReport(), api: { ...apiReport().api, statusCode: '' } };
    expect(gateSummary(qualityChecks(missing)).errors.map((e) => e.id)).toContain('api-status');
  });

  it('asks Data/DB bugs whether the source of truth was verified', () => {
    const d = { ...apiReport(), category: 'data' as const, data: { issues: ['duplicate' as const], sourceOfTruthVerified: 'no' as const, sources: '', query: '' } };
    const sot = qualityChecks(d).find((c) => c.id === 'data-sot')!;
    expect(sot.pass).toBe(false);
    expect(sot.level).toBe('warning');
  });

  it('rejects generic titles and identical expected/actual', () => {
    const r = { ...apiReport(), title: 'לא עובד', actual: 'x', expected: 'x' };
    const ids = gateSummary(qualityChecks(r)).errors.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['title', 'distinct']));
  });

  it('flags hypotheses written as certainties', () => {
    expect(hasCertaintyWording('הסיבה היא באג בשרת')).toBe(true);
    expect(hasCertaintyWording('ייתכן שהמיפוי שגוי – לא אומת')).toBe(false);
    const r = { ...apiReport(), hypotheses: 'definitely caused by the DB' };
    expect(qualityChecks(r).find((c) => c.id === 'hypothesis-wording')!.pass).toBe(false);
  });

  it('detects sensitive data but allows fictional demo tokens', () => {
    expect(scanSensitive(apiReport())).toEqual([]);
    expect(scanSensitive({ ...apiReport(), evidence: 'Authorization: Bearer demo-customer-token' })).toEqual([]);
    expect(scanSensitive({ ...apiReport(), evidence: 'Authorization: Bearer abcdefghijklmnopqrstuvwxyz123456' })).toContain('טוקן Bearer');
    expect(scanSensitive({ ...apiReport(), evidence: 'token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.abcdefghijklmnop' })).toContain('נראה כמו JWT');
    expect(scanSensitive({ ...apiReport(), testData: 'password: hunter22' })).toContain('סיסמה');
  });
});

describe('report generation', () => {
  it('normalises numbered step lines', () => {
    expect(stepLines('1. a\n2) b\n- c\n\n  d ')).toEqual(['a', 'b', 'c', 'd']);
  });

  it('builds a paste-ready text report with labelled hypotheses', () => {
    const t = buildReportText(apiReport());
    expect(t.startsWith('[API] POST /v1/orders מחזיר 422')).toBe(true);
    expect(t).toContain('1. התחברו כמשתמש הבדוי demo.buyer');
    expect(t).toContain('- Endpoint: POST /v1/orders');
    expect(t).toContain('השערות לגבי הגורם (לא מאומתות):');
    expect(t).not.toMatch(/\n{3,}/);
  });

  it('is deterministic', () => {
    expect(buildReportText(apiReport())).toBe(buildReportText(apiReport()));
  });

  it('builds markdown and JSON variants', () => {
    expect(buildReportMarkdown(apiReport()).startsWith('## [API]')).toBe(true);
    const j = JSON.parse(buildReportJson(apiReport()));
    expect(j.steps).toHaveLength(3);
    expect(j.api.statusCode).toBe('422');
  });
});
