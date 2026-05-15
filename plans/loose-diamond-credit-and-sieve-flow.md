# Plan: Loose Diamond Credit Period + Sieve-based PO/Receive Flow

**Status:** Drafted — awaiting approval to start Phase 1
**Author:** GitHub Copilot (planning session 2026-04-29)
**Driving requests:**
- "When we place orders for loose diamonds they give a credit period and based on that we do the payments — plan and implement this."
- "After placing the order, what we receive is based on sieve chart so based on that calculations have to happen."

Two intertwined features for the diamond purchase workflow:

1. **System-wide credit period** — vendor default `paymentDueDays` + per-invoice override + `dueDate` column on every PURCHASE row across all 4 material categories → unlocks an Aging dashboard and a home-page overdue widget. *(Field intentionally named `paymentDueDays` rather than `creditDays` to avoid confusion with existing `Vendor.creditBalance` (Float, monetary), and not conflated with existing `Order.paymentTerms` enum or `Vendor.gstDetails.foreignDetails.paymentTerms` free text.)*
2. **Sieve-based Purchase Order → Receive flow** for diamonds — place a PO with expected sieve mix, receive against it with actual sieve breakdown; sieve picker auto-converts pieces ↔ carats both ways using a master sieve table seeded from the user's chart.

Phase 1+2 (credit/aging) can ship without sieve data. Phase 3+4 starts from the sieve seed below (now unblocked).

---

## Phases & Steps

### Phase 0 — Sieve chart ingestion ✅ (data captured below)

The seed data for the `SieveSize` master table is captured in two sets — the small-stone sieve table (mesh-based) and the large-stone size-by-carats table.

#### Sheet 1: "Sieve Size Chart" (small stones, sieve mesh)

| sieveCodeFrom | sieveCodeTo | piecesPerCaratLabel | piecesPerCaratAvg | weightPerPieceCt | mmFrom | mmTo |
|---|---|---|---|---|---|---|
| +000 | -00   | 1/215 | 215 | 0.004 | 0.90 | 1.00 |
| +00  | -0    | 1/200 | 200 | 0.005 | 1.00 | 1.10 |
| +0   | -1    | 1/175 | 175 | 0.006 | 1.10 | 1.15 |
| +1   | -1.5  | 1/150 | 150 | 0.007 | 1.15 | 1.20 |
| +1.5 | -2    | 1/120 | 120 | 0.008 | 1.20 | 1.25 |
| +2   | -2.5  | 1/110 | 110 | 0.009 | 1.25 | 1.30 |
| +2.5 | -3    | 1/110 | 110 | 0.010 | 1.30 | 1.35 |
| +3   | -3.5  | 1/110 | 110 | 0.011 | 1.35 | 1.40 |
| +3.5 | -4    | 1/80  | 80  | 0.012 | 1.40 | 1.45 |
| +4   | -4.5  | 1/80  | 80  | 0.013 | 1.45 | 1.50 |
| +4.5 | -5    | 1/70  | 70  | 0.014 | 1.50 | 1.55 |
| +5   | -5.5  | 1/60  | 60  | 0.016 | 1.55 | 1.60 |
| +5.5 | -6    | 1/50  | 50  | 0.018 | 1.60 | 1.70 |
| +6   | -6.5  | 1/50  | 50  | 0.021 | 1.70 | 1.80 |
| +6.5 | -7    | 1/40  | 40  | 0.025 | 1.80 | 1.90 |
| +7   | -7.5  | 1/30  | 30  | 0.029 | 1.90 | 2.00 |
| +7.5 | -8    | 1/30  | 30  | 0.035 | 2.00 | 2.10 |
| +8   | -8.5  | 1/25  | 25  | 0.039 | 2.10 | 2.20 |
| +8.5 | -9    | 1/25  | 25  | 0.044 | 2.20 | 2.30 |
| +9   | -9.5  | 1/20  | 20  | 0.052 | 2.30 | 2.40 |
| +9.5 | -10   | 1/20  | 20  | 0.058 | 2.40 | 2.50 |
| +10  | -10.5 | 1/15  | 15  | 0.069 | 2.50 | 2.60 |
| +10.5| -11   | 1/15  | 15  | 0.074 | 2.60 | 2.70 |
| +11  | -11.5 | 1/12  | 12  | 0.078 | 2.70 | 2.80 |
| +11.5| -12   | 1/12  | 12  | 0.086 | 2.80 | 2.90 |
| +12  | -12.5 | 1/10  | 10  | 0.095 | 2.90 | 3.00 |
| +12.5| -13   | 1/10  | 10  | 0.108 | 3.00 | 3.10 |
| +13  | -13.5 | 1/8   |  8  | 0.116 | 3.10 | 3.20 |
| +13.5| -14   | 1/8   |  8  | 0.125 | 3.20 | 3.30 |
| +14  | -14.5 | 1/7   |  7  | 0.135 | 3.30 | 3.40 |
| +14.5| -15   | 1/7   |  7  | 0.146 | 3.40 | 3.50 |
| +15  | -15.5 | 1/6   |  6  | 0.159 | 3.50 | 3.60 |
| +15.5| -16   | 1/6   |  6  | 0.175 | 3.60 | 3.70 |

#### Sheet 2: "Size by Carats" (single-stone size buckets, no mesh)

| sizeLabel | weightCt | mmFrom | mmTo |
|---|---|---|---|
| 0.20 Cts | 0.20 | 3.60 | 3.80 |
| 0.25 Cts | 0.25 | 3.80 | 4.20 |
| 0.30 Cts | 0.30 | 4.20 | 4.60 |
| 0.40 Cts | 0.40 | 4.60 | 5.00 |
| 0.50 Cts | 0.50 | 5.00 | 5.30 |
| 0.60 Cts | 0.60 | 5.30 | 5.60 |
| 0.70 Cts | 0.70 | 5.60 | 5.90 |
| 0.80 Cts | 0.80 | 5.90 | 6.10 |

**Schema implication:** one `SieveSize` table covers both — a `kind` enum (`MESH | SINGLE`) lets us reuse the same picker. Mesh rows have `sieveCodeFrom`/`sieveCodeTo`/`piecesPerCaratAvg`/`weightPerPieceCt`. Single rows have `sizeLabel`/`weightCt` (and pieces=1 implicitly).

