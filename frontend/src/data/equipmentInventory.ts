export type EquipmentItem = {
  id: string;
  name: string;
  type: "maquina" | "cabo" | "acessorio" | "peso_livre" | "cardio" | "outro";
  available: boolean;
  notes?: string;
};

export const equipmentInventory: Record<string, EquipmentItem> = {
  barra_reta: { id: "barra_reta", name: "Barra reta", type: "acessorio", available: true },
  barra_v: { id: "barra_v", name: "Barra V", type: "acessorio", available: true },
  corda: { id: "corda", name: "Corda", type: "acessorio", available: true },
  triangulo: { id: "triangulo", name: "Triângulo", type: "acessorio", available: true },
  cabo: { id: "cabo", name: "Cabos/polia", type: "cabo", available: true },
  halteres: { id: "halteres", name: "Halteres", type: "peso_livre", available: true },
  smith: { id: "smith", name: "Smith", type: "maquina", available: true },
  leg_press_45: { id: "leg_press_45", name: "Leg press 45°", type: "maquina", available: true },
  esteira: { id: "esteira", name: "Esteira", type: "cardio", available: true },
  bicicleta_ergometrica: { id: "bicicleta_ergometrica", name: "Bicicleta ergométrica", type: "cardio", available: true },
  maquina: { id: "maquina", name: "Máquina específica", type: "outro", available: false, notes: "Use somente quando a máquina existir no inventário." },
  leg_press_90: { id: "leg_press_90", name: "Leg press 90°", type: "maquina", available: false, notes: "Não disponível nesta academia." },
  eliptico: { id: "eliptico", name: "Elíptico", type: "cardio", available: false, notes: "Não disponível nesta academia." },
  escada: { id: "escada", name: "Escada", type: "cardio", available: false, notes: "Não disponível nesta academia." },
  remo: { id: "remo", name: "Remo", type: "cardio", available: false, notes: "Não disponível nesta academia." },
} satisfies Record<string, EquipmentItem>;

export const equipmentInventoryList = Object.values(equipmentInventory).sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
