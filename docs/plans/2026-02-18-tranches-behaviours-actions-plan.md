# Tranches, Behaviours & Restructured Actions — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add transaction cohorts (Catalyst + Historical Tranches) with bulk CSV upload, restructured actions with explicit recipients and linked transactions, behaviour flags per transaction aggregated to case level, and a behaviours reporting section.

**Architecture:** Frontend-only changes to the in-memory API (`frontend/src/api/index.ts`), types (`frontend/src/types/index.ts`), and three pages. The faux API lookup simulates a 1.5s network delay via `setTimeout`. No new dependencies needed.

**Tech Stack:** React 18, TypeScript, Vite. CSS in `frontend/src/App.css`.

---

## Task 1: Update Types

**Files:**
- Modify: `frontend/src/types/index.ts`

**Step 1: Replace the entire file**

```typescript
export type CaseStatus =
  | "new"
  | "triage"
  | "awaiting_allocation"
  | "under_review"
  | "awaiting_information"
  | "awaiting_finalisation"
  | "closed";

export type TransactionStatus = "awaiting_review" | "under_review" | "reviewed";

export type Finding = "unsubstantiated" | "non_compliance" | "ISP";

export type ActionType = "notification" | "pause" | "release_withdraw";

export type ActionRecipient = "B&C" | "ER" | "all";

export type BehaviourFlag =
  | "privacy_breach"
  | "credit_fraud"
  | "id_fraud"
  | "refund_manipulation"
  | "unauthorised_access"
  | "cash_discrepancy";

export type TranchType = "catalyst" | "historical";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Tranche {
  id: number;
  case_id: number;
  type: TranchType;
  number: number;
  date_range?: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  case_id: number;
  reference: string;
  description: string | null;
  transaction_date: string | null;
  pipeline_status: TransactionStatus;
  finding: Finding;
  notes: string | null;
  cohort: TranchType;
  tranche_number: number;
  behaviours: BehaviourFlag[];
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: number;
  reference: string;
  title: string;
  description: string | null;
  subject_name: string;
  pipeline_status: CaseStatus;
  finding: Finding;
  assigned_user_id: number | null;
  assignee: User | null;
  transactions: Transaction[];
  tranches: Tranche[];
  behaviours: BehaviourFlag[];
  transaction_count?: number;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CaseAction {
  id: number;
  case_id: number;
  type: ActionType;
  recipient: ActionRecipient;
  transaction_ids: number[];
  tranche_ref?: string;
  triggered_at: string;
  note: string | null;
}

export const CASE_STATUSES: CaseStatus[] = [
  "new", "triage", "awaiting_allocation", "under_review",
  "awaiting_information", "awaiting_finalisation", "closed",
];

export const TRANSACTION_STATUSES: TransactionStatus[] = [
  "awaiting_review", "under_review", "reviewed",
];

export const FINDINGS: Finding[] = ["unsubstantiated", "non_compliance", "ISP"];

export const FINDING_PRIORITY: Record<Finding, number> = {
  unsubstantiated: 0,
  non_compliance: 1,
  ISP: 2,
};

export const BEHAVIOUR_FLAGS: { key: BehaviourFlag; label: string }[] = [
  { key: "privacy_breach", label: "Privacy Breach" },
  { key: "credit_fraud", label: "Credit Fraud" },
  { key: "id_fraud", label: "ID Fraud" },
  { key: "refund_manipulation", label: "Refund Manipulation" },
  { key: "unauthorised_access", label: "Unauthorised Access" },
  { key: "cash_discrepancy", label: "Cash / Till Discrepancy" },
];

export function labelCaseStatus(s: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    new: "New", triage: "Triage", awaiting_allocation: "Awaiting Allocation",
    under_review: "Under Review", awaiting_information: "Awaiting Information",
    awaiting_finalisation: "Awaiting Finalisation", closed: "Closed",
  };
  return map[s];
}

export function labelTransactionStatus(s: TransactionStatus): string {
  const map: Record<TransactionStatus, string> = {
    awaiting_review: "Awaiting Review", under_review: "Under Review", reviewed: "Reviewed",
  };
  return map[s];
}

export function labelFinding(f: Finding): string {
  const map: Record<Finding, string> = {
    unsubstantiated: "Unsubstantiated", non_compliance: "Non-Compliance", ISP: "ISP",
  };
  return map[f];
}

export function labelActionType(t: ActionType): string {
  const map: Record<ActionType, string> = {
    notification: "Case Opened", pause: "Pause", release_withdraw: "Release / Withdraw",
  };
  return map[t];
}

export function labelRecipient(r: ActionRecipient): string {
  const map: Record<ActionRecipient, string> = {
    "B&C": "B&C", ER: "ER", all: "B&C & ER",
  };
  return map[r];
}
```

**Step 2: Commit**

```bash
cd /c/Coding/Block
git add frontend/src/types/index.ts
git commit -m "feat: add Tranche, BehaviourFlag, restructure CaseAction types"
```

---

## Task 2: Update API — Seed Data & Store

**Files:**
- Modify: `frontend/src/api/index.ts`

This task updates the imports, seed data arrays, and in-memory store. Do **not** change any API function signatures yet (Task 3 handles that).

**Step 1: Replace the import line at the top**

Old:
```typescript
import type { Case, Transaction, User, Finding, CaseAction, ActionType } from "../types";
import { FINDING_PRIORITY } from "../types";
```

New:
```typescript
import type { Case, Transaction, Tranche, User, Finding, CaseAction, ActionType, BehaviourFlag, TranchType, ActionRecipient } from "../types";
import { FINDING_PRIORITY } from "../types";
```

**Step 2: Replace seedTransactions**

Replace the entire `seedTransactions` array (lines 14–25) with:

