"""
SQLAlchemy ORM Models for FraudShield
Stores transaction records, features, prediction outcomes, and explanations.
"""

from datetime import datetime
from sqlalchemy import Column, String, Float, Integer, DateTime, Text
from backend.app.database.db import Base


class TransactionRecord(Base):
    __tablename__ = "transactions"

    id = Column(String(64), primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    time_sec = Column(Float, nullable=False)
    amount = Column(Float, nullable=False)
    predicted_class = Column(Integer, nullable=False, index=True)  # 0 or 1
    risk_score = Column(Float, nullable=False, index=True)  # 0.0 to 1.0
    risk_level = Column(String(16), nullable=False, index=True)  # LOW, MEDIUM, HIGH
    model_version = Column(String(32), default="1.0.0")
    source = Column(String(16), default="SINGLE")  # SINGLE or BATCH
    features_json = Column(Text, nullable=False)  # JSON representation of V1-V28
    explanation = Column(Text, nullable=True)
