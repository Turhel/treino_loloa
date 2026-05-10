import { useMemo, useState } from "react";
import { Edit3, Plus, Trash2 } from "lucide-react";
import type { WeightEntry } from "../../types/training";
import { normalizeWeightHistory, sortWeightHistory } from "../../utils/weight";
import { WeightEntryModal } from "./WeightEntryModal";

type Props = {
  history: WeightEntry[];
  heightCm?: number | null;
  onSave: (entry: WeightEntry) => void;
  onDelete: (entryId: string) => void;
};

const sourceLabels: Record<NonNullable<WeightEntry["source"]>, string> = {
  signup: "Cadastro",
  "weekly-checkin": "Check-in semanal",
  manual: "Manual",
  sync: "Sincronizado",
};

export function WeightHistoryManager({ history, heightCm, onSave, onDelete }: Props) {
  const [modalEntry, setModalEntry] = useState<WeightEntry | null | undefined>(undefined);
  const [pendingDelete, setPendingDelete] = useState<WeightEntry | null>(null);
  const entries = useMemo(() => sortWeightHistory(normalizeWeightHistory(history), "desc"), [history]);
  const latestId = entries[0]?.id;

  return (
    <section className="cute-card rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="cute-eyebrow">Histórico de peso</p>
          <h2 className="text-2xl font-black text-zinc-50">Registros cadastrados</h2>
          <p className="mt-1 text-sm font-bold text-zinc-400">Edite um peso digitado errado ou remova um registro sem afetar os treinos.</p>
        </div>
        <button type="button" onClick={() => setModalEntry(null)} className="cute-button cute-button-secondary"><Plus className="h-4 w-4" /> Registrar peso</button>
      </div>

      {entries.length === 0 ? (
        <div className="cute-empty mt-5">Nenhum peso salvo ainda 💗</div>
      ) : (
        <div className="mt-5 grid gap-3">
          {entries.map((entry) => (
            <article key={entry.id} className={`rounded-3xl border p-4 ${entry.id === latestId ? "border-pink-300/40 bg-rose-950/20" : "border-zinc-800 bg-zinc-950/70"}`}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xl font-black text-zinc-50">{entry.weightKg.toFixed(1)} kg</p>
                    {entry.id === latestId && <span className="cute-badge cute-badge-pink">mais recente</span>}
                    {entry.source && <span className="cute-badge cute-badge-neutral">{sourceLabels[entry.source]}</span>}
                  </div>
                  <p className="mt-1 text-sm font-bold text-zinc-400">{formatDate(entry.date)}{entry.heightCm ? ` · ${entry.heightCm} cm` : ""}</p>
                  {entry.note && <p className="mt-2 rounded-2xl bg-zinc-900/80 px-3 py-2 text-sm font-bold text-zinc-300">{entry.note}</p>}
                </div>
                <div className="flex shrink-0 gap-2">
                  <button type="button" onClick={() => setModalEntry(entry)} className="cute-button cute-button-secondary min-h-0 px-3 py-2 text-xs"><Edit3 className="h-3.5 w-3.5" /> Editar</button>
                  <button type="button" onClick={() => setPendingDelete(entry)} className="cute-button cute-button-danger min-h-0 px-3 py-2 text-xs"><Trash2 className="h-3.5 w-3.5" /> Remover</button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {modalEntry !== undefined && <WeightEntryModal entry={modalEntry} defaultHeightCm={heightCm} onClose={() => setModalEntry(undefined)} onSave={(entry) => { onSave(entry); setModalEntry(undefined); }} />}
      {pendingDelete && (
        <div className="fixed inset-0 z-[85] flex items-center justify-center bg-black/80 p-4" onClick={() => setPendingDelete(null)}>
          <div onClick={(event) => event.stopPropagation()} className="cute-card-elevated w-full max-w-sm rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-2xl">
            <p className="cute-eyebrow">Confirmar remoção</p>
            <h3 className="text-xl font-black text-zinc-50">Remover este registro de peso?</h3>
            <p className="mt-2 text-sm font-bold text-zinc-400">{formatDate(pendingDelete.date)} · {pendingDelete.weightKg.toFixed(1)} kg</p>
            <div className="mt-5 grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setPendingDelete(null)} className="cute-button cute-button-secondary">Cancelar</button>
              <button type="button" onClick={() => { onDelete(pendingDelete.id); setPendingDelete(null); }} className="cute-button cute-button-danger">Remover</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function formatDate(date: string) {
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year}`;
}
