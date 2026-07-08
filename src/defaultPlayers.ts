import { Player, Formation } from "./types";

// Helper to generate a realistic large list of 110 players for a top/mid-tier club
const rawGks: Partial<Player>[] = [
  { id: "1001", name: "Marc-André Ter Steger", age: 31, position: "GK", nationality: "Alemania", currentAbility: 5, potentialAbility: 5, marketValue: "€35M", wage: "€150K/sem", squadStatus: "titular" },
  { id: "1002", name: "Iñaki López", age: 24, position: "GK", nationality: "España", currentAbility: 3, potentialAbility: 4, marketValue: "€12M", wage: "€40K/sem", squadStatus: "suplente" },
  { id: "1003", name: "Aron Gunnarsson", age: 19, position: "GK", nationality: "Islandia", currentAbility: 2, potentialAbility: 5, marketValue: "€4M", wage: "€8K/sem", squadStatus: "juvenil" },
  { id: "1004", name: "Diego Alvez", age: 36, position: "GK", nationality: "Brasil", currentAbility: 2, potentialAbility: 2, marketValue: "€300K", wage: "€35K/sem", squadStatus: "vender" },
  { id: "1005", name: "Mateo Rossi", age: 21, position: "GK", nationality: "Italia", currentAbility: 2, potentialAbility: 3, marketValue: "€1.5M", wage: "€12K/sem", squadStatus: "cedido" },
  { id: "1006", name: "Tobias Lindqvist", age: 18, position: "GK", nationality: "Suecia", currentAbility: 1, potentialAbility: 4, marketValue: "€800K", wage: "€2K/sem", squadStatus: "no_asignado" },
  { id: "1007", name: "Ezequiel Centurión", age: 26, position: "GK", nationality: "Argentina", currentAbility: 2, potentialAbility: 3, marketValue: "€1M", wage: "€15K/sem", squadStatus: "no_asignado" },
  { id: "1008", name: "Alex Werner", age: 28, position: "GK", nationality: "Argentina", currentAbility: 2, potentialAbility: 2, marketValue: "€600K", wage: "€18K/sem", squadStatus: "no_asignado" }
];

