export const dynamic = 'force-dynamic';

import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClinicFlow - Private Clinic Management System',
  description: 'Production-grade Multi-Tenant Private Clinic Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-apple-bg text-apple-text antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
