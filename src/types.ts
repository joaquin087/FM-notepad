export interface Player {
  id: string; // Football Manager ID or generated UUID
  name: string;
  age: number;
  position: string; // e.g., "GK", "D (C)", "D (L)", "D (R)", "DM", "M (C)", "AM (L)", "AM (R)", "AM (C)", "ST (C)"
  nationality: string;
  currentAbility: number; // 1 to 5 stars
  potentialAbility: number; // 1 to 5 stars
  marketValue: string; // e.g., "€12M"
  wage: string; // e.g., "€45K/semana"
  squadStatus: 'titular' | 'suplente' | 'juvenil' | 'recambio' | 'cedidos' | 'aceder' | 'venta' | 'desarrollo' | 'descartes' | 'no_asignado' | 'baja';
  assignedPosition?: string; // Column mapped on the tactical matrix grid (e.g. "GK", "DFCD", etc.)
  notes?: string;
  
  // New columns from Football Manager
  club?: string;
  saleValue?: string;
  bestRating?: string; // Star rating or percentage e.g. "87.9%"
  bestPotRating?: string; // Potential rating or percentage e.g. "93.2%"
  contractEnd?: string;
  dateOfBirth?: string;
  clubId?: string;
  intCaps?: number;
  intGoals?: number;

  // Bajas fields
  fechaBaja?: string; // Year only
  montoBaja?: string;
  clubBaja?: string;
  comentarioBaja?: string;
}

export interface Snapshot {
  id: string;
  name: string; // e.g., "Inicio de Temporada 2026/27", "Invierno 2027", etc.
  date: string; // YYYY-MM-DD format
  players: Player[]; // Full squad players state at this specific moment
}

export interface PitchPosition {
  key: string; // Unique key for the pitch slot, e.g., "GK", "DCL", "DCR", "DM", etc.
  label: string; // Friendly name, e.g., "Defensor Central Izquierdo"
  shortLabel: string; // e.g. "DFC I"
  compatiblePositions: string[]; // compatible position tags in FM, e.g., ["D (C)", "D (L)"]
}

export interface Formation {
  name: string;
  key: string;
  positions: PitchPosition[];
}

export interface SquadPlan {
  [positionKey: string]: {
    titular: Player | null;
    suplente: Player | null;
    juvenil: Player | null;
  };
}
