import type { ConsistencyStats } from "../../utils/performance";

export function ConsistencyCalendar({ stats }: { stats: ConsistencyStats }) {
  const colorFor = (day: { training: boolean; cardio: boolean }) => day.training && day.cardio ? "bg-violet-500" : day.training ? "bg-emerald-500" : day.cardio ? "bg-teal-500" : "bg-zinc-800";
  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <h2 className="text-xl font-black text-zinc-50">Consistência</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <span className="rounded-2xl bg-zinc-950 p-3 text-sm font-bold text-zinc-300">Sequência atual<br /><strong className="text-xl text-zinc-50">{stats.currentStreak}</strong></span>
        <span className="rounded-2xl bg-zinc-950 p-3 text-sm font-bold text-zinc-300">Melhor sequência<br /><strong className="text-xl text-zinc-50">{stats.bestStreak}</strong></span>
        <span className="rounded-2xl bg-zinc-950 p-3 text-sm font-bold text-zinc-300">Dias ativos<br /><strong className="text-xl text-zinc-50">{stats.trainedDays}</strong></span>
        <span className="rounded-2xl bg-zinc-950 p-3 text-sm font-bold text-zinc-300">Aderência<br /><strong className="text-xl text-zinc-50">{stats.adherence}%</strong></span>
      </div>
      <div className="mt-4 grid grid-cols-[repeat(auto-fill,minmax(14px,1fr))] gap-1">
        {stats.days.map((day) => <span key={day.date} title={day.date} className={`h-4 rounded ${colorFor(day)}`} />)}
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold text-zinc-400"><span>cinza: sem treino</span><span>verde: treino</span><span>teal: cardio</span><span>violeta: ambos</span></div>
    </section>
  );
}
