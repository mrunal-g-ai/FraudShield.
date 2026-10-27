"""
Unit & Integration Tests for FraudShield Backend API
Tests health check, prediction endpoints, batch CSV analysis, and database persistence.
"""

from pathlib import Path
import unittest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)
SAMPLE_BATCH_PATH = Path(__file__).resolve().parent.parent / "data" / "sample_test_batch.csv"


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["app"] == "FraudShield — Credit Card Fraud Detection System"
    assert data["status"] == "operational"


def test_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["model_loaded"] is True
    assert data["database"] == "connected"


def test_model_info():
    response = client.get("/api/model/info")
    assert response.status_code == 200
    data = response.json()
    assert data["features_count"] == 30
    assert "Time" in data["features_list"]
    assert "Amount" in data["features_list"]
    assert "V14" in data["features_list"]


def test_model_metrics():
    response = client.get("/api/model/metrics")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert "logistic_regression" in data["models"]
    assert "random_forest" in data["models"]
    assert "confusion_matrix" in data["models"]["random_forest"]
    assert "roc_curve" in data["models"]["random_forest"]


def test_single_prediction_legitimate():
    payload = {
        "Time": 3600.0,
        "Amount": 55.40,
        "V1": 0.1, "V2": -0.2, "V3": 0.5, "V4": -0.1, "V5": 0.05,
        "V6": 0.1, "V7": 0.0, "V8": 0.02, "V9": 0.15, "V10": -0.05,
        "V11": -0.1, "V12": 0.08, "V13": 0.2, "V14": 0.05, "V15": 0.0,
        "V16": -0.02, "V17": 0.04, "V18": -0.05, "V19": 0.01, "V20": -0.01,
        "V21": -0.02, "V22": -0.05, "V23": 0.01, "V24": 0.05, "V25": -0.02,
        "V26": 0.01, "V27": 0.0, "V28": 0.01
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "transaction_id" in data
    assert data["is_fraud"] is False
    assert data["risk_level"] in ["LOW", "MEDIUM"]
    assert "explanation" in data


def test_single_prediction_fraud_pattern():
    # Extreme negative shift in V14, V12, V10, V17 + high V4 characteristic of fraud
    payload = {
        "Time": 12000.0,
        "Amount": 1450.00,
        "V1": -3.5, "V2": 3.1, "V3": -4.2, "V4": 4.5, "V5": -2.5,
        "V6": -1.8, "V7": -4.1, "V8": 2.1, "V9": -3.2, "V10": -6.1,
        "V11": 4.5, "V12": -6.8, "V13": -0.4, "V14": -7.5, "V15": -0.5,
        "V16": -3.5, "V17": -6.5, "V18": -2.0, "V19": 1.4, "V20": 0.6,
        "V21": 1.0, "V22": 0.3, "V23": -0.4, "V24": -0.5, "V25": 0.25,
        "V26": 0.4, "V27": 0.5, "V28": 0.2
    }
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_fraud"] is True
    assert data["risk_level"] == "HIGH"
    assert data["risk_score"] > 0.7


def test_single_prediction_invalid_amount():
    payload = {"Time": 100.0, "Amount": -15.0}  # Negative amount should fail Pydantic validation
    response = client.post("/api/predict", json=payload)
    assert response.status_code == 422


def test_batch_prediction_csv():
    assert SAMPLE_BATCH_PATH.exists()
    with open(SAMPLE_BATCH_PATH, "rb") as f:
        response = client.post(
            "/api/predict/batch",
            files={"file": ("sample_test_batch.csv", f, "text/csv")}
        )
    assert response.status_code == 200
    data = response.json()
    assert data["total_processed"] > 0
    assert "fraud_detected" in data
    assert "preview_items" in data
    assert len(data["preview_items"]) > 0


def test_transactions_explorer_pagination():
    response = client.get("/api/transactions?page=1&page_size=10")
    assert response.status_code == 200
    data = response.json()
    assert "items" in data
    assert "total" in data
    assert "summary" in data
    assert data["page"] == 1


def test_dataset_summary():
    response = client.get("/api/dataset/summary")
    assert response.status_code == 200
    data = response.json()
    assert data["total_records"] > 0
    assert data["features_count"] == 30


if __name__ == "__main__":
    test_root_endpoint()
    test_health_endpoint()
    test_model_info()
    test_model_metrics()
    test_single_prediction_legitimate()
    test_single_prediction_fraud_pattern()
    test_single_prediction_invalid_amount()
    test_batch_prediction_csv()
    test_transactions_explorer_pagination()
    test_dataset_summary()
    print("[SUCCESS] All 10 backend test cases passed successfully!")
