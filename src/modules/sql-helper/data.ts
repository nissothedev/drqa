// Synthetic Demo Shop tables. Results for each example are COMPUTED from these rows,
// so the displayed output always matches the data shown.

export type Cell = string | number | null;
export type Row = Record<string, Cell>;

export interface Table {
  name: string;
  description: string;
  columns: Array<{ name: string; type: string; note?: string }>;
  rows: Row[];
}

export const TABLES: Record<string, Table> = {
  customers: {
    name: 'customers',
    description: 'לקוחות בדויים',
    columns: [
      { name: 'id', type: 'INT', note: 'PK' },
      { name: 'email', type: 'VARCHAR', note: 'nullable' },
      { name: 'full_name', type: 'VARCHAR' },
      { name: 'status', type: 'VARCHAR' },
      { name: 'created_at', type: 'DATE' },
    ],
    rows: [
      { id: 1001, email: 'demo.buyer@example.com', full_name: 'Demo Buyer', status: 'active', created_at: '2026-01-10' },
      { id: 1002, email: 'demo.second@example.com', full_name: 'Demo Second', status: 'active', created_at: '2026-02-14' },
      { id: 1003, email: 'demo.buyer@example.com', full_name: 'Demo Buyer Copy', status: 'active', created_at: '2026-03-01' },
      { id: 1004, email: null, full_name: 'Demo NoMail', status: 'inactive', created_at: '2026-03-05' },
    ],
  },
  products: {
    name: 'products',
    description: 'קטלוג מוצרים בדוי',
    columns: [
      { name: 'id', type: 'INT', note: 'PK' },
      { name: 'sku', type: 'VARCHAR', note: 'UNIQUE' },
      { name: 'name', type: 'VARCHAR' },
      { name: 'price', type: 'DECIMAL(10,2)' },
      { name: 'status', type: 'VARCHAR' },
    ],
    rows: [
      { id: 1001, sku: 'SKU-DS-1001', name: 'Aurora Desk Lamp', price: 49.9, status: 'active' },
      { id: 1002, sku: 'SKU-DS-1002', name: 'Nimbus Wireless Mouse', price: 89, status: 'active' },
      { id: 1003, sku: 'SKU-DS-1003', name: 'Cedar Notebook Set', price: 24.5, status: 'discontinued' },
      { id: 1004, sku: 'SKU-DS-1004', name: 'Pulse Water Bottle', price: 39, status: 'active' },
      { id: 1005, sku: 'SKU-DS-1005', name: 'Orbit USB-C Hub', price: 149, status: 'active' },
    ],
  },
  orders: {
    name: 'orders',
    description: 'הזמנות בדויות',
    columns: [
      { name: 'id', type: 'INT', note: 'PK' },
      { name: 'customer_id', type: 'INT', note: 'FK → customers.id' },
      { name: 'status', type: 'VARCHAR' },
      { name: 'total', type: 'DECIMAL(10,2)', note: 'nullable' },
      { name: 'created_at', type: 'DATE' },
    ],
    rows: [
      { id: 50017, customer_id: 1001, status: 'paid', total: 149.7, created_at: '2026-10-01' },
      { id: 50018, customer_id: 1002, status: 'shipped', total: 149, created_at: '2026-10-02' },
      { id: 50019, customer_id: 1001, status: 'pending', total: 88, created_at: '2026-10-03' },
      { id: 50020, customer_id: 1009, status: 'paid', total: 39, created_at: '2026-10-03' },
      { id: 50021, customer_id: 1004, status: 'cancelled', total: null, created_at: '2026-10-04' },
      { id: 50022, customer_id: 1002, status: 'paid', total: 24.5, created_at: '2026-10-05' },
    ],
  },
  order_items: {
    name: 'order_items',
    description: 'שורות הזמנה',
    columns: [
      { name: 'order_id', type: 'INT', note: 'FK → orders.id' },
      { name: 'sku', type: 'VARCHAR' },
      { name: 'quantity', type: 'INT' },
      { name: 'unit_price', type: 'DECIMAL(10,2)' },
    ],
    rows: [
      { order_id: 50017, sku: 'SKU-DS-1001', quantity: 3, unit_price: 49.9 },
      { order_id: 50018, sku: 'SKU-DS-1005', quantity: 1, unit_price: 149 },
      { order_id: 50019, sku: 'SKU-DS-1002', quantity: 1, unit_price: 89 },
      { order_id: 50020, sku: 'SKU-DS-1004', quantity: 1, unit_price: 39 },
      { order_id: 50021, sku: 'SKU-DS-1001', quantity: 1, unit_price: 49.9 },
    ],
  },
};

const T = TABLES;
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface SqlExample {
  id: string;
  group: string;
  title: string;
  question: string;
  sql: string;
  explanation: string[];
  proves: string;
  doesNotProve: string;
  tables: string[];
  run: () => Row[];
}

