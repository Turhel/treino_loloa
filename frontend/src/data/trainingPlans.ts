import type { Exercise, Phase, TrainingDay, TrainingPlan, TrainingWeek } from "../types/training";
import { videoKey } from "../utils/video";

export function restFor(name: string) {
  const text = name.toLowerCase();
  if (["leg press", "hip thrust", "supino", "agachamento", "hack", "stiff", "remada", "desenvolvimento"].some((term) => text.includes(term))) return 90;
  if (["cardio", "mobilidade", "alongamento"].some((term) => text.includes(term))) return 0;
  return 60;
}

export function alternativesFor(name: string) {
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
  if (text.includes("levantamento terra")) return ["Stiff com halteres", "Leg press pés altos", "Hip thrust"];
  return ["Máquina equivalente", "Variação com cabo", "Variação com halter leve"];
}

function ex(order: number | string, name: string, focus: string, videoName?: string): Exercise {
  return {
    id: videoKey(videoName && videoName !== "-" ? videoName : name),
    order,
    name,
    focus,
    rest: restFor(name),
    alternatives: alternativesFor(name).map(videoKey),
    videoKey: videoName ?? videoKey(name),
  };
}

const legacyDayPlans: TrainingDay[] = [
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
      ex(7, "Levantamento Terra Sumo", "Posterior e glúteos"),
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

function groupDefaultWeeks(days: TrainingDay[]): TrainingWeek[] {
  const groups = new Map<string, TrainingDay[]>();
  for (const day of days) {
    const key = `${day.phase ?? "fase1"}-${day.week}`;
    groups.set(key, [...(groups.get(key) ?? []), day]);
  }
  return Array.from(groups.entries()).map(([key, groupedDays]) => {
    const [phase, week] = key.split("-") as [Phase, string];
    return { id: week, label: `Semana ${week}`, phase, days: groupedDays };
  });
}

export const defaultTrainingPlan: TrainingPlan = {
  id: "treino-base-loloa",
  name: "Treino Base Loloa",
  phase: "fase1",
  weeks: groupDefaultWeeks(legacyDayPlans),
};

export const defaultDayPlans = legacyDayPlans;

export function getPlanDays(plan: TrainingPlan, phase?: Phase, week?: string): TrainingDay[] {
  return plan.weeks
    .filter((trainingWeek) => (!phase || !trainingWeek.phase || trainingWeek.phase === phase) && (!week || trainingWeek.id === week))
    .flatMap((trainingWeek) => trainingWeek.days);
}

export function getPlanWeeks(plan: TrainingPlan, phase?: Phase) {
  return plan.weeks.filter((trainingWeek) => !phase || !trainingWeek.phase || trainingWeek.phase === phase);
}

export const overview = [
  ["Puxar", "Costas, dorsais, trapézio, deltoide posterior e bíceps."],
  ["Empurrar", "Peito, ombros e tríceps."],
  ["Posterior/glúteos", "Glúteos, posterior de coxa, lombar e panturrilha."],
  ["Inferiores anterior", "Quadríceps, adutores, panturrilha e core."],
  ["Superiores acessório", "Costas superiores, ombros, braços, postura e peito leve."],
];

export const progression = [
  ["Exercícios principais", "3 séries", "10 a 12 repetições"],
  ["Exercícios secundários", "3 séries", "10 a 15 repetições"],
  ["Panturrilha, abdutora, elevação lateral e face pull", "3 séries", "12 a 20 repetições"],
];

export const cardio = [
  ["Meses 1–2", "15 minutos leve/moderado"],
  ["Meses 3–4", "15 a 20 minutos"],
  ["Meses 5–6", "20 a 25 minutos"],
  ["Depois dos 6 meses", "20 a 30 minutos, conforme recuperação"],
];

export const recovery = [
  ["Carga", "Reduzir 10% a 20%"],
  ["Séries", "Fazer 2 séries por exercício"],
  ["Cardio", "Leve"],
  ["Falha muscular", "Não usar"],
  ["Objetivo", "Recuperar e manter técnica"],
];
