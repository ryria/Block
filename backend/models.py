from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Enum
from sqlalchemy.orm import relationship
import enum

from database import Base


class CaseStatus(str, enum.Enum):
    new = "new"
    triage = "triage"
    awaiting_allocation = "awaiting_allocation"
    under_review = "under_review"
    awaiting_information = "awaiting_information"
    awaiting_finalisation = "awaiting_finalisation"
    closed = "closed"


class TransactionStatus(str, enum.Enum):
    awaiting_review = "awaiting_review"
    under_review = "under_review"
    reviewed = "reviewed"


class Finding(str, enum.Enum):
    unsubstantiated = "unsubstantiated"
    non_compliance = "non_compliance"
    ISP = "ISP"


FINDING_PRIORITY = {
    Finding.unsubstantiated: 0,
    Finding.non_compliance: 1,
    Finding.ISP: 2,
}


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    role = Column(String(50), default="analyst")
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    cases = relationship("Case", back_populates="assignee")


class Case(Base):
    __tablename__ = "cases"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(20), unique=True, nullable=False)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    subject_name = Column(String(200), nullable=False)
    subject_type = Column(String(50), nullable=False)  # "retail" or "contact_centre"
    pipeline_status = Column(Enum(CaseStatus), default=CaseStatus.new, nullable=False)
    finding = Column(Enum(Finding), default=Finding.unsubstantiated, nullable=False)
    assigned_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    assignee = relationship("User", back_populates="cases")
    transactions = relationship("Transaction", back_populates="case", cascade="all, delete-orphan")


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    case_id = Column(Integer, ForeignKey("cases.id"), nullable=False)
    reference = Column(String(50), nullable=False)
    description = Column(Text, nullable=True)
    amount = Column(String(50), nullable=True)
    transaction_date = Column(String(20), nullable=True)
    pipeline_status = Column(Enum(TransactionStatus), default=TransactionStatus.awaiting_review, nullable=False)
    finding = Column(Enum(Finding), default=Finding.unsubstantiated, nullable=False)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    case = relationship("Case", back_populates="transactions")
