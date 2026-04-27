type Tone = 'success' | 'warning' | 'neutral' | 'danger' | 'brand';

const TONES: Record<Tone, string> = {
  success: 'bg-green-100 text-green-700',
  warning: 'bg-amber-100 text-amber-800',
  neutral: 'bg-gray-100 text-gray-600',
  danger:  'bg-red-100 text-red-700',
  brand:   'bg-brand-light text-brand',
};

interface StatusPillProps {
  tone?: Tone;
  children: React.ReactNode;
  className?: string;
}

export default function StatusPill({ tone = 'neutral', children, className = '' }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}
