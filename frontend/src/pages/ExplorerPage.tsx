import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  TableProperties,
  Trash2,
  AlertCircle,
  SearchCheck,
  FileSpreadsheet,
  X,
} from 'lucide-react';
import { Header } from '../components/Header';
import { RiskBadge } from '../components/RiskBadge';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { fetchTransactions, clearTransactions } from '../services/api';
import { PaginatedTransactionsResponse, TransactionRecord } from '../types';

export const ExplorerPage: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PaginatedTransactionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(15);
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTxn, setSelectedTxn] = useState<TransactionRecord | null>(null);

  // Confirmation modal for clearing audit log
  const [showClearModal, setShowClearModal] = useState<boolean>(false);
  const [clearing, setClearing] = useState<boolean>(false);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTransactions(page, pageSize, riskFilter, searchQuery, sourceFilter);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transaction logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, riskFilter, sourceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
  };

  const handleResetFilters = () => {
    setSearchQuery('');
    setRiskFilter('ALL');
    setSourceFilter('ALL');
    setPage(1);
  };

  const handleConfirmClear = async () => {
    try {
      setClearing(true);
      await clearTransactions();
      setShowClearModal(false);
      setPage(1);
      await loadData();
    } catch (e: any) {
      alert(e.message || 'Failed to clear transactions');
    } finally {
      setClearing(false);
    }
  };

  const handleExportCsv = () => {
    if (!data || data.items.length === 0) return;

    const headers = [
      'TransactionID',
      'Timestamp',
      'Amount',
      'TimeSec',
      'PredictedClass',
      'RiskScore',
      'RiskLevel',
      'Source',
    ];
    const rows = data.items.map((i) => [
      i.id,
      i.timestamp,
      i.amount.toFixed(2),
      i.time_sec.toFixed(1),
      i.predicted_class,
      i.risk_score.toFixed(4),
      i.risk_level,
      i.source,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fraudshield_filtered_audit_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-fintech-bg pb-12">
      <Header
        title="Transaction Audit Log & Verification Explorer"
        description="Search, filter, and review historical inference results and PCA anomaly signatures stored in SQLite."
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCsv}
              disabled={!data || data.items.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-fintech-border hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={() => setShowClearModal(true)}
              disabled={!data || data.total === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-rose-200 hover:bg-rose-50 text-rose-700 text-xs font-semibold transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Log</span>
            </button>
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-fintech-border rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Transaction ID (e.g. TXN-)"
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-fintech-accent focus:bg-white font-mono"
            />
          </form>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Risk:
            </span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setRiskFilter(lvl);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  riskFilter === lvl
                    ? 'bg-fintech-accent text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {lvl === 'ALL' ? 'All Tiers' : `${lvl.charAt(0) + lvl.slice(1).toLowerCase()} Risk`}
              </button>
            ))}

            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mx-1 pl-2 border-l border-slate-200">
              Source:
            </span>
            {['ALL', 'SINGLE', 'BATCH'].map((src) => (
              <button
                key={src}
                type="button"
                onClick={() => {
                  setSourceFilter(src);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                  sourceFilter === src
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {src === 'ALL' ? 'All' : src.charAt(0) + src.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Audit Table */}
        <div className="bg-white border border-fintech-border rounded-lg shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-16 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
              <RefreshCw className="w-5 h-5 animate-spin text-fintech-accent" />
              <span>Querying transaction audit records...</span>
            </div>
          ) : data?.items.length === 0 ? (
            <div className="p-16 text-center">
              <TableProperties className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-slate-800">No Matching Transactions</h4>
              <p className="text-xs text-fintech-muted max-w-sm mx-auto mt-1 mb-4">
                No stored transactions match your active query or filters.
              </p>
              <div className="flex justify-center gap-2">
                <button
                  onClick={handleResetFilters}
                  className="px-3 py-1.5 bg-slate-100 text-slate-700 text-xs font-medium rounded-md hover:bg-slate-200 transition-colors"
                >
                  Clear All Filters
                </button>
                <button
                  onClick={() => navigate('/predict')}
                  className="px-3 py-1.5 bg-fintech-accent text-white text-xs font-medium rounded-md hover:bg-fintech-accent-hover transition-colors"
                >
                  Analyze Transaction
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-fintech-border bg-slate-50 text-[11px] font-semibold text-fintech-muted uppercase tracking-wider">
                    <th className="px-6 py-3">Transaction ID</th>
                    <th className="px-6 py-3">Logged Timestamp</th>
                    <th className="px-6 py-3 text-right">Amount</th>
                    <th className="px-6 py-3">Time Sec</th>
                    <th className="px-6 py-3">Source</th>
                    <th className="px-6 py-3">Model Risk Score</th>
                    <th className="px-6 py-3">Assessment</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-fintech-border text-xs">
                  {data?.items.map((txn) => (
                    <tr
                      key={txn.id}
                      onClick={() => setSelectedTxn(txn)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="px-6 py-3 font-mono font-medium text-slate-900">
                        {txn.id}
                      </td>
                      <td className="px-6 py-3 text-slate-500">
                        {new Date(txn.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-3 text-right font-mono font-medium text-slate-900">
                        ${txn.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-3 font-mono text-slate-500">
                        {txn.time_sec.toFixed(1)}s
                      </td>
                      <td className="px-6 py-3">
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {txn.source}
                        </span>
                      </td>
                      <td className="px-6 py-3 font-mono font-semibold">
                        {(txn.risk_score * 100).toFixed(1)}%
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
                          Inspect Vectors
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Controls */}
          {data && data.total > 0 && (
            <div className="px-6 py-3.5 border-t border-fintech-border bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
              <div>
                Showing <span className="font-semibold text-slate-900">{(page - 1) * pageSize + 1}</span> to{' '}
                <span className="font-semibold text-slate-900">
                  {Math.min(page * pageSize, data.total)}
                </span>{' '}
                of <span className="font-semibold text-slate-900">{data.total.toLocaleString()}</span> records
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="font-mono px-2">
                  Page {page} of {data.total_pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.total_pages, p + 1))}
                  disabled={page >= data.total_pages}
                  className="p-1.5 border border-slate-200 rounded hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Confirmation Modal for Clearing Transactions */}
      {showClearModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-lg border border-fintech-border shadow-xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Clear Transaction Audit Log?</h3>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  This will delete all persisted transaction records from the SQLite database. This action is designed for testing and demo resets.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowClearModal(false)}
                className="px-3.5 py-1.5 rounded-md border border-slate-300 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmClear}
                disabled={clearing}
                className="px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {clearing ? 'Clearing...' : 'Yes, Clear All Records'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />
    </div>
  );
};
