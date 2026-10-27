import React from 'react';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  badge?: {
    text: string;
    type?: 'neutral' | 'success' | 'danger' | 'primary';
  };
  icon?: React.ReactNode;
}

export const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  badge,
  icon,
}) => {
  const badgeStyles = {
    neutral: 'bg-[#F1F4F9] text-[#667085] border-[#E2E7EF]',
    success: 'bg-[#EDF7F2] text-[#23845B] border-[#C6E7D6]',
    danger: 'bg-[#FDF2F3] text-[#C83E4D] border-[#F8D2D6]',
    primary: 'bg-[#EFF4FE] text-[#2457C5] border-[#D0E0FC]',
  }[badge?.type || 'neutral'];

  return (
    <div className="bg-white border border-fintech-border rounded-lg p-5 shadow-xs transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-fintech-muted">
          {title}
        </span>
        {icon && <div className="text-fintech-muted">{icon}</div>}
      </div>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-2xl font-bold tracking-tight text-fintech-text font-mono">
          {value}
        </div>
        {badge && (
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded border ${badgeStyles}`}>
            {badge.text}
          </span>
        )}
      </div>
      {subtitle && (
        <p className="mt-2 text-xs text-fintech-muted">
          {subtitle}
        </p>
      )}
    </div>
  );
};
