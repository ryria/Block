from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime, timezone

from database import get_db
from models import Case, Transaction, Finding, FINDING_PRIORITY
from schemas import TransactionCreate, TransactionUpdate, TransactionOut

router = APIRouter(prefix="/transactions", tags=["transactions"])


def _recalculate_case_finding(case: Case) -> None:
    """Derive case finding from highest-risk reviewed transaction."""
    if not case.transactions:
        case.finding = Finding.unsubstantiated
        return

    highest = max(
        (t.finding for t in case.transactions),
        key=lambda f: FINDING_PRIORITY[f],
        default=Finding.unsubstantiated,
    )
    case.finding = highest
    case.updated_at = datetime.now(timezone.utc)


@router.post("/", response_model=TransactionOut, status_code=201)
def create_transaction(payload: TransactionCreate, db: Session = Depends(get_db)):
    case = db.query(Case).filter(Case.id == payload.case_id).first()
    if not case:
        raise HTTPException(status_code=404, detail="Case not found")

    txn = Transaction(**payload.model_dump())
    db.add(txn)
    db.flush()

    _recalculate_case_finding(case)
    db.commit()
    db.refresh(txn)
    return txn


@router.get("/{txn_id}", response_model=TransactionOut)
def get_transaction(txn_id: int, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return txn


@router.patch("/{txn_id}", response_model=TransactionOut)
def update_transaction(txn_id: int, payload: TransactionUpdate, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    for field, value in payload.model_dump(exclude_none=True).items():
        setattr(txn, field, value)
    txn.updated_at = datetime.now(timezone.utc)

    _recalculate_case_finding(txn.case)
    db.commit()
    db.refresh(txn)
    return txn


@router.delete("/{txn_id}", status_code=204)
def delete_transaction(txn_id: int, db: Session = Depends(get_db)):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    case = txn.case
    db.delete(txn)
    db.flush()
    _recalculate_case_finding(case)
    db.commit()
