import React from 'react';
import { X, ShieldAlert, CheckCircle, Clock, DollarSign, Cpu } from 'lucide-react';
import { TransactionRecord } from '../types';
import { RiskBadge } from './RiskBadge';

interface TransactionDetailModalProps {
  transaction: TransactionRecord | null;
  onClose: () => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
}) => {
  if (!transaction) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-lg border border-fintech-border shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-fintech-border flex items-center justify-between bg-slate-50">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white border border-fintech-border text-slate-700">
                {transaction.id}
              </span>
              <RiskBadge level={transaction.risk_level} score={transaction.risk_score} size="md" />
            </div>
            <p className="text-xs text-fintech-muted mt-1">
              Logged on {new Date(transaction.timestamp).toLocaleString()} via {transaction.source} analysis
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 rounded-md p-1 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Facts Grid */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 border border-fintech-border rounded-md p-3">
              <div className="flex items-center gap-1.5 text-xs text-fintech-muted mb-1">
                <DollarSign className="w-3.5 h-3.5" />
                <span>Transaction Amount</span>
              </div>
              <div className="text-lg font-bold font-mono text-fintech-text">
                ${transaction.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div className="bg-slate-50 border border-fintech-border rounded-md p-3">
              <div className="flex items-center gap-1.5 text-xs text-fintech-muted mb-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Time Offset</span>
              </div>
              <div className="text-lg font-bold font-mono text-fintech-text">
                {transaction.time_sec.toFixed(1)}s
              </div>
            </div>

            <div className="bg-slate-50 border border-fintech-border rounded-md p-3">
              <div className="flex items-center gap-1.5 text-xs text-fintech-muted mb-1">
                <Cpu className="w-3.5 h-3.5" />
                <span>Model Version</span>
              </div>
              <div className="text-lg font-bold font-mono text-fintech-text">
                v{transaction.model_version}
              </div>
            </div>
          </div>

          {/* Model Explanation Card */}
          <div className="border border-fintech-border rounded-md p-4 bg-white">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted mb-2">
              Decision Analysis & Explainability
            </h4>
            <p className="text-sm text-fintech-text leading-relaxed">
              {transaction.explanation || 'No detailed narrative stored for this transaction.'}
            </p>
          </div>

          {/* Complete 28 PCA Components Grid */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-fintech-muted mb-3 flex items-center justify-between">
              <span>PCA Feature Vectors (V1 - V28)</span>
              <span className="text-[11px] font-normal normal-case text-slate-500">
                Normalized confidential dimensionality components
              </span>
            </h4>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 bg-slate-50 border border-fintech-border p-3 rounded-md">
              {Array.from({ length: 28 }, (_, i) => {
                const key = `V${i + 1}`;
                const val = transaction.features ? transaction.features[key] : undefined;
                const isExtremeNegative = val !== undefined && val < -2.5;
                const isExtremePositive = val !== undefined && val > 2.0;

                return (
                  <div
                    key={key}
                    className={`p-2 rounded border text-center transition-colors ${
                      isExtremeNegative
                        ? 'bg-red-50 border-red-200'
                        : isExtremePositive
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="text-[10px] font-mono font-semibold text-slate-500">
                      {key}
                    </div>
                    <div className={`text-xs font-mono font-medium truncate ${
                      isExtremeNegative ? 'text-red-700 font-bold' : isExtremePositive ? 'text-amber-700 font-bold' : 'text-slate-800'
                    }`}>
                      {val !== undefined ? val.toFixed(2) : '—'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-fintech-border bg-slate-50 flex items-center justify-between text-xs text-fintech-muted">
          <span>Persisted in SQLite database audit log</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-fintech-border text-slate-700 rounded-md font-medium hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