const rawDefs: Partial<Player>[] = [
  // Central Defenders (D C)
  { id: "2001", name: "Ronaldo Araújo", age: 25, position: "D (C)", nationality: "Uruguay", currentAbility: 5, potentialAbility: 5, marketValue: "€75M", wage: "€180K/sem", squadStatus: "titular" },
  { id: "2002", name: "Pau Cubarsí", age: 17, position: "D (C)", nationality: "España", currentAbility: 3, potentialAbility: 5, marketValue: "€30M", wage: "€20K/sem", squadStatus: "juvenil" },
  { id: "2003", name: "Andreas Christensen", age: 27, position: "D (C)", nationality: "Dinamarca", currentAbility: 4, potentialAbility: 4, marketValue: "€40M", wage: "€120K/sem", squadStatus: "suplente" },
  { id: "2004", name: "Eric García", age: 23, position: "D (C)", nationality: "España", currentAbility: 3, potentialAbility: 4, marketValue: "€15M", wage: "€60K/sem", squadStatus: "no_asignado" },
  { id: "2005", name: "Íñigo Martínez", age: 32, position: "D (C)", nationality: "España", currentAbility: 3, potentialAbility: 3, marketValue: "€8M", wage: "€95K/sem", squadStatus: "vender" },
  { id: "2006", name: "Chadi Riad", age: 20, position: "D (C)", nationality: "Marruecos", currentAbility: 2, potentialAbility: 4, marketValue: "€6M", wage: "€15K/sem", squadStatus: "cedido" },
  { id: "2007", name: "Mikayil Faye", age: 19, position: "D (C)", nationality: "Senegal", currentAbility: 2, potentialAbility: 5, marketValue: "€5M", wage: "€10K/sem", squadStatus: "cedido" },
  { id: "2008", name: "Sergi Domínguez", age: 18, position: "D (C)", nationality: "España", currentAbility: 1, potentialAbility: 4, marketValue: "€1M", wage: "€3K/sem", squadStatus: "no_asignado" },
  { id: "2009", name: "Alexis Duarte", age: 24, position: "D (C)", nationality: "Paraguay", currentAbility: 2, potentialAbility: 3, marketValue: "€3M", wage: "€20K/sem", squadStatus: "no_asignado" },
  { id: "2010", name: "Gastón Ávila", age: 22, position: "D (C)", nationality: "Argentina", currentAbility: 2, potentialAbility: 3, marketValue: "€2.5M", wage: "€15K/sem", squadStatus: "no_asignado" },
  { id: "2011", name: "Robert Renan", age: 20, position: "D (C)", nationality: "Brasil", currentAbility: 2, potentialAbility: 4, marketValue: "€7M", wage: "€25K/sem", squadStatus: "cedido" },
  { id: "2012", name: "Emilio Lara", age: 22, position: "D (C)", nationality: "México", currentAbility: 2, potentialAbility: 3, marketValue: "€1.8M", wage: "€12K/sem", squadStatus: "no_asignado" },
  
  // Left Backs (D L)
  { id: "2101", name: "Alejandro Balde", age: 20, position: "D (L)", nationality: "España", currentAbility: 4, potentialAbility: 5, marketValue: "€50M", wage: "€80K/sem", squadStatus: "titular" },
  { id: "2102", name: "Álex Valle", age: 20, position: "D (L)", nationality: "España", currentAbility: 2, potentialAbility: 4, marketValue: "€4M", wage: "€10K/sem", squadStatus: "cedido" },
  { id: "2103", name: "Marcos Alonso", age: 33, position: "D (L)", nationality: "España", currentAbility: 2, potentialAbility: 2, marketValue: "€2M", wage: "€70K/sem", squadStatus: "vender" },
  { id: "2104", name: "Gerard Martín", age: 22, position: "D (L)", nationality: "España", currentAbility: 2, potentialAbility: 3, marketValue: "€1.5M", wage: "€8K/sem", squadStatus: "suplente" },
  { id: "2105", name: "Albert Navarro", age: 17, position: "D (L)", nationality: "España", currentAbility: 1, potentialAbility: 4, marketValue: "€600K", wage: "€1K/sem", squadStatus: "juvenil" },
  { id: "2106", name: "Lucas Piton", age: 23, position: "D (L)", nationality: "Brasil", currentAbility: 2, potentialAbility: 3, marketValue: "€4M", wage: "€15K/sem", squadStatus: "no_asignado" },
  { id: "2107", name: "Enzo Díaz", age: 28, position: "D (L)", nationality: "Argentina", currentAbility: 2, potentialAbility: 2, marketValue: "€3M", wage: "€20K/sem", squadStatus: "no_asignado" },
  
  // Right Backs (D R)
  { id: "2201", name: "Jules Koundé", age: 25, position: "D (R)", nationality: "Francia", currentAbility: 4, potentialAbility: 5, marketValue: "€60M", wage: "€150K/sem", squadStatus: "titular" },
  { id: "2202", name: "Héctor Fort", age: 17, position: "D (R)", nationality: "España", currentAbility: 2, potentialAbility: 5, marketValue: "€8M", wage: "€8K/sem", squadStatus: "juvenil" },
  { id: "2203", name: "Julian Araujo", age: 22, position: "D (R)", nationality: "México", currentAbility: 2, potentialAbility: 4, marketValue: "€7M", wage: "€30K/sem", squadStatus: "cedido" },
  { id: "2204", name: "Sergiño Dest", age: 23, position: "D (R)", nationality: "EEUU", currentAbility: 3, potentialAbility: 4, marketValue: "€18M", wage: "€80K/sem", squadStatus: "suplente" },
  { id: "2205", name: "Iván Fresneda", age: 19, position: "D (R)", nationality: "España", currentAbility: 2, potentialAbility: 4, marketValue: "€9M", wage: "€25K/sem", squadStatus: "cedido" },
  { id: "2206", name: "Andrés Herrera", age: 25, position: "D (R)", nationality: "Argentina", currentAbility: 2, potentialAbility: 2, marketValue: "€2M", wage: "€15K/sem", squadStatus: "vender" }
];

