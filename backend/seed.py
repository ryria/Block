"""Seed the database with demo data."""
from datetime import datetime, timezone, timedelta
from database import SessionLocal, engine, Base
from models import User, Case, Transaction, CaseStatus, TransactionStatus, Finding

Base.metadata.create_all(bind=engine)

db = SessionLocal()

if db.query(User).count() > 0:
    print("Database already seeded.")
    db.close()
    exit(0)

# ── Users ─────────────────────────────────────────────────────────────────────
users = [
    User(name="Sarah Mitchell", email="s.mitchell@example.com", role="analyst"),
    User(name="James Okafor", email="j.okafor@example.com", role="analyst"),
    User(name="Priya Sharma", email="p.sharma@example.com", role="senior_analyst"),
]
db.add_all(users)
db.flush()

now = datetime.now(timezone.utc)

# ── Cases & Transactions ──────────────────────────────────────────────────────

# Case 1 — new, retail, unsubstantiated
c1 = Case(
    reference="CASE-0001",
    title="Till discrepancy review",
    description="Multiple till shortfalls flagged over a 2-week period.",
    subject_name="Tom Hendricks",
    subject_type="retail",
    pipeline_status=CaseStatus.new,
    finding=Finding.unsubstantiated,
    assigned_user_id=None,
    created_at=now - timedelta(days=3),
    updated_at=now - timedelta(days=3),
)
db.add(c1)
db.flush()

db.add_all([
    Transaction(
        case_id=c1.id, reference="TXN-10041", description="Till short £42.00",
        amount="£42.00", transaction_date="2024-11-01",
        pipeline_status=TransactionStatus.awaiting_review, finding=Finding.unsubstantiated,
        created_at=now - timedelta(days=3), updated_at=now - timedelta(days=3),
    ),
    Transaction(
        case_id=c1.id, reference="TXN-10055", description="Till short £18.50",
        amount="£18.50", transaction_date="2024-11-04",
        pipeline_status=TransactionStatus.awaiting_review, finding=Finding.unsubstantiated,
        created_at=now - timedelta(days=3), updated_at=now - timedelta(days=3),
    ),
])

# Case 2 — under_review, contact_centre, non_compliance
c2 = Case(
    reference="CASE-0002",
    title="Unauthorised account access",
    description="Agent accessed customer accounts outside of active call log.",
    subject_name="Lisa Payne",
    subject_type="contact_centre",
    pipeline_status=CaseStatus.under_review,
    finding=Finding.non_compliance,
    assigned_user_id=users[0].id,
    created_at=now - timedelta(days=10),
    updated_at=now - timedelta(days=1),
)
db.add(c2)
db.flush()

db.add_all([
    Transaction(
        case_id=c2.id, reference="TXN-20012", description="Account lookup — no active call",
        amount=None, transaction_date="2024-10-22",
        pipeline_status=TransactionStatus.reviewed, finding=Finding.non_compliance,
        notes="Confirmed no call in progress at time of access.",
        created_at=now - timedelta(days=10), updated_at=now - timedelta(days=2),
    ),
    Transaction(
        case_id=c2.id, reference="TXN-20019", description="Address change — no active call",
        amount=None, transaction_date="2024-10-23",
        pipeline_status=TransactionStatus.under_review, finding=Finding.unsubstantiated,
        created_at=now - timedelta(days=10), updated_at=now - timedelta(days=2),
    ),
])

# Case 3 — awaiting_finalisation, retail, ISP
c3 = Case(
    reference="CASE-0003",
    title="Suspected stock theft",
    description="High-value items repeatedly missing from shift counts. CCTV reviewed.",
    subject_name="Marcus Webb",
    subject_type="retail",
    pipeline_status=CaseStatus.awaiting_finalisation,
    finding=Finding.ISP,
    assigned_user_id=users[2].id,
    created_at=now - timedelta(days=30),
    updated_at=now - timedelta(hours=5),
)
db.add(c3)
db.flush()

db.add_all([
    Transaction(
        case_id=c3.id, reference="TXN-30001", description="Missing stock — headphones x3",
        amount="£210.00", transaction_date="2024-10-01",
        pipeline_status=TransactionStatus.reviewed, finding=Finding.ISP,
        notes="CCTV confirms subject removed items from stockroom.",
        created_at=now - timedelta(days=30), updated_at=now - timedelta(days=5),
    ),
    Transaction(
        case_id=c3.id, reference="TXN-30002", description="Missing stock — tablet x1",
        amount="£349.00", transaction_date="2024-10-08",
        pipeline_status=TransactionStatus.reviewed, finding=Finding.non_compliance,
        notes="Procedural breach confirmed; theft not proven for this item.",
        created_at=now - timedelta(days=28), updated_at=now - timedelta(days=4),
    ),
    Transaction(
        case_id=c3.id, reference="TXN-30003", description="Missing stock — cables",
        amount="£55.00", transaction_date="2024-10-15",
        pipeline_status=TransactionStatus.reviewed, finding=Finding.unsubstantiated,
        notes="Stock discrepancy attributed to data entry error.",
        created_at=now - timedelta(days=20), updated_at=now - timedelta(days=3),
    ),
])

# Case 4 — triage, contact_centre, no finding yet
c4 = Case(
    reference="CASE-0004",
    title="Potential data breach — customer PII shared",
    description="Customer complaint that agent disclosed personal data to a third party.",
    subject_name="Chloe Nkosi",
    subject_type="contact_centre",
    pipeline_status=CaseStatus.triage,
    finding=Finding.unsubstantiated,
    assigned_user_id=users[1].id,
    created_at=now - timedelta(days=1),
    updated_at=now - timedelta(hours=2),
)
db.add(c4)
db.flush()

# Case 5 — awaiting_allocation, retail
c5 = Case(
    reference="CASE-0005",
    title="Refund manipulation",
    description="Refunds processed to personal card not matching original payment method.",
    subject_name="Ben Castillo",
    subject_type="retail",
    pipeline_status=CaseStatus.awaiting_allocation,
    finding=Finding.unsubstantiated,
    assigned_user_id=None,
    created_at=now - timedelta(days=5),
    updated_at=now - timedelta(days=5),
)
db.add(c5)
db.flush()

db.add_all([
    Transaction(
        case_id=c5.id, reference="TXN-50001", description="Refund £85.00 to alternate card",
        amount="£85.00", transaction_date="2024-10-28",
        pipeline_status=TransactionStatus.awaiting_review, finding=Finding.unsubstantiated,
        created_at=now - timedelta(days=5), updated_at=now - timedelta(days=5),
    ),
    Transaction(
        case_id=c5.id, reference="TXN-50002", description="Refund £120.00 to alternate card",
        amount="£120.00", transaction_date="2024-10-30",
        pipeline_status=TransactionStatus.awaiting_review, finding=Finding.unsubstantiated,
        created_at=now - timedelta(days=5), updated_at=now - timedelta(days=5),
    ),
    Transaction(
        case_id=c5.id, reference="TXN-50003", description="Refund £34.00 to alternate card",
        amount="£34.00", transaction_date="2024-11-02",
        pipeline_status=TransactionStatus.awaiting_review, finding=Finding.unsubstantiated,
        created_at=now - timedelta(days=5), updated_at=now - timedelta(days=5),
    ),
])

db.commit()
db.close()
print("Seeded: 3 users, 5 cases, 10 transactions.")
