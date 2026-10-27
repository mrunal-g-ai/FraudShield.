import {
  HealthResponse,
  ModelMetricsResponse,
  SinglePredictionRequest,
  SinglePredictionResponse,
  BatchPredictionResponse,
  PaginatedTransactionsResponse,
  TransactionRecord,
  DatasetSummary,
  TransactionPreset,
} from '../types';

const API_BASE = '/api';

export async function fetchHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_BASE}/health`);
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`);
  return res.json();
}

export async function fetchModelMetrics(): Promise<ModelMetricsResponse> {
  const res = await fetch(`${API_BASE}/model/metrics`);
  if (!res.ok) throw new Error(`Failed to fetch model metrics: ${res.statusText}`);
  return res.json();
}

export async function predictSingleTransaction(
  payload: SinglePredictionRequest,
  threshold: number = 0.5
): Promise<SinglePredictionResponse> {
  const res = await fetch(`${API_BASE}/predict?threshold=${threshold}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || 'Prediction failed');
  }
  return res.json();
}

export async function predictBatchCsv(
  file: File,
  threshold: number = 0.5
): Promise<BatchPredictionResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/predict/batch?threshold=${threshold}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    const errorMsg = typeof err.detail === 'object' && err.detail.errors 
      ? err.detail.errors.join('; ') 
      : (err.detail || 'Batch processing failed');
    throw new Error(errorMsg);
  }
  return res.json();
}

export async function fetchTransactions(
  page: number = 1,
  pageSize: number = 15,
  riskLevel?: string,
  search?: string
): Promise<PaginatedTransactionsResponse> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (riskLevel && riskLevel !== 'ALL') params.append('risk_level', riskLevel);
  if (search && search.trim()) params.append('search', search.trim());

  const res = await fetch(`${API_BASE}/transactions?${params.toString()}`);
  if (!res.ok) throw new Error(`Failed to fetch transactions: ${res.statusText}`);
  return res.json();
}

export async function fetchTransactionById(id: string): Promise<TransactionRecord> {
  const res = await fetch(`${API_BASE}/transactions/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Transaction ${id} not found`);
  return res.json();
}

export async function fetchDatasetSummary(): Promise<DatasetSummary> {
  const res = await fetch(`${API_BASE}/dataset/summary`);
  if (!res.ok) throw new Error(`Failed to load dataset summary`);
  return res.json();
}

export async function fetchPresets(): Promise<TransactionPreset[]> {
  const res = await fetch(`${API_BASE}/presets`);
  if (!res.ok) throw new Error(`Failed to load transaction presets`);
  return res.json();
}
