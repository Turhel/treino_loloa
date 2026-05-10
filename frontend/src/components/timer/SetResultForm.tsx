export function SetResultForm({
  load,
  reps,
  sameLoad,
  onLoadChange,
  onRepsChange,
  onSameLoadChange,
  onSave,
}: {
  load: string;
  reps: string;
  sameLoad: boolean;
  onLoadChange: (value: string) => void;
  onRepsChange: (value: string) => void;
  onSameLoadChange: (value: boolean) => void;
  onSave: () => void;
}) {
  return (
    <div className="grid gap-3 rounded-3xl bg-zinc-950/70 p-4 ring-1 ring-zinc-800">
      <label className="flex items-center justify-between gap-3 rounded-2xl bg-zinc-900/70 px-3 py-2 text-sm font-bold text-zinc-300">
        Usar mesma carga
        <input type="checkbox" checked={sameLoad} onChange={(event) => onSameLoadChange(event.target.checked)} className="h-5 w-5" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Carga<input value={load} onChange={(event) => onLoadChange(event.target.value)} inputMode="decimal" className="cute-input" placeholder="kg" /></label>
        <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Reps<input value={reps} onChange={(event) => onRepsChange(event.target.value)} inputMode="numeric" className="cute-input" placeholder="reps" /></label>
      </div>
      <button type="button" onClick={onSave} disabled={!reps} className="cute-button cute-button-primary disabled:opacity-50">Salvar série</button>
    </div>
  );
}
