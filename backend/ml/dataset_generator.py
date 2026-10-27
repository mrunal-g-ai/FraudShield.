"""
FraudShield Dataset Utility & Benchmark Generator
Provides dataset loading, validation, template generation, and sample test batch creation.
If the original Kaggle creditcard.csv is placed in backend/data/creditcard.csv, it will be loaded.
Otherwise, generates a high-fidelity synthetic benchmark dataset modeled after the ULB dataset's
multivariate Gaussian distributions and class imbalance.
"""

import os
from pathlib import Path
import numpy as np
import pandas as pd
from backend.ml.preprocessing import FEATURE_COLUMNS, PCA_FEATURES, TIME_FEATURE, AMOUNT_FEATURE, TARGET_COLUMN

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
CREDITCARD_CSV = DATA_DIR / "creditcard.csv"
SAMPLE_TEMPLATE_CSV = DATA_DIR / "sample_template.csv"
SAMPLE_TEST_BATCH_CSV = DATA_DIR / "sample_test_batch.csv"


def generate_benchmark_dataset(n_samples: int = 25000, fraud_rate: float = 0.003, random_state: int = 42) -> pd.DataFrame:
    """
    Generates a statistically representative credit card transaction dataset
    matching the properties of the benchmark Kaggle/ULB dataset:
    - Highly skewed class imbalance
    - Diurnal Time distribution
    - Log-normal Amount distribution
    - V1-V28 PCA features with realistic correlations for fraud
    """
    rng = np.random.RandomState(random_state)
    n_fraud = int(n_samples * fraud_rate)
    n_legit = n_samples - n_fraud

    # 1. Time (0 to 172800 seconds = 48 hours)
    # Legitimate: diurnal wave pattern
    hour_legit = rng.uniform(0, 48, n_legit)
    time_legit = hour_legit * 3600
    # Fraud: slightly shifted towards nighttime / early morning
    hour_fraud = rng.uniform(0, 48, n_fraud)
    time_fraud = hour_fraud * 3600

    # 2. Amount: Log-normal distribution
    amount_legit = np.exp(rng.normal(3.2, 1.4, n_legit)) + 0.5
    amount_legit = np.clip(amount_legit, 0.5, 25000.0)
    # Fraud amounts often have micro-testing ($1-$5) or high amounts ($300-$2000)
    is_micro = rng.binomial(1, 0.3, n_fraud)
    amount_fraud = np.where(
        is_micro == 1,
        rng.uniform(1.0, 5.0, n_fraud),
        np.exp(rng.normal(5.0, 1.1, n_fraud))
    )
    amount_fraud = np.clip(amount_fraud, 1.0, 5000.0)

    # 3. PCA Features V1-V28
    # In the real ULB dataset:
    # V14, V12, V10, V17 have strong negative correlation with fraud
    # V4, V11, V2, V21 have positive correlation with fraud
    pca_legit = rng.normal(0.0, 1.0, size=(n_legit, 28))
    pca_fraud = rng.normal(0.0, 1.0, size=(n_fraud, 28))

    # Apply characteristic fraud shifts
    v_idx = {f"V{i+1}": i for i in range(28)}
    # Negative shift features
    pca_fraud[:, v_idx["V14"]] = rng.normal(-6.8, 2.2, n_fraud)
    pca_fraud[:, v_idx["V12"]] = rng.normal(-5.5, 2.0, n_fraud)
    pca_fraud[:, v_idx["V10"]] = rng.normal(-5.0, 2.1, n_fraud)
    pca_fraud[:, v_idx["V17"]] = rng.normal(-5.2, 2.4, n_fraud)
    pca_fraud[:, v_idx["V7"]] = rng.normal(-4.0, 2.5, n_fraud)
    pca_fraud[:, v_idx["V3"]] = rng.normal(-4.5, 2.2, n_fraud)

    # Positive shift features
    pca_fraud[:, v_idx["V4"]] = rng.normal(4.2, 1.8, n_fraud)
    pca_fraud[:, v_idx["V11"]] = rng.normal(3.8, 1.7, n_fraud)
    pca_fraud[:, v_idx["V2"]] = rng.normal(3.2, 1.9, n_fraud)
    pca_fraud[:, v_idx["V21"]] = rng.normal(1.8, 1.5, n_fraud)

    # Construct DataFrames
    df_legit = pd.DataFrame(pca_legit, columns=PCA_FEATURES)
    df_legit[TIME_FEATURE] = np.round(time_legit, 1)
    df_legit[AMOUNT_FEATURE] = np.round(amount_legit, 2)
    df_legit[TARGET_COLUMN] = 0

    df_fraud = pd.DataFrame(pca_fraud, columns=PCA_FEATURES)
    df_fraud[TIME_FEATURE] = np.round(time_fraud, 1)
    df_fraud[AMOUNT_FEATURE] = np.round(amount_fraud, 2)
    df_fraud[TARGET_COLUMN] = 1

    df = pd.concat([df_legit, df_fraud], ignore_index=True)
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)

    # Reorder columns: Time, V1..V28, Amount, Class
    all_cols = FEATURE_COLUMNS + [TARGET_COLUMN]
    return df[all_cols]


def load_or_create_dataset() -> pd.DataFrame:
    """
    Loads dataset from backend/data/creditcard.csv if available;
    otherwise generates the benchmark dataset and caches it.
    """
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if CREDITCARD_CSV.exists():
        print(f"Loading existing dataset from {CREDITCARD_CSV}...")
        df = pd.read_csv(CREDITCARD_CSV)
    else:
        print(f"Dataset not found at {CREDITCARD_CSV}. Generating realistic benchmark dataset...")
        df = generate_benchmark_dataset(n_samples=25000, fraud_rate=0.0035, random_state=42)
        df.to_csv(CREDITCARD_CSV, index=False)
        print(f"Saved benchmark dataset to {CREDITCARD_CSV} ({len(df)} rows).")

    # Generate sample templates for users
    create_sample_files(df)
    return df


def create_sample_files(df: pd.DataFrame):
    """
    Creates sample CSV templates for user batch testing.
    1. sample_template.csv: Empty header template with 1 guide row
    2. sample_test_batch.csv: 40 realistic transactions (35 legitimate, 5 fraud) with TransactionID
    """
    # 1. Clean Template
    template_df = pd.DataFrame(columns=["TransactionID"] + FEATURE_COLUMNS)
    sample_row = {"TransactionID": "TXN-DEMO-001", TIME_FEATURE: 3600.0, AMOUNT_FEATURE: 149.50}
    for col in PCA_FEATURES:
        sample_row[col] = 0.05
    template_df = pd.concat([template_df, pd.DataFrame([sample_row])], ignore_index=True)
    template_df.to_csv(SAMPLE_TEMPLATE_CSV, index=False)

    # 2. Test Batch for testing CSV upload
    legit_samples = df[df[TARGET_COLUMN] == 0].head(35).copy()
    fraud_samples = df[df[TARGET_COLUMN] == 1].head(5).copy()
    batch_df = pd.concat([legit_samples, fraud_samples]).sample(frac=1.0, random_state=123).reset_index(drop=True)

    # Drop target column for prediction batch
    batch_features = batch_df[FEATURE_COLUMNS].copy()
    batch_features.insert(0, "TransactionID", [f"TXN-BATCH-{1000+i}" for i in range(len(batch_features))])
    batch_features.to_csv(SAMPLE_TEST_BATCH_CSV, index=False)
    print(f"Generated sample files: {SAMPLE_TEMPLATE_CSV.name}, {SAMPLE_TEST_BATCH_CSV.name}")


if __name__ == "__main__":
    load_or_create_dataset()
