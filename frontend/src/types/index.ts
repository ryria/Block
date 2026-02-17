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

export type SubjectType = "retail" | "contact_centre";

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Transaction {
  id: number;
  case_id: number;
  reference: string;
  description: string | null;
  amount: string | null;
  transaction_date: string | null;
  pipeline_status: TransactionStatus;
  finding: Finding;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Case {
  id: number;
  reference: string;
  title: string;
  description: string | null;
  subject_name: string;
  subject_type: SubjectType;
  pipeline_status: CaseStatus;
  finding: Finding;
  assigned_user_id: number | null;
  assignee: User | null;
  transactions: Transaction[];
  transaction_count?: number;
  created_at: string;
  updated_at: string;
}

export const CASE_STATUSES: CaseStatus[] = [
  "new",
  "triage",
  "awaiting_allocation",
  "under_review",
  "awaiting_information",
  "awaiting_finalisation",
  "closed",
];

export const TRANSACTION_STATUSES: TransactionStatus[] = [
  "awaiting_review",
  "under_review",
  "reviewed",
];

export const FINDINGS: Finding[] = ["unsubstantiated", "non_compliance", "ISP"];

export const FINDING_PRIORITY: Record<Finding, number> = {
  unsubstantiated: 0,
  non_compliance: 1,
  ISP: 2,
};

export function labelCaseStatus(s: CaseStatus): string {
  const map: Record<CaseStatus, string> = {
    new: "New",
    triage: "Triage",
    awaiting_allocation: "Awaiting Allocation",
    under_review: "Under Review",
    awaiting_information: "Awaiting Information",
    awaiting_finalisation: "Awaiting Finalisation",
    closed: "Closed",
  };
  return map[s];
}

export function labelTransactionStatus(s: TransactionStatus): string {
  const map: Record<TransactionStatus, string> = {
    awaiting_review: "Awaiting Review",
    under_review: "Under Review",
    reviewed: "Reviewed",
  };
  return map[s];
}

export function labelFinding(f: Finding): string {
  const map: Record<Finding, string> = {
    unsubstantiated: "Unsubstantiated",
    non_compliance: "Non-Compliance",
    ISP: "ISP",
  };
  return map[f];
}

export function labelSubjectType(t: SubjectType): string {
  return t === "retail" ? "Retail" : "Contact Centre";
}
