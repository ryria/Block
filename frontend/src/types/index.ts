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

export type ActionType = "notification" | "pause" | "resume";

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
  bc_status: "paused" | "active";
  er_status: "paused" | "active";
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
    notification: "Case Opened", pause: "Pause", resume: "Resume",
  };
  return map[t];
}

export function labelRecipient(r: ActionRecipient): string {
  const map: Record<ActionRecipient, string> = {
    "B&C": "B&C", ER: "ER", all: "B&C & ER",
  };
  return map[r];
}
