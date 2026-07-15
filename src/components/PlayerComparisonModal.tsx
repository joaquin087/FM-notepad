import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, BarChart2, Shield, Zap, Sparkles, Award } from 'lucide-react';
import { Player } from '../types';

interface PlayerComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
}

const PLAYER_COLORS = [
  { name: 'blue', text: 'text-sky-400', bg: 'bg-sky-500', bgLight: 'bg-sky-500/10', border: 'border-sky-500/30' },
  { name: 'orange', text: 'text-amber-500', bg: 'bg-amber-500', bgLight: 'bg-amber-500/10', border: 'border-amber-500/30' },
  { name: 'green', text: 'text-emerald-400', bg: 'bg-emerald-400', bgLight: 'bg-emerald-400/10', border: 'border-emerald-400/30' },
  { name: 'red', text: 'text-rose-400', bg: 'bg-rose-400', bgLight: 'bg-rose-400/10', border: 'border-rose-400/30' },
  { name: 'purple', text: 'text-purple-400', bg: 'bg-purple-500', bgLight: 'bg-purple-500/10', border: 'border-purple-500/30' },
  { name: 'teal', text: 'text-teal-400', bg: 'bg-teal-500', bgLight: 'bg-teal-500/10', border: 'border-teal-500/30' },
  { name: 'pink', text: 'text-pink-400', bg: 'bg-pink-500', bgLight: 'bg-pink-500/10', border: 'border-pink-500/30' },
  { name: 'indigo', text: 'text-indigo-400', bg: 'bg-indigo-500', bgLight: 'bg-indigo-500/10', border: 'border-indigo-500/30' }
];

export interface ComparisonRole {
  name: string;
  code: string;
  phase: 'In Possession' | 'Out Of Possession';
  key: string[];
  preferred: string[];
}

export interface ComparisonPosition {
  name: string;
  code: string;
  roles: ComparisonRole[];
}

