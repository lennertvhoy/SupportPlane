import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SupportPlane — Governed AI Support Cockpit',
  description: 'Multi-tenant, self-hostable AI support cockpit for governed IT support sessions. Policy-first, audit-oriented, sandbox-ready.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-cockpit-900 text-cockpit-100">
        {children}
      </body>
    </html>
  );
}
