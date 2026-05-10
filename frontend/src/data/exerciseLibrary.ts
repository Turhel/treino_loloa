import { alternativesFor, defaultDayPlans, restFor } from "./trainingPlans";
import { generatedExerciseLibraryItems } from "./generated/exerciseLibrary.generated";
import { focusToTargets } from "../utils/focus";
import type { Exercise, ExerciseLibraryItem } from "../types/training";
import { videoKey } from "../utils/video";

function equipmentFor(name: string) {
  const text = name.toLowerCase();
  const equipment = new Set<string>();
  if (text.includes("leg press")) equipment.add("leg_press_45");
  if (text.includes("smith")) equipment.add("smith");
  if (text.includes("halter")) equipment.add("halteres");
  if (text.includes("cabo") || text.includes("pulley") || text.includes("puxada") || text.includes("pulldown") || text.includes("face pull") || text.includes("crossover")) equipment.add("cabo");
  if (text.includes("corda")) equipment.add("corda");
  if (text.includes("triângulo") || text.includes("triangulo")) equipment.add("triangulo");
  if (text.includes("barra v")) equipment.add("barra_v");
  if (text.includes("barra reta")) equipment.add("barra_reta");
  if (text.includes("esteira") || text.includes("caminhada") || text.includes("corrida")) equipment.add("esteira");
  if (text.includes("bicicleta") || text.includes("bike")) equipment.add("bicicleta_ergometrica");
  return Array.from(equipment);
}

const extraExercises: ExerciseLibraryItem[] = [
  {
    id: "puxada-neutra",
    name: "Puxada neutra",
    focus: "Dorsal e bíceps",
    muscles: ["dorsal", "biceps"],
    description: "Variação de puxada vertical com pegada neutra.",
    tips: ["Puxe com os cotovelos.", "Evite jogar o tronco para trás.", "Controle a volta."],
    alternatives: ["puxada-supinada", "puxada-frente-neutra-aberta"],
    rest: 90,
    videoKey: "puxada_neutra",
  },
  {
    id: "puxada-supinada",
    name: "Puxada supinada",
    focus: "Dorsal e bíceps",
    muscles: ["dorsal", "biceps"],
    description: "Puxada vertical com pegada supinada, geralmente com mais participação do bíceps.",
    tips: ["Mantenha o peito aberto.", "Controle a descida.", "Não transforme em remada."],
    rest: 90,
  },
  {
    id: "remada-articulada",
    name: "Remada articulada",
    focus: "Costas médias",
    muscles: ["costas_medias", "dorsal"],
    description: "Remada em máquina articulada para espessura das costas.",
    tips: ["Puxe com os cotovelos.", "Segure a contração por um instante.", "Evite arredondar a coluna."],
    rest: 90,
  },
  {
    id: "maquina-de-gluteo",
    name: "Máquina de glúteo",
    focus: "Glúteo máximo",
    muscles: ["gluteo_maximo"],
    description: "Extensão de quadril guiada para enfatizar glúteos.",
    tips: ["Contraia no final.", "Não jogue a lombar.", "Controle a volta."],
    rest: 60,
  },
  {
    id: "ponte-com-barra",
    name: "Ponte com barra",
    focus: "Glúteo máximo",
    muscles: ["gluteo_maximo", "posterior_coxa"],
    description: "Variação no chão para extensão de quadril.",
    tips: ["Queixo levemente recolhido.", "Suba até alinhar o quadril.", "Use carga confortável."],
    rest: 90,
  },
  {
    id: "gluteo-no-cabo",
    name: "Glúteo no cabo",
    focus: "Glúteo máximo",
    muscles: ["gluteo_maximo"],
    description: "Extensão de quadril no cabo para glúteos.",
    tips: ["Movimento controlado.", "Quadril estável.", "Evite impulso."],
    rest: 60,
  },
  {
    id: "smith",
    name: "Smith",
    focus: "Quadríceps e glúteo",
    muscles: ["quadriceps", "vasto_lateral", "gluteos", "adutores"],
    description: "Agachamento guiado no Smith.",
    tips: ["Joelhos seguem a linha dos pés.", "Controle a descida.", "Use amplitude confortável."],
    rest: 90,
  },
  {
    id: "leg-press",
    name: "Leg press",
    focus: "Quadríceps e glúteos",
    muscles: ["quadriceps", "vasto_lateral", "gluteos", "adutores"],
    description: "Empurrada de pernas em máquina guiada.",
    tips: ["Não trave os joelhos com violência.", "Mantenha lombar apoiada.", "Controle a amplitude."],
    rest: 90,
  },
  {
    id: "cadeira-extensora",
    name: "Cadeira extensora",
    focus: "Quadríceps",
    muscles: ["quadriceps", "vasto_lateral"],
    description: "Isolador de quadríceps em máquina.",
    tips: ["Controle o topo.", "Não embale a carga.", "Ajuste o banco antes."],
    rest: 60,
  },
  {
    id: "cadeira-adutora",
    name: "Cadeira adutora",
    focus: "Adutores",
    muscles: ["adutores"],
    description: "Máquina para a região interna da coxa e estabilidade do quadril.",
    tips: ["Controle a abertura e o fechamento.", "Evite bater a máquina no final.", "Use amplitude confortável."],
    rest: 60,
  },
  {
    id: "flexora-sentada",
    name: "Flexora sentada",
    focus: "Posterior de coxa",
    muscles: ["posterior_coxa"],
    description: "Flexão de joelhos sentada para posterior de coxa.",
    tips: ["Segure a contração.", "Controle a volta.", "Não tire o quadril do banco."],
    rest: 60,
  },
  {
    id: "mesa-flexora",
    name: "Mesa flexora",
    focus: "Posterior de coxa",
    muscles: ["posterior_coxa"],
    description: "Flexão de joelhos deitada para posterior de coxa.",
    tips: ["Não levante o quadril.", "Controle a volta.", "Use amplitude sem dor."],
    rest: 60,
  },
  {
    id: "terra-romeno-leve",
    name: "Terra romeno leve",
    focus: "Posterior e glúteos",
    muscles: ["posterior_coxa", "gluteos", "lombar"],
    description: "Variação de dobradiça de quadril com carga leve.",
    tips: ["Coluna neutra.", "Quadril vai para trás.", "Pare antes de perder controle."],
    rest: 90,
  },
  {
    id: "triceps-corda",
    name: "Tríceps corda",
    focus: "Tríceps",
    muscles: ["triceps"],
    description: "Extensão de cotovelos no pulley com corda.",
    tips: ["Cotovelos próximos ao corpo.", "Abra a corda no final.", "Controle o retorno."],
    rest: 60,
  },
  {
    id: "triceps-barra-v",
    name: "Tríceps barra V",
    focus: "Tríceps",
    muscles: ["triceps"],
    description: "Extensão de cotovelos no pulley com barra V.",
    tips: ["Punhos firmes.", "Cotovelos parados.", "Evite inclinar demais."],
    rest: 60,
  },
  {
    id: "triceps-unilateral",
    name: "Tríceps unilateral",
    focus: "Tríceps",
    muscles: ["triceps"],
    description: "Extensão unilateral no cabo para ajustar lados.",
    tips: ["Controle total.", "Não rode o tronco.", "Faça os dois lados iguais."],
    rest: 60,
  },
  {
    id: "rosca-cabo",
    name: "Rosca cabo",
    focus: "Bíceps",
    muscles: ["biceps", "braquial"],
    description: "Rosca no cabo com tensão contínua.",
    tips: ["Cotovelos fixos.", "Sem balanço do tronco.", "Controle a descida."],
    rest: 60,
  },
  {
    id: "rosca-alternada",
    name: "Rosca alternada",
    focus: "Bíceps",
    muscles: ["biceps"],
    description: "Rosca alternada com halteres.",
    tips: ["Evite roubar com ombro.", "Gire com controle.", "Desça devagar."],
    rest: 60,
  },
  {
    id: "rosca-martelo",
    name: "Rosca martelo",
    focus: "Bíceps e braquial",
    muscles: ["biceps", "braquial"],
    description: "Rosca com pegada neutra para bíceps e braquial.",
    tips: ["Punhos neutros.", "Cotovelos perto do corpo.", "Controle a volta."],
    rest: 60,
  },
  {
    id: "sumo-terra",
    name: "Levantamento Terra Sumo",
    focus: "Posterior e glúteos",
    muscles: ["posterior_coxa", "gluteos", "lombar", "adutores"],
    description: "Levantamento de barra com pegada ampla para ênfase em glúteos e adutores.",
    tips: ["Corpo tensionado.", "Pernas mais abertas.", "Pés apontados levemente para fora."],
    rest: 90,
  },
];

