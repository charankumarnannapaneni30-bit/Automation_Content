'use client';

import { FormEvent, useEffect, useState } from 'react';

type Profile = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: 'enabled' | 'draft' | 'archived';
  languages: string[];
  formats: string[];
  destinations: string[];
  workflow_steps: string[];
  default_duration_minutes: number;
};

const emptyProfile: Profile = {
  id: '',
  name: '',
  category: '',
  description: '',
  status: 'enabled',
  languages: ['English'],
  formats: ['16:9'],
  destinations: ['YouTube'],
  workflow_steps: ['Research', 'Script', 'Approval'],
  default_duration_minutes: 5,
};

export default function ProfilesPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState<Profile>(emptyProfile);
  const [showForm, setShowForm] = useState(false);

  const fetchProfiles = async () => {
    const token = localStorage.getItem('atlas_token');
    const response = await fetch('http://localhost:8000/api/content-profiles', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.ok) {
      const data = await response.json();
      setProfiles(data);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      id: form.id || form.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      languages: form.languages.filter(Boolean),
      formats: form.formats.filter(Boolean),
      destinations: form.destinations.filter(Boolean),
      workflow_steps: form.workflow_steps.filter(Boolean),
    };

    const token = localStorage.getItem('atlas_token');
    const response = await fetch('http://localhost:8000/api/content-profiles', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const created = await response.json();
      setProfiles((current) => [created, ...current]);
      setForm(emptyProfile);
      setShowForm(false);
    }
  };

  const toggleStatus = async (profile: Profile) => {
    const nextStatus = profile.status === 'enabled' ? 'draft' : 'enabled';
    const token = localStorage.getItem('atlas_token');
    const response = await fetch(`http://localhost:8000/api/content-profiles/${profile.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ ...profile, status: nextStatus }),
    });

    if (response.ok) {
      const updated = await response.json();
      setProfiles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    }
  };

  const duplicateProfile = async (profile: Profile) => {
    const token = localStorage.getItem('atlas_token');
    const response = await fetch(`http://localhost:8000/api/content-profiles/${profile.id}/duplicate`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (response.ok) {
      const duplicated = await response.json();
      setProfiles((current) => [duplicated, ...current]);
    }
  };

  const deleteProfile = async (profileId: string) => {
    const token = localStorage.getItem('atlas_token');
    const response = await fetch(`http://localhost:8000/api/content-profiles/${profileId}`, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (response.ok) {
      setProfiles((current) => current.filter((item) => item.id !== profileId));
    }
  };

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Content profiles</p>
          <h2 className="mt-2 text-3xl font-semibold text-white">Dynamic profiles library</h2>
        </div>
        <button
          onClick={() => setShowForm((current) => !current)}
          className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-medium text-slate-950"
        >
          {showForm ? 'Close form' : 'Create profile'}
        </button>
      </div>

      {showForm ? (
        <form onSubmit={onSubmit} className="card grid gap-4 p-5 md:grid-cols-2">
          <label className="text-sm text-slate-200">
            Profile name
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
              required
            />
          </label>
          <label className="text-sm text-slate-200">
            Category
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.category}
              onChange={(event) => setForm({ ...form, category: event.target.value })}
              required
            />
          </label>
          <label className="md:col-span-2 text-sm text-slate-200">
            Description
            <textarea
              className="mt-2 min-h-[90px] w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.description}
              onChange={(event) => setForm({ ...form, description: event.target.value })}
              required
            />
          </label>
          <label className="text-sm text-slate-200">
            Status
            <select
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.status}
              onChange={(event) => setForm({ ...form, status: event.target.value as Profile['status'] })}
            >
              <option value="enabled">Enabled</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </label>
          <label className="text-sm text-slate-200">
            Default duration (minutes)
            <input
              type="number"
              min={1}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.default_duration_minutes}
              onChange={(event) => setForm({ ...form, default_duration_minutes: Number(event.target.value) || 1 })}
            />
          </label>
          <label className="md:col-span-2 text-sm text-slate-200">
            Languages (comma-separated)
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.languages.join(', ')}
              onChange={(event) => setForm({ ...form, languages: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
            />
          </label>
          <label className="md:col-span-2 text-sm text-slate-200">
            Formats (comma-separated)
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.formats.join(', ')}
              onChange={(event) => setForm({ ...form, formats: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
            />
          </label>
          <label className="md:col-span-2 text-sm text-slate-200">
            Publishing destinations (comma-separated)
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.destinations.join(', ')}
              onChange={(event) => setForm({ ...form, destinations: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
            />
          </label>
          <label className="md:col-span-2 text-sm text-slate-200">
            Workflow steps (comma-separated)
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
              value={form.workflow_steps.join(', ')}
              onChange={(event) => setForm({ ...form, workflow_steps: event.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
            />
          </label>

          <div className="md:col-span-2 flex gap-3">
            <button type="submit" className="rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-medium text-slate-950">
              Save profile
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200">
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <div className="grid gap-5 xl:grid-cols-2">
        {profiles.map((profile) => (
          <div key={profile.id} className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-slate-400">{profile.category}</p>
                <h3 className="mt-2 text-xl font-semibold text-white">{profile.name}</h3>
              </div>
              <span className={`badge ${profile.status === 'enabled' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200' : 'border-amber-500/30 bg-amber-500/10 text-amber-200'}`}>
                {profile.status}
              </span>
            </div>
            <p className="mt-4 text-sm text-slate-300">{profile.description}</p>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Languages</p>
                <div className="flex flex-wrap gap-2">
                  {profile.languages.map((language) => (
                    <span key={`${profile.id}-${language}`} className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200">
                      {language}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Formats</p>
                <div className="flex flex-wrap gap-2">
                  {profile.formats.map((format) => (
                    <span key={`${profile.id}-format-${format}`} className="rounded-full border border-slate-700 bg-slate-800 px-2 py-1 text-xs text-slate-200">
                      {format}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5">
              <p className="mb-2 text-xs uppercase tracking-[0.2em] text-slate-400">Workflow</p>
              <div className="flex flex-wrap gap-2">
                {profile.workflow_steps.map((step) => (
                  <span key={`${profile.id}-step-${step}`} className="rounded-full border border-violet-500/30 bg-violet-500/10 px-2.5 py-1 text-xs text-violet-100">
                    {step}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-6 flex items-center gap-2">
              <button onClick={() => toggleStatus(profile)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200">
                {profile.status === 'enabled' ? 'Disable' : 'Enable'}
              </button>
              <button onClick={() => duplicateProfile(profile)} className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-medium text-slate-200">
                Duplicate
              </button>
              <button onClick={() => deleteProfile(profile.id)} className="ml-auto rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-200">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