const rawMids: Partial<Player>[] = [
  // Defensive Midfielders (DM)
  { id: "3001", name: "Oriol Romeu", age: 32, position: "DM", nationality: "España", currentAbility: 3, potentialAbility: 3, marketValue: "€5M", wage: "€75K/sem", squadStatus: "vender" },
  { id: "3002", name: "Marc Casadó", age: 20, position: "DM", nationality: "España", currentAbility: 2, potentialAbility: 4, marketValue: "€4M", wage: "€12K/sem", squadStatus: "suplente" },
  { id: "3003", name: "Marc Bernal", age: 16, position: "DM", nationality: "España", currentAbility: 2, potentialAbility: 5, marketValue: "€2M", wage: "€4K/sem", squadStatus: "juvenil" },
  { id: "3004", name: "Pau Prim", age: 18, position: "DM", nationality: "España", currentAbility: 1, potentialAbility: 4, marketValue: "€800K", wage: "€2K/sem", squadStatus: "no_asignado" },
  { id: "3005", name: "Matías Kranevitter", age: 30, position: "DM", nationality: "Argentina", currentAbility: 2, potentialAbility: 2, marketValue: "€1.8M", wage: "€25K/sem", squadStatus: "no_asignado" },
  { id: "3006", name: "Nicolás Fonseca", age: 25, position: "DM", nationality: "Uruguay", currentAbility: 2, potentialAbility: 3, marketValue: "€2M", wage: "€14K/sem", squadStatus: "no_asignado" },
  
  // Central Midfielders (M C)
  { id: "3101", name: "Frenkie de Jong", age: 26, position: "M (C)", nationality: "Países Bajos", currentAbility: 5, potentialAbility: 5, marketValue: "€80M", wage: "€250K/sem", squadStatus: "titular" },
  { id: "3102", name: "Pedri González", age: 21, position: "M (C)", nationality: "España", currentAbility: 5, potentialAbility: 5, marketValue: "€90M", wage: "€120K/sem", squadStatus: "titular" },
  { id: "3103", name: "Gavi (Pablo Páez)", age: 19, position: "M (C)", nationality: "España", currentAbility: 4, potentialAbility: 5, marketValue: "€90M", wage: "€90K/sem", squadStatus: "suplente" },
  { id: "3104", name: "Ilkay Gündogan", age: 33, position: "M (C)", nationality: "Alemania", currentAbility: 4, potentialAbility: 4, marketValue: "€15M", wage: "€160K/sem", squadStatus: "suplente" },
  { id: "3105", name: "Pablo Torre", age: 21, position: "M (C)", nationality: "España", currentAbility: 2, potentialAbility: 4, marketValue: "€6M", wage: "€25K/sem", squadStatus: "cedido" },
  { id: "3106", name: "Unai Hernández", age: 19, position: "M (C)", nationality: "España", currentAbility: 1, potentialAbility: 4, marketValue: "€1M", wage: "€4K/sem", squadStatus: "no_asignado" },
  { id: "3107", name: "Rodrigo Aliendro", age: 33, position: "M (C)", nationality: "Argentina", currentAbility: 2, potentialAbility: 2, marketValue: "€1.2M", wage: "€20K/sem", squadStatus: "no_asignado" },
  { id: "3108", name: "Agustín Palavecino", age: 27, position: "M (C)", nationality: "Argentina", currentAbility: 2, potentialAbility: 3, marketValue: "€2.5M", wage: "€18K/sem", squadStatus: "no_asignado" },
  { id: "3109", name: "Felipe Peña Biafore", age: 23, position: "M (C)", nationality: "Argentina", currentAbility: 2, potentialAbility: 4, marketValue: "€2M", wage: "€12K/sem", squadStatus: "cedido" },
  { id: "3110", name: "Santiago Simón", age: 21, position: "M (C)", nationality: "Argentina", currentAbility: 2, potentialAbility: 3, marketValue: "€3.5M", wage: "€15K/sem", squadStatus: "no_asignado" },

  // Attacking Midfielders Center (AM C)
  { id: "3201", name: "Fermín López", age: 20, position: "AM (C)", nationality: "España", currentAbility: 3, potentialAbility: 5, marketValue: "€25M", wage: "€40K/sem", squadStatus: "suplente" },
  { id: "3202", name: "Noah Darvich", age: 17, position: "AM (C)", nationality: "Alemania", currentAbility: 1, potentialAbility: 5, marketValue: "€3M", wage: "€3K/sem", squadStatus: "juvenil" },
  { id: "3203", name: "Claudio Echeverri", age: 18, position: "AM (C)", nationality: "Argentina", currentAbility: 2, potentialAbility: 5, marketValue: "€15M", wage: "€20K/sem", squadStatus: "cedido" },
  { id: "3204", name: "Manuel Lanzini", age: 31, position: "AM (C)", nationality: "Argentina", currentAbility: 2, potentialAbility: 2, marketValue: "€2.5M", wage: "€45K/sem", squadStatus: "vender" },
  { id: "3205", name: "Franco Mastantuono", age: 16, position: "AM (C)", nationality: "Argentina", currentAbility: 2, potentialAbility: 5, marketValue: "€20M", wage: "€8K/sem", squadStatus: "no_asignado" }
];

