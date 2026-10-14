// Illustrative examples against a fictional Demo Shop (shop.example.com). Not runnable against a real site.

export type Framework = 'selenium' | 'playwright';

export interface Topic {
  id: string;
  title: string;
  summary: string;
  do: string[];
  dont: string[];
  code: Record<Framework, { lang: 'python' | 'ts'; file: string; code: string; notes: string[] }>;
}

export const TOPICS: Topic[] = [
  {
    id: 'locators',
    title: 'לוקייטורים יציבים',
    summary: 'בחירת לוקייטור היא ההחלטה שהכי משפיעה על יציבות הבדיקה. העדיפו מזהים ייעודיים לבדיקות ותפקידים נגישים על פני XPath שביר.',
    do: ['data-testid / data-qa ייעודיים', 'תפקיד נגיש + שם (getByRole)', 'טקסט גלוי כשהוא יציב'],
    dont: ['XPath מוחלט (/html/body/div[3]/...)', 'class של עיצוב (btn-blue-2)', 'אינדקס מיקום (nth-child) כשאפשר אחרת'],
    code: {
      selenium: {
        lang: 'python',
        file: 'locators_example.py',
        notes: ['By.CSS_SELECTOR עם data-testid יציב יותר מ-XPath.', 'XPath לפי טקסט – רק כשאין חלופה.'],
        code: `from selenium.webdriver.common.by import By

# Preferred: dedicated test attribute
PLACE_ORDER = (By.CSS_SELECTOR, "[data-testid='place-order']")

# Acceptable: stable, meaningful attribute
EMAIL_INPUT = (By.NAME, "email")

# Last resort: text-based XPath (breaks on copy changes / translations)
CHECKOUT_LINK = (By.XPATH, "//a[normalize-space()='Checkout']")

# Avoid: absolute / positional XPath
# BAD = (By.XPATH, "/html/body/div[2]/main/div[3]/button[1]")`,
      },
      playwright: {
        lang: 'ts',
        file: 'locators.spec.ts',
        notes: ['getByRole משקף את האופן שבו משתמש (וקורא מסך) רואה את הדף.', 'getByTestId מוגדר כברירת מחדל לתכונה data-testid.'],
        code: `import { test, expect } from '@playwright/test';

test('locator strategies (illustrative)', async ({ page }) => {
  await page.goto('https://shop.example.com/checkout');

  // Preferred: accessible role + name
  const placeOrder = page.getByRole('button', { name: 'Place order' });

  // Good: dedicated test id
  const total = page.getByTestId('order-total');

  // Avoid: brittle CSS / XPath tied to layout
  // page.locator('div > div:nth-child(3) > button');

  await expect(placeOrder).toBeEnabled();
  await expect(total).toHaveText(/₪/);
});`,
      },
    },
  },
  {
    id: 'waits',
    title: 'המתנות',
    summary: 'רוב הבדיקות הלא-יציבות (flaky) נובעות מהמתנה שגויה. המתינו לתנאי – לא לזמן.',
    do: ['Explicit wait לתנאי ספציפי', 'Auto-waiting מובנה (Playwright)', 'המתנה לתגובת רשת רלוונטית כשצריך'],
    dont: ['time.sleep / waitForTimeout קבועים', 'ערבוב implicit ו-explicit waits ב-Selenium', 'הגדלת timeout כפתרון ל-flakiness'],
    code: {
      selenium: {
        lang: 'python',
        file: 'waits_example.py',
        notes: ['WebDriverWait בודק את התנאי שוב ושוב עד שהוא מתקיים או שהזמן נגמר.', 'אל תשלבו implicitly_wait עם WebDriverWait – הזמנים מצטברים בצורה לא צפויה.'],
        code: `from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.by import By

def place_order(driver):
    wait = WebDriverWait(driver, timeout=10)

    button = wait.until(EC.element_to_be_clickable((By.CSS_SELECTOR, "[data-testid='place-order']")))
    button.click()

    # Wait for the outcome, not for a fixed amount of time
    confirmation = wait.until(EC.visibility_of_element_located((By.CSS_SELECTOR, "[data-testid='order-confirmation']")))
    return confirmation.text

# Avoid:
# import time; time.sleep(5)`,
      },
      playwright: {
        lang: 'ts',
        file: 'waits.spec.ts',
        notes: ['פעולות ו-expect ב-Playwright ממתינים אוטומטית.', 'waitForResponse מאפשר לקשור את הבדיקה לבקשת ה-API שמעניינת אתכם.'],
        code: `import { test, expect } from '@playwright/test';

test('wait for the order API, then the UI', async ({ page }) => {
  await page.goto('https://shop.example.com/checkout');

  const orderResponse = page.waitForResponse(
    (r) => r.url().endsWith('/v1/orders') && r.request().method() === 'POST',
  );
  await page.getByRole('button', { name: 'Place order' }).click();

  const response = await orderResponse;
  expect(response.status()).toBe(201);

  // Web-first assertion retries until it passes or times out
  await expect(page.getByTestId('order-confirmation')).toBeVisible();

  // Avoid: await page.waitForTimeout(5000);
});`,
      },
    },
  },
  {
    id: 'assertions',
    title: 'אסרציות',
    summary: 'אסרציה טובה בודקת התנהגות משמעותית, נכשלת עם הודעה ברורה, ולא תלויה בפרטים לא רלוונטיים.',
    do: ['אסרציה על תוצאה עסקית (סכום, סטטוס)', 'הודעת כשל שמסבירה מה צפוי', 'אסרציות מרובות רק כשהן חלק מאותה התנהגות'],
    dont: ['assert True / בדיקה שתמיד עוברת', 'השוואת HTML שלם', 'אסרציה רק על "אין exception"'],
    code: {
      selenium: {
        lang: 'python',
        file: 'test_cart_total.py',
        notes: ['pytest מציג את הערכים בפועל כשה-assert נכשל.', 'השוו ערכים מנורמלים – לא מחרוזות עם עיצוב.'],
        code: `from decimal import Decimal

def parse_price(text: str) -> Decimal:
    return Decimal(text.replace("₪", "").replace(",", "").strip())

def test_cart_total_matches_items(cart_page):
    items = cart_page.item_prices()          # e.g. [Decimal("49.90"), Decimal("39.00")]
    total = parse_price(cart_page.total_text())

    assert total == sum(items), f"Cart total {total} != sum of items {sum(items)}"`,
      },
      playwright: {
        lang: 'ts',
        file: 'cart.spec.ts',
        notes: ['expect(locator) ממתין; expect(value) בודק מיד.', 'expect.soft ממשיך אחרי כשל ומדווח הכל בסוף.'],
        code: `import { test, expect } from '@playwright/test';

test('cart shows the correct total', async ({ page }) => {
  await page.goto('https://shop.example.com/cart');

  await expect(page.getByTestId('cart-item')).toHaveCount(2);
  await expect(page.getByTestId('cart-total')).toHaveText('₪88.90');

  // Soft assertions collect several independent checks
  await expect.soft(page.getByTestId('shipping-note')).toContainText('Free shipping');
});`,
      },
    },
  },
  {
    id: 'fixtures',
    title: 'Fixtures',
    summary: 'Fixtures מרכזים הכנה וניקוי (driver, משתמש בדיקה, נתונים) ומונעים שכפול בין בדיקות.',
    do: ['fixture לכל משאב עם setup ו-teardown', 'נתוני בדיקה בדויים וייחודיים לכל ריצה', 'scope מתאים (function / session)'],
    dont: ['תלות בין בדיקות (בדיקה B מניחה ש-A רצה)', 'משתמש בדיקה משותף שכל הבדיקות משנות', 'סודות אמיתיים בקוד'],
    code: {
      selenium: {
        lang: 'python',
        file: 'conftest.py',
        notes: ['yield מפריד בין setup ל-teardown.', 'קחו פרטי גישה ממשתני סביבה – לא מהקוד.'],
        code: `import os
import pytest
from selenium import webdriver
from pages.login_page import LoginPage

@pytest.fixture
def driver():
    options = webdriver.ChromeOptions()
    options.add_argument("--headless=new")
    drv = webdriver.Chrome(options=options)
    yield drv
    drv.quit()

@pytest.fixture
def base_url() -> str:
    return os.environ.get("DEMO_BASE_URL", "https://shop.example.com")

@pytest.fixture
def logged_in(driver, base_url):
    driver.get(f"{base_url}/login")
    # Credentials come from the environment, never from source control
    LoginPage(driver).login(os.environ["DEMO_USER"], os.environ["DEMO_PASSWORD"])
    return driver`,
      },
      playwright: {
        lang: 'ts',
        file: 'fixtures.ts',
        notes: ['test.extend מוסיף fixtures מוקלדים.', 'storageState מאפשר לשמור התחברות ולחסוך זמן.'],
        code: `import { test as base, expect } from '@playwright/test';
import { CheckoutPage } from './pages/CheckoutPage';

type Fixtures = { checkout: CheckoutPage };

export const test = base.extend<Fixtures>({
  checkout: async ({ page }, use) => {
    const checkout = new CheckoutPage(page);
    await checkout.open();
    await use(checkout);          // test runs here
    // teardown (if needed) goes after use()
  },
});

export { expect };`,
      },
    },
  },
  {
    id: 'pom',
    title: 'Page Object Model',
    summary: 'POM מרכז לוקייטורים ופעולות של עמוד במחלקה אחת. הבדיקות מתארות "מה", ה-Page Object מכיל "איך".',
    do: ['מתודות בשפה עסקית (place_order)', 'לוקייטורים פרטיים בתוך המחלקה', 'החזרת Page Object של העמוד הבא'],
    dont: ['אסרציות בתוך ה-Page Object (מלבד בדיקת טעינה)', 'מחלקת "God page" לכל האתר', 'חשיפת WebElements גולמיים לבדיקות'],
    code: {
      selenium: {
        lang: 'python',
        file: 'pages/checkout_page.py',
        notes: ['הבדיקה לא יודעת איך הכפתור מאותר – רק מה הוא עושה.', 'שינוי ב-UI מתוקן במקום אחד.'],
        code: `from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from pages.order_confirmation_page import OrderConfirmationPage

class CheckoutPage:
    _ZIP = (By.NAME, "zip")
    _PLACE_ORDER = (By.CSS_SELECTOR, "[data-testid='place-order']")
    _ERROR = (By.CSS_SELECTOR, "[data-testid='form-error']")

    def __init__(self, driver, timeout: int = 10):
        self.driver = driver
        self.wait = WebDriverWait(driver, timeout)

    def fill_zip(self, zip_code: str) -> "CheckoutPage":
        field = self.wait.until(EC.visibility_of_element_located(self._ZIP))
        field.clear()
        field.send_keys(zip_code)
        return self

    def place_order(self) -> "OrderConfirmationPage":
        self.wait.until(EC.element_to_be_clickable(self._PLACE_ORDER)).click()
        return OrderConfirmationPage(self.driver)

    def error_text(self) -> str:
        return self.wait.until(EC.visibility_of_element_located(self._ERROR)).text

# tests/test_checkout.py
def test_order_requires_zip(logged_in):
    page = CheckoutPage(logged_in).fill_zip("")
    page.place_order()
    assert "zip" in page.error_text().lower()`,
      },
      playwright: {
        lang: 'ts',
        file: 'pages/CheckoutPage.ts',
        notes: ['Locators נוצרים פעם אחת ונבדקים בזמן השימוש (lazy).', 'הבדיקה קריאה כמו תרחיש עסקי.'],
        code: `import { type Page, type Locator } from '@playwright/test';

export class CheckoutPage {
  private readonly zip: Locator;
  private readonly placeOrderButton: Locator;
  readonly formError: Locator;

  constructor(private readonly page: Page) {
    this.zip = page.getByLabel('Zip code');
    this.placeOrderButton = page.getByRole('button', { name: 'Place order' });
    this.formError = page.getByTestId('form-error');
  }

  async open() {
    await this.page.goto('https://shop.example.com/checkout');
  }

  async fillZip(value: string) {
    await this.zip.fill(value);
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }
}

// checkout.spec.ts
// test('order requires zip', async ({ checkout }) => {
//   await checkout.fillZip('');
//   await checkout.placeOrder();
//   await expect(checkout.formError).toContainText(/zip/i);
// });`,
      },
    },
  },
  {
    id: 'api',
    title: 'בדיקות API',
    summary: 'בדיקות API מהירות ויציבות יותר מ-UI. בדקו סטטוס, מבנה (חוזה) וערכים – והשתמשו ב-API גם להכנת נתונים לבדיקות UI.',
    do: ['אסרציה על סטטוס + גוף', 'אימות סכמה לתגובה', 'הכנת נתונים דרך API לפני בדיקת UI'],
    dont: ['בדיקת סטטוס בלבד', 'תלות בסדר שדות ב-JSON', 'טוקנים אמיתיים בקוד או בלוגים'],
    code: {
      selenium: {
        lang: 'python',
        file: 'test_orders_api.py',
        notes: ['requests + pytest – פשוט וקריא.', 'jsonschema מאמת את התגובה מול החוזה.'],
        code: `import os
import requests
from jsonschema import validate

BASE = os.environ.get("DEMO_API", "https://api.example.com/v1")
HEADERS = {"Authorization": f"Bearer {os.environ['DEMO_TOKEN']}"}

ORDER_SCHEMA = {
    "type": "object",
    "required": ["orderId", "status", "total"],
    "properties": {
        "orderId": {"type": "string", "pattern": "^ORD-\\\\d{5}$"},
        "status": {"enum": ["pending", "paid", "shipped", "delivered", "cancelled"]},
        "total": {"type": "number", "minimum": 0},
    },
}

def test_create_order_missing_zip_returns_422():
    body = {"customerId": "CUS-1001", "items": [{"sku": "SKU-DS-1001", "quantity": 1}],
            "shippingAddress": {"street": "12 Example St", "city": "Demo City"}}
    r = requests.post(f"{BASE}/orders", json=body, headers=HEADERS, timeout=10)

    assert r.status_code == 422, r.text
    fields = [e["field"] for e in r.json()["errors"]]
    assert "shippingAddress.zip" in fields

def test_get_order_matches_contract():
    r = requests.get(f"{BASE}/orders/ORD-50017", headers=HEADERS, timeout=10)
    assert r.status_code == 200
    validate(instance=r.json(), schema=ORDER_SCHEMA)`,
      },
      playwright: {
        lang: 'ts',
        file: 'orders.api.spec.ts',
        notes: ['request fixture שולח בקשות HTTP בלי דפדפן.', 'extraHTTPHeaders בקונפיגורציה מונע שכפול כותרות.'],
        code: `import { test, expect } from '@playwright/test';

test.use({
  baseURL: process.env.DEMO_API ?? 'https://api.example.com',
  extraHTTPHeaders: { Authorization: \`Bearer \${process.env.DEMO_TOKEN}\` },
});

test('missing zip is rejected with a field error', async ({ request }) => {
  const res = await request.post('/v1/orders', {
    data: {
      customerId: 'CUS-1001',
      items: [{ sku: 'SKU-DS-1001', quantity: 1 }],
      shippingAddress: { street: '12 Example St', city: 'Demo City' },
    },
  });

  expect(res.status()).toBe(422);
  const body = await res.json();
  expect(body.errors).toEqual(
    expect.arrayContaining([expect.objectContaining({ field: 'shippingAddress.zip' })]),
  );
});`,
      },
    },
  },
];
