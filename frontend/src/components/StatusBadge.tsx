import type { CaseStatus, TransactionStatus } from "../types";
import { labelCaseStatus, labelTransactionStatus } from "../types";

type AnyStatus = CaseStatus | TransactionStatus;

const caseColours: Record<CaseStatus, string> = {
  new: "badge--blue",
  triage: "badge--purple",
  awaiting_allocation: "badge--orange",
  under_review: "badge--yellow",
  awaiting_information: "badge--orange",
  awaiting_finalisation: "badge--teal",
  closed: "badge--grey",
};

const txnColours: Record<TransactionStatus, string> = {
  awaiting_review: "badge--blue",
  under_review: "badge--yellow",
  reviewed: "badge--teal",
};

function isCaseStatus(s: AnyStatus): s is CaseStatus {
  return [
    "new", "triage", "awaiting_allocation", "under_review",
    "awaiting_information", "awaiting_finalisation", "closed",
  ].includes(s);
}

interface Props {
  status: AnyStatus;
  size?: "sm" | "md";
}

export default function StatusBadge({ status, size = "md" }: Props) {
  const colour = isCaseStatus(status)
    ? caseColours[status]
    : txnColours[status as TransactionStatus];

  const label = isCaseStatus(status)
    ? labelCaseStatus(status)
    : labelTransactionStatus(status as TransactionStatus);

  return (
    <span className={`badge ${colour} ${size === "sm" ? "badge--sm" : ""}`}>
      {label}
    </span>
  );
}
