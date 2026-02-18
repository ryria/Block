import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { casesApi, usersApi, bulkApi } from "../api";
import type { FauxTxnDetail } from "../api";
import type { User } from "../types";

type Step = 1 | 2 | 3;

export default function NewCase() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [users, setUsers] = useState<User[]>([]);

  const [form, setForm] = useState({
    title: "", description: "", subject_name: "", assigned_user_id: "",
  });

  const [rawIds, setRawIds] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookedUp, setLookedUp] = useState<FauxTxnDetail[]>([]);
  const [lookupError, setLookupError] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { usersApi.list().then(setUsers).catch(() => {}); }, []);

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.subject_name.trim()) { setError("Subject name is required"); return; }
    setError(null);
    setStep(2);
  };

  const parseIds = () => rawIds.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);

  const handleFetch = async () => {
    const ids = parseIds();
    if (!ids.length) { setLookupError("Paste at least one transaction ID"); return; }
    setLookupLoading(true);
    setLookupError(null);
    try {
      const results = await bulkApi.lookup(ids);
      setLookedUp(results);
    } catch {
      setLookupError("Lookup failed — please try again");
    } finally {
      setLookupLoading(false);
    }
  };

  const handleStep2 = () => {
    if (!lookedUp.length) { setLookupError("Fetch transaction details first"); return; }
    setLookupError(null);
    setStep(3);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError(null);
    try {
      const created = await casesApi.create({
        title: form.title,
        description: form.description || undefined,
        subject_name: form.subject_name,
        assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : null,
        initial_transactions: lookedUp,
      });
      navigate(`/cases/${created.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create case");
      setSaving(false);
    }
  };

  const stepLabels = ["Case Details", "Catalyst Transactions", "Review & Submit"];

  return (
    <div className="page page--narrow">
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb__link">Cases</Link>
        <span className="breadcrumb__sep">/</span>
        <span>New Case</span>
      </div>
      <h1 className="page__title">New Case</h1>

      <div className="wizard-steps">
        {stepLabels.map((label, i) => (
          <div key={label} className={`wizard-step ${step === i + 1 ? "active" : step > i + 1 ? "done" : ""}`}>
            <span className="wizard-step__num">{step > i + 1 ? "✓" : i + 1}</span>
            <span className="wizard-step__label">{label}</span>
          </div>
        ))}
      </div>

      {error && <div className="alert alert--error" style={{ marginBottom: "1rem" }}>{error}</div>}

      {step === 1 && (
        <form className="card form-card" onSubmit={handleStep1}>
          <div className="form-grid">
            <label className="form-label form-label--full">
              Case Title *
              <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Till discrepancy review" />
            </label>
            <label className="form-label">
              Staff Member *
              <input className="input" value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} placeholder="Full name" />
            </label>
            <label className="form-label">
              Assign Analyst
              <select className="select" value={form.assigned_user_id} onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}>
                <option value="">Unassigned</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
              </select>
            </label>
            <label className="form-label form-label--full">
              Description
              <textarea className="textarea" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} placeholder="Background, referral source, initial summary…" />
            </label>
          </div>
          <div className="form-actions">
            <Link to="/" className="btn btn--ghost">Cancel</Link>
            <button type="submit" className="btn btn--primary">Next: Add Transactions →</button>
          </div>
        </form>
      )}

      {step === 2 && (
        <div className="card form-card">
          <h2 className="card__title">Catalyst Transactions</h2>
          <p className="muted" style={{ marginBottom: "1rem", fontSize: "0.875rem" }}>
            Paste the initial transaction IDs for this case. These form the <strong>Catalyst Tranche</strong>.
          </p>
          {lookupError && <div className="alert alert--error" style={{ marginBottom: "1rem" }}>{lookupError}</div>}
          <label className="form-label">
            Transaction IDs <span className="muted">(one per line or comma-separated)</span>
            <textarea
              className="textarea"
              value={rawIds}
              onChange={(e) => { setRawIds(e.target.value); setLookedUp([]); }}
              rows={6}
              placeholder={"TXN-10041\nTXN-10055\nTXN-20012"}
            />
          </label>
          {rawIds.trim() && (
            <p className="muted" style={{ fontSize: "0.8rem", marginBottom: "0.75rem" }}>
              {parseIds().length} ID{parseIds().length !== 1 ? "s" : ""} detected
            </p>
          )}
          <button
            className="btn btn--secondary"
            onClick={handleFetch}
            disabled={lookupLoading || !rawIds.trim()}
            style={{ marginBottom: "1rem" }}
          >
            {lookupLoading ? "Fetching details…" : "Fetch Transaction Details"}
          </button>
          {lookupLoading && <p className="muted" style={{ fontSize: "0.875rem" }}>Contacting transaction system…</p>}
          {lookedUp.length > 0 && (
            <div className="table-wrap" style={{ marginBottom: "1rem" }}>
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
          )}
          <div className="form-actions">
            <button className="btn btn--ghost" onClick={() => setStep(1)}>← Back</button>
            <button className="btn btn--primary" onClick={handleStep2} disabled={!lookedUp.length}>
              Next: Review & Submit →
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="card form-card">
          <h2 className="card__title">Review & Submit</h2>
          <dl className="dl" style={{ marginBottom: "1.5rem" }}>
            <dt>Title</dt><dd>{form.title}</dd>
            <dt>Staff Member</dt><dd>{form.subject_name}</dd>
            <dt>Analyst</dt><dd>{users.find((u) => u.id === Number(form.assigned_user_id))?.name ?? "Unassigned"}</dd>
            {form.description && <><dt>Description</dt><dd>{form.description}</dd></>}
            <dt>Catalyst Transactions</dt><dd>{lookedUp.length} transaction{lookedUp.length !== 1 ? "s" : ""}</dd>
          </dl>
          <p className="muted" style={{ fontSize: "0.875rem", marginBottom: "1rem" }}>
            On submit: case created, Catalyst Tranche recorded, notification sent to B&C & ER.
          </p>
          <div className="form-actions">
            <button className="btn btn--ghost" onClick={() => setStep(2)}>← Back</button>
            <button className="btn btn--primary" onClick={handleSubmit} disabled={saving}>
              {saving ? "Creating…" : "Create Case"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
