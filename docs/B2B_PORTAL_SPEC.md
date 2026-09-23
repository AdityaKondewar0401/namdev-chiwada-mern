# Namdev Chiwda — B2B (Wholesale) Portal: Implementation Spec for Claude Code

> **How to use this file (Claude Code):** This is the complete brief for adding a B2B wholesale portal to this repository. Read `AGENT.md` in full first, then this file. Work **one phase at a time** (Section 11). At the start of every phase, re-read the relevant sections here, explore the files you will touch, present a short plan, and wait for my approval before editing. At the end of every phase, stop, summarize what changed, run the verification steps, and wait for me.
>
> If this spec conflicts with the actual code, trust the code, tell me about the conflict, and propose a resolution. If a business rule here is ambiguous, ask me instead of guessing.

---

## 0. Business decisions (defaults — edit before starting)

**Tax status: the business is currently NOT registered under GST.** It holds an **FSSAI license** only. This drives several rules below and throughout the spec:

- We **must not charge, collect, or display GST** on any B2B document or price.
- Our documents are plain **"Invoice"** (never "Tax Invoice", never "Bill of Supply"), with no GSTIN, no HSN/tax columns, and a clear note that the supplier is not registered under GST.
- Our **FSSAI license number must appear** on every invoice and credit note.
- B2B ordering is restricted to **Maharashtra delivery addresses** (configurable), because making inter-state supplies of goods generally requires GST registration. The owner is confirming the details with their CA.
- The code must be **GST-ready**: a single config switch (`SELLER_GST_MODE`) controls tax behaviour. Only `unregistered` is implemented now; `regular` (and possibly `composition`) will be added in a later phase when the business registers, without redesigning models.

