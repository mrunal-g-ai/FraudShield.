"""
FraudShield ML Preprocessing Pipeline
Handles feature definitions, column scaling (RobustScaler for Time/Amount),
and feature verification.
"""

from typing import List, Tuple
import numpy as np
import pandas as pd
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import RobustScaler

# The 30 canonical input features of the Credit Card Fraud Detection benchmark dataset
PCA_FEATURES: List[str] = [f"V{i}" for i in range(1, 29)]
TIME_FEATURE: str = "Time"
AMOUNT_FEATURE: str = "Amount"
TARGET_COLUMN: str = "Class"

FEATURE_COLUMNS: List[str] = [TIME_FEATURE] + PCA_FEATURES + [AMOUNT_FEATURE]


class FraudFeaturePreprocessor(BaseEstimator, TransformerMixin):
    """
    Preprocessor tailored for credit card fraud detection:
    - Scales 'Time' and 'Amount' using RobustScaler (resistant to extreme transaction outliers)
    - Leaves V1-V28 intact as they are already PCA-transformed with standard Gaussian properties
    """

    def __init__(self):
        self.time_scaler = RobustScaler()
        self.amount_scaler = RobustScaler()
        self.is_fitted = False

    def fit(self, X: pd.DataFrame, y=None):
        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=FEATURE_COLUMNS)

        self.time_scaler.fit(X[[TIME_FEATURE]])
        self.amount_scaler.fit(X[[AMOUNT_FEATURE]])
        self.is_fitted = True
        return self

    def transform(self, X: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise RuntimeError("Preprocessor has not been fitted yet.")

        if not isinstance(X, pd.DataFrame):
            X = pd.DataFrame(X, columns=FEATURE_COLUMNS)

        # Ensure all required columns exist
        missing = [col for col in FEATURE_COLUMNS if col not in X.columns]
        if missing:
            raise ValueError(f"Input data is missing required feature columns: {missing}")

        X_transformed = X.copy()
        X_transformed[TIME_FEATURE] = self.time_scaler.transform(X[[TIME_FEATURE]])
        X_transformed[AMOUNT_FEATURE] = self.amount_scaler.transform(X[[AMOUNT_FEATURE]])

        # Return ordered columns matching FEATURE_COLUMNS
        return X_transformed[FEATURE_COLUMNS].to_numpy(dtype=np.float64)


def validate_dataframe_schema(df: pd.DataFrame) -> Tuple[bool, List[str]]:
    """
    Validates whether an input DataFrame conforms to the expected feature schema.
    Returns (is_valid, list_of_errors).
    """
    errors = []
    missing_cols = [col for col in FEATURE_COLUMNS if col not in df.columns]
    if missing_cols:
        errors.append(f"Missing required columns ({len(missing_cols)}): {', '.join(missing_cols[:5])}...")

    # Check for NaN / null values
    if not missing_cols:
        nan_counts = df[FEATURE_COLUMNS].isna().sum()
        cols_with_nans = nan_counts[nan_counts > 0]
        if not cols_with_nans.empty:
            errors.append(f"Contains null/NaN values in columns: {list(cols_with_nans.index)}")

    return len(errors) == 0, errors
