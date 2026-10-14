import type { HttpMethod } from '../data/http';

export type FieldType = 'string' | 'integer' | 'number' | 'boolean' | 'enum' | 'email' | 'date' | 'array' | 'object';

export interface FieldSpec {
  name: string;
  type: FieldType;
  required: boolean;
  /** For numbers: value range. For strings/arrays: length range. */
  min?: number;
  max?: number;
  /** Allowed values for enum fields. */
  allowed?: string[];
  nullable?: boolean;
  /** Field must be unique across records (e.g. email, sku) – enables duplicate tests. */
  unique?: boolean;
  /** Optional explicit valid example. */
  example?: string;
}

export interface EndpointSpec {
  method: HttpMethod;
  path: string;
  authRequired: boolean;
  /** Expected status for a successful call (e.g. 200, 201, 204). */
  successStatus: number;
  /** Status the contract defines for validation errors (400 or 422). */
  validationStatus: 400 | 422;
  fields: FieldSpec[];
  /** Endpoint is expected to reject a repeated identical request (idempotency/uniqueness). */
  duplicateCheck: boolean;
}

export type TestCategory = 'positive' | 'missing-required' | 'invalid-type' | 'invalid-value' | 'empty-null' | 'boundary' | 'invalid-method' | 'auth' | 'content-type' | 'duplicate' | 'error-handling';

export interface TestCase {
  id: string;
  category: TestCategory;
  title: string;
  priority: 'High' | 'Medium' | 'Low';
  preconditions: string[];
  testData: string;
  steps: string[];
  expected: string;
}
