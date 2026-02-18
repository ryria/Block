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
  // Case 1 — awaiting_review → bc_status: paused, er_status: active
  { id: 1, case_id: 1, reference: "TXN-10041", description: "Till short", transaction_date: "2024-11-01", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["cash_discrepancy"], bc_status: "paused", er_status: "active", created_at: "2024-11-05T10:00:00Z", updated_at: "2024-11-05T10:00:00Z" },
  { id: 2, case_id: 1, reference: "TXN-10055", description: "Till short", transaction_date: "2024-11-04", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["cash_discrepancy"], bc_status: "paused", er_status: "active", created_at: "2024-11-05T10:00:00Z", updated_at: "2024-11-05T10:00:00Z" },
  // Case 2 — TXN-20012: reviewed + non_compliance → bc_status: active, er_status: active
  { id: 3, case_id: 2, reference: "TXN-20012", description: "Account lookup — no active call", transaction_date: "2024-10-22", pipeline_status: "reviewed", finding: "non_compliance", notes: "Confirmed no call in progress at time of access.", cohort: "catalyst", tranche_number: 1, behaviours: ["unauthorised_access", "privacy_breach"], bc_status: "active", er_status: "active", created_at: "2024-10-28T10:00:00Z", updated_at: "2024-11-07T10:00:00Z" },
  // Case 2 — TXN-20019: under_review → bc_status: paused, er_status: active
  { id: 4, case_id: 2, reference: "TXN-20019", description: "Address change — no active call", transaction_date: "2024-10-23", pipeline_status: "under_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["unauthorised_access"], bc_status: "paused", er_status: "active", created_at: "2024-10-28T10:00:00Z", updated_at: "2024-11-07T10:00:00Z" },
  // Case 3 — TXN-30001: reviewed + ISP → bc_status: paused, er_status: paused
  { id: 5, case_id: 3, reference: "TXN-30001", description: "Missing stock — headphones x3", transaction_date: "2024-10-01", pipeline_status: "reviewed", finding: "ISP", notes: "CCTV confirms subject removed items from stockroom.", cohort: "catalyst", tranche_number: 1, behaviours: ["cash_discrepancy"], bc_status: "paused", er_status: "paused", created_at: "2024-10-05T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  // Case 3 — TXN-30002: reviewed + non_compliance → bc_status: active, er_status: active
  { id: 6, case_id: 3, reference: "TXN-30002", description: "Missing stock — tablet x1", transaction_date: "2024-10-08", pipeline_status: "reviewed", finding: "non_compliance", notes: "Procedural breach confirmed; theft not proven.", cohort: "catalyst", tranche_number: 1, behaviours: [], bc_status: "active", er_status: "active", created_at: "2024-10-10T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  // Case 3 — TXN-30003: reviewed + unsubstantiated → bc_status: active, er_status: active
  { id: 7, case_id: 3, reference: "TXN-30003", description: "Missing stock — cables", transaction_date: "2024-10-15", pipeline_status: "reviewed", finding: "unsubstantiated", notes: "Stock discrepancy attributed to data entry error.", cohort: "catalyst", tranche_number: 1, behaviours: [], bc_status: "active", er_status: "active", created_at: "2024-10-18T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  // Case 3 — historical tranches: reviewed + non_compliance/unsubstantiated → bc_status: active
  { id: 8, case_id: 3, reference: "TXN-30010", description: "Historical: Cash drawer reconciliation", transaction_date: "2024-01-15", pipeline_status: "reviewed", finding: "non_compliance", notes: "Reconciliation error identified.", cohort: "historical", tranche_number: 1, behaviours: ["cash_discrepancy"], bc_status: "active", er_status: "active", created_at: "2024-10-05T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  { id: 9, case_id: 3, reference: "TXN-30011", description: "Historical: Missing accessories", transaction_date: "2024-02-20", pipeline_status: "reviewed", finding: "unsubstantiated", notes: null, cohort: "historical", tranche_number: 1, behaviours: [], bc_status: "active", er_status: "active", created_at: "2024-10-05T10:00:00Z", updated_at: "2024-11-10T10:00:00Z" },
  // Case 5 — awaiting_review → bc_status: paused, er_status: active
  { id: 10, case_id: 5, reference: "TXN-50001", description: "Refund to alternate card", transaction_date: "2024-10-28", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["refund_manipulation"], bc_status: "paused", er_status: "active", created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
  { id: 11, case_id: 5, reference: "TXN-50002", description: "Refund to alternate card", transaction_date: "2024-10-30", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["refund_manipulation"], bc_status: "paused", er_status: "active", created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
  { id: 12, case_id: 5, reference: "TXN-50003", description: "Refund to alternate card", transaction_date: "2024-11-02", pipeline_status: "awaiting_review", finding: "unsubstantiated", notes: null, cohort: "catalyst", tranche_number: 1, behaviours: ["refund_manipulation"], bc_status: "paused", er_status: "active", created_at: "2024-11-03T10:00:00Z", updated_at: "2024-11-03T10:00:00Z" },
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
  { id: 1,  case_id: 1, type: "notification", recipient: "all",  transaction_ids: [],        triggered_at: "2024-11-05T10:00:00Z", note: null },
  { id: 2,  case_id: 1, type: "pause",        recipient: "B&C",  transaction_ids: [1, 2],    triggered_at: "2024-11-05T10:00:01Z", note: "Auto: case opened" },
  { id: 3,  case_id: 2, type: "notification", recipient: "all",  transaction_ids: [],        triggered_at: "2024-10-28T10:00:00Z", note: null },
  { id: 4,  case_id: 2, type: "pause",        recipient: "B&C",  transaction_ids: [3, 4],    triggered_at: "2024-10-28T10:00:01Z", note: "Auto: case opened" },
  { id: 5,  case_id: 2, type: "resume",       recipient: "B&C",  transaction_ids: [3],       triggered_at: "2024-11-07T10:00:00Z", note: "Auto: TXN-20012 reviewed — non_compliance" },
  { id: 6,  case_id: 3, type: "notification", recipient: "all",  transaction_ids: [],        triggered_at: "2024-10-05T10:00:00Z", note: null },
  { id: 7,  case_id: 3, type: "pause",        recipient: "B&C",  transaction_ids: [5, 6, 7], triggered_at: "2024-10-05T10:00:01Z", note: "Auto: case opened" },
  { id: 8,  case_id: 3, type: "pause",        recipient: "B&C",  transaction_ids: [8, 9],    tranche_ref: "Historical Tranche #1", triggered_at: "2024-10-05T10:05:00Z", note: "Bulk upload — Historical Tranche #1" },
  { id: 9,  case_id: 3, type: "pause",        recipient: "ER",   transaction_ids: [5],       triggered_at: "2024-11-10T09:00:00Z", note: "Auto: TXN-30001 reviewed — ISP" },
  { id: 10, case_id: 3, type: "resume",       recipient: "B&C",  transaction_ids: [6, 7, 8, 9], triggered_at: "2024-11-10T09:30:00Z", note: "Auto: reviewed — non-ISP" },
  { id: 11, case_id: 4, type: "notification", recipient: "all",  transaction_ids: [],        triggered_at: "2024-11-16T10:00:00Z", note: null },
  { id: 12, case_id: 5, type: "notification", recipient: "all",  transaction_ids: [],        triggered_at: "2024-11-03T10:00:00Z", note: null },
  { id: 13, case_id: 5, type: "pause",        recipient: "B&C",  transaction_ids: [10, 11, 12], triggered_at: "2024-11-03T10:00:01Z", note: "Auto: case opened" },
];

// ── Random Seed Generator (100 cases, Jan 2023 – Feb 2026) ────────────────────

function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const SUBJECT_NAMES = [
  "Alex Turner", "Beth Hammond", "Carl Jensen", "Diana Osei", "Ethan Brooks",
  "Fiona Walsh", "George Patel", "Hannah Clarke", "Ivan Novak", "Julia Santos",
  "Kyle Morgan", "Laura Kim", "Matt Dolan", "Nina Reyes", "Owen Fletcher",
  "Paula Chen", "Quinn Adams", "Rachel Stone", "Sam Elliott", "Tara Nguyen",
  "Uma Sharma", "Victor Lawson", "Wendy Frost", "Xander Bell", "Yara Okafor",
  "Zoe Higgins", "Aaron Mills", "Bella Cruz", "Connor Reed", "Dani Park",
];

const CASE_TITLES = [
  "Till discrepancy investigation", "Unauthorised system access", "Stock shortage review",
  "Refund irregularity", "Customer data access audit", "Expense claim review",
  "Timesheet discrepancy", "Cash handling concern", "Policy violation — access controls",
  "Suspected fraud — returns", "Missing inventory review", "Account manipulation concern",
];

const ALL_BEHAVIOURS: BehaviourFlag[] = [
  "privacy_breach", "credit_fraud", "id_fraud",
  "refund_manipulation", "unauthorised_access", "cash_discrepancy",
];

const TXN_DESCRIPTIONS = [
  "Cash refund processed", "Account lookup — no active call", "Card transaction reversal",
  "Void transaction", "Price override applied", "Discount — supervisor approval",
  "Manual cash entry", "Stock adjustment", "Refund to alternate account",
  "End-of-day reconciliation shortfall", "Missing item report", "Access log anomaly",
];

function randomSeedData(): {
  cases: Case[];
  transactions: Transaction[];
  tranches: Tranche[];
  actions: CaseAction[];
} {
  const cases: Case[] = [];
  const transactions: Transaction[] = [];
  const tranches: Tranche[] = [];
  const actions: CaseAction[] = [];

  const JAN_2023 = new Date("2023-01-01T00:00:00Z").getTime();
  const FEB_2026 = new Date("2026-02-18T00:00:00Z").getTime();
  const CUTOFF_90D = new Date("2025-11-20T00:00:00Z").getTime(); // ~90 days before Feb 2026

  let caseId = 6;
  let txnId = 13;
  let trancheId = 7;
  let actionId = 14;
  let caseNum = 6;

  const seedAnalystIds = [1, 2, 3, null, null]; // weight toward unassigned

  for (let i = 0; i < 100; i++) {
    const rng = seededRand(i * 7919 + 31337);

    // Random case date
    const caseTs = JAN_2023 + Math.floor(rng() * (FEB_2026 - JAN_2023));
    const caseDate = new Date(caseTs);
    const caseDateStr = caseDate.toISOString();
    // Status: older cases skewed closed, recent cases skewed open
    const isRecent = caseTs > CUTOFF_90D;
    const closedChance = isRecent ? 0.1 : 0.55;
    const isClosed = rng() < closedChance;

    const statusOptions: Case["pipeline_status"][] = isClosed
      ? ["closed"]
      : ["new", "triage", "awaiting_allocation", "under_review", "awaiting_information", "awaiting_finalisation"];
    const statusWeights = isClosed ? [1] : [0.1, 0.15, 0.15, 0.3, 0.15, 0.15];
    let statusRoll = rng();
    let caseStatus: Case["pipeline_status"] = statusOptions[0];
    let cumWeight = 0;
    for (let j = 0; j < statusOptions.length; j++) {
      cumWeight += statusWeights[j];
      if (statusRoll < cumWeight) { caseStatus = statusOptions[j]; break; }
    }

    const closedAt = isClosed
      ? new Date(caseTs + Math.floor(rng() * 60 * 86400000) + 5 * 86400000).toISOString()
      : null;

    const subjectName = SUBJECT_NAMES[Math.floor(rng() * SUBJECT_NAMES.length)];
    const title = CASE_TITLES[Math.floor(rng() * CASE_TITLES.length)];
    const analystIdx = Math.floor(rng() * seedAnalystIds.length);
    const analystId = seedAnalystIds[analystIdx];

    const thisRef = `CASE-${String(caseNum++).padStart(4, "0")}`;
    const thisCaseId = caseId++;

    // Create catalyst tranche
    const thisTrancheId = trancheId++;
    tranches.push({ id: thisTrancheId, case_id: thisCaseId, type: "catalyst", number: 1, created_at: caseDateStr });

    // Create 2–6 transactions
    const txnCount = 2 + Math.floor(rng() * 5);
    const caseTxnIds: number[] = [];
    let caseFinding: Finding = "unsubstantiated";

    for (let t = 0; t < txnCount; t++) {
      const thisTxnId = txnId++;
      caseTxnIds.push(thisTxnId);

      // Finding distribution: 60% unsubstantiated, 25% non_compliance, 15% ISP
      const findingRoll = rng();
      const finding: Finding = findingRoll < 0.60 ? "unsubstantiated"
        : findingRoll < 0.85 ? "non_compliance" : "ISP";

      if (FINDING_PRIORITY[finding] > FINDING_PRIORITY[caseFinding]) {
        caseFinding = finding;
      }

      // Pipeline status: if case is open, transactions may be at various stages
      // If case is closed, transactions are all reviewed
      let txnStatus: Transaction["pipeline_status"];
      if (isClosed) {
        txnStatus = "reviewed";
      } else {
        const txnRoll = rng();
        txnStatus = txnRoll < 0.5 ? "awaiting_review" : txnRoll < 0.75 ? "under_review" : "reviewed";
      }

      // Channel statuses based on pipeline_status and finding
      let bc_status: "paused" | "active";
      let er_status: "paused" | "active";

      if (txnStatus === "reviewed" && finding === "ISP") {
        bc_status = "paused"; er_status = "paused";
      } else if (txnStatus === "reviewed") {
        bc_status = "active"; er_status = "active";
      } else {
        bc_status = "paused"; er_status = "active";
      }

      // Behaviours: 0–2 random flags
      const bCount = Math.floor(rng() * 3);
      const behaviours: BehaviourFlag[] = [];
      for (let b = 0; b < bCount; b++) {
        const flag = ALL_BEHAVIOURS[Math.floor(rng() * ALL_BEHAVIOURS.length)];
        if (!behaviours.includes(flag)) behaviours.push(flag);
      }

      const txnDaysOffset = Math.floor(rng() * 30) + 1;
      const txnDate = new Date(caseTs - txnDaysOffset * 86400000).toISOString().slice(0, 10);

      transactions.push({
        id: thisTxnId,
        case_id: thisCaseId,
        reference: `TXN-G${String(thisTxnId).padStart(5, "0")}`,
        description: TXN_DESCRIPTIONS[Math.floor(rng() * TXN_DESCRIPTIONS.length)],
        transaction_date: txnDate,
        pipeline_status: txnStatus,
        finding,
        notes: txnStatus === "reviewed" ? "Reviewed during investigation." : null,
        cohort: "catalyst",
        tranche_number: 1,
        behaviours,
        bc_status,
        er_status,
        created_at: caseDateStr,
        updated_at: caseDateStr,
      });
    }

    // Auto-actions: notification + pause B&C on open
    const notifId = actionId++;
    actions.push({
      id: notifId,
      case_id: thisCaseId,
      type: "notification",
      recipient: "all",
      transaction_ids: [],
      triggered_at: caseDateStr,
      note: null,
    });

    if (caseTxnIds.length > 0) {
      actions.push({
        id: actionId++,
        case_id: thisCaseId,
        type: "pause",
        recipient: "B&C",
        transaction_ids: [...caseTxnIds],
        triggered_at: new Date(caseTs + 1000).toISOString(),
        note: "Auto: case opened",
      });
    }

    // Auto-actions for reviewed transactions
    for (let t = 0; t < caseTxnIds.length; t++) {
      const txn = transactions[transactions.length - caseTxnIds.length + t];
      if (txn.pipeline_status === "reviewed") {
        const reviewTs = new Date(caseTs + (t + 1) * 86400000 * 2).toISOString();
        if (txn.finding === "ISP") {
          actions.push({
            id: actionId++,
            case_id: thisCaseId,
            type: "pause",
            recipient: "ER",
            transaction_ids: [txn.id],
            triggered_at: reviewTs,
            note: `Auto: ${txn.reference} reviewed — ISP`,
          });
        } else {
          actions.push({
            id: actionId++,
            case_id: thisCaseId,
            type: "resume",
            recipient: "B&C",
            transaction_ids: [txn.id],
            triggered_at: reviewTs,
            note: `Auto: ${txn.reference} reviewed — ${txn.finding}`,
          });
        }
      }
    }

    const behaviourSet = [...new Set(
      transactions.filter((t) => t.case_id === thisCaseId).flatMap((t) => t.behaviours)
    )] as BehaviourFlag[];

    cases.push({
      id: thisCaseId,
      reference: thisRef,
      title,
      description: null,
      subject_name: subjectName,
      pipeline_status: caseStatus,
      finding: caseFinding,
      assigned_user_id: analystId,
      assignee: null,
      transactions: [],
      tranches: [],
      behaviours: behaviourSet,
      closed_at: closedAt,
      created_at: caseDateStr,
      updated_at: closedAt ?? caseDateStr,
    });
  }

  return { cases, transactions, tranches, actions };
}

// ── In-memory Store ───────────────────────────────────────────────────────────

const generated = randomSeedData();

let users: User[] = seedUsers.map((u) => ({ ...u }));
let transactions: Transaction[] = [...seedTransactions, ...generated.transactions].map((t) => ({ ...t }));
let tranches: Tranche[] = [...seedTranches, ...generated.tranches].map((t) => ({ ...t }));
let cases: Case[] = [...seedCases, ...generated.cases].map((c) => ({ ...c }));
let actions: CaseAction[] = [...seedActions, ...generated.actions].map((a) => ({ ...a }));

// Compute max IDs from generated data
const maxCaseId = Math.max(...cases.map((c) => c.id));
const maxTxnId = Math.max(...transactions.map((t) => t.id));
const maxTrancheId = Math.max(...tranches.map((t) => t.id));
const maxActionId = Math.max(...actions.map((a) => a.id));

let nextUserId = 4;
let nextCaseId = maxCaseId + 1;
let nextTxnId = maxTxnId + 1;
let nextCaseNum = maxCaseId + 1;
let nextActionId = maxActionId + 1;
let nextTrancheId = maxTrancheId + 1;

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
    const initialTxnIds: number[] = [];
    if (data.initial_transactions?.length) {
      for (const t of data.initial_transactions) {
        const txnId = nextTxnId++;
        initialTxnIds.push(txnId);
        transactions.push({
          id: txnId,
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
          bc_status: "paused",
          er_status: "active",
          created_at: ts,
          updated_at: ts,
        });
      }
      recalcCaseFinding(caseId);
    }

    // Auto: notification
    actions.push({
      id: nextActionId++,
      case_id: caseId,
      type: "notification",
      recipient: "all",
      transaction_ids: [],
      triggered_at: ts,
      note: null,
    });

    // Auto: pause B&C for all initial transactions
    if (initialTxnIds.length > 0) {
      actions.push({
        id: nextActionId++,
        case_id: caseId,
        type: "pause",
        recipient: "B&C",
        transaction_ids: initialTxnIds,
        triggered_at: new Date(new Date(ts).getTime() + 1000).toISOString(),
        note: "Auto: case opened",
      });
    }

    return delay({ ...c });
  },

  update: (id: number, data: Partial<Case>) => {
    const idx = cases.findIndex((c) => c.id === id);
    if (idx === -1) return Promise.reject(new Error("Case not found"));
    const prev = cases[idx];
    const updated = { ...prev, ...data, updated_at: now() };
    if (data.pipeline_status === "closed" && prev.pipeline_status !== "closed") {
      updated.closed_at = updated.updated_at;
    }
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
      bc_status: "paused",
      er_status: "active",
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

    const ts = now();

    // Auto-actions when pipeline_status transitions to "reviewed"
    if (data.pipeline_status === "reviewed" && prev.pipeline_status !== "reviewed") {
      const currentFinding = data.finding ?? prev.finding;
      if (currentFinding === "ISP") {
        // Pause ER
        actions.push({
          id: nextActionId++,
          case_id: prev.case_id,
          type: "pause",
          recipient: "ER",
          transaction_ids: [id],
          triggered_at: ts,
          note: `Auto: ${prev.reference} reviewed — ISP`,
        });
        transactions[idx] = { ...transactions[idx], er_status: "paused" };
      } else {
        // Resume B&C
        actions.push({
          id: nextActionId++,
          case_id: prev.case_id,
          type: "resume",
          recipient: "B&C",
          transaction_ids: [id],
          triggered_at: ts,
          note: `Auto: ${prev.reference} reviewed — ${currentFinding}`,
        });
        transactions[idx] = { ...transactions[idx], bc_status: "active" };
      }
    }

    // Auto-actions when finding changes FROM ISP to non-ISP (already reviewed)
    if (
      data.finding !== undefined &&
      data.finding !== prev.finding &&
      data.finding !== "ISP" &&
      prev.finding === "ISP" &&
      (data.pipeline_status ?? prev.pipeline_status) === "reviewed"
    ) {
      actions.push({
        id: nextActionId++,
        case_id: prev.case_id,
        type: "resume",
        recipient: "ER",
        transaction_ids: [id],
        triggered_at: ts,
        note: `Auto: ${prev.reference} finding changed from ISP to ${data.finding}`,
      });
      transactions[idx] = { ...transactions[idx], er_status: "active" };
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

    // Sync bc_status/er_status on affected transactions
    if (data.transaction_ids?.length && data.type !== "notification") {
      for (const txnId of data.transaction_ids) {
        const i = transactions.findIndex((t) => t.id === txnId);
        if (i === -1) continue;
        if (data.type === "pause" && data.recipient === "B&C")   transactions[i] = { ...transactions[i], bc_status: "paused" };
        if (data.type === "resume" && data.recipient === "B&C")  transactions[i] = { ...transactions[i], bc_status: "active" };
        if (data.type === "pause" && data.recipient === "ER")    transactions[i] = { ...transactions[i], er_status: "paused" };
        if (data.type === "resume" && data.recipient === "ER")   transactions[i] = { ...transactions[i], er_status: "active" };
      }
    }

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
        bc_status: data.send_pause ? "paused" : "active",
        er_status: "active",
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
