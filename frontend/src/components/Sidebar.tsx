import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldAlert,
  LayoutDashboard,
  SearchCheck,
  FileSpreadsheet,
  TableProperties,
  BarChart3,
  BookOpen,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', label: 'Overview Dashboard', icon: LayoutDashboard },
  { to: '/predict', label: 'Single Transaction', icon: SearchCheck },
  { to: '/batch', label: 'Batch CSV Analysis', icon: FileSpreadsheet },
  { to: '/transactions', label: 'Transaction Explorer', icon: TableProperties },
  { to: '/models', label: 'Model Performance', icon: BarChart3 },
  { to: '/dataset', label: 'Dataset & Schema', icon: BookOpen },
  { to: '/settings', label: 'System & About', icon: Sliders },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-white border-r border-fintech-border flex flex-col h-screen sticky top-0 z-30 select-none">
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
            Risk Analytics v1.0
          </div>
        </div>
      </div>

      {/* Navigation Section */}
      <div className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-fintech-muted">
          Platform Navigation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
          <span className="text-fintech-muted font-medium">Engine Status</span>
          <span className="text-[11px] font-mono text-slate-700 bg-white border border-fintech-border px-1.5 py-0.5 rounded">
            FastAPI 0.116
          </span>
        </div>
      </div>
    </aside>
  );
};
