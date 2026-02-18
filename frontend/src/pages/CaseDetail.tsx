import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { casesApi, transactionsApi, usersApi, actionsApi, bulkApi, tranchesApi } from "../api";
import type { FauxTxnDetail } from "../api";
import type { Case, Transaction, User, CaseStatus, TransactionStatus, Finding, CaseAction, BehaviourFlag } from "../types";
import {
  CASE_STATUSES, TRANSACTION_STATUSES, FINDINGS, BEHAVIOUR_FLAGS,
  labelCaseStatus, labelTransactionStatus, labelFinding, labelActionType, labelRecipient,
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
  const [triggerAction, setTriggerAction] = useState<{ type: "pause" | "resume"; recipient: "B&C" | "ER" } | null>(null);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

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

  const handleTriggerAction = async (type: "pause" | "resume", recipient: "B&C" | "ER", note?: string, transactionIds?: number[]) => {
    if (!caseData) return;
    await actionsApi.create({ case_id: caseData.id, type, recipient, transaction_ids: transactionIds, note });
    const updated = await actionsApi.list(caseData.id);
    setCaseActions(updated);
    load();
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

      {/* Case-level behaviours */}
      {caseData.behaviours.length > 0 && (
        <div className="card">
          <h2 className="card__title">Behaviours Identified</h2>
          <p className="muted" style={{ fontSize: "0.85rem", marginBottom: "1rem" }}>
            Aggregated from all transactions in this case.
          </p>
          <div className="txn-card__behaviours">
            {caseData.behaviours.map((b) => {
              const found = BEHAVIOUR_FLAGS.find((f) => f.key === b);
              return <span key={b} className="behaviour-tag behaviour-tag--lg">{found?.label ?? b}</span>;
            })}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="card">
        <div className="card__header">
          <h2 className="card__title">
            Actions
            <span className="count-badge">{caseActions.length}</span>
          </h2>
          <div className="btn-group">
            <button className="btn btn--secondary btn--sm" onClick={() => setTriggerAction({ type: "pause", recipient: "B&C" })}>Pause B&C</button>
            <button className="btn btn--secondary btn--sm" onClick={() => setTriggerAction({ type: "pause", recipient: "ER" })}>Pause ER</button>
            <button className="btn btn--secondary btn--sm" onClick={() => setTriggerAction({ type: "resume", recipient: "B&C" })}>Resume B&C</button>
            <button className="btn btn--secondary btn--sm" onClick={() => setTriggerAction({ type: "resume", recipient: "ER" })}>Resume ER</button>
          </div>
        </div>

        {caseActions.length === 0 ? (
          <p className="muted">No actions recorded.</p>
        ) : (
          <div className="action-list">
            {caseActions.map((a) => (
              <ActionRow key={a.id} action={a} caseTransactions={caseData.transactions} />
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
          <button className="btn btn--primary btn--sm" onClick={() => setShowBulkUpload(true)}>
            + Bulk Upload
          </button>
        </div>

        {caseData.transactions.length === 0 ? (
          <p className="muted">No transactions yet.</p>
        ) : (
          <div className="tranche-groups">
            {[...caseData.tranches]
              .sort((a, b) => {
                if (a.type === "catalyst") return -1;
                if (b.type === "catalyst") return 1;
                return a.number - b.number;
              })
              .map((tranche) => {
                const trancheTxns = caseData.transactions.filter(
                  (t) => t.cohort === tranche.type && t.tranche_number === tranche.number
                );
                const trancheLabel =
                  tranche.type === "catalyst"
                    ? "Catalyst Tranche"
                    : `Historical Tranche #${tranche.number}${tranche.date_range ? ` — ${tranche.date_range}` : ""}`;
                return (
                  <div key={tranche.id} className="tranche-group">
                    <div className="tranche-group__header">
                      <span className={`tranche-type-badge ${tranche.type === "catalyst" ? "tranche-type-badge--catalyst" : "tranche-type-badge--historical"}`}>
                        {tranche.type === "catalyst" ? "Catalyst" : "Historical"}
                      </span>
                      <span className="tranche-group__label">{trancheLabel}</span>
                      <span className="muted" style={{ fontSize: "0.8rem" }}>
                        {trancheTxns.length} transaction{trancheTxns.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    <div className="txn-list">
                      {trancheTxns.map((txn) => (
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
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Modals */}
      {triggerAction && (
        <TriggerActionModal
          type={triggerAction.type}
          recipient={triggerAction.recipient}
          transactions={caseData.transactions}
          onClose={() => setTriggerAction(null)}
          onConfirm={async (note, transactionIds) => {
            await handleTriggerAction(triggerAction.type, triggerAction.recipient, note, transactionIds);
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
      {showBulkUpload && (
        <BulkUploadModal
          caseId={caseData.id}
          existingHistoricalCount={caseData.tranches.filter((t) => t.type === "historical").length}
          onClose={() => setShowBulkUpload(false)}
          onSaved={() => { setShowBulkUpload(false); load(); }}
        />
      )}
    </div>
  );
}

// ── Action Row ─────────────────────────────────────────────────────────────────

function ActionRow({ action, caseTransactions }: { action: CaseAction; caseTransactions: Transaction[] }) {
  const typeClass =
    action.type === "notification" ? "action-badge--info" :
    action.type === "pause" ? "action-badge--amber" : "action-badge--green";
  const recipientClass =
    action.recipient === "ER" ? "recipient-badge--er" :
    action.recipient === "B&C" ? "recipient-badge--bc" : "recipient-badge--all";
  const linkedTxns = caseTransactions.filter((t) => action.transaction_ids.includes(t.id));

  return (
    <div className="action-row">
      <div className="action-row__left">
        <span className={`action-badge ${typeClass}`}>{labelActionType(action.type)}</span>
        <span className={`recipient-badge ${recipientClass}`}>→ {labelRecipient(action.recipient)}</span>
        {action.tranche_ref && <span className="tranche-tag">{action.tranche_ref}</span>}
      </div>
      <div className="action-row__middle">
        {linkedTxns.length > 0 && (
          <span className="action-txn-list muted" style={{ fontSize: "0.8rem" }}>
            {linkedTxns.length > 3
              ? `${linkedTxns.slice(0, 3).map((t) => t.reference).join(", ")} +${linkedTxns.length - 3} more`
              : linkedTxns.map((t) => t.reference).join(", ")}
          </span>
        )}
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
      {txn.behaviours.length > 0 && (
        <div className="txn-card__behaviours">
          {txn.behaviours.map((b) => {
            const found = BEHAVIOUR_FLAGS.find((f) => f.key === b);
            return <span key={b} className="behaviour-tag">{found?.label ?? b}</span>;
          })}
        </div>
      )}
      {txn.notes && (
        <div className="txn-card__notes"><strong>Notes:</strong> {txn.notes}</div>
      )}
      <div className="txn-card__actions">
        <button className="btn btn--ghost btn--sm" onClick={onEdit}>Edit</button>
        <button className="btn btn--danger btn--sm" onClick={onDelete}>Delete</button>
      </div>
    </div>
  );
}

// ── Trigger Action Modal ───────────────────────────────────────────────────────

function TriggerActionModal({
  type, recipient, transactions, onClose, onConfirm,
}: {
  type: "pause" | "resume";
  recipient: "B&C" | "ER";
  transactions: Transaction[];
  onClose: () => void;
  onConfirm: (note?: string, transactionIds?: number[]) => Promise<void>;
}) {
  const [note, setNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleTxn = (id: number) =>
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const handleConfirm = async () => {
    setSaving(true);
    await onConfirm(note.trim() || undefined, selectedIds.length ? selectedIds : undefined);
    setSaving(false);
  };

  const title = `${type === "pause" ? "Pause" : "Resume"} — ${recipient}`;

  return (
    <Modal title={title} onClose={onClose}>
      <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
        This action will be sent to <strong>{recipient}</strong>.
      </p>
      {transactions.length > 0 && (
        <div style={{ marginBottom: "1rem" }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 600, marginBottom: "0.5rem" }}>
            Associated Transactions <span className="muted">(optional)</span>
          </p>
          <div className="txn-checkbox-list">
            {transactions.map((t) => (
              <label key={t.id} className="txn-checkbox">
                <input type="checkbox" checked={selectedIds.includes(t.id)} onChange={() => toggleTxn(t.id)} />
                <span>{t.reference}</span>
                {t.transaction_date && <span className="muted" style={{ fontSize: "0.8rem" }}> — {t.transaction_date}</span>}
              </label>
            ))}
          </div>
        </div>
      )}
      <label className="form-label">
        Note <span className="muted">(optional)</span>
        <textarea className="textarea" value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Reason or additional context…" />
      </label>
      <div className="modal__footer">
        <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
        <button className="btn btn--primary" onClick={handleConfirm} disabled={saving}>
          {saving ? "Sending…" : `Confirm ${type === "pause" ? "Pause" : "Resume"}`}
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
    behaviours: [...txn.behaviours] as BehaviourFlag[],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleBehaviour = (flag: BehaviourFlag) =>
    setForm((prev) => ({
      ...prev,
      behaviours: prev.behaviours.includes(flag)
        ? prev.behaviours.filter((b) => b !== flag)
        : [...prev.behaviours, flag],
    }));

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
        <div className="form-label form-label--full">
          <span style={{ display: "block", marginBottom: "0.5rem", fontWeight: 600, fontSize: "0.875rem" }}>
            Behaviours Identified
          </span>
          <div className="behaviour-checkbox-grid">
            {BEHAVIOUR_FLAGS.map(({ key, label }) => (
              <label key={key} className="txn-checkbox">
                <input type="checkbox" checked={form.behaviours.includes(key)} onChange={() => toggleBehaviour(key)} />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </div>
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

// ── Bulk Upload Modal ─────────────────────────────────────────────────────────

function BulkUploadModal({ caseId, existingHistoricalCount, onClose, onSaved }: {
  caseId: number;
  existingHistoricalCount: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [rawIds, setRawIds] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookedUp, setLookedUp] = useState<FauxTxnDetail[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("");
  const [sendPause, setSendPause] = useState(true);
  const [saving, setSaving] = useState(false);

  const nextTrancheNumber = existingHistoricalCount + 1;
  const parseIds = () => rawIds.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  const handleFetch = async () => {
    const ids = parseIds();
    if (!ids.length) { setLookupError("Paste at least one transaction ID"); return; }
    setLookupLoading(true);
    setLookupError(null);
    try {
      const results = await bulkApi.lookup(ids);
      setLookedUp(results);
      setStep(2);
    } catch {
      setLookupError("Lookup failed — please try again");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleSubmit = async () => {
    setSaving(true);
    const trancheRef = `Historical Tranche #${nextTrancheNumber}`;
    try {
      await tranchesApi.create({ case_id: caseId, type: "historical", date_range: dateRange.trim() || undefined });
      await bulkApi.bulkCreate({
        case_id: caseId,
        transactions: lookedUp,
        cohort: "historical",
        tranche_number: nextTrancheNumber,
        tranche_ref: trancheRef,
        send_pause: sendPause,
      });
      onSaved();
    } catch {
      setSaving(false);
    }
  };

  return (
    <Modal title="Bulk Upload — Historical Tranche" onClose={onClose}>
      {step === 1 && (
        <>
          <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
            Paste transaction IDs to add as <strong>Historical Tranche #{nextTrancheNumber}</strong>.
          </p>
          {lookupError && <div className="alert alert--error" style={{ marginBottom: "1rem" }}>{lookupError}</div>}
          <label className="form-label">
            Transaction IDs <span className="muted">(one per line or comma-separated)</span>
            <textarea
              className="textarea"
              value={rawIds}
              onChange={(e) => setRawIds(e.target.value)}
              rows={6}
              placeholder={"TXN-00001\nTXN-00002\n..."}
            />
          </label>
          {rawIds.trim() && (
            <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>
              {parseIds().length} ID{parseIds().length !== 1 ? "s" : ""} detected
            </p>
          )}
          <div className="modal__footer">
            <button className="btn btn--ghost" onClick={onClose}>Cancel</button>
            <button className="btn btn--primary" onClick={handleFetch} disabled={lookupLoading || !rawIds.trim()}>
              {lookupLoading ? "Fetching…" : "Fetch Details"}
            </button>
          </div>
        </>
      )}

      {step === 2 && (
        <>
          <p className="muted" style={{ marginBottom: "0.75rem", fontSize: "0.875rem" }}>
            {lookedUp.length} transaction{lookedUp.length !== 1 ? "s" : ""} retrieved. Configure tranche below.
          </p>
          <div className="table-wrap" style={{ marginBottom: "1rem", maxHeight: "200px", overflowY: "auto" }}>
            <table className="table">
              <thead><tr><th>Reference</th><th>Date</th><th>Description</th><th>Amount</th></tr></thead>
              <tbody>
                {lookedUp.map((t) => (
                  <tr key={t.input_id}>
                    <td><strong>{t.reference}</strong></td>
                    <td className="muted">{t.date}</td>
                    <td>{t.description}</td>
                    <td>{t.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="form-grid" style={{ marginBottom: "1rem" }}>
            <label className="form-label">
              Tranche
              <input className="input" value={`Historical Tranche #${nextTrancheNumber}`} readOnly style={{ background: "var(--surface)", color: "var(--text-muted)" }} />
            </label>
            <label className="form-label">
              Date Range <span className="muted">(optional)</span>
              <input className="input" value={dateRange} onChange={(e) => setDateRange(e.target.value)} placeholder="e.g. Jan 2024 – Dec 2024" />
            </label>
          </div>
          <label className="txn-checkbox" style={{ marginBottom: "1.25rem" }}>
            <input type="checkbox" checked={sendPause} onChange={(e) => setSendPause(e.target.checked)} />
            <span>Send pause action to <strong>B&C</strong> for these transactions</span>
          </label>
          <div className="modal__footer">
            <button className="btn btn--ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Uploading…" : "Upload Transactions"}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}

function formatDate(iso: string) {
  return iso.slice(0, 10);
}
