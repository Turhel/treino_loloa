import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  CheckCircle2,
  ClipboardCheck,
  Download,
  Dumbbell,
  Printer,
  RotateCcw,
  Search,
  Sparkles,
  TimerReset,
  Trash2,
  X,
} from "lucide-react";

type TrainingType = "puxar" | "empurrar" | "gluteo" | "inferior" | "superior" | "cardio" | "descanso";
type Phase = "fase1" | "fase2";
type Week = "A" | "B";

type Exercise = {
  order: number | string;
  name: string;
  focus: string;
  video?: string;
  rest?: number;
};

type DayPlan = {
  id: string;
  phase: Phase;
  week: Week;
  day: string;
  title: string;
  type: TrainingType;
  optional?: string;
  exercises: Exercise[];
};

type MuscleInfo = {
  title: string;
  description: string;
  tips: string[];
  image: string;
};

type ExerciseLog = {
  done: boolean;
  load: string;
  reps1: string;
  reps2: string;
  reps3: string;
  note: string;
};

type Logs = Record<string, ExerciseLog>;

const STORAGE_KEY = "treino-loloa-logs-v2";
const START_DATE_KEY = "treino-loloa-start-week-a";
const AUTO_WEEK_KEY = "treino-loloa-auto-week";

const typeStyle: Record<TrainingType, { label: string; chip: string; border: string; soft: string; icon: string }> = {
  puxar: {
    label: "Puxar",
    chip: "bg-blue-950/70 text-blue-200 ring-blue-800",
    border: "border-blue-500",
    soft: "bg-blue-950/30",
    icon: "🔵",
  },
  empurrar: {
    label: "Empurrar",
    chip: "bg-rose-950/70 text-rose-200 ring-rose-800",
    border: "border-rose-500",
    soft: "bg-rose-950/30",
    icon: "🔴",
  },
  gluteo: {
    label: "Posterior/glúteos",
    chip: "bg-orange-950/70 text-orange-200 ring-orange-800",
    border: "border-orange-500",
    soft: "bg-orange-950/30",
    icon: "🟠",
  },
  inferior: {
    label: "Inferiores",
    chip: "bg-emerald-950/70 text-emerald-200 ring-emerald-800",
    border: "border-emerald-500",
    soft: "bg-emerald-950/30",
    icon: "🟢",
  },
  superior: {
    label: "Superiores/acessórios",
    chip: "bg-violet-950/70 text-violet-200 ring-violet-800",
    border: "border-violet-500",
    soft: "bg-violet-950/30",
    icon: "🟣",
  },
  cardio: {
    label: "Cardio/mobilidade",
    chip: "bg-teal-950/70 text-teal-200 ring-teal-800",
    border: "border-teal-500",
    soft: "bg-teal-950/30",
    icon: "🟡",
  },
  descanso: {
    label: "Descanso",
    chip: "bg-zinc-800 text-zinc-300 ring-zinc-700",
    border: "border-zinc-500",
    soft: "bg-zinc-800/70",
    icon: "⚪",
  },
};

// =====================================================
// LINKS MANUAIS DOS VÍDEOS
// =====================================================
// Como usar:
// 1. Copie o nome do exercício.
// 2. Transforme em uma chave simples usando letras minúsculas, sem acento e com _.
//    Exemplo: "Hip thrust" vira "hip_thrust".
// 3. Cole o link do YouTube ou TikTok no campo correspondente.
// 4. O botão "Abrir" vai usar o link manual. Se não tiver link manual,
//    ele cai na busca automática do YouTube.
//
// Exemplos:
// hip_thrust: {
//   youtube: "https://www.youtube.com/watch?v=SEU_VIDEO",
// },
// stiff_com_halteres: {
//   tiktok: "https://www.tiktok.com/@profissional/video/SEU_VIDEO",
// },

const exerciseVideoLinks: Record<
  string,
  {
    youtube?: string;
    tiktok?: string;
  }
> = {
  // Costas / puxar
  puxada_na_frente_pegada_neutra_ou_aberta: {
    youtube: "",
    tiktok: "",
  },
  remada_baixa_no_cabo: {
    youtube: "",
    tiktok: "",
  },
  remada_unilateral_com_halter_apoiada: {
    youtube: "",
    tiktok: "",
  },
  pulldown_com_braco_reto_no_cabo: {
    youtube: "",
    tiktok: "",
  },
  face_pull_no_cabo: {
    youtube: "",
    tiktok: "",
  },
  encolhimento_com_halteres_ou_maquina: {
    youtube: "",
    tiktok: "",
  },

  // Glúteos / posterior
  elevacao_pelvica_hip_thrust: {
    youtube: "",
    tiktok: "",
  },
  hip_thrust: {
    youtube: "",
    tiktok: "",
  },
  leg_press_com_pes_mais_altos: {
    youtube: "",
    tiktok: "",
  },
  stiff_com_halteres: {
    youtube: "",
    tiktok: "",
  },
  stiff: {
    youtube: "",
    tiktok: "",
  },
  mesa_flexora: {
    youtube: "",
    tiktok: "",
  },
  flexora_sentada: {
    youtube: "",
    tiktok: "",
  },
  cadeira_abdutora: {
    youtube: "",
    tiktok: "",
  },
  gluteo_no_cabo_ou_maquina: {
    youtube: "",
    tiktok: "",
  },
  gluteo_no_cabo: {
    youtube: "",
    tiktok: "",
  },
  extensao_lombar_45_graus_leve_e_controlada: {
    youtube: "",
    tiktok: "",
  },
  extensao_lombar_controlada: {
    youtube: "",
    tiktok: "",
  },

  // Peito / empurrar
  supino_reto_na_maquina_ou_chest_press: {
    youtube: "",
    tiktok: "",
  },
  supino_inclinado_com_halteres: {
    youtube: "",
    tiktok: "",
  },
  crucifixo_na_maquina_ou_cabo: {
    youtube: "",
    tiktok: "",
  },
  desenvolvimento_na_maquina: {
    youtube: "",
    tiktok: "",
  },
  elevacao_lateral: {
    youtube: "",
    tiktok: "",
  },
  triceps_corda_no_pulley: {
    youtube: "",
    tiktok: "",
  },
  triceps_frances_no_cabo_ou_halter: {
    youtube: "",
    tiktok: "",
  },

  // Inferiores
  agachamento_no_smith_ou_hack_machine: {
    youtube: "",
    tiktok: "",
  },
  hack_squat_ou_agachamento_no_smith: {
    youtube: "",
    tiktok: "",
  },
  leg_press_com_pes_medios: {
    youtube: "",
    tiktok: "",
  },
  cadeira_extensora: {
    youtube: "",
    tiktok: "",
  },
  cadeira_adutora: {
    youtube: "",
    tiktok: "",
  },
  panturrilha_em_pe: {
    youtube: "",
    tiktok: "",
  },
  panturrilha_sentada: {
    youtube: "",
    tiktok: "",
  },

  // Braços / acessórios
  rosca_martelo_com_halteres: {
    youtube: "",
    tiktok: "",
  },
  rosca_martelo_no_cabo: {
    youtube: "",
    tiktok: "",
  },
  rosca_direta_no_cabo: {
    youtube: "",
    tiktok: "",
  },
  rosca_scott_maquina_nunca_fazer_amplitude_completa: {
    youtube: "",
    tiktok: "",
  },
  rosca_alternada_com_halteres: {
    youtube: "",
    tiktok: "",
  },
  triceps_barra_v_no_pulley: {
    youtube: "",
    tiktok: "",
  },
  triceps_unilateral_no_cabo: {
    youtube: "",
    tiktok: "",
  },
  triceps_testa_no_cabo: {
    youtube: "",
    tiktok: "",
  },
  triceps_corda: {
    youtube: "",
    tiktok: "",
  },
};

const youtubeSearch = (query: string) =>
  `https://www.youtube.com/results?search_query=${encodeURIComponent(`${query} execução correta profissional educação física`)}`;

function videoKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getExerciseVideoUrl(name: string, videoName?: string) {
  if (videoName === "-") return undefined;

  const keyFromName = videoKey(name);
  const keyFromVideoName = videoName ? videoKey(videoName) : keyFromName;

  const manualVideo = exerciseVideoLinks[keyFromName] ?? exerciseVideoLinks[keyFromVideoName];

  if (manualVideo?.youtube && manualVideo.youtube.trim()) return manualVideo.youtube;
  if (manualVideo?.tiktok && manualVideo.tiktok.trim()) return manualVideo.tiktok;

  return youtubeSearch(videoName ?? name);
}

function restFor(name: string) {
  const text = name.toLowerCase();
  if (["leg press", "hip thrust", "supino", "agachamento", "hack", "stiff", "remada", "desenvolvimento"].some((term) => text.includes(term))) return 90;
  if (["cardio", "mobilidade", "alongamento"].some((term) => text.includes(term))) return 0;
  return 60;
}

function ex(order: number | string, name: string, focus: string, videoName?: string): Exercise {
  return {
    order,
    name,
    focus,
    rest: restFor(name),
    video: getExerciseVideoUrl(name, videoName),
  };
}

const muscleImages: Record<string, MuscleInfo> = {
  biceps: {
    title: "Bíceps",
    description: "Atua em puxadas e roscas. Entra bastante nos treinos de puxar, mesmo quando o objetivo principal é costas.",
    tips: ["Não balance o tronco.", "Controle a descida.", "Mantenha cotovelos relativamente fixos."],
    image: "/musculos/biceps.png",
  },
  braquial: {
    title: "Braquial",
    description: "Músculo auxiliar importante nas roscas, especialmente na rosca martelo. Ajuda a dar volume ao braço.",
    tips: ["Use pegada neutra quando quiser enfatizar mais.", "Controle o movimento.", "Evite roubar com o ombro."],
    image: "/musculos/braquial.png",
  },
  costas_medias: {
    title: "Costas médias",
    description: "Região muito trabalhada em remadas. Ajuda postura, estabilidade escapular e espessura das costas.",
    tips: ["Puxe com os cotovelos.", "Segure 1 segundo na contração.", "Não arredonde a coluna."],
    image: "/musculos/costas_medias.png",
  },
  costas_superiores: {
    title: "Costas superiores",
    description: "Inclui região alta das costas, trapézio médio e musculatura escapular. Importante para postura.",
    tips: ["Evite elevar demais os ombros.", "Controle a escápula.", "Não transforme remada em tranco."],
    image: "/musculos/costas_superiores.png",
  },
  deltoide_posterior: {
    title: "Deltoide posterior",
    description: "Parte de trás do ombro. Trabalha muito em face pull, crucifixo inverso e movimentos posturais.",
    tips: ["Carga leve costuma funcionar melhor.", "Puxe abrindo os braços.", "Não compense com lombar."],
    image: "/musculos/deltoide_posterior.png",
  },
  dorsal: {
    title: "Dorsal",
    description: "Trabalha largura das costas em puxadas verticais e pulldowns. A dica mental é puxar com os cotovelos, não com as mãos.",
    tips: ["Evite jogar o tronco demais para trás.", "Pense em descer os cotovelos.", "Controle a volta da carga."],
    image: "/musculos/dorsal.png",
  },
  gastrocnemio: {
    title: "Gastrocnêmio",
    description: "Parte mais visível da panturrilha, mais enfatizada em exercícios com joelho estendido, como panturrilha em pé.",
    tips: ["Use amplitude completa.", "Pause no topo.", "Desça controlando."],
    image: "/musculos/gastrocnemio.png",
  },
  gluteo_maximo: {
    title: "Glúteo máximo",
    description: "Principal músculo de volume dos glúteos. Hip thrust, glúteo no cabo e leg press alto trabalham bastante essa região.",
    tips: ["Contraia no topo do hip thrust.", "Não hiperestenda a lombar.", "Controle a descida."],
    image: "/musculos/gluteo_maximo.png",
  },
  gluteo_medio: {
    title: "Glúteo médio",
    description: "Importante para estabilidade do quadril. Muito trabalhado em abdução de quadril e cadeira abdutora.",
    tips: ["Controle a abertura.", "Evite impulso.", "Sinta a lateral do quadril trabalhando."],
    image: "/musculos/gluteo_medio.png",
  },
  gluteos: {
    title: "Glúteos",
    description: "Grupo muscular dos glúteos. Participa de extensão, abdução e estabilização do quadril.",
    tips: ["Priorize execução limpa.", "Evite jogar tudo para lombar.", "Use amplitude confortável."],
    image: "/musculos/gluteos.png",
  },
  lombar: {
    title: "Lombar",
    description: "Região importante para suporte do tronco. Entra em extensões lombares, stiff e exercícios de estabilidade.",
    tips: ["Movimento controlado.", "Evite hiperextensão.", "Pare se houver dor articular."],
    image: "/musculos/lombar.png",
  },
  ombro_lateral: {
    title: "Ombro lateral",
    description: "Parte lateral do deltoide, muito trabalhada em elevação lateral. Ajuda no visual de ombro mais largo.",
    tips: ["Cotovelos levemente flexionados.", "Não suba além do necessário.", "Carga menor e controle maior."],
    image: "/musculos/ombro_lateral.png",
  },
  ombros: {
    title: "Ombros",
    description: "Grupo dos deltoides. Desenvolvimento, elevação lateral e face pull trabalham partes diferentes do ombro.",
    tips: ["Controle a amplitude.", "Evite dor articular.", "Não use impulso do tronco."],
    image: "/musculos/ombros.png",
  },
  panturrilha: {
    title: "Panturrilha",
    description: "Grupo muscular da panturrilha, incluindo gastrocnêmio e sóleo. Trabalha em panturrilha em pé, sentada e no leg press.",
    tips: ["Amplitude completa.", "Pause no topo.", "Não faça repetição quicando."],
    image: "/musculos/panturrilha.png",
  },
  peitoral: {
    title: "Peitoral",
    description: "Trabalhado em supinos, crucifixos e crossover. Inclinado tende a enfatizar mais a parte superior.",
    tips: ["Escápulas estáveis.", "Controle a descida.", "Não deixe o ombro dominar tudo."],
    image: "/musculos/peitoral.png",
  },
  posterior_coxa: {
    title: "Posterior de coxa",
    description: "Grupo posterior da coxa. Muito trabalhado em stiff, mesa flexora e flexora sentada.",
    tips: ["Coluna neutra no stiff.", "Controle a descida.", "Na flexora, segure a contração."],
    image: "/musculos/posterior_coxa.png",
  },
  quadriceps: {
    title: "Quadríceps",
    description: "Parte anterior da coxa. Trabalha em agachamento, leg press, hack e cadeira extensora.",
    tips: ["Joelhos acompanham a linha dos pés.", "Controle a descida.", "Na extensora, controle o topo."],
    image: "/musculos/quadriceps.png",
  },
  soleo: {
    title: "Sóleo",
    description: "Parte da panturrilha mais enfatizada em exercícios com joelho flexionado, como panturrilha sentada.",
    tips: ["Desça bem controlado.", "Pause no topo.", "Não use impulso."],
    image: "/musculos/soleo.png",
  },
  trapezio: {
    title: "Trapézio",
    description: "Participa de encolhimentos, remadas e estabilidade dos ombros.",
    tips: ["Suba e desça controlando.", "Não gire os ombros.", "Menos ego, mais amplitude limpa."],
    image: "/musculos/trapezio.png",
  },
  triceps: {
    title: "Tríceps",
    description: "Trabalha nos empurrões, supinos e extensões. A cabeça longa aparece melhor em movimentos acima da cabeça.",
    tips: ["Estenda sem travar com violência.", "Não abra demais os cotovelos.", "Controle o retorno."],
    image: "/musculos/triceps.png",
  },
  core: {
    title: "Core",
    description: "Core anti-rotação, prancha e dead bug treinam estabilidade. Menos abdominal ninja, mais controle.",
    tips: ["Respiração controlada.", "Coluna neutra.", "Qualidade acima de tempo absurdo."],
    image: "/musculos/lombar.png",
  },
};

