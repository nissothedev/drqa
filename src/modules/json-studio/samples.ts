// Fictional Demo Shop payloads used as one-click samples.

export const SAMPLE_PRODUCT = `{
  "id": 1001,
  "sku": "SKU-DS-1001",
  "name": "Aurora Desk Lamp",
  "price": 49.9,
  "currency": "ILS",
  "stock": 34,
  "tags": ["desk", "led"],
  "dimensions": { "heightCm": 42, "weightKg": 1.2 },
  "discontinued": false,
  "supplier": null
}`;

export const SAMPLE_BROKEN = `{
  "id": 1001,
  'name': "Aurora Desk Lamp",
  "price": 49.9,
  "tags": ["desk", "led",],
}`;

export const SAMPLE_EXPECTED = `{
  "orderId": "ORD-50017",
  "status": "paid",
  "total": 149.7,
  "currency": "ILS",
  "items": [
    { "sku": "SKU-DS-1001", "quantity": 3, "unitPrice": 49.9 }
  ],
  "customer": { "id": "CUS-1001", "tier": "standard" },
  "couponCode": null
}`;

export const SAMPLE_ACTUAL = `{
  "orderId": "ORD-50017",
  "status": "PAID",
  "total": "149.70",
  "currency": "ILS",
  "items": [
    { "sku": "SKU-DS-1001", "quantity": 3, "unitPrice": 49.9 },
    { "sku": "SKU-DS-1004", "quantity": 1, "unitPrice": 39 }
  ],
  "customer": { "id": "CUS-1001" },
  "shippedAt": "2026-10-02T08:00:00Z"
}`;
