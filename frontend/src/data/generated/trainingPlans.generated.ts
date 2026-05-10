import type { TrainingPlan } from "../../types/training";

export const generatedTrainingPlans = [
  {
    "id": "treino-admin-exemplo",
    "name": "Treino Admin Exemplo",
    "phase": "custom",
    "weeks": [
      {
        "id": "A",
        "label": "Semana A",
        "days": [
          {
            "id": "admin-a-segunda",
            "week": "A",
            "day": "Segunda",
            "title": "Puxar A: costas completas",
            "type": "puxar",
            "exercises": [
              {
                "id": "puxada_barra_reta",
                "order": 1,
                "name": "Puxada com barra reta",
                "focus": "Dorsal",
                "rest": 90,
                "alternatives": [
                  "puxada_triangulo",
                  "pulldown_barra_reta"
                ],
                "videoKey": "puxada_barra_reta"
              },
              {
                "id": "remada_baixa_triangulo",
                "order": 2,
                "name": "Remada baixa triângulo",
                "focus": "Costas médias e dorsal",
                "rest": 90,
                "alternatives": [
                  "remada_baixa_no_cabo",
                  "remada_cavalinho"
                ],
                "videoKey": "remada_baixa_triangulo"
              },
              {
                "id": "pulldown_corda",
                "order": 3,
                "name": "Pulldown com corda",
                "focus": "Dorsal",
                "rest": 60,
                "alternatives": [
                  "pulldown_barra_reta",
                  "puxada_triangulo"
                ],
                "videoKey": "pulldown_corda"
              }
            ]
          },
          {
            "id": "admin-a-terca",
            "week": "A",
            "day": "Terça",
            "title": "Glúteos e posterior",
            "type": "gluteo",
            "exercises": [
              {
                "id": "rdl",
                "order": 1,
                "name": "RDL / terra romeno",
                "focus": "Posterior de coxa e glúteos",
                "rest": 90,
                "alternatives": [
                  "stiff_barra",
                  "levantamento_terra_sumo"
                ],
                "videoKey": "rdl"
              },
              {
                "id": "leg_press_45_pes_altos",
                "order": 2,
                "name": "Leg press 45 pés altos",
                "focus": "Glúteos e posterior",
                "rest": 90,
                "alternatives": [
                  "leg_press_45",
                  "leg_press_45_unilateral"
                ],
                "videoKey": "leg_press_45_pes_altos"
              },
              {
                "id": "cadeira_abdutora",
                "order": 3,
                "name": "Cadeira abdutora",
                "focus": "Glúteo médio",
                "rest": 60,
                "alternatives": [
                  "leg_press_45_pes_altos"
                ],
                "videoKey": "cadeira_abdutora"
              }
            ]
          }
        ]
      },
      {
        "id": "B",
        "label": "Semana B",
        "days": [
          {
            "id": "admin-b-segunda",
            "week": "B",
            "day": "Segunda",
            "title": "Inferiores B",
            "type": "inferior",
            "exercises": [
              {
                "id": "leg_press_45",
                "order": 1,
                "name": "Leg press 45",
                "focus": "Quadríceps e glúteos",
                "rest": 90,
                "alternatives": [
                  "leg_press_45_pes_altos",
                  "leg_press_45_unilateral"
                ],
                "videoKey": "leg_press_45"
              },
              {
                "id": "agachamento_sumo",
                "order": 2,
                "name": "Agachamento sumô",
                "focus": "Glúteos, quadríceps e adutores",
                "rest": 90,
                "alternatives": [
                  "levantamento_terra_sumo",
                  "leg_press_45"
                ],
                "videoKey": "agachamento_sumo"
              },
              {
                "id": "panturrilha_no_leg_press_45",
                "order": 3,
                "name": "Panturrilha no leg press 45",
                "focus": "Panturrilha",
                "rest": 60,
                "alternatives": [
                  "leg_press_45"
                ],
                "videoKey": "panturrilha_no_leg_press_45"
              }
            ]
          }
        ]
      }
    ]
  }
] satisfies TrainingPlan[];