function focusToKey(focus: string) {
  const text = focus.toLowerCase();

  if (text.includes("costas superiores")) return "costas_superiores";
  if (text.includes("costas médias") || text.includes("costas medias") || text.includes("meio das costas") || text.includes("espessura")) return "costas_medias";
  if (text.includes("deltoide posterior") || text.includes("ombro posterior") || text.includes("postura")) return "deltoide_posterior";
  if (text.includes("ombro lateral")) return "ombro_lateral";
  if (text.includes("ombros") || text.includes("ombro")) return "ombros";
  if (text.includes("glúteo máximo") || text.includes("gluteo maximo")) return "gluteo_maximo";
  if (text.includes("glúteo médio") || text.includes("gluteo medio")) return "gluteo_medio";
  if (text.includes("glúteos") || text.includes("gluteos") || text.includes("glúteo") || text.includes("gluteo")) return "gluteos";
  if (text.includes("posterior de coxa") || text.includes("posterior")) return "posterior_coxa";
  if (text.includes("gastrocnêmio") || text.includes("gastrocnemio")) return "gastrocnemio";
  if (text.includes("sóleo") || text.includes("soleo")) return "soleo";
  if (text.includes("panturrilha")) return "panturrilha";
  if (text.includes("quadríceps") || text.includes("quadriceps")) return "quadriceps";
  if (text.includes("peito") || text.includes("peitoral")) return "peitoral";
  if (text.includes("tríceps") || text.includes("triceps")) return "triceps";
  if (text.includes("braquial")) return "braquial";
  if (text.includes("bíceps") || text.includes("biceps")) return "biceps";
  if (text.includes("trapézio") || text.includes("trapezio")) return "trapezio";
  if (text.includes("dorsal")) return "dorsal";
  if (text.includes("lombar")) return "lombar";

  return "core";
}

function alternativesFor(name: string) {
  const text = name.toLowerCase();
  if (text.includes("hip thrust") || text.includes("elevação pélvica")) return ["Máquina de glúteo", "Ponte com barra", "Glúteo no cabo"];
  if (text.includes("hack") || text.includes("agachamento")) return ["Smith", "Leg press", "Cadeira extensora"];
  if (text.includes("leg press")) return ["Hack machine", "Smith", "Cadeira extensora"];
  if (text.includes("stiff")) return ["Flexora sentada", "Mesa flexora", "Terra romeno leve"];
  if (text.includes("puxada")) return ["Puxada neutra", "Puxada supinada", "Remada articulada"];
  if (text.includes("remada")) return ["Remada baixa", "Remada unilateral", "Remada máquina com apoio"];
  if (text.includes("supino")) return ["Chest press", "Supino máquina", "Crossover leve"];
  if (text.includes("tríceps") || text.includes("triceps")) return ["Tríceps corda", "Tríceps barra V", "Tríceps unilateral"];
  if (text.includes("rosca")) return ["Rosca cabo", "Rosca alternada", "Rosca martelo"];
  if (text.includes("panturrilha")) return ["Panturrilha em pé", "Panturrilha sentada", "Panturrilha no leg press"];
  return ["Máquina equivalente", "Variação com cabo", "Variação com halter leve"];
}

