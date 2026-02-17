import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { casesApi, transactionsApi, usersApi, actionsApi } from "../api";
import type { Case, Transaction, User, CaseStatus, TransactionStatus, Finding, CaseAction, ActionType } from "../types";
import {
  CASE_STATUSES, TRANSACTION_STATUSES, FINDINGS,
  labelCaseStatus, labelTransactionStatus, labelFinding, labelActionType,
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
  const [caseActions, setCaseActions] = useState<CaseAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showAddTxn, setShowAddTxn] = useState(false);
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null);
  const [triggerAction, setTriggerAction] = useState<ActionType | null>(null);

  // Inline case edit state
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    subject_name: "",
    pipeline_status: "new" as CaseStatus,
    assigned_user_id: "" as string | number,
  });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const load = () => {
    if (!id) return;
    setLoading(true);
    Promise.all([casesApi.get(Number(id)), usersApi.list(), actionsApi.list(Number(id))])
      .then(([c, u, a]) => {
        setCaseData(c);
        setUsers(u);
        setCaseActions(a);
        setEditForm({
          title: c.title,
          description: c.description ?? "",
          subject_name: c.subject_name,
          pipeline_status: c.pipeline_status,
          assigned_user_id: c.assigned_user_id ?? "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const isDirty = caseData && (
    editForm.title !== caseData.title ||
    editForm.description !== (caseData.description ?? "") ||
    editForm.subject_name !== caseData.subject_name ||
    editForm.pipeline_status !== caseData.pipeline_status ||
    String(editForm.assigned_user_id) !== String(caseData.assigned_user_id ?? "")
  );

  const handleSaveCase = async () => {
    if (!caseData) return;
    setSaving(true);
    setSaveError(null);
    try {
      await casesApi.update(caseData.id, {
        ...editForm,
        assigned_user_id: editForm.assigned_user_id ? Number(editForm.assigned_user_id) : null,
      });
      load();
    } catch (e: unknown) {
      setSaveError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCase = async () => {
    if (!caseData) return;
    if (!confirm(`Delete case ${caseData.reference}? This cannot be undone.`)) return;
    await casesApi.delete(caseData.id);
    navigate("/");
  };

  const handleTriggerAction = async (type: ActionType, note?: string) => {
    if (!caseData) return;
    await actionsApi.create({ case_id: caseData.id, type, note });
    const updated = await actionsApi.list(caseData.id);
    setCaseActions(updated);
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
        <button className="btn btn--danger" onClick={handleDeleteCase}>Delete</button>
      </div>

      {/* Pipeline */}
      <div className="card">
        <h2 className="card__title">Case Pipeline</h2>
        <PipelineStepper type="case" current={caseData.pipeline_status} />
      </div>

      {/* Details grid */}
      <div className="detail-grid">
        {/* Inline editable case details */}
        <div className="card">
          <h2 className="card__title">Case Details</h2>
          {saveError && <div className="alert alert--error" style={{ marginBottom: "1rem" }}>{saveError}</div>}
          <div className="inline-edit-form">
            <label className="form-label">
              Title
              <input
                className="input"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
              />
            </label>
            <label className="form-label">
              Staff Member
              <input
                className="input"
                value={editForm.subject_name}
                onChange={(e) => setEditForm({ ...editForm, subject_name: e.target.value })}
              />
            </label>
            <label className="form-label">
              Pipeline Status
              <select
                className="select"
                value={editForm.pipeline_status}
                onChange={(e) => setEditForm({ ...editForm, pipeline_status: e.target.value as CaseStatus })}
              >
                {CASE_STATUSES.map((s) => (
                  <option key={s} value={s}>{labelCaseStatus(s)}</option>
                ))}
              </select>
            </label>
            <label className="form-label">
              Assigned Analyst
              <select
                className="select"
                value={editForm.assigned_user_id}
                onChange={(e) => setEditForm({ ...editForm, assigned_user_id: e.target.value })}
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>{u.name}</option>
                ))}
              </select>
            </label>
            <label className="form-label inline-edit-full">
              Description
              <textarea
                className="textarea"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                rows={3}
              />
            </label>
          </div>

          <dl className="dl" style={{ marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" }}>
            <dt>Finding</dt>
            <dd><FindingBadge finding={caseData.finding} /></dd>
            <dt>Opened</dt>
            <dd>{formatDate(caseData.created_at)}</dd>
            <dt>Last Updated</dt>
            <dd>{formatDate(caseData.updated_at)}</dd>
            {caseData.closed_at && (
              <>
                <dt>Closed</dt>
                <dd>{formatDate(caseData.closed_at)}</dd>
              </>
            )}
          </dl>

          <div className="inline-edit-actions">
            <button
              className="btn btn--primary btn--sm"
              onClick={handleSaveCase}
              disabled={!isDirty || saving}
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
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

      {/* Actions */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">
            Actions
            <span className="count-badge">{caseActions.length}</span>
          </h2>
          <div className="btn-group">
            <button className="btn btn--secondary btn--sm" onClick={() => setTriggerAction("pause")}>
              Pause
            </button>
            <button className="btn btn--secondary btn--sm" onClick={() => setTriggerAction("withdraw")}>
              Withdraw
            </button>
          </div>
        </div>

        {caseActions.length === 0 ? (
          <p className="muted">No actions recorded.</p>
        ) : (
          <div className="action-list">
            {caseActions.map((a) => (
              <ActionRow key={a.id} action={a} />
            ))}
          </div>
        )}
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
      {triggerAction && (
        <TriggerActionModal
          type={triggerAction}
          onClose={() => setTriggerAction(null)}
          onConfirm={async (note) => {
            await handleTriggerAction(triggerAction, note);
            setTriggerAction(null);
          }}
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

// ── Action Row ─────────────────────────────────────────────────────────────────

function ActionRow({ action }: { action: CaseAction }) {
  const typeClass = action.type === "notification"
    ? "action-badge--info"
    : action.type === "pause"
    ? "action-badge--amber"
    : "action-badge--red";

  return (
    <div className="action-row">
      <div className="action-row__left">
        <span className={`action-badge ${typeClass}`}>{labelActionType(action.type)}</span>
        <span className="action-row__sent">Sent to: {action.sent_to.join(", ")}</span>
      </div>
      <div className="action-row__right">
        {action.note && <span className="action-row__note">{action.note}</span>}
        <span className="action-row__date muted">{formatDate(action.triggered_at)}</span>
      </div>
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

// ── Trigger Action Modal ───────────────────────────────────────────────────────

function TriggerActionModal({ type, onClose, onConfirm }: {
  type: ActionType; onClose: () => void; onConfirm: (note?: string) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(note.trim() || undefined);
    setSaving(false);
  };

  return (
    <Modal title={`${labelActionType(type)} — Send to B&C and ER`} onClose={onClose}>
      <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
        This action will be recorded and sent to <strong>B&C</strong> and <strong>ER</strong>.
      </p>
      <label className="form-label">
        Note <span className="muted">(optional)</span>
        <textarea
          className="textarea"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={3}
          placeholder="Reason or additional context…"
        />
      </label>
      <div className="modal__footer">
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn--primary" onClick={handleConfirm} disabled={saving}>
          {saving ? "Sending…" : `Confirm ${labelActionType(type)}`}
        </button>
      </div>
    </Modal>
  );
}

// ── Add Transaction Modal ──────────────────────────────────────────────────────

function AddTransactionModal({ caseId, onClose, onSaved }: {
  caseId: number; onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState({ reference: "", description: "", transaction_date: "" });
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
  return iso.slice(0, 10);
}
