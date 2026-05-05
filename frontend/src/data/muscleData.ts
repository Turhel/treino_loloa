import type { MuscleInfo } from "../types/training";

export const muscleImages: Record<string, MuscleInfo> = {
  adutores: {
    title: "Adutores",
    description:
      "Região interna da coxa. Ajuda na estabilidade do quadril e aparece em exercícios como cadeira adutora, agachamentos e leg press.",
    tips: ["Controle a abertura e o fechamento.", "Evite bater a máquina no final do movimento.", "Use amplitude confortável."],
    image: "/musculos/adutores.png",
  },
  abdomen: {
    title: "Abdômen anterior",
    description:
      "Inclui principalmente o reto abdominal, conhecido como six pack. A região inferior pode envolver o músculo piramidal quando presente.",
    tips: ["Evite puxar o pescoço.", "Contraia o abdômen sem prender a respiração.", "Controle a volta do movimento."],
    image: "/musculos/abdomen.png",
  },
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
  deltoide_anterior: {
    title: "Deltoide anterior",
    description: "Parte frontal do ombro. Trabalha bastante em supinos, desenvolvimento e movimentos de empurrar.",
    tips: ["Evite excesso de carga.", "Não deixe o ombro subir em direção à orelha.", "Controle a descida."],
    image: "/musculos/deltoide_anterior.png",
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
  obliquos: {
    title: "Oblíquos",
    description: "Parte lateral do core. Muito envolvida em exercícios anti-rotação, prancha lateral e movimentos de estabilidade.",
    tips: ["Mantenha o tronco estável.", "Evite girar o quadril sem controle.", "Priorize controle em vez de velocidade."],
    image: "/musculos/obliquos.png",
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
  peitoral_superior: {
    title: "Peitoral superior",
    description: "Porção superior do peitoral, mais enfatizada em supinos inclinados e variações inclinadas de crucifixo.",
    tips: ["Mantenha as escápulas estáveis.", "Controle a amplitude.", "Não deixe o ombro dominar o movimento."],
    image: "/musculos/peitoral_superior.png",
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
  vasto_lateral: {
    title: "Vasto lateral",
    description: "Porção lateral do quadríceps. Trabalha em leg press, agachamentos, hack machine e cadeira extensora.",
    tips: ["Controle a descida.", "Mantenha joelhos alinhados com os pés.", "Evite travar o joelho com violência no topo."],
    image: "/musculos/vasto_lateral.png",
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
