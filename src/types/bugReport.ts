export type BugCategory = 'api' | 'ui' | 'data' | 'integration' | 'business' | 'performance' | 'other';
export type Severity = 'Critical' | 'High' | 'Medium' | 'Low';
export type Priority = 'P1' | 'P2' | 'P3' | 'P4';
export type Reproducibility = 'always' | 'intermittent' | 'once' | 'unknown';
export type DataIssue = 'incorrect' | 'missing' | 'not-persisted' | 'duplicate' | 'mismatch';

export interface BugReport {
  category: BugCategory | '';
  title: string;
  component: string;
  environment: string;
  build: string;
  reproducibility: Reproducibility | '';
  frequency: string;
  preconditions: string;
  steps: string;
  testData: string;
  expected: string;
  actual: string;
  api: {
    method: string;
    endpoint: string;
    statusCode: string;
    correlationId: string;
    request: string;
    response: string;
    contract: string;
  };
  data: {
    issues: DataIssue[];
    sourceOfTruthVerified: 'yes' | 'no' | 'unknown' | '';
    sources: string;
    query: string;
  };
  evidence: string;
  hypotheses: string;
  severity: Severity | '';
  priority: Priority | '';
  impact: string;
  workaround: string;
}

export interface QualityCheck {
  id: string;
  label: string;
  level: 'error' | 'warning';
  pass: boolean;
  hint: string;
  /** Wizard step index where the user can fix it. */
  step: number;
}