```typescript
const seedTransactions: Transaction[] = [
  { id: 1, case_id: 1, reference: "TXN-10041", description: "Till short", transaction_date: "2024-11-01", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["cash_discrepancy"], created_at: "2024-11-05T10:00:00Z", updated_at: "2024-11-05T10:00:00Z" },
  { id: 2, case_id: 1, reference: "TXN-10055", description: "Till short", transaction_date: "2024-11-04", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["cash_discrepancy"], created_at: "2024-11-05T10:00:00Z", updated_at: "2024-11-05T10:00:00Z" },
  { id: 3, case_id: 2, reference: "TXN-20012", description: "Account lookup — no active call", transaction_date: "2024-10-22", pipeline_status: "reviewed", finding: "non_compliance", notes: "Confirmed no call in progress at time of access.", cohort: "catalyst", tranche_number: 1, behaviours: ["unauthorised_access", "privacy_breach"], created_at: "2024-10-28T10:00:00Z", updated_at: "2024-11-07T10:00:00Z" },
  { id: 4, case_id: 2, reference: "TXN-20019", description: "Address change — no active call", transaction_date: "2024-10-23", pipeline_status: "under_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["unauthorised_access"], created_at: "2024-10-28T10:00:00Z", updated_at: "2024-11-07T10:00:00Z" },
  { id: 5, case_id: 3, reference: "TXN-30001", description: "Missing stock — headphones x3", transaction_date: "2024-10-01", pipeline_status: "reviewed", finding: "ISP", notes: "CCTV confirms subject removed items from stockroom.", cohort: "catalyst", tranche_number: 1, behaviours: ["cash_discrepancy"], created_at: "2024-10-05T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  { id: 6, case_id: 3, reference: "TXN-30002", description: "Missing stock — tablet x1", transaction_date: "2024-10-08", pipeline_status: "reviewed", finding: "non_compliance", notes: "Procedural breach confirmed; theft not proven.", cohort: "catalyst", tranche_number: 1, behaviours: [], created_at: "2024-10-10T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  { id: 7, case_id: 3, reference: "TXN-30003", description: "Missing stock — cables", transaction_date: "2024-10-15", pipeline_status: "reviewed", finding: "unsubstantiated", notes: "Stock discrepancy attributed to data entry error.", cohort: "catalyst", tranche_number: 1, behaviours: [], created_at: "2024-10-18T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  { id: 8, case_id: 3, reference: "TXN-30010", description: "Historical: Cash drawer reconciliation", transaction_date: "2024-01-15", pipeline_status: "reviewed", finding: "non_compliance", notes: "Reconciliation error identified.", cohort: "historical", tranche_number: 1, behaviours: ["cash_discrepancy"], created_at: "2024-10-05T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  { id: 9, case_id: 3, reference: "TXN-30011", description: "Historical: Missing accessories", transaction_date: "2024-02-20", pipeline_status: "reviewed", finding: "unsubstantiated", notes: null, cohort: "historical", tranche_number: 1, behaviours: [], created_at: "2024-10-05T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  { id: 10, case_id: 5, reference: "TXN-50001", description: "Refund to alternate card", transaction_date: "2024-10-28", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["refund_manipulation"], created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
  { id: 11, case_id: 5, reference: "TXN-50002", description: "Refund to alternate card", transaction_date: "2024-10-30", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["refund_manipulation"], created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
  { id: 12, case_id: 5, reference: "TXN-50003", description: "Refund to alternate card", transaction_date: "2024-11-02", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["refund_manipulation"], created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
];
```

**Step 3: Add seedTranches immediately after seedTransactions**

```typescript
const seedTranches: Tranche[] = [
  { id: 1, case_id: 1, type: "catalyst", number: 1, created_at: "2024-11-05T10:00:00Z" },
  { id: 2, case_id: 2, type: "catalyst", number: 1, created_at: "2024-10-28T10:00:00Z" },
  { id: 3, case_id: 3, type: "catalyst", number: 1, created_at: "2024-10-05T10:00:00Z" },
  { id: 4, case_id: 3, type: "historical", number: 1, date_range: "Jan 2024 – Jun 2024", created_at: "2024-10-05T10:00:00Z" },
  { id: 5, case_id: 4, type: "catalyst", number: 1, created_at: "2024-11-16T10:00:00Z" },
  { id: 6, case_id: 5, type: "catalyst", number: 1, created_at: "2024-11-03T10:00:00Z" },
];
```

**Step 4: Update seedCases — add tranches and behaviours fields**

Each case object needs `tranches: []` and `behaviours: []` added. These are hydrated at runtime. Example for case 1:

```typescript
{ id: 1, reference: "CASE-0001", title: "Till discrepancy review", description: "Multiple till shortfalls flagged over a 2-week period.", subject_name: "Tom Hendricks", pipeline_status: "new", finding: "unsubstantiated", assigned_user_id: null, assignee: null, transactions: [], tranches: [], behaviours: [], closed_at: null, created_at: "2024-11-05T10:00:00Z", updated_at: "2024-11-05T10:00:00Z" },
```

Apply `tranches: [], behaviours: []` to all 5 seed cases.

**Step 5: Replace seedActions**

```typescript
const seedActions: CaseAction[] = [
  { id: 1, case_id: 1, type: "notification", recipient: "all", transaction_ids: [], triggered_at: "2024-11-05T10:00:00Z", note: null },
  { id: 2, case_id: 2, type: "notification", recipient: "all", transaction_ids: [], triggered_at: "2024-10-28T10:00:00Z", note: null },
  { id: 3, case_id: 2, type: "pause", recipient: "B&C", transaction_ids: [3, 4], triggered_at: "2024-11-01T11:00:00Z", note: "Awaiting HR decision before progressing." },
  { id: 4, case_id: 3, type: "notification", recipient: "all", transaction_ids: [], triggered_at: "2024-10-05T10:00:00Z", note: null },
  { id: 5, case_id: 3, type: "pause", recipient: "B&C", transaction_ids: [8, 9], tranche_ref: "Historical Tranche #1", triggered_at: "2024-10-05T10:05:00Z", note: "Historical review batch — Jan–Jun 2024" },
  { id: 6, case_id: 3, type: "release_withdraw", recipient: "B&C", transaction_ids: [5, 6, 7, 8, 9], triggered_at: "2024-11-18T09:30:00Z", note: "Case concluded — proceeding to outcome." },
  { id: 7, case_id: 4, type: "notification", recipient: "all", transaction_ids: [], triggered_at: "2024-11-16T10:00:00Z", note: null },
  { id: 8, case_id: 5, type: "notification", recipient: "all", transaction_ids: [], triggered_at: "2024-11-03T10:00:00Z", note: null },
];
```

**Step 6: Update in-memory store block**

Replace the store initialisation block (the `let users...` lines and counters):

```typescript
let users: User[] = seedUsers.map((u) => ({ ...u }));
let transactions: Transaction[] = seedTransactions.map((t) => ({ ...t }));
let tranches: Tranche[] = seedTranches.map((t) => ({ ...t }));
let cases: Case[] = seedCases.map((c) => ({ ...c }));
let actions: CaseAction[] = seedActions.map((a) => ({ ...a }));

let nextUserId = 4;
let nextCaseId = 6;
let nextTxnId = 13;
let nextCaseNum = 6;
let nextActionId = 9;
let nextTrancheId = 7;
```

**Step 7: Add recalcCaseBehaviours after recalcCaseFinding**

```typescript
function recalcCaseBehaviours(caseId: number): void {
  const caseTxns = transactions.filter((t) => t.case_id === caseId);
  const unique = [...new Set(caseTxns.flatMap((t) => t.behaviours))] as BehaviourFlag[];
  const c = cases.find((c) => c.id === caseId);
  if (c) { c.behaviours = unique; }
}
```

**Step 8: Update hydrateCases to include tranches and behaviours**

Replace the `hydrateCases` function:

```typescript
function hydrateCases(raw: Case[]): Case[] {
  return raw.map((c) => ({
    ...c,
    assignee: users.find((u) => u.id === c.assigned_user_id) ?? null,
    transactions: transactions.filter((t) => t.case_id === c.id),
    tranches: tranches.filter((tr) => tr.case_id === c.id),
    behaviours: [...new Set(
      transactions.filter((t) => t.case_id === c.id).flatMap((t) => t.behaviours)
    )] as BehaviourFlag[],
  }));
}
```

**Step 9: Commit**

```bash
cd /c/Coding/Block
git add frontend/src/api/index.ts
git commit -m "feat: update seed data for tranches and behaviours"
```

---

## Task 3: Update API — Functions

**Files:**
- Modify: `frontend/src/api/index.ts`