const plans: DayPlan[] = [
  {
    id: "fase1-a-segunda",
    phase: "fase1",
    week: "A",
    day: "Segunda",
    title: "Puxar A: costas completas + bíceps",
    type: "puxar",
    optional: "Cardio 15 minutos; abdominal curto, como prancha inclinada ou dead bug.",
    exercises: [
      ex(1, "Puxada na frente, pegada neutra ou aberta", "Dorsal/largura"),
      ex(2, "Remada baixa no cabo", "Meio das costas"),
      ex(3, "Remada unilateral com halter apoiada", "Dorsal e controle"),
      ex(4, "Pulldown com braço reto no cabo", "Dorsal com menor dependência do bíceps"),
      ex(5, "Face pull no cabo", "Deltoide posterior e trapézio médio"),
      ex(6, "Encolhimento com halteres ou máquina", "Trapézio superior"),
      ex(7, "Rosca martelo com halteres", "Bíceps e braquial"),
    ],
  },
  {
    id: "fase1-a-terca",
    phase: "fase1",
    week: "A",
    day: "Terça",
    title: "Glúteos/posterior A",
    type: "gluteo",
    optional: "Panturrilha sentada 3x12–20; cardio 10 a 15 minutos leve.",
    exercises: [
      ex(1, "Elevação pélvica / hip thrust", "Glúteo máximo"),
      ex(2, "Leg press com pés mais altos", "Glúteo e posterior"),
      ex(3, "Stiff com halteres", "Posterior e glúteos"),
      ex(4, "Mesa flexora", "Posterior de coxa"),
      ex(5, "Cadeira abdutora", "Glúteo médio"),
      ex(6, "Glúteo no cabo ou máquina", "Glúteo máximo"),
      ex(7, "Extensão lombar 45 graus, leve e controlada", "Lombar e glúteo"),
    ],
  },
  {
    id: "fase1-a-quarta",
    phase: "fase1",
    week: "A",
    day: "Quarta",
    title: "Empurrar A: peito + ombros + tríceps",
    type: "empurrar",
    optional: "Cardio 15 minutos; abdominal na máquina ou no cabo.",
    exercises: [
      ex(1, "Supino reto na máquina ou chest press", "Peito geral"),
      ex(2, "Supino inclinado com halteres", "Peito superior"),
      ex(3, "Crucifixo na máquina ou cabo", "Peitoral isolado"),
      ex(4, "Desenvolvimento na máquina", "Ombros"),
      ex(5, "Elevação lateral", "Ombro lateral"),
      ex(6, "Tríceps corda no pulley", "Tríceps"),
      ex(7, "Tríceps francês no cabo ou halter", "Cabeça longa do tríceps"),
    ],
  },
  {
    id: "fase1-a-quinta",
    phase: "fase1",
    week: "A",
    day: "Quinta",
    title: "Inferiores A: quadríceps + adutores + panturrilha",
    type: "inferior",
    optional: "Cardio 10 a 15 minutos leve; Pallof press no cabo.",
    exercises: [
      ex(1, "Agachamento no Smith ou hack machine", "Quadríceps e glúteo"),
      ex(2, "Leg press com pés médios", "Quadríceps"),
      ex(3, "Cadeira extensora", "Quadríceps"),
      ex(4, "Cadeira adutora", "Parte interna da coxa"),
      ex(5, "Flexora sentada ou mesa flexora leve", "Posterior, sem excesso de carga"),
      ex(6, "Panturrilha em pé", "Gastrocnêmio"),
      ex(7, "Panturrilha sentada", "Sóleo"),
    ],
  },
  {
    id: "fase1-a-sexta",
    phase: "fase1",
    week: "A",
    day: "Sexta",
    title: "Superiores misto A: costas superiores + ombros + braços + peito leve",
    type: "superior",
    optional: "Cardio 15 a 20 minutos; abdômen leve.",
    exercises: [
      ex(1, "Remada máquina com peito apoiado", "Costas superiores"),
      ex(2, "Puxada fechada neutra", "Dorsal"),
      ex(3, "Peck deck (crucifixo) inverso", "Deltoide posterior"),
      ex(4, "Elevação lateral no cabo ou halter", "Ombro lateral"),
      ex(5, "Supino inclinado máquina, leve/moderado", "Peito superior"),
      ex(6, "Rosca direta no cabo", "Bíceps"),
      ex(7, "Tríceps barra V no pulley", "Tríceps"),
    ],
  },
  {
    id: "fase1-a-sabado",
    phase: "fase1",
    week: "A",
    day: "Sábado",
    title: "Cardio, mobilidade e recuperação ativa",
    type: "cardio",
    exercises: [
      ex("Cardio", "25 a 40 minutos de caminhada inclinada, bike ou elíptico", "Resistência", "-"),
      ex("Mobilidade", "Quadril, tornozelo e coluna torácica", "Mobilidade", "-"),
      ex("Core opcional", "Dead bug, Pallof press e prancha inclinada", "Core", "dead bug pallof press prancha inclinada"),
    ],
  },
  {
    id: "fase1-b-segunda",
    phase: "fase1",
    week: "B",
    day: "Segunda",
    title: "Glúteos/quadríceps B",
    type: "gluteo",
    optional: "Cardio 10 a 15 minutos.",
    exercises: [
      ex(1, "Hip thrust", "Glúteo máximo"),
      ex(2, "Hack squat ou agachamento no Smith", "Quadríceps e glúteo"),
      ex(3, "Leg press unilateral", "Glúteo e quadríceps"),
      ex(4, "Cadeira extensora", "Quadríceps"),
      ex(5, "Cadeira abdutora", "Glúteo médio"),
      ex(6, "Mesa flexora", "Posterior"),
      ex(7, "Panturrilha sentada e em pé", "Panturrilha"),
    ],
  },
  {
    id: "fase1-b-terca",
    phase: "fase1",
    week: "B",
    day: "Terça",
    title: "Empurrar B: peito + ombro + tríceps",
    type: "empurrar",
    optional: "Cardio 15 minutos; abdômen curto.",
    exercises: [
      ex(1, "Supino inclinado na máquina", "Peito superior"),
      ex(2, "Supino reto com halteres", "Peito geral"),
      ex(3, "Crossover no cabo", "Peitoral"),
      ex(4, "Desenvolvimento com halteres sentado ou máquina", "Ombros"),
      ex(5, "Elevação lateral", "Ombro lateral"),
      ex(6, "Tríceps unilateral no cabo", "Tríceps"),
      ex(7, "Tríceps testa no cabo", "Tríceps"),
    ],
  },
  {
    id: "fase1-b-quarta",
    phase: "fase1",
    week: "B",
    day: "Quarta",
    title: "Puxar B: costas espessura + bíceps",
    type: "puxar",
    optional: "Cardio 15 minutos.",
    exercises: [
      ex(1, "Remada baixa pegada aberta", "Costas médias"),
      ex(2, "Puxada frente pegada supinada ou neutra", "Dorsal e bíceps"),
      ex(3, "Remada articulada máquina", "Espessura das costas"),
      ex(4, "Pullover no cabo", "Dorsal"),
      ex(5, "Crucifixo inverso máquina", "Deltoide posterior"),
      ex(6, "Rosca Scott máquina (nunca fazer amplitude completa)", "Bíceps"),
      ex(7, "Rosca alternada com halteres", "Bíceps"),
    ],
  },
  {
    id: "fase1-b-quinta",
    phase: "fase1",
    week: "B",
    day: "Quinta",
    title: "Posterior/glúteo B + adutores",
    type: "gluteo",
    optional: "Panturrilha em pé 3x12–20; cardio leve 10 a 15 minutos.",
    exercises: [
      ex(1, "Stiff", "Posterior e glúteo"),
      ex(2, "Leg press pés altos", "Glúteos e posterior"),
      ex(3, "Flexora sentada", "Posterior"),
      ex(4, "Glúteo no cabo", "Glúteo máximo"),
      ex(5, "Cadeira abdutora", "Glúteo médio"),
      ex(6, "Cadeira adutora", "Adutores"),
      ex(7, "Extensão lombar controlada", "Lombar e glúteos"),
    ],
  },
  {
    id: "fase1-b-sexta",
    phase: "fase1",
    week: "B",
    day: "Sexta",
    title: "Ombros + braços + postura",
    type: "superior",
    optional: "Cardio 15 a 20 minutos; abdominal leve.",
    exercises: [
      ex(1, "Desenvolvimento máquina, moderado", "Ombros"),
      ex(2, "Elevação lateral", "Ombro lateral"),
      ex(3, "Face pull", "Ombro posterior e postura"),
      ex(4, "Remada alta no cabo com corda, leve", "Trapézio e deltoide lateral"),
      ex(5, "Rosca martelo no cabo", "Bíceps e braquial"),
      ex(6, "Rosca direta no cabo", "Bíceps"),
      ex(7, "Tríceps corda", "Tríceps"),
    ],
  },
  {
    id: "fase1-b-sabado",
    phase: "fase1",
    week: "B",
    day: "Sábado",
    title: "Cardio maior",
    type: "cardio",
    exercises: [
      ex("Cardio", "30 a 45 minutos moderado", "Resistência", "-"),
      ex("Mobilidade", "Quadril, posterior, peitoral e dorsal", "Mobilidade", "-"),
      ex("Core opcional", "Pallof press e dead bug", "Core", "pallof press dead bug"),
    ],
  },
  {
    id: "fase2-a-segunda",
    phase: "fase2",
    week: "A",
    day: "Segunda",
    title: "Upper A: peito + costas horizontal",
    type: "superior",
    exercises: [
      ex(1, "Supino reto máquina ou halteres", "Peito geral"),
      ex(2, "Remada baixa", "Costas médias"),
      ex(3, "Supino inclinado", "Peito superior"),
      ex(4, "Remada máquina com peito apoiado", "Costas superiores"),
      ex(5, "Crucifixo máquina", "Peito isolado"),
      ex(6, "Face pull", "Deltoide posterior e postura"),
      ex(7, "Tríceps corda", "Tríceps"),
    ],
  },
  {
    id: "fase2-a-terca",
    phase: "fase2",
    week: "A",
    day: "Terça",
    title: "Lower A: quadríceps + glúteo",
    type: "inferior",
    exercises: [
      ex(1, "Hack squat ou Smith", "Quadríceps e glúteo"),
      ex(2, "Leg press", "Quadríceps"),
      ex(3, "Hip thrust", "Glúteo máximo"),
      ex(4, "Cadeira extensora", "Quadríceps"),
      ex(5, "Cadeira abdutora", "Glúteo médio"),
      ex(6, "Panturrilha em pé", "Panturrilha"),
      ex(7, "Panturrilha sentada", "Panturrilha"),
    ],
  },
  {
    id: "fase2-a-quarta",
    phase: "fase2",
    week: "A",
    day: "Quarta",
    title: "Cardio + core + mobilidade",
    type: "cardio",
    exercises: [
      ex(1, "Cardio 25 a 35 minutos", "Resistência", "-"),
      ex(2, "Pallof press", "Core anti-rotação"),
      ex(3, "Dead bug", "Core e controle lombar"),
      ex(4, "Prancha inclinada", "Core"),
      ex(5, "Mobilidade de quadril", "Mobilidade", "-"),
      ex(6, "Mobilidade torácica", "Postura", "-"),
      ex(7, "Alongamento leve de posterior/panturrilha", "Recuperação", "-"),
    ],
  },
  {
    id: "fase2-a-quinta",
    phase: "fase2",
    week: "A",
    day: "Quinta",
    title: "Upper B: costas vertical + ombro",
    type: "superior",
    exercises: [
      ex(1, "Puxada frente aberta/neutra", "Dorsal"),
      ex(2, "Desenvolvimento máquina", "Ombros"),
      ex(3, "Pulldown braço reto", "Dorsal"),
      ex(4, "Elevação lateral", "Ombro lateral"),
      ex(5, "Crucifixo inverso", "Deltoide posterior"),
      ex(6, "Rosca martelo", "Bíceps e braquial"),
      ex(7, "Tríceps testa no cabo", "Tríceps"),
    ],
  },
  {
    id: "fase2-a-sexta",
    phase: "fase2",
    week: "A",
    day: "Sexta",
    title: "Lower B: posterior + glúteo",
    type: "gluteo",
    exercises: [
      ex(1, "Stiff com halteres", "Posterior e glúteo"),
      ex(2, "Hip thrust", "Glúteo máximo"),
      ex(3, "Mesa flexora", "Posterior"),
      ex(4, "Leg press pés altos", "Glúteo e posterior"),
      ex(5, "Glúteo no cabo", "Glúteo máximo"),
      ex(6, "Cadeira adutora", "Adutores"),
      ex(7, "Extensão lombar controlada", "Lombar e glúteos"),
    ],
  },
  {
    id: "fase2-b-segunda",
    phase: "fase2",
    week: "B",
    day: "Segunda",
    title: "Lower C: glúteo forte + quadríceps moderado",
    type: "gluteo",
    exercises: [
      ex(1, "Hip thrust", "Glúteo máximo"),
      ex(2, "Leg press unilateral", "Glúteo e quadríceps"),
      ex(3, "Agachamento no Smith", "Quadríceps e glúteo"),
      ex(4, "Cadeira abdutora", "Glúteo médio"),
      ex(5, "Cadeira extensora", "Quadríceps"),
      ex(6, "Flexora sentada", "Posterior"),
      ex(7, "Panturrilha sentada", "Panturrilha"),
    ],
  },
  {
    id: "fase2-b-terca",
    phase: "fase2",
    week: "B",
    day: "Terça",
    title: "Upper C: peito + ombro + tríceps",
    type: "empurrar",
    exercises: [
      ex(1, "Supino inclinado máquina", "Peito superior"),
      ex(2, "Supino reto halteres", "Peito geral"),
      ex(3, "Crossover", "Peitoral"),
      ex(4, "Desenvolvimento máquina", "Ombros"),
      ex(5, "Elevação lateral", "Ombro lateral"),
      ex(6, "Tríceps corda", "Tríceps"),
      ex(7, "Tríceps unilateral", "Tríceps"),
    ],
  },
  {
    id: "fase2-b-quarta",
    phase: "fase2",
    week: "B",
    day: "Quarta",
    title: "Cardio + abdômen",
    type: "cardio",
    exercises: [
      ex(1, "Cardio 25 a 40 minutos", "Resistência", "-"),
      ex(2, "Abdominal no cabo", "Abdômen"),
      ex(3, "Pallof press", "Core anti-rotação"),
      ex(4, "Dead bug", "Core e controle lombar"),
      ex(5, "Prancha lateral adaptada", "Core lateral"),
      ex(6, "Mobilidade de tornozelo", "Mobilidade", "-"),
      ex(7, "Mobilidade de quadril", "Mobilidade", "-"),
    ],
  },
  {
    id: "fase2-b-quinta",
    phase: "fase2",
    week: "B",
    day: "Quinta",
    title: "Lower D: posterior + adutor + glúteo médio",
    type: "gluteo",
    exercises: [
      ex(1, "Stiff", "Posterior e glúteo"),
      ex(2, "Flexora sentada", "Posterior"),
      ex(3, "Leg press pés altos", "Glúteos e posterior"),
      ex(4, "Cadeira adutora", "Adutores"),
      ex(5, "Cadeira abdutora", "Glúteo médio"),
      ex(6, "Glúteo no cabo", "Glúteo máximo"),
      ex(7, "Panturrilha em pé", "Panturrilha"),
    ],
  },
  {
    id: "fase2-b-sexta",
    phase: "fase2",
    week: "B",
    day: "Sexta",
    title: "Upper D: costas + braços + postura",
    type: "superior",
    exercises: [
      ex(1, "Remada máquina", "Costas"),
      ex(2, "Puxada neutra", "Dorsal"),
      ex(3, "Remada baixa", "Costas médias"),
      ex(4, "Face pull", "Postura e deltoide posterior"),
      ex(5, "Rosca direta", "Bíceps"),
      ex(6, "Rosca martelo", "Bíceps e braquial"),
      ex(7, "Tríceps barra V", "Tríceps"),
    ],
  },
];

