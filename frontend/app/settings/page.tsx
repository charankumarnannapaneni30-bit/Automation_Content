'use client';

import { useEffect, useState } from 'react';

import { API_BASE_URL } from '@/lib/api';

export default function SettingsPage() {
  const [status, setStatus] = useState<{
    database: { provider: string; connected: boolean; uri_configured: boolean; details: string };
    queue: { broker_url: string; reachable: boolean; details: string };
    auth: { jwt_enabled: boolean };
    ai: { provider: string; configured: boolean; enabled: boolean; model: string; details: string };
  } | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState<'export' | 'reset' | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch(`${API_BASE_URL}/api/system-status`);
      const data = await response.json();
      setStatus(data);
    };

    fetchStatus();
  }, []);

  const getAuthHeaders = (): Headers => {
    const headers = new Headers({ 'Content-Type': 'application/json' });
    const token = localStorage.getItem('atlas_token');
    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  };

  const handleExport = async () => {
    setBusy('export');
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/data/export`, {
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Admin access required');
      }
      const payload = await response.json();
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'atlas-studio-export.json';
      link.click();
      URL.revokeObjectURL(url);
      setMessage('Data export downloaded successfully.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to export data.');
    } finally {
      setBusy(null);
    }
  };

  const handleReset = async () => {
    const confirmed = window.confirm('Reset all local studio data back to the seeded defaults?');
    if (!confirmed) {
      return;
    }

    setBusy('reset');
    setMessage(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/data/reset`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
      if (!response.ok) {
        throw new Error('Admin access required');
      }
      const payload = await response.json();
      setMessage(`Data reset completed. ${payload.summary ? `Projects: ${payload.summary.projects_count}` : ''}`.trim());
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to reset data.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Platform settings</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Operational configuration</h2>
      </div>

      <div className="card p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-medium text-white">Local data management</h3>
            <p className="text-sm text-slate-400">Export the current local project state or reset the studio back to its seeded baseline.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleExport}
              disabled={busy !== null}
              className="rounded-lg border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-medium text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === 'export' ? 'Exporting…' : 'Export data'}
            </button>
            <button
              type="button"
              onClick={handleReset}
              disabled={busy !== null}
              className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-4 py-2 text-sm font-medium text-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy === 'reset' ? 'Resetting…' : 'Reset data'}
            </button>
          </div>
        </div>
        {message ? <p className="mt-4 text-sm text-slate-300">{message}</p> : null}
      </div>

      <div className="grid gap-5 lg:grid-cols-4">
        <div className="card p-5">
          <h3 className="text-lg font-medium text-white">Database</h3>
          {status ? (
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p><span className="text-slate-400">Provider:</span> {status.database.provider}</p>
              <p><span className="text-slate-400">Connected:</span> {String(status.database.connected)}</p>
              <p><span className="text-slate-400">URI configured:</span> {String(status.database.uri_configured)}</p>
              <p><span className="text-slate-400">Details:</span> {status.database.details}</p>
            </div>
          ) : (
            <p className="mt-4 text-slate-400">Loading status…</p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-medium text-white">Queue</h3>
          {status ? (
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p><span className="text-slate-400">Broker URL:</span> {status.queue.broker_url}</p>
              <p><span className="text-slate-400">Reachable:</span> {String(status.queue.reachable)}</p>
              <p><span className="text-slate-400">Details:</span> {status.queue.details}</p>
            </div>
          ) : (
            <p className="mt-4 text-slate-400">Loading queue status…</p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-medium text-white">Authentication</h3>
          {status ? (
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p><span className="text-slate-400">JWT enabled:</span> {String(status.auth.jwt_enabled)}</p>
              <p><span className="text-slate-400">Session mode:</span> local JWT bearer tokens</p>
              <p><span className="text-slate-400">Demo users:</span> admin@atlasstudio.local, editor@atlasstudio.local</p>
            </div>
          ) : (
            <p className="mt-4 text-slate-400">Loading auth status…</p>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-medium text-white">AI provider</h3>
          {status ? (
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p><span className="text-slate-400">Provider:</span> {status.ai.provider}</p>
              <p><span className="text-slate-400">Configured:</span> {String(status.ai.configured)}</p>
              <p><span className="text-slate-400">Enabled:</span> {String(status.ai.enabled)}</p>
              <p><span className="text-slate-400">Model:</span> {status.ai.model}</p>
              <p><span className="text-slate-400">Details:</span> {status.ai.details}</p>
            </div>
          ) : (
            <p className="mt-4 text-slate-400">Loading AI status…</p>
          )}
        </div>
      </div>
    </main>
  );
}
