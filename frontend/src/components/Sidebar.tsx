import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  SearchCheck,
  FileSpreadsheet,
  TableProperties,
  Scale,
  CheckCircle2,
  Menu,
  X,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
  { to: '/predict', label: 'Transaction Analyzer', icon: SearchCheck },
  { to: '/batch', label: 'Batch Ingestion', icon: FileSpreadsheet },
  { to: '/transactions', label: 'Transaction Audit Log', icon: TableProperties },
  { to: '/governance', label: 'Model Governance', icon: Scale },
];

export const Sidebar: React.FC = () => {
  const [mobileOpen, setMobileOpen] = useState(false);

  const NavLinks = () => (
    <div className="space-y-1">
      <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-fintech-muted">
        Risk Management
      </div>
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-md text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-[#EFF4FE] text-fintech-accent font-semibold border-l-3 border-fintech-accent'
                  : 'text-fintech-text hover:bg-slate-50 hover:text-fintech-accent'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </div>
  );

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-white border-b border-fintech-border px-4 py-3 flex items-center justify-between sticky top-0 z-40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-fintech-accent flex items-center justify-center text-white shadow-xs">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight text-fintech-text leading-tight">
              FraudShield
            </div>
            <div className="text-[10px] font-medium text-fintech-muted tracking-wide uppercase">
              Risk Platform
            </div>
          </div>
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 rounded-md border border-fintech-border text-slate-600 hover:bg-slate-50"
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden animate-in fade-in duration-150"
        />
      )}

      {/* Mobile Slide-over Drawer */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white border-r border-fintech-border z-50 transform transition-transform duration-200 ease-in-out lg:hidden flex flex-col ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="h-16 px-6 border-b border-fintech-border flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-fintech-accent flex items-center justify-center text-white">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <span className="font-bold text-sm text-fintech-text">FraudShield</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded text-slate-400 hover:text-slate-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-3 py-4 overflow-y-auto">
          <NavLinks />
        </div>

        <div className="p-4 border-t border-fintech-border bg-slate-50 text-xs">
          <div className="flex items-center justify-between mb-1">
            <span className="text-fintech-muted font-medium">Model Engine</span>
            <span className="text-emerald-700 font-semibold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Random Forest
            </span>
          </div>
        </div>
      </div>

      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-fintech-border flex-col h-screen sticky top-0 z-30 select-none">
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-fintech-border flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-fintech-accent flex items-center justify-center text-white shadow-xs">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="font-bold text-base tracking-tight text-fintech-text leading-tight">
              FraudShield
            </div>
            <div className="text-[11px] font-medium text-fintech-muted tracking-wide uppercase">
              Financial Risk v1.0
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <NavLinks />
        </div>

        {/* System Status Footer */}
        <div className="p-4 border-t border-fintech-border bg-slate-50/50">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-fintech-muted font-medium">Model Pipeline</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-fintech-success">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Random Forest
            </span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-fintech-muted font-medium">API Runtime</span>
            <span className="text-[11px] font-mono text-slate-700 bg-white border border-fintech-border px-1.5 py-0.5 rounded">
              FastAPI Active
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