const rawAtts: Partial<Player>[] = [
  // Attacking Midfielders Left (AM L)
  { id: "4001", name: "Ferran Torres", age: 24, position: "AM (L)", nationality: "España", currentAbility: 3, potentialAbility: 4, marketValue: "€35M", wage: "€100K/sem", squadStatus: "suplente" },
  { id: "4002", name: "Ansu Fati", age: 21, position: "AM (L)", nationality: "España", currentAbility: 3, potentialAbility: 4, marketValue: "€25M", wage: "€120K/sem", squadStatus: "vender" },
  { id: "4003", name: "Dani Rodríguez", age: 18, position: "AM (L)", nationality: "España", currentAbility: 1, potentialAbility: 4, marketValue: "€1.2M", wage: "€3K/sem", squadStatus: "juvenil" },
  { id: "4004", name: "Ignacio Fernández", age: 34, position: "AM (L)", nationality: "Argentina", currentAbility: 2, potentialAbility: 2, marketValue: "€1M", wage: "€30K/sem", squadStatus: "no_asignado" },
  { id: "4005", name: "Esequiel Barco", age: 25, position: "AM (L)", nationality: "Argentina", currentAbility: 3, potentialAbility: 4, marketValue: "€12M", wage: "€40K/sem", squadStatus: "no_asignado" },
  { id: "4006", name: "Ian Subiabre", age: 17, position: "AM (L)", nationality: "Argentina", currentAbility: 1, potentialAbility: 5, marketValue: "€2M", wage: "€2K/sem", squadStatus: "cedido" },

  // Attacking Midfielders Right (AM R)
  { id: "4101", name: "Lamine Yamal", age: 16, position: "AM (R)", nationality: "España", currentAbility: 4, potentialAbility: 5, marketValue: "€120M", wage: "€30K/sem", squadStatus: "titular" },
  { id: "4102", name: "Raphinha Dias", age: 27, position: "AM (R)", nationality: "Brasil", currentAbility: 4, potentialAbility: 4, marketValue: "€50M", wage: "€130K/sem", squadStatus: "titular" },
  { id: "4103", name: "Sergi Roberto", age: 32, position: "AM (R)", nationality: "España", currentAbility: 3, potentialAbility: 3, marketValue: "€4M", wage: "€80K/sem", squadStatus: "vender" },
  { id: "4104", name: "Pablo Solari", age: 23, position: "AM (R)", nationality: "Argentina", currentAbility: 2, potentialAbility: 3, marketValue: "€6M", wage: "€20K/sem", squadStatus: "no_asignado" },
  { id: "4105", name: "Juan Cruz de los Santos", age: 20, position: "AM (R)", nationality: "Uruguay", currentAbility: 1, potentialAbility: 4, marketValue: "€1.5M", wage: "€6K/sem", squadStatus: "cedido" },

  // Strikers (ST C)
  { id: "4201", name: "Robert Lewandowski", age: 35, position: "ST (C)", nationality: "Polonia", currentAbility: 5, potentialAbility: 5, marketValue: "€20M", wage: "€280K/sem", squadStatus: "titular" },
  { id: "4202", name: "Vitor Roque", age: 19, position: "ST (C)", nationality: "Brasil", currentAbility: 3, potentialAbility: 5, marketValue: "€40M", wage: "€45K/sem", squadStatus: "suplente" },
  { id: "4203", name: "Marc Guiu", age: 18, position: "ST (C)", nationality: "España", currentAbility: 2, potentialAbility: 4, marketValue: "€5M", wage: "€10K/sem", squadStatus: "juvenil" },
  { id: "4204", name: "Miguel Borja", age: 31, position: "ST (C)", nationality: "Colombia", currentAbility: 3, potentialAbility: 3, marketValue: "€4M", wage: "€35K/sem", squadStatus: "no_asignado" },
  { id: "4205", name: "Facundo Colidio", age: 24, position: "ST (C)", nationality: "Argentina", currentAbility: 2, potentialAbility: 3, marketValue: "€5M", wage: "€22K/sem", squadStatus: "no_asignado" },
  { id: "4206", name: "Agustín Ruberto", age: 18, position: "ST (C)", nationality: "Argentina", currentAbility: 1, potentialAbility: 5, marketValue: "€3M", wage: "€3K/sem", squadStatus: "cedido" }
];

