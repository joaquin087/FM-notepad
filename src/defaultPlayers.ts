import { Player, Formation } from "./types";

export const defaultPlayers: Player[] = [];

export const defaultFormations: Formation[] = [
  {
    name: "4-2-3-1 Cerrado/Económico",
    key: "4231",
    positions: [
      { key: "GK", label: "Portero", shortLabel: "POR", compatiblePositions: ["GK"] },
      { key: "DFR", label: "Lateral Derecho", shortLabel: "DFD", compatiblePositions: ["D (R)", "WBR"] },
      { key: "DFCR", label: "Defensa Central Derecho", shortLabel: "DFC D", compatiblePositions: ["D (C)"] },
      { key: "DFCL", label: "Defensa Central Izquierdo", shortLabel: "DFC I", compatiblePositions: ["D (C)"] },
      { key: "DFL", label: "Lateral Izquierdo", shortLabel: "DFI", compatiblePositions: ["D (L)", "WBL"] },
      { key: "MCR", label: "Centrocampista Derecho", shortLabel: "MC D", compatiblePositions: ["M (C)", "DM"] },
      { key: "MCL", label: "Centrocampista Izquierdo", shortLabel: "MC I", compatiblePositions: ["M (C)", "DM"] },
      { key: "AMR", label: "Extremo Derecho", shortLabel: "MP D", compatiblePositions: ["AM (R)", "M (R)"] },
      { key: "AMC", label: "Enganche", shortLabel: "ENG", compatiblePositions: ["AM (C)", "M (C)"] },
      { key: "AML", label: "Extremo Izquierdo", shortLabel: "MP I", compatiblePositions: ["AM (L)", "M (L)"] },
      { key: "STC", label: "Delantero Centro", shortLabel: "DL", compatiblePositions: ["ST (C)"] }
    ]
  },
  {
    name: "4-3-3 Ofensivo",
    key: "433",
    positions: [
      { key: "GK", label: "Portero", shortLabel: "POR", compatiblePositions: ["GK"] },
      { key: "DFR", label: "Lateral Derecho", shortLabel: "DFD", compatiblePositions: ["D (R)", "WBR"] },
      { key: "DFCR", label: "Defensa Central Derecho", shortLabel: "DFC D", compatiblePositions: ["D (C)"] },
      { key: "DFCL", label: "Defensa Central Izquierdo", shortLabel: "DFC I", compatiblePositions: ["D (C)"] },
      { key: "DFL", label: "Lateral Izquierdo", shortLabel: "DFI", compatiblePositions: ["D (L)", "WBL"] },
      { key: "DM", label: "Mediocentro Defensivo", shortLabel: "MCD", compatiblePositions: ["DM", "M (C)"] },
      { key: "MCR", label: "Interior Derecho", shortLabel: "MC D", compatiblePositions: ["M (C)"] },
      { key: "MCL", label: "Interior Izquierdo", shortLabel: "MC I", compatiblePositions: ["M (C)"] },
      { key: "AMR", label: "Extremo Derecho", shortLabel: "MP D", compatiblePositions: ["AM (R)", "M (R)"] },
      { key: "AML", label: "Extremo Izquierdo", shortLabel: "MP I", compatiblePositions: ["AM (L)", "M (L)"] },
      { key: "STC", label: "Delantero Centro", shortLabel: "DL", compatiblePositions: ["ST (C)"] }
    ]
  },
  {
    name: "3-5-2 Clásico",
    key: "352",
    positions: [
      { key: "GK", label: "Portero", shortLabel: "POR", compatiblePositions: ["GK"] },
      { key: "DFCL", label: "Central Izquierdo", shortLabel: "DFC I", compatiblePositions: ["D (C)"] },
      { key: "DFCC", label: "Líbero/Central", shortLabel: "DFC C", compatiblePositions: ["D (C)"] },
      { key: "DFCR", label: "Central Derecho", shortLabel: "DFC D", compatiblePositions: ["D (C)"] },
      { key: "WBL", label: "Carrilero Izquierdo", shortLabel: "CR I", compatiblePositions: ["D (L)", "WBL", "M (L)"] },
      { key: "MCL", label: "Centrocampista Izquierdo", shortLabel: "MC I", compatiblePositions: ["M (C)", "DM"] },
      { key: "MCC", label: "Mediocentro Creador", shortLabel: "MC C", compatiblePositions: ["M (C)", "AM (C)"] },
      { key: "MCR", label: "Centrocampista Derecho", shortLabel: "MC D", compatiblePositions: ["M (C)", "DM"] },
      { key: "WBR", label: "Carrilero Derecho", shortLabel: "CR D", compatiblePositions: ["D (R)", "WBR", "M (R)"] },
      { key: "STCL", label: "Delantero Izquierdo", shortLabel: "DL I", compatiblePositions: ["ST (C)"] },
      { key: "STCR", label: "Delantero Derecho", shortLabel: "DL D", compatiblePositions: ["ST (C)"] }
    ]
  },
  {
    name: "4-4-2 Tradicional",
    key: "442",
    positions: [
      { key: "GK", label: "Portero", shortLabel: "POR", compatiblePositions: ["GK"] },
      { key: "DFR", label: "Lateral Derecho", shortLabel: "DFD", compatiblePositions: ["D (R)", "WBR"] },
      { key: "DFCR", label: "Defensa Central Derecho", shortLabel: "DFC D", compatiblePositions: ["D (C)"] },
      { key: "DFCL", label: "Defensa Central Izquierdo", shortLabel: "DFC I", compatiblePositions: ["D (C)"] },
      { key: "DFL", label: "Lateral Izquierdo", shortLabel: "DFI", compatiblePositions: ["D (L)", "WBL"] },
      { key: "MR", label: "Interior Derecho", shortLabel: "MD", compatiblePositions: ["M (R)", "AM (R)"] },
      { key: "MCR", label: "Pivote Derecho", shortLabel: "MC D", compatiblePositions: ["M (C)", "DM"] },
      { key: "MCL", label: "Pivote Izquierdo", shortLabel: "MC I", compatiblePositions: ["M (C)", "DM"] },
      { key: "ML", label: "Interior Izquierdo", shortLabel: "MI", compatiblePositions: ["M (L)", "AM (L)"] },
      { key: "STCL", label: "Segundo Delantero", shortLabel: "SD", compatiblePositions: ["ST (C)", "AM (C)"] },
      { key: "STCR", label: "Hombre Objetivo", shortLabel: "DL D", compatiblePositions: ["ST (C)"] }
    ]
  }
];
