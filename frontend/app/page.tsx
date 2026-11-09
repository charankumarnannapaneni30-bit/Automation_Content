import { ArrowRight, CheckCircle2, Cpu, PlaySquare, Sparkles } from 'lucide-react';
import { approvalQueue, kpis, profiles, projects } from '@/lib/mock-data';

export default function HomePage() {
  return (
    <main className="space-y-8">
      <section className="grid gap-5 md:grid-cols-[1.5fr_1fr]">
        <div className="card p-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.3em] text-cyan-300">
            <Sparkles className="h-3.5 w-3.5" />
            Production overview
          </div>
          <h2 className="max-w-xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Create, research, produce, and publish content across any category or format.
          </h2>
          <p className="mt-4 max-w-2xl text-slate-300">
            Atlas Studio orchestrates topic discovery, AI research, script generation, multilingual voiceover, final video rendering, approval workflows, and cross-platform publishing.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button className="rounded-xl bg-cyan-400 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-cyan-300">
              New content project
            </button>
            <button className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:border-slate-500">
              View profile library
            </button>
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center justify-between">
            <p className="text-sm text-slate-400">Workflow health</p>
            <span className="badge border-emerald-500/30 bg-emerald-500/10 text-emerald-300">Stable</span>
          </div>
          <div className="mt-6 space-y-5">
            {[
              ['Research agents', '94%'],
              ['Script generation', '88%'],
              ['Voice synthesis', '97%'],
              ['Render farm', '91%'],
            ].map(([label, value]) => (
              <div key={label}>
                <div className="mb-2 flex items-center justify-between text-sm text-slate-300">
                  <span>{label}</span>
                  <span>{value}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                  <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 via-sky-500 to-violet-500" style={{ width: value }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-4">
        {kpis.map((item) => (
          <div key={item.label} className="kpi">
            <div className="flex items-center justify-between text-xs uppercase tracking-[0.22em] text-slate-400">
              <span>{item.label}</span>
              <span className="text-emerald-300">{item.change}</span>
            </div>
            <div className="mt-5 text-3xl font-semibold text-white">{item.value}</div>
          </div>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <div className="card p-5">
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-lg font-medium text-white">Content pipeline</h3>
            <button className="inline-flex items-center gap-2 text-sm text-cyan-300">
              Open queue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4">
            {projects.map((project) => (
              <div key={project.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-slate-400">
                      <span>{project.id}</span>
                      <span>•</span>
                      <span>{project.profile}</span>
                    </div>
                    <h4 className="mt-2 text-lg font-medium text-white">{project.title}</h4>
                  </div>
                  <span className="badge border-violet-500/30 bg-violet-500/10 text-violet-200">{project.status}</span>
                </div>
                <div className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-3">
                  <span>Owner: {project.owner}</span>
                  <span>Duration: {project.duration}</span>
                  <span>Language: {project.language}</span>
                </div>
                <div className="mt-4">
                  <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.2em] text-slate-400">
                    <span>Progress</span>
                    <span>{project.progress}%</span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-slate-800">
                    <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400" style={{ width: `${project.progress}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-lg font-medium text-white">Approval queue</h3>
          <div className="mt-5 space-y-4">
            {approvalQueue.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.id}</span>
                  <span className="badge border-amber-500/30 bg-amber-500/10 text-amber-200">{item.urgency}</span>
                </div>
                <h4 className="mt-3 text-base font-medium text-white">{item.title}</h4>
                <p className="mt-1 text-sm text-slate-300">{item.stage}</p>
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400">
                  <span>Reviewer</span>
                  <span>{item.reviewer}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2 text-cyan-300">
            <Cpu className="h-5 w-5" />
            <h3 className="text-lg font-medium text-white">AI orchestration</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Multi-provider LLM adapters</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Research, summarization, fact checks</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Script and voiceover generation</li>
          </ul>
        </div>
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2 text-violet-300">
            <PlaySquare className="h-5 w-5" />
            <h3 className="text-lg font-medium text-white">Media production</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Thumbnail and caption design</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Video rendering and output packaging</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Multi-destination publishing</li>
          </ul>
        </div>
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2 text-emerald-300">
            <Sparkles className="h-5 w-5" />
            <h3 className="text-lg font-medium text-white">Platform controls</h3>
          </div>
          <ul className="space-y-3 text-sm text-slate-300">
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Dynamic content profiles</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Language and format configuration</li>
            <li className="flex items-center gap-3"><CheckCircle2 className="h-4 w-4 text-emerald-400" /> Human approval gates and audit trails</li>
          </ul>
        </div>
      </section>
    </main>
  );
}
