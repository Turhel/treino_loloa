import type { ExerciseTimerSession } from "../../types/training";

export function ExerciseTimerSummary({ session }: { session: ExerciseTimerSession }) {
  return (
    <div className="grid gap-3 rounded-3xl bg-zinc-950/70 p-4 ring-1 ring-zinc-800">
      <h3 className="text-lg font-black text-zinc-50">Resumo do exercício</h3>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <span className="cute-badge cute-badge-lavender justify-center">{session.totalTensionSeconds}s tensão</span>
        <span className="cute-badge cute-badge-blue justify-center">{session.totalRestSeconds}s descanso</span>
        <span className="cute-badge cute-badge-peach justify-center">{session.estimatedKcal ?? "-"} kcal</span>
      </div>
      <div className="grid gap-2">
        {session.sets.map((set) => <p key={set.setNumber} className="rounded-2xl bg-zinc-900/70 px-3 py-2 text-sm text-zinc-300">Série {set.setNumber}: {set.loadKg ?? "-"} kg · {set.reps ?? "-"} reps · {set.tensionSeconds}s</p>)}
      </div>
    </div>
  );
}
