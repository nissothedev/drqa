import { describe, expect, it } from 'vitest';
import { answer, answersBefore, diagnose, validateScenario, walk } from './engine';
import { contextFor, ENTRY_POINTS, SCENARIO_BY_ID, SCENARIOS } from './data';
import { buildSummaryText } from './summary';
import { INCIDENT } from '../incident-investigator/scenario';

const ctx400 = contextFor(SCENARIO_BY_ID['http-400']);

describe('scenario data integrity', () => {
  it.each([...SCENARIOS, INCIDENT].map((s) => [s.id, s] as const))('%s has no dangling references', (_id, s) => {
    expect(validateScenario(contextFor(s))).toEqual([]);
  });

  it('covers every required HTTP status', () => {
    const codes = SCENARIOS.map((s) => s.code).filter(Boolean);
    expect(codes).toEqual(expect.arrayContaining([400, 401, 403, 404, 405, 409, 415, 422, 429, 500, 502, 503, 504]));
  });

  it('every entry point targets an existing scenario and valid preset answers', () => {
    for (const e of ENTRY_POINTS) {
      const s = SCENARIO_BY_ID[e.scenarioId];
      expect(s, e.id).toBeDefined();
      for (const [nodeId, optId] of Object.entries(e.preset ?? {})) {
        const node = s.nodes.find((n) => n.id === nodeId);
        expect(node, `${e.id} → ${nodeId}`).toBeDefined();
        expect(node!.options.some((o) => o.id === optId), `${e.id} → ${nodeId}/${optId}`).toBe(true);
      }
    }
  });

  it('every path through every scenario terminates (exhaustive walk)', () => {
    for (const s of [...SCENARIOS, INCIDENT]) {
      const ctx = contextFor(s);
      let terminals = 0;
      const explore = (answers: Record<string, string>, depth: number) => {
        expect(depth).toBeLessThan(30);
        const r = walk(ctx, answers);
        if (r.complete) {
          terminals++;
          // diagnose must never throw and never invent confirmed findings without an answer providing them
          const d = diagnose(ctx, answers);
          expect(d.checks.length).toBeGreaterThan(0);
          return;
        }
        for (const o of r.current!.options) explore({ ...answers, [r.current!.id]: o.id }, depth + 1);
      };
      explore({}, 0);
      expect(terminals, s.id).toBeGreaterThan(1);
    }
  });
});

describe('decision-tree routing', () => {
  it('starts with the shared symptom-source question', () => {
    const r = walk(ctx400, {});
    expect(r.current?.id).toBe('common.source');
    expect(r.current?.phase).toBe('symptom');
  });

  it('continues into the scenario after the environment phase', () => {
    let a = answer(ctx400, {}, 'common.source', 'devtools');
    a = answer(ctx400, a, 'common.repro', 'always');
    a = answer(ctx400, a, 'common.env', 'all-envs');
    expect(walk(ctx400, a).current?.id).toBe('400.response');
  });

  it('branches to the env-diff node only when the issue is environment specific', () => {
    let a = answer(ctx400, {}, 'common.source', 'devtools');
    a = answer(ctx400, a, 'common.repro', 'always');
    expect(walk(ctx400, answer(ctx400, a, 'common.env', 'one-env')).current?.id).toBe('common.env-diff');
    expect(walk(ctx400, answer(ctx400, a, 'common.env', 'unknown')).current?.id).toBe('400.response');
  });

  it('routes 400 parse errors to the syntax check and field errors to the contract check', () => {
    const base = { 'common.source': 'devtools', 'common.repro': 'always', 'common.env': 'all-envs' };
    expect(walk(ctx400, { ...base, '400.response': 'parse' }).current?.id).toBe('400.syntax');
    expect(walk(ctx400, { ...base, '400.response': 'field' }).current?.id).toBe('400.contract');
  });

  it('changing an earlier answer prunes answers from the abandoned branch', () => {
    const base = { 'common.source': 'devtools', 'common.repro': 'always', 'common.env': 'all-envs' };
    let a = answer(ctx400, base, '400.response', 'parse');
    a = answer(ctx400, a, '400.syntax', 'invalid');
    expect(a['400.syntax']).toBe('invalid');
    a = answer(ctx400, a, '400.response', 'field');
    expect(a['400.syntax']).toBeUndefined();
    expect(walk(ctx400, a).current?.id).toBe('400.contract');
  });

  it('answersBefore supports stepping back', () => {
    const a = { 'common.source': 'devtools', 'common.repro': 'always', 'common.env': 'all-envs', '400.response': 'parse' };
    const back = answersBefore(ctx400, a, '400.response');
    expect(back).toEqual({ 'common.source': 'devtools', 'common.repro': 'always', 'common.env': 'all-envs' });
  });

  it('preset answers from a symptom entry point skip the preset question', () => {
    const entry = ENTRY_POINTS.find((e) => e.id === 'malformed-json')!;
    const a = { ...entry.preset, 'common.source': 'ui', 'common.repro': 'always', 'common.env': 'all-envs' };
    expect(walk(contextFor(SCENARIO_BY_ID[entry.scenarioId]), a).current?.id).toBe('400.syntax');
  });
});