**Step 1: Add FauxTxnDetail interface and FAUX_DESCRIPTIONS before casesApi**

Insert this block just before the `// ── Cases API` comment:

```typescript
// ── Faux Lookup ───────────────────────────────────────────────────────────────

const FAUX_DESCRIPTIONS = [
  "Cash refund processed", "Account lookup — no active call", "Card transaction reversal",
  "Void transaction", "Price override applied", "Discount — supervisor approval",
  "Manual cash entry", "Stock adjustment", "Refund to alternate account",
  "End-of-day reconciliation shortfall",
];

export interface FauxTxnDetail {
  input_id: string;
  reference: string;
  date: string;
  description: string;
  amount: string;
}
```

**Step 2: Update casesApi.create to accept initial_transactions and create the catalyst tranche**

Replace the `create` method inside `casesApi`:

```typescript
create: (data: {
  title: string;
  description?: string;
  subject_name: string;
  assigned_user_id?: number | null;
  initial_transactions?: FauxTxnDetail[];
}) => {
  const ref = `CASE-${String(nextCaseNum++).padStart(4, "0")}`;
  const caseId = nextCaseId++;
  const ts = now();

  const c: Case = {
    id: caseId,
    reference: ref,
    pipeline_status: "new",
    finding: UNSUBSTANTIATED,
    transactions: [],
    tranches: [],
    behaviours: [],
    assignee: users.find((u) => u.id === data.assigned_user_id) ?? null,
    closed_at: null,
    created_at: ts,
    updated_at: ts,
    subject_name: data.subject_name,
    title: data.title,
    description: data.description ?? null,
    assigned_user_id: data.assigned_user_id ?? null,
  };
  cases.push(c);

  // Create catalyst tranche
  tranches.push({ id: nextTrancheId++, case_id: caseId, type: "catalyst", number: 1, created_at: ts });

  // Create initial transactions
  if (data.initial_transactions?.length) {
    for (const t of data.initial_transactions) {
      transactions.push({
        id: nextTxnId++,
        case_id: caseId,
        reference: t.reference,
        description: t.description,
        transaction_date: t.date,
        pipeline_status: "awaiting_review",
        finding: UNSUBSTANTIATED,
        notes: null,
        cohort: "catalyst",
        tranche_number: 1,
        behaviours: [],
        created_at: ts,
        updated_at: ts,
      });
    }
    recalcCaseFinding(caseId);
  }

  // Auto-notify
  actions.push({
    id: nextActionId++,
    case_id: caseId,
    type: "notification",
    recipient: "all",
    transaction_ids: [],
    triggered_at: ts,
    note: null,
  });

  return delay({ ...c });
},
```

**Step 3: Update transactionsApi.create to accept cohort/tranche fields**

Replace the `create` method inside `transactionsApi`:

```typescript
create: (data: {
  case_id: number;
  reference: string;
  description?: string;
  transaction_date?: string;
  cohort?: TranchType;
  tranche_number?: number;
}) => {
  const txn: Transaction = {
    id: nextTxnId++,
    pipeline_status: "awaiting_review",
    finding: UNSUBSTANTIATED,
    notes: null,
    cohort: data.cohort ?? "catalyst",
    tranche_number: data.tranche_number ?? 1,
    behaviours: [],
    created_at: now(),
    updated_at: now(),
    description: data.description ?? null,
    transaction_date: data.transaction_date ?? null,
    case_id: data.case_id,
    reference: data.reference,
  };
  transactions.push(txn);
  recalcCaseFinding(data.case_id);
  recalcCaseBehaviours(data.case_id);
  return delay({ ...txn });
},
```

**Step 4: Update transactionsApi.update to auto-trigger actions on ISP boundary crossing**

Replace the `update` method inside `transactionsApi`:

```typescript
update: (id: number, data: Partial<Transaction>) => {
  const idx = transactions.findIndex((t) => t.id === id);
  if (idx === -1) return Promise.reject(new Error("Transaction not found"));
  const prev = transactions[idx];
  transactions[idx] = { ...prev, ...data, updated_at: now() };
  recalcCaseFinding(prev.case_id);
  recalcCaseBehaviours(prev.case_id);

  // Auto-create actions when finding crosses ISP boundary
  if (data.finding !== undefined && data.finding !== prev.finding) {
    if (data.finding === "ISP") {
      actions.push({
        id: nextActionId++,
        case_id: prev.case_id,
        type: "pause",
        recipient: "ER",
        transaction_ids: [id],
        triggered_at: now(),
        note: `Auto: ${prev.reference} finding updated to ISP`,
      });
    } else if (prev.finding === "ISP") {
      actions.push({
        id: nextActionId++,
        case_id: prev.case_id,
        type: "release_withdraw",
        recipient: "B&C",
        transaction_ids: [id],
        triggered_at: now(),
        note: `Auto: ${prev.reference} finding updated to ${data.finding}`,
      });
    }
  }

  return delay({ ...transactions[idx] });
},
```

**Step 5: Update transactionsApi.delete to also call recalcCaseBehaviours**

Replace the `delete` method:

```typescript
delete: (id: number) => {
  const txn = transactions.find((t) => t.id === id);
  if (!txn) return Promise.reject(new Error("Transaction not found"));
  transactions = transactions.filter((t) => t.id !== id);
  recalcCaseFinding(txn.case_id);
  recalcCaseBehaviours(txn.case_id);
  return delay(undefined as void);
},
```

**Step 6: Update actionsApi.create to accept new fields**

Replace the `create` method inside `actionsApi`:

```typescript
create: (data: {
  case_id: number;
  type: ActionType;
  recipient?: ActionRecipient;
  transaction_ids?: number[];
  tranche_ref?: string;
  note?: string;
}) => {
  const action: CaseAction = {
    id: nextActionId++,
    case_id: data.case_id,
    type: data.type,
    recipient: data.recipient ?? "all",
    transaction_ids: data.transaction_ids ?? [],
    tranche_ref: data.tranche_ref,
    triggered_at: now(),
    note: data.note ?? null,
  };
  actions.push(action);
  return delay({ ...action });
},
```

**Step 7: Add tranchesApi after actionsApi**

```typescript
// ── Tranches API ──────────────────────────────────────────────────────────────

export const tranchesApi = {
  list: (caseId: number) =>
    delay([...tranches].filter((t) => t.case_id === caseId).sort((a, b) => a.number - b.number)),

  create: (data: { case_id: number; type: TranchType; date_range?: string }) => {
    const existingOfType = tranches.filter(
      (t) => t.case_id === data.case_id && t.type === data.type
    );
    const number = existingOfType.length + 1;
    const tranche: Tranche = {
      id: nextTrancheId++,
      case_id: data.case_id,
      type: data.type,
      number,
      date_range: data.date_range,
      created_at: now(),
    };
    tranches.push(tranche);
    return delay({ ...tranche });
  },
};
```

**Step 8: Add bulkApi after tranchesApi**

