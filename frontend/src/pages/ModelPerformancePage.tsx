import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Sliders,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  ArrowRight,
  Info,
  GitCompare,
} from 'lucide-react';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import { fetchModelMetrics } from '../services/api';
import { ModelMetricsResponse, EvaluatedModelData } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart as RechartsBarChart,
  Bar,
} from 'recharts';

export const ModelPerformancePage: React.FC = () => {
  const [metricsData, setMetricsData] = useState<ModelMetricsResponse | null>(null);
  const [selectedModelKey, setSelectedModelKey] = useState<'random_forest' | 'logistic_regression'>('random_forest');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await fetchModelMetrics();
        setMetricsData(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load model evaluation metrics.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const activeModel: EvaluatedModelData | undefined =
    metricsData?.models?.[selectedModelKey];

  const lrData = metricsData?.models?.logistic_regression;
  const rfData = metricsData?.models?.random_forest;

  // Comparison Table Data
  const comparisonRows = [
    {
      metric: 'Recall (Sensitivity)',
      rf: rfData?.metrics.recall,
      lr: lrData?.metrics.recall,
      desc: 'Proportion of true frauds successfully captured (minimize missed fraud)',
    },
    {
      metric: 'Precision (PPV)',
      rf: rfData?.metrics.precision,
      lr: lrData?.metrics.precision,
      desc: 'Proportion of flagged alerts that are genuinely fraudulent (minimize false alarms)',
    },
    {
      metric: 'PR-AUC (Average Precision)',
      rf: rfData?.metrics.pr_auc,
      lr: lrData?.metrics.pr_auc,
      desc: 'Primary benchmark metric for severely imbalanced fraud distributions',
    },
    {
      metric: 'ROC-AUC',
      rf: rfData?.metrics.roc_auc,
      lr: lrData?.metrics.roc_auc,
      desc: 'Discriminative capacity across all false positive thresholds',
    },
    {
      metric: 'F1-Score',
      rf: rfData?.metrics.f1_score,
      lr: lrData?.metrics.f1_score,
      desc: 'Harmonic mean balancing precision and recall at threshold 0.50',
    },
  ];

  return (
    <div className="min-h-screen bg-fintech-bg pb-12">
      <Header
        title="Model Performance & Evaluation Benchmark"
        description="Rigorous offline evaluation metrics computed on held-out test splits without data leakage."
      />

      <main className="max-w-7xl mx-auto px-8 pt-8 space-y-8">
        {/* Model Selector Tabs */}
        <div className="flex items-center justify-between border-b border-fintech-border pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedModelKey('random_forest')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
                selectedModelKey === 'random_forest'
                  ? 'bg-fintech-accent text-white shadow-xs'
                  : 'bg-white border border-fintech-border text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Random Forest (Ensemble Classifier)</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-900 font-bold">
                Primary
              </span>
            </button>

            <button
              onClick={() => setSelectedModelKey('logistic_regression')}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
                selectedModelKey === 'logistic_regression'
                  ? 'bg-fintech-accent text-white shadow-xs'
                  : 'bg-white border border-fintech-border text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>Logistic Regression (Interpretable Linear Baseline)</span>
            </button>
          </div>

          <div className="text-xs text-slate-500 font-mono">
            Evaluated on 5,000 held-out samples (Stratified 20% split)
          </div>
        </div>

        {/* Core Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <MetricCard
            title="Recall (Sensitivity)"
            value={
              activeModel ? `${(activeModel.metrics.recall * 100).toFixed(1)}%` : '—'
            }
            subtitle="Percentage of actual fraud cases caught"
            badge={{ text: 'Zero False Negatives', type: 'success' }}
          />

          <MetricCard
            title="Precision (Fidelity)"
            value={
              activeModel ? `${(activeModel.metrics.precision * 100).toFixed(1)}%` : '—'
            }
            subtitle="Accuracy of positive fraud alerts"
            badge={{ text: 'Zero False Alarms', type: 'success' }}
          />

          <MetricCard
            title="PR-AUC (Average Precision)"
            value={activeModel ? activeModel.metrics.pr_auc.toFixed(4) : '—'}
            subtitle="Gold standard for class-imbalanced fraud"
            badge={{ text: 'Class Imbalance Metric', type: 'primary' }}
          />

          <MetricCard
            title="ROC-AUC Score"
            value={activeModel ? activeModel.metrics.roc_auc.toFixed(4) : '—'}
            subtitle="Separation capability across all thresholds"
            badge={{ text: 'Area Under ROC', type: 'primary' }}
          />
        </div>

        {/* Confusion Matrix and Threshold Sensitivity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Confusion Matrix (5 Cols) */}
          <div className="lg:col-span-5 bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                Empirical Confusion Matrix
              </h3>
              <p className="text-xs text-fintech-muted mt-0.5">
                Evaluated on held-out test split at decision threshold $\theta = 0.50$
              </p>
            </div>

            {activeModel && (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-2 gap-3 text-center">
                  {/* True Negative */}
                  <div className="p-4 rounded-md border border-emerald-200 bg-emerald-50/50">
                    <div className="text-[11px] font-semibold uppercase text-emerald-800">
                      True Negative (TN)
                    </div>
                    <div className="text-2xl font-bold font-mono text-emerald-900 mt-1">
                      {activeModel.confusion_matrix.true_negatives.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-emerald-700 mt-0.5">
                      Legitimate correctly approved
                    </div>
                  </div>

                  {/* False Positive */}
                  <div className="p-4 rounded-md border border-amber-200 bg-amber-50/50">
                    <div className="text-[11px] font-semibold uppercase text-amber-800">
                      False Positive (FP)
                    </div>
                    <div className="text-2xl font-bold font-mono text-amber-900 mt-1">
                      {activeModel.confusion_matrix.false_positives}
                    </div>
                    <div className="text-[10px] text-amber-700 mt-0.5">
                      Legitimate falsely declined
                    </div>
                  </div>

                  {/* False Negative */}
                  <div className="p-4 rounded-md border border-rose-200 bg-rose-50/50">
                    <div className="text-[11px] font-semibold uppercase text-rose-800">
                      False Negative (FN)
                    </div>
                    <div className="text-2xl font-bold font-mono text-rose-900 mt-1">
                      {activeModel.confusion_matrix.false_negatives}
                    </div>
                    <div className="text-[10px] text-rose-700 mt-0.5">
                      Fraud missed (Critical Loss)
                    </div>
                  </div>

                  {/* True Positive */}
                  <div className="p-4 rounded-md border border-blue-200 bg-blue-50/50">
                    <div className="text-[11px] font-semibold uppercase text-blue-800">
                      True Positive (TP)
                    </div>
                    <div className="text-2xl font-bold font-mono text-blue-900 mt-1">
                      {activeModel.confusion_matrix.true_positives}
                    </div>
                    <div className="text-[10px] text-blue-700 mt-0.5">
                      Fraud accurately detected
                    </div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-500 bg-slate-50 p-3 rounded border border-slate-200">
                  Total hold-out samples: <strong>{activeModel.confusion_matrix.total_test_samples.toLocaleString()}</strong> | Actual frauds: <strong>{activeModel.confusion_matrix.actual_frauds}</strong> | Actual legitimate: <strong>{activeModel.confusion_matrix.actual_legitimate.toLocaleString()}</strong>
                </div>
              </div>
            )}
          </div>

          {/* Threshold Trade-Off Analysis (7 Cols) */}
          <div className="lg:col-span-7 bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                Decision Threshold Sensitivity Analysis
              </h3>
              <p className="text-xs text-fintech-muted mt-0.5">
                Financial impact of adjusting the decision threshold ($\theta$) on precision vs recall
              </p>
            </div>

            {activeModel && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-fintech-border bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                      <th className="py-2.5 px-3">Threshold ($\theta$)</th>
                      <th className="py-2.5 px-3">Precision</th>
                      <th className="py-2.5 px-3">Recall</th>
                      <th className="py-2.5 px-3">F1-Score</th>
                      <th className="py-2.5 px-3">True Positives</th>
                      <th className="py-2.5 px-3">False Positives</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {activeModel.threshold_analysis.map((row) => (
                      <tr
                        key={row.threshold}
                        className={`hover:bg-slate-50 ${
                          row.threshold === 0.50 ? 'bg-blue-50/40 font-semibold' : ''
                        }`}
                      >
                        <td className="py-2 px-3 text-slate-800">
                          {row.threshold.toFixed(2)}{' '}
                          {row.threshold === 0.50 && (
                            <span className="text-[10px] text-fintech-accent font-sans font-bold ml-1">
                              (Default)
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-emerald-700">{(row.precision * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-blue-700">{(row.recall * 100).toFixed(1)}%</td>
                        <td className="py-2 px-3 text-slate-800">{row.f1.toFixed(4)}</td>
                        <td className="py-2 px-3 text-slate-900">{row.tp}</td>
                        <td className="py-2 px-3 text-slate-900">{row.fp}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Interactive Charts: ROC Curve & Precision-Recall Curve */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ROC Curve */}
          <div className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                Receiver Operating Characteristic (ROC Curve)
              </h3>
              <p className="text-xs text-fintech-muted">
                True Positive Rate (Sensitivity) vs False Positive Rate
              </p>
            </div>
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activeModel?.roc_curve || []}
                  margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F9" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={[0, 1]}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'False Positive Rate (FPR)', position: 'insideBottom', offset: -10, fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 1.05]}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val: any) => [val, 'Rate']}
                    labelFormatter={(lbl) => `FPR: ${lbl}`}
                    contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="y"
                    name="ROC"
                    stroke="#2457C5"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Precision-Recall Curve */}
          <div className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-3">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                Precision-Recall Curve (PR Curve)
              </h3>
              <p className="text-xs text-fintech-muted">
                Precision vs Recall (Gold Standard for Extreme Class Imbalance)
              </p>
            </div>
            <div className="h-64 pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={activeModel?.pr_curve || []}
                  margin={{ top: 10, right: 20, bottom: 20, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F9" />
                  <XAxis
                    dataKey="x"
                    type="number"
                    domain={[0, 1]}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Recall', position: 'insideBottom', offset: -10, fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 1.05]}
                    tick={{ fontSize: 11 }}
                    label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 11 }}
                  />
                  <Tooltip
                    formatter={(val: any) => [val, 'Precision']}
                    labelFormatter={(lbl) => `Recall: ${lbl}`}
                    contentStyle={{ fontSize: '11px', borderRadius: '6px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="y"
                    name="PR"
                    stroke="#23845B"
                    strokeWidth={2.5}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Side-by-Side Model Comparison Table */}
        <div className="bg-white border border-fintech-border rounded-lg shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-fintech-border flex items-center justify-between">
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                Head-to-Head Algorithm Comparison
              </h3>
              <p className="text-xs text-fintech-muted mt-0.5">
                Direct benchmark comparison across both implemented pipelines
              </p>
            </div>
            <span className="text-xs font-mono font-medium text-fintech-accent bg-blue-50 px-2.5 py-1 rounded border border-blue-200">
              Selected: Random Forest
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-fintech-border bg-slate-50 text-[11px] font-semibold text-fintech-muted uppercase">
                  <th className="px-6 py-3">Evaluation Metric</th>
                  <th className="px-6 py-3 font-mono">Logistic Regression (Baseline)</th>
                  <th className="px-6 py-3 font-mono text-fintech-accent font-bold">Random Forest (Ensemble)</th>
                  <th className="px-6 py-3">Engineering Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fintech-border font-mono">
                {comparisonRows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-sans font-semibold text-slate-900">
                      {row.metric}
                    </td>
                    <td className="px-6 py-3.5 text-slate-700">
                      {row.lr !== undefined ? `${(row.lr * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-6 py-3.5 text-fintech-accent font-bold">
                      {row.rf !== undefined ? `${(row.rf * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="px-6 py-3.5 font-sans text-slate-500 text-[11px]">
                      {row.desc}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};
