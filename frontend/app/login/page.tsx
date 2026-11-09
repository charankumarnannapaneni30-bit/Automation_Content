'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import { API_BASE_URL } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@atlasstudio.local');
  const [password, setPassword] = useState('admin123');
  const [message, setMessage] = useState('');

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      setMessage(error.detail ?? 'Authentication failed');
      return;
    }

    const payload = await response.json();
    localStorage.setItem('atlas_token', payload.access_token);
    setMessage('Signed in successfully');
    router.push('/');
  };

  return (
    <main className="mx-auto max-w-xl space-y-6 py-10">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Authentication</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Secure admin access</h2>
      </div>

      <form onSubmit={onSubmit} className="card space-y-4 p-6">
        <label className="block text-sm text-slate-200">
          Email
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </label>

        <label className="block text-sm text-slate-200">
          Password
          <input
            type="password"
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </label>

        <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-medium text-slate-950">
          Sign in
        </button>

        <p className="text-xs text-slate-400">Demo credentials: admin@atlasstudio.local / admin123</p>
        {message ? <p className="text-sm text-emerald-300">{message}</p> : null}
      </form>
    </main>
  );
}
