import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { casesApi, usersApi } from "../api";
import type { Case, User } from "../types";
import { CASE_STATUSES, labelCaseStatus } from "../types";
import FindingBadge from "../components/FindingBadge";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard() {
  const [cases, setCases] = useState<Case[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filterStatus, setFilterStatus] = useState("");
  const [filterUser, setFilterUser] = useState("");

  const load = () => {
    setLoading(true);
    Promise.all([
      casesApi.list({
        status: filterStatus || undefined,
        assigned_user_id: filterUser ? Number(filterUser) : undefined,
      }),
      usersApi.list(),
    ])
      .then(([c, u]) => { setCases(c); setUsers(u); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus, filterUser]);

  const today = Date.now();

  const daysOpen = (c: Case) =>
    Math.floor((today - new Date(c.created_at).getTime()) / 86400000);

  const daysToClose = (c: Case) =>
    c.closed_at
      ? Math.floor((new Date(c.closed_at).getTime() - new Date(c.created_at).getTime()) / 86400000)
      : null;

  const closedWithDate = cases.filter((c) => c.pipeline_status === "closed" && c.closed_at);
  const avgDaysToClose = closedWithDate.length > 0
    ? Math.round(closedWithDate.reduce((sum, c) => sum + (daysToClose(c) ?? 0), 0) / closedWithDate.length)
    : null;

  const openCases = cases.filter((c) => c.pipeline_status !== "closed");
  const avgDaysOpen = openCases.length > 0
    ? Math.round(openCases.reduce((sum, c) => sum + daysOpen(c), 0) / openCases.length)
    : null;

  const stats = {
    total: cases.length,
    open: openCases.length,
    closed: cases.filter((c) => c.pipeline_status === "closed").length,
    isp: cases.filter((c) => c.finding === "ISP").length,
    unallocated: cases.filter((c) => !c.assigned_user_id).length,
  };

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h1 className="page__title">Cases</h1>
          <p className="page__subtitle">Investigation case management</p>
        </div>
        <Link to="/cases/new" className="btn btn--primary">+ New Case</Link>
      </div>

      {/* Stats row 1 — case counts */}
      <div className="stats">
        <div className="stat-card">
          <span className="stat-card__value">{stats.total}</span>
          <span className="stat-card__label">Total Cases</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{stats.open}</span>
          <span className="stat-card__label">Open</span>
        </div>
        <div className="stat-card stat-card--green">
          <span className="stat-card__value">{stats.closed}</span>
          <span className="stat-card__label">Closed</span>
        </div>
        <div className="stat-card stat-card--red">
          <span className="stat-card__value">{stats.isp}</span>
          <span className="stat-card__label">ISP Finding</span>
        </div>
        <div className="stat-card stat-card--amber">
          <span className="stat-card__value">{stats.unallocated}</span>
          <span className="stat-card__label">Unallocated</span>
        </div>
      </div>

      {/* Stats row 2 — timeframes */}
      <div className="stats stats--timeframes">
        <div className="stat-card">
          <span className="stat-card__value">
            {avgDaysOpen !== null ? avgDaysOpen : <span className="muted">—</span>}
          </span>
          <span className="stat-card__label">Avg Days Open (active)</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">
            {avgDaysToClose !== null ? avgDaysToClose : <span className="muted">—</span>}
          </span>
          <span className="stat-card__label">Avg Days to Close</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">
            {openCases.length > 0
              ? Math.max(...openCases.map(daysOpen))
              : <span className="muted">—</span>}
          </span>
          <span className="stat-card__label">Longest Open (days)</span>
        </div>
      </div>

      {/* Filters */}
      <div className="filters">
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="select">
          <option value="">All Statuses</option>
          {CASE_STATUSES.map((s) => (
            <option key={s} value={s}>{labelCaseStatus(s)}</option>
          ))}
        </select>
        <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)} className="select">
          <option value="">All Analysts</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
        {(filterStatus || filterUser) && (
          <button
            className="btn btn--ghost"
            onClick={() => { setFilterStatus(""); setFilterUser(""); }}
          >
            Clear filters
          </button>
        )}
      </div>

      {error && <div className="alert alert--error">{error}</div>}

      {loading ? (
        <div className="loading">Loading cases…</div>
      ) : cases.length === 0 ? (
        <div className="empty">No cases found. <Link to="/cases/new">Create one</Link>.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Subject</th>
                <th>Status</th>
                <th>Finding</th>
                <th>Analyst</th>
                <th>Transactions</th>
                <th>Hist. Tranches</th>
                <th>Days Open</th>
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => {
                const d = c.pipeline_status === "closed" ? daysToClose(c) : daysOpen(c);
                return (
                  <tr key={c.id}>
                    <td>
                      <Link to={`/cases/${c.id}`} className="link">
                        {c.reference}
                      </Link>
                    </td>
                    <td>
                      <div className="subject-name">{c.subject_name}</div>
                      <div className="subject-title">{c.title}</div>
                    </td>
                    <td><StatusBadge status={c.pipeline_status} size="sm" /></td>
                    <td><FindingBadge finding={c.finding} size="sm" /></td>
                    <td>{c.assignee?.name ?? <span className="muted">Unassigned</span>}</td>
                    <td>
                      {(() => {
                        const reviewed = (c.transactions ?? []).filter((t) => t.pipeline_status === "reviewed").length;
                        const total = c.transaction_count ?? (c.transactions?.length ?? 0);
                        return (
                          <div className="txn-progress">
                            <span className="txn-progress__label">{reviewed}/{total}</span>
                            {total > 0 && (
                              <div className="txn-progress__track">
                                <div className="txn-progress__fill" style={{ width: `${(reviewed / total) * 100}%` }} />
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </td>
                    <td className="center">
                      {(c.tranches ?? []).filter((t) => t.type === "historical").length || <span className="muted">—</span>}
                    </td>
                    <td className="center">
                      <span className={d !== null && d > 30 ? "days-overdue" : ""}>
                        {d !== null ? d : "—"}
                      </span>
                      {c.pipeline_status === "closed" && (
                        <span className="muted" style={{ fontSize: "0.7rem", display: "block" }}>to close</span>
                      )}
                    </td>
                    <td className="muted">{formatDate(c.updated_at)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return iso.slice(0, 10);
}
