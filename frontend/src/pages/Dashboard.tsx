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

  const stats = {
    total: cases.length,
    open: cases.filter((c) => c.pipeline_status !== "closed").length,
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

      {/* Stats */}
      <div className="stats">
        <div className="stat-card">
          <span className="stat-card__value">{stats.total}</span>
          <span className="stat-card__label">Total Cases</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__value">{stats.open}</span>
          <span className="stat-card__label">Open</span>
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
                <th>Updated</th>
              </tr>
            </thead>
            <tbody>
              {cases.map((c) => (
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
                  <td className="center">{c.transaction_count ?? c.transactions?.length ?? 0}</td>
                  <td className="muted">{formatDate(c.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
}
