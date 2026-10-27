"""
FraudShield ML Training & Model Selection Pipeline
Trains Logistic Regression (baseline) and Random Forest (ensemble),
evaluates both on a held-out test split, exports model artifacts (.joblib),
and saves comprehensive evaluation metrics (model_metrics.json).
"""

import json
import time
from datetime import datetime
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline

from backend.ml.preprocessing import (
    FraudFeaturePreprocessor,
    FEATURE_COLUMNS,
    TARGET_COLUMN,
    PCA_FEATURES,
    TIME_FEATURE,
    AMOUNT_FEATURE,
)
from backend.ml.dataset_generator import load_or_create_dataset
from backend.ml.evaluate import evaluate_model

MODELS_DIR = Path(__file__).resolve().parent.parent / "models"


def run_training_pipeline():
    print("=" * 60)
    print("[INFO] Starting FraudShield Machine Learning Training Pipeline")
    print("=" * 60)

    MODELS_DIR.mkdir(parents=True, exist_ok=True)

    # 1. Load dataset
    df = load_or_create_dataset()
    total_samples = len(df)
    fraud_count = int((df[TARGET_COLUMN] == 1).sum())
    legit_count = int((df[TARGET_COLUMN] == 0).sum())
    fraud_rate = fraud_count / total_samples

    print(f"\n[1/6] Dataset Loaded:")
    print(f"      Total records: {total_samples:,}")
    print(f"      Legitimate: {legit_count:,} ({legit_count/total_samples*100:.2f}%)")
    print(f"      Fraudulent: {fraud_count:,} ({fraud_rate*100:.3f}%)")

    # 2. Train / Test Stratified Split (80% train, 20% test)
    X = df[FEATURE_COLUMNS]
    y = df[TARGET_COLUMN].to_numpy()

    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )

    print(f"\n[2/6] Stratified Split:")
    print(f"      Train set: {len(X_train_raw):,} samples ({int(y_train.sum())} frauds)")
    print(f"      Test set:  {len(X_test_raw):,} samples ({int(y_test.sum())} frauds)")

    # 3. Fit Preprocessor exclusively on training data (strictly no data leakage)
    print("\n[3/6] Fitting Preprocessor (RobustScaler on Time & Amount)...")
    preprocessor = FraudFeaturePreprocessor()
    preprocessor.fit(X_train_raw)

    X_train_prep = preprocessor.transform(X_train_raw)
    X_test_prep = preprocessor.transform(X_test_raw)

    # 4. Model 1: Logistic Regression (Interpretable Linear Baseline)
    print("\n[4/6] Training Model 1: Logistic Regression (class_weight='balanced')...")
    start_lr = time.time()
    lr_model = LogisticRegression(
        class_weight="balanced",
        max_iter=1000,
        C=0.1,
        random_state=42,
        solver="lbfgs"
    )
    lr_model.fit(X_train_prep, y_train)
    lr_duration = time.time() - start_lr
    print(f"      Done in {lr_duration:.2f}s")

    lr_eval = evaluate_model("Logistic Regression", lr_model, X_test_prep, y_test, threshold=0.5)
    print(f"      LR Recall: {lr_eval['metrics']['recall']:.4f} | Precision: {lr_eval['metrics']['precision']:.4f} | PR-AUC: {lr_eval['metrics']['pr_auc']:.4f}")

    # 5. Model 2: Random Forest (Ensemble Classifier)
    print("\n[5/6] Training Model 2: Random Forest Classifier (class_weight='balanced')...")
    start_rf = time.time()
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=12,
        class_weight="balanced",
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train_prep, y_train)
    rf_duration = time.time() - start_rf
    print(f"      Done in {rf_duration:.2f}s")

    rf_eval = evaluate_model("Random Forest", rf_model, X_test_prep, y_test, threshold=0.5)
    print(f"      RF Recall: {rf_eval['metrics']['recall']:.4f} | Precision: {rf_eval['metrics']['precision']:.4f} | PR-AUC: {rf_eval['metrics']['pr_auc']:.4f}")

    # 6. Model Selection based on PR-AUC & F1-Score (industry standard for severe class imbalance)
    best_name = "Random Forest" if rf_eval["metrics"]["pr_auc"] >= lr_eval["metrics"]["pr_auc"] else "Logistic Regression"
    best_clf = rf_model if best_name == "Random Forest" else lr_model
    print(f"\n[6/6] Selected Primary Production Model: {best_name}")

    # Compute Feature Importances (from Random Forest)
    importances = rf_model.feature_importances_
    sorted_feat_idx = np.argsort(importances)[::-1]
    top_features = [
        {"feature": FEATURE_COLUMNS[idx], "importance": round(float(importances[idx]), 4)}
        for idx in sorted_feat_idx[:10]
    ]

    # Build end-to-end inference pipelines (bundle preprocessor + classifier together)
    best_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", best_clf)
    ])

    lr_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", lr_model)
    ])

    rf_pipeline = Pipeline([
        ("preprocessor", preprocessor),
        ("classifier", rf_model)
    ])

    # Save artifacts
    best_model_path = MODELS_DIR / "best_model.joblib"
    lr_model_path = MODELS_DIR / "logistic_regression.joblib"
    rf_model_path = MODELS_DIR / "random_forest.joblib"
    metrics_path = MODELS_DIR / "model_metrics.json"

    joblib.dump(best_pipeline, best_model_path)
    joblib.dump(lr_pipeline, lr_model_path)
    joblib.dump(rf_pipeline, rf_model_path)

    metadata = {
        "version": "1.0.0",
        "trained_at": datetime.utcnow().isoformat() + "Z",
        "selected_model": best_name,
        "dataset_summary": {
            "total_samples": total_samples,
            "train_samples": len(X_train_raw),
            "test_samples": len(X_test_raw),
            "fraud_count": fraud_count,
            "legitimate_count": legit_count,
            "fraud_rate": round(float(fraud_rate), 6),
            "features_count": len(FEATURE_COLUMNS),
        },
        "models": {
            "logistic_regression": lr_eval,
            "random_forest": rf_eval,
        },
        "top_features": top_features,
        "selected_metrics": rf_eval if best_name == "Random Forest" else lr_eval,
    }

    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("\n[SUCCESS] Training Complete. Artifacts saved:")
    print(f"   - {best_model_path}")
    print(f"   - {metrics_path}")
    print("=" * 60)
    return metadata


if __name__ == "__main__":
    run_training_pipeline()
