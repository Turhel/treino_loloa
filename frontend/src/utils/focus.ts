import { muscleImages } from "../data/muscleData";

function normalizeFocus(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function focusToKey(focus: string) {
  const text = normalizeFocus(focus);

  if (text.includes("adutor") || text.includes("parte interna da coxa")) return "adutores";
  if (text.includes("abdomen") || text.includes("abdominal") || text.includes("reto abdominal")) return "abdomen";
  if (text.includes("obliquo") || text.includes("anti-rotacao") || text.includes("core lateral") || text.includes("prancha lateral")) return "obliquos";
  if (text.includes("peito superior") || text.includes("peitoral superior") || text.includes("inclinado")) return "peitoral_superior";
  if (text.includes("deltoide anterior") || text.includes("ombro anterior")) return "deltoide_anterior";
  if (text.includes("costas superiores")) return "costas_superiores";
  if (text.includes("costas medias") || text.includes("meio das costas") || text.includes("espessura")) return "costas_medias";
  if (text.includes("deltoide posterior") || text.includes("ombro posterior") || text.includes("postura")) return "deltoide_posterior";
  if (text.includes("ombro lateral") || text.includes("deltoide lateral")) return "ombro_lateral";
  if (text.includes("ombros") || text.includes("ombro")) return "ombros";
  if (text.includes("gluteo maximo")) return "gluteo_maximo";
  if (text.includes("gluteo medio")) return "gluteo_medio";
  if (text.includes("gluteos") || text.includes("gluteo")) return "gluteos";
  if (text.includes("posterior de coxa") || text.includes("posterior")) return "posterior_coxa";
  if (text.includes("gastrocnemio")) return "gastrocnemio";
  if (text.includes("soleo")) return "soleo";
  if (text.includes("panturrilha")) return "panturrilha";
  if (text.includes("vasto lateral")) return "vasto_lateral";
  if (text.includes("quadriceps")) return "quadriceps";
  if (text.includes("peito") || text.includes("peitoral")) return "peitoral";
  if (text.includes("triceps")) return "triceps";
  if (text.includes("braquial")) return "braquial";
  if (text.includes("biceps")) return "biceps";
  if (text.includes("trapezio")) return "trapezio";
  if (text.includes("dorsal")) return "dorsal";
  if (text.includes("lombar")) return "lombar";

  return "core";
}

export type FocusTarget = {
  key: string;
  label: string;
};

function addFocusTarget(targets: FocusTarget[], key: string, label?: string) {
  if (targets.some((target) => target.key === key)) return;
  const info = muscleImages[key] ?? muscleImages.core;
  targets.push({ key, label: label ?? info.title });
}

export function focusToTargets(focus: string): FocusTarget[] {
  const text = normalizeFocus(focus);
  const targets: FocusTarget[] = [];

  if (text.includes("costas superiores")) addFocusTarget(targets, "costas_superiores");
  if (text.includes("costas medias") || text.includes("meio das costas") || text.includes("espessura") || text === "costas") addFocusTarget(targets, "costas_medias");
  if (text.includes("deltoide posterior") || text.includes("ombro posterior") || text.includes("postura")) addFocusTarget(targets, "deltoide_posterior");
  if (text.includes("deltoide anterior") || text.includes("ombro anterior") || text.includes("desenvolvimento")) addFocusTarget(targets, "deltoide_anterior");
  if (text.includes("ombro lateral") || text.includes("deltoide lateral")) addFocusTarget(targets, "ombro_lateral");
  if (text.includes("ombros") || text === "ombro") addFocusTarget(targets, "ombros");

  if (text.includes("gluteo maximo")) addFocusTarget(targets, "gluteo_maximo");
  if (text.includes("gluteo medio")) addFocusTarget(targets, "gluteo_medio");
  if (text.includes("gluteos")) addFocusTarget(targets, "gluteos");
  if (text.includes("gluteo") && !text.includes("maximo") && !text.includes("medio")) addFocusTarget(targets, "gluteos", "Glúteo");

  if (text.includes("posterior de coxa")) addFocusTarget(targets, "posterior_coxa");
  if (text.includes("posterior") && !text.includes("deltoide") && !text.includes("ombro") && !text.includes("postura")) addFocusTarget(targets, "posterior_coxa", "Posterior de coxa");

  if (text.includes("adutor") || text.includes("parte interna da coxa")) addFocusTarget(targets, "adutores");
  if (text.includes("gastrocnemio")) addFocusTarget(targets, "gastrocnemio");
  if (text.includes("soleo")) addFocusTarget(targets, "soleo");
  if (text.includes("panturrilha")) addFocusTarget(targets, "panturrilha");
  if (text.includes("quadriceps")) {
    addFocusTarget(targets, "quadriceps");
    addFocusTarget(targets, "vasto_lateral");
  }
  if (text.includes("vasto lateral")) addFocusTarget(targets, "vasto_lateral");

  if (text.includes("peito superior") || text.includes("peitoral superior") || text.includes("inclinado")) addFocusTarget(targets, "peitoral_superior");
  if (text.includes("peito") || text.includes("peitoral")) addFocusTarget(targets, "peitoral");
  if (text.includes("supino") || text.includes("empurrar")) addFocusTarget(targets, "deltoide_anterior");

  if (text.includes("triceps")) addFocusTarget(targets, "triceps");
  if (text.includes("braquial")) addFocusTarget(targets, "braquial");
  if (text.includes("biceps")) addFocusTarget(targets, "biceps");
  if (text.includes("trapezio")) addFocusTarget(targets, "trapezio");
  if (text.includes("dorsal")) addFocusTarget(targets, "dorsal");
  if (text.includes("lombar")) addFocusTarget(targets, "lombar");

  if (text.includes("abdomen") || text.includes("abdominal")) addFocusTarget(targets, "abdomen");
  if (text.includes("obliquo") || text.includes("anti-rotacao") || text.includes("core lateral") || text.includes("prancha lateral")) addFocusTarget(targets, "obliquos");
  if (text.includes("core")) {
    addFocusTarget(targets, "abdomen", "Abdômen");
    addFocusTarget(targets, "obliquos", "Oblíquos");
  }

  if (targets.length === 0) addFocusTarget(targets, focusToKey(focus));
  return targets;
}
