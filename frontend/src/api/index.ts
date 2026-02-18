import type { Case, Transaction, Tranche, User, Finding, CaseAction, ActionType, BehaviourFlag, TranchType, ActionRecipient } from "../types";
import { FINDING_PRIORITY } from "../types";

const UNSUBSTANTIATED: Finding = "unsubstantiated";

// ── Seed Data ─────────────────────────────────────────────────────────────────

const seedUsers: User[] = [
  { id: 1, name: "Sarah Mitchell", email: "s.mitchell@example.com", role: "analyst", created_at: "2024-10-01T09:00:00Z" },
  { id: 2, name: "James Okafor", email: "j.okafor@example.com", role: "analyst", created_at: "2024-10-01T09:00:00Z" },
  { id: 3, name: "Priya Sharma", email: "p.sharma@example.com", role: "senior_analyst", created_at: "2024-10-01T09:00:00Z" },
];

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

const seedTranches: Tranche[] = [
  { id: 1, case_id: 1, type: "catalyst", number: 1, created_at: "2024-11-05T10:00:00Z" },
  { id: 2, case_id: 2, type: "catalyst", number: 1, created_at: "2024-10-28T10:00:00Z" },
  { id: 3, case_id: 3, type: "catalyst", number: 1, created_at: "2024-10-05T10:00:00Z" },
  { id: 4, case_id: 3, type: "historical", number: 1, date_range: "Jan 2024 – Jun 2024", created_at: "2024-10-05T10:00:00Z" },
  { id: 5, case_id: 4, type: "catalyst", number: 1, created_at: "2024-11-16T10:00:00Z" },
  { id: 6, case_id: 5, type: "catalyst", number: 1, created_at: "2024-11-03T10:00:00Z" },
];

