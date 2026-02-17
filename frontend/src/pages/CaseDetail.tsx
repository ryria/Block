import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { casesApi, transactionsApi, usersApi } from "../api";
import type { Case, Transaction, User, CaseStatus, TransactionStatus, Finding } from "../types";
import {
  CASE_STATUSES, TRANSACTION_STATUSES, FINDINGS,
  labelCaseStatus, labelTransactionStatus, labelFinding,
} from "../types";
import FindingBadge from "../components/FindingBadge";
import StatusBadge from "../components/StatusBadge";
import PipelineStepper from "../components/PipelineStepper";
import Modal from "../components/Modal";

export default function CaseDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showEditCase, setShowEditCase] = useState(false);
  const [showAddTxn, setShowAddTxn] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([casesApi.get(Number(id)), usersApi.list()])
      .then(([c, u]) => { setCaseData(c); setUsers(u); })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleDeleteCase = async () => {
    if (!caseData) return;
    if (!confirm(`Delete case ${caseData.reference}? This cannot be undone.`)) return;
    await casesApi.delete(caseData.id);
    navigate("/");
  };

  if (loading) return <div className="loading">Loading case…</div>;
  if (error) return <div className="alert alert--error">{error}</div>;
  if (!caseData) return null;

  return (
    <div className="page">
      {/* Breadcrumb */}
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb__link">Cases</Link>
        <span className="breadcrumb__sep">/</span>
        <span>{caseData.reference}</span>
      </div>

      {/* Header */}
      <div className="page__header">
        <div>
          <div className="case-ref-row">
            <span className="case-ref">{caseData.reference}</span>
            <span className="tag">Staff</span>
            <StatusBadge status={caseData.pipeline_status} />
            <FindingBadge finding={caseData.finding} />
          </div>
          <h1 className="page__title">{caseData.title}</h1>
          <p className="page__subtitle">Staff member: <strong>{caseData.subject_name}</strong></p>
        </div>
        <div className="btn-group">
          <button className="btn btn--secondary" onClick={() => setShowEditCase(true)}>Edit Case</button>
          <button className="btn btn--danger" onClick={handleDeleteCase}>Delete</button>
        </div>
      </div>

      {/* Pipeline */}
      <div className="card">
        <h2 className="card__title">Case Pipeline</h2>
        <PipelineStepper type="case" current={caseData.pipeline_status} />
      </div>

      {/* Details grid */}
      <div className="detail-grid">
        <div className="card">
          <h2 className="card__title">Case Details</h2>
          <dl className="dl">
            <dt>Staff Member</dt>
            <dd>{caseData.subject_name}</dd>
            <dt>Description</dt>
            <dd>{caseData.description ?? <span className="muted">—</span>}</dd>
            <dt>Analyst</dt>
            <dd>{caseData.assignee?.name ?? <span className="muted">Unassigned</span>}</dd>
            <dt>Finding</dt>
            <dd><FindingBadge finding={caseData.finding} /></dd>
            <dt>Created</dt>
            <dd>{formatDate(caseData.created_at)}</dd>
            <dt>Last Updated</dt>
            <dd>{formatDate(caseData.updated_at)}</dd>
          </dl>
        </div>

        {/* Finding info */}
        <div className="card">
          <h2 className="card__title">Finding Logic</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
            The case finding is automatically set to the highest-risk finding across all transactions.
          </p>
          <div className="finding-scale">
            {(["unsubstantiated", "non_compliance", "ISP"] as Finding[]).map((f) => (
              <div key={f} className={`finding-scale__item ${caseData.finding === f ? "active" : ""}`}>
                <FindingBadge finding={f} />
                {caseData.finding === f && <span className="finding-scale__arrow">← case finding</span>}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Transactions */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">
            Transactions
            <span className="count-badge">{caseData.transactions.length}</span>
          </h2>
          <button className="btn btn--primary btn--sm" onClick={() => setShowAddTxn(true)}>
            + Add Transaction
          </button>
        </div>

        {caseData.transactions.length === 0 ? (
          <p className="muted">No transactions yet. Add one to begin reviewing.</p>
        ) : (
          <div className="txn-list">
            {caseData.transactions.map((txn) => (
              <TransactionRow
                key={txn.id}
                txn={txn}
                onEdit={() => setEditingTxn(txn)}
                onDelete={async () => {
                  if (!confirm(`Delete transaction ${txn.reference}?`)) return;
                  await transactionsApi.delete(txn.id);
                  load();
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      {showEditCase && (
        <EditCaseModal
          caseData={caseData}
          users={users}
          onClose={() => setShowEditCase(false)}
          onSaved={() => { setShowEditCase(false); load(); }}
        />
      )}
      {showAddTxn && (
        <AddTransactionModal
          caseId={caseData.id}
          onClose={() => setShowAddTxn(false)}
          onSaved={() => { setShowAddTxn(false); load(); }}
        />
      )}
      {editingTxn && (
        <EditTransactionModal
          txn={editingTxn}
          onClose={() => setEditingTxn(null)}
          onSaved={() => { setEditingTxn(null); load(); }}
        />
      )}
    </div>
  );
}

// ── Transaction Row ────────────────────────────────────────────────────────────

function TransactionRow({
  txn, onEdit, onDelete,
}: { txn: Transaction; onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="txn-card">
      <div className="txn-card__top">
        <div className="txn-card__ref">
          <strong>{txn.reference}</strong>
          {txn.transaction_date && <span className="muted"> — {txn.transaction_date}</span>}
          {txn.amount && <span className="txn-amount">{txn.amount}</span>}
        </div>
        <div className="txn-card__badges">
          <StatusBadge status={txn.pipeline_status} size="sm" />
          <FindingBadge finding={txn.finding} size="sm" />
        </div>
      </div>
      {txn.description && <p className="txn-card__desc">{txn.description}</p>}

      <div className="txn-pipeline">
        <PipelineStepper type="transaction" current={txn.pipeline_status} />
      </div>

      {txn.notes && (
        <div className="txn-card__notes">
          <strong>Notes:</strong> {txn.notes}
        </div>
      )}
      <div className="txn-card__actions">
        <button className="btn btn--ghost btn--sm" onClick={onEdit}>Edit</button>
        <button className="btn btn--danger btn--sm" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

// ── Edit Case Modal ────────────────────────────────────────────────────────────

function EditCaseModal({ caseData, users, onClose, onSaved }: {
  caseData: Case; users: User[]; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    title: caseData.title,
    description: caseData.description ?? "",
    subject_name: caseData.subject_name,
    pipeline_status: caseData.pipeline_status as CaseStatus,
    assigned_user_id: caseData.assigned_user_id ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await casesApi.update(caseData.id, {
        ...form,
        assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : null,
      });
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Edit Case" onClose={onClose}>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="form-grid">
        <label className="form-label">
          Title
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </label>
        <label className="form-label">
          Staff Member
          <input className="input" value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} />
        </label>
        <label className="form-label">
          Pipeline Status
          <select className="select" value={form.pipeline_status} onChange={(e) => setForm({ ...form, pipeline_status: e.target.value as CaseStatus })}>
            {CASE_STATUSES.map((s) => <option key={s} value={s}>{labelCaseStatus(s)}</option>)}
          </select>
        </label>
        <label className="form-label">
          Assigned Analyst
          <select className="select" value={form.assigned_user_id} onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}>
            <option value="">Unassigned</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
          </select>
        </label>
        <label className="form-label form-label--full">
          Description
          <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} />
        </label>
      </div>
      <div className="modal__footer">
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}

// ── Add Transaction Modal ──────────────────────────────────────────────────────

function AddTransactionModal({ caseId, onClose, onSaved }: {
  caseId: number; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    reference: "", description: "", amount: "", transaction_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!form.reference.trim()) { setError("Reference is required"); return; }
    setSaving(true);
    setError(null);
    try {
      await transactionsApi.create({ case_id: caseId, ...form });
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Transaction" onClose={onClose}>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="form-grid">
        <label className="form-label">
          Reference *
          <input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} placeholder="TXN-00001" />
        </label>
        <label className="form-label">
          Amount
          <input className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="£0.00" />
        </label>
        <label className="form-label">
          Transaction Date
          <input className="input" type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
        </label>
        <label className="form-label form-label--full">
          Description
          <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        </label>
      </div>
      <div className="modal__footer">
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? "Adding…" : "Add Transaction"}
        </button>
      </div>
    </Modal>
  );
}

// ── Edit Transaction Modal ─────────────────────────────────────────────────────

function EditTransactionModal({ txn, onClose, onSaved }: {
  txn: Transaction; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    reference: txn.reference,
    description: txn.description ?? "",
    amount: txn.amount ?? "",
    transaction_date: txn.transaction_date ?? "",
    pipeline_status: txn.pipeline_status as TransactionStatus,
    finding: txn.finding as Finding,
    notes: txn.notes ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await transactionsApi.update(txn.id, form);
      onSaved();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Edit Transaction — ${txn.reference}`} onClose={onClose}>
      {error && <div className="alert alert--error">{error}</div>}
      <div className="form-grid">
        <label className="form-label">
          Reference
          <input className="input" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })} />
        </label>
        <label className="form-label">
          Amount
          <input className="input" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
        </label>
        <label className="form-label">
          Transaction Date
          <input className="input" type="date" value={form.transaction_date} onChange={(e) => setForm({ ...form, transaction_date: e.target.value })} />
        </label>
        <label className="form-label">
          Pipeline Status
          <select className="select" value={form.pipeline_status} onChange={(e) => setForm({ ...form, pipeline_status: e.target.value as TransactionStatus })}>
            {TRANSACTION_STATUSES.map((s) => <option key={s} value={s}>{labelTransactionStatus(s)}</option>)}
          </select>
        </label>
        <label className="form-label">
          Finding
          <select className="select" value={form.finding} onChange={(e) => setForm({ ...form, finding: e.target.value as Finding })}>
            {FINDINGS.map((f) => <option key={f} value={f}>{labelFinding(f)}</option>)}
          </select>
        </label>
        <label className="form-label form-label--full">
          Description
          <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} />
        </label>
        <label className="form-label form-label--full">
          Notes
          <textarea className="textarea" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} placeholder="Review notes, evidence, comments…" />
        </label>
      </div>
      <div className="modal__footer">
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn--primary" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
  });
}
