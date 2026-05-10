export function TimerDisplay({ seconds, label }: { seconds: number; label: string }) {
  const safe = Math.max(0, seconds);
  const minutes = Math.floor(safe / 60);
  const rest = safe % 60;
  return (
    <div className="rounded-3xl bg-zinc-950/80 p-5 text-center ring-1 ring-zinc-800">
      <p className="cute-eyebrow">{label}</p>
      <div className="mt-2 text-6xl font-black tabular-nums text-zinc-50">{String(minutes).padStart(2, "0")}:{String(rest).padStart(2, "0")}</div>
    </div>
  );
}
