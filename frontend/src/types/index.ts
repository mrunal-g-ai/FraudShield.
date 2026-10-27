export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';

export interface RiskFactor {
  feature: string;
  label: string;
  value: number;
  impact: string;
  description: string;
}

export interface SinglePredictionRequest {
  Time: number;
  Amount: number;
  [key: string]: number; // V1 - V28
}

export interface SinglePredictionResponse {
  transaction_id: string;
  timestamp: string;
  predicted_class: number;
  is_fraud: boolean;
  risk_score: number;
  risk_percentage: number;
  risk_level: RiskLevel;
  confidence: number;
  threshold_used: number;
  explanation: string;
  risk_factors: RiskFactor[];
  disclaimer: string;
}

export interface BatchItemPreview {
  id: string;
  time_sec: number;
  amount: number;
  predicted_class: number;
  risk_score: number;
  risk_level: RiskLevel;
}

export interface BatchPredictionResponse {
  total_processed: number;
  fraud_detected: number;
  legitimate_count: number;
  fraud_rate_percentage: number;
  average_risk_score: number;
  processing_time_ms: number;
  preview_items: BatchItemPreview[];
  message: string;
}

export interface TransactionRecord {
  id: string;
  timestamp: string;
  time_sec: number;
  amount: number;
  predicted_class: number;
  risk_score: number;
  risk_level: RiskLevel;
  model_version: string;
  source: string;
  explanation?: string;
  features: Record<string, number>;
}

export interface PaginatedTransactionsResponse {
  items: TransactionRecord[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  summary: {
    total_transactions: number;
    high_risk_count: number;
    medium_risk_count: number;
    low_risk_count: number;
    fraud_detected: number;
  };
}

export interface ModelMetricsItem {
  precision: number;
  recall: number;
  f1_score: number;
  roc_auc: number;
  pr_auc: number;
  balanced_accuracy: number;
}

export interface ConfusionMatrixData {
  true_negatives: number;
  false_positives: number;
  false_negatives: number;
  true_positives: number;
  total_test_samples: number;
  actual_frauds: number;
  actual_legitimate: number;
}

export interface CurvePoint {
  x: number;
  y: number;
}

export interface ThresholdAnalysisItem {
  threshold: number;
  precision: number;
  recall: number;
  f1: number;
  tp: number;
  fp: number;
  tn: number;
  fn: number;
}

export interface EvaluatedModelData {
  model_name: string;
  decision_threshold: number;
  metrics: ModelMetricsItem;
  confusion_matrix: ConfusionMatrixData;
  roc_curve: CurvePoint[];
  pr_curve: CurvePoint[];
  threshold_analysis: ThresholdAnalysisItem[];
}

export interface ModelMetricsResponse {
  version: string;
  trained_at: string;
  selected_model: string;
  dataset_summary: {
    total_samples: number;
    train_samples: number;
    test_samples: number;
    fraud_count: number;
    legitimate_count: number;
    fraud_rate: number;
    features_count: number;
  };
  models: {
    logistic_regression: EvaluatedModelData;
    random_forest: EvaluatedModelData;
  };
  top_features: Array<{ feature: string; importance: number }>;
  selected_metrics: EvaluatedModelData;
}

export interface HealthResponse {
  status: string;
  backend: string;
  database: string;
  model_loaded: boolean;
  version: string;
  timestamp: string;
}

export interface DatasetSummary {
  dataset_name: string;
  source: string;
  total_records: number;
  legitimate_count: number;
  fraud_count: number;
  fraud_rate_percentage: number;
  features_count: number;
  imbalance_ratio: string;
  columns: string[];
}

export interface TransactionPreset {
  id: string;
  name: string;
  description: string;
  data: SinglePredictionRequest;
}
