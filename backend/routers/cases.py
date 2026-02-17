from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload
from datetime import datetime, timezone

from database import get_db
from models import Case, User, CaseStatus
from schemas import CaseCreate, CaseUpdate, CaseOut, CaseSummary

router = APIRouter(prefix="/cases", tags=["cases"])

CASE_STATUS_ORDER = [
    CaseStatus.new,
    CaseStatus.triage,
    CaseStatus.awaiting_allocation,
    CaseStatus.under_review,
    CaseStatus.awaiting_information,
    CaseStatus.awaiting_finalisation,
    CaseStatus.closed,
]


def _generate_reference(db: Session) -> str:
    count = db.query(Case).count() + 1
    return f"CASE-{count:04d}"


@router.get("/", response_model=list[CaseSummary])
def list_cases(
    status: str | None = Query(None),
    assigned_user_id: int | None = Query(None),
    subject_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Case).options(joinedload(Case.assignee), joinedload(Case.transactions))

    if status:
        q = q.filter(Case.pipeline_status == status)
    if assigned_user_id:
        q = q.filter(Case.assigned_user_id == assigned_user_id)
    if subject_type:
        q = q.filter(Case.subject_type == subject_type)

    cases = q.order_by(Case.created_at.desc()).all()

    results = []
    for c in cases:
        summary = CaseSummary(
            id=c.id,
            reference=c.reference,
            title=c.title,
            description=c.description,
            subject_name=c.subject_name,
            subject_type=c.subject_type,
            pipeline_status=c.pipeline_status,
            finding=c.finding,
            assigned_user_id=c.assigned_user_id,
            assignee=c.assignee,
            transaction_count=len(c.transactions),
            created_at=c.created_at,
            updated_at=c.updated_at,
        )
        results.append(summary)
    return results


@router.post("/", response_model=CaseOut, status_code=201)
def create_case(payload: CaseCreate, db: Session = Depends(get_db)):
    if payload.assigned_user_id:
        if not db.query(User).filter(User.id == payload.assigned_user_id).first():
            raise HTTPException(status_code=404, detail="Assigned user not found")

    case = Case(
        **payload.model_dump(),
        reference=_generate_reference(db),
    )
    db.add(case)
    db.commit()
    db.refresh(case)
    return case


@router.get("/{case_id}", response_model=CaseOut)
def get_case(case_id: int, db: Session = Depends(get_db)):
    case = (
        db.query(Case)
        .options(joinedload(Case.assignee), joinedload(Case.transactions))
        .filter(Case.id == case_id)
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    return case


@router.patch("/{case_id}", response_model=CaseOut)
def update_case(case_id: int, payload: CaseUpdate, db: Session = Depends(get_db)):
    case = (
        db.query(Case)
        .options(joinedload(Case.assignee), joinedload(Case.transactions))
        .filter(Case.id == case_id)
        .first()
    )
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    if payload.assigned_user_id is not None:
        if not db.query(User).filter(User.id == payload.assigned_user_id).first():
            raise HTTPException(status_code=404, detail="Assigned user not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(case, field, value)
    case.updated_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(case)
    return case


@router.delete("/{case_id}", status_code=204)
def delete_case(case_id: int, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")
    db.delete(case)
    db.commit()