const overview = [
  ["Puxar", "Costas, dorsais, trapézio, deltoide posterior e bíceps."],
  ["Empurrar", "Peito, ombros e tríceps."],
  ["Posterior/glúteos", "Glúteos, posterior de coxa, lombar e panturrilha."],
  ["Inferiores anterior", "Quadríceps, adutores, panturrilha e core."],
  ["Superiores acessório", "Costas superiores, ombros, braços, postura e peito leve."],
];

const progression = [
  ["Exercícios principais", "3 séries", "10 a 12 repetições"],
  ["Exercícios secundários", "3 séries", "10 a 15 repetições"],
  ["Panturrilha, abdutora, elevação lateral e face pull", "3 séries", "12 a 20 repetições"],
];

const cardio = [
  ["Meses 1–2", "15 minutos leve/moderado"],
  ["Meses 3–4", "15 a 20 minutos"],
  ["Meses 5–6", "20 a 25 minutos"],
  ["Depois dos 6 meses", "20 a 30 minutos, conforme recuperação"],
];

const recovery = [
  ["Carga", "Reduzir 10% a 20%"],
  ["Séries", "Fazer 2 séries por exercício"],
  ["Cardio", "Leve"],
  ["Falha muscular", "Não usar"],
  ["Objetivo", "Recuperar e manter técnica"],
];

function getTodayName() {
  const names = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
  return names[new Date().getDay()];
}

function calculateWeekFromStart(startDate: string): Week {
  if (!startDate) return "A";
  const start = new Date(`${startDate}T00:00:00`);
  const now = new Date();
  const current = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (Number.isNaN(start.getTime())) return "A";
  const diffDays = Math.floor((current.getTime() - start.getTime()) / 86400000);
  const block = Math.floor(Math.max(0, diffDays) / 7);
  return block % 2 === 0 ? "A" : "B";
}

function exerciseKey(plan: DayPlan, exercise: Exercise) {
  return `${plan.id}::${exercise.order}::${exercise.name}`;
}

function emptyLog(): ExerciseLog {
  return { done: false, load: "", reps1: "", reps2: "", reps3: "", note: "" };
}

function shouldIncrease(log?: ExerciseLog) {
  if (!log) return false;
  const reps = [log.reps1, log.reps2, log.reps3].map((value) => Number(value));
  return reps.every((value) => Number.isFinite(value) && value >= 15);
}

function useLocalStorageLogs() {
  const [logs, setLogs] = useState<Logs>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
  }, [logs]);

  function updateLog(key: string, patch: Partial<ExerciseLog>) {
    setLogs((current) => ({ ...current, [key]: { ...(current[key] ?? emptyLog()), ...patch } }));
  }

  function clearLogs() {
    setLogs({});
  }

  return { logs, updateLog, clearLogs };
}