// Combine and generate additional generic players to reach ~110 players (for complete coverage simulation)
const combinedList: Player[] = [];

// Helper function to fill missing details and build a perfect list
const addPlayers = (list: Partial<Player>[]) => {
  for (const p of list) {
    combinedList.push({
      id: p.id || Math.random().toString(),
      name: p.name || "Jugador Desconocido",
      age: p.age || 22,
      position: p.position || "M (C)",
      nationality: p.nationality || "España",
      currentAbility: p.currentAbility || 2,
      potentialAbility: p.potentialAbility || 3,
      marketValue: p.marketValue || "€1.5M",
      wage: p.wage || "€10K/sem",
      squadStatus: p.squadStatus || "no_asignado",
      notes: ""
    });
  }
};

addPlayers(rawGks);
addPlayers(rawDefs);
addPlayers(rawMids);
addPlayers(rawAtts);

// Let's programmatically add another 50 realistic prospects and backup players to simulate a giant 110-player list!
const nationalities = ["Argentina", "España", "Brasil", "Uruguay", "Francia", "Italia", "Portugal", "Colombia", "Bélgica", "México", "Chile"];
const positions = ["GK", "D (C)", "D (L)", "D (R)", "DM", "M (C)", "AM (L)", "AM (R)", "AM (C)", "ST (C)"];
const surnames = ["González", "Rodríguez", "Fernández", "Díaz", "Pérez", "Gómez", "Silva", "Martínez", "Sánchez", "Romero", "Álvarez", "Cardoso", "Vázquez", "Torres"];
const firstnames = ["Mateo", "Thiago", "Lucas", "Santiago", "Sebastián", "Enzo", "Felipe", "Bautista", "Joaquín", "Nicolás", "Julián", "Tomás", "Benjamín", "Agustín"];

let startingId = 5000;
while (combinedList.length < 112) {
  const nat = nationalities[Math.floor(Math.random() * nationalities.length)];
  const pos = positions[Math.floor(Math.random() * positions.length)];
  const name = `${firstnames[Math.floor(Math.random() * firstnames.length)]} ${surnames[Math.floor(Math.random() * surnames.length)]}`;
  const age = Math.floor(Math.random() * 15) + 16; // 16 to 30
  const ca = Math.floor(Math.random() * 3) + 1; // 1 to 3 stars
  const pa = Math.min(ca + Math.floor(Math.random() * 3), 5); // up to 5 stars
  const isProspect = age <= 19 && pa >= 4;
  
  const valueNum = (ca * 1.5 + pa * 2.5 + (25 - age) * 0.3).toFixed(1);
  const marketValue = parseFloat(valueNum) > 0 ? `€${valueNum}M` : `€350K`;
  const wage = `€${Math.floor(ca * 8 + (30 - age) * 0.5)}K/sem`;

  combinedList.push({
    id: String(startingId++),
    name,
    age,
    position: pos,
    nationality: nat,
    currentAbility: ca,
    potentialAbility: pa,
    marketValue,
    wage,
    squadStatus: isProspect ? "cedido" : "no_asignado",
    notes: isProspect ? "Gran proyección de la cantera" : ""
  });
}

export const defaultPlayers: Player[] = combinedList;

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
