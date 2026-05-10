# Reports & Income

## Income Report: Data Model

The income report is the landlord's most important feature. It derives from billing_cycles, what was charged, joined with payments, what was collected. Never derive income from raw payment records alone because that loses the concept of expected vs received.

## Monthly Income Query Logic

For a given month YYYY-MM:

- total_billed = SUM(amount_due) FROM billing_cycles WHERE billing_month = ?
- total_collected = SUM(amount_paid) FROM payments WHERE billing_cycle_id IN above AND status = 'paid'
- total_outstanding = total_billed - total_collected
- collection_rate = total_collected / total_billed * 100
- tenant_count = COUNT(DISTINCT user_id) FROM billing_cycles WHERE billing_month = ?

## Report API Response Shape

GET /api/owner/reports/income?from=2025-01&to=2025-12

Returns an array of monthly summaries plus per-tenant breakdown.

Each month object:

```json
{
  "month": "2025-01",
  "total_billed": 18500,
  "total_collected": 14000,
  "total_outstanding": 4500,
  "collection_rate": 75.7,
  "tenant_count": 5,
  "tenants": [
    {
      "name": "Tenant Name",
      "room": "Room 101",
      "amount_due": 3500,
      "amount_paid": 3500,
      "status": "paid"
    }
  ]
}
```

Example summary card values from the income report page:

- ₱18,500 Billed this month
- ₱14,000 Collected
- ₱4,500 Outstanding
- 75.7% Collection rate

## Occupancy Report

GET /api/owner/reports/occupancy

Returns:

- total_rooms
- occupied
- available
- archived
- occupancy_rate %

Per-room:

- room_number
- status
- current_tenant name or null
- days_occupied_this_month
- rate

Frontend:

- Donut chart
- Sortable table
- Occupancy rate shown as a large percentage with circular progress ring