const seedCases: Case[] = [
  { id: 1, reference: "CASE-0001", title: "Till discrepancy review", description: "Multiple till shortfalls flagged over a 2-week period.", subject_name: "Tom Hendricks", pipeline_status: "new", finding: "unsubstantiated", assigned_user_id: null, assignee: null, transactions: [], tranches: [], behaviours: [], closed_at: null, created_at: "2024-11-05T10:00:00Z", updated_at: "2024-11-05T10:00:00Z" },
  { id: 2, reference: "CASE-0002", title: "Unauthorised account access", description: "Agent accessed customer accounts outside of active call log.", subject_name: "Lisa Payne", pipeline_status: "under_review", finding: "non_compliance", assigned_user_id: 1, assignee: seedUsers[0], transactions: [], tranches: [], behaviours: [], closed_at: null, created_at: "2024-10-28T10:00:00Z", updated_at: "2024-11-07T10:00:00Z" },
  { id: 3, reference: "CASE-0003", title: "Suspected stock theft", description: "High-value items repeatedly missing from shift counts. CCTV reviewed.", subject_name: "Marcus Webb", pipeline_status: "closed", finding: "ISP", assigned_user_id: 3, assignee: seedUsers[2], transactions: [], tranches: [], behaviours: [], closed_at: "2024-11-20T14:00:00Z", created_at: "2024-10-05T10:00:00Z", updated_at: "2024-11-20T14:00:00Z" },
  { id: 4, reference: "CASE-0004", title: "Potential data breach — customer PII shared", description: "Customer complaint that agent disclosed personal data to a third party.", subject_name: "Chloe Nkosi", pipeline_status: "triage", finding: "unsubstantiated", assigned_user_id: 2, assignee: seedUsers[1], transactions: [], tranches: [], behaviours: [], closed_at: null, created_at: "2024-11-16T10:00:00Z", updated_at: "2024-11-16T10:00:00Z" },
  { id: 5, reference: "CASE-0005", title: "Refund manipulation", description: "Refunds processed to personal card not matching original payment method.", subject_name: "Ben Castillo", pipeline_status: "awaiting_allocation", finding: "unsubstantiated", assigned_user_id: null, assignee: null, transactions: [], tranches: [], behaviours: [], closed_at: null, created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
];

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

// ── In-memory Store ───────────────────────────────────────────────────────────

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

function now() {
  return new Date().toISOString();
}

function recalcCaseFinding(caseId: number): void {
  const caseTxns = transactions.filter((t) => t.case_id === caseId);
  const highest = caseTxns.reduce<Finding>(
    (best, t) => FINDING_PRIORITY[t.finding] > FINDING_PRIORITY[best] ? t.finding : best,
    UNSUBSTANTIATED,
  );
  const c = cases.find((c) => c.id === caseId);
  if (c) { c.finding = highest; c.updated_at = now(); }
}

function recalcCaseBehaviours(caseId: number): void {
  const caseTxns = transactions.filter((t) => t.case_id === caseId);
  const unique = [...new Set(caseTxns.flatMap((t) => t.behaviours))] as BehaviourFlag[];
  const c = cases.find((c) => c.id === caseId);
  if (c) { c.behaviours = unique; }
}

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

function delay<T>(value: T): Promise<T> {
  return new Promise((res) => setTimeout(() => res(value), 60));
}

// ── Users API ─────────────────────────────────────────────────────────────────

export const usersApi = {
  list: () => delay([...users]),

  create: (data: { name: string; email: string; role?: string }) => {
    const user: User = { id: nextUserId++, role: "analyst", created_at: now(), ...data };
    users.push(user);
    return delay(user);
  },
};

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

// ── Cases API ─────────────────────────────────────────────────────────────────

export interface CaseFilters {
  status?: string;
  assigned_user_id?: number;
}

export const casesApi = {
  list: (filters: CaseFilters = {}) => {
    let result = hydrateCases(cases);
    if (filters.status) result = result.filter((c) => c.pipeline_status === filters.status);
    if (filters.assigned_user_id) result = result.filter((c) => c.assigned_user_id === filters.assigned_user_id);
    return delay(result.map((c) => ({ ...c, transaction_count: c.transactions.length })));
  },

  get: (id: number) => {
    const c = hydrateCases(cases).find((c) => c.id === id);
    if (!c) return Promise.reject(new Error("Case not found"));
    return delay({ ...c });
  },

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

  update: (id: number, data: Partial<Case>) => {
    const idx = cases.findIndex((c) => c.id === id);
    if (idx === -1) return Promise.reject(new Error("Case not found"));
    const prev = cases[idx];
    const updated = { ...prev, ...data, updated_at: now() };
    // Auto-set closed_at when transitioning to closed
    if (data.pipeline_status === "closed" && prev.pipeline_status !== "closed") {
      updated.closed_at = updated.updated_at;
    }
    // Clear closed_at if reopened
    if (data.pipeline_status && data.pipeline_status !== "closed" && prev.pipeline_status === "closed") {
      updated.closed_at = null;
    }
    cases[idx] = updated;
    const [hydrated] = hydrateCases([cases[idx]]);
    return delay({ ...hydrated });
  },

  delete: (id: number) => {
    cases = cases.filter((c) => c.id !== id);
    transactions = transactions.filter((t) => t.case_id !== id);
    actions = actions.filter((a) => a.case_id !== id);
    return delay(undefined as void);
  },
};

// ── Transactions API ──────────────────────────────────────────────────────────

export const transactionsApi = {
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

  delete: (id: number) => {
    const txn = transactions.find((t) => t.id === id);
    if (!txn) return Promise.reject(new Error("Transaction not found"));
    transactions = transactions.filter((t) => t.id !== id);
    recalcCaseFinding(txn.case_id);
    recalcCaseBehaviours(txn.case_id);
    return delay(undefined as void);
  },
};

// ── Actions API ───────────────────────────────────────────────────────────────

export const actionsApi = {
  list: (caseId: number) =>
    delay([...actions].filter((a) => a.case_id === caseId).sort(
      (a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime(),
    )),

  listAll: () =>
    delay([...actions].sort(
      (a, b) => new Date(b.triggered_at).getTime() - new Date(a.triggered_at).getTime(),
    )),

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
};

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
