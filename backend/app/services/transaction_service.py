"""
FraudShield Transaction Persistence and Retrieval Service
Interfaces with the SQLite database for transaction history, metrics aggregation,
and filtered queries.
"""

import json
import uuid
from datetime import datetime
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from backend.app.database.models import TransactionRecord
from backend.app.schemas.transaction import (
    SinglePredictionResponse,
    TransactionDetailResponse,
    PaginatedTransactionsResponse
)


def record_single_prediction(
    db: Session,
    features: Dict[str, float],
    prediction_result: Dict[str, Any]
) -> TransactionRecord:
    """Stores a single prediction outcome and features in SQLite."""
    txn_id = f"TXN-{uuid.uuid4().hex[:10].upper()}"

    # Extract V1-V28 features for JSON storage
    v_features = {f"V{i}": features.get(f"V{i}", 0.0) for i in range(1, 29)}

    record = TransactionRecord(
        id=txn_id,
        timestamp=datetime.utcnow(),
        time_sec=float(features.get("Time", 0.0)),
        amount=float(features.get("Amount", 0.0)),
        predicted_class=prediction_result["predicted_class"],
        risk_score=prediction_result["risk_score"],
        risk_level=prediction_result["risk_level"],
        model_version="1.0.0",
        source="SINGLE",
        features_json=json.dumps(v_features),
        explanation=prediction_result.get("explanation", "")
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return record


def record_batch_predictions(
    db: Session,
    records_data: List[Dict[str, Any]]
) -> int:
    """Batch-inserts multiple prediction outcomes into SQLite."""
    db_records = []
    for item in records_data:
        v_features = {f"V{i}": item.get(f"V{i}", 0.0) for i in range(1, 29)}
        db_records.append(
            TransactionRecord(
                id=item.get("id") or f"TXN-{uuid.uuid4().hex[:10].upper()}",
                timestamp=datetime.utcnow(),
                time_sec=float(item.get("Time", 0.0)),
                amount=float(item.get("Amount", 0.0)),
                predicted_class=int(item["predicted_class"]),
                risk_score=float(item["risk_score"]),
                risk_level=item["risk_level"],
                model_version="1.0.0",
                source="BATCH",
                features_json=json.dumps(v_features),
                explanation=item.get("explanation", "")
            )
        )
    db.bulk_save_objects(db_records)
    db.commit()
    return len(db_records)


def get_transactions_paginated(
    db: Session,
    page: int = 1,
    page_size: int = 15,
    risk_level: Optional[str] = None,
    search: Optional[str] = None
) -> PaginatedTransactionsResponse:
    """Retrieves paginated and filtered transaction history with aggregate metrics."""
    query = db.query(TransactionRecord)

    if risk_level and risk_level.upper() != "ALL":
        query = query.filter(TransactionRecord.risk_level == risk_level.upper())

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(TransactionRecord.id.ilike(search_pattern))

    total = query.count()
    total_pages = max(1, (total + page_size - 1) // page_size)
    offset = (page - 1) * page_size

    records = query.order_by(desc(TransactionRecord.timestamp)).offset(offset).limit(page_size).all()

    # Aggregate summaries across all transactions
    total_all = db.query(func.count(TransactionRecord.id)).scalar() or 0
    high_risk_count = db.query(func.count(TransactionRecord.id)).filter(TransactionRecord.risk_level == "HIGH").scalar() or 0
    medium_risk_count = db.query(func.count(TransactionRecord.id)).filter(TransactionRecord.risk_level == "MEDIUM").scalar() or 0
    low_risk_count = db.query(func.count(TransactionRecord.id)).filter(TransactionRecord.risk_level == "LOW").scalar() or 0

    items = []
    for r in records:
        try:
            v_dict = json.loads(r.features_json)
        except Exception:
            v_dict = {}

        v_dict["Time"] = r.time_sec
        v_dict["Amount"] = r.amount

        items.append(
            TransactionDetailResponse(
                id=r.id,
                timestamp=r.timestamp.isoformat() + "Z",
                time_sec=r.time_sec,
                amount=r.amount,
                predicted_class=r.predicted_class,
                risk_score=r.risk_score,
                risk_level=r.risk_level,
                model_version=r.model_version,
                source=r.source,
                explanation=r.explanation,
                features=v_dict
            )
        )

    return PaginatedTransactionsResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
        summary={
            "total_transactions": total_all,
            "high_risk_count": high_risk_count,
            "medium_risk_count": medium_risk_count,
            "low_risk_count": low_risk_count,
            "fraud_detected": high_risk_count,
        }
    )


def get_transaction_by_id(db: Session, txn_id: str) -> Optional[TransactionDetailResponse]:
    """Retrieves a single transaction by ID."""
    record = db.query(TransactionRecord).filter(TransactionRecord.id == txn_id).first()
    if not record:
        return None

    try:
        v_dict = json.loads(record.features_json)
    except Exception:
        v_dict = {}

    v_dict["Time"] = record.time_sec
    v_dict["Amount"] = record.amount

    return TransactionDetailResponse(
        id=record.id,
        timestamp=record.timestamp.isoformat() + "Z",
        time_sec=record.time_sec,
        amount=record.amount,
        predicted_class=record.predicted_class,
        risk_score=record.risk_score,
        risk_level=record.risk_level,
        model_version=record.model_version,
        source=record.source,
        explanation=record.explanation,
        features=v_dict
    )
