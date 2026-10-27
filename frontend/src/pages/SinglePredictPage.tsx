import React, { useState, useEffect } from 'react';
import {
  SearchCheck,
  RotateCcw,
  Sparkles,
  Info,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  DollarSign,
} from 'lucide-react';
import { Header } from '../components/Header';
import { RiskBadge } from '../components/RiskBadge';
import {
  predictSingleTransaction,
  fetchPresets,
} from '../services/api';
import {
  SinglePredictionRequest,
  SinglePredictionResponse,
  TransactionPreset,
} from '../types';

export const SinglePredictPage: React.FC = () => {
  const [presets, setPresets] = useState<TransactionPreset[]>([]);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('legit_grocery');
  const [threshold, setThreshold] = useState<number>(0.50);

  // Form input state: Amount, Time, V1-V28
  const [amount, setAmount] = useState<number>(42.50);
  const [timeSec, setTimeSec] = useState<number>(34200);
  const [vFeatures, setVFeatures] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (let i = 1; i <= 28; i++) initial[`V${i}`] = 0.0;
    return initial;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SinglePredictionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showAdvancedPca, setShowAdvancedPca] = useState<boolean>(false);

  // Load presets on mount
  useEffect(() => {
    async function loadPresets() {
      try {
        const data = await fetchPresets();
        setPresets(data);
        if (data.length > 0) {
          applyPreset(data[0]);
        }
      } catch (e) {
        console.error('Failed to load presets', e);
      }
    }
    loadPresets();
  }, []);

  const applyPreset = (preset: TransactionPreset) => {
    setSelectedPresetId(preset.id);
    setAmount(preset.data.Amount);
    setTimeSec(preset.data.Time);
    const newV: Record<string, number> = {};
    for (let i = 1; i <= 28; i++) {
      const key = `V${i}`;
      newV[key] = preset.data[key] ?? 0.0;
    }
    setVFeatures(newV);
    setResult(null);
    setError(null);
  };

  const handleVChange = (key: string, val: string) => {
    const num = parseFloat(val);
    setVFeatures((prev) => ({
      ...prev,
      [key]: isNaN(num) ? 0.0 : num,
    }));
  };

  const handleReset = () => {
    setAmount(50.0);
    setTimeSec(3600);
    const cleared: Record<string, number> = {};
    for (let i = 1; i <= 28; i++) cleared[`V${i}`] = 0.0;
    setVFeatures(cleared);
    setResult(null);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (amount <= 0) {
      setError('Transaction amount must be greater than zero.');
      setLoading(false);
      return;
    }

    try {
      const payload: SinglePredictionRequest = {
        Time: timeSec,
        Amount: amount,
        ...vFeatures,
      };

      const res = await predictSingleTransaction(payload, threshold);
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Inference call failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-fintech-bg pb-12">
      <Header
        title="Single Transaction Risk Analysis"
        description="Submit real-time transactional vectors to the model pipeline for probabilistic scoring and explainability."
      />

      <main className="max-w-7xl mx-auto px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Preset Selector Banner */}
          <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-fintech-accent" />
                <span className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                  Quick Scenario Presets
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Populates all 30 benchmark features
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`text-left p-3 rounded-md border text-xs transition-all ${
                    selectedPresetId === preset.id
                      ? 'bg-blue-50/50 border-fintech-accent text-fintech-accent font-medium shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 text-slate-700 hover:bg-slate-100/60'
                  }`}
                >
                  <div className="font-semibold text-slate-900">{preset.name}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                    {preset.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Transaction Input Form */}
          <form onSubmit={handleSubmit} className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-fintech-border">
              <h3 className="text-sm font-semibold text-fintech-text">
                Transaction Core Attributes
              </h3>
              <button
                type="button"
                onClick={handleReset}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Form
              </button>
            </div>

            {/* Core Features: Amount & Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <DollarSign className="w-3.5 h-3.5 text-slate-500" />
                  Transaction Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-fintech-accent focus:bg-white"
                  placeholder="e.g. 149.50"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Absolute transaction purchase amount
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  Time Elapsed (Seconds)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={timeSec}
                  onChange={(e) => setTimeSec(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:ring-1 focus:ring-fintech-accent focus:bg-white"
                  placeholder="e.g. 3600"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Seconds elapsed ({Math.floor(timeSec / 3600)}h {Math.floor((timeSec % 3600) / 60)}m in cycle)
                </span>
              </div>
            </div>

            {/* Decision Threshold Slider */}
            <div className="bg-slate-50 border border-slate-200 rounded-md p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-800">
                  Decision Threshold ($\theta$)
                </span>
                <span className="font-mono font-bold text-fintech-accent">
                  {(threshold * 100).toFixed(0)}% ({threshold.toFixed(2)})
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-full accent-fintech-accent cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>0.10 (Aggressive Fraud Flagging)</span>
                <span>0.50 (Standard Balance)</span>
                <span>0.90 (Conservative / Low Friction)</span>
              </div>
            </div>

            {/* PCA Feature Section with Accordion */}
            <div className="border border-slate-200 rounded-md overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvancedPca(!showAdvancedPca)}
                className="w-full px-4 py-3 bg-slate-50 flex items-center justify-between text-xs font-semibold text-slate-800 hover:bg-slate-100 transition-colors"
              >
                <span>PCA Dimension Vectors (V1 – V28)</span>
                <span className="text-fintech-accent font-normal">
                  {showAdvancedPca ? 'Hide Feature Grid' : 'Show & Edit 28 Features'}
                </span>
              </button>

              {showAdvancedPca && (
                <div className="p-4 bg-white space-y-3">
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Under the Kaggle/ULB European credit card dataset standard, V1–V28 are anonymized principal components derived through confidential PCA. Noticeable negative deviations in V14, V12, and V10 and positive spikes in V4 and V11 correlate with fraudulent behavior.
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto p-1 border border-slate-200 rounded bg-slate-50">
                    {Array.from({ length: 28 }, (_, i) => {
                      const key = `V${i + 1}`;
                      const val = vFeatures[key] ?? 0.0;
                      return (
                        <div key={key} className="bg-white p-2 rounded border border-slate-200">
                          <label className="block text-[10px] font-mono font-semibold text-slate-500">
                            {key}
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            value={val}
                            onChange={(e) => handleVChange(key, e.target.value)}
                            className="w-full text-xs font-mono px-1.5 py-1 border border-slate-200 rounded focus:outline-none focus:border-fintech-accent"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-fintech-accent hover:bg-fintech-accent-hover text-white rounded-md text-xs font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs disabled:opacity-50"
            >
              {loading ? (
                <>Evaluating Transaction Model Pipeline...</>
              ) : (
                <>
                  <SearchCheck className="w-4 h-4" /> Run Fraud Risk Inference
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Output Column (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          {result ? (
            <div className="bg-white border border-fintech-border rounded-lg shadow-xs p-6 space-y-6 animate-in fade-in duration-200">
              {/* Outcome Header */}
              <div className="pb-4 border-b border-fintech-border flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block">
                    ID: {result.transaction_id}
                  </span>
                  <div className="flex items-center gap-2 mt-1">
                    <h3 className="text-lg font-bold text-slate-900">
                      {result.is_fraud ? 'Potentially Fraudulent' : 'Likely Legitimate'}
                    </h3>
                  </div>
                </div>
                <RiskBadge level={result.risk_level} score={result.risk_score} size="lg" />
              </div>

              {/* Probability Risk Score Gauge */}
              <div className="bg-slate-50 border border-slate-200 rounded-md p-4">
                <div className="flex justify-between items-baseline mb-2">
                  <span className="text-xs font-semibold text-slate-700">
                    Posterior Fraud Probability:
                  </span>
                  <span className={`text-2xl font-bold font-mono ${
                    result.is_fraud ? 'text-[#C83E4D]' : 'text-[#23845B]'
                  }`}>
                    {result.risk_percentage.toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      result.risk_score >= 0.70
                        ? 'bg-[#C83E4D]'
                        : result.risk_score >= 0.35
                        ? 'bg-[#D97706]'
                        : 'bg-[#23845B]'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(2, result.risk_percentage))}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono">
                  <span>0% (Legitimate)</span>
                  <span>Threshold: {(result.threshold_used * 100).toFixed(0)}%</span>
                  <span>100% (Fraud)</span>
                </div>
              </div>

              {/* Narrative Explanation */}
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted mb-2">
                  Explainability & Risk Factor Attribution
                </h4>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-800 leading-relaxed">
                  {result.explanation}
                </div>
              </div>

              {/* Identified Anomaly Drivers */}
              {result.risk_factors.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted mb-2">
                    Key Divergence Vectors ({result.risk_factors.length})
                  </h4>
                  <div className="space-y-2">
                    {result.risk_factors.map((rf, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 bg-white border border-slate-200 rounded text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{rf.label}</span>
                          <span className="font-mono text-[11px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                            val: {rf.value}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600">{rf.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Mandatory Academic & Probabilistic Disclaimer */}
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded text-[11px] text-blue-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                <p className="leading-normal">{result.disclaimer}</p>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-fintech-border rounded-lg shadow-xs p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                <SearchCheck className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-semibold text-slate-800">
                Awaiting Transaction Submission
              </h4>
              <p className="text-xs text-fintech-muted max-w-sm mx-auto leading-relaxed">
                Select a scenario preset on the left or enter custom transaction parameters to view the machine learning model's calibrated risk score and feature attribution analysis.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
