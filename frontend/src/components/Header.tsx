import React from 'react';

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({ title, description, actions }) => {
  return (
    <header className="h-20 bg-white border-b border-fintech-border px-8 flex items-center justify-between sticky top-0 z-20">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-fintech-text leading-tight">
          {title}
        </h1>
        {description && (
          <p className="text-xs text-fintech-muted mt-0.5">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
};