export const SQL_EXAMPLES: SqlExample[] = [
  {
    id: 'select',
    group: 'בסיס',
    title: 'SELECT + ORDER BY',
    question: 'אילו מוצרים פעילים קיימים, מהיקר לזול?',
    sql: `SELECT id, sku, name, price
FROM products
WHERE status = 'active'
ORDER BY price DESC;`,
    explanation: ['בוחרים רק את העמודות הנחוצות – לא SELECT *.', 'WHERE מסנן לפי סטטוס; ORDER BY DESC ממיין מהגבוה לנמוך.'],
    proves: 'אילו רשומות קיימות כרגע בטבלה עם הסטטוס הנבחר.',
    doesNotProve: 'שה-API או ה-UI מציגים את אותה רשימה – יש להשוות.',
    tables: ['products'],
    run: () => T.products.rows.filter((r) => r.status === 'active').sort((a, b) => (b.price as number) - (a.price as number)).map(({ id, sku, name, price }) => ({ id, sku, name, price })),
  },
  {
    id: 'where',
    group: 'בסיס',
    title: 'WHERE עם AND / IN',
    question: 'אילו הזמנות של הלקוח 1001 עדיין פתוחות או שולמו?',
    sql: `SELECT id, status, total
FROM orders
WHERE customer_id = 1001
  AND status IN ('paid', 'pending');`,
    explanation: ['IN מקצר רשימת OR.', 'שימו לב לרישיות: \'PAID\' לא שווה ל-\'paid\' ברוב מסדי הנתונים עם collation רגיש.'],
    proves: 'אילו הזמנות תואמות לתנאים ברגע הריצה.',
    doesNotProve: 'מה היה המצב ברגע התקלה – הנתונים עשויים להשתנות.',
    tables: ['orders'],
    run: () => T.orders.rows.filter((r) => r.customer_id === 1001 && ['paid', 'pending'].includes(r.status as string)).map(({ id, status, total }) => ({ id, status, total })),
  },
  {
    id: 'join',
    group: 'JOIN',
    title: 'INNER JOIN',
    question: 'מה האימייל של הלקוח בכל הזמנה?',
    sql: `SELECT o.id AS order_id, o.status, c.email
FROM orders o
INNER JOIN customers c ON c.id = o.customer_id
ORDER BY o.id;`,
    explanation: ['INNER JOIN מחזיר רק הזמנות שיש להן לקוח תואם.', 'שימו לב: הזמנה 50020 נעלמה – הלקוח 1009 לא קיים. INNER JOIN "מסתיר" רשומות יתומות.'],
    proves: 'הקשר בין הזמנות ללקוחות עבור רשומות תקינות.',
    doesNotProve: 'שאין הזמנות יתומות – לשם כך צריך LEFT JOIN.',
    tables: ['orders', 'customers'],
    run: () =>
      T.orders.rows
        .flatMap((o) => T.customers.rows.filter((c) => c.id === o.customer_id).map((c) => ({ order_id: o.id, status: o.status, email: c.email })))
        .sort((a, b) => (a.order_id as number) - (b.order_id as number)),
  },
  {
    id: 'orphans',
    group: 'JOIN',
    title: 'LEFT JOIN לאיתור רשומות יתומות',
    question: 'האם יש הזמנות שמצביעות על לקוח שלא קיים?',
    sql: `SELECT o.id AS order_id, o.customer_id
FROM orders o
LEFT JOIN customers c ON c.id = o.customer_id
WHERE c.id IS NULL;`,
    explanation: ['LEFT JOIN שומר את כל ההזמנות; כשאין לקוח תואם, עמודות c יהיו NULL.', 'WHERE c.id IS NULL משאיר רק את היתומות.'],
    proves: 'שקיימות כרגע הזמנות ללא לקוח תואם.',
    doesNotProve: 'איך הן נוצרו – ייתכן ייבוא, מחיקה של לקוח או באג בכתיבה.',
    tables: ['orders', 'customers'],
    run: () => T.orders.rows.filter((o) => !T.customers.rows.some((c) => c.id === o.customer_id)).map((o) => ({ order_id: o.id, customer_id: o.customer_id })),
  },
  {
    id: 'no-items',
    group: 'JOIN',
    title: 'הזמנות ללא שורות',
    question: 'האם יש הזמנות בלי אף פריט?',
    sql: `SELECT o.id AS order_id, o.status, o.total
FROM orders o
LEFT JOIN order_items i ON i.order_id = o.id
WHERE i.order_id IS NULL;`,
    explanation: ['אותה טכניקה – LEFT JOIN + IS NULL – לכיוון השני של הקשר.'],
    proves: 'אילו הזמנות חסרות שורות פריטים כרגע.',
    doesNotProve: 'שזה באג – ייתכן שהזמנה בתהליך יצירה. בדקו מול הדרישה.',
    tables: ['orders', 'order_items'],
    run: () => T.orders.rows.filter((o) => !T.order_items.rows.some((i) => i.order_id === o.id)).map(({ id, status, total }) => ({ order_id: id, status, total })),
  },
  {
    id: 'group',
    group: 'קיבוץ',
    title: 'GROUP BY + COUNT',
    question: 'כמה הזמנות יש בכל סטטוס?',
    sql: `SELECT status, COUNT(*) AS orders_count
FROM orders
GROUP BY status
ORDER BY orders_count DESC, status;`,
    explanation: ['COUNT(*) סופר שורות; COUNT(column) מדלג על NULL.', 'כל עמודה ב-SELECT שאינה פונקציית צבירה חייבת להופיע ב-GROUP BY.'],
    proves: 'התפלגות הסטטוסים הנוכחית.',
    doesNotProve: 'שהסטטוסים נכונים עסקית עבור כל הזמנה.',
    tables: ['orders'],
    run: () => {
      const m = new Map<string, number>();
      for (const o of T.orders.rows) m.set(o.status as string, (m.get(o.status as string) ?? 0) + 1);
      return [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([status, orders_count]) => ({ status, orders_count }));
    },
  },
  {
    id: 'nulls',
    group: 'NULL',
    title: 'בדיקת NULL',
    question: 'לאילו לקוחות אין אימייל?',
    sql: `SELECT id, full_name
FROM customers
WHERE email IS NULL;`,
    explanation: ['NULL אינו ערך – אי אפשר להשוות אליו עם = NULL (התוצאה תמיד UNKNOWN).', 'NULL שונה ממחרוזת ריקה \'\'. כדאי לבדוק את שתיהן כשמחפשים "חסר".'],
    proves: 'אילו רשומות חסרות ערך בעמודה.',
    doesNotProve: 'שהחוסר הוא באג – ייתכן שהשדה אופציונלי לפי הדרישה.',
    tables: ['customers'],
    run: () => T.customers.rows.filter((c) => c.email === null).map(({ id, full_name }) => ({ id, full_name })),
  },
  {
    id: 'dupes',
    group: 'כפילויות',
    title: 'איתור כפילויות עם HAVING',
    question: 'האם יש כתובות אימייל כפולות?',
    sql: `SELECT email, COUNT(*) AS occurrences
FROM customers
WHERE email IS NOT NULL
GROUP BY email
HAVING COUNT(*) > 1;`,
    explanation: ['HAVING מסנן אחרי הקיבוץ (WHERE מסנן לפני).', 'בדיקת כפילויות לפי ערך מנורמל (LOWER/TRIM) עשויה לחשוף עוד מקרים.'],
    proves: 'שקיימים ערכים כפולים בעמודה.',
    doesNotProve: 'איזו רשומה "נכונה" ואיזו כפולה – נדרשת חקירה של זמני יצירה ומקור.',
    tables: ['customers'],
    run: () => {
      const m = new Map<string, number>();
      for (const c of T.customers.rows) if (c.email !== null) m.set(c.email as string, (m.get(c.email as string) ?? 0) + 1);
      return [...m.entries()].filter(([, n]) => n > 1).map(([email, occurrences]) => ({ email, occurrences }));
    },
  },
  {
    id: 'reconcile',
    group: 'התאמת נתונים',
    title: 'השוואת סכום הזמנה לסכום שורות',
    question: 'האם total של ההזמנה תואם לסכום הפריטים?',
    sql: `SELECT o.id AS order_id,
       o.total,
       SUM(i.quantity * i.unit_price) AS items_total
FROM orders o
JOIN order_items i ON i.order_id = o.id
GROUP BY o.id, o.total
HAVING o.total IS NULL
    OR o.total <> SUM(i.quantity * i.unit_price);`,
    explanation: ['בדיקת עקביות בין טבלאות – כלי מרכזי לבאגי נתונים.', 'כש-total הוא NULL, ההשוואה <> מחזירה UNKNOWN – לכן IS NULL נבדק במפורש.', 'בעולם האמיתי: היזהרו מעיגול עשרוני ומהנחות/משלוח שאינם בשורות.'],
    proves: 'אילו הזמנות אינן עקביות לפי הכלל שבשאילתה.',
    doesNotProve: 'שהכלל עצמו מלא – הנחות, מע״מ ודמי משלוח עשויים להסביר פער.',
    tables: ['orders', 'order_items'],
    run: () =>
      T.orders.rows
        .map((o) => {
          const items = T.order_items.rows.filter((i) => i.order_id === o.id);
          if (!items.length) return null;
          const sum = round2(items.reduce((s, i) => s + (i.quantity as number) * (i.unit_price as number), 0));
          return { order_id: o.id, total: o.total, items_total: sum };
        })
        .filter((r): r is { order_id: Cell; total: Cell; items_total: number } => !!r && (r.total === null || round2(r.total as number) !== r.items_total)),
  },
];
