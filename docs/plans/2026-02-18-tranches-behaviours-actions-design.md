# Design: Tranches, Behaviours & Restructured Actions
**Date:** 2026-02-18
**Status:** Approved
**Scope:** Frontend only — all data is in-memory / faux API (no real backend calls)

---

## Overview

This design restructures the Block case management system to support:
1. Transaction cohorts (Catalyst + Historical Tranches) with bulk upload via simulated API
2. Restructured actions with explicit recipients and linked transactions
3. Behaviour flags per transaction, aggregated to case level
4. Updated case creation as a multi-step wizard
5. Behaviour reporting on the Reports page

---

## 1. Data Model Changes

### 1.1 Transaction (additions)

```typescript
interface Transaction {
  // existing fields unchanged...
  cohort: "catalyst" | "historical"
  tranche_number: number          // 1 for catalyst; 1, 2, 3... for historical
  behaviours: BehaviourFlag[]     // multi-select, added manually during review
}

type BehaviourFlag =
  | "privacy_breach"
  | "credit_fraud"
  | "id_fraud"
  | "refund_manipulation"
  | "unauthorised_access"
  | "cash_discrepancy"
```

### 1.2 Tranche (new entity)

```typescript
interface Tranche {
  id: string
  case_id: string
  type: "catalyst" | "historical"
  number: number          // always 1 for catalyst; auto-increments for historical
  date_range?: string     // optional label, e.g. "Jan 2024 – Dec 2024"
  created_at: string
}
```

Each case has exactly one catalyst tranche and zero or more historical tranches.

### 1.3 CaseAction (restructured)

```typescript
interface CaseAction {
  id: string
  case_id: string
  type: "notification" | "pause" | "release_withdraw"
  recipient: "B&C" | "ER" | "all"
  transaction_ids: string[]   // 1 or more linked transactions (empty for notification)
  tranche_ref?: string        // optional, e.g. "Historical Tranche #2"
  triggered_at: string
  note?: string
}
```

### 1.4 Case (additions)

```typescript
interface Case {
  // existing fields unchanged...
  tranches: Tranche[]
  behaviours: BehaviourFlag[]   // derived: union of all transaction behaviours
}
```

---

## 2. Behaviour Flags

### Fixed list

| Key | Display Label |
|-----|--------------|
| `privacy_breach` | Privacy Breach |
| `credit_fraud` | Credit Fraud |
| `id_fraud` | ID Fraud |
| `refund_manipulation` | Refund Manipulation |
| `unauthorised_access` | Unauthorised Access |
| `cash_discrepancy` | Cash / Till Discrepancy |

### Where behaviours appear

- **Transaction edit modal:** multi-select checkboxes — added manually during review
- **Transaction row:** small behaviour tags displayed inline
- **Case Detail page:** case-level behaviours card showing the union of all transaction behaviours
- **Reports page:** behaviours breakdown section

### Derivation

Case-level behaviours = deduplicated union of all `transaction.behaviours` arrays across all transactions in the case. Recalculated whenever a transaction is saved.

---

## 3. Case Creation — Multi-Step Wizard

Replaces the existing single-page form with a 3-step wizard.

### Step 1 — Case Details
- Case Title (required)
- Staff Member (required)
- Assign Analyst (optional)
- Description (optional)

### Step 2 — Catalyst Transactions
- Textarea: paste transaction IDs (one per line or comma-separated)
- "Fetch Details" button → 1.5s simulated loading state
- Faux API generates per-ID: Date, Description, Amount, Status (awaiting_review), Finding (unsubstantiated)
- Preview table: ID | Date | Description | Amount | Status
- Must have at least one transaction to proceed

### Step 3 — Review & Submit
- Summary of case details + transaction count
- Submit → creates case + transactions (cohort: catalyst, tranche_number: 1) + Catalyst Tranche record + auto notification action (recipient: all)

---

## 4. Bulk Upload — Historical Tranches

Accessible from the Case Detail page via a "Bulk Upload" button in the Transactions section.

### Modal Steps

**Step 1 — Paste IDs**
- Textarea for transaction IDs
- Parse button: validates format, shows "N transaction IDs found"

**Step 2 — Simulated API Fetch**
- Loading state (~1.5s)
- Preview table: ID | Date | Description | Amount | Simulated Status

**Step 3 — Tranche Assignment**
- Tranche Type: "Historical" (only option here — Catalyst is case creation only)
- Tranche Number: auto-assigned (next available: existing historical count + 1), displayed read-only
- Date Range: optional free-text field (e.g. "Jan 2024 – Dec 2024")
- Checkbox: **"Send pause action to B&C for these transactions"** (pre-ticked)
- Submit

### On Submit
- Transactions added with `cohort: historical`, `tranche_number: N`
- New Tranche record created
- If checkbox ticked: one CaseAction created — type: pause, recipient: B&C, transaction_ids: all uploaded IDs, tranche_ref: "Historical Tranche #N"

---

## 5. Auto-Action Triggers (per transaction update)

| Trigger | Action Type | Recipient | Transactions |
|---------|------------|-----------|--------------|
| Case created | notification | all (B&C + ER) | [] |
| Bulk upload (checkbox ticked) | pause | B&C | all uploaded IDs |
| Transaction finding → ISP | pause | ER | [that transaction] |
| Transaction finding → non-ISP (from any finding) | release_withdraw | B&C | [that transaction] |

> Note: Auto-actions fire on every finding change. If a transaction oscillates between ISP and non-ISP, each change creates a new action — this is intentional for audit trail purposes.

---

## 6. Transactions Section — Case Detail Page

Transactions are now grouped by tranche with a collapsible section per group:

```
▼ Catalyst Tranche  (3 transactions)
   TXN-001 | 12 Jan 2024 | Cash refund | £45.00 | [unsubstantiated] | [privacy_breach]
   ...

▼ Historical Tranche #1  •  Jan 2023 – Dec 2023  (8 transactions)
   TXN-020 | 05 Mar 2023 | ...
   ...
```

Each transaction row shows behaviour flag tags inline.

---

## 7. Actions Section — Case Detail Page

Each action now displays:
- Request type badge (notification / pause / release & withdraw)
- Recipient badge (B&C / ER / All)
- Linked transactions: comma-separated references or tranche label
- Timestamp + optional note

Manual "Trigger Action" button retained for ad-hoc pause/release actions, now includes a transaction selector (multi-select from current case transactions).

---

## 8. Reports Page — Behaviours Section

New section added after the existing Analyst Workload section.

**8.1 Behaviour Breakdown (bar chart)**
- Horizontal bar chart: one bar per behaviour type
- Value = number of transactions with that behaviour flag

**8.2 Behaviours Summary Table**

| Behaviour | Transactions | Cases |
|-----------|-------------|-------|
| Privacy Breach | 4 | 2 |
| Credit Fraud | 3 | 3 |
| ... | | |

---

## 9. Seed Data Updates

Existing seed transactions updated to include:
- `cohort: "catalyst"`, `tranche_number: 1`
- Sample `behaviours` arrays (varied across transactions)

Existing seed actions updated to include:
- `recipient` field
- `transaction_ids` array (can be empty for legacy notifications)

---

## 10. Out of Scope

- Real API integration (all data remains in-memory)
- Backend changes
- User-configurable behaviour types
- Tranche deletion or merging
- Editing tranche date range after creation
