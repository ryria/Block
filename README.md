# Case Management System

A proof-of-concept investigation case management system for retail and contact centre staff.

## Features

- **Case pipeline** — `New → Triage → Awaiting Allocation → Under Review → Awaiting Information → Awaiting Finalisation → Closed`
- **Transaction pipeline** — `Awaiting Review → Under Review → Reviewed`
- **Finding status** — `Unsubstantiated → Non-Compliance → ISP` (lowest to highest risk)
- **Auto-derived case finding** — a case's finding is automatically set to the highest-risk finding across all its transactions
- **Multiple cases per analyst** — analysts can be assigned more than one case at a time
- Dashboard with live stats and filters (status, type, analyst)
- Case detail view with visual pipeline stepper
- Add/edit/delete transactions per case
- Seed data included for immediate demo

---

## Tech Stack

| Layer    | Technology                  |
|----------|-----------------------------|
| Backend  | Python · FastAPI · SQLAlchemy |
| Database | SQLite (file-based, no setup) |
| Frontend | React · Vite · TypeScript   |

---

## Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Seed demo data (3 analysts, 5 cases, 10 transactions)
python seed.py

# Start the API server
uvicorn main:app --reload
```

API runs at **http://localhost:8000**
Interactive docs at **http://localhost:8000/docs**

### 2. Frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

UI runs at **http://localhost:5173**

---

## Project Structure

```
.
├── backend/
│   ├── main.py           # FastAPI app & CORS
│   ├── database.py       # SQLAlchemy engine & session
│   ├── models.py         # ORM models (User, Case, Transaction)
│   ├── schemas.py        # Pydantic request/response schemas
│   ├── seed.py           # Demo data
│   ├── requirements.txt
│   └── routers/
│       ├── cases.py       # Case CRUD endpoints
│       ├── transactions.py # Transaction CRUD + finding derivation
│       └── users.py       # User endpoints
│
└── frontend/
    └── src/
        ├── api/           # Typed API client
        ├── components/    # FindingBadge, StatusBadge, PipelineStepper, Modal
        ├── pages/         # Dashboard, CaseDetail, NewCase
        └── types/         # Shared TypeScript types & enums
```

---

## Data Model

```
User
 └── has many Cases (assigned)

Case
 ├── pipeline_status: new | triage | awaiting_allocation | under_review
 │                    | awaiting_information | awaiting_finalisation | closed
 ├── finding: unsubstantiated | non_compliance | ISP  ← auto-derived
 └── has many Transactions

Transaction
 ├── pipeline_status: awaiting_review | under_review | reviewed
 └── finding: unsubstantiated | non_compliance | ISP
```

**Finding derivation rule:** when a transaction's finding is saved, the parent case's finding is automatically recalculated as the highest-risk finding across all its transactions.

---

## API Endpoints

| Method | Path                      | Description               |
|--------|---------------------------|---------------------------|
| GET    | `/cases/`                 | List cases (filterable)   |
| POST   | `/cases/`                 | Create case               |
| GET    | `/cases/{id}`             | Get case with transactions|
| PATCH  | `/cases/{id}`             | Update case               |
| DELETE | `/cases/{id}`             | Delete case               |
| POST   | `/transactions/`          | Add transaction to case   |
| PATCH  | `/transactions/{id}`      | Update transaction        |
| DELETE | `/transactions/{id}`      | Delete transaction        |
| GET    | `/users/`                 | List analysts             |
| POST   | `/users/`                 | Create analyst            |
