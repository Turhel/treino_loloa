export type TrainingType = "puxar" | "empurrar" | "gluteo" | "inferior" | "superior" | "cardio" | "descanso";
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
};

export type ExerciseLibraryItem = {
  id: string;
  name: string;
  focus: string;
  muscles: string[];
  description: string;
  tips: string[];
  alternatives?: string[];
  rest?: number;
  videoKey?: string;
};

export type ExerciseLog = {
  done: boolean;
  load: string;
  reps1: string;
  reps2: string;
  reps3: string;
  note: string;
  updatedAt?: string;
};

export type Logs = Record<string, ExerciseLog>;
