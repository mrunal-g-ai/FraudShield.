import React from 'react';
import { RiskLevel } from '../types';

interface RiskBadgeProps {
  level: RiskLevel | string;
  size?: 'sm' | 'md' | 'lg';
  score?: number;
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ level, size = 'md', score }) => {
  const normLevel = level.toUpperCase();

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5 font-medium',
  }[size];

  if (normLevel === 'HIGH') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-[#FDF2F3] text-[#C83E4D] border border-[#F8D2D6] ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#C83E4D]" />
        High Risk {score !== undefined && `(${Math.round(score * 100)}%)`}
      </span>
    );
  }

  if (normLevel === 'MEDIUM') {
    return (
      <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] ${sizeClasses}`}>
        <span className="w-1.5 h-1.5 rounded-full bg-[#D97706]" />
        Medium Risk {score !== undefined && `(${Math.round(score * 100)}%)`}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md font-medium bg-[#EDF7F2] text-[#23845B] border border-[#C6E7D6] ${sizeClasses}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-[#23845B]" />
      Low Risk {score !== undefined && `(${Math.round(score * 100)}%)`}
    </span>
  );
};