// Complete, high-fidelity database of positions and roles mapped to standard Spanish and FM logic
const POSITIONS_DATA: ComparisonPosition[] = [
  {
    name: 'Arquero (GK)',
    code: 'GK',
    roles: [
      {
        name: 'Portero General (Con Pelota)',
        code: 'GK-IP',
        phase: 'In Possession',
        key: ['handling', 'reflexes', 'kicking', 'throwing', 'commandOfArea'],
        preferred: ['aerialReach', 'communication', 'decisions', 'composure', 'concentration', 'positioning', 'agility']
      },
      {
        name: 'Portero de Juego de Pies (BGK)',
        code: 'BGK-IP',
        phase: 'In Possession',
        key: ['passing', 'firstTouch', 'composure', 'decisions', 'vision', 'kicking'],
        preferred: ['technique', 'handling', 'reflexes', 'throwing', 'teamwork', 'agility']
      },
      {
        name: 'Portero No-Nonsense (NGK)',
        code: 'NGK-IP',
        phase: 'In Possession',
        key: ['kicking', 'reflexes', 'aerialReach'],
        preferred: ['handling', 'bravery', 'strength', 'positioning']
      },
      {
        name: 'Portero General (Sin Pelota)',
        code: 'GK-OP',
        phase: 'Out Of Possession',
        key: ['reflexes', 'handling', 'oneOnOnes', 'aerialReach', 'commandOfArea'],
        preferred: ['positioning', 'composure', 'concentration', 'decisions', 'agility']
      },
      {
        name: 'Portero Cierre Línea (LHK)',
        code: 'LHK-OP',
        phase: 'Out Of Possession',
        key: ['reflexes', 'handling', 'aerialReach', 'positioning', 'bravery', 'concentration'],
        preferred: ['commandOfArea', 'oneOnOnes', 'decisions', 'agility']
      },
      {
        name: 'Portero de Cierre (Sweeper Keeper)',
        code: 'SK-OP',
        phase: 'Out Of Possession',
        key: ['reflexes', 'oneOnOnes', 'rushingOut', 'anticipation', 'decisions', 'acceleration', 'agility'],
        preferred: ['handling', 'aerialReach', 'commandOfArea', 'composure', 'positioning', 'passing']
      }
    ]
  },
  {
    name: 'Defensa Central (DC)',
    code: 'DC',
    roles: [
      {
        name: 'Defensa Central (Con Pelota)',
        code: 'CB-IP',
        phase: 'In Possession',
        key: ['passing', 'firstTouch', 'composure'],
        preferred: ['heading', 'technique', 'decisions']
      },
      {
        name: 'Líbero / Juego Corto (BCB)',
        code: 'BCB-IP',
        phase: 'In Possession',
        key: ['passing', 'technique', 'firstTouch', 'vision', 'composure', 'decisions'],
        preferred: ['dribbling', 'anticipation']
      },
      {
        name: 'Central No-Nonsense (NCB)',
        code: 'NCB-IP',
        phase: 'In Possession',
        key: ['passing'],
        preferred: ['heading']
      },
      {
        name: 'Central Abierto (WCB)',
        code: 'WCB-IP',
        phase: 'In Possession',
        key: ['passing', 'crossing', 'stamina', 'pace'],
        preferred: ['dribbling', 'technique', 'composure', 'firstTouch']
      },
      {
        name: 'Central Adelantado (ACB)',
        code: 'ACB-IP',
        phase: 'In Possession',
        key: ['passing', 'firstTouch', 'dribbling', 'technique', 'vision', 'composure', 'decisions'],
        preferred: ['anticipation', 'pace']
      },
      {
        name: 'Central Desdoblador (OCB)',
        code: 'OCB-IP',
        phase: 'In Possession',
        key: ['crossing', 'dribbling', 'passing', 'firstTouch', 'stamina', 'pace'],
        preferred: ['technique', 'vision', 'composure', 'offTheBall']
      },
      {
        name: 'Defensa Central (Sin Pelota)',
        code: 'CB-OP',
        phase: 'Out Of Possession',
        key: ['tackling', 'marking', 'heading', 'positioning', 'jumpingReach', 'strength'],
        preferred: ['anticipation', 'decisions', 'concentration', 'bravery', 'composure', 'pace']
      },
      {
        name: 'Central de Cobertura (CCB)',
        code: 'CCB-OP',
        phase: 'Out Of Possession',
        key: ['positioning', 'anticipation', 'pace', 'acceleration'],
        preferred: ['tackling', 'marking', 'decisions', 'concentration']
      },
      {
        name: 'Central de Choque (SCB)',
        code: 'SCB-OP',
        phase: 'Out Of Possession',
        key: ['tackling', 'heading', 'strength', 'aggression', 'bravery'],
        preferred: ['marking', 'positioning', 'jumpingReach']
      },
      {
        name: 'Central Abierto Lateral (WCB-OP)',
        code: 'WCB-OP',
        phase: 'Out Of Possession',
        key: ['tackling', 'marking', 'positioning', 'pace', 'stamina'],
        preferred: ['heading', 'anticipation', 'agility']
      },
      {
        name: 'Cobertura Central Abierta (CWCB)',
        code: 'CWCB-OP',
        phase: 'Out Of Possession',
        key: ['positioning', 'anticipation', 'pace', 'acceleration', 'stamina'],
        preferred: ['tackling', 'marking', 'decisions']
      },
      {
        name: 'Choque Central Abierto (SWCB)',
        code: 'SWCB-OP',
        phase: 'Out Of Possession',
        key: ['tackling', 'marking', 'strength', 'bravery', 'aggression', 'pace'],
        preferred: ['heading', 'positioning', 'jumpingReach']
      }
    ]
  },
  {
    name: 'Laterales / Carrileros (DL/R)',
    code: 'DL_DR',
    roles: [
      {
        name: 'Carrilero de Ataque (WB)',
        code: 'WB-IP',
        phase: 'In Possession',
        key: ['crossing', 'dribbling', 'passing', 'pace', 'stamina'],
        preferred: ['firstTouch', 'technique', 'composure', 'offTheBall']
      },
      {
        name: 'Lateral Invertido (IWB)',
        code: 'IWB-IP',
        phase: 'In Possession',
        key: ['passing', 'firstTouch', 'composure', 'decisions', 'positioning'],
        preferred: ['technique', 'vision', 'teamwork', 'tackling']
      },
      {
        name: 'Defensa Lateral (FB)',
        code: 'FB-OP',
        phase: 'Out Of Possession',
        key: ['tackling', 'marking', 'positioning', 'pace', 'stamina'],
        preferred: ['anticipation', 'concentration', 'strength', 'bravery']
      }
    ]
  },
  {
    name: 'Pivote Defensivo (DM)',
    code: 'DM',
    roles: [
      {
        name: 'Pivote Organizador (DLP)',
        code: 'DLP-IP',
        phase: 'In Possession',
        key: ['passing', 'technique', 'vision', 'composure', 'firstTouch'],
        preferred: ['decisions', 'positioning', 'teamwork']
      },
      {
        name: 'Medio Cierre (HB)',
        code: 'HB-IP',
        phase: 'In Possession',
        key: ['passing', 'firstTouch', 'positioning'],
        preferred: ['tackling', 'marking', 'decisions']
      },
      {
        name: 'Pivote Defensivo (DM)',
        code: 'DM-OP',
        phase: 'Out Of Possession',
        key: ['tackling', 'positioning', 'stamina', 'marking', 'anticipation'],
        preferred: ['strength', 'bravery', 'concentration', 'decisions']
      },
      {
        name: 'Centrocampista Recuperador (BWM)',
        code: 'BWM-OP',
        phase: 'Out Of Possession',
        key: ['tackling', 'stamina', 'aggression', 'workRate', 'positioning'],
        preferred: ['marking', 'bravery', 'strength', 'teamwork']
      }
    ]
  },
  {
    name: 'Mediocentro (MC)',
    code: 'MC',
    roles: [
      {
        name: 'Organizador Adelantado (AP)',
        code: 'AP-IP',
        phase: 'In Possession',
        key: ['passing', 'vision', 'technique', 'firstTouch', 'decisions'],
        preferred: ['dribbling', 'composure', 'flair', 'offTheBall']
      },
      {
        name: 'Mezzala (MZ)',
        code: 'MZ-IP',
        phase: 'In Possession',
        key: ['passing', 'dribbling', 'technique', 'offTheBall', 'stamina'],
        preferred: ['finishing', 'vision', 'composure', 'acceleration']
      },
      {
        name: 'Mediocentro Todoterreno (B2B)',
        code: 'B2B-OP',
        phase: 'Out Of Possession',
        key: ['stamina', 'workRate', 'tackling', 'positioning'],
        preferred: ['firstTouch', 'marking', 'composure', 'strength', 'pace']
      }
    ]
  },
  {
    name: 'Interiores / Extremos (ML/R)',
    code: 'ML_MR',
    roles: [
      {
        name: 'Extremo Puro (W)',
        code: 'W-IP',
        phase: 'In Possession',
        key: ['dribbling', 'crossing', 'pace', 'acceleration', 'agility'],
        preferred: ['firstTouch', 'technique', 'passing', 'offTheBall']
      },
      {
        name: 'Delantero Interior (IF)',
        code: 'IF-IP',
        phase: 'In Possession',
        key: ['dribbling', 'finishing', 'pace', 'acceleration', 'offTheBall'],
        preferred: ['firstTouch', 'technique', 'composure', 'agility']
      },
      {
        name: 'Extremo Defensivo (DW)',
        code: 'DW-OP',
        phase: 'Out Of Possession',
        key: ['tackling', 'positioning', 'workRate', 'stamina', 'pace'],
        preferred: ['marking', 'anticipation', 'crossing']
      }
    ]
  },
  {
    name: 'Mediapunta (AMC)',
    code: 'AMC',
    roles: [
      {
        name: 'Enganche Creativo (AM)',
        code: 'AM-IP',
        phase: 'In Possession',
        key: ['passing', 'vision', 'technique', 'firstTouch', 'flair'],
        preferred: ['dribbling', 'decisions', 'composure', 'offTheBall']
      },
      {
        name: 'Delantero Sorpresa (SS)',
        code: 'SS-IP',
        phase: 'In Possession',
        key: ['finishing', 'composure', 'offTheBall', 'acceleration', 'anticipation'],
        preferred: ['firstTouch', 'technique', 'dribbling', 'passing']
      },
      {
        name: 'Mediapunta Presionante (AM-P)',
        code: 'AMP-OP',
        phase: 'Out Of Possession',
        key: ['workRate', 'stamina', 'tackling', 'positioning'],
        preferred: ['anticipation', 'acceleration', 'agility']
      }
    ]
  },
  {
    name: 'Delantero (ST)',
    code: 'ST',
    roles: [
      {
        name: 'Delantero Avanzado (AF)',
        code: 'AF-IP',
        phase: 'In Possession',
        key: ['finishing', 'composure', 'offTheBall', 'pace', 'acceleration'],
        preferred: ['firstTouch', 'technique', 'dribbling', 'anticipation', 'agility']
      },
      {
        name: 'Segundo Delantero (DLF)',
        code: 'DLF-IP',
        phase: 'In Possession',
        key: ['passing', 'firstTouch', 'technique', 'vision', 'composure', 'decisions'],
        preferred: ['dribbling', 'finishing', 'offTheBall', 'strength']
      },
      {
        name: 'Delantero Presionante (PF)',
        code: 'PF-OP',
        phase: 'Out Of Possession',
        key: ['workRate', 'stamina', 'acceleration', 'aggression'],
        preferred: ['tackling', 'anticipation', 'strength']
      }
    ]
  }
];

