import { useMemo, useState } from "react";
import { Scale, X } from "lucide-react";
import type { WeightEntry } from "../../types/training";
import { parseDecimalNumber, validateWeightEntry } from "../../utils/weight";

type Props = {
  entry?: WeightEntry | null;
  defaultHeightCm?: number | null;
  onClose: () => void;
  onSave: (entry: WeightEntry) => void;
};

function makeWeightId() {
  return `weight-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function WeightEntryModal({ entry, defaultHeightCm, onClose, onSave }: Props) {
  const [date, setDate] = useState(entry?.date ?? todayKey());
  const [weight, setWeight] = useState(entry ? String(entry.weightKg) : "");
  const [height, setHeight] = useState(entry?.heightCm ? String(entry.heightCm) : defaultHeightCm ? String(defaultHeightCm) : "");
  const [note, setNote] = useState(entry?.note ?? "");
  const parsedWeight = parseDecimalNumber(weight);
  const parsedHeight = height.trim() ? parseDecimalNumber(height) : undefined;
  const validation = useMemo(() => validateWeightEntry({ date, weightKg: parsedWeight, heightCm: parsedHeight }), [date, parsedHeight, parsedWeight]);

  function save() {
    if (!validation.valid) return;
    const now = new Date().toISOString();
    onSave({
      id: entry?.id ?? makeWeightId(),
      date,
      weightKg: parsedWeight,
      heightCm: parsedHeight,
      source: entry?.source ?? "manual",
      note: note.trim() || undefined,
      createdAt: entry?.createdAt ?? now,
      updatedAt: now,
      deletedAt: null,
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="cute-card-elevated w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="cute-modal-header flex items-start justify-between gap-4 border-b border-zinc-800 p-5">
          <div>
            <p className="cute-eyebrow">Peso corporal</p>
            <h2 className="text-2xl font-black text-zinc-50">{entry ? "Editar peso" : "Registrar peso"}</h2>
          </div>
          <button type="button" onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button>
        </div>
        <div className="grid gap-3 p-5">
          <label className="grid gap-1 text-sm font-bold text-zinc-300">Data<input type="date" value={date} onChange={(event) => setDate(event.target.value)} className="cute-input" /></label>
          <label className="grid gap-1 text-sm font-bold text-zinc-300">Peso em kg<input value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="decimal" placeholder="Ex.: 105" className="cute-input" /></label>
          <label className="grid gap-1 text-sm font-bold text-zinc-300">Altura em cm <span className="font-semibold text-zinc-500">opcional</span><input value={height} onChange={(event) => setHeight(event.target.value)} inputMode="decimal" placeholder="Ex.: 165" className="cute-input" /></label>
          <label className="grid gap-1 text-sm font-bold text-zinc-300">Nota <span className="font-semibold text-zinc-500">opcional</span><input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Ex.: após treino, jejum..." className="cute-input" /></label>
          {!validation.valid && <div className="rounded-2xl bg-rose-950/40 p-3 text-sm font-bold text-rose-100 ring-1 ring-rose-800">{validation.errors[0]}</div>}
          <button type="button" disabled={!validation.valid} onClick={save} className="cute-button cute-button-primary disabled:cursor-not-allowed disabled:opacity-50"><Scale className="h-4 w-4" /> Salvar peso</button>
        </div>
      </div>
    </div>
  );
}
