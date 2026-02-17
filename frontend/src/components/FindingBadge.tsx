import type { Finding } from "../types";
import { labelFinding } from "../types";

interface Props {
  finding: Finding;
  size?: "sm" | "md";
}

const colours: Record<Finding, string> = {
  unsubstantiated: "badge--grey",
  non_compliance: "badge--amber",
  ISP: "badge--red",
};

export default function FindingBadge({ finding, size = "md" }: Props) {
  return (
    <span className={`badge ${colours[finding]} ${size === "sm" ? "badge--sm" : ""}`}>
      {labelFinding(finding)}
    </span>
  );
}
