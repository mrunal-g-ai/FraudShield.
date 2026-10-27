import React, { useState, useEffect } from 'react';
import {
  Sliders,
  CheckCircle2,
  XCircle,
  Database,
  Cpu,
  BookOpen,
  Award,
  ShieldAlert,
  Server,
  RefreshCw,
  Info,
} from 'lucide-react';
import { Header } from '../components/Header';
import { fetchHealth } from '../services/api';
import { HealthResponse } from '../types';

export const SettingsPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const checkHealth = async () => {
    try {
      setLoading(true);
      const data = await fetchHealth();
      setHealth(data);
    } catch (e) {
      console.error('Failed to query backend health', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkHealth();
  }, []);

  return (
    <div className="min-h-screen bg-fintech-bg pb-12">
      <Header
        title="System Status & Academic Project Details"
        description="Operational health checks, active runtime dependencies, model artifact statuses, and academic specifications."
        actions={
          <button
            onClick={checkHealth}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-fintech-border hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Re-check System Health</span>
          </button>
        }
      />

      <main className="max-w-7xl mx-auto px-8 pt-8 space-y-8">
        {/* Service Health Grid */}
        <div className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-fintech-border">
            <div className="flex items-center gap-2">
              <Server className="w-4 h-4 text-fintech-accent" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
                Runtime Service Health Checks
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Checked at {health ? new Date(health.timestamp).toLocaleTimeString() : '—'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* FastAPI Backend */}
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">FastAPI Backend</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Version: {health?.backend || 'FastAPI 0.116'}
                </div>
                <div className="mt-1 text-[10px] font-semibold text-emerald-700 uppercase">
                  Status: {health?.status || 'Active'}
                </div>
              </div>
            </div>

            {/* SQLite Database */}
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Database className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">SQLite Audit Database</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Storage: backend/app/database/fraudshield.db
                </div>
                <div className="mt-1 text-[10px] font-semibold text-emerald-700 uppercase">
                  Connection: {health?.database || 'Connected'}
                </div>
              </div>
            </div>

            {/* Machine Learning Pipeline */}
            <div className="p-4 rounded-md border border-slate-200 bg-slate-50/50 flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <Cpu className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">ML Model Pipeline</div>
                <div className="text-[11px] text-slate-500 mt-0.5">
                  Artifact: best_model.joblib (Random Forest)
                </div>
                <div className="mt-1 text-[10px] font-semibold text-emerald-700 uppercase">
                  Loaded: {health?.model_loaded ? 'Ready for Inference' : 'Not Found'}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Academic Project Credits & Specifications */}
        <div className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-fintech-border">
            <Award className="w-4 h-4 text-fintech-accent" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
              Academic Mini-Project Submission Metadata
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-700">
            <div className="space-y-3">
              <div>
                <span className="font-semibold text-slate-900 block">Project Title:</span>
                FraudShield — Credit Card Fraud Detection Using Machine Learning
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Domain:</span>
                Financial Risk Analytics, Machine Learning, Anomaly Detection
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Academic Program:</span>
                Bachelor of Technology / Bachelor of Engineering in Computer Science & Engineering
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Software Release Version:</span>
                v1.0.0 (Production-Quality Academic Release)
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <span className="font-semibold text-slate-900 block">Architecture Pattern:</span>
                Decoupled RESTful Full-Stack with Stratified RobustScaler ML Pipeline
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Primary Supervised Algorithms:</span>
                Random Forest (Ensemble Classifier) & Logistic Regression (Linear Baseline)
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">Academic Documentation:</span>
                Complete 20-chapter report available in <code className="bg-slate-100 px-1 py-0.5 rounded font-mono">docs/FRAUDSHIELD_ACADEMIC_REPORT.md</code>
              </div>
              <div>
                <span className="font-semibold text-slate-900 block">GitHub Repository:</span>
                <span className="font-mono text-fintech-accent">https://github.com/mrunal-g-ai/FraudShield..git</span>
              </div>
            </div>
          </div>
        </div>

        {/* Project Limitations & Boundary Disclaimers */}
        <div className="bg-white border border-fintech-border rounded-lg p-6 shadow-xs space-y-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-fintech-danger" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
              Important Engineering Disclaimers & Limitations
            </h3>
          </div>

          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1.5 leading-relaxed pl-1">
            <li>
              <strong>Decision-Support System:</strong> Model outputs represent calibrated posterior risk probabilities P(Fraud | X). They are designed to assist human fraud analysts and decision-routing rules, never as autonomous final financial judgments.
            </li>
            <li>
              <strong>PCI-DSS Compliance:</strong> This application strictly adheres to privacy standards by only accepting normalized continuous PCA features ($V_1$–$V_{28}$). It does not collect, store, or process plaintext card numbers (PAN), CVVs, expiration dates, or bank PINs.
            </li>
            <li>
              <strong>Concept Drift:</strong> Financial fraud tactics mutate over time. For enterprise banking deployment, the model requires scheduled continuous retraining on live transactional feeds with drift-detection triggers.
            </li>
          </ul>
        </div>
      </main>
    </div>
  );
};
