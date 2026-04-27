import { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}

export default function PageHeader({ title, subtitle, icon: Icon, action, className = '' }: PageHeaderProps) {
  return (
    <div className={`flex items-start justify-between gap-4 mb-6 ${className}`}>
      <div className="min-w-0">
        <div className="flex items-center gap-3">
          {Icon && <Icon size={24} className="text-brand flex-shrink-0" />}
          <h2 className="text-2xl font-bold text-gray-900 truncate">{title}</h2>
        </div>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