```typescript
// ── Bulk / Faux Lookup API ────────────────────────────────────────────────────

export const bulkApi = {
  lookup: (ids: string[]): Promise<FauxTxnDetail[]> =>
    new Promise((res) =>
      setTimeout(() => {
        res(ids.map((raw, i) => {
          const ref = raw.trim().toUpperCase().startsWith("TXN-")
            ? raw.trim().toUpperCase()
            : `TXN-${raw.trim().toUpperCase()}`;
          const daysAgo = Math.floor(Math.random() * 365) + 1;
          const d = new Date(Date.now() - daysAgo * 86400000);
          return {
            input_id: raw.trim(),
            reference: ref,
            date: d.toISOString().slice(0, 10),
            description: FAUX_DESCRIPTIONS[i % FAUX_DESCRIPTIONS.length],
            amount: `£${(Math.random() * 500 + 5).toFixed(2)}`,
          };
        }));
      }, 1500)
    ),

  bulkCreate: (data: {
    case_id: number;
    transactions: FauxTxnDetail[];
    cohort: TranchType;
    tranche_number: number;
    tranche_ref: string;
    send_pause: boolean;
  }): Promise<Transaction[]> => {
    const created: Transaction[] = [];
    for (const t of data.transactions) {
      const txn: Transaction = {
        id: nextTxnId++,
        case_id: data.case_id,
        reference: t.reference,
        description: t.description,
        transaction_date: t.date,
        pipeline_status: "awaiting_review",
        finding: UNSUBSTANTIATED,
        notes: null,
        cohort: data.cohort,
        tranche_number: data.tranche_number,
        behaviours: [],
        created_at: now(),
        updated_at: now(),
      };
      transactions.push(txn);
      created.push(txn);
    }
    recalcCaseFinding(data.case_id);
    recalcCaseBehaviours(data.case_id);
    if (data.send_pause && created.length > 0) {
      actions.push({
        id: nextActionId++,
        case_id: data.case_id,
        type: "pause",
        recipient: "B&C",
        transaction_ids: created.map((t) => t.id),
        tranche_ref: data.tranche_ref,
        triggered_at: now(),
        note: `Bulk upload — ${data.tranche_ref}`,
      });
    }
    return delay(created.map((t) => ({ ...t })));
  },
};
```

**Step 9: Commit**

```bash
cd /c/Coding/Block
git add frontend/src/api/index.ts
git commit -m "feat: update API functions for tranches, bulk upload, auto-actions"
```

---

## Task 4: Update NewCase.tsx — Multi-Step Wizard

**Files:**
- Modify: `frontend/src/pages/NewCase.tsx`
- Modify: `frontend/src/App.css` (add wizard styles)

**Step 1: Replace the entire NewCase.tsx**

