import { ReactNode } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info } from 'lucide-react';

type Tone = 'error' | 'warning' | 'success' | 'info';

const TONES: Record<Tone, { wrap: string; icon: typeof AlertCircle }> = {
  error:   { wrap: 'bg-red-50 border-red-200 text-red-700',       icon: AlertCircle },
  warning: { wrap: 'bg-amber-50 border-amber-200 text-amber-800', icon: AlertTriangle },
  success: { wrap: 'bg-green-50 border-green-200 text-green-700', icon: CheckCircle2 },
  info:    { wrap: 'bg-blue-50 border-blue-200 text-blue-700',    icon: Info },
};

interface AlertProps {
  tone?: Tone;
  children: ReactNode;
  className?: string;
  showIcon?: boolean;
}

export default function Alert({ tone = 'info', children, className = '', showIcon = true }: AlertProps) {
  const { wrap, icon: Icon } = TONES[tone];
  return (
    <div className={`flex items-start gap-2.5 border rounded-xl p-4 text-sm ${wrap} ${className}`}>
      {showIcon && <Icon size={16} className="flex-shrink-0 mt-0.5" />}
      <div className="flex-1">{children}</div>
    </div>
  );
}
