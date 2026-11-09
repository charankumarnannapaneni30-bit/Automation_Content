import './globals.css';
import type { Metadata } from 'next';

import { AppShell } from '@/components/app-shell';

export const metadata: Metadata = {
  title: 'Atlas Studio',
  description: 'Modular AI content creation and publishing platform',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-50 antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
