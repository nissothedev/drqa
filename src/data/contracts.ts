import type { Schema } from '../utils/schemaValidator';

/**
 * Synthetic Demo Shop API contracts. Fictional – used by Request Lab, Contract Validator and examples.
 */

export const CREATE_ORDER_SCHEMA: Schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'CreateOrderRequest',
  description: 'Demo Shop – POST /v1/orders request body (fictional)',
  type: 'object',
  required: ['customerId', 'items', 'shippingAddress'],
  additionalProperties: false,
  properties: {
    customerId: { type: 'string', pattern: '^CUS-\\d{4}$' },
    items: {
      type: 'array',
      minItems: 1,
      maxItems: 20,
      items: {
        type: 'object',
        required: ['sku', 'quantity'],
        additionalProperties: false,
        properties: {
          sku: { type: 'string', pattern: '^SKU-DS-\\d{4}$' },
          quantity: { type: 'integer', minimum: 1, maximum: 10 },
        },
      },
    },
    shippingAddress: {
      type: 'object',
      required: ['street', 'city', 'zip'],
      additionalProperties: false,
      properties: {
        street: { type: 'string', minLength: 3, maxLength: 80 },
        city: { type: 'string', minLength: 2, maxLength: 40 },
        zip: { type: 'string', pattern: '^\\d{5,7}$' },
      },
    },
    couponCode: { type: ['string', 'null'], pattern: '^[A-Z0-9]{4,12}$' },
    notes: { type: 'string', maxLength: 200 },
  },
};

export const PRODUCT_SCHEMA: Schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Product',
  description: 'Demo Shop – GET /v1/products/{id} response (fictional)',
  type: 'object',
  required: ['id', 'sku', 'name', 'price', 'currency', 'stock', 'status'],
  additionalProperties: false,
  properties: {
    id: { type: 'integer', minimum: 1 },
    sku: { type: 'string', pattern: '^SKU-DS-\\d{4}$' },
    name: { type: 'string', minLength: 1, maxLength: 120 },
    category: { type: 'string', enum: ['lighting', 'accessories', 'stationery', 'lifestyle', 'electronics'] },
    price: { type: 'number', exclusiveMinimum: 0, multipleOf: 0.01 },
    currency: { type: 'string', enum: ['ILS', 'USD', 'EUR'] },
    stock: { type: 'integer', minimum: 0 },
    status: { type: 'string', enum: ['active', 'discontinued'] },
    tags: { type: 'array', items: { type: 'string' }, uniqueItems: true },
  },
};

export const ORDER_SCHEMA: Schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'Order',
  description: 'Demo Shop – GET /v1/orders/{id} response (fictional)',
  type: 'object',
  required: ['orderId', 'customerId', 'status', 'items', 'total', 'currency', 'createdAt'],
  additionalProperties: false,
  properties: {
    orderId: { type: 'string', pattern: '^ORD-\\d{5}$' },
    customerId: { type: 'string', pattern: '^CUS-\\d{4}$' },
    status: { type: 'string', enum: ['pending', 'paid', 'shipped', 'delivered', 'cancelled'] },
    items: {
      type: 'array',
      items: {
        type: 'object',
        required: ['sku', 'quantity', 'unitPrice'],
        properties: {
          sku: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 },
          unitPrice: { type: 'number', minimum: 0 },
        },
      },
    },
    total: { type: 'number', minimum: 0 },
    currency: { type: 'string', enum: ['ILS', 'USD', 'EUR'] },
    createdAt: { type: 'string', format: 'date-time' },
  },
};

export const USER_SCHEMA: Schema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'UserProfile',
  description: 'Demo Shop – GET /v1/me response (fictional)',
  type: 'object',
  required: ['userId', 'email', 'displayName', 'role'],
  properties: {
    userId: { type: 'string', pattern: '^CUS-\\d{4}$' },
    email: { type: 'string', format: 'email' },
    displayName: { type: 'string', minLength: 2, maxLength: 50 },
    role: { type: 'string', enum: ['customer', 'admin'] },
    marketingOptIn: { type: 'boolean' },
    lastLoginAt: { type: ['string', 'null'], format: 'date-time' },
  },
};