describe('diagnosis', () => {
  it('keeps confirmed findings empty unless an answer is backed by direct evidence', () => {
    const a = { 'common.source': 'ui', 'common.repro': 'always', 'common.env': 'all-envs', '400.response': 'generic' };
    const d = diagnose(ctx400, a);
    expect(d.confirmed).toEqual([]);
    expect(d.assumptions.length).toBeGreaterThan(0);
  });

  it('ranks the syntax hypothesis first when invalid JSON is verified', () => {
    const a = { 'common.source': 'devtools', 'common.repro': 'always', 'common.env': 'all-envs', '400.response': 'parse', '400.syntax': 'invalid', '400.who-builds': 'ui' };
    const d = diagnose(ctx400, a);
    expect(d.hypotheses[0].id).toBe('payload-syntax');
    expect(d.hypotheses[0].level).toBe('stronger');
    expect(d.confirmed.length).toBe(1);
  });

  it('shifts weight toward server validation when the request matches the contract', () => {
    const a = { 'common.source': 'devtools', 'common.repro': 'always', 'common.env': 'all-envs', '400.response': 'field', '400.contract': 'matches', '400.minimal': 'fails' };
    const d = diagnose(ctx400, a);
    const top = d.hypotheses.slice(0, 3).map((h) => h.id);
    expect(top).toContain('server-validation-bug');
    expect(d.hypotheses.find((h) => h.id === 'payload-shape')!.score).toBeLessThan(2);
  });

  it('distinguishes 401 token expiry from wrong environment', () => {
    const ctx = contextFor(SCENARIO_BY_ID['http-401']);
    const base = { 'common.source': 'postman', 'common.repro': 'always', 'common.env': 'unknown', '401.header': 'bearer', '401.www': 'generic' };
    expect(diagnose(ctx, { ...base, '401.env': 'expired' }).hypotheses[0].id).toBe('token-expired');
    expect(diagnose(ctx, { ...base, '401.env': 'other-env' }).hypotheses[0].id).toBe('token-wrong-env');
  });

  it('a 504 never confirms a database root cause without trace evidence', () => {
    const ctx = contextFor(SCENARIO_BY_ID['http-504']);
    const a = { 'common.source': 'ui', 'common.repro': 'intermittent', 'common.env': 'unknown', '504.duration': 'fixed', '504.request': 'light', '504.logs': 'no-access' };
    const d = diagnose(ctx, a);
    expect(d.confirmed).toEqual([]);
    expect(d.hypotheses.every((h) => h.level !== 'stronger' || h.id !== 'slow-query')).toBe(true);
  });

  it('builds a text summary that labels hypotheses as unverified', () => {
    const a = { 'common.source': 'devtools', 'common.repro': 'always', 'common.env': 'all-envs', '400.response': 'parse', '400.syntax': 'invalid', '400.who-builds': 'ui' };
    const { path } = walk(ctx400, a);
    const text = buildSummaryText({ scenario: ctx400.scenario, path, diagnosis: diagnose(ctx400, a), evidence: [{ label: 'x', collected: true }], generatedAt: new Date(2026, 0, 1) });
    expect(text).toContain('HYPOTHESES – לא מאומתות');
    expect(text).toContain('CONFIRMED FINDINGS');
    expect(text).toContain('[x] x');
  });
});
