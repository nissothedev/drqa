import type { HttpMethod } from '../../data/http';
import { MOCK_BASE, type AuthMode, type KeyValue } from './mockApi';

export interface LabPreset {
  id: string;
  label: string;
  expect: number;
  group: 'success' | 'client' | 'auth' | 'server' | 'network';
  method: HttpMethod;
  url: string;
  params?: KeyValue[];
  headers?: KeyValue[];
  body?: string;
  auth: AuthMode;
}

const JSON_CT: KeyValue = { key: 'Content-Type', value: 'application/json', enabled: true };
const ACCEPT: KeyValue = { key: 'Accept', value: 'application/json', enabled: true };

const VALID_ORDER = `{
  "customerId": "CUS-1001",
  "items": [
    { "sku": "SKU-DS-1001", "quantity": 2 }
  ],
  "shippingAddress": {
    "street": "12 Example St",
    "city": "Demo City",
    "zip": "6100001"
  }
}`;

export const PRESETS: LabPreset[] = [
  { id: 'products-list', label: 'רשימת מוצרים', expect: 200, group: 'success', method: 'GET', url: `${MOCK_BASE}/products`, params: [{ key: 'limit', value: '3', enabled: true }], headers: [ACCEPT], auth: 'none' },
  { id: 'order-valid', label: 'יצירת הזמנה תקינה', expect: 201, group: 'success', method: 'POST', url: `${MOCK_BASE}/orders`, headers: [JSON_CT], body: VALID_ORDER, auth: 'customer' },
  { id: 'product-404', label: 'מוצר שלא קיים', expect: 404, group: 'client', method: 'GET', url: `${MOCK_BASE}/products/9999`, headers: [ACCEPT], auth: 'none' },
  {
    id: 'order-missing-field',
    label: 'הזמנה עם שדה חובה חסר',
    expect: 422,
    group: 'client',
    method: 'POST',
    url: `${MOCK_BASE}/orders`,
    headers: [JSON_CT],
    body: `{
  "customerId": "CUS-1001",
  "items": [
    { "sku": "SKU-DS-1001", "quantity": "2" }
  ]
}`,
    auth: 'customer',
  },
  {
    id: 'order-invalid-json',
    label: 'JSON לא תקין (פסיק מיותר)',
    expect: 400,
    group: 'client',
    method: 'POST',
    url: `${MOCK_BASE}/orders`,
    headers: [JSON_CT],
    body: `{
  "customerId": "CUS-1001",
  "items": [{ "sku": "SKU-DS-1001", "quantity": 2 }],
}`,
    auth: 'customer',
  },
  { id: 'order-content-type', label: 'Content-Type שגוי', expect: 415, group: 'client', method: 'POST', url: `${MOCK_BASE}/orders`, headers: [{ key: 'Content-Type', value: 'text/plain', enabled: true }], body: VALID_ORDER, auth: 'customer' },
  { id: 'products-405', label: 'שיטה לא מותרת', expect: 405, group: 'client', method: 'DELETE', url: `${MOCK_BASE}/products`, auth: 'admin' },
  {
    id: 'order-stock',
    label: 'מלאי לא מספיק',
    expect: 409,
    group: 'client',
    method: 'POST',
    url: `${MOCK_BASE}/orders`,
    headers: [JSON_CT],
    body: VALID_ORDER.replace('SKU-DS-1001', 'SKU-DS-1002').replace('"quantity": 2', '"quantity": 1'),
    auth: 'customer',
  },
  { id: 'order-duplicate', label: 'בקשה כפולה (Idempotency)', expect: 409, group: 'client', method: 'POST', url: `${MOCK_BASE}/orders`, headers: [JSON_CT, { key: 'Idempotency-Key', value: 'demo-dup-key', enabled: true }], body: VALID_ORDER, auth: 'customer' },
  { id: 'orders-401', label: 'endpoint מוגן ללא אימות', expect: 401, group: 'auth', method: 'GET', url: `${MOCK_BASE}/orders`, headers: [ACCEPT], auth: 'none' },
  { id: 'orders-expired', label: 'טוקן שפג תוקפו', expect: 401, group: 'auth', method: 'GET', url: `${MOCK_BASE}/orders`, headers: [ACCEPT], auth: 'expired' },
  { id: 'product-403', label: 'לקוח מנסה למחוק מוצר', expect: 403, group: 'auth', method: 'DELETE', url: `${MOCK_BASE}/products/1001`, auth: 'customer' },
  { id: 'rate-429', label: 'חריגה ממגבלת קצב', expect: 429, group: 'auth', method: 'GET', url: `${MOCK_BASE}/products`, headers: [{ key: 'X-Demo-Simulate', value: '429', enabled: true }], auth: 'none' },
  { id: 'report-500', label: 'קלט שגורם ל-500', expect: 500, group: 'server', method: 'GET', url: `${MOCK_BASE}/reports/sales`, params: [{ key: 'from', value: '01/10/2026', enabled: true }], auth: 'admin' },
  { id: 'gateway-502', label: 'Bad Gateway', expect: 502, group: 'server', method: 'GET', url: `${MOCK_BASE}/products`, headers: [{ key: 'X-Demo-Simulate', value: '502', enabled: true }], auth: 'none' },
  { id: 'reco-503', label: 'שירות בתחזוקה', expect: 503, group: 'server', method: 'GET', url: `${MOCK_BASE}/recommendations`, auth: 'none' },
  { id: 'search-504', label: 'חיפוש רחב מדי (504)', expect: 504, group: 'server', method: 'GET', url: `${MOCK_BASE}/search`, params: [{ key: 'q', value: '*', enabled: true }], auth: 'none' },
  { id: 'dns', label: 'שגיאת כתיב בשם המארח', expect: 0, group: 'network', method: 'GET', url: 'https://api.exmaple.com/v1/products', auth: 'none' },
  { id: 'client-timeout', label: 'Timeout בצד הלקוח', expect: 0, group: 'network', method: 'GET', url: `${MOCK_BASE}/products`, headers: [{ key: 'X-Demo-Simulate', value: 'timeout', enabled: true }], auth: 'none' },
];

export const PRESET_GROUP_LABEL: Record<LabPreset['group'], string> = {
  success: 'הצלחה',
  client: 'שגיאות בקשה',
  auth: 'אימות, הרשאות וקצב',
  server: 'צד שרת',
  network: 'רשת',
};
