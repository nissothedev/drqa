import type { Answers, DecisionNode, Diagnosis, DiagnosticScenario, Hypothesis, PathStep, RankedHypothesis, RecommendedCheck, WalkResult } from '../../types/diagnostics';

/**
 * Pure, deterministic decision-tree engine.
 *
 * The investigation state is just a map of nodeId → optionId. The visible path is always
 * recomputed from the start node by following the chosen options. Changing an earlier answer
 * therefore re-routes the tree automatically, and answers on branches that are no longer
 * visited are simply ignored.
 */

export const SCENARIO_CONTINUE = '@scenario';
const MAX_STEPS = 64;

export interface EngineContext {
  scenario: DiagnosticScenario;
  commonNodes: DecisionNode[];
  commonStart: string;
  hypothesisLibrary: Record<string, Hypothesis>;
  checkLibrary: Record<string, RecommendedCheck>;
}

export function findNode(ctx: Pick<EngineContext, 'scenario' | 'commonNodes'>, id: string): DecisionNode | undefined {
  return ctx.scenario.nodes.find((n) => n.id === id) ?? (ctx.scenario.standalone ? undefined : ctx.commonNodes.find((n) => n.id === id));
}

export function startNodeId(ctx: Pick<EngineContext, 'scenario' | 'commonStart'>): string {
  return ctx.scenario.standalone ? ctx.scenario.startNode : ctx.commonStart;
}

function resolveNext(ctx: Pick<EngineContext, 'scenario'>, next: string | null): string | null {
  if (next === SCENARIO_CONTINUE) return ctx.scenario.startNode;
  return next;
}

export function walk(ctx: Pick<EngineContext, 'scenario' | 'commonNodes' | 'commonStart'>, answers: Answers): WalkResult {
  const path: PathStep[] = [];
  const seen = new Set<string>();
  let id: string | null = startNodeId(ctx);

  while (id !== null && path.length < MAX_STEPS) {
    if (seen.has(id)) throw new Error(`Decision tree cycle detected at node "${id}"`);
    seen.add(id);
    const node = findNode(ctx, id);
    if (!node) throw new Error(`Unknown decision node "${id}" in scenario "${ctx.scenario.id}"`);
    const chosen = answers[node.id];
    const option = chosen ? node.options.find((o) => o.id === chosen) : undefined;
    if (!option) {
      path.push({ node });
      return { path, current: node, complete: false };
    }
    path.push({ node, option });
    id = resolveNext(ctx, option.next);
  }
  return { path, current: null, complete: true };
}

/** Sets an answer and drops answers for nodes that are no longer on the active path. */
export function answer(ctx: Pick<EngineContext, 'scenario' | 'commonNodes' | 'commonStart'>, answers: Answers, nodeId: string, optionId: string): Answers {
  const next = { ...answers, [nodeId]: optionId };
  const { path } = walk(ctx, next);
  const onPath = new Set(path.map((s) => s.node.id));
  const pruned: Answers = {};
  for (const [k, v] of Object.entries(next)) if (onPath.has(k)) pruned[k] = v;
  return pruned;
}

/** Answers on the active path that come before `nodeId` (used for "go back"). */
export function answersBefore(ctx: Pick<EngineContext, 'scenario' | 'commonNodes' | 'commonStart'>, answers: Answers, nodeId: string): Answers {
  const { path } = walk(ctx, answers);
  const out: Answers = {};
  for (const step of path) {
    if (step.node.id === nodeId) break;
    if (step.option) out[step.node.id] = step.option.id;
  }
  return out;
}

function uniq(items: string[]): string[] {
  return [...new Set(items)];
}

export function levelFor(score: number): RankedHypothesis['level'] {
  if (score >= 4) return 'stronger';
  if (score >= 2) return 'possible';
  return 'weaker';
}

export function diagnose(ctx: EngineContext, answers: Answers): Diagnosis {
  const { path } = walk(ctx, answers);
  const facts: string[] = [];
  const assumptions: string[] = [];
  const confirmed: string[] = [];
  const checkIds: string[] = [...ctx.scenario.checks];
  const scores = new Map<string, number>(Object.entries(ctx.scenario.hypotheses));
  const support = new Map<string, string[]>();
  const against = new Map<string, string[]>();

  for (const step of path) {
    const o = step.option;
    if (!o) continue;
    facts.push(...(o.facts ?? []));
    assumptions.push(...(o.assumptions ?? []));
    confirmed.push(...(o.confirmed ?? []));
    checkIds.push(...(o.checks ?? []));
    for (const [hid, w] of Object.entries(o.hypotheses ?? {})) {
      scores.set(hid, (scores.get(hid) ?? 0) + w);
      const bucket = w >= 0 ? support : against;
      bucket.set(hid, [...(bucket.get(hid) ?? []), o.label]);
    }
  }

  const hypotheses: RankedHypothesis[] = [];
  for (const [hid, score] of scores) {
    const h = ctx.hypothesisLibrary[hid];
    if (!h) throw new Error(`Unknown hypothesis "${hid}" in scenario "${ctx.scenario.id}"`);
    hypotheses.push({ ...h, score, support: uniq(support.get(hid) ?? []), against: uniq(against.get(hid) ?? []), level: levelFor(score) });
  }
  hypotheses.sort((a, b) => b.score - a.score || a.title.localeCompare(b.title, 'he'));

  const checks: RecommendedCheck[] = [];
  for (const cid of uniq(checkIds)) {
    const c = ctx.checkLibrary[cid];
    if (!c) throw new Error(`Unknown check "${cid}" in scenario "${ctx.scenario.id}"`);
    checks.push(c);
  }

  return { facts: uniq(facts), assumptions: uniq(assumptions), confirmed: uniq(confirmed), hypotheses, checks };
}

/** Validates that every reference in a scenario resolves. Used by unit tests. */
export function validateScenario(ctx: EngineContext): string[] {
  const errors: string[] = [];
  const all = [...ctx.scenario.nodes, ...(ctx.scenario.standalone ? [] : ctx.commonNodes)];
  const ids = new Set(all.map((n) => n.id));
  if (!ids.has(ctx.scenario.startNode)) errors.push(`startNode "${ctx.scenario.startNode}" missing`);
  for (const n of all) {
    if (n.options.length < 2) errors.push(`node "${n.id}" has fewer than 2 options`);
    for (const o of n.options) {
      if (o.next !== null && o.next !== SCENARIO_CONTINUE && !ids.has(o.next)) errors.push(`node "${n.id}" option "${o.id}" → unknown "${o.next}"`);
      if (o.next === SCENARIO_CONTINUE && ctx.scenario.standalone) errors.push(`standalone node "${n.id}" uses @scenario`);
      for (const h of Object.keys(o.hypotheses ?? {})) if (!ctx.hypothesisLibrary[h]) errors.push(`unknown hypothesis "${h}" in ${n.id}/${o.id}`);
      for (const c of o.checks ?? []) if (!ctx.checkLibrary[c]) errors.push(`unknown check "${c}" in ${n.id}/${o.id}`);
    }
  }
  for (const h of Object.keys(ctx.scenario.hypotheses)) if (!ctx.hypothesisLibrary[h]) errors.push(`unknown base hypothesis "${h}"`);
  for (const c of ctx.scenario.checks) if (!ctx.checkLibrary[c]) errors.push(`unknown base check "${c}"`);
  return errors;
}
