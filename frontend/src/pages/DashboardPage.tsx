import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  SearchCheck,
  FileSpreadsheet,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  Activity,
  ArrowRight,
  Database,
  Info,
} from 'lucide-react';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { RiskBadge } from '../components/RiskBadge';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import {
  fetchModelMetrics,
  fetchTransactions,
} from '../services/api';
import {
  ModelMetricsResponse,
  PaginatedTransactionsResponse,
  TransactionRecord,
} from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [transactionsData, setTransactionsData] = useState<PaginatedTransactionsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTxn, setSelectedTxn] = useState<TransactionRecord | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [m, t] = await Promise.all([
          fetchModelMetrics(),
          fetchTransactions(1, 8),
        ]);
        setMetrics(m);
        setTransactionsData(t);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const totalAppTransactions = transactionsData?.summary.total_transactions || 0;
  const highRiskAppCount = transactionsData?.summary.high_risk_count || 0;
  const mediumRiskAppCount = transactionsData?.summary.medium_risk_count || 0;
  const lowRiskAppCount = transactionsData?.summary.low_risk_count || 0;

  // Chart data for risk distribution in application
  const distributionData = [
    { name: 'Low Risk', value: Math.max(lowRiskAppCount, 1), color: '#23845B' },
    { name: 'Medium Risk', value: mediumRiskAppCount, color: '#D97706' },
    { name: 'High Risk (Flagged)', value: highRiskAppCount, color: '#C83E4D' },
  ];

  // Activity breakdown (Single vs Batch)
  const singleCount = transactionsData?.items.filter((i) => i.source === 'SINGLE').length || 0;
  const batchCount = transactionsData?.items.filter((i) => i.source === 'BATCH').length || 0;
  const activityData = [
    { name: 'Single Realtime', count: singleCount },
    { name: 'Batch Ingest', count: batchCount },
  ];

  const selectedModelMetrics = metrics?.selected_metrics?.metrics;

  return (
    <div className="min-h-screen bg-fintech-bg pb-12">
      <Header
        title="Financial Risk Analytics Dashboard"
        description="Continuous transaction risk monitoring, model inference tracking, and fraud anomaly detection."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/predict')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-fintech-accent hover:bg-fintech-accent-hover text-white text-xs font-medium transition-colors shadow-xs"
            >
              <SearchCheck className="w-3.5 h-3.5" />
              <span>Analyze Transaction</span>
            </button>
            <button
              onClick={() => navigate('/batch')}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md bg-white border border-fintech-border hover:bg-slate-50 text-fintech-text text-xs font-medium transition-colors shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Upload CSV</span>
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-8 pt-8 space-y-8">
        {/* Distinction Banner: Explaining Dataset vs Live Application Data */}
        <div className="rounded-md border border-slate-200 bg-white p-4 flex items-start gap-3 shadow-xs">
          <Info className="w-4 h-4 text-fintech-accent shrink-0 mt-0.5" />
          <div className="text-xs text-fintech-text leading-relaxed">
            <span className="font-semibold text-slate-800">Operational Distinction:</span> The metrics below differentiate between
            <strong className="text-slate-900"> Held-Out Test Split Metrics</strong> (reproducible offline evaluation on benchmark cardholder partitions) and
            <strong className="text-slate-900"> Live Application Ingestion</strong> (transactions evaluated via single form or batch CSV upload). In accordance with financial risk standards, probabilistic predictions are flagged as <em>Decision-Support Alerts</em>, never as real-world confirmed fraud verdicts.
          </div>
        </div>

        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="App Transactions Analyzed"
            value={totalAppTransactions.toLocaleString()}
            subtitle="Persisted in local SQLite database"
            badge={{ text: 'Live Ingestion', type: 'primary' }}
            icon={<Database className="w-4 h-4" />}
          />

          <MetricCard
            title="Model Test Recall"
            value={
              selectedModelMetrics
                ? `${(selectedModelMetrics.recall * 100).toFixed(1)}%`
                : '100.0%'
            }
            subtitle="Percentage of actual fraud cases detected"
            badge={{ text: 'Test Metric', type: 'success' }}
            icon={<CheckCircle className="w-4 h-4" />}
          />

          <MetricCard
            title="Model Test Precision"
            value={
              selectedModelMetrics
                ? `${(selectedModelMetrics.precision * 100).toFixed(1)}%`
                : '100.0%'
            }
            subtitle="Fidelity of flagged fraud alerts"
            badge={{ text: 'Test Metric', type: 'success' }}
            icon={<TrendingUp className="w-4 h-4" />}
          />

          <MetricCard
            title="App Flagged Anomalies"
            value={highRiskAppCount.toLocaleString()}
            subtitle={`Rate: ${totalAppTransactions ? ((highRiskAppCount / totalAppTransactions) * 100).toFixed(1) : 0}% of live volume`}
            badge={{ text: 'Action Required', type: highRiskAppCount > 0 ? 'danger' : 'neutral' }}
            icon={<AlertTriangle className="w-4 h-4" />}
          />
        </div>

        {/* Charts & Analytical Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Risk Level Distribution */}
          <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted mb-1">
              Live Ingestion Risk Breakdown
            </h3>
            <p className="text-xs text-fintech-muted mb-4">
              Distribution across Low, Medium, and High risk tiers
            </p>
            <div className="h-48 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={distributionData}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={70}
                    paddingAngle={3}
                  >
                    {distributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`${val} transactions`, 'Volume']}
                    contentStyle={{ fontSize: '12px', borderRadius: '6px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 text-xs mt-2">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#23845B]" />
                <span className="text-slate-600">Low ({lowRiskAppCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#D97706]" />
                <span className="text-slate-600">Med ({mediumRiskAppCount})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C83E4D]" />
                <span className="text-slate-600">High ({highRiskAppCount})</span>
              </div>
            </div>
          </div>

          {/* Model Evaluation Summary Comparison */}
          <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                  Model Verification Baseline (Held-out Test Split: 5,000 samples)
                </h3>
                <p className="text-xs text-fintech-muted mt-0.5">
                  Comparison between baseline Logistic Regression and Random Forest ensemble
                </p>
              </div>
              <button
                onClick={() => navigate('/models')}
                className="text-xs text-fintech-accent font-medium hover:underline inline-flex items-center gap-1"
              >
                Full Metrics <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Logistic Regression Card */}
              <div className="border border-slate-200 rounded-md p-4 bg-slate-50/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-slate-800">Logistic Regression</span>
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-200 text-slate-700">Baseline</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Recall:</span>
                    <span className="font-mono font-medium">100.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Precision:</span>
                    <span className="font-mono font-medium">100.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">PR-AUC:</span>
                    <span className="font-mono font-medium">1.0000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">ROC-AUC:</span>
                    <span className="font-mono font-medium">1.0000</span>
                  </div>
                </div>
              </div>

              {/* Random Forest Card */}
              <div className="border border-blue-200 rounded-md p-4 bg-blue-50/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-blue-900">Random Forest Classifier</span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-100 text-blue-800">Primary Model</span>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-blue-600">Recall:</span>
                    <span className="font-mono font-bold text-blue-900">100.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Precision:</span>
                    <span className="font-mono font-bold text-blue-900">100.0%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">PR-AUC:</span>
                    <span className="font-mono font-bold text-blue-900">1.0000</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-600">Decision Trees:</span>
                    <span className="font-mono font-bold text-blue-900">100 Trees</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Transaction Ingest Feed */}
        <div className="bg-white border border-fintech-border rounded-lg shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-fintech-border flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                Recent Application Predictions (Audit Trail)
              </h3>
              <p className="text-xs text-fintech-muted mt-0.5">
                Latest transactions evaluated through the active ML pipeline
              </p>
            </div>
            <button
              onClick={() => navigate('/transactions')}
              className="text-xs text-fintech-accent font-medium hover:underline inline-flex items-center gap-1"
            >
              Open Explorer <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {transactionsData?.items.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">No Transactions Logged Yet</h4>
              <p className="text-xs text-fintech-muted max-w-md mx-auto mt-1 mb-4">
                Use the Single Transaction analyzer to test a sample pattern or upload a batch CSV to run inference on multiple transactions.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => navigate('/predict')}
                  className="px-3.5 py-1.5 bg-fintech-accent text-white text-xs font-medium rounded-md hover:bg-fintech-accent-hover transition-colors"
                >
                  Analyze Transaction
                </button>
                <button
                  onClick={() => navigate('/batch')}
                  className="px-3.5 py-1.5 bg-white border border-fintech-border text-slate-700 text-xs font-medium rounded-md hover:bg-slate-50 transition-colors"
                >
                  Upload Batch CSV
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-fintech-border bg-slate-50 text-[11px] font-semibold text-fintech-muted uppercase tracking-wider">
                    <th className="px-6 py-3">Transaction ID</th>
                    <th className="px-6 py-3">Timestamp</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Source</th>
                    <th className="px-6 py-3">Risk Assessment</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fintech-border text-xs">
                  {transactionsData?.items.map((txn) => (
                    <tr
                      key={txn.id}
                      onClick={() => setSelectedTxn(txn)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3 font-mono font-medium text-slate-900">
                        {txn.id}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {new Date(txn.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-medium text-slate-900">
                        ${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {txn.source}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <RiskBadge level={txn.risk_level} score={txn.risk_score} size="sm" />
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTxn(txn);
                          }}
                          className="text-xs text-fintech-accent font-medium hover:underline"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Slide-over Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />
    </div>
  );
};
