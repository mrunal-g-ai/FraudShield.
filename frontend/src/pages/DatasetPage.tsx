import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Database,
  Download,
  AlertTriangle,
  FileSpreadsheet,
  CheckCircle,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { fetchDatasetSummary } from '../services/api';
import { DatasetSummary } from '../types';

export const DatasetPage: React.FC = () => {
  const [summary, setSummary] = useState<DatasetSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDatasetSummary();
        setSummary(data);
      } catch (e) {
        console.error('Failed to load dataset summary', e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalRecords = summary?.total_records || 25000;
  const fraudRecords = summary?.fraud_count || 88;
  const legitRecords = summary?.legitimate_count || 24912;
  const fraudRate = summary?.fraud_rate_percentage || 0.35;

  return (
    <div className="min-h-screen bg-fintech-bg pb-12">
      <Header
        title="Dataset Architecture & Schema Reference"
        description="Comprehensive documentation of benchmark credit card transactions, feature distributions, and class imbalance."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/sample-template"
              download="fraudshield_template.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-fintech-border hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Download Feature Template</span>
            </a>
            <a
              href="/api/sample-batch"
              download="sample_test_batch.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-blue-50 border border-blue-200 hover:bg-blue-100/60 text-fintech-accent text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Test Batch CSV</span>
            </a>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-8 pt-8 space-y-8">
        {/* Dataset Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Total Benchmark Records"
            value={totalRecords.toLocaleString()}
            subtitle="Full 48-hour recording window"
            badge={{ text: 'Verified', type: 'primary' }}
          />

          <MetricCard
            title="Legitimate Transactions"
            value={legitRecords.toLocaleString()}
            subtitle={`${(100 - fraudRate).toFixed(2)}% of total volume`}
            badge={{ text: 'Majority Class', type: 'success' }}
          />

          <MetricCard
            title="Fraudulent Transactions"
            value={fraudRecords.toLocaleString()}
            subtitle={`Extreme minority class (${fraudRate.toFixed(3)}%)`}
            badge={{ text: 'Minority Class', type: 'danger' }}
          />

          <MetricCard
            title="Class Imbalance Ratio"
            value="~570 : 1"
            subtitle="1 fraud per ~570 legitimate transactions"
            badge={{ text: 'Severe Skew', type: 'neutral' }}
          />
        </div>

        {/* Severe Class Imbalance Visual Breakdown */}
        <div className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                Class Imbalance Manifestation
              </h3>
              <p className="text-xs text-fintech-muted mt-0.5">
                Visualizing why standard machine learning accuracy is a misleading metric for credit card fraud detection
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500">
              Imbalance Ratio: {summary?.imbalance_ratio || '~570 : 1'}
            </span>
          </div>

          <div className="space-y-2">
            <div className="w-full bg-slate-100 rounded-lg h-8 overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-600 h-full flex items-center justify-start px-3 text-white text-xs font-semibold"
                style={{ width: `${100 - fraudRate}%` }}
              >
                Legitimate ({(100 - fraudRate).toFixed(2)}%)
              </div>
              <div
                className="bg-rose-600 h-full flex items-center justify-center text-white text-[10px] font-bold"
                style={{ width: `${Math.max(fraudRate, 0.8)}%` }}
              >
                Fraud
              </div>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed pt-1">
              <strong>The Accuracy Paradox:</strong> A trivial model that blindly guesses &quot;Legitimate&quot; on every single transaction will achieve <strong>{(100 - fraudRate).toFixed(2)}% accuracy</strong>, yet miss <strong>100% of all fraudulent transactions</strong>. This is why FraudShield strictly prioritizes <strong>Recall</strong>, <strong>Precision</strong>, and <strong>PR-AUC</strong> instead of raw accuracy.
            </p>
          </div>
        </div>

        {/* Feature Schema Specifications */}
        <div className="bg-white border border-fintech-border rounded-lg shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-fintech-border flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                Expected Feature Schema Contract (30 Input Dimensions)
              </h3>
              <p className="text-xs text-fintech-muted mt-0.5">
                Exact mathematical feature format expected by the inference and batch pipeline
              </p>
            </div>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
              Columns: 30 Features + Class Target
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-fintech-border bg-slate-50 text-[11px] font-semibold text-fintech-muted uppercase">
                  <th className="px-6 py-3">Feature Name</th>
                  <th className="px-6 py-3">Data Type</th>
                  <th className="px-6 py-3">Scaling / Transform</th>
                  <th className="px-6 py-3">Domain Interpretation & Role</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fintech-border">
                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">Time</td>
                  <td className="px-6 py-3 font-mono text-slate-600">Float64</td>
                  <td className="px-6 py-3 font-mono text-blue-700 font-medium">RobustScaler</td>
                  <td className="px-6 py-3 text-slate-700">
                    Number of seconds elapsed from the start of recording window. Models diurnal spending waves.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">Amount</td>
                  <td className="px-6 py-3 font-mono text-slate-600">Float64</td>
                  <td className="px-6 py-3 font-mono text-blue-700 font-medium">RobustScaler</td>
                  <td className="px-6 py-3 text-slate-700">
                    Financial transaction charge in standard currency. Heavy right skew; scaled using median and IQR.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 bg-blue-50/20">
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">V14, V12, V10, V17</td>
                  <td className="px-6 py-3 font-mono text-slate-600">Float64</td>
                  <td className="px-6 py-3 font-mono text-slate-600">Identity (PCA Standardized)</td>
                  <td className="px-6 py-3 text-slate-700">
                    <strong>Primary Negative Risk Drivers:</strong> Large negative deviations (&lt; -3.0) correlate heavily with compromised authorization signatures.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 bg-blue-50/20">
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">V4, V11, V2</td>
                  <td className="px-6 py-3 font-mono text-slate-600">Float64</td>
                  <td className="px-6 py-3 font-mono text-slate-600">Identity (PCA Standardized)</td>
                  <td className="px-6 py-3 text-slate-700">
                    <strong>Primary Positive Risk Drivers:</strong> Sharp positive spikes (&gt; +2.0) correlate with rapid transaction velocity bursts.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50">
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">V1 – V28 (All Others)</td>
                  <td className="px-6 py-3 font-mono text-slate-600">Float64</td>
                  <td className="px-6 py-3 font-mono text-slate-600">Identity (PCA Standardized)</td>
                  <td className="px-6 py-3 text-slate-700">
                    Principal components obtained via PCA to protect sensitive proprietary cardholder identities.
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 bg-slate-100/50">
                  <td className="px-6 py-3 font-mono font-bold text-slate-900">Class (Target)</td>
                  <td className="px-6 py-3 font-mono text-slate-600">Int64 (0 or 1)</td>
                  <td className="px-6 py-3 font-mono text-slate-600">Binary Label</td>
                  <td className="px-6 py-3 text-slate-700">
                    Ground-truth label: <strong>1</strong> for confirmed fraud, <strong>0</strong> for legitimate transaction.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* How to import external Kaggle dataset */}
        <div className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Database className="w-4 h-4 text-fintech-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
              Importing the Full 284,807-Row Kaggle Dataset
            </h3>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            By default, FraudShield auto-generates a statistically representative 25,000-row benchmark dataset so the application functions out of the box with zero external friction. To retrain on the complete Kaggle European Cardholders dataset (143 MB):
          </p>

          <ol className="list-decimal list-inside text-xs text-slate-700 space-y-2 pl-2">
            <li>
              Download <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">creditcard.csv</code> from Kaggle:
              <a
                href="https://www.kaggle.com/datasets/mlg-ulb/creditcardfraud"
                target="_blank"
                rel="noreferrer"
                className="text-fintech-accent font-medium hover:underline inline-flex items-center gap-1 ml-1"
              >
                Kaggle Dataset Page <ExternalLink className="w-3 h-3" />
              </a>
            </li>
            <li>
              Place the downloaded file at:
              <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded ml-1 text-slate-900">
                backend/data/creditcard.csv
              </code>
            </li>
            <li>
              Re-run the training pipeline in your terminal:
              <pre className="mt-1.5 p-2 bg-slate-900 text-slate-100 rounded font-mono text-[11px] overflow-x-auto">
                python -m backend.ml.train
              </pre>
            </li>
            <li>
              The pipeline will automatically retrain both Logistic Regression and Random Forest models on all 284,807 rows and update the serialized artifacts in <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">backend/models/</code>.
            </li>
          </ol>
        </div>
      </main>
    </div>
  );
};
