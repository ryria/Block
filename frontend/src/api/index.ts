import type { Case, Transaction, User, Finding } from "../types";
import { FINDING_PRIORITY } from "../types";

const UNSUBSTANTIATED: Finding = "unsubstantiated";

// ── Seed Data ─────────────────────────────────────────────────────────────────

const seedUsers: User[] = [
  { id: 1, name: "Sarah Mitchell", email: "s.mitchell@example.com", role: "analyst", created_at: "2024-10-01T09:00:00Z" },
  { id: 2, name: "James Okafor", email: "j.okafor@example.com", role: "analyst", created_at: "2024-10-01T09:00:00Z" },
  { id: 3, name: "Priya Sharma", email: "p.sharma@example.com", role: "senior_analyst", created_at: "2024-10-01T09:00:00Z" },
];

const seedTransactions: Transaction[] = [
  { id: 1, case_id: 1, reference: "TXN-10041", description: "Till short £42.00", amount: "£42.00", transaction_date: "2024-11-01", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, created_at: "2024-11-05T10:00:00Z", updated_at: "2024-11-05T10:00:00Z" },
  { id: 2, case_id: 1, reference: "TXN-10055", description: "Till short £18.50", amount: "£18.50", transaction_date: "2024-11-04", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, created_at: "2024-11-05T10:00:00Z", updated_at: "2024-11-05T10:00:00Z" },
  { id: 3, case_id: 2, reference: "TXN-20012", description: "Account lookup — no active call", amount: null, transaction_date: "2024-10-22", pipeline_status: "reviewed", finding: "non_compliance", notes: "Confirmed no call in progress at time of access.", created_at: "2024-10-28T10:00:00Z", updated_at: "2024-11-07T10:00:00Z" },
  { id: 4, case_id: 2, reference: "TXN-20019", description: "Address change — no active call", amount: null, transaction_date: "2024-10-23", pipeline_status: "under_review", finding: "unsubstantiated", notes: null, created_at: "2024-10-28T10:00:00Z", updated_at: "2024-11-07T10:00:00Z" },
  { id: 5, case_id: 3, reference: "TXN-30001", description: "Missing stock — headphones x3", amount: "£210.00", transaction_date: "2024-10-01", pipeline_status: "reviewed", finding: "ISP", notes: "CCTV confirms subject removed items from stockroom.", created_at: "2024-10-05T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  { id: 6, case_id: 3, reference: "TXN-30002", description: "Missing stock — tablet x1", amount: "£349.00", transaction_date: "2024-10-08", pipeline_status: "reviewed", finding: "non_compliance", notes: "Procedural breach confirmed; theft not proven for this item.", created_at: "2024-10-10T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  { id: 7, case_id: 3, reference: "TXN-30003", description: "Missing stock — cables", amount: "£55.00", transaction_date: "2024-10-15", pipeline_status: "reviewed", finding: "unsubstantiated", notes: "Stock discrepancy attributed to data entry error.", created_at: "2024-10-18T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  { id: 8, case_id: 5, reference: "TXN-50001", description: "Refund £85.00 to alternate card", amount: "£85.00", transaction_date: "2024-10-28", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
  { id: 9, case_id: 5, reference: "TXN-50002", description: "Refund £120.00 to alternate card", amount: "£120.00", transaction_date: "2024-10-30", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
  { id: 10, case_id: 5, reference: "TXN-50003", description: "Refund £34.00 to alternate card", amount: "£34.00", transaction_date: "2024-11-02", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
];

const seedCases: Case[] = [
  { id: 1, reference: "CASE-0001", title: "Till discrepancy review", description: "Multiple till shortfalls flagged over a 2-week period.", subject_name: "Tom Hendricks", pipeline_status: "new", finding: "unsubstantiated", assigned_user_id: null, assignee: null, transactions: [], created_at: "2024-11-05T10:00:00Z", updated_at: "2024-11-05T10:00:00Z" },
  { id: 2, reference: "CASE-0002", title: "Unauthorised account access", description: "Agent accessed customer accounts outside of active call log.", subject_name: "Lisa Payne", pipeline_status: "under_review", finding: "non_compliance", assigned_user_id: 1, assignee: seedUsers[0], transactions: [], created_at: "2024-10-28T10:00:00Z", updated_at: "2024-11-07T10:00:00Z" },
  { id: 3, reference: "CASE-0003", title: "Suspected stock theft", description: "High-value items repeatedly missing from shift counts. CCTV reviewed.", subject_name: "Marcus Webb", pipeline_status: "awaiting_finalisation", finding: "ISP", assigned_user_id: 3, assignee: seedUsers[2], transactions: [], created_at: "2024-10-05T10:00:00Z", updated_at: "2024-11-12T10:00:00Z" },
  { id: 4, reference: "CASE-0004", title: "Potential data breach — customer PII shared", description: "Customer complaint that agent disclosed personal data to a third party.", subject_name: "Chloe Nkosi", pipeline_status: "triage", finding: "unsubstantiated", assigned_user_id: 2, assignee: seedUsers[1], transactions: [], created_at: "2024-11-16T10:00:00Z", updated_at: "2024-11-16T10:00:00Z" },
  { id: 5, reference: "CASE-0005", title: "Refund manipulation", description: "Refunds processed to personal card not matching original payment method.", subject_name: "Ben Castillo", pipeline_status: "awaiting_allocation", finding: "unsubstantiated", assigned_user_id: null, assignee: null, transactions: [], created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
];

// ── In-memory Store ───────────────────────────────────────────────────────────

let users: User[] = seedUsers.map((u) => ({ ...u }));
let transactions: Transaction[] = seedTransactions.map((t) => ({ ...t }));
let cases: Case[] = seedCases.map((c) => ({ ...c }));

let nextUserId = 4;
let nextCaseId = 6;
let nextTxnId = 11;
let nextCaseNum = 6;

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

function hydrateCases(raw: Case[]): Case[] {
  return raw.map((c) => ({
    ...c,
    assignee: users.find((u) => u.id === c.assigned_user_id) ?? null,
    transactions: transactions.filter((t) => t.case_id === c.id),
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

  create: (data: { title: string; description?: string; subject_name: string; assigned_user_id?: number | null }) => {
    const ref = `CASE-${String(nextCaseNum++).padStart(4, "0")}`;
    const c: Case = {
      id: nextCaseId++,
      reference: ref,
      pipeline_status: "new",
      finding: UNSUBSTANTIATED,
      transactions: [],
      assignee: users.find((u) => u.id === data.assigned_user_id) ?? null,
      created_at: now(),
      updated_at: now(),
      subject_name: data.subject_name,
      title: data.title,
      description: data.description ?? null,
      assigned_user_id: data.assigned_user_id ?? null,
    };
    cases.push(c);
    return delay({ ...c });
  },

  update: (id: number, data: Partial<Case>) => {
    const idx = cases.findIndex((c) => c.id === id);
    if (idx === -1) return Promise.reject(new Error("Case not found"));
    cases[idx] = { ...cases[idx], ...data, updated_at: now() };
    const [hydrated] = hydrateCases([cases[idx]]);
    return delay({ ...hydrated });
  },

  delete: (id: number) => {
    cases = cases.filter((c) => c.id !== id);
    transactions = transactions.filter((t) => t.case_id !== id);
    return delay(undefined as void);
  },
};

// ── Transactions API ──────────────────────────────────────────────────────────

export const transactionsApi = {
  create: (data: { case_id: number; reference: string; description?: string; amount?: string; transaction_date?: string }) => {
    const txn: Transaction = {
      id: nextTxnId++,
      pipeline_status: "awaiting_review",
      finding: UNSUBSTANTIATED,
      notes: null,
      created_at: now(),
      updated_at: now(),
      description: data.description ?? null,
      amount: data.amount ?? null,
      transaction_date: data.transaction_date ?? null,
      case_id: data.case_id,
      reference: data.reference,
    };
    transactions.push(txn);
    recalcCaseFinding(data.case_id);
    return delay({ ...txn });
  },

  update: (id: number, data: Partial<Transaction>) => {
    const idx = transactions.findIndex((t) => t.id === id);
    if (idx === -1) return Promise.reject(new Error("Transaction not found"));
    transactions[idx] = { ...transactions[idx], ...data, updated_at: now() };
    recalcCaseFinding(transactions[idx].case_id);
    return delay({ ...transactions[idx] });
  },

  delete: (id: number) => {
    const txn = transactions.find((t) => t.id === id);
    if (!txn) return Promise.reject(new Error("Transaction not found"));
    transactions = transactions.filter((t) => t.id !== id);
    recalcCaseFinding(txn.case_id);
    return delay(undefined as void);
  },
};