```typescript
import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { casesApi, usersApi, bulkApi } from "../api";
import type { FauxTxnDetail } from "../api";
import type { User } from "../types";

type Step = 1 | 2 | 3;

export default function NewCase() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [users, setUsers] = useState<User[]>([]);

  const [form, setForm] = useState({
    title: "", description: "", subject_name: "", assigned_user_id: "",
  });

  const [rawIds, setRawIds] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookedUp, setLookedUp] = useState<FauxTxnDetail[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { usersApi.list().then(setUsers).catch(() => {}); }, []);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.subject_name.trim()) { setError("Subject name is required"); return; }
    setError(null);
    setStep(2);
  };

  const parseIds = () => rawIds.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  const handleFetch = async () => {
    const ids = parseIds();
    if (!ids.length) { setLookupError("Paste at least one transaction ID"); return; }
    setLookupLoading(true);
    setLookupError(null);
    try {
      const results = await bulkApi.lookup(ids);
      setLookedUp(results);
    } catch {
      setLookupError("Lookup failed — please try again");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleStep2 = () => {
    if (!lookedUp.length) { setLookupError("Fetch transaction details first"); return; }
    setLookupError(null);
    setStep(3);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await casesApi.create({
        title: form.title,
        description: form.description || undefined,
        subject_name: form.subject_name,
        assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : null,
        initial_transactions: lookedUp,
      });
      navigate(`/cases/${created.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create case");
      setSaving(false);
    }
  };

  const stepLabels = ["Case Details", "Catalyst Transactions", "Review & Submit"];

  return (
    <div className="page page--narrow">
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb__link">Cases</Link>
        <span className="breadcrumb__sep">/</span>
        <span>New Case</span>
      </div>
      <h1 className="page__title">New Case</h1>

      <div className="wizard-steps">
        {stepLabels.map((label, i) => (
          <div key={label} className={`wizard-step ${step === i + 1 ? "active" : step > i + 1 ? "done" : ""}`}>
            <span className="wizard-step__num">{step > i + 1 ? "✓" : i + 1}</span>
            <span className="wizard-step__label">{label}</span>
          </div>
        ))}
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {step === 1 && (
        <form className="card form-card" onSubmit={handleStep1}>
          <div className="form-grid">
            <label className="form-label form-label--full">
              Case Title *
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Till discrepancy review" />
            </label>
            <label className="form-label">
              Staff Member *
              <input className="input" value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} placeholder="Full name" />
            </label>
            <label className="form-label">
              Assign Analyst
              <select className="select" value={form.assigned_user_id} onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </label>
            <label className="form-label form-label--full">
              Description
              <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Background, referral source, initial summary…" />
            </label>
          </div>
          <div className="form-actions">
            <Link to="/" className="btn btn--ghost">Cancel</Link>
            <button type="submit" className="btn btn--primary">Next: Add Transactions →</button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="card form-card">
          <h2 className="card__title">Catalyst Transactions</h2>
          <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
            Paste the initial transaction IDs for this case. These form the <strong>Catalyst Tranche</strong>.
          </p>
          {lookupError && <div className="alert alert--error" style={{ marginBottom: "1rem" }}>{lookupError}</div>}
          <label className="form-label">
            Transaction IDs <span className="muted">(one per line or comma-separated)</span>
            <textarea
              className="textarea"
              value={rawIds}
              onChange={(e) => { setRawIds(e.target.value); setLookedUp([]); }}
              rows={6}
              placeholder={"TXN-10041\nTXN-10055\nTXN-20012"}
            />
          </label>
          {rawIds.trim() && (
            <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>
              {parseIds().length} ID{parseIds().length !== 1 ? "s" : ""} detected
            </p>
          )}
          <button
            className="btn btn--secondary"
            onClick={handleFetch}
            disabled={lookupLoading || !rawIds.trim()}
            style={{ marginBottom: "1rem" }}
          >
            {lookupLoading ? "Fetching details…" : "Fetch Transaction Details"}
          </button>
          {lookupLoading && <p className="muted" style={{ fontSize: "0.875rem" }}>Contacting transaction system…</p>}
          {lookedUp.length > 0 && (
            <div className="table-wrap" style={{ marginBottom: "1rem" }}>
              <table className="table">
                <thead><tr><th>Reference</th><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
                <tbody>
                  {lookedUp.map((t) => (
                    <tr key={t.input_id}>
                      <td><strong>{t.reference}</strong></td>
                      <td className="muted">{t.date}</td>
                      <td>{t.description}</td>
                      <td>{t.amount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <div className="form-actions">
            <button className="btn btn--ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn--primary" onClick={handleStep2} disabled={!lookedUp.length}>
              Next: Review & Submit →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card form-card">
          <h2 className="card__title">Review & Submit</h2>
          <dl className="dl" style={{ marginBottom: "1.5rem" }}>
            <dt>Title</dt><dd>{form.title}</dd>
            <dt>Staff Member</dt><dd>{form.subject_name}</dd>
            <dt>Analyst</dt><dd>{users.find((u) => u.id === Number(form.assigned_user_id))?.name ?? "Unassigned"}</dd>
            {form.description && <><dt>Description</dt><dd>{form.description}</dd></>}
            <dt>Catalyst Transactions</dt><dd>{lookedUp.length} transaction{lookedUp.length !== 1 ? "s" : ""}</dd>
          </dl>
          <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
            On submit: case created, Catalyst Tranche recorded, notification sent to B&C & ER.
          </p>
          <div className="form-actions">
            <button className="btn btn--ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Creating…" : "Create Case"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Add wizard styles to App.css** (append to end of file)

```css
/* ── Wizard Steps ─────────────────────────────────────────────────────────── */
.wizard-steps {
  display: flex;
  margin-bottom: 1.5rem;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}
.wizard-step {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  font-size: 0.875rem;
  color: var(--text-muted);
  background: var(--surface);
  border-right: 1px solid var(--border);
}
.wizard-step:last-child { border-right: none; }
.wizard-step.active { background: #eff6ff; color: var(--primary); font-weight: 600; }
.wizard-step.done { color: #16a34a; }
.wizard-step__num {
  display: inline-flex; align-items: center; justify-content: center;
  width: 1.5rem; height: 1.5rem; border-radius: 50%;
  background: var(--border); font-size: 0.75rem; font-weight: 700; flex-shrink: 0;
}
.wizard-step.active .wizard-step__num { background: var(--primary); color: white; }
.wizard-step.done .wizard-step__num { background: #16a34a; color: white; }
```

**Step 3: Commit**

```bash
cd /c/Coding/Block
git add frontend/src/pages/NewCase.tsx frontend/src/App.css
git commit -m "feat: convert NewCase to multi-step wizard with catalyst transaction upload"
```

---

## Task 5: Update CaseDetail — Actions Section

**Files:**
- Modify: `frontend/src/pages/CaseDetail.tsx`
- Modify: `frontend/src/App.css`

**Step 1: Replace the imports block at the top of CaseDetail.tsx**

```typescript
import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { casesApi, transactionsApi, usersApi, actionsApi, bulkApi, tranchesApi } from "../api";
import type { FauxTxnDetail } from "../api";
import type { Case, Transaction, User, CaseStatus, TransactionStatus, Finding, CaseAction, ActionType, BehaviourFlag } from "../types";
import {
  CASE_STATUSES, TRANSACTION_STATUSES, FINDINGS, BEHAVIOUR_FLAGS,
  labelCaseStatus, labelTransactionStatus, labelFinding, labelActionType, labelRecipient,
} from "../types";
import FindingBadge from "../components/FindingBadge";
import StatusBadge from "../components/StatusBadge";
import PipelineStepper from "../components/PipelineStepper";
import Modal from "../components/Modal";
```

**Step 2: Add showBulkUpload state to the CaseDetail component**

In the component body after `const [triggerAction, setTriggerAction] = useState<ActionType | null>(null);`, add:

```typescript
const [showBulkUpload, setShowBulkUpload] = useState(false);
```

**Step 3: Replace the ActionRow component**

```typescript
function ActionRow({ action, caseTransactions }: { action: CaseAction; caseTransactions: Transaction[] }) {
  const typeClass =
    action.type === "notification" ? "action-badge--info" :
    action.type === "pause" ? "action-badge--amber" : "action-badge--red";
  const recipientClass =
    action.recipient === "ER" ? "recipient-badge--er" :
    action.recipient === "B&C" ? "recipient-badge--bc" : "recipient-badge--all";
  const linkedTxns = caseTransactions.filter((t) => action.transaction_ids.includes(t.id));

  return (
    <div className="action-row">
      <div className="action-row__left">
        <span className={`action-badge ${typeClass}`}>{labelActionType(action.type)}</span>
        <span className={`recipient-badge ${recipientClass}`}>→ {labelRecipient(action.recipient)}</span>
        {action.tranche_ref && <span className="tranche-tag">{action.tranche_ref}</span>}
      </div>
      <div className="action-row__middle">
        {linkedTxns.length > 0 && (
          <span className="action-txn-list muted" style={{ fontSize: "0.8rem" }}>
            {linkedTxns.length > 3
              ? `${linkedTxns.slice(0, 3).map((t) => t.reference).join(", ")} +${linkedTxns.length - 3} more`
              : linkedTxns.map((t) => t.reference).join(", ")}
          </span>
        )}
      </div>
      <div className="action-row__right">
        {action.note && <span className="action-row__note">{action.note}</span>}
        <span className="action-row__date muted">{formatDate(action.triggered_at)}</span>
      </div>
    </div>
  );
}
```

**Step 4: Update ActionRow usage in JSX** — change `<ActionRow key={a.id} action={a} />` to:

```typescript
<ActionRow key={a.id} action={a} caseTransactions={caseData.transactions} />
```

**Step 5: Replace TriggerActionModal**

```typescript
function TriggerActionModal({
  type, transactions, onClose, onConfirm,
}: {
  type: ActionType;
  transactions: Transaction[];
  onClose: () => void;
  onConfirm: (note?: string, transactionIds?: number[]) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleTxn = (id: number) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const recipientLabel = type === "pause" ? "ER" : type === "release_withdraw" ? "B&C" : "B&C & ER";

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(note.trim() || undefined, selectedIds.length ? selectedIds : undefined);
    setSaving(false);
  };

  return (
    <Modal title={`${labelActionType(type)} — Send to ${recipientLabel}`} onClose={onClose}>
      <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
        This action will be sent to <strong>{recipientLabel}</strong>.
      </p>
      {transactions.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Associated Transactions <span className="muted">(optional)</span>
          </p>
          <div className="txn-checkbox-list">
            {transactions.map((t) => (
              <label key={t.id} className="txn-checkbox">
                <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleTxn(t.id)} />
                <span>{t.reference}</span>
                {t.transaction_date && <span className="muted" style={{ fontSize: "0.8rem" }}> — {t.transaction_date}</span>}
              </label>
            ))}
          </div>
        </div>
      )}
      <label className="form-label">
        Note <span className="muted">(optional)</span>
        <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Reason or additional context…" />
      </label>
      <div className="modal__footer">
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn--primary" onClick={handleConfirm} disabled={saving}>
          {saving ? "Sending…" : `Confirm ${labelActionType(type)}`}
        </button>
      </div>
    </Modal>
  );
}
```

**Step 6: Update handleTriggerAction**

Replace:
```typescript
const handleTriggerAction = async (type: ActionType, note?: string) => {
  if (!caseData) return;
  await actionsApi.create({ case_id: caseData.id, type, note });
  const updated = await actionsApi.list(caseData.id);
  setCaseActions(updated);
};
```

With:
```typescript
const handleTriggerAction = async (type: ActionType, note?: string, transactionIds?: number[]) => {
  if (!caseData) return;
  const recipient =
    type === "pause" ? "ER" as const :
    type === "release_withdraw" ? "B&C" as const : "all" as const;
  await actionsApi.create({ case_id: caseData.id, type, recipient, transaction_ids: transactionIds, note });
  const updated = await actionsApi.list(caseData.id);
  setCaseActions(updated);
};
```

**Step 7: Update TriggerActionModal usage in JSX**

Replace the `{triggerAction && ...}` modal block:
```typescript
{triggerAction && (
  <TriggerActionModal
    type={triggerAction}
    transactions={caseData.transactions}
    onClose={() => setTriggerAction(null)}
    onConfirm={async (note, transactionIds) => {
      await handleTriggerAction(triggerAction, note, transactionIds);
      setTriggerAction(null);
    }}
  />
)}
```

**Step 8: Update the "Withdraw" button in the Actions card header** — change label and action type:

```typescript
<button className="btn btn--secondary btn--sm" onClick={() => setTriggerAction("release_withdraw")}>
  Release / Withdraw
</button>
```

**Step 9: Append new styles to App.css**

```css
/* ── Action row restructure ───────────────────────────────────────────────── */
.action-row {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.75rem;
  align-items: start;
}
.action-row__middle { min-width: 0; }
.action-txn-list { word-break: break-word; }

.recipient-badge {
  display: inline-flex; align-items: center;
  padding: 0.125rem 0.5rem; border-radius: 999px;
  font-size: 0.75rem; font-weight: 600;
}
.recipient-badge--er { background: #fef3c7; color: #92400e; }
.recipient-badge--bc { background: #dbeafe; color: #1d4ed8; }
.recipient-badge--all { background: #f3f4f6; color: #374151; }

.tranche-tag {
  display: inline-flex; align-items: center;
  padding: 0.125rem 0.5rem; border-radius: 4px;
  font-size: 0.75rem; background: #f0fdf4; color: #166534; border: 1px solid #bbf7d0;
}

.txn-checkbox-list {
  display: flex; flex-direction: column; gap: 0.375rem;
  max-height: 200px; overflow-y: auto;
  padding: 0.5rem; border: 1px solid var(--border); border-radius: var(--radius);
}
.txn-checkbox {
  display: flex; align-items: center; gap: 0.5rem;
  font-size: 0.875rem; cursor: pointer;
}
```

**Step 10: Commit**

```bash
cd /c/Coding/Block
git add frontend/src/pages/CaseDetail.tsx frontend/src/App.css
git commit -m "feat: restructure actions with recipient badges and linked transactions"
```

---

## Task 6: Update CaseDetail — Tranche Grouping + Bulk Upload

**Files:**
- Modify: `frontend/src/pages/CaseDetail.tsx`
- Modify: `frontend/src/App.css`

**Step 1: Replace the Transactions card JSX**

Find the `{/* Transactions */}` section (the entire `<div className="card">` containing transactions) and replace it:

```typescript
{/* Transactions */}
<div className="card">
  <div className="card__header">
    <h2 className="card__title">
      Transactions
      <span className="count-badge">{caseData.transactions.length}</span>
    </h2>
    <button className="btn btn--primary btn--sm" onClick={() => setShowBulkUpload(true)}>
      + Bulk Upload
    </button>
  </div>

  {caseData.transactions.length === 0 ? (
    <p className="muted">No transactions yet.</p>
  ) : (
    <div className="tranche-groups">
      {[...caseData.tranches]
        .sort((a, b) => {
          if (a.type === "catalyst") return -1;
          if (b.type === "catalyst") return 1;
          return a.number - b.number;
        })
        .map((tranche) => {
          const trancheTxns = caseData.transactions.filter(
            (t) => t.cohort === tranche.type && t.tranche_number === tranche.number
          );
          const trancheLabel =
            tranche.type === "catalyst"
              ? "Catalyst Tranche"
              : `Historical Tranche #${tranche.number}${tranche.date_range ? ` — ${tranche.date_range}` : ""}`;
          return (
            <div key={tranche.id} className="tranche-group">
              <div className="tranche-group__header">
                <span className={`tranche-type-badge ${tranche.type === "catalyst" ? "tranche-type-badge--catalyst" : "tranche-type-badge--historical"}`}>
                  {tranche.type === "catalyst" ? "Catalyst" : "Historical"}
                </span>
                <span className="tranche-group__label">{trancheLabel}</span>
                <span className="muted" style={{ fontSize: "0.8rem" }}>
                  {trancheTxns.length} transaction{trancheTxns.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="txn-list">
                {trancheTxns.map((txn) => (
                  <TransactionRow
                    key={txn.id}
                    txn={txn}
                    onEdit={() => setEditingTxn(txn)}
                    onDelete={async () => {
                      if (!confirm(`Delete transaction ${txn.reference}?`)) return;
                      await transactionsApi.delete(txn.id);
                      load();
                    }}
                  />
                ))}
              </div>
            </div>
          );
        })}
    </div>
  )}
</div>
```

**Step 2: Add BulkUploadModal component** (add before the `formatDate` function at the bottom of the file)

```typescript
// ── Bulk Upload Modal ─────────────────────────────────────────────────────────

function BulkUploadModal({ caseId, existingHistoricalCount, onClose, onSaved }: {
  caseId: number;
  existingHistoricalCount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawIds, setRawIds] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookedUp, setLookedUp] = useState<FauxTxnDetail[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("");
  const [sendPause, setSendPause] = useState(true);
  const [saving, setSaving] = useState(false);

  const nextTrancheNumber = existingHistoricalCount + 1;
  const parseIds = () => rawIds.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  const handleFetch = async () => {
    const ids = parseIds();
    if (!ids.length) { setLookupError("Paste at least one transaction ID"); return; }
    setLookupLoading(true);
    setLookupError(null);
    try {
      const results = await bulkApi.lookup(ids);
      setLookedUp(results);
      setStep(2);
    } catch {
      setLookupError("Lookup failed — please try again");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const trancheRef = `Historical Tranche #${nextTrancheNumber}`;
    try {
      await tranchesApi.create({ case_id: caseId, type: "historical", date_range: dateRange.trim() || undefined });
      await bulkApi.bulkCreate({
        case_id: caseId,
        transactions: lookedUp,
        cohort: "historical",
        tranche_number: nextTrancheNumber,
        tranche_ref: trancheRef,
        send_pause: sendPause,
      });
      onSaved();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title="Bulk Upload — Historical Tranche" onClose={onClose}>
      {step === 1 && (
        <>
          <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
            Paste transaction IDs to add as <strong>Historical Tranche #{nextTrancheNumber}</strong>.
          </p>
          {lookupError && <div className="alert alert--error" style={{ marginBottom: "1rem" }}>{lookupError}</div>}
          <label className="form-label">
            Transaction IDs <span className="muted">(one per line or comma-separated)</span>
            <textarea
              className="textarea"
              value={rawIds}
              onChange={(e) => setRawIds(e.target.value)}
              rows={6}
              placeholder={"TXN-00001\nTXN-00002\n..."}
            />
          </label>
          {rawIds.trim() && (
            <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>
              {parseIds().length} ID{parseIds().length !== 1 ? "s" : ""} detected
            </p>
          )}
          <div className="modal__footer">
            <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn--primary" onClick={handleFetch} disabled={lookupLoading || !rawIds.trim()}>
              {lookupLoading ? "Fetching…" : "Fetch Details"}
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="muted" style={{ marginBottom: "0.75rem", fontSize: "0.875rem" }}>
            {lookedUp.length} transaction{lookedUp.length !== 1 ? "s" : ""} retrieved. Configure tranche below.
          </p>
          <div className="table-wrap" style={{ marginBottom: "1rem", maxHeight: "200px", overflowY: "auto" }}>
            <table className="table">
              <thead><tr><th>Reference</th><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
              <tbody>
                {lookedUp.map((t) => (
                  <tr key={t.input_id}>
                    <td><strong>{t.reference}</strong></td>
                    <td className="muted">{t.date}</td>
                    <td>{t.description}</td>
                    <td>{t.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-grid" style={{ marginBottom: "1rem" }}>
            <label className="form-label">
              Tranche
              <input className="input" value={`Historical Tranche #${nextTrancheNumber}`} readOnly style={{ background: "var(--surface)", color: "var(--text-muted)" }} />
            </label>
            <label className="form-label">
              Date Range <span className="muted">(optional)</span>
              <input className="input" value={dateRange} onChange={(e) => setDateRange(e.target.value)} placeholder="e.g. Jan 2024 – Dec 2024" />
            </label>
          </div>
          <label className="txn-checkbox" style={{ marginBottom: "1.25rem" }}>
            <input type="checkbox" checked={sendPause} onChange={(e) => setSendPause(e.target.checked)} />
            <span>Send pause action to <strong>B&C</strong> for these transactions</span>
          </label>
          <div className="modal__footer">
            <button className="btn btn--ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Uploading…" : "Upload Transactions"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
```

**Step 3: Add BulkUploadModal to the JSX modals section** (at the bottom of the return statement alongside the other modals):

```typescript
{showBulkUpload && (
  <BulkUploadModal
    caseId={caseData.id}
    existingHistoricalCount={caseData.tranches.filter((t) => t.type === "historical").length}
    onClose={() => setShowBulkUpload(false)}
    onSaved={() => { setShowBulkUpload(false); load(); }}
  />
)}
```

**Step 4: Append tranche group styles to App.css**

```css
/* ── Tranche groups ───────────────────────────────────────────────────────── */
.tranche-groups { display: flex; flex-direction: column; gap: 1.5rem; }
.tranche-group__header {
  display: flex; align-items: center; gap: 0.75rem;
  padding: 0.5rem 0; margin-bottom: 0.75rem; border-bottom: 1px solid var(--border);
}
.tranche-group__label { font-weight: 600; font-size: 0.9rem; }
.tranche-type-badge {
  display: inline-flex; align-items: center;
  padding: 0.125rem 0.625rem; border-radius: 4px;
  font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em;
}
.tranche-type-badge--catalyst { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.tranche-type-badge--historical { background: #faf5ff; color: #6d28d9; border: 1px solid #ddd6fe; }
```

**Step 5: Commit**

```bash
cd /c/Coding/Block
git add frontend/src/pages/CaseDetail.tsx frontend/src/App.css
git commit -m "feat: add tranche grouping and bulk upload modal to CaseDetail"
```

---

## Task 7: Update CaseDetail — Behaviour Flags in Transactions

**Files:**
- Modify: `frontend/src/pages/CaseDetail.tsx`
- Modify: `frontend/src/App.css`

**Step 1: Replace TransactionRow to show behaviour tags**

```typescript
function TransactionRow({
  txn, onEdit, onDelete,
}: { txn: Transaction; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="txn-card">
      <div className="txn-card__top">
        <div className="txn-card__ref">
          <strong>{txn.reference}</strong>
          {txn.transaction_date && <span className="muted"> — {txn.transaction_date}</span>}
        </div>
        <div className="txn-card__badges">
          <StatusBadge status={txn.pipeline_status} size="sm" />
          <FindingBadge finding={txn.finding} size="sm" />
        </div>
      </div>
      {txn.description && <p className="txn-card__desc">{txn.description}</p>}
      <div className="txn-pipeline">
        <PipelineStepper type="transaction" current={txn.pipeline_status} />
      </div>
      {txn.behaviours.length > 0 && (
        <div className="txn-card__behaviours">
          {txn.behaviours.map((b) => {
            const found = BEHAVIOUR_FLAGS.find((f) => f.key === b);
            return <span key={b} className="behaviour-tag">{found?.label ?? b}</span>;
          })}
        </div>
      )}
      {txn.notes && (
        <div className="txn-card__notes"><strong>Notes:</strong> {txn.notes}</div>
      )}
      <div className="txn-card__actions">
        <button className="btn btn--ghost btn--sm" onClick={onEdit}>Edit</button>
        <button className="btn btn--danger btn--sm" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}
```

**Step 2: Replace EditTransactionModal to include behaviour checkboxes**

```typescript
function EditTransactionModal({ txn, onClose, onSaved }: {
  txn: Transaction; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    reference: txn.reference,
    description: txn.description ?? "",
    transaction_date: txn.transaction_date ?? "",
    pipeline_status: txn.pipeline_status as TransactionStatus,
    finding: txn.finding as Finding,
    notes: txn.notes ?? "",
    behaviours: [...txn.behaviours] as BehaviourFlag[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBehaviour = (flag: BehaviourFlag) =>
    setForm((prev) => ({
      ...prev,
      behaviours: prev.behaviours.includes(flag)
        ? prev.behaviours.filter((b) => b !== flag)
        : [...prev.behaviours, flag],
    }));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await transactionsApi.update(txn.id, form);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit Transaction — ${txn.reference}`} onClose={onClose}>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="form-grid">
        <label className="form-label">
          Reference
          <input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </label>
        <label className="form-label">
          Transaction Date
          <input className="input" type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
        </label>
        <label className="form-label">
          Pipeline Status
          <select className="select" value={form.pipeline_status} onChange={(e) => setForm({ ...form, pipeline_status: e.target.value as TransactionStatus })}>
            {TRANSACTION_STATUSES.map((s) => <option key={s} value={s}>{labelTransactionStatus(s)}</option>)}
          </select>
        </label>
        <label className="form-label">
          Finding
          <select className="select" value={form.finding} onChange={(e) => setForm({ ...form, finding: e.target.value as Finding })}>
            {FINDINGS.map((f) => <option key={f} value={f}>{labelFinding(f)}</option>)}
          </select>
        </label>
        <label className="form-label form-label--full">
          Description
          <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        </label>
        <label className="form-label form-label--full">
          Notes
          <textarea className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Review notes, evidence, comments…" />
        </label>
        <div className="form-label form-label--full">
          <span style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
            Behaviours Identified
          </span>
          <div className="behaviour-checkbox-grid">
            {BEHAVIOUR_FLAGS.map(({ key, label }) => (
              <label key={key} className="txn-checkbox">
                <input type="checkbox" checked={form.behaviours.includes(key)} onChange={() => toggleBehaviour(key)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
      <div className="modal__footer">
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}
```

**Step 3: Append behaviour styles to App.css**

```css
/* ── Behaviour flags ──────────────────────────────────────────────────────── */
.behaviour-tag {
  display: inline-flex; align-items: center;
  padding: 0.125rem 0.5rem; border-radius: 4px;
  font-size: 0.72rem; font-weight: 600;
  background: #f0f9ff; color: #0369a1; border: 1px solid #bae6fd;
}
.behaviour-tag--lg { font-size: 0.8rem; padding: 0.25rem 0.75rem; }
.txn-card__behaviours { display: flex; flex-wrap: wrap; gap: 0.375rem; margin-top: 0.5rem; }
.behaviour-checkbox-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 0.5rem; }
```

**Step 4: Commit**

```bash
cd /c/Coding/Block
git add frontend/src/pages/CaseDetail.tsx frontend/src/App.css
git commit -m "feat: add behaviour flags to transaction rows and edit modal"
```

---

## Task 8: Update CaseDetail — Case-Level Behaviours Card

**Files:**
- Modify: `frontend/src/pages/CaseDetail.tsx`

**Step 1: Add behaviours card after the detail-grid, before the Actions card**

Find the closing `</div>` of the `detail-grid` div (the one that wraps the "Case Details" and "Finding Logic" cards). Immediately after it, insert:

```typescript
{/* Case-level behaviours */}
{caseData.behaviours.length > 0 && (
  <div className="card">
    <h2 className="card__title">Behaviours Identified</h2>
    <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
      Aggregated from all transactions in this case.
    </p>
    <div className="txn-card__behaviours">
      {caseData.behaviours.map((b) => {
        const found = BEHAVIOUR_FLAGS.find((f) => f.key === b);
        return <span key={b} className="behaviour-tag behaviour-tag--lg">{found?.label ?? b}</span>;
      })}
    </div>
  </div>
)}
```

**Step 2: Commit**

```bash
cd /c/Coding/Block
git add frontend/src/pages/CaseDetail.tsx
git commit -m "feat: add case-level behaviours summary card"
```

---

## Task 9: Update Reports — Behaviours Section + Action Type Fix

**Files:**
- Modify: `frontend/src/pages/Reports.tsx`

**Step 1: Update imports**

Replace line 4:
```typescript
import { labelCaseStatus, labelFinding, labelActionType, CASE_STATUSES, FINDINGS } from "../types";
```
With:
```typescript
import { labelCaseStatus, labelFinding, labelActionType, CASE_STATUSES, FINDINGS, BEHAVIOUR_FLAGS } from "../types";
import type { BehaviourFlag } from "../types";
```

**Step 2: Fix ACTION_COLOUR — replace `withdraw` key with `release_withdraw`**

```typescript
const ACTION_COLOUR: Record<string, string> = {
  notification: "#2563eb",
  pause: "#d97706",
  release_withdraw: "#dc2626",
};
```

**Step 3: Fix actionTypes array**

```typescript
const actionTypes: Array<"notification" | "pause" | "release_withdraw"> = ["notification", "pause", "release_withdraw"];
```

**Step 4: Fix the withdraw stats row in the Actions summary table**

Find:
```typescript
<td className="report-metric-label">Withdraw actions</td>
<td className="report-metric-value">{actions.filter((a) => a.type === "withdraw").length}</td>
```
Replace with:
```typescript
<td className="report-metric-label">Release / Withdraw actions</td>
<td className="report-metric-value">{actions.filter((a) => a.type === "release_withdraw").length}</td>
```

**Step 5: Add behaviour derived data** — add after the `actionData` computation block:

```typescript
// Behaviour breakdown
const allTransactions = cases.flatMap((c) => c.transactions ?? []);
const behaviourData: BarDatum[] = BEHAVIOUR_FLAGS.map(({ key, label }) => ({
  label,
  value: allTransactions.filter((t) => t.behaviours?.includes(key as BehaviourFlag)).length,
  colour: "#0369a1",
}));
const behaviourTableData = BEHAVIOUR_FLAGS.map(({ key, label }) => ({
  key,
  label,
  txnCount: allTransactions.filter((t) => t.behaviours?.includes(key as BehaviourFlag)).length,
  caseCount: cases.filter((c) =>
    (c.transactions ?? []).some((t) => t.behaviours?.includes(key as BehaviourFlag))
  ).length,
}));
```

**Step 6: Add the Behaviours section to the JSX** — append after the closing `</div>` of the Actions section:

```typescript
{/* ── Section 6: Behaviours ──────────────────────────────────────────────── */}
<h2 className="report-section-title">Behaviours Identified</h2>
<div className="report-grid">
  <div className="card">
    <h3 className="card__title">Transactions by Behaviour</h3>
    <HBar data={behaviourData} emptyMsg="No behaviours recorded" />
  </div>
  <div className="card">
    <h3 className="card__title">Behaviour Breakdown</h3>
    {behaviourTableData.every((b) => b.txnCount === 0) ? (
      <p className="muted report-empty">No behaviours recorded.</p>
    ) : (
      <div className="table-wrap" style={{ border: "none", boxShadow: "none" }}>
        <table className="table">
          <thead>
            <tr>
              <th>Behaviour</th>
              <th className="center">Transactions</th>
              <th className="center">Cases</th>
            </tr>
          </thead>
          <tbody>
            {behaviourTableData.map((b) => (
              <tr key={b.key}>
                <td>{b.label}</td>
                <td className="center">{b.txnCount || <span className="muted">0</span>}</td>
                <td className="center">{b.caseCount || <span className="muted">0</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
</div>
```

**Step 7: Commit**

```bash
cd /c/Coding/Block
git add frontend/src/pages/Reports.tsx
git commit -m "feat: add behaviours reporting section, fix release_withdraw action type"
```

---

## Task 10: Final Verification

**Step 1: Check TypeScript compiles with zero errors**

```bash
cd /c/Coding/Block/frontend && npx tsc --noEmit
```

Expected: `0 errors`. If there are errors, fix them before proceeding.

**Step 2: Start the dev server**

```bash
cd /c/Coding/Block/frontend && npm run dev
```

**Step 3: Manually verify the following checklist**

- [ ] Dashboard loads, existing 5 cases visible
- [ ] New Case: 3-step wizard — details → paste IDs → fetch (1.5s spinner) → preview table → submit → lands on case detail
- [ ] New case has Catalyst Tranche visible in transactions section
- [ ] Existing CASE-0003 shows Catalyst Tranche + Historical Tranche #1 (Jan 2024 – Jun 2024)
- [ ] Bulk Upload modal: paste IDs → fetch → tranche auto-numbered → date range optional → pause checkbox → submit → new tranche group appears
- [ ] After bulk upload with pause checked, new pause action appears in Actions section (recipient: B&C)
- [ ] Action rows show: type badge + recipient badge + transaction list
- [ ] Edit transaction: behaviour checkboxes appear → save → tags visible on transaction row
- [ ] Behaviours card appears on case detail when any transaction has a flag
- [ ] Updating transaction finding to ISP → auto pause action (recipient: ER) created
- [ ] Updating transaction finding from ISP → auto release/withdraw action (recipient: B&C) created
- [ ] "Release / Withdraw" button replaces "Withdraw" in action trigger buttons
- [ ] Reports: Behaviours section shows bar chart + breakdown table with counts from seed data
- [ ] Reports: Action breakdown shows "Release / Withdraw" not "Withdraw"

**Step 4: Push**

```bash
cd /c/Coding/Block && git push
```