const GK_ATTRIBUTES = [
  { key: 'reflexes', label: 'Reflejos' },
  { key: 'handling', label: 'Blocaje' },
  { key: 'oneOnOnes', label: 'Unos contra Unos' },
  { key: 'aerialReach', label: 'Alcance Aéreo' },
  { key: 'commandOfArea', label: 'Mando en Área' },
  { key: 'rushingOut', label: 'Salidas (Tend.)' },
  { key: 'kicking', label: 'Saques Puerta' },
  { key: 'throwing', label: 'Saques Mano' },
  { key: 'communication', label: 'Comunicación' },
  { key: 'anticipation', label: 'Anticipación' },
  { key: 'decisions', label: 'Decisiones' },
  { key: 'positioning', label: 'Colocación' },
  { key: 'composure', label: 'Serenidad' },
  { key: 'concentration', label: 'Concentración' },
  { key: 'agility', label: 'Agilidad' },
  { key: 'acceleration', label: 'Aceleración' },
  { key: 'passing', label: 'Pases' },
  { key: 'firstTouch', label: 'Primer Toque' }
];

const OUTFIELD_ATTRIBUTES = [
  { key: 'acceleration', label: 'Aceleración' },
  { key: 'pace', label: 'Velocidad' },
  { key: 'stamina', label: 'Resistencia' },
  { key: 'strength', label: 'Fuerza' },
  { key: 'agility', label: 'Agilidad' },
  { key: 'balance', label: 'Equilibrio' },
  { key: 'jumpingReach', label: 'Alcance de Salto' },
  { key: 'anticipation', label: 'Anticipación' },
  { key: 'decisions', label: 'Decisiones' },
  { key: 'positioning', label: 'Colocación' },
  { key: 'vision', label: 'Visión' },
  { key: 'passing', label: 'Pases' },
  { key: 'technique', label: 'Técnica' },
  { key: 'dribbling', label: 'Regate' },
  { key: 'firstTouch', label: 'Primer Toque' },
  { key: 'finishing', label: 'Remate' },
  { key: 'longShots', label: 'Tiros Lejanos' },
  { key: 'heading', label: 'Cabeza' },
  { key: 'marking', label: 'Marcaje' },
  { key: 'tackling', label: 'Entradas' },
  { key: 'workRate', label: 'Trabajo / Sacrificio' },
  { key: 'composure', label: 'Serenidad' },
  { key: 'concentration', label: 'Concentración' }
];

