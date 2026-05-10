export type TrainingType =
  | "puxar"
  | "empurrar"
  | "gluteo"
  | "inferior"
  | "superior"
  | "core"
  | "cardio"
  | "mobilidade"
  | "descanso";
export type Phase = "fase1" | "fase2";
export type WeekId = string;

export type ExerciseVideoLinks = {
  youtube?: string;
  tiktok?: string;
};

export type Exercise = {
  id: string;
  order: number | string;
  name: string;
  focus: string;
  rest?: number;
  alternatives?: string[];
  videoKey?: string;
};

export type TrainingDay = {
  id: string;
  phase?: Phase;
  week: WeekId;
  day: string;
  title: string;
  type: TrainingType;
  optional?: string;
  exercises: Exercise[];
};

export type TrainingWeek = {
  id: WeekId;
  label: string;
  phase?: Phase;
  days: TrainingDay[];
};

export type TrainingPlan = {
  id: string;
  name: string;
  phase?: Phase | "custom";
  weeks: TrainingWeek[];
};

export type CustomTrainingPlan = TrainingPlan & {
  phase: "custom";
  createdAt: string;
  updatedAt: string;
};

export type MuscleInfo = {
  title: string;
  description: string;
  tips: string[];
  image: string;
  group?: string;
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  focus: string;
  muscles: string[];
  equipment?: string[];
  description: string;
  tips: string[];
  alternatives?: string[];
  rest?: number;
  videoKey?: string;
  illustrations?: string[];
  met?: number;
  exerciseKind?: "isolador" | "composto" | "cardio" | "mobilidade";
  availableByDefault?: boolean;
};

export type ExerciseLog = {
  done: boolean;
  skipped?: boolean;
  load: string;
  reps1: string;
  reps2: string;
  reps3: string;
  note: string;
  updatedAt?: string;
};

export type Logs = Record<string, ExerciseLog>;

export type ExerciseTimerStatus = "idle" | "preparing" | "working" | "resting" | "paused" | "completed" | "skipped";

export type ExerciseTimerSet = {
  setNumber: number;
  loadKg: number | null;
  reps: number | null;
  startedAt: string;
  endedAt: string;
  tensionSeconds: number;
  restSeconds: number;
};

export type ExerciseTimerSession = {
  id: string;
  dateKey: string;
  planId: string;
  weekId: string;
  dayName: string;
  exerciseId: string;
  exerciseName: string;
  status: ExerciseTimerStatus;
  preparationSeconds: number;
  defaultRestSeconds: number;
  currentSet: number;
  targetSets: number;
  sameLoadForAllSets: boolean;
  defaultLoadKg?: number | null;
  sets: ExerciseTimerSet[];
  totalTensionSeconds: number;
  totalRestSeconds: number;
  estimatedKcal: number | null;
  executedExerciseId?: string;
  executedExerciseName?: string;
  createdAt: string;
  updatedAt: string;
};

export type WeightEntry = {
  id: string;
  date: string;
  weightKg: number;
  heightCm?: number;
  source?: "signup" | "weekly-checkin" | "manual" | "sync";
  note?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};
