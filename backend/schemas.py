from datetime import datetime
from typing import Optional
from pydantic import BaseModel

from models import CaseStatus, TransactionStatus, Finding


# ── User ──────────────────────────────────────────────────────────────────────

class UserBase(BaseModel):
    name: str
    email: str
    role: str = "analyst"


class UserCreate(UserBase):
    pass


class UserOut(UserBase):
    id: int
    created_at: datetime

    model_config = {"from_attributes": True}


# ── Transaction ───────────────────────────────────────────────────────────────

class TransactionBase(BaseModel):
    reference: str
    description: Optional[str] = None
    amount: Optional[str] = None
    transaction_date: Optional[str] = None
    notes: Optional[str] = None


class TransactionCreate(TransactionBase):
    case_id: int


class TransactionUpdate(BaseModel):
    reference: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[str] = None
    transaction_date: Optional[str] = None
    pipeline_status: Optional[TransactionStatus] = None
    finding: Optional[Finding] = None
    notes: Optional[str] = None


class TransactionOut(TransactionBase):
    id: int
    case_id: int
    pipeline_status: TransactionStatus
    finding: Finding
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ── Case ──────────────────────────────────────────────────────────────────────

class CaseBase(BaseModel):
    title: str
    description: Optional[str] = None
    subject_name: str
    subject_type: str


class CaseCreate(CaseBase):
    assigned_user_id: Optional[int] = None


class CaseUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    subject_name: Optional[str] = None
    subject_type: Optional[str] = None
    pipeline_status: Optional[CaseStatus] = None
    assigned_user_id: Optional[int] = None


class CaseOut(CaseBase):
    id: int
    reference: str
    pipeline_status: CaseStatus
    finding: Finding
    assigned_user_id: Optional[int]
    assignee: Optional[UserOut]
    transactions: list[TransactionOut] = []
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class CaseSummary(CaseBase):
    id: int
    reference: str
    pipeline_status: CaseStatus
    finding: Finding
    assigned_user_id: Optional[int]
    assignee: Optional[UserOut]
    transaction_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