export interface ContractDef {
  id: string;
  title: string;
  endpoint: string;
  method: string;
  kind: 'request' | 'response';
  schema: Schema;
  samples: Array<{ id: string; label: string; payload: unknown; expectValid: boolean }>;
}

export const CONTRACTS: ContractDef[] = [
  {
    id: 'create-order',
    title: 'יצירת הזמנה',
    endpoint: '/v1/orders',
    method: 'POST',
    kind: 'request',
    schema: CREATE_ORDER_SCHEMA,
    samples: [
      {
        id: 'valid',
        label: 'הזמנה תקינה',
        expectValid: true,
        payload: { customerId: 'CUS-1001', items: [{ sku: 'SKU-DS-1001', quantity: 2 }], shippingAddress: { street: '12 Example St', city: 'Demo City', zip: '6100001' }, couponCode: null },
      },
      {
        id: 'broken',
        label: 'שדה חסר + טיפוס שגוי',
        expectValid: false,
        payload: { customerId: 'CUS-1001', items: [{ sku: 'SKU-DS-1001', quantity: '2' }], shipping_address: { street: '12 Example St', city: 'Demo City', zip: '6100001' } },
      },
      {
        id: 'boundaries',
        label: 'ערכי גבול חורגים',
        expectValid: false,
        payload: { customerId: 'CUS-12', items: [{ sku: 'SKU-DS-1001', quantity: 0 }, { sku: 'SKU-DS-1004', quantity: 11 }], shippingAddress: { street: 'A', city: 'Demo City', zip: 'ABC' }, notes: '' },
      },
    ],
  },
  {
    id: 'product',
    title: 'מוצר',
    endpoint: '/v1/products/{id}',
    method: 'GET',
    kind: 'response',
    schema: PRODUCT_SCHEMA,
    samples: [
      { id: 'valid', label: 'תגובה תקינה', expectValid: true, payload: { id: 1001, sku: 'SKU-DS-1001', name: 'Aurora Desk Lamp', category: 'lighting', price: 49.9, currency: 'ILS', stock: 34, status: 'active', tags: ['desk', 'led'] } },
      { id: 'drift', label: 'Contract drift', expectValid: false, payload: { id: '1001', sku: 'SKU-DS-1001', name: 'Aurora Desk Lamp', category: 'Lighting', price: '49.90', currency: 'ILS', stock: -1, status: 'active', discount: 0 } },
    ],
  },
  {
    id: 'order',
    title: 'הזמנה',
    endpoint: '/v1/orders/{id}',
    method: 'GET',
    kind: 'response',
    schema: ORDER_SCHEMA,
    samples: [
      {
        id: 'valid',
        label: 'תגובה תקינה',
        expectValid: true,
        payload: { orderId: 'ORD-50017', customerId: 'CUS-1001', status: 'paid', items: [{ sku: 'SKU-DS-1001', quantity: 3, unitPrice: 49.9 }], total: 149.7, currency: 'ILS', createdAt: '2026-10-01T09:30:00Z' },
      },
      { id: 'null-items', label: 'items = null, total כמחרוזת', expectValid: false, payload: { orderId: 'ORD-50017', customerId: 'CUS-1001', status: 'PAID', items: null, total: '149.70', currency: 'ILS', createdAt: '01/10/2026' } },
    ],
  },
  {
    id: 'user',
    title: 'פרופיל משתמש',
    endpoint: '/v1/me',
    method: 'GET',
    kind: 'response',
    schema: USER_SCHEMA,
    samples: [
      { id: 'valid', label: 'תגובה תקינה', expectValid: true, payload: { userId: 'CUS-1001', email: 'demo.buyer@example.com', displayName: 'Demo Buyer', role: 'customer', marketingOptIn: false, lastLoginAt: null } },
      { id: 'invalid', label: 'אימייל ותפקיד שגויים', expectValid: false, payload: { userId: 'CUS-1001', email: 'demo.buyer(at)example', displayName: 'D', role: 'superuser' } },
    ],
  },
];
