"""
Pydantic Schemas for FraudShield Requests and Responses
Enforces strict input validation and documented API response models.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class SinglePredictionRequest(BaseModel):
    Time: float = Field(default=3600.0, description="Seconds elapsed since the initial transaction window")
    Amount: float = Field(default=120.50, gt=0, description="Transaction amount in local currency (must be positive)")
    V1: float = Field(default=0.0)
    V2: float = Field(default=0.0)
    V3: float = Field(default=0.0)
    V4: float = Field(default=0.0)
    V5: float = Field(default=0.0)
    V6: float = Field(default=0.0)
    V7: float = Field(default=0.0)
    V8: float = Field(default=0.0)
    V9: float = Field(default=0.0)
    V10: float = Field(default=0.0)
    V11: float = Field(default=0.0)
    V12: float = Field(default=0.0)
    V13: float = Field(default=0.0)
    V14: float = Field(default=0.0)
    V15: float = Field(default=0.0)
    V16: float = Field(default=0.0)
    V17: float = Field(default=0.0)
    V18: float = Field(default=0.0)
    V19: float = Field(default=0.0)
    V20: float = Field(default=0.0)
    V21: float = Field(default=0.0)
    V22: float = Field(default=0.0)
    V23: float = Field(default=0.0)
    V24: float = Field(default=0.0)
    V25: float = Field(default=0.0)
    V26: float = Field(default=0.0)
    V27: float = Field(default=0.0)
    V28: float = Field(default=0.0)

    model_config = {
        "json_schema_extra": {
            "example": {
                "Time": 406.0,
                "Amount": 269.00,
                "V1": -2.31,
                "V2": 1.95,
                "V3": -1.60,
                "V4": 3.99,
                "V5": -0.52,
                "V6": -1.42,
                "V7": -2.53,
                "V8": 1.39,
                "V9": -2.77,
                "V10": -2.77,
                "V11": 3.20,
                "V12": -2.89,
                "V13": -0.59,
                "V14": -4.28,
                "V15": 0.38,
                "V16": -1.14,
                "V17": -2.83,
                "V18": -0.01,
                "V19": 0.41,
                "V20": 0.12,
                "V21": 0.51,
                "V22": -0.03,
                "V23": -0.46,
                "V24": 0.32,
                "V25": 0.04,
                "V26": 0.17,
                "V27": 0.26,
                "V28": -0.14
            }
        }
    }


class RiskFactor(BaseModel):
    feature: str
    label: str
    value: float
    impact: str
    description: str


class SinglePredictionResponse(BaseModel):
    transaction_id: str
    timestamp: str
    predicted_class: int
    is_fraud: bool
    risk_score: float
    risk_percentage: float
    risk_level: str
    confidence: float
    threshold_used: float
    explanation: str
    risk_factors: List[RiskFactor]
    disclaimer: str


class BatchItemPreview(BaseModel):
    id: str
    time_sec: float
    amount: float
    predicted_class: int
    risk_score: float
    risk_level: str


class BatchPredictionResponse(BaseModel):
    total_processed: int
    fraud_detected: int
    legitimate_count: int
    fraud_rate_percentage: float
    average_risk_score: float
    processing_time_ms: float
    preview_items: List[BatchItemPreview]
    message: str


class TransactionDetailResponse(BaseModel):
    id: str
    timestamp: str
    time_sec: float
    amount: float
    predicted_class: int
    risk_score: float
    risk_level: str
    model_version: str
    source: str
    explanation: Optional[str]
    features: Dict[str, float]


class PaginatedTransactionsResponse(BaseModel):
    items: List[TransactionDetailResponse]
    total: int
    page: int
    page_size: int
    total_pages: int
    summary: Dict[str, Any]
