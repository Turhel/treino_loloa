import { useEffect, useMemo, useState } from "react";
import { Pause, Play, X } from "lucide-react";
import type { Exercise, ExerciseTimerSession, ExerciseTimerSet } from "../../types/training";
import { findExerciseLibraryItem } from "../../data/exerciseLibrary";
import { estimateKcalFromMet, metForExercise } from "../../utils/energy";
import { completeTimerSession, latestLoadAndReps } from "../../utils/timer";
import { TimerDisplay } from "./TimerDisplay";
import { SetResultForm } from "./SetResultForm";
import { RestControls } from "./RestControls";
import { ExerciseTimerSummary } from "./ExerciseTimerSummary";

type TimerTarget = {
  planId: string;
  weekId: string;
  dayName: string;
  dateKey: string;
  exercise: Exercise;
};

type Phase = "preparing" | "working" | "result" | "resting" | "completed" | "paused";

export function ExerciseTimerModal({
  target,
  bodyWeightKg,
  onClose,
  onComplete,
}: {
  target: TimerTarget | null;
  bodyWeightKg?: number | null;
  onClose: () => void;
  onComplete: (session: ExerciseTimerSession, logPatch: { load: string; reps1: string; reps2: string; reps3: string; done: boolean; skipped?: boolean }) => void;
}) {
  const [phase, setPhase] = useState<Phase>("preparing");
  const [phaseBeforePause, setPhaseBeforePause] = useState<Phase>("preparing");
  const [seconds, setSeconds] = useState(7);
  const [workStartedAt, setWorkStartedAt] = useState<string | null>(null);
  const [workTick, setWorkTick] = useState(0);
  const [restForSet, setRestForSet] = useState(0);
  const [sets, setSets] = useState<ExerciseTimerSet[]>([]);
  const [currentSet, setCurrentSet] = useState(1);
  const [targetSets, setTargetSets] = useState(3);
  const [sameLoad, setSameLoad] = useState(true);
  const [load, setLoad] = useState("");
  const [reps, setReps] = useState("");
  const [executedId, setExecutedId] = useState<string | undefined>();

  const exerciseItem = useMemo(() => target ? findExerciseLibraryItem(executedId ?? target.exercise.id) ?? findExerciseLibraryItem(target.exercise.name) : undefined, [target, executedId]);
  const exerciseName = exerciseItem?.name ?? target?.exercise.name ?? "";
  const defaultRest = target?.exercise.rest ?? exerciseItem?.rest ?? 60;
  const met = metForExercise(exerciseItem?.exerciseKind, exerciseItem?.met);
  const alternatives = target ? (target.exercise.alternatives ?? []).map((id) => findExerciseLibraryItem(id)).filter(Boolean) : [];

  useEffect(() => {
    if (!target) return;
    setPhase("preparing");
    setPhaseBeforePause("preparing");
    setSeconds(7);
    setWorkStartedAt(null);
    setWorkTick(0);
    setRestForSet(0);
    setSets([]);
    setCurrentSet(1);
    setTargetSets(3);
    setSameLoad(true);
    setLoad("");
    setReps("");
    setExecutedId(undefined);
  }, [target]);

  useEffect(() => {
    if (!target) return;
    if (phase !== "preparing" && phase !== "resting") return;
    if (seconds <= 0) {
      if (phase === "preparing") {
        setWorkStartedAt(new Date().toISOString());
        setWorkTick(0);
        setPhase("working");
      } else {
        setSets((current) => current.map((set, index) => index === current.length - 1 ? { ...set, restSeconds: restForSet } : set));
        setCurrentSet((value) => value + 1);
        setSeconds(7);
        setPhase("preparing");
      }
      return;
    }
    const id = window.setTimeout(() => setSeconds((value) => Math.max(0, value - 1)), 1000);
    return () => window.clearTimeout(id);
  }, [phase, restForSet, seconds, target]);

  useEffect(() => {
    if (phase !== "working") return;
    const id = window.setInterval(() => setWorkTick((value) => value + 1), 500);
    return () => window.clearInterval(id);
  }, [phase]);

  if (!target) return null;
  const currentTarget = target;

  function finishSet() {
    setPhase("result");
  }

  function saveSet() {
    const now = new Date();
    const started = workStartedAt ? new Date(workStartedAt) : now;
    const tensionSeconds = Math.max(1, Math.round((now.getTime() - started.getTime()) / 1000));
    const parsedLoad = Number(String(load).replace(",", "."));
    const parsedReps = Number(reps);
    const nextSet: ExerciseTimerSet = {
      setNumber: currentSet,
      loadKg: Number.isFinite(parsedLoad) && parsedLoad > 0 ? parsedLoad : null,
      reps: Number.isFinite(parsedReps) && parsedReps > 0 ? parsedReps : null,
      startedAt: started.toISOString(),
      endedAt: now.toISOString(),
      tensionSeconds,
      restSeconds: 0,
    };
    setSets((current) => [...current, nextSet]);
    if (sameLoad && nextSet.loadKg) setLoad(String(nextSet.loadKg));
    setReps("");
    if (currentSet >= targetSets) {
      complete([...sets, nextSet], "completed");
      return;
    }
    setRestForSet(defaultRest);
    setSeconds(defaultRest);
    setPhase("resting");
  }

  function finishRest(skip = false) {
    const elapsedRest = skip ? Math.max(0, restForSet - seconds) : restForSet;
    setSets((current) => current.map((set, index) => index === current.length - 1 ? { ...set, restSeconds: elapsedRest } : set));
    setCurrentSet((value) => value + 1);
    setSeconds(7);
    setPhase("preparing");
  }

  function complete(sourceSets = sets, status: "completed" | "skipped" = "completed") {
    const finalSets = sourceSets.map((set, index) => index === sourceSets.length - 1 && phase === "resting" ? { ...set, restSeconds: restForSet } : set);
    const totalTensionSeconds = finalSets.reduce((sum, set) => sum + set.tensionSeconds, 0);
    const totalRestSeconds = finalSets.reduce((sum, set) => sum + set.restSeconds, 0);
    const estimatedKcal = estimateKcalFromMet({ met, bodyWeightKg, activeSeconds: totalTensionSeconds, restSeconds: totalRestSeconds });
    const now = new Date().toISOString();
    const session = completeTimerSession({
      id: `timer-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      dateKey: currentTarget.dateKey,
      planId: currentTarget.planId,
      weekId: currentTarget.weekId,
      dayName: currentTarget.dayName,
      exerciseId: currentTarget.exercise.id,
      exerciseName: currentTarget.exercise.name,
      status,
      preparationSeconds: 7,
      defaultRestSeconds: defaultRest,
      currentSet,
      targetSets,
      sameLoadForAllSets: sameLoad,
      defaultLoadKg: Number(load) || null,
      sets: finalSets,
      totalTensionSeconds,
      totalRestSeconds,
      estimatedKcal,
      executedExerciseId: exerciseItem?.id,
      executedExerciseName: exerciseName,
      createdAt: now,
      updatedAt: now,
    });
    onComplete({ ...session, status }, { ...latestLoadAndReps(finalSets), done: status === "completed", skipped: status === "skipped" });
    setPhase("completed");
  }

  function togglePause() {
    if (phase === "paused") {
      setPhase(phaseBeforePause === "paused" ? "preparing" : phaseBeforePause);
      return;
    }
    if (phase === "completed" || phase === "result") return;
    setPhaseBeforePause(phase);
    setPhase("paused");
  }

  const elapsedWorkSeconds = Math.max(0, workStartedAt ? Math.round((Date.now() + workTick * 0 - Date.parse(workStartedAt)) / 1000) : 0);
  const previewTension = sets.reduce((sum, set) => sum + set.tensionSeconds, 0);
  const previewRest = sets.reduce((sum, set) => sum + set.restSeconds, 0);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-3" onClick={onClose}>
      <div onClick={(event) => event.stopPropagation()} className="cute-card-elevated max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl">
        <div className="cute-modal-header sticky top-0 z-10 flex items-start justify-between gap-3 border-b border-zinc-800 p-5">
          <div>
            <p className="cute-eyebrow">Timer por série</p>
            <h2 className="text-2xl font-black text-zinc-50">{exerciseName}</h2>
            <p className="mt-1 text-sm text-zinc-400">Série {Math.min(currentSet, targetSets)} de {targetSets}</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300"><X className="h-5 w-5" /></button>
        </div>

        <div className="grid gap-4 p-5">
          {!bodyWeightKg && <p className="rounded-2xl bg-amber-950/70 p-3 text-sm font-bold text-amber-200 ring-1 ring-amber-800">Adicione o peso corporal atual para ver kcal aproximadas.</p>}

          {phase === "preparing" && <TimerDisplay seconds={seconds} label="Preparar" />}
          {phase === "working" && <div className="grid gap-3"><TimerDisplay seconds={elapsedWorkSeconds} label="Série em andamento" /><button onClick={finishSet} className="cute-button cute-button-primary text-base">Concluir série</button></div>}
          {phase === "result" && <SetResultForm load={load} reps={reps} sameLoad={sameLoad} onLoadChange={setLoad} onRepsChange={setReps} onSameLoadChange={setSameLoad} onSave={saveSet} />}
          {phase === "resting" && <div className="grid gap-3"><TimerDisplay seconds={seconds} label="Descanso" /><RestControls onAdd={(extra) => { setSeconds((value) => value + extra); setRestForSet((value) => value + extra); }} onSkip={() => finishRest(true)} /></div>}
          {phase === "paused" && <div className="cute-empty">Timer pausado. Respira um pouco e continue quando estiver pronta.</div>}
          {phase === "completed" && <p className="cute-empty">Exercício salvo no histórico ✨</p>}

          <div className="grid grid-cols-2 gap-2">
            <label className="grid gap-1 text-xs font-black uppercase tracking-[0.12em] text-zinc-500">Séries alvo<input value={targetSets} onChange={(event) => setTargetSets(Math.max(1, Number(event.target.value) || 1))} inputMode="numeric" className="cute-input" /></label>
            <button type="button" onClick={togglePause} className="cute-button cute-button-secondary self-end">{phase === "paused" ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />} {phase === "paused" ? "Continuar" : "Pausar"}</button>
          </div>

          {!!sets.length && <ExerciseTimerSummary session={{ id: "preview", dateKey: currentTarget.dateKey, planId: currentTarget.planId, weekId: currentTarget.weekId, dayName: currentTarget.dayName, exerciseId: currentTarget.exercise.id, exerciseName: currentTarget.exercise.name, status: "working", preparationSeconds: 7, defaultRestSeconds: defaultRest, currentSet, targetSets, sameLoadForAllSets: sameLoad, sets, totalTensionSeconds: previewTension, totalRestSeconds: previewRest, estimatedKcal: estimateKcalFromMet({ met, bodyWeightKg, activeSeconds: previewTension, restSeconds: previewRest }), createdAt: "", updatedAt: "" }} />}

          {alternatives.length > 0 && <div className="grid gap-2"><p className="text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Trocar exercício</p><div className="flex flex-wrap gap-2">{alternatives.map((item) => item && <button key={item.id} onClick={() => setExecutedId(item.id)} className="cute-badge cute-badge-lavender">{item.name}</button>)}</div></div>}

          <div className="grid gap-2 sm:grid-cols-2">
            <button type="button" onClick={() => complete(sets, "skipped")} className="cute-button cute-button-secondary">Pular por enquanto</button>
            <button type="button" onClick={onClose} className="cute-button cute-button-ghost">Cancelar sem salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
