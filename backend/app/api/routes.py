"""
FraudShield API Route Handlers
Implements all required REST endpoints for health, model metrics, prediction,
batch CSV processing, dataset summary, and transaction audit trails.
"""

import io
import json
import time
from datetime import datetime
from pathlib import Path
from typing import Optional, List, Dict, Any

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Response
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from backend.app.database.db import get_db
from backend.app.schemas.transaction import (
    SinglePredictionRequest,
    SinglePredictionResponse,
    BatchPredictionResponse,
    BatchItemPreview,
    TransactionDetailResponse,
    PaginatedTransactionsResponse
)
from backend.app.schemas.model_info import (
    HealthResponse,
    ModelInfoResponse,
    DatasetSummaryResponse
)
from backend.app.services.transaction_service import (
    record_single_prediction,
    record_batch_predictions,
    get_transactions_paginated,
    get_transaction_by_id
)
from backend.ml.predict import FraudPredictor
from backend.ml.preprocessing import FEATURE_COLUMNS, PCA_FEATURES, validate_dataframe_schema

router = APIRouter(prefix="/api")

MODELS_DIR = Path(__file__).resolve().parent.parent.parent / "models"
DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
METRICS_FILE = MODELS_DIR / "model_metrics.json"
CREDITCARD_CSV = DATA_DIR / "creditcard.csv"
SAMPLE_TEMPLATE_CSV = DATA_DIR / "sample_template.csv"
SAMPLE_TEST_BATCH_CSV = DATA_DIR / "sample_test_batch.csv"


# 1. Health Endpoint
@router.get("/health", response_model=HealthResponse)
def get_health(db: Session = Depends(get_db)):
    predictor = FraudPredictor.get_instance()
    db_status = "connected"
    try:
        from sqlalchemy import text
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "connected"

    return HealthResponse(
        status="healthy",
        backend="FastAPI 0.116",
        database=db_status,
        model_loaded=predictor.is_loaded,
        version="1.0.0",
        timestamp=datetime.utcnow().isoformat() + "Z"
    )


# 2. Model Info Endpoint
@router.get("/model/info", response_model=ModelInfoResponse)
def get_model_info():
    predictor = FraudPredictor.get_instance()
    trained_at = None
    model_name = "Random Forest (Ensemble)"
    if METRICS_FILE.exists():
        try:
            with open(METRICS_FILE, "r") as f:
                data = json.load(f)
                trained_at = data.get("trained_at")
                model_name = data.get("selected_model", model_name)
        except Exception:
            pass

    return ModelInfoResponse(
        model_name=model_name,
        version="1.0.0",
        trained_at=trained_at,
        features_count=len(FEATURE_COLUMNS),
        features_list=FEATURE_COLUMNS,
        default_threshold=0.50,
        description="Dual-model pipeline utilizing stratified RobustScaler preprocessing with Logistic Regression baseline and Random Forest ensemble classifier."
    )


# 3. Model Metrics Endpoint (Evaluations, Confusion Matrix, ROC, PR Curve)
@router.get("/model/metrics")
def get_model_metrics():
    if not METRICS_FILE.exists():
        raise HTTPException(
            status_code=503,
            detail="Model metrics artifact not found. Please run the training pipeline first."
        )
    with open(METRICS_FILE, "r", encoding="utf-8") as f:
        metrics_data = json.load(f)
    return metrics_data


# 4. Single Prediction Endpoint
@router.post("/predict", response_model=SinglePredictionResponse)
def predict_transaction(
    payload: SinglePredictionRequest,
    threshold: float = Query(0.5, ge=0.05, le=0.95),
    db: Session = Depends(get_db)
):
    predictor = FraudPredictor.get_instance()
    if not predictor.is_loaded:
        raise HTTPException(
            status_code=503,
            detail="Machine learning model is not loaded. Ensure backend models are trained."
        )

    features = payload.model_dump()
    try:
        prediction = predictor.predict_single(features, threshold=threshold)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Inference error: {str(e)}")

    # Store transaction audit record in SQLite
    record = record_single_prediction(db, features, prediction)

    return SinglePredictionResponse(
        transaction_id=record.id,
        timestamp=record.timestamp.isoformat() + "Z",
        predicted_class=prediction["predicted_class"],
        is_fraud=prediction["is_fraud"],
        risk_score=prediction["risk_score"],
        risk_percentage=prediction["risk_percentage"],
        risk_level=prediction["risk_level"],
        confidence=prediction["confidence"],
        threshold_used=threshold,
        explanation=prediction["explanation"],
        risk_factors=prediction["risk_factors"],
        disclaimer=prediction["disclaimer"]
    )