// Stable attribute value helper (derived from id if missing)
const getPlayerAttributeValue = (p: Player, attrKey: string): number => {
  if (p.attributes && p.attributes[attrKey] !== undefined) {
    return p.attributes[attrKey];
  }
  let hash = 0;
  const str = (p.id || p.name) + attrKey;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const stars = p.currentAbility || 3.0;
  const base = Math.floor((stars / 5) * 11) + 6;
  const offset = (Math.abs(hash) % 5) - 2;
  return Math.max(1, Math.min(20, base + offset));
};

// Standard overall average score (fallback)
const getPlayerScore = (p: Player): number => {
  if (p.attributes) {
    const keys = Object.keys(p.attributes);
    if (keys.length > 0) {
      const sum = keys.reduce((acc, k) => acc + (p.attributes?.[k] || 0), 0);
      const avg = sum / keys.length;
      return parseFloat(avg.toFixed(1));
    }
  }
  if (p.bestRating) {
    const pct = parseFloat(p.bestRating.replace(/%/g, ''));
    if (!isNaN(pct)) {
      return parseFloat(((pct / 100) * 20).toFixed(1));
    }
  }
  const stars = p.currentAbility || 3.0;
  return parseFloat(((stars / 5) * 15 + 4 + (parseFloat(p.id) % 2)).toFixed(1));
};

