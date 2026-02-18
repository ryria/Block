import { useEffect, useState } from "react";
import { casesApi, usersApi, actionsApi } from "../api";
import type { Case, User, CaseAction } from "../types";
import { labelCaseStatus, labelFinding, labelActionType, CASE_STATUSES, FINDINGS, BEHAVIOUR_FLAGS } from "../types";
import type { BehaviourFlag } from "../types";

// ── Colour maps ────────────────────────────────────────────────────────────────

const STATUS_COLOUR: Record<string, string> = {
  new: "#2563eb",
  triage: "#7c3aed",
  awaiting_allocation: "#ea580c",
  under_review: "#d97706",
  awaiting_information: "#0d9488",
  awaiting_finalisation: "#6b7280",
  closed: "#16a34a",
};

const FINDING_COLOUR: Record<string, string> = {
  unsubstantiated: "#9ca3af",
  non_compliance: "#d97706",
  ISP: "#dc2626",
};

const ACTION_COLOUR: Record<string, string> = {
  notification: "#2563eb",
  pause: "#d97706",
  release_withdraw: "#dc2626",
};

// ── Helpers ────────────────────────────────────────────────────────────────────

function daysOpen(c: Case): number {
  const end = c.closed_at ? new Date(c.closed_at) : new Date();
  return Math.floor((end.getTime() - new Date(c.created_at).getTime()) / 86400000);
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return Math.round(nums.reduce((s, n) => s + n, 0) / nums.length);
}

function formatDate(iso: string) {
  return iso.slice(0, 10);
}

// ── CSS Bar Chart ─────────────────────────────────────────────────────────────

interface BarDatum { label: string; value: number; colour?: string; }