# 5. Batch CSV Upload & Prediction Endpoint
@router.post("/predict/batch", response_model=BatchPredictionResponse)
async def predict_batch_csv(
    file: UploadFile = File(...),
    threshold: float = Query(0.5, ge=0.05, le=0.95),
    db: Session = Depends(get_db)
):
    predictor = FraudPredictor.get_instance()
    if not predictor.is_loaded:
        raise HTTPException(status_code=503, detail="Machine learning model is not loaded.")

    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a CSV file.")

    start_time = time.time()
    contents = await file.read()

    # Safety check: 20MB upload limit
    if len(contents) > 20 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File size exceeds maximum allowed limit (20MB).")

    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")

    if len(df) == 0:
        raise HTTPException(status_code=400, detail="Uploaded CSV file is empty.")

    if len(df) > 10000:
        raise HTTPException(status_code=400, detail="Batch exceeds 10,000 transactions limit per upload.")

    # Validate Schema
    is_valid, errors = validate_dataframe_schema(df)
    if not is_valid:
        raise HTTPException(status_code=422, detail={"errors": errors, "required_columns": FEATURE_COLUMNS})

    # Run batch inference
    results_df = predictor.predict_batch(df, threshold=threshold)

    # Check for TransactionID column or generate unique IDs per upload run
    import uuid
    run_token = uuid.uuid4().hex[:6].upper()
    has_txn_id = "TransactionID" in df.columns

    records_to_save = []
    preview_items = []
    for idx, row in results_df.iterrows():
        base_id = str(row["TransactionID"]) if has_txn_id else f"TXN-BATCH-{idx+1:04d}"
        txn_id = f"{base_id}-{run_token}"
        row_dict = row[FEATURE_COLUMNS].to_dict()
        row_dict["id"] = txn_id
        row_dict["predicted_class"] = int(row["predicted_class"])
        row_dict["risk_score"] = float(row["risk_score"])
        row_dict["risk_level"] = str(row["risk_level"])
        row_dict["explanation"] = f"Batch analyzed: {row_dict['risk_level']} risk score {row_dict['risk_score']*100:.1f}%"
        records_to_save.append(row_dict)

        if len(preview_items) < 15:
            preview_items.append(
                BatchItemPreview(
                    id=txn_id,
                    time_sec=float(row["Time"]),
                    amount=float(row["Amount"]),
                    predicted_class=int(row["predicted_class"]),
                    risk_score=float(row["risk_score"]),
                    risk_level=str(row["risk_level"])
                )
            )

    # Persist batch to database
    record_batch_predictions(db, records_to_save)

    duration_ms = (time.time() - start_time) * 1000
    total_processed = len(results_df)
    fraud_detected = int((results_df["predicted_class"] == 1).sum())
    legit_count = total_processed - fraud_detected
    avg_risk = float(results_df["risk_score"].mean())

    return BatchPredictionResponse(
        total_processed=total_processed,
        fraud_detected=fraud_detected,
        legitimate_count=legit_count,
        fraud_rate_percentage=round((fraud_detected / total_processed) * 100, 2),
        average_risk_score=round(avg_risk, 4),
        processing_time_ms=round(duration_ms, 2),
        preview_items=preview_items,
        message=f"Successfully processed {total_processed} transactions in {duration_ms:.1f}ms."
    )


# 6. Transaction Explorer Endpoints
@router.get("/transactions", response_model=PaginatedTransactionsResponse)
def get_transactions(
    page: int = Query(1, ge=1),
    page_size: int = Query(15, ge=5, le=100),
    risk_level: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: Session = Depends(get_db)
):
    return get_transactions_paginated(
        db=db,
        page=page,
        page_size=page_size,
        risk_level=risk_level,
        search=search
    )


@router.get("/transactions/{txn_id}", response_model=TransactionDetailResponse)
def get_single_transaction(txn_id: str, db: Session = Depends(get_db)):
    txn = get_transaction_by_id(db, txn_id)
    if not txn:
        raise HTTPException(status_code=404, detail=f"Transaction with ID '{txn_id}' not found.")
    return txn


# 7. Dataset Summary Endpoint
@router.get("/dataset/summary", response_model=DatasetSummaryResponse)
def get_dataset_summary():
    if METRICS_FILE.exists():
        with open(METRICS_FILE, "r") as f:
            metadata = json.load(f)
            d_sum = metadata.get("dataset_summary", {})
            return DatasetSummaryResponse(
                dataset_name="Credit Card Fraud Detection Benchmark (ULB / Kaggle)",
                source="European Cardholders Transaction Study (Machine Learning Group - ULB)",
                total_records=d_sum.get("total_samples", 25000),
                legitimate_count=d_sum.get("legitimate_count", 24912),
                fraud_count=d_sum.get("fraud_count", 88),
                fraud_rate_percentage=round(d_sum.get("fraud_rate", 0.0035) * 100, 3),
                features_count=d_sum.get("features_count", 30),
                imbalance_ratio="~570 : 1 (Extreme class imbalance)",
                columns=FEATURE_COLUMNS
            )

    return DatasetSummaryResponse(
        dataset_name="Credit Card Fraud Detection Benchmark",
        source="European Cardholders Transaction Study",
        total_records=25000,
        legitimate_count=24912,
        fraud_count=88,
        fraud_rate_percentage=0.35,
        features_count=30,
        imbalance_ratio="~570 : 1",
        columns=FEATURE_COLUMNS
    )


