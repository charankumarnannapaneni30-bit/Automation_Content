'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { API_BASE_URL } from '@/lib/api';

const navItems = [
  { href: '/', label: 'Dashboard' },
  { href: '/profiles', label: 'Profiles' },
  { href: '/projects', label: 'Projects' },
  { href: '/jobs', label: 'Jobs' },
  { href: '/approvals', label: 'Approvals' },
  { href: '/settings', label: 'Settings' },
  { href: '/login', label: 'Login' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<{ id: string; email: string; name: string; role: string } | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('atlas_token');
    if (!token) {
      setUser(null);
      return;
    }

    fetch(`${API_BASE_URL}/api/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (response) => {
        if (!response.ok) {
          localStorage.removeItem('atlas_token');
          setUser(null);
          return;
        }

        const payload = await response.json();
        setUser(payload.user);
      })
      .catch(() => {
        localStorage.removeItem('atlas_token');
        setUser(null);
      });
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('atlas_token');
    setUser(null);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <header className="mb-8 flex flex-col gap-4 border-b border-slate-800 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.28rem] text-cyan-400">Atlas Studio</p>
          <h1 className="mt-2 text-2xl font-semibold">AI Production Workspace</h1>
        </div>

        <div className="flex flex-col items-start gap-3 md:items-end">
          <nav className="flex flex-wrap items-center gap-2 rounded-full border border-slate-700 bg-slate-900/80 p-1">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-full px-4 py-2 text-sm text-slate-300 transition hover:bg-slate-800 hover:text-white"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {user ? (
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-emerald-200">{user.role}</span>
              <span>{user.email}</span>
              <button onClick={handleLogout} className="rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-slate-200">
                Sign out
              </button>
            </div>
          ) : (
            <span className="text-xs text-slate-400">Signed out</span>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}
