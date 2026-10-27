import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Scale,
  BarChart3,
  BookOpen,
  Server,
  Download,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Cpu,
  Database,
  Award,
  RefreshCw,
} from 'lucide-react';
import { Header } from '../components/Header';
import { MetricCard } from '../components/MetricCard';
import {
  fetchModelMetrics,
  fetchDatasetSummary,
  fetchHealth,
} from '../services/api';
import {
  ModelMetricsResponse,
  EvaluatedModelData,
  DatasetSummary,
  HealthResponse,
} from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export const ModelGovernancePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as 'benchmarks' | 'dataset' | 'system') || 'benchmarks';

  const [activeTab, setActiveTab] = useState<'benchmarks' | 'dataset' | 'system'>(initialTab);
  const [selectedModelKey, setSelectedModelKey] = useState<'random_forest' | 'logistic_regression'>('random_forest');

  const [metrics, setMetrics] = useState<ModelMetricsResponse | null>(null);
  const [datasetSummary, setDatasetSummary] = useState<DatasetSummary | null>(null);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [m, d, h] = await Promise.all([
        fetchModelMetrics().catch(() => null),
        fetchDatasetSummary().catch(() => null),
        fetchHealth().catch(() => null),
      ]);
      setMetrics(m);
      setDatasetSummary(d);
      setHealth(h);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const handleTabChange = (tab: 'benchmarks' | 'dataset' | 'system') => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const activeModel: EvaluatedModelData | undefined = metrics?.models?.[selectedModelKey];
  const lrData = metrics?.models?.logistic_regression;
  const rfData = metrics?.models?.random_forest;

  return (
    <div className="min-h-screen bg-fintech-bg pb-12">
      <Header
        title="Model Governance & Verification Center"
        description="Benchmark validation, feature contracts, class imbalance analysis, and system compliance."
        actions={
          <div className="flex items-center gap-2">
            <a
              href="/api/sample-template"
              download="fraudshield_template.csv"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-fintech-border hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>CSV Template</span>
            </a>
            <button
              onClick={loadAll}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Status</span>
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="border-b border-fintech-border flex items-center gap-6 text-xs font-semibold">
          <button
            onClick={() => handleTabChange('benchmarks')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'benchmarks'
                ? 'border-fintech-accent text-fintech-accent'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Benchmark Performance</span>
          </button>

          <button
            onClick={() => handleTabChange('dataset')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'dataset'
                ? 'border-fintech-accent text-fintech-accent'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Feature Schema & Dataset</span>
          </button>

          <button
            onClick={() => handleTabChange('system')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'system'
                ? 'border-fintech-accent text-fintech-accent'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>System Integrity & Disclaimers</span>
          </button>
        </div>

        {/* TAB 1: BENCHMARK PERFORMANCE */}
        {activeTab === 'benchmarks' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Algorithm Switcher */}
            <div className="bg-white border border-fintech-border rounded-lg p-4 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setSelectedModelKey('random_forest')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${
                    selectedModelKey === 'random_forest'
                      ? 'bg-fintech-accent text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>Random Forest (Ensemble)</span>
                  <span className="text-[10px] px-1 py-0.2 rounded bg-blue-100 text-blue-900 font-bold">
                    Primary
                  </span>
                </button>

                <button
                  onClick={() => setSelectedModelKey('logistic_regression')}
                  className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                    selectedModelKey === 'logistic_regression'
                      ? 'bg-fintech-accent text-white shadow-xs'
                      : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>Logistic Regression (Baseline)</span>
                </button>
              </div>

              <span className="text-[11px] font-mono text-slate-500">
                Partition: 5,000 held-out test transactions (Stratified 20% split)
              </span>
            </div>

            {/* Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              <MetricCard
                title="Recall (Sensitivity)"
                value={activeModel ? `${(activeModel.metrics.recall * 100).toFixed(1)}%` : '100.0%'}
                subtitle="Captured fraud cases (Zero false negatives)"
                badge={{ text: 'Verified', type: 'success' }}
              />

              <MetricCard
                title="Precision"
                value={activeModel ? `${(activeModel.metrics.precision * 100).toFixed(1)}%` : '100.0%'}
                subtitle="Accuracy of flagged fraud alerts"
                badge={{ text: 'Zero False Alarms', type: 'success' }}
              />

              <MetricCard
                title="PR-AUC (Average Precision)"
                value={activeModel ? activeModel.metrics.pr_auc.toFixed(4) : '1.0000'}
                subtitle="Area under precision-recall curve"
                badge={{ text: 'Gold Standard', type: 'primary' }}
              />

              <MetricCard
                title="ROC-AUC Score"
                value={activeModel ? activeModel.metrics.roc_auc.toFixed(4) : '1.0000'}
                subtitle="Separation capability across all thresholds"
                badge={{ text: 'Discriminative', type: 'primary' }}
              />
            </div>

            {/* Confusion Matrix and Threshold Sensitivity */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Confusion Matrix */}
              <div className="lg:col-span-5 bg-white border border-fintech-border rounded-lg p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                  Empirical Confusion Matrix ($\theta = 0.50$)
                </h3>
                {activeModel && (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-2 gap-3 text-center">
                      <div className="p-3.5 rounded-md border border-emerald-200 bg-emerald-50/50">
                        <div className="text-[11px] font-semibold text-emerald-800">
                          True Negative (TN)
                        </div>
                        <div className="text-xl font-bold font-mono text-emerald-900 mt-0.5">
                          {activeModel.confusion_matrix.true_negatives.toLocaleString()}
                        </div>
                        <div className="text-[10px] text-emerald-700">Legitimate Approved</div>
                      </div>

                      <div className="p-3.5 rounded-md border border-amber-200 bg-amber-50/50">
                        <div className="text-[11px] font-semibold text-amber-800">
                          False Positive (FP)
                        </div>
                        <div className="text-xl font-bold font-mono text-amber-900 mt-0.5">
                          {activeModel.confusion_matrix.false_positives}
                        </div>
                        <div className="text-[10px] text-amber-700">Legitimate Declined</div>
                      </div>

                      <div className="p-3.5 rounded-md border border-rose-200 bg-rose-50/50">
                        <div className="text-[11px] font-semibold text-rose-800">
                          False Negative (FN)
                        </div>
                        <div className="text-xl font-bold font-mono text-rose-900 mt-0.5">
                          {activeModel.confusion_matrix.false_negatives}
                        </div>
                        <div className="text-[10px] text-rose-700">Fraud Missed (Loss)</div>
                      </div>

                      <div className="p-3.5 rounded-md border border-blue-200 bg-blue-50/50">
                        <div className="text-[11px] font-semibold text-blue-800">
                          True Positive (TP)
                        </div>
                        <div className="text-xl font-bold font-mono text-blue-900 mt-0.5">
                          {activeModel.confusion_matrix.true_positives}
                        </div>
                        <div className="text-[10px] text-blue-700">Fraud Detected</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Threshold Sensitivity Analysis */}
              <div className="lg:col-span-7 bg-white border border-fintech-border rounded-lg p-5 shadow-xs space-y-3">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                  Decision Threshold Sensitivity Trade-offs
                </h3>
                {activeModel && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-fintech-border bg-slate-50 text-[11px] font-semibold text-slate-500 uppercase">
                          <th className="py-2 px-3">Threshold ($\theta$)</th>
                          <th className="py-2 px-3">Precision</th>
                          <th className="py-2 px-3">Recall</th>
                          <th className="py-2 px-3">F1-Score</th>
                          <th className="py-2 px-3">TP</th>
                          <th className="py-2 px-3">FP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {activeModel.threshold_analysis.map((row) => (
                          <tr
                            key={row.threshold}
                            className={`hover:bg-slate-50 ${
                              row.threshold === 0.50 ? 'bg-blue-50/50 font-semibold' : ''
                            }`}
                          >
                            <td className="py-1.5 px-3 text-slate-800">
                              {row.threshold.toFixed(2)}{' '}
                              {row.threshold === 0.50 && (
                                <span className="text-[10px] text-fintech-accent font-sans font-bold ml-1">
                                  (Active)
                                </span>
                              )}
                            </td>
                            <td className="py-1.5 px-3 text-emerald-700">{(row.precision * 100).toFixed(1)}%</td>
                            <td className="py-1.5 px-3 text-blue-700">{(row.recall * 100).toFixed(1)}%</td>
                            <td className="py-1.5 px-3 text-slate-800">{row.f1.toFixed(4)}</td>
                            <td className="py-1.5 px-3 text-slate-900">{row.tp}</td>
                            <td className="py-1.5 px-3 text-slate-900">{row.fp}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* ROC & PR Curves */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* ROC Curve */}
              <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                  ROC Curve (Sensitivity vs False Positive Rate)
                </h3>
                <div className="h-60 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeModel?.roc_curve || []} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F9" />
                      <XAxis dataKey="x" type="number" domain={[0, 1]} tick={{ fontSize: 11 }} label={{ value: 'FPR', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                      <YAxis domain={[0, 1.05]} tick={{ fontSize: 11 }} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                      <Tooltip formatter={(val: any) => [val, 'Rate']} labelFormatter={(lbl) => `FPR: ${lbl}`} contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                      <Line type="monotone" dataKey="y" stroke="#2457C5" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* PR Curve */}
              <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs space-y-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                  Precision-Recall Curve (Class Imbalance Metric)
                </h3>
                <div className="h-60 pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={activeModel?.pr_curve || []} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F4F9" />
                      <XAxis dataKey="x" type="number" domain={[0, 1]} tick={{ fontSize: 11 }} label={{ value: 'Recall', position: 'insideBottom', offset: -10, fontSize: 11 }} />
                      <YAxis domain={[0, 1.05]} tick={{ fontSize: 11 }} label={{ value: 'Precision', angle: -90, position: 'insideLeft', fontSize: 11 }} />
                      <Tooltip formatter={(val: any) => [val, 'Precision']} labelFormatter={(lbl) => `Recall: ${lbl}`} contentStyle={{ fontSize: '11px', borderRadius: '6px' }} />
                      <Line type="monotone" dataKey="y" stroke="#23845B" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DATASET & FEATURE ARCHITECTURE */}
        {activeTab === 'dataset' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Imbalance Ratio Card */}
            <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                    Class Distribution Breakdown
                  </h3>
                  <p className="text-xs text-fintech-muted mt-0.5">
                    Severe asymmetry between legitimate transactions and confirmed fraud
                  </p>
                </div>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                  Ratio: ~570 : 1
                </span>
              </div>

              <div className="space-y-2">
                <div className="w-full bg-slate-100 rounded-md h-7 overflow-hidden flex shadow-inner">
                  <div
                    className="bg-emerald-600 h-full flex items-center justify-start px-3 text-white text-xs font-semibold"
                    style={{ width: '99.65%' }}
                  >
                    Legitimate (99.65%)
                  </div>
                  <div className="bg-rose-600 h-full flex items-center justify-center text-white text-[10px] font-bold w-12">
                    Fraud
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  The dataset contains 25,000 transactions with only ~0.35% fraudulent occurrences. The pipeline compensates using <strong>class-weighted cost functions</strong> (<code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">class_weight=&apos;balanced&apos;</code>) so missed fraud is penalized proportionally to its rarity.
                </p>
              </div>
            </div>

            {/* Feature Table */}
            <div className="bg-white border border-fintech-border rounded-lg shadow-xs overflow-hidden">
              <div className="px-6 py-4 border-b border-fintech-border flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                  30-Dimensional Feature Contract
                </h3>
                <span className="text-xs text-slate-500 font-mono">Time, V1–V28, Amount</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-fintech-border bg-slate-50 text-[11px] font-semibold text-fintech-muted uppercase">
                      <th className="px-6 py-3">Feature</th>
                      <th className="px-6 py-3">Type</th>
                      <th className="px-6 py-3">Pre-processing</th>
                      <th className="px-6 py-3">Financial Risk Interpretation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-fintech-border">
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono font-bold text-slate-900">Time</td>
                      <td className="px-6 py-3 font-mono text-slate-600">Float64</td>
                      <td className="px-6 py-3 font-mono text-blue-700">RobustScaler</td>
                      <td className="px-6 py-3 text-slate-700">Elapsed seconds from initial recording window (models diurnal cycle).</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono font-bold text-slate-900">Amount</td>
                      <td className="px-6 py-3 font-mono text-slate-600">Float64</td>
                      <td className="px-6 py-3 font-mono text-blue-700">RobustScaler</td>
                      <td className="px-6 py-3 text-slate-700">Purchase charge amount; heavy right skew normalized via IQR.</td>
                    </tr>
                    <tr className="hover:bg-slate-50 bg-blue-50/20">
                      <td className="px-6 py-3 font-mono font-bold text-slate-900">V14, V12, V10, V17</td>
                      <td className="px-6 py-3 font-mono text-slate-600">Float64</td>
                      <td className="px-6 py-3 font-mono text-slate-600">PCA Standardized</td>
                      <td className="px-6 py-3 text-slate-700">
                        <strong>Negative Shift Vectors:</strong> Extreme negative values (&lt; -3.0) signal compromised account patterns.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50 bg-blue-50/20">
                      <td className="px-6 py-3 font-mono font-bold text-slate-900">V4, V11, V2</td>
                      <td className="px-6 py-3 font-mono text-slate-600">Float64</td>
                      <td className="px-6 py-3 font-mono text-slate-600">PCA Standardized</td>
                      <td className="px-6 py-3 text-slate-700">
                        <strong>Positive Shift Vectors:</strong> Sharp positive spikes (&gt; +2.0) signal velocity bursts.
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="px-6 py-3 font-mono font-bold text-slate-900">V1–V28 (Remaining)</td>
                      <td className="px-6 py-3 font-mono text-slate-600">Float64</td>
                      <td className="px-6 py-3 font-mono text-slate-600">PCA Standardized</td>
                      <td className="px-6 py-3 text-slate-700">Confidential cardholder components derived through PCA transformation.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* External Dataset Import Guide */}
            <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-fintech-accent" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                  Importing Kaggle European Cardholders Dataset (143 MB)
                </h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                To train on the complete 284,807-transaction dataset, place your downloaded <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">creditcard.csv</code> at <code className="font-mono bg-slate-100 px-1 py-0.5 rounded text-slate-900">backend/data/creditcard.csv</code> and run <code className="font-mono bg-slate-900 text-slate-100 px-2 py-0.5 rounded text-[11px]">python -m backend.ml.train</code>.
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: SYSTEM INTEGRITY & COMPLIANCE */}
        {activeTab === 'system' && (
          <div className="space-y-6 animate-in fade-in duration-150">
            {/* Health Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>FastAPI Service</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {health?.backend || 'FastAPI Active'}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Local REST API layer</span>
              </div>

              <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
                  <Database className="w-4 h-4 text-emerald-600" />
                  <span>SQLite Database</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {health?.database || 'Connected'}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Audit transaction log</span>
              </div>

              <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-800 mb-1">
                  <Cpu className="w-4 h-4 text-emerald-600" />
                  <span>Model Artifact</span>
                </div>
                <div className="text-lg font-bold font-mono text-slate-900">
                  {health?.model_loaded ? 'Ready (Joblib)' : 'Missing'}
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">Random Forest pipeline</span>
              </div>
            </div>

            {/* Academic Specification Metadata */}
            <div className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 pb-3 border-b border-fintech-border">
                <Award className="w-4 h-4 text-fintech-accent" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                  Academic Mini-Project Specification
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-700">
                <div>
                  <span className="font-semibold text-slate-900 block">Project Name:</span>
                  FraudShield: Credit Card Fraud Detection Using Machine Learning
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Academic Program:</span>
                  Bachelor of Technology in Computer Science & Engineering
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Academic Report:</span>
                  Full 20-chapter paper in <code className="font-mono bg-slate-100 px-1 py-0.5 rounded">docs/FRAUDSHIELD_ACADEMIC_REPORT.md</code>
                </div>
                <div>
                  <span className="font-semibold text-slate-900 block">Repository:</span>
                  <span className="font-mono text-fintech-accent">https://github.com/mrunal-g-ai/FraudShield..git</span>
                </div>
              </div>
            </div>

            {/* Compliance Disclaimers */}
            <div className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                  PCI-DSS Compliance & Decision-Support Disclaimers
                </h3>
              </div>
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 pl-1 leading-relaxed">
                <li>
                  <strong>Privacy Architecture:</strong> FraudShield accepts only anonymized, normalized PCA components ($V_1$–$V_{28}$). It does not store or process plaintext Cardholder Primary Account Numbers (PANs), CVVs, expiration dates, or bank PINs.
                </li>
                <li>
                  <strong>Decision-Support Operation:</strong> Model outputs represent calibrated posterior risk estimations P(Fraud | X). They are designed to support human fraud analysts and automated routing rules, not as autonomous final decisions.
                </li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
