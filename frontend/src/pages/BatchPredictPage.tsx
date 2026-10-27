import React, { useState, useRef } from 'react';
import {
  FileSpreadsheet,
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle2,
  FileCheck,
  Clock,
  DollarSign,
  TrendingUp,
  Table,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { RiskBadge } from '../components/RiskBadge';
import { predictBatchCsv } from '../services/api';
import { BatchPredictionResponse, BatchItemPreview } from '../types';

export const BatchPredictPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [threshold, setThreshold] = useState<number>(0.50);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<BatchPredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleSelectedFile(e.target.files[0]);
    }
  };

  const handleSelectedFile = (selectedFile: File) => {
    setError(null);
    setResult(null);
    if (!selectedFile.name.endsWith('.csv')) {
      setError('Invalid file type. Only standard comma-separated values (.csv) are supported.');
      return;
    }
    if (selectedFile.size > 20 * 1024 * 1024) {
      setError('File size exceeds the 20MB maximum upload threshold.');
      return;
    }
    setFile(selectedFile);
  };

  const handleUploadAndProcess = async () => {
    if (!file) {
      setError('Please choose or drop a CSV file first.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await predictBatchCsv(file, threshold);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Batch prediction failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleExportResultsCsv = () => {
    if (!result || !result.preview_items || result.preview_items.length === 0) return;

    // Generate CSV export from result preview or processed items
    const headers = ['TransactionID', 'Time', 'Amount', 'PredictedClass', 'RiskScore', 'RiskLevel'];
    const rows = result.preview_items.map((i) => [
      i.id,
      i.time_sec.toFixed(1),
      i.amount.toFixed(2),
      i.predicted_class,
      i.risk_score.toFixed(4),
      i.risk_level,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fraudshield_batch_predictions_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-fintech-bg pb-12">
      <Header
        title="Batch CSV Transaction Analysis"
        description="Ingest multiple cardholder transactions simultaneously for automated risk scoring and bulk classification."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/sample-template"
              download="fraudshield_template.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-fintech-border hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Empty Template CSV</span>
            </a>
            <a
              href="/api/sample-batch"
              download="sample_test_batch.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100/60 text-fintech-accent text-xs font-medium transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download 40-Row Test Batch</span>
            </a>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-8 pt-8 space-y-8">
        {/* Specification Note */}
        <div className="rounded-md border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-xs">
          <Info className="w-4 h-4 text-fintech-accent shrink-0 mt-0.5" />
          <div className="text-xs text-fintech-text leading-relaxed">
            <span className="font-semibold text-slate-800">CSV Feature Contract:</span> The uploaded batch CSV must contain all 30 expected feature headers:
            <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-800">Time, V1, V2, ... V28, Amount</code>.
            An optional <code className="mx-1 px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-800">TransactionID</code> column can be included for custom identifiers. Max batch size: 10,000 rows. Files are processed locally without transmission to third-party endpoints.
          </div>
        </div>

        {/* Dropzone & Control Panel */}
        <div className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-6">
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors ${
              dragActive
                ? 'border-fintech-accent bg-blue-50/40'
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 text-fintech-accent mx-auto flex items-center justify-center mb-3 shadow-xs">
              <UploadCloud className="w-6 h-6" />
            </div>
            {file ? (
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 text-sm">{file.name}</span>
                <span className="text-xs text-slate-500 block">
                  {(file.size / 1024).toFixed(1)} KB — Click to change file
                </span>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="font-semibold text-slate-900 text-sm">
                  Drag and drop your transaction CSV here
                </span>
                <span className="text-xs text-slate-500 block">
                  or click to browse your local filesystem (.csv format only)
                </span>
              </div>
            )}
          </div>

          {/* Execution Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-fintech-border">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                Decision Threshold:
              </span>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="accent-fintech-accent cursor-pointer w-32"
              />
              <span className="text-xs font-mono font-bold text-fintech-accent w-12">
                {(threshold * 100).toFixed(0)}%
              </span>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              {file && (
                <button
                  type="button"
                  onClick={() => {
                    setFile(null);
                    setResult(null);
                    setError(null);
                  }}
                  className="px-3.5 py-2 border border-slate-200 text-slate-600 rounded-md text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  Clear
                </button>
              )}
              <button
                type="button"
                onClick={handleUploadAndProcess}
                disabled={!file || loading}
                className="px-5 py-2 bg-fintech-accent hover:bg-fintech-accent-hover text-white rounded-md text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-2 shadow-xs"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Ingesting & Classifying Batch...
                  </>
                ) : (
                  <>
                    <FileCheck className="w-3.5 h-3.5" /> Execute Batch Inference
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Batch Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard
                title="Total Processed"
                value={result.total_processed.toLocaleString()}
                subtitle={`Completed in ${result.processing_time_ms} ms`}
                badge={{ text: 'Completed', type: 'primary' }}
              />

              <MetricCard
                title="Fraudulent Detections"
                value={result.fraud_detected.toLocaleString()}
                subtitle={`Fraud rate: ${result.fraud_rate_percentage.toFixed(1)}%`}
                badge={{ text: result.fraud_detected > 0 ? 'High Risk' : 'Clean', type: result.fraud_detected > 0 ? 'danger' : 'success' }}
              />

              <MetricCard
                title="Legitimate Approvals"
                value={result.legitimate_count.toLocaleString()}
                subtitle={`${((result.legitimate_count / result.total_processed) * 100).toFixed(1)}% auto-cleared`}
                badge={{ text: 'Verified', type: 'success' }}
              />

              <MetricCard
                title="Average Risk Score"
                value={`${(result.average_risk_score * 100).toFixed(1)}%`}
                subtitle={`Threshold active: ${(threshold * 100).toFixed(0)}%`}
                badge={{ text: 'Calibrated', type: 'neutral' }}
              />
            </div>

            {/* Results Table & Export Action */}
            <div className="bg-white border border-fintech-border rounded-lg shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-fintech-border flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                    Batch Output Preview (First {result.preview_items.length} records)
                  </h3>
                  <p className="text-xs text-fintech-muted mt-0.5">
                    Records have been persisted to the SQLite database audit log
                  </p>
                </div>
                <button
                  onClick={handleExportResultsCsv}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-fintech-border hover:bg-slate-50 text-fintech-text text-xs font-semibold transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5 text-fintech-accent" />
                  <span>Download Enriched Predictions CSV</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-fintech-border bg-slate-50 text-[11px] font-semibold text-fintech-muted uppercase tracking-wider">
                      <th className="px-6 py-3">Transaction ID</th>
                      <th className="px-6 py-3">Time (Sec)</th>
                      <th className="px-6 py-3 text-right">Amount</th>
                      <th className="px-6 py-3">Model Risk Score</th>
                      <th className="px-6 py-3">Classification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fintech-border text-xs">
                    {result.preview_items.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-3 font-mono font-medium text-slate-900">
                          {item.id}
                        </td>
                        <td className="px-6 py-3 font-mono text-slate-500">
                          {item.time_sec.toFixed(1)}s
                        </td>
                        <td className="px-6 py-3 text-right font-mono font-medium text-slate-900">
                          ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-3 font-mono font-semibold">
                          {(item.risk_score * 100).toFixed(1)}%
                        </td>
                        <td className="px-6 py-3">
                          <RiskBadge level={item.risk_level} score={item.risk_score} size="sm" />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
