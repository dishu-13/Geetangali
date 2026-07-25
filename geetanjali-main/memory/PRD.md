# Luxury Salon Suite (LSS) — PRD

## Original Problem Statement
Agentic Middleware for luxury Indian family salon business (Geetanjali). Software prepares data (POS import, incentive calculation, inventory planning, quality flags) but ALWAYS requires human confirmation for final actions ("Confirm Payout", "Approve PO", etc.).

## User Personas
- **Owner** — Sees Working Capital, Inventory Leakage, Quality Alerts. Confirms payouts, edits master config, receives stock into store.
- **Manager** — Logs Store→Floor checkouts, uploads POS CSV, tracks live incentives, reviews reorder alerts.
- **Staff** (data-only for MVP) — earns bonuses & commissions computed from POS staff attribution.

## Core Requirements (Static)
1. POS CSV Importer normalising Geetanjali format (whitespace/case-tolerant column mapping).
2. Rule-based Incentive Engine (staff daily tiers, staff monthly efficiency multipliers, retail 3%, manager milestones).
3. Payout Confirmation dashboard (Owner-only "Confirm" per staff per day).
4. Two-Tank Inventory (Store + Floor) with Checkout events driving velocity forecasting for auto-drafted POs.
5. Quality Control auto-flag 100%-discounted services.
6. Master Config editor (tiers, milestones, retail %, lead time, safety buffer).

## What's Been Implemented (2026-06 MVP)
- **Auth**: JWT + bcrypt, cookie + Bearer, seeded owner/manager (idempotent).
- **POS Importer**: `POST /api/pos/upload`, auto-normalises leading-space + case-mixed headers, seeds staff + SKUs from CSV, flags 100%-discount services. Sample POS from Geetanjali CSV auto-seeded on first startup.
- **Incentive Engine**: `/api/incentives/daily`, `/api/incentives/monthly`, `/api/incentives/manager` computing exact rules from Geetanjali Team + Manager docs (₹100–₹1000 tiered, 3/5/6% efficiency multipliers, ₹5k–₹20k manager milestones).
- **Payouts**: `POST /api/payouts/confirm` (owner-only), idempotent per (staff_id, date).
- **Inventory**: `/api/inventory/skus`, `/api/inventory/checkout` (Store→Floor), `/api/inventory/receive` (owner-only), `/api/inventory/purchase-orders` with velocity × 4-day lead × 1.5 buffer.
- **Quality**: `/api/pos/quality-failures` list.
- **Config**: `GET/PUT /api/config` (owner-only edit).
- **Owner Dashboard**: `/api/dashboard/owner` — working capital, revenue, leakage, quality alerts, pending payouts.
- **Frontend**: 9 pages (Login, Owner MIS, Manager Deck, POS Import, Incentives (3 tabs), Payout Release, Two-Tank Inventory with modal, Quality Control, Master Config). Cormorant Garamond + Outfit typography, champagne-gold on midnight aesthetic.

## Deferred (P1 backlog)
- Bank Statement OCR reconciliation ("Munim Agent") — user chose to defer
- Customer Feedback QR + WhatsApp/Email escalation — user deferred
- Multi-salon support (currently single tenant)
- Historical trend charts (recharts) on Owner MIS
- Staff detail view / individual-day drill
- Video review count intake for daily ₹50 bonus (config exists, no data pipe yet)

## Next Tasks (P0)
- Full test pass via `testing_agent_v3` on backend flows.
- Frontend visual check on all pages after login as both owner and manager.

## Credentials
See `/app/memory/test_credentials.md`.

## Iteration 2 (2026-07-01) — Extended Inventory & Multi-day POS

### Added
- Multi-CSV auto-seed via `POS_SAMPLE_URLS` (26/27/28 June 2026 data).
- CSV parser now strips preamble lines before the header row.
- POS import is idempotent: dedupes by (invoice_number + item_name + date); returns `skipped_duplicates`.
- **Batch-tracked inventory**: each SKU has `batches: [{id, qty, location, expiry_date, unit_cost, invoice_id, received_at}]`.
- **POS auto-checkout**: Product-type rows automatically deduct from FLOOR batches (FIFO by expiry) on import; logged with `source="pos"` and invoice number.
- **Manual checkout** uses `_move_batches` FIFO (Store → Floor).
- **Opening stock take**: `POST /api/inventory/skus` with `opening_store_qty/opening_floor_qty/opening_expiry`.
- **Purchase Invoices**: `POST /api/inventory/purchase-invoice` (owner or manager) — books multi-line invoice, adds batches to store with per-line expiry.
- **Expiring report**: `GET /api/inventory/expiring?days=90` returns near-expiry batches with `days_left`, `value_at_risk`, and recommendation (`RETURN_TO_VENDOR` if <30 days, else `PROMOTE_OR_MONITOR`).
- Inventory UI tabs: Store Register · Purchase Invoices · Expiring · Checkout Log.

### Verified
- 48 + 137 + rows across 3 days imported, 6 quality failures flagged.
- jahangir 28 June: ₹16,010 service → ₹700 daily bonus (correct ₹15k–17.9k tier).
- Purchase Invoice INV-001 booked, batch surfaces in expiring list with 45 days left.
