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
    success: 'bg-green-900/40 text-green-300 border border-green-700/40',
    warning: 'bg-amber-900/40 text-amber-300 border border-amber-700/40',
    danger: 'bg-red-900/40 text-red-300 border border-red-700/40',
    info: 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
    muted: 'bg-cockpit-800 text-cockpit-400 border border-cockpit-700',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-xs font-medium',
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
