import { cn } from '@/lib/cn';

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'muted';
  className?: string;
}) {
  const variants = {
    default: 'bg-cockpit-700 text-cockpit-200',
    success: 'bg-green-950 text-green-400 border border-green-800',
    warning: 'bg-amber-950 text-amber-400 border border-amber-800',
    danger: 'bg-red-950 text-red-400 border border-red-800',
    info: 'bg-blue-950 text-blue-400 border border-blue-800',
    muted: 'bg-cockpit-800 text-cockpit-400 border border-cockpit-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
