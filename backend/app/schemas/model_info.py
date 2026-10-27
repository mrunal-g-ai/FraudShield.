"""
Schemas for Model Information, Health Check, and Evaluation Metrics
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str
    backend: str
    database: str
    model_loaded: bool
    version: str
    timestamp: str


class ModelInfoResponse(BaseModel):
    model_name: str
    version: str
    trained_at: Optional[str]
    features_count: int
    features_list: List[str]
    default_threshold: float
    description: str


class DatasetSummaryResponse(BaseModel):
    dataset_name: str
    source: str
    total_records: int
    legitimate_count: int
    fraud_count: int
    fraud_rate_percentage: float
    features_count: int
    imbalance_ratio: str
    columns: List[str]
