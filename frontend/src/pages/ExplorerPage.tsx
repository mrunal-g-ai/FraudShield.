import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Download,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  SlidersHorizontal,
  TableProperties,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react';
import { Header } from '../components/Header';
import { RiskBadge } from '../components/RiskBadge';
import { TransactionDetailModal } from '../components/TransactionDetailModal';
import { fetchTransactions } from '../services/api';
import {
  PaginatedTransactionsResponse,
  TransactionRecord,
  RiskLevel,
} from '../types';

export const ExplorerPage: React.FC = () => {
  const [data, setData] = useState<PaginatedTransactionsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedTxn, setSelectedTxn] = useState<TransactionRecord | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetchTransactions(page, pageSize, riskFilter, searchQuery);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch transaction logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [page, pageSize, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadData();
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
        title="Transaction Audit Explorer"
        description="Filter, inspect, and trace historical transaction scores and PCA feature vectors persisted in the SQLite audit log."
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
              onClick={loadData}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        }
      />

      <main className="max-w-7xl mx-auto px-8 pt-8 space-y-6">
        {/* Search & Filter Toolbar */}
        <div className="bg-white border border-fintech-border rounded-lg p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
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
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider mr-1">
              Risk Filter:
            </span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => {
                  setRiskFilter(lvl);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                  riskFilter === lvl
                    ? 'bg-fintech-accent text-white shadow-xs'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
              >
                {lvl === 'ALL' ? 'All Tiers' : `${lvl.charAt(0) + lvl.slice(1).toLowerCase()} Risk`}
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
              <p className="text-xs text-fintech-muted max-w-sm mx-auto mt-1">
                No stored transactions match the query parameters or risk filter.
              </p>
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
                    <th className="px-6 py-3 text-right">Inspector</th>
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
                          View PCA Vectors
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

      {/* Slide-over Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTxn}
        onClose={() => setSelectedTxn(null)}
      />
    </div>
  );
};