function fromExercise(exercise: Exercise): ExerciseLibraryItem {
  const muscles = focusToTargets(`${exercise.name} ${exercise.focus}`).map((target) => target.key);
  return {
    id: exercise.id || videoKey(exercise.name),
    name: exercise.name,
    focus: exercise.focus,
    muscles,
    equipment: equipmentFor(exercise.name),
    description: `Exercício do treino com foco em ${exercise.focus}.`,
    tips: ["Priorize execução limpa.", "Controle a fase de volta.", "Ajuste a carga para manter boa técnica."],
    alternatives: exercise.alternatives ?? alternativesFor(exercise.name).map(videoKey),
    rest: exercise.rest ?? restFor(exercise.name),
    videoKey: exercise.videoKey ?? exercise.id,
  };
}

const items = new Map<string, ExerciseLibraryItem>();
for (const item of extraExercises) items.set(item.id, item);
for (const day of defaultDayPlans) {
  for (const exercise of day.exercises) {
    const item = fromExercise(exercise);
    if (!items.has(item.id)) items.set(item.id, item);
  }
}
for (const item of generatedExerciseLibraryItems) items.set(item.id, item);

export const exerciseLibrary = Object.fromEntries(items) as Record<string, ExerciseLibraryItem>;
export const exerciseLibraryList = Object.values(exerciseLibrary).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

export function findExerciseLibraryItem(idOrName: string) {
  const key = videoKey(idOrName);
  return exerciseLibrary[key] ?? exerciseLibraryList.find((item) => videoKey(item.name) === key);
}

export function toPlanExercise(item: ExerciseLibraryItem, order: number): Exercise {
  return {
    id: item.id,
    order,
    name: item.name,
    focus: item.focus,
    rest: item.rest ?? restFor(item.name),
    alternatives: item.alternatives,
    videoKey: item.videoKey ?? item.id,
  };
}