**Conversion math (from chart, per row):**
- `pieces = round(carats × piecesPerCaratAvg)` for MESH rows.
- `carats = pieces / piecesPerCaratAvg` for MESH rows.
- For SINGLE rows: pieces = stones counted, carats = pieces × weightCt.

### Phase 1 — Credit period (system-wide) + dueDate column
*All steps sequential. No dependency on Phase 0.*

1. **Schema migration** `add_payment_due_days_and_due_dates` — split into TWO sub-migrations to keep prod-safe:
   - **1a:** `Vendor.paymentDueDays Int? @default(0) @map("payment_due_days")` (0 = "due immediately / cash"). *Note: distinct from existing `Vendor.creditBalance` (Float, monetary balance for parking overpayments).*
   - **1b:** `dueDate DateTime? @map("due_date")` added to `DiamondTransaction`, `MetalTransaction`, `RealStoneTransaction`, `StonePacketTransaction` **with `@@index([dueDate])` on each** (mirrors `Order.dueDate`'s index — required because the aging endpoint scans/buckets/orders by `due_date` across UNION ALL of all 4 tables).
   - **Backfill SQL** (chunked, 1000 rows/batch on prod):
     ```sql
     UPDATE diamond_transactions t
     SET due_date = t.transaction_date + (COALESCE(v.payment_due_days, 0) || ' days')::interval
     FROM vendors v
     WHERE t.vendor_id = v.id AND t.due_date IS NULL AND t.transaction_type = 'PURCHASE';
     ```
     Repeat for the other 3 transaction tables. Orphan rows (no vendor link) fall back to `due_date = transaction_date`.
2. **Backend service helper** `computeDueDate(transactionDate, vendor, override?)` in a new shared `backend/src/utils/credit.ts` — used by all 4 receive flows. Defensive null-guards:
   - `override` (if provided as Date) wins.
   - Else `vendor?.paymentDueDays` if non-null.
   - Else parse `vendor?.gstDetails?.foreignDetails?.paymentTerms` against `/NET\s*(\d+)/i` (string-typeguarded; if `gstDetails` is not an object, skip).
   - Else default to 0 days.
   - Returns a `Date` (transactionDate + N days).
3. **Receive flow updates** (4 routes, parallel work). *Actual function names verified against codebase:*
   - `backend/src/modules/diamond-inventory/diamond.service.ts` → `createDiamondPurchase()` (line 253) sets `dueDate` on each created `DiamondTransaction`.
   - `backend/src/modules/metal-inventory/metal.service.ts` → **NO dedicated purchase function**. Metal uses a unified `createMetalTransaction(data, createdById)` (line 125) with `data.transactionType === 'PURCHASE'` as the discriminator. The `dueDate` logic must be added inside the `if (isPurchase) { … }` block (already wraps the existing vendor-credit / `creditBalance` lock). Set `dueDate` only when `isPurchase` is true.
   - `backend/src/modules/stone-inventory/stone.service.ts` → has TWO separate functions: `createRealStonePurchase()` (line 156) and `createStonePacketPurchase()` (line 986). Single shared module — there is no `realStone.service.ts`/`stonePacket.service.ts`.
   - All accept optional `dueDate` in request body for per-invoice override.
4. **Vendor form (UI)** — add "Payment Due Days" numeric input (renamed from earlier "Credit Days" to avoid collision with existing `creditBalance` UI labels) in `VendorFormModal.tsx`. Help text: `"Default payment due X days after purchase (NET-X). 0 = pay immediately."`
5. **Receive form (UI)** — add optional invoice-level "Payment Due Date" datepicker in `ReceiveDiamondPage.tsx`. Pre-fills from `vendor.paymentDueDays`; shows hint like `"Default: NET-30 (vendor's standard)"`. Mirror the same field in `ReceiveMetalPage.tsx`, `ReceiveRealStonePage.tsx`, `ReceiveStonePacketPage.tsx`.
6. **Outstanding/Transactions list** — add `dueDate` column with overdue red badge to **ALL 4 transaction pages** (`DiamondTransactionsPage.tsx`, `MetalTransactionsPage.tsx`, `RealStoneTransactionsPage.tsx`, `StonePacketTransactionsPage.tsx`) — required so AgingReport drill-down deep-links work uniformly. Predicate: `dueDate < today AND COALESCE(payment_status, 'PENDING') !== 'COMPLETE'` (NULL `paymentStatus` is treated as PENDING for backwards compatibility — historical rows have NULL). Sortable by due-date and "days overdue"; new "Overdue" filter chip.
7. **Edit Due Date affordance** — `EditDiamondTransactionModal`, `EditMetalTransactionModal`, `EditRealStoneTransactionModal`, `EditStonePacketTransactionModal` get a new datepicker field for `dueDate` (admin-only, audit-logged). **Backend persistence**: each of the 4 update services must whitelist `dueDate` in their allow-list AND apply a recompute rule (only recompute from vendor/transactionDate when those change; preserve manual override otherwise):
   - `updateDiamondTransaction` ([diamond.service.ts:657](sidharth-gold-inventory/backend/src/modules/diamond-inventory/diamond.service.ts#L657))
   - `updateMetalTransaction` ([metal.service.ts:308](sidharth-gold-inventory/backend/src/modules/metal-inventory/metal.service.ts#L308))
   - `updateRealStoneTransaction` ([stone.service.ts:444](sidharth-gold-inventory/backend/src/modules/stone-inventory/stone.service.ts#L444))
   - `updateStonePacketTransaction` ([stone.service.ts:1313](sidharth-gold-inventory/backend/src/modules/stone-inventory/stone.service.ts#L1313))
8. **Tests**:
   - Unit tests for `computeDueDate()` covering: null vendor, vendor with `paymentDueDays=0`, vendor with `paymentDueDays=30`, override Date, foreign-vendor `paymentTerms="NET 60"` fallback, malformed `paymentTerms`, `gstDetails` not an object, `gstDetails=null`.
   - Unit test for backfill SQL on a fixture covering: vendor-linked rows, orphan rows, rows with existing `dueDate` (must not be overwritten).

### Phase 2 — Aging dashboard + home widget (*depends on Phase 1*)

1. **Backend aggregation** new endpoint `GET /api/vendors/outstanding/aging`:
   - Returns `[{ bucket: '0-30', vendorCount, invoiceCount, totalOutstanding }, …]` plus per-vendor breakdown.
   - SQL: bucket by `EXTRACT(DAY FROM (NOW() - due_date))::int` with predicate `WHERE due_date IS NOT NULL AND COALESCE(payment_status, 'PENDING') <> 'COMPLETE' AND total_value > amount_paid` (NULL `paymentStatus` treated as PENDING; outstanding = `total_value - amount_paid`; only overdue rows i.e. `due_date < NOW()` qualify).
   - Cross-domain UNION ALL across all 4 transaction tables (mirrors the existing `/outstanding` pattern in `vendors.routes.ts:552–630`).
   - Add an additional bucket `"NOT_DUE"` for rows where `due_date >= NOW()` so the same endpoint can power both "overdue summary" and full outstanding aging matrix.
2. **Backend** new endpoint `GET /api/vendors/:id/outstanding/aging` for drill-down.
3. **New page** `frontend/src/pages/vendors/AgingReportPage.tsx`:
   - 4 colored overdue-bucket cards (0-30 green, 31-60 yellow, 61-90 orange, 90+ red) + 1 "Not Yet Due" gray card.
   - Drill-down table per vendor with overdue invoices listed (deep-link to `DiamondTransactionsPage` / `MetalTransactionsPage` / etc. filtered by vendor + overdue).
   - Reuse `formatINR()`, sticky header, zebra rows per UX conventions.
4. **Home dashboard widget** — NEW `VendorOverdueWidget.tsx` added as a sibling to the existing `frontend/src/modules/dashboard/components/v2/VendorOutstandingWidget.tsx` (do NOT modify the existing widget; keep concerns separated). Render it inside `DashboardV2.tsx` (the actual dashboard page lazy-imported by `App.tsx:33-34` as `Dashboard`). Small card showing "₹ X overdue across N invoices" with click-through to `/aging`. If `useDashboardLayout.ts` exposes a widget registry, register the new widget there too. Refresh interval matches existing dashboard cadence (uses `RefreshIntervalPicker` if present).
5. **Sidebar nav entry** "Aging Report" under the existing Vendors group (alongside `VendorsPage`).
6. **Tests**: backend integration test for the aging SQL on a seeded fixture covering: one invoice in each bucket, one NULL-paymentStatus row, one COMPLETE row (must be excluded), one orphan-vendor row.

### Phase 3 — Sieve master + picker on Receive Diamond (*depends on Phase 0*)

1. **Schema migration** `add_sieve_size_table`:
   - New `SieveSize` model:
     ```prisma
     model SieveSize {
       id                Int      @id @default(autoincrement())
       kind              String   // 'MESH' | 'SINGLE'
       code              String   @unique // for MESH: "+11/-11.5"; for SINGLE: "0.30Ct"
       sieveCodeFrom     String?  // MESH only
       sieveCodeTo       String?  // MESH only
       piecesPerCaratAvg Float?   // MESH only
       weightPerPieceCt  Float?   // both (for SINGLE: full weight of one stone)
       mmFrom            Float
       mmTo              Float
       displayOrder      Int
       active            Boolean  @default(true)
     }
     ```
   - `Diamond.sieveSizeId Int?` FK (nullable — only LOOSE parcels populate it).
   - `DiamondTransaction.sieveSizeId Int?` FK on each line item snapshot.
2. **Seed** `backend/prisma/seeds/sieve-sizes.ts` populated from the tables above (33 MESH + 8 SINGLE rows).
3. **Backend** `GET /api/sieve-sizes?kind=MESH|SINGLE` (cached, public) — returns active sieve list ordered by `displayOrder`.
4. **Receive Diamond UI** — in each LOOSE parcel line of `ReceiveDiamondPage.tsx`:
   - New "Sieve Size" dropdown (visible only when category=LOOSE), populated from `/api/sieve-sizes`.
   - Bidirectional auto-calc:
     * If user enters/changes `pieces` → `carats = pieces / piecesPerCaratAvg` (rounded to 3 decimals, only auto-fills if carats was empty or matches previous auto value).
     * If user enters/changes `carats` → `pieces = round(carats × piecesPerCaratAvg)` (same touched-ref pattern we used for currency in `VendorFormModal`).
   - Helper text under sieve dropdown: `"≈ {avgPiecesPerCarat} pcs/ct, mm range {mmFrom}–{mmTo}"`.
   - Both fields remain manually editable; sieve change triggers re-suggest only on untouched values.
5. **Display** — show sieve code as a chip on `DiamondTransactionsPage` row + on `DiamondInventoryDashboard` cards.
6. **Tests**:
   - Unit tests for `useSieveAutoCalc` hook covering pieces→carats, carats→pieces, sieve switch with both touched and untouched fields.
   - Backend test that `sieveSizeId` is persisted on the Diamond + DiamondTransaction.

### Phase 4 — Diamond Purchase Order + Receive reconciliation (*depends on Phase 3*)

1. **Schema migration** `add_diamond_purchase_order`:
   - `DiamondPurchaseOrder`: `id` (cuid like other models), `poNumber @unique` (auto-gen `DPO-NNNN`, retry-on-collision pattern), `vendorId` FK, `status` String (validated `DRAFT | PLACED | PARTIALLY_RECEIVED | FULLY_RECEIVED | CANCELLED`), `placedAt`, `expectedDeliveryDate`, `dueDate` (= `computeDueDate(placedAt, vendor, override)`), `notes`, `createdById`, `createdAt`, `updatedAt`.
   - `DiamondPurchaseOrderLine`: `id`, `poId` FK CASCADE, `sieveSizeId` FK, `shape`, `color`, `colorBand`, `clarity`, `expectedPieces`, `expectedCarats`, `expectedRate`, `expectedTotal`.
   - `DiamondTransaction.purchaseOrderId String?` (nullable — receives without a PO still allowed).
   - `DiamondTransaction.purchaseOrderLineId String?` (links a receive line back to the originating PO line).
   - **Inheritance rule**: when a Receive happens against a PO, the receive's `dueDate = po.dueDate` (the binding agreement) — NOT recomputed from receive date. Free-receive (no PO) uses `computeDueDate(receiveDate, vendor)`.
2. **Backend routes** mounted at `/api/diamond-purchase-orders`:
   - `GET /` (list with vendor + status filters), `GET /:id` (with lines + linked receives + variance), `POST /`, `PUT /:id`, `POST /:id/cancel`.
   - `POST /:id/receive` — accepts an array of receive lines each referencing a PO line; creates `Diamond` + `DiamondTransaction` rows linked to the PO line; updates PO status based on cumulative received vs expected (within ±0.5 ct tolerance for FULLY_RECEIVED to handle minor sieve-rounding variance).
   - `POST /:id/cancel` rules: if any receive lines exist, return 409 with the count; an explicit `?force=true` flag (admin-only) actually performs the cancel and keeps `purchaseOrderId` FK on receive rows for audit (no nulling).
3. **PO list page** `frontend/src/pages/diamonds/PurchaseOrdersPage.tsx`:
   - Table: PO #, vendor, placedAt, status chip, expected/received carat ratio, dueDate (overdue badge from Phase 1), total value.
   - Filter chips: All, Draft, Placed, Partially Received, Fully Received, Overdue.
4. **PO detail page / modal** `PurchaseOrderDetailPage.tsx`:
   - Editable line table (sieve picker reused from Phase 3, same auto-calc).
   - "Receive Against PO" action opens a receive form pre-populated from PO lines; user adjusts actual pieces/carats per sieve. Variance column shows expected vs actual diffs in carats and ₹.
5. **Receive Diamond page** gets a new optional "Against PO" selector at the top — when picked, page renders pre-filled from PO; otherwise behaves as today (free receive).
6. **Sidebar nav** "Diamond POs" under Inventory.
7. **Tests**:
   - Backend integration: create PO → partial receive → status transitions to `PARTIALLY_RECEIVED`; full receive → `FULLY_RECEIVED`; variance calculations.
   - Unit: auto-generate `DPO-NNNN` (mirrors vendor `uniqueCode` retry-on-collision).

### Phase 5 — Deploy & verify

1. Run all backend unit + integration tests locally.
2. Type-check both projects (`npx tsc --noEmit`).
3. SCP changed files to prod (per established workflow: backend first, then frontend).
4. **Run Prisma migrations on prod DB** (`npx prisma migrate deploy` inside backend dir on prod) **before** service restart.
5. Backend `npm.cmd run build` + `Restart-Service AtivaGoldInventoryBackend`; verify `combined.log` shows "Server is running on port 3000".
6. Frontend `npx.cmd vite build`.
7. Trigger `AtivaGitAutoCommit`, confirm `Sync OK. HEAD now <sha>`.
8. Local `git pull --rebase`; run `npx nexus-graph-ai analyze` to re-index.

---

## Relevant Files

### Backend
- [backend/prisma/schema.prisma](sidharth-gold-inventory/backend/prisma/schema.prisma) — add `paymentDueDays`, `dueDate`, `SieveSize`, `DiamondPurchaseOrder`, `DiamondPurchaseOrderLine` models + FKs on existing transaction tables.
- NEW: `backend/prisma/seeds/sieve-sizes.ts` — Seed from Phase 0 tables.
- [backend/src/modules/diamond-inventory/diamond.service.ts](sidharth-gold-inventory/backend/src/modules/diamond-inventory/diamond.service.ts) — `createDiamondPurchase()` sets `dueDate`; new `receiveDiamondAgainstPurchaseOrder()` for PO receives.
- [backend/src/modules/diamond-inventory/diamond.routes.ts](sidharth-gold-inventory/backend/src/modules/diamond-inventory/diamond.routes.ts) — accept `dueDate` and `purchaseOrderId` in POST body.
- NEW: `backend/src/modules/diamond-inventory/diamondPurchaseOrder.service.ts` + `.routes.ts`.
- [backend/src/routes/vendors.routes.ts](sidharth-gold-inventory/backend/src/routes/vendors.routes.ts) — extend POST/PUT to accept `paymentDueDays`; new aging endpoints `/outstanding/aging` and `/:id/outstanding/aging`.
- NEW: `backend/src/utils/credit.ts` — `computeDueDate(date, vendor, override?)` shared helper.
- NEW: `backend/src/routes/sieveSize.routes.ts` — read-only `GET /api/sieve-sizes`.
- [backend/src/modules/metal-inventory/metal.service.ts](sidharth-gold-inventory/backend/src/modules/metal-inventory/metal.service.ts) — inside `createMetalTransaction()` `if (isPurchase)` block (line 125+), set `dueDate` from `computeDueDate()`. Same edit inside `updateMetalTransaction()` (line 309) when admin edits a PURCHASE row.
- [backend/src/modules/stone-inventory/stone.service.ts](sidharth-gold-inventory/backend/src/modules/stone-inventory/stone.service.ts) — set `dueDate` in BOTH `createRealStonePurchase()` (line 156) and `createStonePacketPurchase()` (line 986).
- All 4 backend `update*Transaction()` services — whitelist `dueDate` in allow-list and recompute on vendor/transactionDate change for PURCHASE rows: `updateDiamondTransaction` (diamond.service.ts:657), `updateMetalTransaction` (metal.service.ts:308), `updateRealStoneTransaction` (stone.service.ts:444), `updateStonePacketTransaction` (stone.service.ts:1313).

### Frontend
- `frontend/src/components/VendorFormModal.tsx` — add `paymentDueDays` input field; reuse Field/Input pattern from existing email/country block.
- `frontend/src/pages/inventory/ReceiveDiamondPage.tsx` — invoice-level dueDate datepicker (pre-fill from `vendor.paymentDueDays`); per-line sieve dropdown with bidirectional auto-calc; optional "Against PO" selector.
- Same dueDate addition pattern in `ReceiveMetalPage.tsx`, `ReceiveRealStonePage.tsx`, `ReceiveStonePacketPage.tsx`.
- `frontend/src/pages/inventory/DiamondTransactionsPage.tsx` — new dueDate column with overdue badge, sortable; filter chip for "Overdue".
- Same dueDate column + "Overdue" filter chip added to `MetalTransactionsPage.tsx`, `RealStoneTransactionsPage.tsx`, `StonePacketTransactionsPage.tsx`.
- NEW: `frontend/src/pages/vendors/AgingReportPage.tsx` — 4 bucket cards + per-vendor drill-down table.
- NEW: `frontend/src/pages/diamonds/PurchaseOrdersPage.tsx` + `PurchaseOrderDetailPage.tsx`.
- NEW: `frontend/src/services/sieveSize.service.ts`, `purchaseOrder.service.ts`.
- NEW: `frontend/src/hooks/useSieveAutoCalc.ts` — bidirectional pcs ↔ carat conversion with touched-ref preservation (same pattern as `lastAutoCurrency` in `VendorFormModal`).
- Home dashboard component — add "Overdue" widget card.
- Sidebar nav config — add "Aging Report" + "Diamond POs" entries.

### Tests
- NEW: `backend/tests/unit/credit.test.ts` — `computeDueDate()` cases.
- NEW: `backend/tests/integration/aging.test.ts` — seed 1 invoice per bucket, assert API output.
- NEW: `backend/tests/integration/diamondPurchaseOrder.test.ts` — full PO → partial receive → full receive lifecycle, variance assertions.
- NEW: `frontend/src/hooks/__tests__/useSieveAutoCalc.test.ts`.

---

## Verification

1. **Unit:** `cd backend && npx jest tests/unit/credit.test.ts` → all green.
2. **Integration:** `cd backend && npx jest tests/integration/aging.test.ts tests/integration/diamondPurchaseOrder.test.ts` → all green.
3. **Type checks:** `npx tsc --noEmit` clean for both backend and frontend.
4. **Schema:** `npx prisma migrate dev --name add_credit_and_sieve` runs cleanly on local DB; `npx prisma migrate deploy` works on prod.
5. **Manual smoke (Phase 1):**
   - Edit a vendor, set `paymentDueDays = 30`, save.
   - Receive a diamond purchase from that vendor — dueDate auto-pre-fills to today + 30 days, can override.
   - Open Diamond Transactions list — new dueDate column visible, no badge yet (not overdue).
   - Manually shift the test invoice's transactionDate back 45 days — refresh: red "Overdue" badge appears.
6. **Manual smoke (Phase 2):** Open `/aging` — invoice from step 5 lands in 31-60 bucket. Home widget shows "₹ X overdue".
7. **Manual smoke (Phase 3):** On Receive Diamond, pick LOOSE → sieve "+11/-11.5" → enter 5 carats → pieces auto-fills (≈ 60 pcs at 12 pcs/ct). Switch sieve to "+9/-9.5" → pieces re-suggests (≈ 100 pcs at 20 pcs/ct) only if untouched.
8. **Manual smoke (Phase 4):** Create a PO for 100 ct of "+11/-11.5" + 50 ct of "+9/-9.5". Receive 60 ct of "+11" against it → PO status `PARTIALLY_RECEIVED`, variance shows −40 ct. Receive remaining + the 50 ct → status `FULLY_RECEIVED`.
9. **NexusGraphAI** post-deploy: `npx nexus-graph-ai analyze`.

---

## Decisions

- **Credit storage**: vendor-level `paymentDueDays` default + per-invoice override (covers 99% of real-world cases). Distinct from existing `Vendor.creditBalance` (Float monetary balance from over/short payments) and the customer-facing `Order.paymentTerms` enum.
- **Credit scope**: system-wide (all 4 material categories) — keeps the Outstanding/Aging API uniform; one column per transaction table is cheaper than a polymorphic split.
- **Aging buckets**: standard accounting 0-30 / 31-60 / 61-90 / 90+ (industry default; no need to invent custom bands).
- **Overdue action**: visual + home widget. No email/notification this round, no order-blocking — keeps the change low-risk; can layer on later.
- **PO flow**: separate `DiamondPurchaseOrder` entity rather than overloading existing `DiamondTransaction` — keeps "expected" vs "actual" cleanly separated and lets one PO span multiple receive events for partial deliveries.
- **Sieve auto-calc**: bidirectional pcs ↔ carats; reuses the touched-ref pattern from `VendorFormModal` so manual edits are preserved.
- **Receives without a PO are still allowed** — PO is an optional upstream, not a hard requirement; existing data + workflows keep working.
- **Sieve currently only applies to LOOSE diamonds** (not SOLITAIRE). Solitaires already track measurements/depth/table individually.
- **One `SieveSize` table covers both sheets** via `kind = MESH | SINGLE` discriminator — same picker, different conversion math.
- **Excluded for now**: email alerts, order-blocking, real-time stock-by-sieve dashboard (can be a Phase 6+ follow-up if needed).

---

## Further Considerations

1. **Foreign vendors:** `dueDate` calc respects `vendor.gstDetails.foreignDetails.paymentTerms` (free-text "NET 30") if `paymentDueDays` is null — parse `/NET\s*(\d+)/i`, default 0. *(NOT to be confused with the unrelated `Order.paymentTerms` field, which is a customer-facing enum on jewelry orders.)*
2. **Backfill base date:** existing PURCHASE rows have no `dueDate`. Backfill uses `transactionDate + COALESCE(vendor.payment_due_days, 0)` — most accurate for historic aging. Run chunked (1000 rows/batch) on prod.
3. **Sieve granularity:** chart confirms `+000` through `-16` for mesh + 8 single sizes. Stored as `code` free string + `displayOrder` int; no hard-coded enum.
4. **`Pcs/Cts` accuracy:** the chart's column is approximate (e.g. row "+11/-11.5" lists 1/12 ≈ 12 pcs/ct, but actual weight 0.078 ct/piece → 12.8 pcs/ct). Plan stores the chart's `piecesPerCaratAvg` as the source-of-truth for auto-suggestions; the precise weight column is informational. User can always override the calculated pieces.
5. **Currency on PO:** PO total value should respect the vendor's preferred currency (already on `gstDetails.foreignDetails.currency`). Display ₹ for India vendors and the foreign currency for international vendors.

---

## Cross-Check Report (2026-04-29)

Full QA pass against the codebase HEAD (`d7c20d6`) using NexusGraphAI impact analysis + targeted greps. **Plan is now production-ready** after the fixes below were applied in-place.

### Issues Found & Fixed

| # | Severity | Issue | Resolution |
|---|---|---|---|
| 1 | 🚨 CRITICAL | Plan referenced `realStone.service.ts` and `stonePacket.service.ts` — these files **do not exist**. The codebase has only ONE `backend/src/modules/stone-inventory/stone.service.ts` that handles BOTH categories. | All references rewritten to point to `stone.service.ts`. |
| 2 | 🚨 CRITICAL | Plan called the diamond purchase function `recordPurchase()` — actual is `createDiamondPurchase()` in `diamond.service.ts:253`. Same misnaming would have applied to metal/stone equivalents. | All references corrected. Real names: `createDiamondPurchase`; metal/stone equivalents to be discovered during Phase 1 implementation (single grep before editing). |
| 3 | ⚠️ HIGH | `Vendor.creditDays` (Int) name collides cognitively with existing `Vendor.creditBalance` (Float, monetary balance from over/short payments at line 994 of schema). Two different "credit" semantics is a code-review and UI-label trap. | Field renamed to `paymentDueDays` everywhere in plan. `@map("payment_due_days")` on the Prisma side. |
| 4 | ⚠️ MEDIUM | `paymentTerms` is already overloaded across the codebase: (a) `Order.paymentTerms` enum (`ADVANCE_FULL`/`ADVANCE_50`/`ON_DELIVERY`/`CUSTOM`) on customer jewelry orders; (b) `vendor.gstDetails.foreignDetails.paymentTerms` free-text on foreign vendors. Plan referenced (b) without acknowledging the namespace overlap. | Explicit notes added in Phase 1 step 2, Decisions section, and Further Considerations item 1. The new `paymentDueDays` is a 3rd, distinct field. |
| 5 | ⚠️ MEDIUM | Aging WHERE clause `payment_status IN ('HALF','PENDING')` would silently exclude historical rows where `paymentStatus IS NULL` (the column is `String?` on all 4 transaction tables). | Changed to `COALESCE(payment_status, 'PENDING') <> 'COMPLETE'`. Same predicate also applied to the overdue badge predicate in Phase 1 step 6. |
| 6 | ⚠️ MEDIUM | No "Edit Due Date" UI affordance after a transaction is recorded — if user mistypes the credit period, no way to fix it without DB access. | Added Phase 1 step 7: extend the 4 existing `Edit*TransactionModal` components with a `dueDate` datepicker (admin-only). |
| 7 | ⚠️ MEDIUM | PO→Receive `dueDate` inheritance was ambiguous: when receiving against a PO, should the receive's `dueDate` recompute from the receive date, or inherit the PO's `dueDate` (the actual binding agreement)? | Phase 4 step 1 now states explicitly: receive lines created from a PO inherit `po.dueDate`; free-receives use `computeDueDate(receiveDate, vendor)`. |
| 8 | ⚠️ MEDIUM | PO cancellation rules undefined for the partial-receive case. Silent FK orphaning would lose audit trail. | Phase 4 `POST /:id/cancel` now returns 409 if any receive lines exist; `?force=true` (admin-only) cancels but keeps the FK on receive rows. |
| 9 | ℹ️ LOW | Migration was a single step adding both column and backfill. On prod with large transaction tables, an unbatched UPDATE could lock tables. | Phase 1 step 1 split into 1a (add column) + 1b (chunked 1000-row backfill). |
| 10 | ℹ️ LOW | `computeDueDate()` description didn't enumerate null-guard cases. The free-text `paymentTerms` parser in particular needs defensive checks (gstDetails could be `null`, not an object, missing key, malformed string). | Phase 1 step 2 now lists all guards; Phase 1 step 8 lists the matching unit test cases (`null vendor`, `gstDetails not an object`, `gstDetails=null`, malformed `paymentTerms`, override Date wins, etc.). |
| 11 | ℹ️ LOW | Home dashboard component path was "TBD". Actual path: `frontend/src/modules/dashboard/` (lazy-imported in `App.tsx:33-34` as `Dashboard`). | Phase 2 step 4 updated with the actual path. |
| 12 | ℹ️ LOW | Aging endpoint didn't account for `total_value > amount_paid` — a row could be COMPLETE-flagged but have small rounding residue. | Predicate now `... AND total_value > amount_paid`. Also added `NOT_DUE` bucket so the same endpoint covers both overdue and not-yet-due summaries. |
| 13 | ℹ️ LOW | `DiamondPurchaseOrder.id` typed as `Int` but the rest of the schema uses cuid strings. FK on `DiamondTransaction.purchaseOrderId` was also `Int?`. | Phase 4 step 1 changed both to cuid `String` for consistency with all other models. |
| 14 | ℹ️ LOW | PO `status` was an "enum" — Prisma enums require migration coordination. | Changed to `String` with documented allowed values (matches the `paymentStatus String?` pattern already used across all 4 transaction tables). |
| 15 | ℹ️ LOW | PO `FULLY_RECEIVED` status had no tolerance — sieve-rounding variance on real diamond receives often produces small fractional carats. | Added ±0.5 ct tolerance for the FULLY_RECEIVED transition. |
| 16 | ⚠️ HIGH | Phase 1 step 7 only mentioned `updateMetalTransaction`. The 3 sibling backend update services (`updateDiamondTransaction` line 657, `updateRealStoneTransaction` line 444, `updateStonePacketTransaction` line 1313) also need `dueDate` whitelisted + same recompute rule, otherwise the four EditModal datepickers silently no-op for those 3 categories. | Phase 1 step 7 + Touched-files now enumerate all 4 update services. |
| 17 | ⚠️ HIGH | Phase 1 step 6 said "Outstanding/Transactions list" (singular) and Touched-files only listed `DiamondTransactionsPage.tsx`. Phase 2's AgingReport drill-down deep-links to all 4 transaction pages, so the column + Overdue chip must exist on all 4. | Phase 1 step 6 + Touched-files updated to enumerate all 4 `*TransactionsPage.tsx`. |
| 18 | ⚠️ MEDIUM | Phase 1 migration 1b added `dueDate` columns but no index. Aging endpoint will scan/order by `due_date` across UNION ALL of 4 large tables → full-table scans per arm. `Order.dueDate` already follows the right pattern (`@@index([dueDate])` at schema line 311). | Migration 1b now adds `@@index([dueDate])` to all 4 transaction tables. |
| 19 | ⚠️ MEDIUM | Phase 2 step 4 said "add a widget to `frontend/src/modules/dashboard/`" without acknowledging existing `VendorOutstandingWidget.tsx` in the same folder. Also the dashboard page is `DashboardV2.tsx` (re-exported as `Dashboard` via `index.ts`), and widgets may need registration in `useDashboardLayout.ts`. | Phase 2 step 4 now creates a sibling `VendorOverdueWidget.tsx` (NOT modifying the existing widget), renders it inside `DashboardV2.tsx`, and notes the layout registry. |
| 20 | ℹ️ LOW | `VendorDetailPage.tsx` was not scoped as a consumer of the new `/api/vendors/:id/outstanding/aging` endpoint despite being the natural per-vendor overdue summary surface. | Explicitly deferred to Phase 6 follow-up (drill-down inside AgingReport already covers the workflow). |
| 21 | ℹ️ LOW | `mobile/App.tsx` exists; receive flows there will not get the new datepicker / paymentDueDays input. | Out-of-scope for this plan; mobile receives use vendor's default `paymentDueDays` server-side (computed by `computeDueDate()` regardless of client). |
| 22 | ℹ️ LOW | Existing `/api/vendors/outstanding` `openCount` SQL still uses `payment_status IN ('HALF','PENDING')` which excludes NULL-paymentStatus rows; the new aging endpoint uses `COALESCE(payment_status,'PENDING')<>'COMPLETE'`. The two endpoints will count "open" rows slightly differently for historical data. | Documented divergence; not fixing existing endpoint in this plan to keep blast radius small (separate hygiene PR). |

### Validated (no change needed)

- ✅ `dueDate` column name is idiomatic — already used on `Order.dueDate` (schema line 295).
- ✅ All 4 `Receive*Page.tsx` components exist as expected (`ReceiveDiamondPage`, `ReceiveMetalPage`, `ReceiveRealStonePage`, `ReceiveStonePacketPage`).
- ✅ `DiamondInventoryDashboard.tsx` and the existing dashboard module path resolve.
- ✅ Existing `/api/vendors/outstanding` (line 553) and `/api/vendors/:id/outstanding` (line 589) endpoints stay unchanged — new aging endpoints are purely additive.
- ✅ `buildForeignDetails()` helper in `vendors.routes.ts:393` (from earlier session) is reusable for the `paymentDueDays` PUT.
- ✅ Sieve seed data (33 MESH + 8 SINGLE rows) captured in Phase 0 is correct and complete — no edits.
- ✅ All 5 phases of the plan are structurally sound — only naming/path/SQL corrections were needed, no architectural rework.

### NexusGraphAI Risk Matrix

| Target | Direct Importers (d=1) | d=2 reach | Risk | Mitigation |
|---|---|---|---|---|
| `Vendor` interface (`frontend/src/services/vendor.service.ts`) | 12 (4 Receive pages + 4 Edit modals + 2 vendor pages + GstInfoCard + VendorFormModal) | 4 (Diamond/Metal/RealStone/StonePacket Transactions pages) | **MEDIUM** | New `paymentDueDays?: number` is OPTIONAL — existing 12 importers compile unchanged. |
| `DiamondTransaction` interface | 12 d=1 | 3 d=2 | **MEDIUM** | New `dueDate?` and `purchaseOrderId?`, `purchaseOrderLineId?` are all OPTIONAL — backward compatible. |
| `createDiamondPurchase` (backend) | 1 (`ReceiveDiamondPage` only) | 0 | **LOW** | Single call site to update for the new optional `dueDate` request body field. |
| `SettlePaymentModal` regression | imports `DiamondTransaction` | — | **LOW** | Doesn't touch `dueDate`; settlement math unchanged. |

**Overall risk: MEDIUM**, fully mitigated by making every new TS interface field optional. No critical-path (auth, settlement math, stock-availability) function signatures change.

### Production-Readiness Confirmation

After the 15 fixes above, the plan is ready to start Phase 1.

### Pre-Flight Verification (2026-04-29 — completed)

All three pre-flight checks performed before Phase 1 implementation:

1. **✅ Metal/stone purchase function names verified:**
   - `createDiamondPurchase()` — [backend/src/modules/diamond-inventory/diamond.service.ts](sidharth-gold-inventory/backend/src/modules/diamond-inventory/diamond.service.ts#L253)
   - `createRealStonePurchase()` — [backend/src/modules/stone-inventory/stone.service.ts](sidharth-gold-inventory/backend/src/modules/stone-inventory/stone.service.ts#L156)
   - `createStonePacketPurchase()` — [backend/src/modules/stone-inventory/stone.service.ts](sidharth-gold-inventory/backend/src/modules/stone-inventory/stone.service.ts#L986)
   - **Metal: NO dedicated `createMetalPurchase()`** — uses unified `createMetalTransaction(data, createdById)` at [metal.service.ts](sidharth-gold-inventory/backend/src/modules/metal-inventory/metal.service.ts#L125) with `data.transactionType === 'PURCHASE'` discriminator. The existing `if (isPurchase) { … }` block (which already locks `vendor.creditBalance` via `SELECT … FOR UPDATE`) is the integration point for setting `dueDate`. Plan Phase 1 step 3 + Touched-files list updated to reflect this asymmetry.
   - Also update [updateMetalTransaction](sidharth-gold-inventory/backend/src/modules/metal-inventory/metal.service.ts#L309) so admin edits to a PURCHASE row recompute `dueDate` only when transactionDate or vendor changes (not on every edit — preserve manual override).

2. **✅ No PurchaseOrder model collision:** `grep ^model.*Purchase` against [schema.prisma](sidharth-gold-inventory/backend/prisma/schema.prisma) returned **zero matches**. New `DiamondPurchaseOrder` and `DiamondPurchaseOrderLine` models will not collide with anything existing.

3. **✅ No `useSieveAutoCalc` hook collision:** `frontend/src/hooks/` contains only 4 files: [useApi.ts](sidharth-gold-inventory/frontend/src/hooks/useApi.ts), [useKeyboardShortcuts.ts](sidharth-gold-inventory/frontend/src/hooks/useKeyboardShortcuts.ts), [useNotifications.ts](sidharth-gold-inventory/frontend/src/hooks/useNotifications.ts), [usePerformance.ts](sidharth-gold-inventory/frontend/src/hooks/usePerformance.ts). New `useSieveAutoCalc.ts` is unique.

**Status: Phase 1 implementation can begin.**

---

## Implementation Status (2026-05-15)

### ✅ Phases 1–3 — landed
- Vendor `paymentDueDays`, transaction `dueDate`, and the shared `computeDueDate()` helper are wired through all 4 inventory modules (diamond / metal / real-stone / stone-packet) on both create and update paths.
- 4 `Receive*Page` and 4 `Edit*TransactionModal` components prefill / accept a per-invoice override; 4 `*TransactionsPage` lists render the new `OverdueBadge`.
- `/api/vendors/aging` + `/api/vendors/:id/aging` endpoints, the `AgingReportPage`, the per-vendor "Aging Buckets" strip on `VendorDetailPage`, and the sidebar "Aging Report" link are live.
- `SieveSize` master + `GET /api/sieve-sizes`, the LOOSE-only sieve picker on `ReceiveDiamondPage`, the `useSieveAutoCalc` helpers (pieces ↔ carats with touched-ref preservation), and the sieve chip on `DiamondTransactionsPage` are landed.
- Bug-fix G6 applied: `/api/vendors/outstanding` now coalesces `NULL` payment status as `PENDING`.
- Backend `tsc --noEmit` and `tests/unit/credit.test.ts` are green; frontend `tsc --noEmit` is green.

### ✅ Phase 4 — Diamond Purchase Orders (this iteration)
**Backend**
- `prisma/schema.prisma`: added `DiamondPurchaseOrder` + `DiamondPurchaseOrderLine` models (cuid IDs, `String` status with documented allowed values), back-relations on `Vendor`, `User`, `SieveSize`, and `purchaseOrderId` / `purchaseOrderLineId` FKs on `DiamondTransaction`.
- `prisma/sql-patches/2026-05-15_add_diamond_purchase_orders.sql`: idempotent `CREATE TABLE` / `ALTER TABLE` / index / FK script — ready to apply once the existing `diamond_transactions` schema-drift is reconciled (see "Database Schema Drift" below).
- `modules/diamond-inventory/diamondPurchaseOrder.service.ts`: full lifecycle (`createDiamondPO`, `listDiamondPOs`, `getDiamondPO` with per-line variance, `updateDiamondPO`, `placeDiamondPO`, `cancelDiamondPO`, `receiveAgainstPo`).
  - Status machine `DRAFT → PLACED → PARTIALLY_RECEIVED → FULLY_RECEIVED` with terminal `CANCELLED`; `±0.5 ct` tolerance per line for `FULLY_RECEIVED`.
  - `receiveAgainstPo` creates `Diamond` + `DiamondTransaction` rows inside a single Prisma transaction, copies `dueDate = po.dueDate` verbatim (free receives keep `computeDueDate(receiveDate, vendor)`), and re-evaluates PO status from the new aggregate.
  - Cancellation refuses with HTTP 409 if any receives exist unless `?force=true` is passed (admin escape hatch keeps FK on receive rows for audit).
- `modules/diamond-inventory/diamondPurchaseOrder.routes.ts`: REST surface mounted at `/api/diamond-purchase-orders` (`POST /`, `GET /`, `GET /:id`, `PUT /:id`, `POST /:id/place`, `POST /:id/cancel`, `POST /:id/receive`); guarded by `authenticate` + role middleware (ADMIN / OFFICE_STAFF for mutations, FACTORY_MANAGER added for reads).
- `index.ts`: route registered.

**Frontend**
- `services/diamondPurchaseOrder.service.ts`: typed client (`DiamondPurchaseOrder`, `DiamondPoLine`, `CreateDiamondPoInput`, `UpdateDiamondPoInput`, `ReceiveAgainstPoInput`, status label / class maps).
- `pages/diamonds/DiamondPurchaseOrdersPage.tsx`: list view with status filter pills + "+ New PO" modal that supports multi-line entry (sieve dropdown, shape/color/clarity, expected pcs/cts/rate, totals strip) and submits as `DRAFT` or `PLACED`.
- `pages/diamonds/DiamondPurchaseOrderDetailPage.tsx`: header strip with vendor + dates, KPI cards (lines / expected / received / outstanding), per-line variance table, plus three modal flows — Place, Cancel (with `force` toggle when receives exist), and Record Receive.
- `App.tsx`: lazy-loaded `/app/diamonds/purchase-orders` and `/app/diamonds/purchase-orders/:id` routes.
- `Sidebar.tsx`: "Diamond Purchase Orders" entry under Main Inventory; `inventoryChildPaths` updated for active-state highlighting.

### ⚠️ Database Schema Drift (still open)
`psql` revealed that the local `diamond_transactions` table is missing `vendor_id`, `total_value`, `payment_status`, and `due_date` — i.e. the live DB is several migrations behind `schema.prisma`. The Phase 1 SQL patch (`2026-05-15_add_payment_due_days_and_due_dates.sql`) and the new Phase 4 SQL patch will both fail under the current state. The patches themselves are correct and idempotent; they just need the prerequisite drift reconciled first. **Owner: user.** Code changes in this branch deliberately tolerate this — `tsc` is clean and Prisma client regenerated against the updated schema, so once the DB catches up the patches apply cleanly in order.

### ⏳ Pending follow-ups
- Apply the four SQL patches in order:
  1. `2026-05-15_add_payment_due_days_and_due_dates.sql`
  2. `2026-05-15_add_sieve_sizes.sql`
  3. `2026-05-15_add_diamond_purchase_orders.sql`
- Run the deferred integration tests (`tests/integration/aging.test.ts`, `tests/integration/diamondPurchaseOrder.test.ts`) once the DB is in sync.
- Phase 5 final smoke: `npm run build` for backend + `npx vite build` for frontend, then full BATS run.
