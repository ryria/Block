import type { Case, Transaction, User } from "../types";

const BASE = "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── Cases ─────────────────────────────────────────────────────────────────────

export interface CaseFilters {
  status?: string;
  assigned_user_id?: number;
  subject_type?: string;
}

export const casesApi = {
  list: (filters: CaseFilters = {}): Promise<Case[]> => {
    const params = new URLSearchParams();
    if (filters.status) params.set("status", filters.status);
    if (filters.assigned_user_id) params.set("assigned_user_id", String(filters.assigned_user_id));
    if (filters.subject_type) params.set("subject_type", filters.subject_type);
    const qs = params.toString();
    return request(`/cases/${qs ? `?${qs}` : ""}`);
  },

  get: (id: number): Promise<Case> => request(`/cases/${id}`),

  create: (data: {
    title: string;
    description?: string;
    subject_name: string;
    subject_type: string;
    assigned_user_id?: number | null;
  }): Promise<Case> =>
    request("/cases/", { method: "POST", body: JSON.stringify(data) }),

  update: (
    id: number,
    data: Partial<{
      title: string;
      description: string;
      subject_name: string;
      subject_type: string;
      pipeline_status: string;
      assigned_user_id: number | null;
    }>
  ): Promise<Case> =>
    request(`/cases/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: number): Promise<void> =>
    request(`/cases/${id}`, { method: "DELETE" }),
};

// ── Transactions ──────────────────────────────────────────────────────────────

export const transactionsApi = {
  create: (data: {
    case_id: number;
    reference: string;
    description?: string;
    amount?: string;
    transaction_date?: string;
  }): Promise<Transaction> =>
    request("/transactions/", { method: "POST", body: JSON.stringify(data) }),

  update: (
    id: number,
    data: Partial<{
      reference: string;
      description: string;
      amount: string;
      transaction_date: string;
      pipeline_status: string;
      finding: string;
      notes: string;
    }>
  ): Promise<Transaction> =>
    request(`/transactions/${id}`, { method: "PATCH", body: JSON.stringify(data) }),

  delete: (id: number): Promise<void> =>
    request(`/transactions/${id}`, { method: "DELETE" }),
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const usersApi = {
  list: (): Promise<User[]> => request("/users/"),
  create: (data: { name: string; email: string; role?: string }): Promise<User> =>
    request("/users/", { method: "POST", body: JSON.stringify(data) }),
};