| # | Decision | Default |
|---|---|---|
| D1 | Who can join | Any logged-in user can **apply**; admin must **approve**. Admin can also create a business account directly for an existing user (by email). |
| D2 | Buyer types | `retailer`, `sweet_shop`, `distributor`, `supermarket`, `caterer`, `other` |
| D3 | Buyer GSTIN | Optional. Collected and format-validated if the buyer has one (useful for records and for later), but it has no tax effect while we are unregistered. |
| D4 | Pricing basis | Wholesale prices are **per unit (pack), final prices**. No tax is added on top. |
| D5 | Pricing tiers | Tiers apply a % discount on the base wholesale price (e.g. `STANDARD` 0%, `DISTRIBUTOR` 8%). Optional per-tier fixed price override per catalog item. |
| D6 | Ordering unit | Buyers order in **cases** (e.g. 1 case = 24 × 200g). Each catalog item has `unitsPerCase` and `moqCases`. |
| D7 | Minimum order value | ₹5,000 (env `B2B_MIN_ORDER_VALUE`). |
| D8 | Advance/remainder payment | Per account: a single `advancePercent` (0-100, replaces the earlier fixed `prepaid`/`net7`/`net15`/`net30` terms). `advancePercent`% of the payable is collected via **real Razorpay** at order placement; the rest (`remainingAmount`) is due a fixed 14 days later for every account, tracked via `remainingDueDate`. Credit accounts (any `advancePercent`) have a `creditLimit`. See §6.13. |
| D9 | Over credit limit | Order is **accepted but flagged `creditHold`**, checked against `remainingAmount` (post-advance), not the full payable. Admin must explicitly override before confirming. Never silently reject. |
| D10 | Payments | Advance: real Razorpay at order placement (§6.13), same `VerifiedPayment` model and verification flow retail checkout uses. Remainder: recorded **manually by admin** (UPI / NEFT-RTGS / cash / cheque) via the existing Ledger — no auto-charge later. |
| D11 | Fulfilment | B2B orders CAN get a real Shadowfax AWB (§6.14) — admin-triggered ("Create Shipment") once `dispatched`, never automatic on placement. The manual dispatch fields (own vehicle / transporter / courier / buyer pickup, LR/vehicle details) still exist independently and are always available regardless of whether a real shipment was booked. No B2B-specific weight cap is enforced pre-flight (unlike retail's 7kg cap) — a real Shadowfax rejection, if any, surfaces as a normal booking error. |
| D12 | Stock | No quantity-level inventory in v1. Respect the existing `Product.inStock` flag. Admin reviews availability at confirmation (admin can edit quantities while the order is `placed`). |
| D13 | Document numbering | Invoices `NCB/{FY}/{seq}` e.g. `NCB/26-27/00001`; credit notes `NCC/{FY}/{seq}`. Sequential per Indian financial year (April–March), resets each FY, kept ≤ 16 characters so the same series stays valid after GST registration. |
| D14 | Delivery region | `B2B_ALLOWED_STATE_CODES=27` (Maharashtra). Businesses anywhere can apply, but only shipping addresses in allowed states can be used to place orders. |
| D15 | Turnover watch | Admin sees financial-year sales (website + wholesale) against a configurable GST registration threshold (`GST_REGISTRATION_THRESHOLD`, default ₹40,00,000), with a warning at 80%. Informational only. |

---

## 1. Goal and scope

Build a wholesale portal where approved businesses can see wholesale pricing, place bulk orders, track them, download invoices, and view their account statement and outstanding balance. Admins can approve businesses, manage wholesale pricing, process B2B orders, issue invoices, and record payments.

**In scope (v1):** business onboarding and approval, wholesale catalog and tiered pricing, quick-order grid, B2B orders with a status workflow, non-GST invoices (PDF) with FSSAI number, credit notes for cancelled invoices, ledger (invoices, payments, adjustments), statement with running balance, credit limit and hold, delivery-state restriction, FY turnover watch, admin tabs for all of the above, transactional emails, a public `/business` landing page.

**Out of scope (v1):** any GST calculation or GST documents, inventory quantities, e-invoicing, e-way bills, partial credit notes, WhatsApp template notifications, online payment of dues (Phase 6 optional), multi-user logins per business.

---

## 2. Ground rules (non-negotiable)

1. **Do not change retail behaviour.** The retail cart, `CartContext`, `server/utils/pricing.js`, `server/utils/orderCreation.js`, `orderController`, `paymentController`, Razorpay flow, Shadowfax integration, WhatsApp bot, and the existing `Order` model must keep working exactly as today. B2B lives in **new** models, routes, controllers, utils, and pages. If you believe a shared file must change, stop and ask me first. (Reading retail `Order` totals for the turnover widget is allowed; writing is not.)
2. **No GST anywhere while `SELLER_GST_MODE=unregistered`.** No GST percentages, tax amounts, "incl./excl. GST" wording, HSN columns, our GSTIN, or "Tax Invoice" title in any UI, email, CSV, or PDF. Prices shown to buyers are final.
3. **Wholesale prices must never leak** through any public or retail endpoint. They live in a separate collection (`WholesaleCatalogItem`), never on `Product`. Every B2B price endpoint requires `protect` + an approved business account.
4. **Server is the pricing authority.** The client only displays server quotes. All totals, credit checks, MOQ checks, and delivery-state checks are recomputed on the server at placement and again when admin edits an order.
5. **Every business-facing query is scoped** to the requester's own `BusinessAccount` (prevent IDOR).
6. **Issued invoices are immutable.** They store full snapshots (seller, buyer, lines, totals, tax mode). Corrections happen through credit notes and ledger adjustments, never edits.
7. **Ledger entries are append-only.** No update/delete endpoints. Balances are always derived from entries.
8. Follow every convention in `AGENT.md`: JavaScript only, thin routes, controllers orchestrate, `{ success, ... }` envelopes, one `express-validator` chain file per domain + `validate`, correct rate-limit tier on every route (§30), `protect` before `admin`, static routes before `/:id`, `react-hot-toast` for feedback, loading/empty/error states, exactly one `<SEO>` per page, private pages `robots="noindex,nofollow"`, keep the `App.jsx` provider order, new JSON calls through `client/src/services/api.js`.
9. Do not incidentally fix the known traps in `AGENT.md` §24. Note anything you find instead.
10. Never read, print, or commit `.env`. Add all new variables to `server/.env.example` with placeholder values.
11. Work on a branch `feature/b2b-portal`. One commit per phase with a clear message.

---

## 3. Existing code to reuse (verify these still match before using)

- **Auth:** `server/middleware/auth.js` (`protect`, `admin`), JWT in localStorage, `AuthContext`, `ProtectedRoute` (UX only).
- **Rate limits:** `server/middleware/rateLimiter.js` → `userActionLimiter` for all authenticated B2B routes (after `protect`); `publicLimiter` for any public read.
- **Validation:** `server/validators/common.js` helpers (`mongoIdParam`, `indianPhone`, etc.) + `server/middleware/validate.js`.
- **Email:** `server/services/emailService.js` / `server/config/email.js` (Resend over HTTPS). Best-effort: failures are logged and never fail the main action.
- **Admin shell:** `client/src/pages/AdminPage.jsx` renders tabs from `TABS` in `client/src/components/admin/adminConstants.js`; `AdminNav.jsx` groups tabs by `group` (currently only `'store'`). Tabs like `OrdersTab` and `UsersTab` fetch their own data; follow that pattern. Reuse `AdminUI.jsx` primitives and `charts.jsx`.
- **Admin users:** `/api/users/admin` endpoints and `UsersTab.jsx`.
- **B2B CTA:** `client/src/components/DistributorshipBand.jsx`.
- **SEO:** `client/src/components/SEO.jsx`, `Breadcrumbs.jsx`, `STATIC_PAGES` in `client/scripts/generate-seo-files.mjs`.
- **Styling:** brand tokens in `tailwind.config.js` (`saffron`, `cream`, `brown-dark`, `brown-mid`, `gold`, `leaf`), shared classes in `index.css`, animation variants in `utils/animations.js`.
- **Products:** `Product.sizes[{ weight, price }]`, `Product.inStock`, `Product.img`, `Product.name`, `Product.namMarathi`. Size labels like `"250g"`, `"1kg"`.
- **Retail orders (read-only, turnover widget):** `Order.total`, `Order.status`, `Order.paymentStatus`, `Order.createdAt`.

---

## 4. Architecture decisions

- **Separate `B2BOrder` model** instead of reusing `Order`. The retail `Order` is wired into Shadowfax webhooks, retail emails, the WhatsApp bot, and retail admin analytics. B2B also needs different fields (cases, dispatch/LR, credit hold, invoice link).
- **Separate `BusinessAccount` model** (1:1 with `User`). `User.role` stays `user | admin`.
- **Separate `WholesaleCatalogItem` collection** so wholesale data can't leak through `/api/products`.
- **No B2B cart model.** The quick-order grid holds a client-side draft (localStorage key `nc_b2b_draft_<userId>`); the server prices it via a stateless `quote` endpoint and recomputes everything at placement.
- **Tax mode abstraction.** A single module `server/utils/taxMode.js` reads `SELLER_GST_MODE` and exposes `getTaxMode()`, `documentTitle(kind)` (`'Invoice'` / `'Credit Note'` in unregistered mode), `computeLineTax(line)` (returns zero tax in unregistered mode), and `supplierTaxNote()` (`"Supplier not registered under GST. GST not charged."`). Every place that could ever involve tax calls this module; nothing else branches on tax. Modes other than `unregistered` throw a clear "not implemented yet" error at server start, so a misconfigured env fails loudly.
- **GST-ready data, zero GST output.** Models include nullable tax fields (`taxMode`, `taxAmount = 0`, optional `hsnCode` on catalog items) so that GST registration later only adds logic, not migrations. These fields are never rendered while unregistered.
- **Money:** rupees as `Number`, rounded to 2 decimals via one shared `round2()` helper. Invoice total rounded to the nearest rupee with an explicit `roundOff` field.
- **Dates:** financial year, document dates, due dates, and statement filters are computed in **IST (`Asia/Kolkata`)**, not server UTC.
- **Sequential numbers:** a `Counter` collection with atomic `findOneAndUpdate({ _id }, { $inc: { seq: 1 } }, { upsert: true, new: true })`.
- **Multi-document writes** (issue invoice + ledger debit + order update; credit note + ledger credit + order update) use a MongoDB transaction (`session.withTransaction`). If transactions are unavailable, tell me before falling back.
- **PDF documents** generated server-side on demand from the immutable `Invoice` / `CreditNote` snapshot using `pdfkit` (add to `server/` only).

---

## 5. Data model (new files in `server/models/`)

### 5.1 `BusinessAccount.js`
- `user`: ObjectId → User, required, **unique**
- `businessName` (required), `legalName`, `businessType` (enum D2)
- `gstin`: String, uppercase, optional, unique **sparse** (format-validated when present)
- `fssaiLicenseNo`: optional (buyer's own license, if any)
- `contactName`, `phone`, `email`
- `billingAddress`: `{ line1, line2, city, district, state, stateCode, pincode }`
- `shippingAddresses`: `[{ label, contactName, phone, line1, line2, city, district, state, stateCode, pincode, isDefault }]`
- `status`: enum `pending | approved | rejected | suspended`, default `pending`, indexed
- `rejectionReason`, `adminNotes`
- `tier`: ObjectId → PriceTier
- `advancePercent`: Number 0–100, required, default 100 (see D8/§6.13)
- `creditLimit`: Number, default 0
- `approvedBy`, `approvedAt`
- `statusHistory`: `[{ status, by, at, note }]`
- timestamps

### 5.2 `PriceTier.js`
- `name`, `code` (unique, uppercase), `description`
- `discountPercent`: Number 0–100
- `isDefault`: Boolean (exactly one default, enforced in controller)
- `active`: Boolean
- timestamps

### 5.3 `WholesaleCatalogItem.js`
- `product`: ObjectId → Product, required
- `size`: String (must match one of `product.sizes[].weight`, or `product.weight` for single-size products; validated in controller)
- `unitsPerCase`: Number ≥ 1
- `moqCases`: Number ≥ 1
- `basePricePerUnit`: Number > 0 (final price)
- `hsnCode`: String, optional (stored for future GST use; never displayed while unregistered)
- `tierOverrides`: `[{ tier: ObjectId → PriceTier, pricePerUnit: Number }]`
- `active`: Boolean, `sortOrder`: Number
- Unique compound index `{ product: 1, size: 1 }`
- timestamps

### 5.4 `B2BOrder.js`
- `orderNumber`: String unique (e.g. `B2B-000123`, via Counter)
- `business`: ObjectId → BusinessAccount (indexed); `placedBy`: ObjectId → User
- `items`: `[{ catalogItem, product, name, size, unitsPerCase, cases, units, unitPrice, lineTotal }]` (snapshots)
- `billing`: snapshot `{ businessName, gstin, address }`
- `shippingAddress`: snapshot (includes `stateCode`)
- `taxMode`: String snapshot (`'unregistered'`)
- `totals`: `{ subtotal, taxTotal (0), grandTotal, roundOff, payable }`
- `status`: enum `placed | confirmed | packed | dispatched | delivered | cancelled | rejected`, indexed
- `statusHistory`: `[{ status, by, at, note }]`
- `creditHold`: Boolean; `creditHoldOverride`: `{ by, at, note }`
- `advancePercent` (snapshot of the account's value at placement), `advanceAmount`, `remainingAmount` (= `payable - advanceAmount`, never independently rounded), `remainingDueDate` (placement + 14 days), `razorpayOrderId` (sparse unique), `razorpayPaymentId` — see §6.13
- `buyerNotes`, `adminNotes`, `cancelReason`, `rejectReason`
- `dispatch`: `{ mode: own_vehicle | transporter | courier | pickup, transporterName, lrNumber, vehicleNumber, trackingUrl, dispatchedAt, expectedDeliveryDate, notes }` — manual, free-text; independent of `courier` below
- `courier`: real Shadowfax shipment state (`provider, awbNumber, shadowfaxOrderId, status, statusDisplay, trackingUrl, actualWeightGrams, cancelReason, error, lastSyncedAt, history[]`) — same shape as retail `Order.courier`, via the shared `models/schemas/courierSchema.js`. See §6.14.
- `invoice`: ObjectId → Invoice
- `editHistory`: `[{ by, at, reason, before, after }]`
- timestamps

### 5.5 `Invoice.js` (immutable after creation)
- `invoiceNumber` (unique), `financialYear` (`"26-27"`), `issuedAt`
- `documentTitle` snapshot (`"Invoice"`), `taxMode` snapshot, `supplierTaxNote` snapshot
- `order`: ObjectId → B2BOrder (unique); `business`: ObjectId → BusinessAccount (indexed)
- `seller`: snapshot from config (legal name, trade name, address, phone, email, **FSSAI license no.**, bank details, UPI ID)
- `buyer`: snapshot (business name, GSTIN if any, billing address, phone)
- `shipTo`: snapshot
- `lines`: snapshot (S.No, description, size, cases, units, unit price, line total)
- `totals`: same shape as order
- `amountInWords`: "Rupees ... Only" (Indian numbering)
- `dueDate` (= the order's own `remainingDueDate` — placement + 14 days, fixed for every account; falls back to `order.createdAt` + 14 days only for an order placed before that field existed)
- `status`: `issued | cancelled`; `creditNote`: ObjectId → CreditNote

### 5.6 `CreditNote.js`
- `creditNoteNumber` (unique), `financialYear`, `issuedAt`, `documentTitle`, `taxMode`
- `invoice`: ObjectId → Invoice (unique; v1 = full cancellation only), `business`
- `reason`, `totals` (mirror of invoice), `createdBy`

### 5.7 `LedgerEntry.js` (append-only)
- `business`: ObjectId (indexed), `date` (indexed)
- `type`: `opening_balance | invoice | payment | credit_note | adjustment`
- `debit`: Number ≥ 0, `credit`: Number ≥ 0 (exactly one > 0)
- `refModel` + `refId` (Invoice / CreditNote), `reference` (UTR, cheque no.)
- `method` (payments): `upi | neft_rtgs | cash | cheque | razorpay | other`
- `note`, `recordedBy`
- Compound index `{ business: 1, date: 1, _id: 1 }`

**Outstanding** = Σ debit − Σ credit (positive = buyer owes us).

### 5.8 `Counter.js`
- `_id`: String (`b2b_order`, `invoice:26-27`, `credit_note:26-27`), `seq`: Number

---

## 6. Server-side logic (new `server/utils/` files, pure functions where possible)

### 6.1 `utils/money.js`
`round2`, `roundToRupee` (returns `{ rounded, roundOff }`), `amountInWordsINR` (lakh/crore system, paise if non-zero).

### 6.2 `utils/taxMode.js`
As described in Section 4. In `unregistered` mode: `computeLineTax` returns `{ taxAmount: 0 }`, `documentTitle('invoice') === 'Invoice'`, `documentTitle('credit_note') === 'Credit Note'`, `supplierTaxNote()` returns the fixed note. Validate the mode on server start.

### 6.3 `utils/gstin.js`
`validateGstin(gstin)`: format regex `^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$` **plus checksum**. Returns `{ valid, stateCode }`. Used only to validate the buyer's optional GSTIN and pre-fill their state.

### 6.4 `utils/indianStates.js`
`STATE_CODES` map (2-digit code → state/UT name) and `stateCodeFromName(name)`. Used for addresses and the delivery-region rule.

### 6.5 `utils/financialYear.js`
`getFinancialYear(date)` in IST → `"26-27"`, `getFinancialYearRange(fy)` → IST start/end dates. `formatDocNumber(prefix, fy, seq)` → `NCB/26-27/00001`; assert length ≤ 16.

### 6.6 `utils/b2bRegion.js`
`isAllowedDeliveryState(stateCode)` using `B2B_ALLOWED_STATE_CODES` (comma-separated). Used by quote, placement, admin edits, and address forms (the API exposes the allowed list so the UI can explain it).

### 6.7 `utils/b2bPricing.js`
- `resolveUnitPrice(catalogItem, tier)`: tier override if present, else `round2(base × (1 − tier.discountPercent/100))`.
- `priceB2BOrder({ items: [{ catalogItemId, cases }], account, shippingAddress })`:
  - Reject if the shipping address state is not allowed (clear message naming the allowed states).
  - Load active catalog items + products; reject if the product is missing or `inStock !== true`.
  - Enforce `cases` integer ≥ `moqCases`.
  - `units = cases × unitsPerCase`; `lineTotal = round2(unitPrice × units)`; tax via `taxMode.computeLineTax` (zero now).
  - Totals, rupee round-off. Enforce min order value (D7) on the subtotal.
  - Returns the priced structure or field-level errors.
- **Single source of truth for B2B totals**, used by `quote`, `placeOrder`, and admin edits.

### 6.8 `utils/b2bCredit.js`
`getCreditSummary(businessId)` → `{ outstanding, openOrderValue (placed/confirmed/packed, not yet invoiced), creditLimit, availableCredit, overdueAmount, oldestOverdueDays }`. Overdue = invoices past `dueDate` not covered by credits (FIFO allocation by date).

`shouldHold(account, amountAtRisk)`: hold if `outstanding + openOrderValue + amountAtRisk > creditLimit` or any invoice is overdue by more than 30 days — no special-casing by advance percentage. Callers pass whatever amount is genuinely still at risk: the full payable before an order exists (quote preview), or `remainingAmount` (`payable - advanceAmount`) once one does, since the advance is already guaranteed paid via Razorpay before the order can be created. A 100%-advance order's `remainingAmount` is 0, so it naturally never holds — the same outcome the old `prepaid` bypass produced, without needing a special case.

### 6.9 Order state machine (`utils/b2bOrderStatus.js`)
```
placed     → confirmed (admin; blocked while creditHold && !creditHoldOverride)
placed     → rejected  (admin, reason required)
placed     → cancelled (buyer or admin, reason required)
confirmed  → packed
packed     → dispatched (dispatch details required; auto-issues invoice if none exists)
dispatched → delivered
confirmed / packed → cancelled (admin; if invoiced, a credit note is created in the same transaction)
```
- Invoice may be issued manually from `confirmed` onward; exactly one per order.
- The old "prepaid account with outstanding dues requires `force: true` to dispatch" mechanism is gone — structurally impossible now that every order's advance is pre-verified via Razorpay at creation, not checked after the fact.
- Once `dispatched`, admin can additionally book a real Shadowfax shipment ("Create Shipment") — separate action, not required to reach `dispatched` itself. See §6.14.
- Admin quantity edits only in `placed`; re-price via `priceB2BOrder`, recompute `remainingAmount = max(0, newPayable - advanceAmount)` and `creditHold` off that (the already-collected advance never changes), append `editHistory`, notify the buyer.

### 6.10 Invoice issuance
In one transaction: fail with a clear error if `SELLER_FSSAI_LICENSE` or `SELLER_LEGAL_NAME` is missing; get the next number from Counter for the IST FY; build snapshots (seller, buyer, ship-to, lines, totals, `taxMode`, `documentTitle`, `supplierTaxNote`), `amountInWords`, `dueDate`; create `Invoice`; create `LedgerEntry` (type `invoice`, debit = `totals.payable`); set `order.invoice`.

### 6.11 PDF (`services/invoicePdfService.js`)
A4 document built with `pdfkit` from the stored snapshot only:
- Title from `documentTitle` (**"INVOICE"** — never "Tax Invoice").
- Seller block: legal/trade name, address, phone, email, **"FSSAI Lic. No.: …"** prominently.
- Invoice number, date, due date, order number, an "Advance:" line (e.g. "40% paid (₹4,000)" or "Full amount on credit" for a 0%-advance order) in place of the old payment-terms line.
- "Bill To" (business name, GSTIN if the buyer has one, address) and "Ship To".
- Line table: S.No, Description (name + size), Cases, Units, Rate per unit, Amount.
- Subtotal, round-off, **Total payable**, amount in words.
- Bank details and UPI ID.
- Footer: the `supplierTaxNote` ("Supplier not registered under GST. GST not charged.") and "This is a computer-generated document."
- Include the NC logo from `client/public/images/logo.png` if reachable from the server path, else text only.
- Same service renders credit notes (title "CREDIT NOTE", reference to the original invoice number and date).

Invoices show the seller address. That's fine even though the public site hides the shop address; invoices are private to the buyer.

### 6.12 Turnover watch (`utils/turnover.js`, read-only)
`getFinancialYearTurnover(fy)` = Σ retail `Order.total` (status not `cancelled`, created within the IST FY; count COD orders only when `delivered` and online orders when `paymentStatus === 'paid'`) + Σ B2B invoice `payable` minus credit notes in the FY. Returns `{ retail, wholesale, total, threshold, percentOfThreshold }`. Read-only queries on `Order`; no retail code changes.

### 6.13 Advance/remainder payment (`utils/b2bOrderCreation.js`, `b2bPaymentController.js`)

Mirrors retail checkout's real-money invariants exactly — same `VerifiedPayment` model, same HMAC verification, same atomic double-spend guard, same "server recomputes and cross-checks the amount, never trusts the client" rule.

- `POST /orders/payment/create-order` (`createAdvancePaymentOrder`): re-prices via `priceB2BOrder`, computes `advanceAmount = round2(payable × advancePercent / 100)`, creates a Razorpay order for that amount (paise) and a `VerifiedPayment` row — the same collection/model retail's `paymentController.createPaymentOrder` writes to, reused completely unmodified. `400` if `advanceAmount` would round to below ₹1 (nothing to collect for a 0%-advance account — place directly instead).
- The client verifies via the **existing, unmodified** `POST /api/payment/verify` — no B2B-specific verify endpoint exists.
- `createB2BOrderForUser` (called from `placeOrder`) is the only place a verified B2B payment gets consumed into an order:
  1. If `advanceAmount > 0`: load the `VerifiedPayment` by the client-supplied `razorpayOrderId`, check ownership/verified/not-yet-consumed, cross-check `verifiedPayment.amount` against a freshly-recomputed `advanceAmount` (rejects "pricing changed" on a mismatch), then atomically claim it (`findOneAndUpdate({_id, consumedAt: null}, {consumedAt: new Date()})`).
  2. If `advanceAmount` is 0 (a 0%-advance account): skip payment entirely, same shape as retail's COD path.
  3. Create the `B2BOrder` (with `advancePercent`/`advanceAmount`/`remainingAmount`/`remainingDueDate`/`razorpayOrderId`/`razorpayPaymentId`) and, if `advanceAmount > 0`, write one `LedgerEntry` (`type: 'payment', credit: advanceAmount, method: 'razorpay', refModel: 'B2BOrder'`) — **inside one Mongo transaction**, the same "order + its money-entry commit together or not at all" rule §6.10's invoice issuance already follows. Rolls back the payment claim (`consumedAt: null`) if the transaction itself fails, so the buyer isn't locked out of retrying with the same payment.
- `server/scripts/migrateB2BPaymentTerms.js` (`npm run b2b:migrate-payment-terms`, dry-run by default) backfills any account created before this change: `prepaid → advancePercent: 100`, `net7`/`net15`/`net30 → advancePercent: 0`.
- **Known limitation, by design**: self-service order cancellation (`POST /orders/:id/cancel`, only while `placed`) does not auto-refund an already-collected advance — the ledger credit stays fully visible for admin to reconcile manually, same "manual" principle as the remainder payment itself. Automatic Razorpay refunds were out of scope.

### 6.14 Shadowfax shipment for B2B (`b2bShippingController.js`)

Reuses `services/shadowfaxService.js`'s `createWarehouseOrder` completely unmodified except one additive option (`{ locationType }`, defaulting to `'residential'`; B2B always passes `'commercial'`).

- `POST /orders/:id/create-shipment` / `.../cancel-shipment` (admin-only, wired the same way as retail's equivalents in `routes/shipping.js`) — always admin-triggered via a "Create Shipment" button shown once an order is `dispatched` and has no AWB yet, never automatic on placement.
- A small adapter (`toShadowfaxOrderShape`) maps `B2BOrder`'s field names onto the plain shape the retail-oriented service expects (`shippingAddress.contactName → name`, `items[].units → qty`, `totals.payable → total`). `paymentMethod` is always sent as `'ONLINE'` — B2B never uses Shadowfax's own COD cash-collection; the remainder is invoiced/collected by us directly, never by the courier.
- No B2B-specific pre-flight weight cap (unlike retail's 7kg `SHADOWFAX_MAX_ORDER_WEIGHT_GRAMS`) — a wholesale order can legitimately weigh far more than a retail parcel, and there's no confirmed real Shadowfax per-shipment limit to encode without guessing. A genuine rejection from Shadowfax surfaces as a normal booking error, persisted to `courier.error`.
- **One shared webhook, not two**: the existing Shadowfax Push Callback endpoint (`POST /api/shipping/webhook/shadowfax`) now tries a retail `Order` lookup first, then falls back to `B2BOrder` (by `order_id`, then by AWB) — rather than requiring a second registered webhook URL, whose availability on this Shadowfax account is unconfirmed. Courier tracking state/history updates identically for either order type; the **status effect** on the order's own `status` field deliberately differs — B2B's workflow is admin-driven, not auto-progressing through dispatch the way retail's status enum is, so only a real `delivered` event, and only from the one legitimate predecessor status `dispatched`, auto-advances `B2BOrder.status`.

---

## 7. API contract

All responses use `{ success, ... }`. All routes below use `protect` then `userActionLimiter`, plus a validator chain + `validate`. Mount in `server/server.js`:

```js
app.use('/api/b2b/admin', require('./routes/b2bAdmin')); // protect, userActionLimiter, admin
app.use('/api/b2b',       require('./routes/b2b'));      // protect, userActionLimiter
```
(admin mount **before** the general one). Validators: `server/validators/b2bValidators.js`, `server/validators/b2bAdminValidators.js`.

New middleware `server/middleware/business.js`:
- `loadBusiness`: attaches `req.business` (any status) or 404 `{ message: 'No business account' }`.
- `requireApprovedBusiness`: 403 unless `status === 'approved'`.
- Suspended accounts can read orders, invoices, and ledger, but cannot quote or place orders.

### 7.1 Business-facing (`/api/b2b`)
| Method | Path | Guard | Purpose |
|---|---|---|---|
| GET | `/config` | protect | Public-to-logged-in settings: allowed delivery states, min order value (no secrets) |
| GET | `/me` | protect | Own account (or `null`) + credit summary if approved |
| POST | `/apply` | protect | Create application (a `rejected` applicant may re-apply, resetting to `pending`) |
| PUT | `/me` | loadBusiness | Update contact details and shipping addresses. `businessName`, `gstin`, `billingAddress` editable only while `pending`; afterwards via admin |
| GET | `/catalog` | approved | Active catalog items with product name/img/Marathi name, size, unitsPerCase, moqCases, resolved unitPrice, inStock |
| POST | `/orders/quote` | approved | Stateless pricing of `{ items, shippingAddressId }` → breakdown + errors + credit preview (`wouldHold`) + `advancePercent`/`advanceAmount`/`remainingAmount` |
| POST | `/orders/payment/create-order` | approved | Creates a Razorpay order for the advance only + a `VerifiedPayment` row (§6.13). `400` if the advance would round to 0 |
| POST | `/orders` | approved | Place order (server re-prices, checks region, sets `creditHold` off `remainingAmount`, emails). Optional `razorpayOrderId` — required, checked in `utils/b2bOrderCreation.js`, whenever the advance is nonzero |
| GET | `/orders` | loadBusiness | Paginated list, filter by status |
| GET | `/orders/:id` | loadBusiness | Own order only |
| POST | `/orders/:id/cancel` | loadBusiness | Only while `placed`, reason required |
| GET | `/invoices` | loadBusiness | Own invoices (with credit-note info) |
| GET | `/invoices/:id` | loadBusiness | Own invoice JSON |
| GET | `/invoices/:id/pdf` | loadBusiness | Streams PDF (`filename="NCB-26-27-00001.pdf"`) |
| GET | `/credit-notes/:id/pdf` | loadBusiness | Own credit note PDF |
| GET | `/ledger?from&to` | loadBusiness | Opening balance, entries with running balance, closing balance, credit summary |
| GET | `/ledger/export.csv?from&to` | loadBusiness | CSV statement |

### 7.2 Admin (`/api/b2b/admin`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/summary` | Pending applications, orders by status, total outstanding, aging buckets (0–30, 31–60, 61–90, 90+), top outstanding accounts, **FY turnover vs GST threshold** |
| GET | `/accounts?status&search&page` | List accounts |
| GET | `/accounts/:id` | Detail + credit summary + recent orders |
| POST | `/accounts` | Create an account directly for an existing user by email (status `approved`) |
| PUT | `/accounts/:id` | Edit details, tier, terms, credit limit, notes |
| POST | `/accounts/:id/approve` | Body: tier, advancePercent (0 valid — a pure-credit account), creditLimit, note |
| POST | `/accounts/:id/reject` | Body: reason |
| POST | `/accounts/:id/suspend` / `/reactivate` | Body: note |
| GET/POST/PUT/DELETE | `/tiers`, `/tiers/:id` | Tier CRUD (block delete if in use; deactivate instead) |
| GET/POST/PUT/DELETE | `/catalog`, `/catalog/:id` | Catalog CRUD (deactivate rather than delete if ever ordered) |
| GET | `/orders?status&business&from&to&page` | List |
| GET | `/orders/:id` | Detail |
| PUT | `/orders/:id/items` | Edit quantities while `placed` (reason required) |
| POST | `/orders/:id/status` | Body: `{ status, note, reason, dispatch }` — validated by the state machine |
| POST | `/orders/:id/override-credit-hold` | Body: note |
| POST | `/orders/:id/invoice` | Issue invoice |
| POST | `/orders/:id/create-shipment` | Book a real Shadowfax AWB (§6.14). `502` with the real error persisted to `courier.error` on failure |
| POST | `/orders/:id/cancel-shipment` | Cancel the Shadowfax shipment. Body: optional `remarks` |
| GET | `/invoices?business&from&to` | List |
| GET | `/invoices/:id/pdf` | Any invoice PDF |
| POST | `/invoices/:id/credit-note` | Full cancellation credit note (reason required) |
| GET | `/credit-notes/:id/pdf` | PDF |
| GET | `/accounts/:id/ledger?from&to` | Statement |
| POST | `/accounts/:id/payments` | Record payment: amount, date, method, reference, note |
| POST | `/accounts/:id/adjustments` | Debit or credit adjustment with mandatory note |
| POST | `/accounts/:id/opening-balance` | Only once, only when the ledger is empty (for migrating existing distributors) |
| GET | `/accounts/:id/ledger/export.csv` | CSV |

Also extend the safe user object returned by login, register, Google login, and `GET /api/auth/me` with a minimal `business: { status } | null` so the Navbar can show a "Business Portal" link without an extra request. Find where the safe user object is built in `authController.js` and change it in one place. This is the only permitted edit to auth code; keep it additive.

---

## 8. Frontend (`client/`)

### 8.1 API layer
Add `b2bAPI` and `b2bAdminAPI` groups to `client/src/services/api.js`. PDF/CSV downloads must use the axios instance with `responseType: 'blob'` (the JWT is in localStorage, so plain `<a href>` links won't authenticate), then trigger a download via an object URL.

### 8.2 Price wording (all B2B UI, emails, CSV)
Show prices as plain final amounts, e.g. "₹38.00 / pack". Never mention GST, "incl. tax", or "excl. tax". Where buyers may ask, a small info line on the Quick Order and Invoices pages: "Prices are final. We are not currently registered under GST, so no GST is charged." (text comes from the server config so it changes automatically if the tax mode changes).

### 8.3 Routes (in `App.jsx`, lazy-loaded, provider order unchanged)
| Route | Access | Page |
|---|---|---|
| `/business` | Public, **indexable** | `BusinessLandingPage` — why partner with Namdev Chiwda (heritage since 1873, Solapur, product range, FSSAI-licensed kitchen), how it works (apply → approval → order → invoice), delivery currently within Maharashtra (text driven by config), FAQ, CTA to apply. Reuse true brand facts only (see `AGENT.md` §29). Add to `STATIC_PAGES`. |
| `/business/apply` | Auth | `BusinessApplyPage` — form with optional GSTIN (live validation, auto-fills state), shows current application status if one exists, notes the delivery region |
| `/b2b` | Auth | `B2BDashboardPage` — status gate: pending / rejected (reason + re-apply) / suspended notice; if approved: outstanding, available credit, overdue banner, recent orders, quick links |
| `/b2b/order` | Approved | `B2BQuickOrderPage` |
| `/b2b/orders` | Business | `B2BOrdersPage` |
| `/b2b/orders/:id` | Business | `B2BOrderDetailPage` — status timeline, items, dispatch/LR info, invoice download, cancel (if `placed`), **Reorder** |
| `/b2b/invoices` | Business | `B2BInvoicesPage` — list, PDFs, due dates, overdue badge |
| `/b2b/statement` | Business | `B2BStatementPage` — date range, opening/running/closing balance, CSV |
| `/b2b/profile` | Business | `B2BProfilePage` — contact details and shipping addresses (addresses outside allowed states can be saved but are marked "not deliverable yet" and cannot be selected at checkout) |

New pages under `client/src/pages/business/`, shared components under `client/src/components/b2b/`. All `/b2b/*` and `/business/apply` pages use `<SEO robots="noindex,nofollow">` with a canonical. `/b2b/*` pages share a `B2BLayout` (sub-nav: Dashboard, Quick Order, Orders, Invoices, Statement, Profile; pills on mobile, sidebar on desktop, like `AccountNav`). `ProtectedRoute` gains an optional `businessOnly` prop (UX only).

A `B2BContext` is mounted **only inside the `/b2b` route tree** (not in the global provider chain) holding the account, credit summary, config, and the quick-order draft.

### 8.4 Quick Order page (the most important screen)
- Grouped by product; one row per catalog item: image, name (+ Marathi name), size, units/case, MOQ, price per unit, a case stepper (new `CaseStepper` component — do **not** reuse `QuantityStepper`, which is bound to the retail cart), and line total.
- Out-of-stock rows visible but disabled.
- Sticky summary (bottom bar on mobile, side panel on desktop): cases, units, total payable, progress bar to minimum order value, available credit, credit-hold warning.
- Totals come from a **debounced** `POST /orders/quote` (~400ms); server field errors shown inline.
- Shipping address selector (only deliverable addresses selectable), buyer notes, and a confirmation modal before placing.
- Draft persisted to localStorage per user; cleared on successful placement.
- Comfortable on a phone: on small screens rows render as compact cards.

### 8.5 Admin (`components/admin/`)
Add a group `'b2b'` to `TABS` and render it in `AdminNav.jsx` under a "Wholesale" heading:
- `B2BAccountsTab` — applications queue (pending badge), approve modal (tier, terms, credit limit), reject/suspend/reactivate, account detail drawer (credit summary, recent orders, record payment, adjustment), "Create account for existing user".
- `B2BOrdersTab` — filters, credit-hold badge + override, state-machine actions, quantity edit while `placed`, dispatch form, issue invoice, PDF download, credit note on cancel.
- `B2BCatalogTab` — tiers (CRUD, default) and catalog items (product+size picker, unitsPerCase, MOQ, base price, optional HSN labelled "for future GST use", tier overrides, active, sort order).
- `B2BLedgerTab` — outstanding by account with aging buckets, per-account statement, CSV export.
- **GST threshold card** (in `B2BLedgerTab` header and optionally on `DashboardTab`): FY turnover split retail/wholesale, progress toward `GST_REGISTRATION_THRESHOLD`, amber at 80%, red at 100%, with the text "Informational only — confirm registration requirements with your CA."

Each tab fetches its own data. Destructive/irreversible actions (reject, suspend, cancel, credit note, force dispatch) use a confirm dialog.

### 8.6 Storefront touchpoints
- `Navbar.jsx`: account menu shows "Business Portal" → `/b2b` when `user.business?.status` exists, else "Wholesale / For Business" → `/business`.
- `DistributorshipBand.jsx`: primary CTA "Apply for a wholesale account" → `/business`; keep WhatsApp/phone/email.
- `Footer.jsx`: "Wholesale" link to `/business`.

---

## 9. Notifications (email via existing Resend service, best-effort)

| Event | To |
|---|---|
| Application submitted | Admin (`B2B_ADMIN_NOTIFY_EMAIL`) + applicant |
| Approved / rejected / suspended | Applicant |
| Order placed | Admin + buyer (credit hold flagged to admin) |
| Order edited by admin | Buyer (before/after summary) |
| Confirmed, dispatched (LR/vehicle/tracking), delivered, cancelled/rejected | Buyer |
| Invoice issued | Buyer (invoice no., amount, due date, link to `/b2b/invoices`) |
| Payment recorded | Buyer (amount, reference, new outstanding) |

New functions in `emailService.js` (additive; don't alter `sendOrderConfirmation`), same visual style as the existing order email. No GST wording in any email.

---

## 10. Configuration

New file `server/config/business.js`, reading env with safe fallbacks and exporting a frozen object. Add to `server/.env.example`:

```
# ── B2B / Wholesale ──
SELLER_GST_MODE=unregistered            # only 'unregistered' is implemented for now
SELLER_LEGAL_NAME=
SELLER_TRADE_NAME=Namdev Chiwda
SELLER_FSSAI_LICENSE=                   # required: printed on every invoice/credit note
SELLER_ADDRESS_LINE1=
SELLER_ADDRESS_LINE2=
SELLER_CITY=Solapur
SELLER_STATE_CODE=27
SELLER_PINCODE=
SELLER_PHONE=
SELLER_EMAIL=care@namdevchiwda.com
SELLER_BANK_NAME=
SELLER_BANK_ACCOUNT_NAME=
SELLER_BANK_ACCOUNT_NO=
SELLER_BANK_IFSC=
SELLER_UPI_ID=
B2B_ALLOWED_STATE_CODES=27              # comma-separated 2-digit state codes
B2B_MIN_ORDER_VALUE=5000
B2B_ADMIN_NOTIFY_EMAIL=care@namdevchiwda.com
GST_REGISTRATION_THRESHOLD=4000000      # informational turnover watch only
```

If `SELLER_FSSAI_LICENSE` or `SELLER_LEGAL_NAME` is missing, invoice issuance fails with a clear 500 message; the rest of the portal keeps working. An unsupported `SELLER_GST_MODE` fails at server start.

---

## 11. Phased build plan

Each phase ends with: `cd client && npm run build` passing, server starting cleanly, `cd server && npm test` passing (from Phase 1 on), the manual checks below, an updated `AGENT.md`, and a commit. **Stop after each phase and wait for my go-ahead.**

### Phase 0 — Orientation (no code changes)
Read `AGENT.md` and this spec. Inspect every file in Section 3. Report: (a) conflicts between this spec and the code, (b) exact files to create/modify per phase, (c) open questions. Create branch `feature/b2b-portal`. Confirm whether the MongoDB deployment supports transactions.

### Phase 1 — Foundations
All models (Section 5), `utils/money.js`, `utils/taxMode.js`, `utils/gstin.js`, `utils/indianStates.js`, `utils/financialYear.js`, `utils/b2bRegion.js`, `utils/b2bPricing.js`, `utils/b2bCredit.js`, `utils/b2bOrderStatus.js`, `config/business.js`, `.env.example`. Add `"test": "node --test"` to `server/package.json` and write `node:test` unit tests (no new test dependencies) in `server/tests/` for: tax mode returns zero tax and correct titles, unsupported mode throws; GSTIN format + checksum (valid/invalid); rupee round-off; amount in words (e.g. 1,23,456.50); FY boundary in IST (31 Mar 23:59 vs 1 Apr 00:00 IST); doc number length ≤ 16; tier price resolution; MOQ, min order value, and delivery-state errors; state machine allowed/forbidden transitions.
**Acceptance:** tests pass; server boots; no existing route behaves differently.

### Phase 2 — Onboarding and approval
`middleware/business.js`, `/config`, `/apply`, `/me`, `PUT /me`, admin account endpoints, tiers CRUD, the `business` field on the auth user object, application/approval emails. Frontend: `/business` landing (+ sitemap), `/business/apply`, `/b2b` status gate, `B2BLayout`, `B2BContext`, `ProtectedRoute businessOnly`, Navbar/Footer/DistributorshipBand links, `B2BAccountsTab` (without ledger actions), tier section of `B2BCatalogTab`.
**Acceptance:** apply → admin approves with tier/terms/limit → portal opens; rejected user sees reason and can re-apply; suspended user sees a notice; a normal user gets 401/403/404 on admin and approved-only endpoints (check with curl).

### Phase 3 — Catalog, quick order, B2B orders
Catalog CRUD + admin UI, `/catalog`, `/orders/quote`, `/orders` place/list/detail/cancel, admin order list/detail/edit/status/credit-hold override, emails. Frontend: Quick Order, orders list/detail with Reorder, `B2BOrdersTab`.
**Acceptance:** tier prices correct; MOQ, min order value, and **Maharashtra-only delivery** enforced server-side even when the client is bypassed (curl); out-of-stock blocked; over-limit order lands on `creditHold` and cannot be confirmed until overridden; edits re-price and notify; buyer A cannot open buyer B's order; `/api/products` contains no wholesale fields; no GST text anywhere in the UI; retail COD checkout still works end to end.

### Phase 4 — Invoices, credit notes, ledger
Counter numbering, invoice transaction, auto-invoice on dispatch, PDF service, credit notes, ledger (payments, adjustments, opening balance), statements, CSV, credit summary with overdue/aging, turnover watch, emails. Frontend: Invoices, Statement, dashboard credit widgets, `B2BLedgerTab`, GST threshold card, admin invoice/credit-note/payment actions.
**Acceptance:** concurrent issuance never duplicates or skips numbers; PDF title is "INVOICE", shows the FSSAI number and the "not registered under GST" note, and has **no** GST/HSN columns; PDF totals match the order; cancelling an invoiced order creates a credit note and matching ledger credit; outstanding and running/closing balances correct across date ranges; turnover card totals match a manual count. Advance/Shadowfax acceptance (§6.13/§6.14): a nonzero-advance order cannot be placed without a verified Razorpay payment for exactly the recomputed advance amount; the same payment can never be consumed twice; `creditHold` reflects `remainingAmount`, not the full payable; a 0%-advance account places with no payment step at all; "Create Shipment" on a dispatched order books a real AWB and only a real Shadowfax `delivered` event (from `dispatched`) auto-advances the order's status.

### Phase 5 — Polish and docs
Wholesale summary card, empty/loading/error states, mobile pass on every B2B screen, accessibility pass, final review of rate limits and validators on every new route, and a full `AGENT.md` update: new §31 "B2B Wholesale Portal" (models, routes, pricing/credit rules, tax mode, delivery region, state machine, env vars, traps), new routes in §7 and §13, and in §24 note that trap 8 (Order `size`/`weight`) appears already fixed in `models/Order.js` and `utils/orderCreation.js` (verify first).

### Phase 6 — Optional, only when I ask
- **GST activation** (after registration): implement `SELLER_GST_MODE=regular` in `taxMode.js` — GST rate per catalog item, CGST+SGST vs IGST by place of supply, "Tax Invoice" title, our GSTIN and HSN columns/summary on PDFs, tax-exclusive pricing option, widen `B2B_ALLOWED_STATE_CODES`. Existing unregistered invoices must remain unchanged (they are snapshots).
- Razorpay payment of outstanding dues (idempotent on payment ID, HMAC verification like `paymentController`, ledger credit with method `razorpay`).
- WhatsApp template notifications, per-SKU inventory.

---

## 12. Things to double-check while building

- `/api/b2b/admin` mounted before `/api/b2b`; static paths before `/:id` in each router.
- Every new route has: rate-limit tier, validator chain + `validate`, `protect`, and `admin` or business middleware in the documented order.
- No wholesale field ever appears in `Product` documents or `/api/products*` responses.
- No GST wording, percentages, or columns in any B2B UI, email, CSV, or PDF while unregistered; all tax behaviour flows through `utils/taxMode.js`.
- FSSAI number present on every invoice and credit note.
- Delivery-state rule enforced in quote, placement, and admin edits.
- Snapshots are written at placement and invoice time; past orders/invoices never re-read live catalog data.
- All money math goes through `utils/money.js` and `utils/b2bPricing.js`, never inline in controllers or React.
- IST used for FY, document dates, due dates, and statement filters.
- Email failures never fail the main action.
- No logging of GSTINs, bank details, or tokens beyond what existing code already logs.

## 13. When to ask me instead of deciding
- Any change to a retail file other than the explicitly permitted ones (`server.js` mounts, `authController` safe-user field, `api.js`, `App.jsx` routes, `ProtectedRoute`, `Navbar`, `Footer`, `DistributorshipBand`, `adminConstants`, `AdminNav`, `AdminPage` tab rendering, `DashboardTab` threshold card, `generate-seo-files.mjs`, `emailService.js` additions, `.env.example`, `package.json` scripts/deps, `AGENT.md`).
- Any new dependency other than `pdfkit`.
- Any business rule in Section 0 that turns out to be impractical in the code.