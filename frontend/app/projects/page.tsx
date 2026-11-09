
'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";

type Profile = {
  id: string;
  name: string;
  category: string;
  description: string;
  status: "enabled" | "draft" | "archived";
  languages: string[];
  formats: string[];
  destinations: string[];
  workflow_steps: string[];
  default_duration_minutes: number;
};

type Project = {
  id: string;
  title: string;
  profile: string;
  status: "Ready for review" | "In production" | "Queued" | "Needs edits";
  owner: string;
  progress: number;
  duration: string;
  language: string;
  workflow_steps?: string[];
  current_stage_index?: number;
  notes?: string | null;
};

const emptyProject = {
  id: "",
  title: "",
  profile: "Current Affairs",
  status: "Queued" as const,
  owner: "",
  progress: 15,
  duration: "5:00",
  language: "English",
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [form, setForm] = useState(emptyProject);

  const fetchProfiles = useCallback(async () => {
    const token = localStorage.getItem("atlas_token");
    const response = await fetch("http://localhost:8000/api/content-profiles", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.ok) {
      const data = await response.json();
      setProfiles(data);
      if (data.length > 0 && !form.profile) {
        setForm((current) => ({ ...current, profile: data[0].name, duration: `${data[0].default_duration_minutes}:00` }));
      }
    }
  }, [form.profile]);

  const fetchProjects = useCallback(async () => {
    const token = localStorage.getItem("atlas_token");
    const response = await fetch("http://localhost:8000/api/projects", {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.ok) {
      const data = await response.json();
      setProjects(data);
    }
  }, []);

  useEffect(() => {
    fetchProfiles();
    fetchProjects();
  }, [fetchProfiles, fetchProjects]);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.name === form.profile) ?? profiles[0],
    [form.profile, profiles],
  );

  useEffect(() => {
    if (!selectedProfile) return;
    setForm((current) => ({
      ...current,
      duration: current.duration === "5:00" || !current.duration ? `${selectedProfile.default_duration_minutes}:00` : current.duration,
    }));
  }, [selectedProfile]);

  const advanceProject = async (projectId: string) => {
    const token = localStorage.getItem("atlas_token");
    const response = await fetch(`http://localhost:8000/api/projects/${projectId}/advance`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (response.ok) {
      const updated = await response.json();
      setProjects((current) => current.map((project) => (project.id === updated.id ? updated : project)));
    }
  };

  const generateBrief = async (projectId: string) => {
    const token = localStorage.getItem("atlas_token");
    const response = await fetch(`http://localhost:8000/api/projects/${projectId}/ai-brief`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (response.ok) {
      const updated = await response.json();
      setProjects((current) => current.map((project) => (project.id === updated.project_id ? { ...project, notes: updated.brief } : project)));
    }
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload = {
      ...form,
      id: form.id || `PRJ-${Math.floor(Math.random() * 9000 + 1000)}`,
      owner: form.owner || "Admin",
      workflow_steps: selectedProfile?.workflow_steps ?? ["Research", "Script", "Approval"],
      current_stage_index: 0,
      notes: `Generated from the ${form.profile} profile.`,
    };

    const token = localStorage.getItem("atlas_token");
    const response = await fetch("http://localhost:8000/api/projects", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const created = await response.json();
      setProjects((current) => [created, ...current]);
      setForm({ ...emptyProject, profile: profiles[0]?.name ?? emptyProject.profile, duration: `${profiles[0]?.default_duration_minutes ?? 5}:00` });
    }
  };

  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Projects</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Manual content creation and launch</h2>
      </div>

      <form onSubmit={onSubmit} className="card grid gap-4 p-5 md:grid-cols-2">
        <label className="text-sm text-slate-200 md:col-span-2">
          Project title
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.title}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            required
          />
        </label>
        <label className="text-sm text-slate-200">
          Content profile
          <select
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.profile}
            onChange={(event) => setForm({ ...form, profile: event.target.value })}
          >
            {profiles.map((profile) => (
              <option key={profile.id} value={profile.name}>
                {profile.name}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm text-slate-200">
          Language
          <select
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.language}
            onChange={(event) => setForm({ ...form, language: event.target.value })}
          >
            <option>English</option>
            <option>Arabic</option>
            <option>French</option>
            <option>Spanish</option>
            <option>Japanese</option>
          </select>
        </label>
        <label className="text-sm text-slate-200">
          Owner
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.owner}
            onChange={(event) => setForm({ ...form, owner: event.target.value })}
          />
        </label>
        <label className="text-sm text-slate-200">
          Duration
          <input
            className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-white"
            value={form.duration}
            onChange={(event) => setForm({ ...form, duration: event.target.value })}
          />
        </label>

        <div className="md:col-span-2 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
          <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Selected workflow</div>
          <div className="flex flex-wrap gap-2">
            {(selectedProfile?.workflow_steps ?? ["Research", "Script", "Approval"]).map((step, index) => (
              <span key={`${step}-${index}`} className="rounded-full border border-cyan-500/40 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100">
                {step}
              </span>
            ))}
          </div>
        </div>

        <div className="md:col-span-2 flex gap-3">
          <button type="submit" className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-medium text-slate-950">
            Launch project
          </button>
          <button type="button" onClick={() => setForm({ ...emptyProject, profile: profiles[0]?.name ?? emptyProject.profile, duration: `${profiles[0]?.default_duration_minutes ?? 5}:00` })} className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm text-slate-200">
            Reset
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {projects.map((project) => {
          const currentStage = project.workflow_steps?.[project.current_stage_index ?? 0] ?? "Research";
          return (
            <div key={project.id} className="card p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>{project.id}</span>
                    <span>?</span>
                    <span>{project.profile}</span>
                  </div>
                  <h3 className="mt-2 text-xl font-semibold text-white">{project.title}</h3>
                </div>
                <span className="badge border-cyan-500/30 bg-cyan-500/10 text-cyan-200">{project.status}</span>
              </div>

              <div className="mt-5 grid gap-4 md:grid-cols-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Owner</p>
                  <p className="mt-2 text-sm text-slate-200">{project.owner}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Duration</p>
                  <p className="mt-2 text-sm text-slate-200">{project.duration}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Language</p>
                  <p className="mt-2 text-sm text-slate-200">{project.language}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Progress</p>
                  <p className="mt-2 text-sm text-slate-200">{project.progress}%</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-700 bg-slate-950/60 p-4">
                <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>Production pipeline</span>
                  <span>{currentStage}</span>
                </div>
                <div className="mb-4 flex flex-wrap gap-2">
                  {(project.workflow_steps ?? ["Research", "Script", "Approval"]).map((step, index) => (
                    <span key={`${project.id}-${step}-${index}`} className={`rounded-full border px-2.5 py-1 text-xs ${index <= (project.current_stage_index ?? 0) ? "border-cyan-500/40 bg-cyan-500/10 text-cyan-100" : "border-slate-700 bg-slate-900 text-slate-200"}`}>
                      {step}
                    </span>
                  ))}
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-400" style={{ width: `${project.progress}%` }} />
                </div>
                <div className="mt-4 flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-300">Current stage: <span className="text-white">{currentStage}</span></p>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => generateBrief(project.id)} className="rounded-xl border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-sm font-medium text-violet-100">
                      Generate AI brief
                    </button>
                    <button type="button" onClick={() => advanceProject(project.id)} className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-100">
                      Advance stage
                    </button>
                  </div>
                </div>

                {project.notes ? (
                  <div className="mt-4 rounded-xl border border-violet-500/20 bg-violet-500/5 p-3">
                    <p className="mb-1 text-[10px] uppercase tracking-[0.2em] text-violet-200">AI brief preview</p>
                    <p className="text-sm leading-6 text-slate-200">
                      {project.notes.length > 180 ? `${project.notes.slice(0, 180)}?` : project.notes}
                    </p>
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/40 p-3 text-sm text-slate-400">
                    AI brief not generated yet.
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </main>
  );
}
