import { approvalQueue } from '@/lib/mock-data';

export default function ApprovalsPage() {
  return (
    <main className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.25em] text-cyan-300">Approval dashboard</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">Human review and publishing gates</h2>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {approvalQueue.map((item) => (
          <div key={item.id} className="card p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.2em] text-slate-400">{item.id}</span>
              <span className="badge border-amber-500/30 bg-amber-500/10 text-amber-200">{item.urgency}</span>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-white">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-300">{item.stage}</p>
            <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Approver</p>
              <p className="mt-2 text-sm text-slate-100">{item.reviewer}</p>
            </div>
            <div className="mt-6 flex items-center gap-3">
              <button className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-medium text-slate-950">Approve</button>
              <button className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200">Request changes</button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