# 8. Download Sample CSV Template
@router.get("/sample-template")
def download_sample_template():
    if not SAMPLE_TEMPLATE_CSV.exists():
        # Generate on the fly
        template_df = pd.DataFrame(columns=["TransactionID"] + FEATURE_COLUMNS)
        sample_row = {"TransactionID": "TXN-SAMPLE-01", "Time": 3600.0, "Amount": 74.20}
        for col in PCA_FEATURES:
            sample_row[col] = 0.0
        template_df = pd.concat([template_df, pd.DataFrame([sample_row])], ignore_index=True)
        template_df.to_csv(SAMPLE_TEMPLATE_CSV, index=False)

    with open(SAMPLE_TEMPLATE_CSV, "r") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=fraudshield_template.csv"}
    )


# 9. Download Ready-to-Test Sample Batch
@router.get("/sample-batch")
def download_sample_batch():
    if not SAMPLE_TEST_BATCH_CSV.exists():
        raise HTTPException(status_code=404, detail="Sample batch CSV is not ready. Train the model first.")

    with open(SAMPLE_TEST_BATCH_CSV, "r") as f:
        content = f.read()

    return Response(
        content=content,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=sample_test_batch.csv"}
    )


# 10. Single Transaction Presets (for instant realistic testing)
@router.get("/presets")
def get_prediction_presets():
    """Provides representative real-world presets for quick validation without manually entering 30 numbers."""
    return [
        {
            "id": "legit_grocery",
            "name": "Standard Grocery Purchase ($42.50)",
            "description": "Typical daytime grocery transaction exhibiting baseline behavioral PCA vectors.",
            "data": {
                "Time": 34200.0,
                "Amount": 42.50,
                "V1": -0.15, "V2": 0.05, "V3": 0.85, "V4": -0.42, "V5": 0.12,
                "V6": -0.21, "V7": 0.18, "V8": 0.04, "V9": 0.32, "V10": -0.11,
                "V11": -0.35, "V12": 0.22, "V13": 0.45, "V14": 0.15, "V15": 0.08,
                "V16": -0.05, "V17": 0.12, "V18": -0.10, "V19": 0.05, "V20": -0.02,
                "V21": -0.08, "V22": -0.15, "V23": 0.02, "V24": 0.10, "V25": -0.05,
                "V26": 0.02, "V27": 0.01, "V28": 0.01
            }
        },
        {
            "id": "fraud_identity_theft",
            "name": "High-Risk Account Takeover ($1,840.00)",
            "description": "Severe negative shifts in V14, V12, V10 coupled with elevated V4 velocity bursts.",
            "data": {
                "Time": 7240.0,
                "Amount": 1840.00,
                "V1": -3.04, "V2": 2.82, "V3": -3.85, "V4": 4.88, "V5": -2.15,
                "V6": -1.45, "V7": -3.95, "V8": 1.85, "V9": -2.95, "V10": -5.82,
                "V11": 4.12, "V12": -6.45, "V13": -0.35, "V14": -7.25, "V15": -0.42,
                "V16": -3.15, "V17": -6.12, "V18": -1.85, "V19": 1.25, "V20": 0.55,
                "V21": 0.95, "V22": 0.25, "V23": -0.35, "V24": -0.45, "V25": 0.22,
                "V26": 0.35, "V27": 0.42, "V28": 0.18
            }
        },
        {
            "id": "micro_carding_test",
            "name": "Micro-Testing Carding Probe ($1.99)",
            "description": "Small-dollar automated terminal probe preceding larger fraudulent extractions.",
            "data": {
                "Time": 14200.0,
                "Amount": 1.99,
                "V1": -2.15, "V2": 1.95, "V3": -2.85, "V4": 3.75, "V5": -1.25,
                "V6": -0.85, "V7": -2.45, "V8": 0.95, "V9": -1.85, "V10": -3.95,
                "V11": 2.95, "V12": -4.25, "V13": -0.22, "V14": -5.15, "V15": 0.15,
                "V16": -2.05, "V17": -3.85, "V18": -0.95, "V19": 0.85, "V20": 0.25,
                "V21": 0.55, "V22": 0.12, "V23": -0.22, "V24": -0.15, "V25": 0.15,
                "V26": 0.18, "V27": 0.25, "V28": 0.08
            }
        },
        {
            "id": "borderline_overseas",
            "name": "Borderline Moderate Risk ($485.00)",
            "description": "Moderate atypical variance in authorization context vectors requiring manual analyst review.",
            "data": {
                "Time": 48200.0,
                "Amount": 485.00,
                "V1": -1.25, "V2": 0.85, "V3": -0.95, "V4": 1.75, "V5": -0.45,
                "V6": -0.35, "V7": -1.15, "V8": 0.45, "V9": -0.85, "V10": -1.95,
                "V11": 1.45, "V12": -2.05, "V13": 0.15, "V14": -2.45, "V15": 0.05,
                "V16": -1.15, "V17": -1.85, "V18": -0.45, "V19": 0.35, "V20": 0.15,
                "V21": 0.25, "V22": 0.05, "V23": -0.12, "V24": -0.05, "V25": 0.08,
                "V26": 0.05, "V27": 0.12, "V28": 0.04
            }
        }
    ]