// Calculate dynamic role suitability rating out of 20
const calculateRoleScore = (p: Player, role: ComparisonRole): number => {
  let totalWeight = 0;
  let weightedSum = 0;

  role.key.forEach(attrKey => {
    const val = getPlayerAttributeValue(p, attrKey);
    weightedSum += val * 1.5;
    totalWeight += 1.5;
  });

  role.preferred.forEach(attrKey => {
    const val = getPlayerAttributeValue(p, attrKey);
    weightedSum += val * 1.0;
    totalWeight += 1.0;
  });

  if (totalWeight === 0) return 10.0;
  return parseFloat((weightedSum / totalWeight).toFixed(1));
};

// Extracts a smart last name or short name from a player's full name
const getPlayerShortName = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0];
  const last = parts[parts.length - 1];
  if (last.toLowerCase() === 'jr' || last.toLowerCase() === 'sr' || last.length <= 2) {
    return parts.slice(-2).join(' ');
  }
  return last;
};

export const PlayerComparisonModal: React.FC<PlayerComparisonModalProps> = ({
  isOpen,
  onClose,
  players
}) => {
  if (!isOpen) return null;

  // Determine initial selected position based on compared players
  const isAnyGk = players.some(p => 
    p.position.toUpperCase().includes('GK') || 
    p.position.toUpperCase().includes('POR') || 
    p.assignedPosition === 'GK'
  );
  
  const initialPos = isAnyGk ? 'GK' : 'DC';
  const [selectedPos, setSelectedPos] = useState<string>(initialPos);

  // Derive available roles for the selected position
  const currentPositionData = useMemo(() => {
    return POSITIONS_DATA.find(pos => pos.code === selectedPos) || POSITIONS_DATA[1];
  }, [selectedPos]);

  // Handle selected role, defaulting to the first one available
  const [selectedRole, setSelectedRole] = useState<ComparisonRole | null>(
    currentPositionData.roles[0] || null
  );

  // Reset selected role whenever position changes
  const handleSelectPosition = (posCode: string) => {
    setSelectedPos(posCode);
    const posData = POSITIONS_DATA.find(p => p.code === posCode);
    if (posData && posData.roles.length > 0) {
      setSelectedRole(posData.roles[0]);
    } else {
      setSelectedRole(null);
    }
  };

  // Determine attribute list to show dynamically
  const activeAttributes = useMemo(() => {
    return selectedPos === 'GK' ? GK_ATTRIBUTES : OUTFIELD_ATTRIBUTES;
  }, [selectedPos]);

  // Calculate scores for all players based on active role/average
  const playerScores = useMemo(() => {
    return players.map(p => {
      const activeScore = selectedRole ? calculateRoleScore(p, selectedRole) : getPlayerScore(p);
      const baseScore = getPlayerScore(p);
      return {
        player: p,
        activeScore,
        baseScore
      };
    });
  }, [players, selectedRole]);

  // Find the highest score to display a "Mejor" badge
  const highestActiveScore = useMemo(() => {
    if (playerScores.length === 0) return 0;
    return Math.max(...playerScores.map(ps => ps.activeScore));
  }, [playerScores]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
        />

        {/* Modal container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-7xl h-[90vh] overflow-hidden shadow-2xl flex flex-col z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60 shrink-0">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-5 h-5 text-emerald-400 animate-pulse" />
              <div>
                <h2 className="text-sm font-bold text-slate-100 font-sans tracking-wide uppercase">
                  Comparador Avanzado por Rol
                </h2>
                <p className="text-[10px] text-slate-400">
                  Compara atributos y adaptabilidad táctica en tiempo real
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-200 transition-colors rounded-lg p-1 hover:bg-slate-800/80"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Main Layout Area */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            
            {/* Left Column: POSITION SELECTOR & ROLE SCORES */}
            <div className="w-full md:w-[350px] bg-slate-950/40 border-r border-slate-800/60 flex flex-col h-full overflow-hidden shrink-0">
              
              {/* Position selector */}
              <div className="p-3 border-b border-slate-800/40 bg-slate-950/40 shrink-0">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Posición base
                </span>
                <div className="grid grid-cols-4 gap-1">
                  {POSITIONS_DATA.map(pos => {
                    const isActive = selectedPos === pos.code;
                    return (
                      <button
                        key={pos.code}
                        onClick={() => handleSelectPosition(pos.code)}
                        className={`py-1 text-[9px] font-bold rounded transition-all font-sans ${
                          isActive
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-slate-800/30'
                        }`}
                      >
                        {pos.code}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role Scores Column headers */}
              <div className="px-4 py-2 border-b border-slate-800/40 bg-slate-950/60 flex items-center justify-between text-[9px] font-bold text-slate-500 uppercase tracking-wider shrink-0">
                <span>Roles de {currentPositionData.name.split(' ')[0]}</span>
                <div className="flex items-center gap-1 pr-1">
                  {players.map((p, idx) => {
                    const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                    const initials = p.name
                      .split(' ')
                      .map(n => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <span key={p.id} className={`w-[34px] text-center font-mono font-bold ${color.text}`} title={p.name}>
                        {initials}
                      </span>
                    );
                  })}
                </div>
              </div>

              {/* Role Rows List */}
              <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin">
                {currentPositionData.roles.map(role => {
                  const isSelected = selectedRole?.code === role.code;
                  
                  // Calculate scores for this role for all compared players
                  const scores = players.map(p => ({
                    player: p,
                    score: calculateRoleScore(p, role)
                  }));
                  
                  // Find highest score in this row to highlight it
                  const maxScore = Math.max(...scores.map(s => s.score));

                  return (
                    <button
                      key={role.code}
                      onClick={() => setSelectedRole(role)}
                      className={`w-full text-left p-2 rounded-lg transition-all duration-150 border flex items-center justify-between ${
                        isSelected
                          ? 'bg-slate-800/40 border-slate-700/60 shadow-inner'
                          : 'bg-transparent border-transparent hover:bg-slate-900/30'
                      }`}
                    >
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="font-semibold text-slate-200 text-[10.5px] truncate flex items-center gap-1">
                          {role.phase === 'In Possession' ? (
                            <Zap className="w-3 h-3 text-amber-500 shrink-0" />
                          ) : (
                            <Shield className="w-3 h-3 text-sky-400 shrink-0" />
                          )}
                          <span className="truncate">{role.name.split('(')[0].trim()}</span>
                        </div>
                        <div className="text-[9px] text-slate-500 font-mono mt-0.5">
                          {role.code.split('-')[0]} • {role.phase === 'In Possession' ? 'Con Pelota' : 'Sin Pelota'}
                        </div>
                      </div>

                      {/* Scores for this role */}
                      <div className="flex items-center gap-1 shrink-0">
                        {scores.map(({ player, score }, idx) => {
                          const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                          const isHighest = score === maxScore && maxScore > 0;
                          return (
                            <div
                              key={player.id}
                              className={`w-[34px] h-[22px] rounded flex items-center justify-center font-mono font-bold text-[9.5px] border transition-all ${
                                isHighest
                                  ? `${color.bg} text-slate-950 border-transparent shadow-sm scale-105`
                                  : 'bg-slate-950/40 text-slate-400 border-slate-800/60'
                              }`}
                            >
                              {score.toFixed(1)}
                            </div>
                          );
                        })}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Selected role description */}
              {selectedRole && (
                <div className="p-3 bg-slate-950/60 border-t border-slate-800/40 shrink-0">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    <span>Atributos Clave</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed font-sans max-h-16 overflow-y-auto scrollbar-thin">
                    <span className="text-amber-400 font-semibold">Clave:</span>{' '}
                    {selectedRole.key.map(k => {
                      const cfg = [...GK_ATTRIBUTES, ...OUTFIELD_ATTRIBUTES].find(x => x.key === k);
                      return cfg ? cfg.label : k;
                    }).join(', ')}
                    <br />
                    <span className="text-sky-400 font-semibold">Preferido:</span>{' '}
                    {selectedRole.preferred.map(k => {
                      const cfg = [...GK_ATTRIBUTES, ...OUTFIELD_ATTRIBUTES].find(x => x.key === k);
                      return cfg ? cfg.label : k;
                    }).join(', ')}
                  </p>
                </div>
              )}

            </div>

            {/* Right Column: TOP CARDS & DYNAMIC ATTRIBUTE MATRIX */}
            <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-950/20">
              
              {/* Top compared player cards summary with horizontal scrolling */}
              <div className="p-4 border-b border-slate-800/40 bg-slate-900/40 flex gap-3 overflow-x-auto shrink-0 scrollbar-thin">
                {playerScores.map(({ player, activeScore, baseScore }, idx) => {
                  const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                  const isBest = activeScore === highestActiveScore && highestActiveScore > 0;
                  const initials = player.name
                    .split(' ')
                    .map(n => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase();

                  return (
                    <div
                      key={player.id}
                      className={`relative bg-slate-950/60 border ${
                        isBest ? 'border-emerald-500/50 shadow-emerald-950/10 shadow-lg' : color.border
                      } rounded-xl p-3 flex items-center gap-3 transition-all duration-300 min-w-[200px] max-w-[250px] flex-1 shrink-0`}
                    >
                      {/* Best Badge */}
                      {isBest && (
                        <span className="absolute -top-2 -right-1 bg-emerald-500 text-slate-950 font-bold text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5 z-10">
                          <Award className="w-2.5 h-2.5" /> Mejor
                        </span>
                      )}

                      {/* Avatar Badge */}
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs ${color.bgLight} ${color.text} border ${color.border} shrink-0`}>
                        {initials}
                      </div>

                      {/* Info */}
                      <div className="min-w-0 flex-1">
                        <h4 className="font-semibold text-slate-100 truncate text-[11px]" title={player.name}>
                          {player.name}
                        </h4>
                        <p className="text-[9px] text-slate-400 truncate">
                          {player.position} • {player.age} años
                        </p>
                      </div>

                      {/* Score Card */}
                      <div className="text-right shrink-0 flex flex-col">
                        <span className={`text-sm font-bold font-sans ${isBest ? 'text-emerald-400' : color.text}`}>
                          {activeScore.toFixed(1)}
                        </span>
                        <span className="text-[8px] text-slate-500 font-sans">
                          Base: {baseScore.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Main Attributes Table Container with Double Sticky Scrolling */}
              <div className="flex-1 overflow-auto p-4 scrollbar-thin">
                <div className="min-w-max">
                  
                  {/* Table Header Row (Sticky at the top) */}
                  <div className="flex items-center border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md sticky top-0 z-30 h-10 rounded-t-lg">
                    {/* Attribute Label Corner Header Cell (Sticky left and top) */}
                    <div className="w-36 md:w-44 shrink-0 sticky left-0 bg-slate-950 z-40 pl-3 pr-2 border-r border-slate-800/60 text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center h-full">
                      Atributo
                    </div>
                    
                    {/* Player Name Header Cells */}
                    <div className="flex items-center h-full">
                      {players.map((player, idx) => {
                        const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];
                        const shortName = getPlayerShortName(player.name);
                        return (
                          <div
                            key={player.id}
                            className={`w-[95px] md:w-[115px] shrink-0 px-2 text-center font-bold text-[11px] truncate ${color.text} font-sans`}
                            title={player.name}
                          >
                            {shortName}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Table Body Rows */}
                  <div className="divide-y divide-slate-800/20 bg-slate-900/10 rounded-b-lg overflow-hidden border border-slate-800/40">
                    {activeAttributes.map(attr => {
                      const isKey = selectedRole?.key.includes(attr.key);
                      const isPreferred = selectedRole?.preferred.includes(attr.key);

                      // Row classes & styling based on tactile role
                      let rowClass = "flex items-center h-8 transition-colors duration-150";
                      let labelBg = "bg-slate-900";
                      let labelTextClass = "text-slate-400 font-medium";
                      let labelBorderAccent = "border-l-2 border-l-transparent";

                      if (isKey) {
                        rowClass += " bg-amber-500/5 hover:bg-amber-500/10";
                        labelBg = "bg-amber-950/30";
                        labelTextClass = "text-amber-400 font-bold";
                        labelBorderAccent = "border-l-2 border-l-amber-500";
                      } else if (isPreferred) {
                        rowClass += " bg-sky-500/5 hover:bg-sky-500/10";
                        labelBg = "bg-sky-950/30";
                        labelTextClass = "text-sky-400 font-semibold";
                        labelBorderAccent = "border-l-2 border-l-sky-500/80";
                      } else {
                        rowClass += " hover:bg-slate-800/20";
                      }

                      return (
                        <div key={attr.key} className={rowClass}>
                          {/* Sticky Attribute Label Cell */}
                          <div className={`w-36 md:w-44 shrink-0 sticky left-0 z-20 pl-3 pr-2 border-r border-slate-800/80 h-full flex items-center justify-between text-[11px] ${labelBg} ${labelBorderAccent} ${labelTextClass}`}>
                            <span className="truncate">{attr.label}</span>
                            {isKey && (
                              <span className="text-[8px] font-extrabold bg-amber-500 text-slate-950 px-1 py-0.2 rounded uppercase tracking-wider shrink-0 font-sans ml-1">
                                Clave
                              </span>
                            )}
                            {isPreferred && (
                              <span className="text-[8px] font-extrabold bg-sky-500 text-slate-950 px-1 py-0.2 rounded uppercase tracking-wider shrink-0 font-sans ml-1">
                                Pref
                              </span>
                            )}
                          </div>

                          {/* Player Values & Bars Cells */}
                          <div className="flex items-center h-full">
                            {players.map((player, idx) => {
                              const val = getPlayerAttributeValue(player, attr.key);
                              const widthPercent = (val / 20) * 100;
                              const color = PLAYER_COLORS[idx % PLAYER_COLORS.length];

                              return (
                                <div
                                  key={player.id}
                                  className="w-[95px] md:w-[115px] shrink-0 px-2 flex items-center gap-1.5 h-full border-r border-slate-800/10 last:border-r-0"
                                >
                                  {/* Mini Bar */}
                                  <div className="flex-1 bg-slate-950/60 rounded h-2 overflow-hidden border border-slate-800/10 relative">
                                    <div
                                      style={{ width: `${widthPercent}%` }}
                                      className={`h-full ${color.bg} rounded-r`}
                                    />
                                  </div>
                                  {/* Value text */}
                                  <span className={`text-[10px] font-bold font-mono text-right w-4 ${color.text}`}>
                                    {val}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                </div>
              </div>

            </div>

          </div>

          {/* Footer stats overview */}
          <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 text-center text-[10px] text-slate-500 font-sans flex justify-between items-center shrink-0">
            <span>
              💡 Los atributos destacados corresponden a las directrices tácticas del rol elegido (★ Clave, ● Preferido).
            </span>
            <span className="font-semibold text-slate-400">
              FM Scout Tool • {players.length} Jugadores seleccionados
            </span>
          </div>

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
