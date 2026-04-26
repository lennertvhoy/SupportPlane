import { cn } from '@/lib/cn';

export function Panel({
  title,
  children,
  className,
  headerRight,
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerRight?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        'rounded-lg border border-cockpit-700 bg-cockpit-800/60 shadow-sm',
        className
      )}
    >
      <div className="flex items-center justify-between border-b border-cockpit-700 px-4 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-cockpit-300">
          {title}
        </h2>
        {headerRight && <div className="flex items-center gap-2">{headerRight}</div>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
