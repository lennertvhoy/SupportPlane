import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SupportPlane — Support Cockpit',
  description: 'Governed AI support cockpit for IT teams and MSPs',
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