function Segmented<T extends string>({ value, setValue, options }: { value: T; setValue: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex rounded-2xl bg-zinc-950 p-1 ring-1 ring-zinc-800">
      {options.map((option) => (
        <button
          key={option.value}
          onClick={() => setValue(option.value)}
          className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
            value === option.value ? "bg-zinc-800 text-zinc-50 shadow-sm" : "text-zinc-400 hover:text-zinc-100"
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function InfoTable({ rows, headers }: { rows: string[][]; headers: string[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="bg-zinc-950 text-zinc-300">
          <tr>
            {headers.map((header) => (
              <th key={header} className="px-4 py-3 font-bold">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800">
          {rows.map((row, index) => (
            <tr key={`${row[0]}-${index}`}>
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="px-4 py-3 align-top text-zinc-300">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LogInputs({ log, onLog, compact = false }: { log: ExerciseLog; onLog: (patch: Partial<ExerciseLog>) => void; compact?: boolean }) {
  const inputClass = "min-w-0 rounded-xl border border-zinc-700 bg-zinc-950 px-2 py-2 text-xs text-zinc-100 placeholder:text-zinc-500 outline-none focus:border-zinc-400";
  return (
    <div className={`grid gap-2 ${compact ? "grid-cols-4" : "grid-cols-2 sm:grid-cols-4"}`}>
      <input value={log.load} onChange={(event) => onLog({ load: event.target.value })} placeholder="kg" inputMode="decimal" className={inputClass} />
      <input value={log.reps1} onChange={(event) => onLog({ reps1: event.target.value })} placeholder="R1" inputMode="numeric" className={inputClass} />
      <input value={log.reps2} onChange={(event) => onLog({ reps2: event.target.value })} placeholder="R2" inputMode="numeric" className={inputClass} />
      <input value={log.reps3} onChange={(event) => onLog({ reps3: event.target.value })} placeholder="R3" inputMode="numeric" className={inputClass} />
    </div>
  );
}

function RestTimer({ defaultSeconds }: { defaultSeconds: number }) {
  const [seconds, setSeconds] = useState(defaultSeconds || 60);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (!running) return;
    if (seconds <= 0) {
      setRunning(false);
      return;
    }
    const id = window.setTimeout(() => setSeconds((value) => value - 1), 1000);
    return () => window.clearTimeout(id);
  }, [running, seconds]);

  if (!defaultSeconds) return <span className="text-zinc-500">—</span>;

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        onClick={() => setRunning((value) => !value)}
        className={`rounded-xl px-3 py-2 text-xs font-black ${running ? "bg-orange-950/70 text-orange-200" : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"}`}
      >
        {mm}:{ss}
      </button>
      {[60, 90, 120].map((preset) => (
        <button
          key={preset}
          onClick={() => {
            setSeconds(preset);
            setRunning(true);
          }}
          className="rounded-lg bg-zinc-950 px-2 py-1 text-[11px] font-bold text-zinc-300 ring-1 ring-zinc-700 hover:bg-zinc-800"
        >
          {preset}s
        </button>
      ))}
    </div>
  );
}

function ExerciseRow({ exercise, log, onLog, onMuscleClick, lightMode }: { exercise: Exercise; log: ExerciseLog; onLog: (patch: Partial<ExerciseLog>) => void; onMuscleClick: (muscleKey: string) => void; lightMode: boolean }) {
  const increase = shouldIncrease(log);
  const alternatives = alternativesFor(exercise.name);

  return (
    <tr className={`align-top transition ${log.done ? "bg-emerald-950/30" : "hover:bg-zinc-800/50"}`}>
      <td className="px-4 py-3 font-semibold text-zinc-400">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={log.done} onChange={(event) => onLog({ done: event.target.checked })} className="h-4 w-4 rounded border-zinc-700 accent-emerald-500" />
          {exercise.order}
        </label>
      </td>
      <td className="px-4 py-3">
        <p className="font-bold text-zinc-100">{exercise.name}</p>
        <details className="mt-2 text-xs text-zinc-400">
          <summary className="cursor-pointer font-bold text-zinc-300">Alternativas</summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {alternatives.map((alt) => (
              <span key={alt} className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-300">
                {alt}
              </span>
            ))}
          </div>
        </details>
      </td>
      <td className="px-4 py-3">
        <FocusLinks focus={exercise.focus} onMuscleClick={onMuscleClick} />
      </td>
      <td className="px-4 py-3">
        <LogInputs log={log} onLog={onLog} />
        {increase && <p className="mt-2 rounded-xl bg-emerald-950/70 px-2 py-1 text-xs font-black text-emerald-200">Bateu 3x15. Próximo treino: aumentar carga.</p>}
        {lightMode && <p className="mt-2 text-xs font-semibold text-orange-300">Modo leve ativo: foco em execução limpa.</p>}
      </td>
      <td className="px-4 py-3">
        <RestTimer defaultSeconds={exercise.rest ?? 60} />
      </td>
      <td className="px-4 py-3">
        {exercise.video ? (
          <a href={exercise.video} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-bold text-zinc-950 transition hover:bg-white">
            <span aria-hidden="true">▶</span> Abrir
          </a>
        ) : (
          <span className="text-zinc-500">—</span>
        )}
      </td>
    </tr>
  );
}

function ExerciseMobileCard({ exercise, log, onLog, onMuscleClick, lightMode }: { exercise: Exercise; log: ExerciseLog; onLog: (patch: Partial<ExerciseLog>) => void; onMuscleClick: (focus: string) => void; lightMode: boolean }) {
  const increase = shouldIncrease(log);
  const alternatives = alternativesFor(exercise.name);

  return (
    <article className={`rounded-2xl border p-4 shadow-sm ${log.done ? "border-emerald-800 bg-emerald-950/30" : "border-zinc-800 bg-zinc-950/70"}`}>
      <div className="flex items-start justify-between gap-3">
        <label className="flex min-w-0 items-start gap-3">
          <input type="checkbox" checked={log.done} onChange={(event) => onLog({ done: event.target.checked })} className="mt-1 h-5 w-5 shrink-0 rounded border-zinc-700 accent-emerald-500" />
          <span className="min-w-0">
            <span className="block text-xs font-black uppercase tracking-[0.14em] text-zinc-500">{exercise.order}</span>
            <span className="block text-base font-black leading-snug text-zinc-50">{exercise.name}</span>
          </span>
        </label>
        {exercise.video ? (
          <a href={exercise.video} target="_blank" rel="noreferrer" className="shrink-0 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-black text-zinc-950">
            ▶
          </a>
        ) : null}
      </div>

      <FocusLinks focus={exercise.focus} onMuscleClick={onMuscleClick} compact />

      <div className="mt-4 grid gap-3">
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Carga e reps</p>
          <LogInputs log={log} onLog={onLog} compact />
        </div>
        {increase && <p className="rounded-xl bg-emerald-950/70 px-3 py-2 text-xs font-black text-emerald-200">Bateu 3x15. Próximo treino: aumentar carga.</p>}
        {lightMode && <p className="text-xs font-semibold text-orange-300">Modo leve ativo: foco em execução limpa.</p>}
        <div>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.14em] text-zinc-500">Descanso</p>
          <RestTimer defaultSeconds={exercise.rest ?? 60} />
        </div>
        <details className="text-xs text-zinc-400">
          <summary className="cursor-pointer font-bold text-zinc-300">Alternativas se a máquina estiver ocupada</summary>
          <div className="mt-2 flex flex-wrap gap-1">
            {alternatives.map((alt) => (
              <span key={alt} className="rounded-full bg-zinc-800 px-2 py-1 text-zinc-300">
                {alt}
              </span>
            ))}
          </div>
        </details>
      </div>
    </article>
  );
}

function DayCard({ plan, logs, updateLog, onMuscleClick, lightMode }: { plan: DayPlan; logs: Logs; updateLog: (key: string, patch: Partial<ExerciseLog>) => void; onMuscleClick: (focus: string) => void; lightMode: boolean }) {
  const style = typeStyle[plan.type];
  const exercises = lightMode && plan.exercises.length > 4 ? plan.exercises.slice(0, 4) : plan.exercises;
  const done = exercises.filter((exercise) => logs[exerciseKey(plan, exercise)]?.done).length;

  return (
    <motion.section layout initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className={`overflow-hidden rounded-3xl border-l-8 ${style.border} border-y border-r border-zinc-800 bg-zinc-900 shadow-sm`}>
      <div className={`flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between ${style.soft}`}>
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-400">{plan.day}</p>
          <h3 className="mt-1 text-lg font-black text-zinc-50">{plan.title}</h3>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-zinc-950/80 px-3 py-1 text-xs font-black text-zinc-300 ring-1 ring-zinc-800">
            {done}/{exercises.length} feitos
          </span>
          <span className={`w-fit rounded-full px-3 py-1 text-xs font-bold ring-1 ${style.chip}`}>
            {style.icon} {style.label}
          </span>
        </div>
      </div>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[1080px] text-left text-sm">
          <thead className="border-y border-zinc-800 bg-zinc-950 text-xs uppercase tracking-wide text-zinc-400">
            <tr>
              <th className="w-24 px-4 py-3">Feito</th>
              <th className="px-4 py-3">Exercício</th>
              <th className="px-4 py-3">Foco</th>
              <th className="w-80 px-4 py-3">Carga/reps</th>
              <th className="w-52 px-4 py-3">Descanso</th>
              <th className="w-28 px-4 py-3">Vídeo</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {exercises.map((exercise) => {
              const key = exerciseKey(plan, exercise);
              return <ExerciseRow key={key} exercise={exercise} log={logs[key] ?? emptyLog()} onLog={(patch) => updateLog(key, patch)} onMuscleClick={onMuscleClick} lightMode={lightMode} />;
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 p-4 md:hidden">
        {exercises.map((exercise) => {
          const key = exerciseKey(plan, exercise);
          return <ExerciseMobileCard key={key} exercise={exercise} log={logs[key] ?? emptyLog()} onLog={(patch) => updateLog(key, patch)} onMuscleClick={onMuscleClick} lightMode={lightMode} />;
        })}
      </div>

      {plan.optional && (
        <div className="border-t border-zinc-800 px-5 py-4 text-sm text-zinc-400">
          <span className="font-black text-zinc-100">Opcionais:</span> {plan.optional}
        </div>
      )}
    </motion.section>
  );
}

type FocusTarget = {
  key: string;
  label: string;
};

function addFocusTarget(targets: FocusTarget[], key: string, label?: string) {
  if (targets.some((target) => target.key === key)) return;
  const info = muscleImages[key] ?? muscleImages.core;
  targets.push({ key, label: label ?? info.title });
}

function focusToTargets(focus: string): FocusTarget[] {
  const text = focus.toLowerCase();
  const targets: FocusTarget[] = [];

  if (text.includes("costas superiores")) addFocusTarget(targets, "costas_superiores");
  if (text.includes("costas médias") || text.includes("costas medias") || text.includes("meio das costas") || text.includes("espessura") || text === "costas") addFocusTarget(targets, "costas_medias");
  if (text.includes("deltoide posterior") || text.includes("ombro posterior") || text.includes("postura")) addFocusTarget(targets, "deltoide_posterior");
  if (text.includes("ombro lateral") || text.includes("deltoide lateral")) addFocusTarget(targets, "ombro_lateral");
  if (text.includes("ombros") || text === "ombro" || text.includes("ombros")) addFocusTarget(targets, "ombros");

  if (text.includes("glúteo máximo") || text.includes("gluteo maximo")) addFocusTarget(targets, "gluteo_maximo");
  if (text.includes("glúteo médio") || text.includes("gluteo medio")) addFocusTarget(targets, "gluteo_medio");
  if (text.includes("glúteos") || text.includes("gluteos")) addFocusTarget(targets, "gluteos");
  if ((text.includes("glúteo") || text.includes("gluteo")) && !text.includes("máximo") && !text.includes("maximo") && !text.includes("médio") && !text.includes("medio")) addFocusTarget(targets, "gluteos", "Glúteo");

  if (text.includes("posterior de coxa")) addFocusTarget(targets, "posterior_coxa");
  if (text.includes("posterior") && !text.includes("deltoide") && !text.includes("ombro") && !text.includes("postura")) addFocusTarget(targets, "posterior_coxa", "Posterior de coxa");

  if (text.includes("gastrocnêmio") || text.includes("gastrocnemio")) addFocusTarget(targets, "gastrocnemio");
  if (text.includes("sóleo") || text.includes("soleo")) addFocusTarget(targets, "soleo");
  if (text.includes("panturrilha")) addFocusTarget(targets, "panturrilha");
  if (text.includes("quadríceps") || text.includes("quadriceps")) addFocusTarget(targets, "quadriceps");
  if (text.includes("peito") || text.includes("peitoral")) addFocusTarget(targets, "peitoral");
  if (text.includes("tríceps") || text.includes("triceps")) addFocusTarget(targets, "triceps");
  if (text.includes("braquial")) addFocusTarget(targets, "braquial");
  if (text.includes("bíceps") || text.includes("biceps")) addFocusTarget(targets, "biceps");
  if (text.includes("trapézio") || text.includes("trapezio")) addFocusTarget(targets, "trapezio");
  if (text.includes("dorsal")) addFocusTarget(targets, "dorsal");
  if (text.includes("lombar")) addFocusTarget(targets, "lombar");
  if (text.includes("core") || text.includes("abdômen") || text.includes("abdomen")) addFocusTarget(targets, "core");

  if (targets.length === 0) addFocusTarget(targets, focusToKey(focus));
  return targets;
}

function FocusLinks({ focus, onMuscleClick, compact = false }: { focus: string; onMuscleClick: (muscleKey: string) => void; compact?: boolean }) {
  const targets = focusToTargets(focus);

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mt-3" : ""}`}>
      {targets.map((target) => (
        <button
          key={`${focus}-${target.key}`}
          onClick={() => onMuscleClick(target.key)}
          className={`${
            compact
              ? "rounded-xl bg-blue-950/40 px-3 py-2 text-left text-sm font-black text-blue-200 ring-1 ring-blue-800"
              : "rounded-full bg-blue-950/40 px-3 py-1 text-xs font-black text-blue-200 ring-1 ring-blue-800 transition hover:bg-blue-900/60 hover:text-blue-100"
          }`}
          title={`Abrir imagem: ${target.label}`}
        >
          {target.label}
        </button>
      ))}
    </div>
  );
}

function MuscleModal({ focus, onClose }: { focus: string | null; onClose: () => void }) {
  if (!focus) return null;
  const info = muscleImages[focus] ?? muscleImages[focusToKey(focus)] ?? muscleImages.core;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <motion.div initial={{ opacity: 0, scale: 0.96, y: 12 }} animate={{ opacity: 1, scale: 1, y: 0 }} className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900 shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 border-b border-zinc-800 p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">Foco selecionado</p>
            <h2 className="mt-1 text-2xl font-black text-zinc-50">{info.title}</h2>
            <p className="mt-2 text-sm text-zinc-400">Imagem do músculo trabalhado</p>
          </div>
          <button onClick={onClose} className="rounded-full bg-zinc-800 p-2 text-zinc-300 transition hover:bg-zinc-700 hover:text-zinc-50">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="grid gap-5 p-5 md:grid-cols-[1fr_1.1fr]">
          <div className="overflow-hidden rounded-2xl bg-zinc-950 p-3">
            <img src={info.image} alt={info.title} className="h-full max-h-[420px] w-full object-contain" />
          </div>
          <div className="flex flex-col justify-center">
            <p className="text-base leading-relaxed text-zinc-300">{info.description}</p>
            <ul className="mt-4 space-y-2 text-sm text-zinc-300">
              {info.tips.map((tip) => (
                <li key={tip} className="rounded-xl bg-zinc-950 px-3 py-2">
                  • {tip}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-2xl bg-amber-950/50 p-4 text-sm text-amber-200 ring-1 ring-amber-800">
              Imagem anatômica é referência. Execução real: use o botão do YouTube e priorize profissional de educação física.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function DashboardCard({ icon, title, value, description }: { icon: React.ReactNode; title: string; value: string; description: string }) {
  return (
    <div className="rounded-3xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
      <div className="flex items-center gap-3 text-zinc-400">
        {icon}
        <span className="text-sm font-bold uppercase tracking-[0.14em]">{title}</span>
      </div>
      <p className="mt-3 text-3xl font-black text-zinc-50">{value}</p>
      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}

export default function TrainingPlanApp() {
  const [phase, setPhase] = useState<Phase>("fase1");
  const [week, setWeek] = useState<Week>("A");
  const [query, setQuery] = useState("");
  const [selectedMuscle, setSelectedMuscle] = useState<string | null>(null);
  const [onlyToday, setOnlyToday] = useState(false);
  const [lightMode, setLightMode] = useState(false);
  const [startDate, setStartDate] = useState(() => localStorage.getItem(START_DATE_KEY) ?? "");
  const [autoWeekEnabled, setAutoWeekEnabled] = useState(() => localStorage.getItem(AUTO_WEEK_KEY) !== "false");
  const { logs, updateLog, clearLogs } = useLocalStorageLogs();

  useEffect(() => {
    localStorage.setItem(START_DATE_KEY, startDate);
  }, [startDate]);

  useEffect(() => {
    localStorage.setItem(AUTO_WEEK_KEY, String(autoWeekEnabled));
  }, [autoWeekEnabled]);

  const todayName = getTodayName();
  const autoWeek = calculateWeekFromStart(startDate);

  useEffect(() => {
    if (autoWeekEnabled) setWeek(autoWeek);
  }, [autoWeekEnabled, autoWeek]);

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) => {
      const matchesPhase = plan.phase === phase;
      const matchesWeek = plan.week === week;
      const searchable = `${plan.day} ${plan.title} ${plan.type} ${plan.exercises.map((exercise) => `${exercise.name} ${exercise.focus}`).join(" ")}`.toLowerCase();
      const matchesQuery = searchable.includes(query.toLowerCase());
      const matchesToday = !onlyToday || plan.day === todayName;
      return matchesPhase && matchesWeek && matchesQuery && matchesToday;
    });
  }, [phase, week, query, onlyToday, todayName]);

  const visibleExercises = filteredPlans.flatMap((plan) =>
    (lightMode ? plan.exercises.slice(0, 4) : plan.exercises).map((exercise) => ({ plan, exercise })),
  );

  const doneCount = visibleExercises.filter(({ plan, exercise }) => logs[exerciseKey(plan, exercise)]?.done).length;
  const increaseCount = Object.values(logs).filter(shouldIncrease).length;
  const totalCount = visibleExercises.length;

  function applyToday() {
    setOnlyToday(true);
    setWeek(autoWeek);
  }

  function changeWeekManually(nextWeek: Week) {
    setAutoWeekEnabled(false);
    setWeek(nextWeek);
  }

  function exportData() {
    const payload = { exportedAt: new Date().toISOString(), phase, week, startDate, autoWeekEnabled, logs };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "progresso-treino-loloa.json";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,#1e293b,transparent_34%),linear-gradient(180deg,#09090b,#18181b)] text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-950">
                <Dumbbell className="h-4 w-4" /> Plano de treino interativo
              </div>
              <h1 className="mt-4 max-w-4xl text-4xl font-black tracking-tight text-zinc-50 sm:text-5xl">Treino A/B com progresso, descanso e modo leve</h1>
              <p className="mt-4 max-w-3xl text-base leading-7 text-zinc-400">
                Treino de musculação para o meu biricutico. Plano dividido em fases e semanas, com registro de progresso, sugestões de descanso e modo leve para focar na execução.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button onClick={exportData} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-200 shadow-sm transition hover:bg-zinc-800">
                <Download className="h-4 w-4" /> Exportar
              </button>
              <button onClick={() => window.confirm("Apagar todo o progresso salvo neste navegador?") && clearLogs()} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-200 shadow-sm transition hover:bg-zinc-800">
                <Trash2 className="h-4 w-4" /> Limpar
              </button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-bold text-zinc-200 shadow-sm transition hover:bg-zinc-800">
                <Printer className="h-4 w-4" /> Imprimir
              </button>
            </div>
          </div>

          <div className="grid gap-4 rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm xl:grid-cols-[auto_auto_1fr] xl:items-center">
            <Segmented value={phase} setValue={setPhase} options={[{ value: "fase1", label: "Meses 1–6" }, { value: "fase2", label: "Após 6 meses" }]} />
            <Segmented value={week} setValue={changeWeekManually} options={[{ value: "A", label: "Semana A" }, { value: "B", label: "Semana B" }]} />
            <label className="relative block">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar exercício, músculo ou dia..."
                className="w-full rounded-2xl border border-zinc-700 bg-zinc-950 py-3 pl-11 pr-4 text-sm text-zinc-100 placeholder:text-zinc-500 outline-none transition focus:border-zinc-400"
              />
            </label>
          </div>

          <div className="grid gap-3 rounded-3xl border border-zinc-800 bg-zinc-900 p-4 shadow-sm lg:grid-cols-[1fr_auto_auto_auto] lg:items-center">
            <label className="grid gap-1 text-sm font-bold text-zinc-300">
              Data de início da Semana A
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm font-semibold text-zinc-100 outline-none focus:border-zinc-400" />
            </label>
            <button onClick={applyToday} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-950 shadow-sm transition hover:bg-white">
              <CalendarDays className="h-4 w-4" /> Treino de hoje: {todayName} · {autoWeek}
            </button>
            <button onClick={() => setAutoWeekEnabled((value) => !value)} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm transition ${autoWeekEnabled ? "bg-emerald-700 text-white" : "border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"}`}>
              <RotateCcw className="h-4 w-4" /> Semana auto: {autoWeekEnabled ? "ON" : "OFF"}
            </button>
            <div className="grid grid-cols-2 gap-2 lg:flex">
              <button onClick={() => setOnlyToday((value) => !value)} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm transition ${onlyToday ? "bg-blue-700 text-white" : "border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"}`}>
                <ClipboardCheck className="h-4 w-4" /> Só hoje
              </button>
              <button onClick={() => setLightMode((value) => !value)} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold shadow-sm transition ${lightMode ? "bg-orange-600 text-white" : "border border-zinc-800 bg-zinc-900 text-zinc-200 hover:bg-zinc-800"}`}>
                <Sparkles className="h-4 w-4" /> Modo leve
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:px-8">
        <section className="grid gap-4 md:grid-cols-4">
          <DashboardCard icon={<CheckCircle2 className="h-6 w-6" />} title="Feitos" value={`${doneCount}/${totalCount}`} description="Exercícios marcados como feitos na tela atual." />
          <DashboardCard icon={<Activity className="h-6 w-6" />} title="Progressão" value={`${increaseCount}`} description="Registros que bateram 3x15 e sugerem aumento de carga." />
          <DashboardCard icon={<TimerReset className="h-6 w-6" />} title="Descanso" value="60–120s" description="Timer por exercício, com presets rápidos." />
          <DashboardCard icon={<RotateCcw className="h-6 w-6" />} title="Modo leve" value={lightMode ? "Ativo" : "Off"} description="Corta o treino para os 4 primeiros exercícios." />
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-xl font-black text-zinc-50">Divisão muscular</h2>
            <InfoTable headers={["Tipo", "Músculos trabalhados"]} rows={overview} />
          </div>
          <div>
            <h2 className="mb-3 text-xl font-black text-zinc-50">Séries e repetições</h2>
            <InfoTable headers={["Tipo", "Séries", "Repetições"]} rows={progression} />
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-2">
          <div>
            <h2 className="mb-3 text-xl font-black text-zinc-50">Cardio sugerido</h2>
            <InfoTable headers={["Período", "Cardio"]} rows={cardio} />
          </div>
          <div>
            <h2 className="mb-3 text-xl font-black text-zinc-50">Semana regenerativa</h2>
            <InfoTable headers={["Variável", "Ajuste"]} rows={recovery} />
          </div>
        </section>

        <section className="space-y-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-zinc-500">Treinos</p>
              <h2 className="text-2xl font-black text-zinc-50">{phase === "fase1" ? "Fase 1: meses 1 a 6" : "Fase 2: após 6 meses"} · Semana {week}</h2>
            </div>
            <p className="hidden text-sm text-zinc-500 sm:block">{filteredPlans.length} bloco(s) encontrado(s)</p>
          </div>

          {filteredPlans.length > 0 ? (
            filteredPlans.map((plan) => <DayCard key={plan.id} plan={plan} logs={logs} updateLog={updateLog} onMuscleClick={setSelectedMuscle} lightMode={lightMode} />)
          ) : (
            <div className="rounded-3xl border border-dashed border-zinc-700 bg-zinc-900 p-10 text-center text-zinc-400">Nada encontrado. A busca conseguiu descansar mais que domingo.</div>
          )}
        </section>
      </main>

      <MuscleModal focus={selectedMuscle} onClose={() => setSelectedMuscle(null)} />
    </div>
  );
}
