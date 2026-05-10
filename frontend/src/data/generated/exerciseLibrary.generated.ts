import type { ExerciseLibraryItem } from "../../types/training";

export const generatedExerciseLibraryItems = [
  {
    "id": "remada_cavalinho",
    "name": "Remada cavalinho",
    "focus": "Costas médias",
    "muscles": [
      "costas_medias",
      "dorsal",
      "biceps"
    ],
    "equipment": [
      "barra_reta",
      "maquina"
    ],
    "description": "Remada com apoio ou barra para trabalhar espessura das costas.",
    "tips": [
      "Puxe com os cotovelos.",
      "Mantenha o tronco firme.",
      "Controle a descida."
    ],
    "alternatives": [
      "remada_baixa_triangulo",
      "remada_baixa_no_cabo"
    ],
    "rest": 90,
    "videoKey": "remada_cavalinho",
    "illustrations": [],
    "met": 4.5,
    "exerciseKind": "composto"
  },
  {
    "id": "remada_baixa_no_cabo",
    "name": "Remada baixa no cabo",
    "focus": "Costas médias",
    "muscles": [
      "costas_medias",
      "dorsal",
      "biceps"
    ],
    "equipment": [
      "cabo"
    ],
    "description": "Remada horizontal no cabo para dorsais e costas médias.",
    "tips": [
      "Peito aberto.",
      "Cotovelos para trás.",
      "Não jogue o tronco."
    ],
    "alternatives": [
      "remada_baixa_triangulo",
      "remada_cavalinho"
    ],
    "rest": 90,
    "videoKey": "remada_baixa_no_cabo",
    "illustrations": [],
    "met": 4.5,
    "exerciseKind": "composto"
  },
  {
    "id": "remada_baixa_triangulo",
    "name": "Remada baixa triângulo",
    "focus": "Costas médias e dorsal",
    "muscles": [
      "costas_medias",
      "dorsal",
      "biceps"
    ],
    "equipment": [
      "cabo",
      "triangulo"
    ],
    "description": "Remada baixa usando pegador triângulo, com pegada neutra e estável.",
    "tips": [
      "Aproxime as escápulas.",
      "Segure um instante atrás.",
      "Volte sem perder controle."
    ],
    "alternatives": [
      "remada_baixa_no_cabo",
      "remada_cavalinho"
    ],
    "rest": 90,
    "videoKey": "remada_baixa_triangulo",
    "illustrations": [],
    "met": 4.5,
    "exerciseKind": "composto"
  },
  {
    "id": "puxada_barra_reta",
    "name": "Puxada com barra reta",
    "focus": "Dorsal",
    "muscles": [
      "dorsal",
      "biceps"
    ],
    "equipment": [
      "cabo",
      "barra_reta"
    ],
    "description": "Puxada vertical com barra reta para largura das costas.",
    "tips": [
      "Puxe com os cotovelos.",
      "Não incline demais o tronco.",
      "Controle a volta."
    ],
    "alternatives": [
      "puxada_triangulo",
      "pulldown_barra_reta"
    ],
    "rest": 90,
    "videoKey": "puxada_barra_reta",
    "illustrations": [],
    "met": 4.5,
    "exerciseKind": "composto"
  },
  {
    "id": "puxada_triangulo",
    "name": "Puxada com triângulo",
    "focus": "Dorsal e bíceps",
    "muscles": [
      "dorsal",
      "biceps"
    ],
    "equipment": [
      "cabo",
      "triangulo"
    ],
    "description": "Puxada vertical com pegada neutra usando triângulo.",
    "tips": [
      "Desça os cotovelos.",
      "Peito aberto.",
      "Evite transformar em remada."
    ],
    "alternatives": [
      "puxada_barra_reta",
      "pulldown_corda"
    ],
    "rest": 90,
    "videoKey": "puxada_triangulo",
    "illustrations": [],
    "met": 4.5,
    "exerciseKind": "composto"
  },
  {
    "id": "puxada_barra_v",
    "name": "Puxada com barra V",
    "focus": "Dorsal e bíceps",
    "muscles": [
      "dorsal",
      "biceps"
    ],
    "equipment": [
      "cabo",
      "barra_v"
    ],
    "description": "Puxada vertical no cabo usando barra V.",
    "tips": [
      "Mantenha o peito aberto.",
      "Puxe com os cotovelos.",
      "Controle a subida."
    ],
    "alternatives": [
      "puxada_triangulo",
      "puxada_barra_reta"
    ],
    "rest": 90,
    "videoKey": "puxada_barra_v",
    "illustrations": [],
    "met": 4.5,
    "exerciseKind": "composto"
  },
  {
    "id": "remada_baixa_barra_reta",
    "name": "Remada baixa barra reta",
    "focus": "Costas médias",
    "muscles": [
      "costas_medias",
      "dorsal",
      "biceps"
    ],
    "equipment": [
      "cabo",
      "barra_reta"
    ],
    "description": "Remada horizontal no cabo com barra reta.",
    "tips": [
      "Evite jogar o tronco.",
      "Aproxime escápulas.",
      "Volte controlando."
    ],
    "alternatives": [
      "remada_baixa_triangulo",
      "remada_cavalinho"
    ],
    "rest": 90,
    "videoKey": "remada_baixa_barra_reta",
    "illustrations": [],
    "met": 4.5,
    "exerciseKind": "composto"
  },
  {
    "id": "pulldown_barra_reta",
    "name": "Pulldown com barra reta",
    "focus": "Dorsal",
    "muscles": [
      "dorsal"
    ],
    "equipment": [
      "cabo",
      "barra_reta"
    ],
    "description": "Extensão de ombro no cabo para enfatizar dorsal.",
    "tips": [
      "Braços quase estendidos.",
      "Costelas baixas.",
      "Controle a subida."
    ],
    "alternatives": [
      "pulldown_corda",
      "puxada_barra_reta"
    ],
    "rest": 60,
    "videoKey": "pulldown_barra_reta",
    "illustrations": [],
    "met": 3.5,
    "exerciseKind": "isolador"
  },
  {
    "id": "pulldown_corda",
    "name": "Pulldown com corda",
    "focus": "Dorsal",
    "muscles": [
      "dorsal"
    ],
    "equipment": [
      "cabo",
      "corda"
    ],
    "description": "Pulldown no cabo com corda, permitindo amplitude confortável.",
    "tips": [
      "Abra a corda no final.",
      "Não roube com lombar.",
      "Volte devagar."
    ],
    "alternatives": [
      "pulldown_barra_reta",
      "puxada_triangulo"
    ],
    "rest": 60,
    "videoKey": "pulldown_corda",
    "illustrations": [],
    "met": 3.5,
    "exerciseKind": "isolador"
  },
  {
    "id": "rdl",
    "name": "RDL / terra romeno",
    "focus": "Posterior de coxa e glúteos",
    "muscles": [
      "posterior_coxa",
      "gluteos",
      "lombar"
    ],
    "equipment": [
      "barra_reta",
      "halteres"
    ],
    "description": "Dobradiça de quadril com joelhos levemente flexionados.",
    "tips": [
      "Quadril vai para trás.",
      "Coluna neutra.",
      "Barra próxima ao corpo."
    ],
    "alternatives": [
      "stiff_barra",
      "levantamento_terra_sumo"
    ],
    "rest": 90,
    "videoKey": "rdl",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "composto"
  },
  {
    "id": "stiff_barra",
    "name": "Stiff com barra",
    "focus": "Posterior de coxa",
    "muscles": [
      "posterior_coxa",
      "gluteos",
      "lombar"
    ],
    "equipment": [
      "barra_reta"
    ],
    "description": "Variação de dobradiça com ênfase em posterior de coxa.",
    "tips": [
      "Desça até manter controle.",
      "Não arredonde a coluna.",
      "Sinta alongar posterior."
    ],
    "alternatives": [
      "rdl",
      "levantamento_terra_sumo"
    ],
    "rest": 90,
    "videoKey": "stiff_barra",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "composto"
  },
  {
    "id": "stiff_halteres",
    "name": "Stiff com halteres",
    "focus": "Posterior de coxa",
    "muscles": [
      "posterior_coxa",
      "gluteos",
      "lombar"
    ],
    "equipment": [
      "halteres"
    ],
    "description": "Stiff usando halteres, útil para amplitude confortável.",
    "tips": [
      "Halteres próximos às pernas.",
      "Quadril para trás.",
      "Coluna neutra."
    ],
    "alternatives": [
      "stiff_barra",
      "rdl"
    ],
    "rest": 90,
    "videoKey": "stiff_halteres",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "composto"
  },
  {
    "id": "leg_press_45",
    "name": "Leg press 45",
    "focus": "Quadríceps e glúteos",
    "muscles": [
      "quadriceps",
      "vasto_lateral",
      "gluteos",
      "adutores"
    ],
    "equipment": [
      "leg_press_45"
    ],
    "description": "Empurrada de pernas na plataforma inclinada.",
    "tips": [
      "Lombar apoiada.",
      "Joelhos alinhados.",
      "Não trave com violência."
    ],
    "alternatives": [
      "leg_press_45_pes_altos",
      "leg_press_45_unilateral"
    ],
    "rest": 90,
    "videoKey": "leg_press_45",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "composto"
  },
  {
    "id": "leg_press_45_pes_medios",
    "name": "Leg press 45 pés médios",
    "focus": "Quadríceps e glúteos",
    "muscles": [
      "quadriceps",
      "vasto_lateral",
      "gluteos",
      "adutores"
    ],
    "equipment": [
      "leg_press_45"
    ],
    "description": "Leg press 45 com pés em posição média para trabalho geral de pernas.",
    "tips": [
      "Pés na largura do quadril.",
      "Joelhos alinhados.",
      "Lombar apoiada."
    ],
    "alternatives": [
      "leg_press_45",
      "leg_press_45_unilateral"
    ],
    "rest": 90,
    "videoKey": "leg_press_45_pes_medios",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "composto"
  },
  {
    "id": "leg_press_45_pes_altos",
    "name": "Leg press 45 pés altos",
    "focus": "Glúteos e posterior",
    "muscles": [
      "gluteos",
      "posterior_coxa",
      "quadriceps"
    ],
    "equipment": [
      "leg_press_45"
    ],
    "description": "Variação com pés mais altos para enfatizar glúteos e posterior.",
    "tips": [
      "Mantenha a lombar apoiada.",
      "Controle a profundidade.",
      "Empurre com o pé inteiro."
    ],
    "alternatives": [
      "leg_press_45",
      "leg_press_45_unilateral"
    ],
    "rest": 90,
    "videoKey": "leg_press_45_pes_altos",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "composto"
  },
  {
    "id": "leg_press_45_unilateral",
    "name": "Leg press 45 unilateral",
    "focus": "Quadríceps e glúteo unilateral",
    "muscles": [
      "quadriceps",
      "vasto_lateral",
      "gluteos"
    ],
    "equipment": [
      "leg_press_45"
    ],
    "description": "Leg press feito com uma perna por vez para equalizar lados.",
    "tips": [
      "Use carga menor.",
      "Controle o joelho.",
      "Repita o mesmo padrão nos dois lados."
    ],
    "alternatives": [
      "leg_press_45",
      "leg_press_45_pes_altos"
    ],
    "rest": 90,
    "videoKey": "leg_press_45_unilateral",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "composto"
  },
  {
    "id": "panturrilha_no_leg_press_45",
    "name": "Panturrilha no leg press 45",
    "focus": "Panturrilha",
    "muscles": [
      "panturrilha"
    ],
    "equipment": [
      "leg_press_45"
    ],
    "description": "Flexão plantar no leg press para panturrilhas.",
    "tips": [
      "Amplitude completa.",
      "Pause no topo.",
      "Não quique."
    ],
    "alternatives": [
      "leg_press_45"
    ],
    "rest": 60,
    "videoKey": "panturrilha_no_leg_press_45",
    "illustrations": [],
    "met": 3.5,
    "exerciseKind": "isolador"
  },
  {
    "id": "triceps_barra_reta",
    "name": "Tríceps barra reta",
    "focus": "Tríceps",
    "muscles": [
      "triceps"
    ],
    "equipment": [
      "cabo",
      "barra_reta"
    ],
    "description": "Extensão de cotovelos no pulley usando barra reta.",
    "tips": [
      "Cotovelos próximos ao corpo.",
      "Punhos firmes.",
      "Controle a volta."
    ],
    "alternatives": [
      "pulldown_corda"
    ],
    "rest": 60,
    "videoKey": "triceps_barra_reta",
    "illustrations": [],
    "met": 3.5,
    "exerciseKind": "isolador"
  },
  {
    "id": "triceps_barra_v",
    "name": "Tríceps barra V",
    "focus": "Tríceps",
    "muscles": [
      "triceps"
    ],
    "equipment": [
      "cabo",
      "barra_v"
    ],
    "description": "Extensão de cotovelos no pulley usando barra V.",
    "tips": [
      "Punhos firmes.",
      "Cotovelos parados.",
      "Controle a volta."
    ],
    "alternatives": [
      "triceps_barra_reta",
      "triceps_corda"
    ],
    "rest": 60,
    "videoKey": "triceps_barra_v",
    "illustrations": [],
    "met": 3.5,
    "exerciseKind": "isolador"
  },
  {
    "id": "triceps_corda",
    "name": "Tríceps corda",
    "focus": "Tríceps",
    "muscles": [
      "triceps"
    ],
    "equipment": [
      "cabo",
      "corda"
    ],
    "description": "Extensão de cotovelos no pulley com corda.",
    "tips": [
      "Abra a corda no final.",
      "Cotovelos próximos.",
      "Controle o retorno."
    ],
    "alternatives": [
      "triceps_barra_reta",
      "triceps_barra_v"
    ],
    "rest": 60,
    "videoKey": "triceps_corda",
    "illustrations": [],
    "met": 3.5,
    "exerciseKind": "isolador"
  },
  {
    "id": "triceps_unilateral_cabo",
    "name": "Tríceps unilateral no cabo",
    "focus": "Tríceps",
    "muscles": [
      "triceps"
    ],
    "equipment": [
      "cabo"
    ],
    "description": "Extensão unilateral no cabo para equilibrar lados.",
    "tips": [
      "Controle total.",
      "Evite girar o tronco.",
      "Faça os dois lados iguais."
    ],
    "alternatives": [
      "triceps_corda",
      "triceps_barra_reta"
    ],
    "rest": 60,
    "videoKey": "triceps_unilateral_cabo",
    "illustrations": [],
    "met": 3.5,
    "exerciseKind": "isolador"
  },
  {
    "id": "cadeira_abdutora",
    "name": "Cadeira abdutora",
    "focus": "Glúteo médio",
    "muscles": [
      "gluteo_medio",
      "gluteos"
    ],
    "equipment": [
      "maquina"
    ],
    "description": "Abdução de quadril na máquina para lateral dos glúteos.",
    "tips": [
      "Controle a abertura.",
      "Não bata a máquina.",
      "Evite impulso."
    ],
    "alternatives": [
      "leg_press_45_pes_altos"
    ],
    "rest": 60,
    "videoKey": "cadeira_abdutora",
    "illustrations": [],
    "met": 3.5,
    "exerciseKind": "isolador"
  },
  {
    "id": "abdominal_no_cabo",
    "name": "Abdominal no cabo",
    "focus": "Abdômen",
    "muscles": [
      "abdomen",
      "core"
    ],
    "equipment": [
      "cabo",
      "corda"
    ],
    "description": "Flexão de tronco no cabo com foco em controle abdominal.",
    "tips": [
      "Não puxe com os braços.",
      "Enrole a coluna com controle.",
      "Respire no esforço."
    ],
    "alternatives": [
      "dead_bug",
      "pallof_press"
    ],
    "rest": 60,
    "videoKey": "abdominal_no_cabo",
    "illustrations": [],
    "met": 3.5,
    "exerciseKind": "isolador"
  },
  {
    "id": "pallof_press",
    "name": "Pallof press",
    "focus": "Core anti-rotação",
    "muscles": [
      "core",
      "obliquos"
    ],
    "equipment": [
      "cabo"
    ],
    "description": "Exercício anti-rotação para estabilidade do tronco.",
    "tips": [
      "Quadril parado.",
      "Empurre sem girar.",
      "Controle a respiração."
    ],
    "alternatives": [
      "dead_bug",
      "prancha_lateral"
    ],
    "rest": 45,
    "videoKey": "pallof_press",
    "illustrations": [],
    "met": 3,
    "exerciseKind": "mobilidade"
  },
  {
    "id": "dead_bug",
    "name": "Dead bug",
    "focus": "Core e controle lombar",
    "muscles": [
      "core",
      "abdomen"
    ],
    "equipment": [],
    "description": "Controle alternado de braços e pernas mantendo lombar estável.",
    "tips": [
      "Lombar próxima ao chão.",
      "Movimento lento.",
      "Respire sem perder controle."
    ],
    "alternatives": [
      "pallof_press",
      "prancha_lateral"
    ],
    "rest": 45,
    "videoKey": "dead_bug",
    "illustrations": [],
    "met": 2.8,
    "exerciseKind": "mobilidade"
  },
  {
    "id": "prancha_lateral",
    "name": "Prancha lateral",
    "focus": "Oblíquos",
    "muscles": [
      "obliquos",
      "core"
    ],
    "equipment": [],
    "description": "Prancha em apoio lateral para estabilidade do core.",
    "tips": [
      "Quadril alinhado.",
      "Não deixe cair.",
      "Mantenha respiração controlada."
    ],
    "alternatives": [
      "pallof_press",
      "dead_bug"
    ],
    "rest": 45,
    "videoKey": "prancha_lateral",
    "illustrations": [],
    "met": 3,
    "exerciseKind": "mobilidade"
  },
  {
    "id": "esteira",
    "name": "Esteira",
    "focus": "Cardio",
    "muscles": [
      "quadriceps",
      "posterior_coxa",
      "panturrilha"
    ],
    "equipment": [
      "esteira"
    ],
    "description": "Cardio em caminhada ou corrida leve na esteira.",
    "tips": [
      "Ajuste a velocidade.",
      "Mantenha postura confortável.",
      "Use intensidade sustentável."
    ],
    "alternatives": [
      "bicicleta_ergometrica"
    ],
    "rest": 0,
    "videoKey": "esteira",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "cardio"
  },
  {
    "id": "bicicleta_ergometrica",
    "name": "Bicicleta ergométrica",
    "focus": "Cardio",
    "muscles": [
      "quadriceps",
      "posterior_coxa",
      "panturrilha"
    ],
    "equipment": [
      "bicicleta_ergometrica"
    ],
    "description": "Cardio de baixo impacto em bicicleta ergométrica.",
    "tips": [
      "Ajuste o banco.",
      "Evite travar joelhos.",
      "Controle a intensidade."
    ],
    "alternatives": [
      "esteira"
    ],
    "rest": 0,
    "videoKey": "bicicleta_ergometrica",
    "illustrations": [],
    "met": 4.5,
    "exerciseKind": "cardio"
  },
  {
    "id": "eliptico",
    "name": "Elíptico",
    "focus": "Cardio",
    "muscles": [
      "quadriceps",
      "posterior_coxa",
      "panturrilha"
    ],
    "equipment": [
      "eliptico"
    ],
    "description": "Cardio em elíptico. Mantido na biblioteca como indisponível para esta academia.",
    "tips": [
      "Use se houver equipamento equivalente.",
      "Controle a intensidade.",
      "Evite travar joelhos."
    ],
    "alternatives": [
      "esteira",
      "bicicleta_ergometrica"
    ],
    "rest": 0,
    "videoKey": "eliptico",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "cardio",
    "availableByDefault": false
  },
  {
    "id": "leg_press_90",
    "name": "Leg press 90",
    "focus": "Quadríceps e glúteos",
    "muscles": [
      "quadriceps",
      "gluteos"
    ],
    "equipment": [
      "leg_press_90"
    ],
    "description": "Variação de leg press indisponível nesta academia.",
    "tips": [
      "Use leg press 45 como alternativa disponível.",
      "Não substitua sem conferir equipamento.",
      "Mantenha joelhos alinhados."
    ],
    "alternatives": [
      "leg_press_45",
      "leg_press_45_pes_medios"
    ],
    "rest": 90,
    "videoKey": "leg_press_90",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "composto",
    "availableByDefault": false
  },
  {
    "id": "levantamento_terra_sumo",
    "name": "Levantamento terra sumô",
    "focus": "Posterior, glúteos e adutores",
    "muscles": [
      "posterior_coxa",
      "gluteos",
      "lombar",
      "adutores"
    ],
    "equipment": [
      "barra_reta"
    ],
    "description": "Levantamento com base ampla para glúteos, posterior e adutores.",
    "tips": [
      "Corpo tensionado.",
      "Pernas mais abertas.",
      "Pés apontados levemente para fora."
    ],
    "alternatives": [
      "rdl",
      "stiff_barra",
      "agachamento_sumo"
    ],
    "rest": 90,
    "videoKey": "levantamento_terra_sumo",
    "illustrations": [],
    "met": 5.5,
    "exerciseKind": "composto"
  },
  {
    "id": "agachamento_sumo",
    "name": "Agachamento sumô",
    "focus": "Glúteos, quadríceps e adutores",
    "muscles": [
      "gluteos",
      "quadriceps",
      "adutores"
    ],
    "equipment": [
      "halteres",
      "smith"
    ],
    "description": "Agachamento com base mais aberta e pés levemente apontados para fora.",
    "tips": [
      "Joelhos acompanham os pés.",
      "Tronco firme.",
      "Amplitude confortável."
    ],
    "alternatives": [
      "levantamento_terra_sumo",
      "leg_press_45"
    ],
    "rest": 90,
    "videoKey": "agachamento_sumo",
    "illustrations": [],
    "met": 5,
    "exerciseKind": "composto"
  }
] satisfies ExerciseLibraryItem[];

export const generatedExerciseLibrary = Object.fromEntries(
  generatedExerciseLibraryItems.map((item) => [item.id, item]),
) as Record<string, ExerciseLibraryItem>;
