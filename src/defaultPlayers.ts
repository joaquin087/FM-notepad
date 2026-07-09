import { Player, Formation } from "./types";

export const defaultPlayers: Player[] = [];

export const defaultFormations: Formation[] = [
  {
    name: "4-2-3-1 Cerrado/Económico",
    key: "4231",
    positions: [
      { key: "GK", label: "Portero", shortLabel: "GK", compatiblePositions: ["GK"] },
      { key: "DFR", label: "Lateral Derecho", shortLabel: "D (R)", compatiblePositions: ["D (R)", "WBR"] },
      { key: "DFCR", label: "Defensa Central Derecho", shortLabel: "D (CR)", compatiblePositions: ["D (C)"] },
      { key: "DFCL", label: "Defensa Central Izquierdo", shortLabel: "D (CL)", compatiblePositions: ["D (C)"] },
      { key: "DFL", label: "Lateral Izquierdo", shortLabel: "D (L)", compatiblePositions: ["D (L)", "WBL"] },
      { key: "MCR", label: "Centrocampista Derecho", shortLabel: "MC (C)", compatiblePositions: ["M (C)", "DM"] },
      { key: "MCL", label: "Centrocampista Izquierdo", shortLabel: "MC (C)", compatiblePositions: ["M (C)", "DM"] },
      { key: "AMR", label: "Extremo Derecho", shortLabel: "AM (R)", compatiblePositions: ["AM (R)", "M (R)"] },
      { key: "AMC", label: "Enganche", shortLabel: "AM (C)", compatiblePositions: ["AM (C)", "M (C)"] },
      { key: "AML", label: "Extremo Izquierdo", shortLabel: "AM (L)", compatiblePositions: ["AM (L)", "M (L)"] },
      { key: "STC", label: "Delantero Centro", shortLabel: "ST (C)", compatiblePositions: ["ST (C)"] }
    ]
  },
  {
    name: "4-3-3 Ofensivo",
    key: "433",
    positions: [
      { key: "GK", label: "Portero", shortLabel: "GK", compatiblePositions: ["GK"] },
      { key: "DFR", label: "Lateral Derecho", shortLabel: "D (R)", compatiblePositions: ["D (R)", "WBR"] },
      { key: "DFCR", label: "Defensa Central Derecho", shortLabel: "D (CR)", compatiblePositions: ["D (C)"] },
      { key: "DFCL", label: "Defensa Central Izquierdo", shortLabel: "D (CL)", compatiblePositions: ["D (C)"] },
      { key: "DFL", label: "Lateral Izquierdo", shortLabel: "D (L)", compatiblePositions: ["D (L)", "WBL"] },
      { key: "DM", label: "Mediocentro Defensivo", shortLabel: "DM (C)", compatiblePositions: ["DM", "M (C)"] },
      { key: "MCR", label: "Interior Derecho", shortLabel: "MC (C)", compatiblePositions: ["M (C)"] },
      { key: "MCL", label: "Interior Izquierdo", shortLabel: "MC (C)", compatiblePositions: ["M (C)"] },
      { key: "AMR", label: "Extremo Derecho", shortLabel: "AM (R)", compatiblePositions: ["AM (R)", "M (R)"] },
      { key: "AML", label: "Extremo Izquierdo", shortLabel: "AM (L)", compatiblePositions: ["AM (L)", "M (L)"] },
      { key: "STC", label: "Delantero Centro", shortLabel: "ST (C)", compatiblePositions: ["ST (C)"] }
    ]
  },
  {
    name: "4-3-3 Galatasaray",
    key: "433gala",
    positions: [
      { key: "GK", label: "Portero", shortLabel: "GK", compatiblePositions: ["GK"] },
      { key: "DFR", label: "Lateral Derecho", shortLabel: "D (R)", compatiblePositions: ["D (R)", "WBR"] },
      { key: "DFCR", label: "Defensa Central Derecho", shortLabel: "D (CR)", compatiblePositions: ["D (C)"] },
      { key: "DFCL", label: "Defensa Central Izquierdo", shortLabel: "D (CL)", compatiblePositions: ["D (C)"] },
      { key: "DFL", label: "Lateral Izquierdo", shortLabel: "D (L)", compatiblePositions: ["D (L)", "WBL"] },
      { key: "DM", label: "Pivote Defensivo", shortLabel: "DM (C)", compatiblePositions: ["DM", "M (C)"] },
      { key: "MCR", label: "Mediocentro Derecho", shortLabel: "MC (C)", compatiblePositions: ["M (C)", "DM"] },
      { key: "AMC", label: "Media Punta", shortLabel: "AM (C)", compatiblePositions: ["AM (C)", "M (C)"] },
      { key: "AMR", label: "Extremo Derecho", shortLabel: "AM (R)", compatiblePositions: ["AM (R)", "M (R)"] },
      { key: "AML", label: "Extremo Izquierdo", shortLabel: "AM (L)", compatiblePositions: ["AM (L)", "M (L)"] },
      { key: "STC", label: "Delantero Centro", shortLabel: "ST (C)", compatiblePositions: ["ST (C)"] }
    ]
  },
  {
    name: "4-1-2-1-2 Rombo Cerrado",
    key: "41212",
    positions: [
      { key: "GK", label: "Portero", shortLabel: "GK", compatiblePositions: ["GK"] },
      { key: "DFL", label: "Lateral Izquierdo", shortLabel: "D (L)", compatiblePositions: ["D (L)", "WBL"] },
      { key: "DFCL", label: "Defensa Central Izquierdo", shortLabel: "D (CL)", compatiblePositions: ["D (C)"] },
      { key: "DFCR", label: "Defensa Central Derecho", shortLabel: "D (CR)", compatiblePositions: ["D (C)"] },
      { key: "DFR", label: "Lateral Derecho", shortLabel: "D (R)", compatiblePositions: ["D (R)", "WBR"] },
      { key: "DM", label: "Mediocentro Defensivo", shortLabel: "DM (C)", compatiblePositions: ["DM", "M (C)"] },
      { key: "MCL", label: "Centrocampista Izquierdo", shortLabel: "MC (C)", compatiblePositions: ["M (C)", "DM"] },
      { key: "MCR", label: "Centrocampista Derecho", shortLabel: "MC (C)", compatiblePositions: ["M (C)", "DM"] },
      { key: "AMC", label: "Enganche", shortLabel: "AM (C)", compatiblePositions: ["AM (C)", "M (C)"] },
      { key: "STCL", label: "Delantero Izquierdo", shortLabel: "ST (C)", compatiblePositions: ["ST (C)"] },
      { key: "STCR", label: "Delantero Derecho", shortLabel: "ST (C)", compatiblePositions: ["ST (C)"] }
    ]
  },
  {
    name: "3-5-2 Clásico",
    key: "352",
    positions: [
      { key: "GK", label: "Portero", shortLabel: "GK", compatiblePositions: ["GK"] },
      { key: "DFCL", label: "Central Izquierdo", shortLabel: "D (CL)", compatiblePositions: ["D (C)"] },
      { key: "DFCC", label: "Líbero/Central", shortLabel: "D (C)", compatiblePositions: ["D (C)"] },
      { key: "DFCR", label: "Central Derecho", shortLabel: "D (CR)", compatiblePositions: ["D (C)"] },
      { key: "WBL", label: "Carrilero Izquierdo", shortLabel: "D (L)", compatiblePositions: ["D (L)", "WBL", "M (L)"] },
      { key: "MCL", label: "Centrocampista Izquierdo", shortLabel: "MC (C)", compatiblePositions: ["M (C)", "DM"] },
      { key: "MCC", label: "Mediocentro Creador", shortLabel: "MC (C)", compatiblePositions: ["M (C)", "AM (C)"] },
      { key: "MCR", label: "Centrocampista Derecho", shortLabel: "MC (C)", compatiblePositions: ["M (C)", "DM"] },
      { key: "WBR", label: "Carrilero Derecho", shortLabel: "D (R)", compatiblePositions: ["D (R)", "WBR", "M (R)"] },
      { key: "STCL", label: "Delantero Izquierdo", shortLabel: "ST (C)", compatiblePositions: ["ST (C)"] },
      { key: "STCR", label: "Delantero Derecho", shortLabel: "ST (C)", compatiblePositions: ["ST (C)"] }
    ]
  },
  {
    name: "4-4-2 Tradicional",
    key: "442",
    positions: [
      { key: "GK", label: "Portero", shortLabel: "GK", compatiblePositions: ["GK"] },
      { key: "DFR", label: "Lateral Derecho", shortLabel: "D (R)", compatiblePositions: ["D (R)", "WBR"] },
      { key: "DFCR", label: "Defensa Central Derecho", shortLabel: "D (CR)", compatiblePositions: ["D (C)"] },
      { key: "DFCL", label: "Defensa Central Izquierdo", shortLabel: "D (CL)", compatiblePositions: ["D (C)"] },
      { key: "DFL", label: "Lateral Izquierdo", shortLabel: "D (L)", compatiblePositions: ["D (L)", "WBL"] },
      { key: "MR", label: "Interior Derecho", shortLabel: "M (R)", compatiblePositions: ["M (R)", "AM (R)"] },
      { key: "MCR", label: "Pivote Derecho", shortLabel: "MC (C)", compatiblePositions: ["M (C)", "DM"] },
      { key: "MCL", label: "Pivote Izquierdo", shortLabel: "MC (C)", compatiblePositions: ["M (C)", "DM"] },
      { key: "ML", label: "Interior Izquierdo", shortLabel: "M (L)", compatiblePositions: ["M (L)", "AM (L)"] },
      { key: "STCL", label: "Segundo Delantero", shortLabel: "ST (C)", compatiblePositions: ["ST (C)", "AM (C)"] },
      { key: "STCR", label: "Hombre Objetivo", shortLabel: "ST (C)", compatiblePositions: ["ST (C)"] }
    ]
  }
];
