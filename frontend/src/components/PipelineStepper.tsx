import type { CaseStatus, TransactionStatus } from "../types";
import {
  CASE_STATUSES,
  TRANSACTION_STATUSES,
  labelCaseStatus,
  labelTransactionStatus,
} from "../types";

interface CaseProps {
  type: "case";
  current: CaseStatus;
}

interface TxnProps {
  type: "transaction";
  current: TransactionStatus;
}

type Props = CaseProps | TxnProps;

export default function PipelineStepper(props: Props) {
  const steps =
    props.type === "case"
      ? CASE_STATUSES.map((s) => ({ key: s, label: labelCaseStatus(s) }))
      : TRANSACTION_STATUSES.map((s) => ({ key: s, label: labelTransactionStatus(s) }));

  const currentIndex = steps.findIndex((s) => s.key === props.current);

  return (
    <div className="pipeline">
      {steps.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={step.key} className={`pipeline__step ${done ? "done" : ""} ${active ? "active" : ""}`}>
            <div className="pipeline__dot">
              {done && (
                <svg viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            {i < steps.length - 1 && <div className="pipeline__line" />}
            <span className="pipeline__label">{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}
