'use client';

import { useEffect, useState } from 'react';

type Job = {
  id: string;
  project_id: string;
  task: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  progress: number;
  created_at: string;
  updated_at: string;
  result: string | null;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);

  const fetchJobs = async () => {
    const token = localStorage.getItem('atlas_token');
    const response = await fetch('http://localhost:8000/api/jobs', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (response.ok) {
      const data = await response.json();
      setJobs(data);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const triggerJob = async (jobId: string) => {
    const token = localStorage.getItem('atlas_token');
    const response = await fetch(`http://localhost:8000/api/jobs/${jobId}/trigger`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (response.ok) {
      fetchJobs();
    }
  };

  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Automation queue</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Background production jobs</h2>
      </div>

      <div className="space-y-4">
        {jobs.map((job) => (
          <div key={job.id} className="card p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                  <span>{job.id}</span>
                  <span>•</span>
                  <span>{job.project_id}</span>
                </div>
                <h3 className="mt-2 text-xl font-semibold text-white">{job.task}</h3>
              </div>
              <span className="badge border-cyan-500/30 bg-cyan-500/10 text-cyan-200">{job.status}</span>
            </div>

            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                <span>Progress</span>
                <span>{job.progress}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-gradient-to-r from-violet-500 via-cyan-500 to-emerald-400" style={{ width: `${job.progress}%` }} />
              </div>
            </div>

            <div className="mt-5 grid gap-3 text-sm text-slate-300 md:grid-cols-3">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Created</p>
                <p className="mt-2">{job.created_at}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Updated</p>
                <p className="mt-2">{job.updated_at}</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Result</p>
                <p className="mt-2">{job.result ?? 'No result yet'}</p>
              </div>
            </div>

            <div className="mt-6">
              <button onClick={() => triggerJob(job.id)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950">
                Trigger job
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