function HBar({ data, emptyMsg = "No data" }: { data: BarDatum[]; emptyMsg?: string }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  if (data.every((d) => d.value === 0)) return <p className="muted report-empty">{emptyMsg}</p>;
  return (
    <div className="hbar">
      {data.map((d) => (
        <div key={d.label} className="hbar__row">
          <span className="hbar__label">{d.label}</span>
          <div className="hbar__track">
            <div
              className="hbar__fill"
              style={{ width: `${(d.value / max) * 100}%`, background: d.colour ?? "var(--primary)" }}
            />
          </div>
          <span className="hbar__value">{d.value}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function Reports() {
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [actions, setActions] = useState<CaseAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([casesApi.list(), usersApi.list(), actionsApi.listAll()])
      .then(([c, u, a]) => { setCases(c); setUsers(u); setActions(a); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading reports…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;

  // ── Derived data ─────────────────────────────────────────────────────────────

  const openCases = cases.filter((c) => c.pipeline_status !== "closed");
  const closedCases = cases.filter((c) => c.pipeline_status === "closed");

  // Status distribution
  const statusData: BarDatum[] = CASE_STATUSES.map((s) => ({
    label: labelCaseStatus(s),
    value: cases.filter((c) => c.pipeline_status === s).length,
    colour: STATUS_COLOUR[s],
  }));

  // Finding distribution
  const findingData: BarDatum[] = FINDINGS.map((f) => ({
    label: labelFinding(f),
    value: cases.filter((c) => c.finding === f).length,
    colour: FINDING_COLOUR[f],
  }));

  // Age bands (open cases only)
  const ageBands = [
    { label: "0–7 days", min: 0, max: 7 },
    { label: "8–14 days", min: 8, max: 14 },
    { label: "15–30 days", min: 15, max: 30 },
    { label: "31–60 days", min: 31, max: 60 },
    { label: "61+ days", min: 61, max: Infinity },
  ];
  const ageBandData: BarDatum[] = ageBands.map(({ label, min, max }) => ({
    label,
    value: openCases.filter((c) => { const d = daysOpen(c); return d >= min && d <= max; }).length,
    colour: min >= 31 ? "#dc2626" : min >= 15 ? "#d97706" : "#2563eb",
  }));

  // Action type breakdown
  const actionTypes: Array<"notification" | "pause" | "release_withdraw"> = ["notification", "pause", "release_withdraw"];
  const actionData: BarDatum[] = actionTypes.map((t) => ({
    label: labelActionType(t),
    value: actions.filter((a) => a.type === t).length,
    colour: ACTION_COLOUR[t],
  }));

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

  // Analyst performance
  const analystRows = users.map((u) => {
    const mine = cases.filter((c) => c.assigned_user_id === u.id);
    const openMine = mine.filter((c) => c.pipeline_status !== "closed");
    const closedMine = mine.filter((c) => c.pipeline_status === "closed" && c.closed_at);
    return {
      name: u.name,
      role: u.role,
      open: openMine.length,
      closed: closedMine.length,
      isp: mine.filter((c) => c.finding === "ISP").length,
      avgDaysOpen: avg(openMine.map(daysOpen)),
      avgDaysToClose: avg(closedMine.map((c) => {
        const days = Math.floor((new Date(c.closed_at!).getTime() - new Date(c.created_at).getTime()) / 86400000);
        return days;
      })),
    };
  });

  // Open cases sorted by age
  const openByAge = [...openCases]
    .sort((a, b) => daysOpen(b) - daysOpen(a));

  // Recent actions with case reference
  const caseMap = Object.fromEntries(cases.map((c) => [c.id, c]));
  const recentActions = actions.slice(0, 20);

  const avgOpenDays = avg(openCases.map(daysOpen));
  const avgCloseDays = avg(closedCases.filter((c) => c.closed_at).map((c) => {
    return Math.floor((new Date(c.closed_at!).getTime() - new Date(c.created_at).getTime()) / 86400000);
  }));

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Reporting</h1>
          <p className="page__subtitle">
            Metrics across {cases.length} case{cases.length !== 1 ? "s" : ""}
            {" "}· {openCases.length} open · {closedCases.length} closed
          </p>
        </div>
      </div>

      {/* ── Section 1: Volume ─────────────────────────────────────────────────── */}
      <h2 className="report-section-title">Case Volume</h2>
      <div className="report-grid">
        <div className="card">
          <h3 className="card__title">Cases by Status</h3>
          <HBar data={statusData} emptyMsg="No cases" />
        </div>
        <div className="card">
          <h3 className="card__title">Cases by Finding</h3>
          <HBar data={findingData} emptyMsg="No cases" />
        </div>
      </div>

      {/* ── Section 2: Timeframes ─────────────────────────────────────────────── */}
      <h2 className="report-section-title">Timeframes</h2>
      <div className="report-grid">
        <div className="card">
          <h3 className="card__title">Open Cases — Age Distribution</h3>
          {openCases.length === 0
            ? <p className="muted report-empty">No open cases</p>
            : <HBar data={ageBandData} emptyMsg="No open cases" />
          }
        </div>
        <div className="card">
          <h3 className="card__title">Timeframe Summary</h3>
          <table className="table report-summary-table">
            <tbody>
              <tr>
                <td className="report-metric-label">Total cases</td>
                <td className="report-metric-value">{cases.length}</td>
              </tr>
              <tr>
                <td className="report-metric-label">Open cases</td>
                <td className="report-metric-value">{openCases.length}</td>
              </tr>
              <tr>
                <td className="report-metric-label">Closed cases</td>
                <td className="report-metric-value">{closedCases.length}</td>
              </tr>
              <tr>
                <td className="report-metric-label">Avg days open (active)</td>
                <td className="report-metric-value">
                  {avgOpenDays !== null ? `${avgOpenDays}d` : <span className="muted">—</span>}
                </td>
              </tr>
              <tr>
                <td className="report-metric-label">Avg days to close</td>
                <td className="report-metric-value">
                  {avgCloseDays !== null ? `${avgCloseDays}d` : <span className="muted">—</span>}
                </td>
              </tr>
              <tr>
                <td className="report-metric-label">Longest open case</td>
                <td className="report-metric-value">
                  {openCases.length > 0
                    ? `${Math.max(...openCases.map(daysOpen))}d`
                    : <span className="muted">—</span>}
                </td>
              </tr>
              <tr>
                <td className="report-metric-label">Cases open 30+ days</td>
                <td className={`report-metric-value ${openCases.filter(c => daysOpen(c) > 30).length > 0 ? "report-metric-value--warn" : ""}`}>
                  {openCases.filter((c) => daysOpen(c) > 30).length}
                </td>
              </tr>
              <tr>
                <td className="report-metric-label">ISP findings</td>
                <td className="report-metric-value report-metric-value--isp">
                  {cases.filter((c) => c.finding === "ISP").length}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 3: Open cases table ───────────────────────────────────────── */}
      <h2 className="report-section-title">Open Cases by Age</h2>
      <div className="card">
        {openByAge.length === 0 ? (
          <p className="muted">No open cases.</p>
        ) : (
          <div className="table-wrap" style={{ border: "none", boxShadow: "none" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Subject</th>
                  <th>Status</th>
                  <th>Analyst</th>
                  <th>Opened</th>
                  <th>Days Open</th>
                </tr>
              </thead>
              <tbody>
                {openByAge.map((c) => {
                  const d = daysOpen(c);
                  return (
                    <tr key={c.id}>
                      <td><span className="case-ref">{c.reference}</span></td>
                      <td>
                        <div className="subject-name">{c.subject_name}</div>
                        <div className="subject-title">{c.title}</div>
                      </td>
                      <td>
                        <span
                          className="action-badge"
                          style={{ background: STATUS_COLOUR[c.pipeline_status] + "22", color: STATUS_COLOUR[c.pipeline_status] }}
                        >
                          {labelCaseStatus(c.pipeline_status)}
                        </span>
                      </td>
                      <td>{c.assignee?.name ?? <span className="muted">Unassigned</span>}</td>
                      <td className="muted">{formatDate(c.created_at)}</td>
                      <td className={`center${d > 30 ? " days-overdue" : ""}`}>{d}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Section 4: Analyst workload ───────────────────────────────────────── */}
      <h2 className="report-section-title">Analyst Workload</h2>
      <div className="card">
        <div className="table-wrap" style={{ border: "none", boxShadow: "none" }}>
          <table className="table">
            <thead>
              <tr>
                <th>Analyst</th>
                <th>Role</th>
                <th className="center">Open</th>
                <th className="center">Closed</th>
                <th className="center">ISP Findings</th>
                <th className="center">Avg Days Open</th>
                <th className="center">Avg Days to Close</th>
              </tr>
            </thead>
            <tbody>
              {analystRows.map((r) => (
                <tr key={r.name}>
                  <td className="subject-name">{r.name}</td>
                  <td className="muted" style={{ fontSize: "0.8rem" }}>{r.role.replace("_", " ")}</td>
                  <td className="center">{r.open}</td>
                  <td className="center">{r.closed}</td>
                  <td className={`center${r.isp > 0 ? " report-metric-value--isp" : ""}`}>{r.isp}</td>
                  <td className="center">{r.avgDaysOpen !== null ? `${r.avgDaysOpen}d` : <span className="muted">—</span>}</td>
                  <td className="center">{r.avgDaysToClose !== null ? `${r.avgDaysToClose}d` : <span className="muted">—</span>}</td>
                </tr>
              ))}
              {/* Unassigned row */}
              {(() => {
                const unassigned = cases.filter((c) => !c.assigned_user_id);
                const openU = unassigned.filter((c) => c.pipeline_status !== "closed");
                const closedU = unassigned.filter((c) => c.pipeline_status === "closed" && c.closed_at);
                return (
                  <tr key="unassigned" style={{ borderTop: "2px solid var(--border)" }}>
                    <td className="muted">Unassigned</td>
                    <td />
                    <td className="center">{openU.length}</td>
                    <td className="center">{closedU.length}</td>
                    <td className="center">{unassigned.filter((c) => c.finding === "ISP").length}</td>
                    <td className="center muted">—</td>
                    <td className="center muted">—</td>
                  </tr>
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Section 5: Actions ────────────────────────────────────────────────── */}
      <h2 className="report-section-title">Actions</h2>
      <div className="report-grid">
        <div className="card">
          <h3 className="card__title">Action Type Breakdown</h3>
          <HBar data={actionData} emptyMsg="No actions recorded" />
          <table className="table report-summary-table" style={{ marginTop: "1.25rem" }}>
            <tbody>
              <tr>
                <td className="report-metric-label">Total actions</td>
                <td className="report-metric-value">{actions.length}</td>
              </tr>
              <tr>
                <td className="report-metric-label">Pause actions</td>
                <td className="report-metric-value">{actions.filter((a) => a.type === "pause").length}</td>
              </tr>
              <tr>
                <td className="report-metric-label">Release / Withdraw actions</td>
                <td className="report-metric-value">{actions.filter((a) => a.type === "release_withdraw").length}</td>
              </tr>
              <tr>
                <td className="report-metric-label">Cases with actions</td>
                <td className="report-metric-value">
                  {new Set(actions.filter((a) => a.type !== "notification").map((a) => a.case_id)).size}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="card">
          <h3 className="card__title">Recent Actions</h3>
          {recentActions.length === 0 ? (
            <p className="muted report-empty">No actions recorded.</p>
          ) : (
            <div className="table-wrap" style={{ border: "none", boxShadow: "none" }}>
              <table className="table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Case</th>
                    <th>Type</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {recentActions.map((a) => {
                    const c = caseMap[a.case_id];
                    return (
                      <tr key={a.id}>
                        <td className="muted" style={{ whiteSpace: "nowrap" }}>{formatDate(a.triggered_at)}</td>
                        <td>
                          <span className="case-ref">{c?.reference ?? `#${a.case_id}`}</span>
                          {c && <div className="subject-title">{c.subject_name}</div>}
                        </td>
                        <td>
                          <span
                            className="action-badge"
                            style={{ background: ACTION_COLOUR[a.type] + "22", color: ACTION_COLOUR[a.type] }}
                          >
                            {labelActionType(a.type)}
                          </span>
                        </td>
                        <td className="muted" style={{ fontSize: "0.8rem" }}>{a.note ?? "—"}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

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
    </div>
  );
}
