'use client';

import { useEffect } from 'react';

export default function RootErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to console for debugging; production would send to telemetry
    console.error('Root error boundary caught:', error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cockpit-950 px-4 text-center">
      <div className="max-w-md rounded-lg border border-cockpit-700 bg-cockpit-900 p-6 shadow-lg">
        <h1 className="mb-2 text-2xl font-semibold text-cockpit-100">
          Something went wrong
        </h1>
        <p className="mb-4 text-sm text-cockpit-300">
          SupportPlane encountered an unexpected error. This is a local sandbox
          build — no production data is at risk.
        </p>
        {error.digest && (
          <p className="mb-4 font-mono text-xs text-cockpit-500">
            Error ID: {error.digest}
          </p>
        )}
        <button
          onClick={reset}
          className="rounded bg-cockpit-600 px-4 py-2 text-sm font-medium text-white hover:bg-cockpit-500 focus:outline-none focus:ring-2 focus:ring-cockpit-400 focus:ring-offset-2 focus:ring-offset-cockpit-900"
          aria-label="Retry loading the application"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
