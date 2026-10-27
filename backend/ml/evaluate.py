"""
FraudShield ML Evaluation Utility
Calculates comprehensive metrics for imbalanced fraud classification:
- Confusion Matrix (TP, FP, TN, FN)
- Precision, Recall, F1-Score, Balanced Accuracy
- ROC-AUC and Precision-Recall AUC (Average Precision)
- Sampled ROC and PR curve data for frontend Recharts plotting
- Multi-threshold sensitivity trade-off analysis
"""

from typing import Dict, Any, List
import numpy as np
from sklearn.metrics import (
    confusion_matrix,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    average_precision_score,
    balanced_accuracy_score,
    roc_curve,
    precision_recall_curve,
)


def sample_curve(x: np.ndarray, y: np.ndarray, n_points: int = 40) -> List[Dict[str, float]]:
    """Uniformly samples curve points to keep JSON payloads lightweight and fast for UI charts."""
    if len(x) <= n_points:
        return [{"x": round(float(xi), 4), "y": round(float(yi), 4)} for xi, yi in zip(x, y)]

    indices = np.linspace(0, len(x) - 1, n_points, dtype=int)
    return [{"x": round(float(x[i]), 4), "y": round(float(y[i]), 4)} for i in indices]


def evaluate_model(
    name: str,
    model: Any,
    X_test: np.ndarray,
    y_test: np.ndarray,
    threshold: float = 0.5
) -> Dict[str, Any]:
    """
    Computes rigorous performance evaluation metrics on the held-out test split.
    """
    # Get probability predictions for fraud class (Class = 1)
    if hasattr(model, "predict_proba"):
        y_prob = model.predict_proba(X_test)[:, 1]
    elif hasattr(model, "decision_function"):
        scores = model.decision_function(X_test)
        # Sigmoid calibration
        y_prob = 1.0 / (1.0 + np.exp(-scores))
    else:
        y_prob = model.predict(X_test).astype(float)

    # Class predictions at chosen decision threshold
    y_pred = (y_prob >= threshold).astype(int)

    # Confusion Matrix
    cm = confusion_matrix(y_test, y_pred)
    tn, fp, fn, tp = cm.ravel()

    # Core Metrics
    precision = precision_score(y_test, y_pred, zero_division=0)
    recall = recall_score(y_test, y_pred, zero_division=0)
    f1 = f1_score(y_test, y_pred, zero_division=0)
    bal_acc = balanced_accuracy_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_prob)
    pr_auc = average_precision_score(y_test, y_prob)

    # ROC Curve
    fpr, tpr, _ = roc_curve(y_test, y_prob)
    roc_curve_data = sample_curve(fpr, tpr, n_points=35)

    # Precision-Recall Curve
    precisions, recalls, _ = precision_recall_curve(y_test, y_prob)
    pr_curve_data = sample_curve(recalls, precisions, n_points=35)

    # Threshold Sensitivity Analysis
    thresholds = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9]
    threshold_analysis = []
    for th in thresholds:
        yp = (y_prob >= th).astype(int)
        c_th = confusion_matrix(y_test, yp)
        tn_t, fp_t, fn_t, tp_t = c_th.ravel()
        p_t = precision_score(y_test, yp, zero_division=0)
        r_t = recall_score(y_test, yp, zero_division=0)
        f_t = f1_score(y_test, yp, zero_division=0)
        threshold_analysis.append({
            "threshold": th,
            "precision": round(float(p_t), 4),
            "recall": round(float(r_t), 4),
            "f1": round(float(f_t), 4),
            "tp": int(tp_t),
            "fp": int(fp_t),
            "tn": int(tn_t),
            "fn": int(fn_t),
        })

    return {
        "model_name": name,
        "decision_threshold": threshold,
        "metrics": {
            "precision": round(float(precision), 4),
            "recall": round(float(recall), 4),
            "f1_score": round(float(f1), 4),
            "roc_auc": round(float(roc_auc), 4),
            "pr_auc": round(float(pr_auc), 4),
            "balanced_accuracy": round(float(bal_acc), 4),
        },
        "confusion_matrix": {
            "true_negatives": int(tn),
            "false_positives": int(fp),
            "false_negatives": int(fn),
            "true_positives": int(tp),
            "total_test_samples": int(len(y_test)),
            "actual_frauds": int(tp + fn),
            "actual_legitimate": int(tn + fp),
        },
        "roc_curve": roc_curve_data,
        "pr_curve": pr_curve_data,
        "threshold_analysis": threshold_analysis,
    }
