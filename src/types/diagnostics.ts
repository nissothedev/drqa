/**
 * Typed model for DRQA's deterministic diagnostic decision trees.
 * Used by API Doctor and Incident Investigator. Rules live in data files; the engine is pure.
 */

export type Phase = 'symptom' | 'reproducibility' | 'environment' | 'request' | 'response' | 'contract' | 'followup';

/** Effects an answer has on the investigation state. */
export interface AnswerEffect {
  /** Facts the user has directly observed by choosing this answer. */
  facts?: string[];
  /** Things the investigation now relies on that have NOT been verified. */
  assumptions?: string[];
  /** Only facts verified by direct evidence (log line, controlled comparison). */
  confirmed?: string[];
  /** Weight adjustments for hypotheses (positive = more supported, negative = less). */
  hypotheses?: Record<string, number>;
  /** Recommended check ids to add. */
  checks?: string[];
}

export interface AnswerOption extends AnswerEffect {
  id: string;
  label: string;
  description?: string;
  /** Next node id, '@scenario' to continue to the scenario's first node, or null to finish. */
  next: string | null;
}

export interface DecisionNode {
  id: string;
  phase: Phase;
  question: string;
  help?: string;
  /** Short demo-shop oriented example of what to look at. */
  example?: string;
  options: AnswerOption[];
}

export type Layer = 'client' | 'network' | 'gateway' | 'auth' | 'service' | 'data' | 'dependency' | 'config' | 'infra' | 'test';

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  layer: Layer;
}

export interface RecommendedCheck {
  id: string;
  title: string;
  /** What to inspect */
  what: string;
  /** How to inspect it (ordered steps) */
  how: string[];
  /** Why it matters */
  why: string;
  /** What the result may indicate */
  indicates: string;
  /** What the result does NOT prove */
  doesNotProve: string;
  /** What to check next */
  next: string;
}

export type ScenarioCategory = 'client' | 'auth' | 'server' | 'network' | 'contract';

export interface DiagnosticScenario {
  id: string;
  code?: number;
  title: string;
  shortTitle: string;
  category: ScenarioCategory;
  /** One-line accurate meaning */
  tagline: string;
  /** Accurate explanation of what this symptom means */
  meaning: string;
  /** What this symptom does NOT prove on its own */
  notProof: string[];
  demo: { request: string; response: string; note?: string };
  /** First scenario-specific node, reached after the shared prefix */
  startNode: string;
  nodes: DecisionNode[];
  /** Base weights for hypotheses relevant to this scenario */
  hypotheses: Record<string, number>;
  /** Checks always recommended for this scenario */
  checks: string[];
  /** Evidence checklist the investigator should collect */
  evidence: string[];
  /** Skip the shared source/reproducibility/environment prefix (used by Incident Investigator). */
  standalone?: boolean;
}

/** A user-facing way into a scenario (e.g. "Malformed JSON" → 400 with a preset answer). */
export interface EntryPoint {
  id: string;
  label: string;
  hint: string;
  scenarioId: string;
  preset?: Record<string, string>;
  group: 'status' | 'symptom';
}

export type Answers = Record<string, string>;

export interface PathStep {
  node: DecisionNode;
  option?: AnswerOption;
}

export interface WalkResult {
  path: PathStep[];
  current: DecisionNode | null;
  complete: boolean;
}

export interface RankedHypothesis extends Hypothesis {
  score: number;
  support: string[];
  against: string[];
  level: 'stronger' | 'possible' | 'weaker';
}

export interface Diagnosis {
  facts: string[];
  assumptions: string[];
  confirmed: string[];
  hypotheses: RankedHypothesis[];
  checks: RecommendedCheck[];
}
