import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { casesApi, usersApi } from "../api";
import type { User } from "../types";

export default function NewCase() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [form, setForm] = useState({
    title: "",
    description: "",
    subject_name: "",
    assigned_user_id: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    usersApi.list().then(setUsers).catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setError("Title is required"); return; }
    if (!form.subject_name.trim()) { setError("Subject name is required"); return; }

    setSaving(true);
    setError(null);
    try {
      const created = await casesApi.create({
        title: form.title,
        description: form.description || undefined,
        subject_name: form.subject_name,
        assigned_user_id: form.assigned_user_id ? Number(form.assigned_user_id) : null,
      });
      navigate(`/cases/${created.id}`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to create case");
      setSaving(false);
    }
  };

  return (
    <div className="page page--narrow">
      <div className="breadcrumb">
        <Link to="/" className="breadcrumb__link">Cases</Link>
        <span className="breadcrumb__sep">/</span>
        <span>New Case</span>
      </div>

      <h1 className="page__title">New Case</h1>
      <p className="page__subtitle">Open a new investigation case.</p>

      {error && <div className="alert alert--error">{error}</div>}

      <form className="card form-card" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="form-label form-label--full">
            Case Title *
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="e.g. Till discrepancy review"
            />
          </label>
          <label className="form-label">
            Staff Member *
            <input
              className="input"
              value={form.subject_name}
              onChange={(e) => setForm({ ...form, subject_name: e.target.value })}
              placeholder="Full name"
            />
          </label>
          <label className="form-label">
            Assign Analyst
            <select
              className="select"
              value={form.assigned_user_id}
              onChange={(e) => setForm({ ...form, assigned_user_id: e.target.value })}
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
          </label>
          <label className="form-label form-label--full">
            Description
            <textarea
              className="textarea"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows={4}
              placeholder="Background, referral source, initial summary…"
            />
          </label>
        </div>

        <div className="form-actions">
          <Link to="/" className="btn btn--ghost">Cancel</Link>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? "Creating…" : "Create Case"}
          </button>
        </div>
      </form>
    </div>
  );
}
