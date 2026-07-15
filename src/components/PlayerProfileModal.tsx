import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { getFlagEmoji, isTurkishPlayer, formatRatingWithPercentage, getPlayerFlags, calculateAgeFromDOBPrecise, calculateContractYearsRemainingPrecise } from '../utils/flags';
import { X, Star, ThumbsUp, ThumbsDown, Edit2, Check, User, Shield, Award, Calendar, Heart, Award as Trophy } from 'lucide-react';

interface PlayerProfileModalProps {
  player: Player | null;
  onClose: () => void;
  onUpdatePlayer: (updatedPlayer: Player) => void;
  gameYear: number;
}

// Master configuration for attributes
export interface AttributeConfig {
  key: string;
  section: 'goalkeeping' | 'technical' | 'mental' | 'physical';
  labelEs: string;
  labelEn: string;
}

export const FM_ATTRIBUTES: AttributeConfig[] = [
  // Goalkeeping
  { key: "aerialReach", section: "goalkeeping", labelEs: "Alcance Aéreo", labelEn: "Aerial Reach" },
  { key: "commandOfArea", section: "goalkeeping", labelEs: "Mando en Área", labelEn: "Command of Area" },
  { key: "communication", section: "goalkeeping", labelEs: "Comunicación", labelEn: "Communication" },
  { key: "eccentricity", section: "goalkeeping", labelEs: "Excentricidad", labelEn: "Eccentricity" },
  { key: "handling", section: "goalkeeping", labelEs: "Blocaje", labelEn: "Handling" },
  { key: "kicking", section: "goalkeeping", labelEs: "Saques Puerta", labelEn: "Kicking" },
  { key: "oneOnOnes", section: "goalkeeping", labelEs: "Unos contra Unos", labelEn: "One on Ones" },
  { key: "reflexes", section: "goalkeeping", labelEs: "Reflejos", labelEn: "Reflexes" },
  { key: "rushingOut", section: "goalkeeping", labelEs: "Salidas (Tend.)", labelEn: "Rushing Out" },
  { key: "tendencyToPunch", section: "goalkeeping", labelEs: "Despeje Puños", labelEn: "Tendency to Punch" },
  { key: "throwing", section: "goalkeeping", labelEs: "Saques Mano", labelEn: "Throwing" },

  // Technical
  { key: "crossing", section: "technical", labelEs: "Centros", labelEn: "Crossing" },
  { key: "dribbling", section: "technical", labelEs: "Regate", labelEn: "Dribbling" },
  { key: "finishing", section: "technical", labelEs: "Remate", labelEn: "Finishing" },
  { key: "firstTouch", section: "technical", labelEs: "Primer Toque", labelEn: "First Touch" },
  { key: "heading", section: "technical", labelEs: "Cabeza", labelEn: "Heading" },
  { key: "longShots", section: "technical", labelEs: "Tiros Lejanos", labelEn: "Long Shots" },
  { key: "marking", section: "technical", labelEs: "Marcaje", labelEn: "Marking" },
  { key: "passing", section: "technical", labelEs: "Pases", labelEn: "Passing" },
  { key: "tackling", section: "technical", labelEs: "Entradas", labelEn: "Tackling" },
  { key: "technique", section: "technical", labelEs: "Técnica", labelEn: "Technique" },
  
  // Set Pieces
  { key: "corners", section: "technical", labelEs: "Saques Esquina", labelEn: "Corners" },
  { key: "freeKicks", section: "technical", labelEs: "Faltas", labelEn: "Free Kicks" },
  { key: "longThrows", section: "technical", labelEs: "Saques Largos", labelEn: "Long Throws" },
  { key: "penaltyTaking", section: "technical", labelEs: "Penaltis", labelEn: "Penalty Taking" },

  // Mental
  { key: "aggression", section: "mental", labelEs: "Agresividad", labelEn: "Aggression" },
  { key: "anticipation", section: "mental", labelEs: "Anticipación", labelEn: "Anticipation" },
  { key: "bravery", section: "mental", labelEs: "Valentía", labelEn: "Bravery" },
  { key: "composure", section: "mental", labelEs: "Serenidad", labelEn: "Composure" },
  { key: "concentration", section: "mental", labelEs: "Concentración", labelEn: "Concentration" },
  { key: "decisions", section: "mental", labelEs: "Decisiones", labelEn: "Decisions" },
  { key: "determination", section: "mental", labelEs: "Determinación", labelEn: "Determination" },
  { key: "flair", section: "mental", labelEs: "Talento", labelEn: "Flair" },
  { key: "leadership", section: "mental", labelEs: "Liderazgo", labelEn: "Liderazgo" },
  { key: "offTheBall", section: "mental", labelEs: "Desmarques / Sin Balón", labelEn: "Off the Ball" },
  { key: "positioning", section: "mental", labelEs: "Colocación", labelEn: "Positioning" },
  { key: "teamwork", section: "mental", labelEs: "Juego en Equipo", labelEn: "Teamwork" },
  { key: "vision", section: "mental", labelEs: "Visión", labelEn: "Vision" },
  { key: "workRate", section: "mental", labelEs: "Trabajo / Sacrificio", labelEn: "Work Rate" },

  // Physical
  { key: "acceleration", section: "physical", labelEs: "Aceleración", labelEn: "Acceleration" },
  { key: "agility", section: "physical", labelEs: "Agilidad", labelEn: "Agility" },
  { key: "balance", section: "physical", labelEs: "Equilibrio", labelEn: "Balance" },
  { key: "jumpingReach", section: "physical", labelEs: "Alcance de Salto", labelEn: "Jumping Reach" },
  { key: "naturalFitness", section: "physical", labelEs: "Forma Física Nat.", labelEn: "Natural Fitness" },
  { key: "pace", section: "physical", labelEs: "Velocidad", labelEn: "Pace" },
  { key: "stamina", section: "physical", labelEs: "Resistencia", labelEn: "Stamina" },
  { key: "strength", section: "physical", labelEs: "Fuerza", labelEn: "Strength" }
];

export interface RoleConfig {
  name: string;
  code: string;
  phase: string;
  isGoalkeeper: boolean;
  weights: Record<string, number>;
  highlights: {
    key: string[];
    preferred: string[];
    unnecessary: string[];
  };
}

export const ROLES_TEMPLATES: RoleConfig[] = [
  {
    name: "Portero General (Goalkeeper)",
    code: "GK",
    phase: "En Posesión / Defend",
    isGoalkeeper: true,
    weights: {
      aerialReach: 6, commandOfArea: 6, communication: 5, handling: 8, kicking: 5,
      oneOnOnes: 4, reflexes: 8, throwing: 3, anticipation: 3, bravery: 6,
      composure: 2, concentration: 6, decisions: 10, leadership: 2, positioning: 5,
      teamwork: 2, vision: 1, workRate: 1, acceleration: 6, agility: 8,
      balance: 2, jumpingReach: 1, pace: 3, stamina: 1, strength: 4,
      firstTouch: 1, heading: 1, passing: 3, technique: 1
    },
    highlights: {
      key: ["aerialReach", "commandOfArea", "communication", "handling", "reflexes", "concentration", "decisions"],
      preferred: ["anticipation", "positioning", "kicking", "oneOnOnes", "throwing", "bravery", "agility"],
      unnecessary: ["eccentricity"]
    }
  },
  {
    name: "Portero de Cierre (Sweeper Keeper)",
    code: "SK",
    phase: "Transición Ofensiva / Apoyo",
    isGoalkeeper: true,
    weights: {
      aerialReach: 6, commandOfArea: 6, communication: 5, handling: 8, kicking: 6,
      oneOnOnes: 6, reflexes: 8, throwing: 4, anticipation: 6, bravery: 6,
      composure: 5, concentration: 6, decisions: 10, leadership: 2, positioning: 5,
      teamwork: 3, vision: 4, workRate: 1, acceleration: 7, agility: 8,
      balance: 2, jumpingReach: 1, pace: 5, stamina: 1, strength: 4,
      firstTouch: 3, heading: 1, passing: 5, technique: 3, rushingOut: 7
    },
    highlights: {
      key: ["reflexes", "oneOnOnes", "rushingOut", "anticipation", "decisions", "acceleration", "agility"],
      preferred: ["aerialReach", "commandOfArea", "communication", "handling", "composure", "positioning", "passing", "firstTouch"],
      unnecessary: []
    }
  },
  {
    name: "Portero de Cierre de Línea (Line-holding GK)",
    code: "LHK",
    phase: "Bloque Bajo / Defend",
    isGoalkeeper: true,
    weights: {
      aerialReach: 7, commandOfArea: 5, communication: 5, handling: 8, kicking: 3,
      oneOnOnes: 4, reflexes: 8, throwing: 2, anticipation: 3, bravery: 7,
      composure: 2, concentration: 6, decisions: 8, leadership: 2, positioning: 6,
      teamwork: 2, vision: 1, workRate: 1, acceleration: 4, agility: 7,
      balance: 2, jumpingReach: 2, pace: 3, stamina: 1, strength: 5,
      firstTouch: 1, heading: 1, passing: 2, technique: 1
    },
    highlights: {
      key: ["aerialReach", "handling", "reflexes", "positioning", "bravery", "concentration"],
      preferred: ["commandOfArea", "communication", "oneOnOnes", "decisions", "agility", "strength"],
      unnecessary: ["rushingOut", "eccentricity"]
    }
  },
  {
    name: "Portero de Juego de Pies (Ball-Playing GK)",
    code: "BGK",
    phase: "Salida Limpia / Apoyo",
    isGoalkeeper: true,
    weights: {
      aerialReach: 5, commandOfArea: 5, communication: 4, handling: 7, kicking: 8,
      oneOnOnes: 5, reflexes: 7, throwing: 5, anticipation: 4, bravery: 4,
      composure: 6, concentration: 5, decisions: 8, leadership: 2, positioning: 4,
      teamwork: 4, vision: 6, workRate: 1, acceleration: 5, agility: 7,
      balance: 3, jumpingReach: 1, pace: 4, stamina: 1, strength: 4,
      firstTouch: 4, heading: 1, passing: 6, technique: 4
    },
    highlights: {
      key: ["handling", "reflexes", "kicking", "oneOnOnes", "passing", "firstTouch", "composure", "decisions", "vision"],
      preferred: ["anticipation", "agility", "aerialReach", "commandOfArea", "communication", "throwing", "technique", "teamwork"],
      unnecessary: []
    }
  },
  {
    name: "Portero No-Nonsense (No-Nonsense GK)",
    code: "NGK",
    phase: "Despeje Largo / Defend",
    isGoalkeeper: true,
    weights: {
      aerialReach: 7, commandOfArea: 6, communication: 4, handling: 8, kicking: 3,
      oneOnOnes: 5, reflexes: 8, throwing: 2, anticipation: 3, bravery: 8,
      composure: 2, concentration: 6, decisions: 6, leadership: 2, positioning: 6,
      teamwork: 2, vision: 1, workRate: 1, acceleration: 4, agility: 6,
      balance: 2, jumpingReach: 2, pace: 3, stamina: 1, strength: 6,
      firstTouch: 1, heading: 1, passing: 2, technique: 1
    },
    highlights: {
      key: ["aerialReach", "handling", "reflexes", "bravery", "strength", "positioning"],
      preferred: ["commandOfArea", "concentration", "oneOnOnes", "decisions"],
      unnecessary: ["eccentricity", "passing", "firstTouch", "technique"]
    }
  },
  {
    name: "Defensa Central (Central Defender)",
    code: "CD",
    phase: "Fase Defensiva / Defend",
    isGoalkeeper: false,
    weights: {
      tackling: 8, marking: 8, heading: 8, positioning: 8, jumpingReach: 8,
      strength: 8, bravery: 6, anticipation: 6, decisions: 6, concentration: 6,
      pace: 5, acceleration: 5, composure: 4, firstTouch: 3, passing: 4,
      agility: 4, balance: 5, stamina: 5, workRate: 4
    },
    highlights: {
      key: ["tackling", "marking", "heading", "positioning", "jumpingReach", "strength"],
      preferred: ["bravery", "anticipation", "decisions", "concentration", "composure", "balance"],
      unnecessary: ["finishing", "dribbling", "eccentricity"]
    }
  },
  {
    name: "Centrocampista Recuperador (Ball Winning Midfielder)",
    code: "BWM",
    phase: "Transición Defensiva / Defend",
    isGoalkeeper: false,
    weights: {
      tackling: 8, marking: 7, positioning: 7, workRate: 8, stamina: 8,
      aggression: 8, bravery: 6, strength: 6, teamWork: 6, acceleration: 5,
      decisions: 5, concentration: 5, firstTouch: 4, passing: 5
    },
    highlights: {
      key: ["tackling", "positioning", "workRate", "stamina", "aggression"],
      preferred: ["marking", "bravery", "strength", "teamwork", "anticipation", "decisions"],
      unnecessary: ["finishing", "eccentricity"]
    }
  },
  {
    name: "Mediapunta Organizador (Advanced Playmaker)",
    code: "AP",
    phase: "Fase Ofensiva / Apoyo",
    isGoalkeeper: false,
    weights: {
      passing: 8, technique: 8, vision: 8, firstTouch: 8, decisions: 7,
      composure: 6, flair: 6, dribbling: 6, offTheBall: 6, agility: 6,
      balance: 5, pace: 4, stamina: 5
    },
    highlights: {
      key: ["passing", "technique", "vision", "firstTouch", "decisions"],
      preferred: ["composure", "flair", "dribbling", "offTheBall", "agility", "teamwork"],
      unnecessary: ["marking", "tackling", "eccentricity"]
    }
  },
  {
    name: "Delantero Avanzado (Advanced Forward)",
    code: "AF",
    phase: "Fase Ofensiva / Ataque",
    isGoalkeeper: false,
    weights: {
      finishing: 8, composure: 8, offTheBall: 8, pace: 8, acceleration: 8,
      dribbling: 6, firstTouch: 6, technique: 6, anticipation: 6, agility: 6,
      heading: 4, jumpingReach: 4, strength: 5, workRate: 4
    },
    highlights: {
      key: ["finishing", "composure", "offTheBall", "pace", "acceleration"],
      preferred: ["dribbling", "firstTouch", "technique", "anticipation", "agility", "strength"],
      unnecessary: ["marking", "tackling", "positioning", "eccentricity"]
    }
  }
];

// Helper to generate organic realistic attributes for players if they don't have any yet
export const generateRealisticAttributes = (p: Player): Record<string, number> => {
  const isGk = p.position.toUpperCase().includes('GK') || p.position.toUpperCase().includes('POR') || p.assignedPosition === 'GK';
  
  // Base average determined by CA (potential level of stars)
  const stars = p.currentAbility || 3;
  const baseAvg = Math.round(stars * 2.8) + 4; // 1 star: 7, 3 stars: 12, 5 stars: 18

  const attrs: Record<string, number> = {};

  FM_ATTRIBUTES.forEach(attr => {
    let score = baseAvg + Math.floor(Math.random() * 5) - 2; // add organic variation
    
    // Position adjustments
    if (isGk) {
      if (attr.section === 'goalkeeping') {
        score += 2; // boost goalkeeping attributes
      } else if (attr.section === 'technical') {
        // Goalkeepers have terrible outfield technical attributes
        if (attr.key === 'passing' || attr.key === 'firstTouch' || attr.key === 'technique') {
          score = Math.max(3, score - 5); // some capability
        } else {
          score = Math.max(1, Math.floor(Math.random() * 3) + 1); // rest are near zero (1-3)
        }
      }
    } else {
      // Outfield player
      if (attr.section === 'goalkeeping') {
        score = 1; // goalkeeper attributes are 1 for outfielders
      } else {
        // Boost positional specifics
        const upperPos = p.position.toUpperCase();
        if (upperPos.includes('ST') || upperPos.includes('DL')) {
          if (attr.key === 'finishing' || attr.key === 'composure' || attr.key === 'offTheBall') {
            score += 3;
          }
        } else if (upperPos.includes('D (') || upperPos.includes('DFC')) {
          if (attr.key === 'tackling' || attr.key === 'marking' || attr.key === 'heading' || attr.key === 'positioning' || attr.key === 'strength') {
            score += 3;
          }
        } else if (upperPos.includes('AM') || upperPos.includes('MP') || upperPos.includes('EXT')) {
          if (attr.key === 'dribbling' || attr.key === 'technique' || attr.key === 'vision' || attr.key === 'firstTouch' || attr.key === 'pace') {
            score += 3;
          }
        }
      }
    }

    attrs[attr.key] = Math.max(1, Math.min(20, score));
  });

  // Exclude hidden attributes by configuration
  return attrs;
};

// Helper to determine positional suitability modifier based on player's position preferences
export const getRoleMatchCoefficient = (player: Player, roleCode: string): number => {
  const roleToPosKeys: Record<string, string[]> = {
    GK: ["GK", "POR"],
    SK: ["GK", "POR"],
    LHK: ["GK", "POR"],
    BGK: ["GK", "POR"],
    NGK: ["GK", "POR"],
    CD: ["D (C)", "DFC", "D(C)"],
    BWM: ["DM", "M (C)", "MCD", "MC", "M(C)"],
    AP: ["AM (C)", "M (C)", "AM(C)", "M(C)", "MP (C)"],
    AF: ["ST (C)", "DL", "ST(C)", "ST", "DL (C)"]
  };

  const keys = roleToPosKeys[roleCode] || [];
  if (keys.length === 0) return 1.0;

  // 1. Primary position
  let primaryPos = "";
  if (player.bestPosition) {
    primaryPos = player.bestPosition.trim();
  } else if (player.position) {
    primaryPos = player.position.split(',')[0].trim();
  }

  const primaryMatches = keys.some(k => 
    primaryPos.toUpperCase().includes(k.toUpperCase()) || 
    k.toUpperCase().includes(primaryPos.toUpperCase())
  );
  if (primaryMatches) {
    return 1.0; // 100% of suitability
  }

  // 2. Secondary parts
  let secondaryParts: string[] = [];
  if (player.secPosition) {
    secondaryParts = player.secPosition.split(',').map(s => s.trim());
  }
  
  if (player.position) {
    const parts = player.position.split(',').map(s => s.trim());
    parts.forEach(p => {
      if (p.toUpperCase() !== primaryPos.toUpperCase() && !secondaryParts.includes(p)) {
        secondaryParts.push(p);
      }
    });
  }

  const secondaryMatches = keys.some(k => 
    secondaryParts.some(sp => 
      sp.toUpperCase().includes(k.toUpperCase()) || 
      k.toUpperCase().includes(sp.toUpperCase())
    )
  );

  if (secondaryMatches) {
    return 0.85; // 85% of suitability (15% reduction)
  }

  return 0.70; // 70% of suitability for other positions (30% reduction)
};

export function PlayerProfileModal({ player, onClose, onUpdatePlayer, gameYear }: PlayerProfileModalProps) {
  if (!player) return null;

  // Ensure attributes exist, otherwise return empty
  const resolvedAttributes = useMemo(() => {
    return player.attributes || {};
  }, [player]);

  const hasAttributes = useMemo(() => {
    return !!(player.attributes && Object.keys(player.attributes).length > 0);
  }, [player]);

  const [isEditing, setIsEditing] = useState(false);
  const [editedAttributes, setEditedAttributes] = useState<Record<string, number>>({});
  
  // Active role selected for highlights and score cards
  const isGk = player.position.toUpperCase().includes('GK') || player.position.toUpperCase().includes('POR') || player.assignedPosition === 'GK';
  const defaultRole = isGk ? "GK" : "CD";
  const [selectedRoleCode, setSelectedRoleCode] = useState<string>(defaultRole);

  const activeRole = useMemo(() => {
    return ROLES_TEMPLATES.find(r => r.code === selectedRoleCode) || ROLES_TEMPLATES[0];
  }, [selectedRoleCode]);

  // Start manual editing
  const handleStartEdit = () => {
    const baseAttrs = hasAttributes ? resolvedAttributes : {};
    const initialEdit: Record<string, number> = {};
    FM_ATTRIBUTES.forEach(attr => {
      initialEdit[attr.key] = baseAttrs[attr.key] || 10;
    });
    setEditedAttributes(initialEdit);
    setIsEditing(true);
  };

  // Save manual editing
  const handleSaveEdit = () => {
    const updatedPlayer: Player = {
      ...player,
      attributes: editedAttributes
    };
    onUpdatePlayer(updatedPlayer);
    setIsEditing(false);
  };

  const handleAttrChange = (key: string, val: number) => {
    setEditedAttributes(prev => ({
      ...prev,
      [key]: Math.max(1, Math.min(20, val))
    }));
  };

  // Calculate suitability score for a given role config
  const calculateRoleSuitability = (role: RoleConfig, attrs: Record<string, number>) => {
    let totalWeight = 0;
    let earnedPoints = 0;

    Object.entries(role.weights).forEach(([key, weight]) => {
      // Exclude Determination from calculations (as requested)
      if (key === 'determination') return;
      
      const value = attrs[key];
      if (value === undefined) return; // Ignore if missing

      earnedPoints += value * weight;
      totalWeight += 20 * weight; // Maximum possible is 20 * weight
    });

    if (totalWeight === 0) return { percentage: "-", ca: "-", coeff: 1.0 };
    
    let percentage = (earnedPoints / totalWeight) * 100;
    
    // Apply position penalty coefficient!
    const coeff = getRoleMatchCoefficient(player, role.code);
    percentage = percentage * coeff;

    const finalPercentage = parseFloat(percentage.toFixed(1));
    // Scale CA from 1 to 200 based on suitability
    const ca = Math.round((finalPercentage / 100) * 200);

    return {
      percentage: finalPercentage,
      ca: Math.max(1, Math.min(200, ca)),
      coeff
    };
  };

  // Suitability for active selected role
  const currentSuitability = useMemo(() => {
    if (!hasAttributes) return { percentage: "-", ca: "-", coeff: 1.0 };
    return calculateRoleSuitability(activeRole, resolvedAttributes);
  }, [activeRole, resolvedAttributes, hasAttributes, player]);

  // Calculate suitabilities for all available roles of similar type (GK or Outfield)
  const roleRatings = useMemo(() => {
    return ROLES_TEMPLATES.filter(r => r.isGoalkeeper === isGk).map(role => {
      if (!hasAttributes) {
        return { role, percentage: "-", ca: "-", coeff: 1.0 };
      }
      const suit = calculateRoleSuitability(role, resolvedAttributes);
      return {
        role,
        ...suit
      };
    }).sort((a, b) => {
      if (a.percentage === "-") return 1;
      if (b.percentage === "-") return -1;
      return (b.percentage as number) - (a.percentage as number);
    });
  }, [resolvedAttributes, isGk, hasAttributes, player]);

  // Group attributes into standard columns
  const sections = useMemo(() => {
    const columns: { title: string; attrs: AttributeConfig[] }[] = [];

    if (isGk) {
      columns.push({
        title: "🛡️ Habilidades de Portero",
        attrs: FM_ATTRIBUTES.filter(a => a.section === 'goalkeeping')
      });
    } else {
      columns.push({
        title: "⚽ Atributos Técnicos",
        attrs: FM_ATTRIBUTES.filter(a => a.section === 'technical')
      });
    }

    columns.push({
      title: "🧠 Atributos Mentales",
      attrs: FM_ATTRIBUTES.filter(a => a.section === 'mental')
    });

    columns.push({
      title: "⚡ Atributos Físicos",
      attrs: FM_ATTRIBUTES.filter(a => a.section === 'physical')
    });

    return columns;
  }, [isGk]);

  // Helper to determine highlight category for a key
  const getHighlightStatus = (key: string) => {
    if (activeRole.highlights.key.includes(key)) return 'key';
    if (activeRole.highlights.preferred.includes(key)) return 'preferred';
    if (activeRole.highlights.unnecessary.includes(key)) return 'unnecessary';
    return 'none';
  };

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-2 md:p-4 overflow-hidden"
    >
      <div className="bg-slate-950 border border-slate-800 w-full max-w-5xl rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh] my-auto">
        
        {/* UPPER CARD: FOOTBALL MANAGER COMPACT HEADER */}
        <div className="py-3 px-4 md:py-4 md:px-6 bg-gradient-to-r from-slate-900 to-slate-950 border-b border-slate-800 relative shrink-0">
          
          <button 
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 bg-slate-900/85 hover:bg-slate-800 text-slate-400 hover:text-white rounded-full border border-slate-800 transition shadow-md z-10"
            title="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
 
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-5">
            
            {/* Player Avatar */}
            <div className="relative shrink-0">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl bg-slate-850 border border-slate-700/50 flex items-center justify-center text-slate-500 overflow-hidden shadow-inner">
                {isGk ? (
                  <Shield className="w-8 h-8 text-emerald-500/40" />
                ) : (
                  <User className="w-8 h-8 text-cyan-500/40" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 bg-emerald-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded-full font-mono shadow-md border border-slate-950">
                {player.assignedPosition || "REC"}
              </div>
            </div>
 
            {/* Middle Main Info */}
            <div className="text-center md:text-left flex-1 space-y-1">
              <div className="flex flex-col md:flex-row md:items-center gap-2">
                <h2 className="text-lg md:text-xl font-extrabold text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
                  {player.name}
                  <span className="text-slate-500 text-[10px] font-mono font-normal">UID: {player.id}</span>
                </h2>
              </div>
 
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-2 gap-y-1 text-xs text-slate-300 font-sans">
                <span className="text-emerald-400 font-bold uppercase tracking-wider text-[10px] font-mono bg-emerald-950/30 border border-emerald-900/30 px-1.5 py-0.5 rounded">
                  {player.position}
                </span>
                <span className="text-slate-500">•</span>
                <span className="font-semibold text-slate-200">
                  {calculateAgeFromDOBPrecise(player.dateOfBirth, player.age, "30/06/" + gameYear)} años 
                  <span className="text-slate-400 font-normal"> ({player.dateOfBirth || "S/D"})</span>
                </span>
                <span className="text-slate-500">•</span>
                <span className="flex items-center gap-1">
                  {getPlayerFlags(player.nationality).map((f, idx) => (
                    <span key={idx} className="text-sm select-none">{f}</span>
                  ))}
                  <span className="font-semibold text-slate-200">{player.nationality}</span>
                  {player.intCaps !== undefined && (
                    <span className="text-slate-400 font-mono text-[10px]"> ({player.intCaps} part. / {player.intGoals || 0} g)</span>
                  )}
                </span>
              </div>
 
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-1.5 pt-0.5">
                <span className="px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-[9.5px] font-bold text-slate-300 font-sans uppercase">
                  🏢 {player.club || "Agente Libre"}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-850 text-[9.5px] font-semibold text-slate-400 font-mono">
                  Contrato: {player.contractEnd || "N/D"}
                </span>
                {player.squadStatus && (
                  <span className="px-2 py-0.5 rounded-full bg-slate-900/80 border border-slate-800 text-[9.5px] font-extrabold text-emerald-400 uppercase tracking-wide">
                    {player.squadStatus === 'titular' ? "★ Titular Clave" : player.squadStatus === 'suplente' ? "✦ Suplente" : player.squadStatus === 'juvenil' ? "👦 Juvenil" : "📁 " + player.squadStatus}
                  </span>
                )}
              </div>
            </div>
 
            {/* Right Finance Info */}
            <div className="shrink-0 w-full md:w-auto bg-slate-950/60 p-2.5 px-4 rounded-xl border border-slate-850/50 flex flex-row md:flex-col justify-around md:justify-center items-center text-center gap-x-6 gap-y-2">
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-mono font-bold block">Valor</span>
                <strong className="text-white text-base md:text-lg font-extrabold block mt-0.5">{player.marketValue}</strong>
              </div>
              <div className="h-6 w-px bg-slate-850 md:h-px md:w-full"></div>
              <div>
                <span className="text-[9px] text-slate-500 uppercase font-mono font-bold block">Sueldo</span>
                <strong className="text-emerald-400 text-base md:text-lg font-extrabold block mt-0.5">{player.wage}</strong>
              </div>
            </div>
 
          </div>
        </div>
 
        {/* MIDDLE SECTION: ATTRIBUTE TEMPLATES & SELECTOR */}
        <div className="bg-slate-900/40 px-4 py-2 border-b border-slate-850 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-300">
            <Award className="w-4 h-4 text-emerald-500" />
            <span className="font-bold text-[11px]">Rol:</span>
            <select
              value={selectedRoleCode}
              onChange={(e) => setSelectedRoleCode(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 text-[11px] rounded px-2.5 py-1 focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
            >
              {ROLES_TEMPLATES.map(role => (
                <option key={role.code} value={role.code}>
                  {role.name} ({role.code})
                </option>
              ))}
            </select>
          </div>
 
          {/* Quick Stats Summary */}
          <div className="flex flex-wrap items-center gap-2.5 font-mono bg-slate-950/80 border border-slate-850 px-3 py-1 rounded-full text-[11px]">
            {hasAttributes && (
              <>
                <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-sans font-bold uppercase tracking-wider
                  ${currentSuitability.coeff === 1.0 
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/60' 
                    : currentSuitability.coeff === 0.85 
                      ? 'bg-amber-950 text-amber-400 border border-amber-900/60' 
                      : 'bg-rose-950 text-rose-400 border border-rose-900/60'
                  }
                `}>
                  {currentSuitability.coeff === 1.0 
                    ? '🟢 Posición Natural' 
                    : currentSuitability.coeff === 0.85 
                      ? '🟡 Posición Secundaria (-15%)' 
                      : '🔴 Fuera de Posición (-30%)'
                  }
                </span>
                <div className="w-px h-3 bg-slate-800"></div>
              </>
            )}
            <div>
              <span className="text-slate-500 font-sans">Aptitud:</span>
              <strong className="text-emerald-400 font-bold ml-1">
                {currentSuitability.percentage === "-" ? "N/D" : `${currentSuitability.percentage}%`}
              </strong>
            </div>
            <div className="w-px h-3 bg-slate-800"></div>
            <div>
              <span className="text-slate-500 font-sans">CA Est:</span>
              <strong className="text-emerald-300 font-bold ml-1">
                {currentSuitability.ca === "-" ? "N/D" : `${currentSuitability.ca}/200`}
              </strong>
            </div>
          </div>
        </div>
 
        {/* SCROLLABLE INNER PANEL: DETAILED ATTRIBUTES DISPLAY & COLUMNS */}
        <div className="p-4 overflow-y-auto flex-1 min-h-0 space-y-4">
          
          {!hasAttributes && (
            <div className="bg-amber-950/15 border border-amber-900/40 rounded-xl p-3.5 text-center text-xs text-amber-300">
              ⚠️ <strong>Ficha sin atributos cargados:</strong> Este jugador no posee atributos importados. 
              El perfil permanecerá vacío. Presiona <strong>"Editar Atributos"</strong> abajo a la derecha para agregarlos de forma manual, 
              o importa la planilla completa del jugador directamente desde el juego.
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* Left / Center columns: The 3 Attributes Blocks (9 columns) */}
            <div className="lg:col-span-9 grid grid-cols-1 md:grid-cols-3 gap-4">
              {sections.map((sec, secIdx) => (
                <div key={secIdx} className="bg-slate-900/20 border border-slate-850/60 p-3 rounded-xl flex flex-col">
                  <h4 className="text-[10px] font-extrabold uppercase font-mono tracking-wider text-slate-400 pb-1.5 border-b border-slate-850 mb-2 flex items-center justify-between">
                    <span>{sec.title}</span>
                    <span className="text-[8px] text-slate-500 font-normal">S{secIdx + 1}</span>
                  </h4>
                  
                  <div className="space-y-1 flex-1">
                    {sec.attrs.map(attr => {
                      const value = isEditing 
                        ? (editedAttributes[attr.key] !== undefined ? editedAttributes[attr.key] : (resolvedAttributes[attr.key] || 10)) 
                        : (resolvedAttributes[attr.key] !== undefined ? resolvedAttributes[attr.key] : undefined);

                      const status = getHighlightStatus(attr.key);
 
                      // Style depending on highlight status
                      let rowBg = "hover:bg-slate-900/40";
                      let textClass = "text-slate-350";
                      let badge = null;
                      let valueBg = "bg-slate-900/80 text-slate-500";
 
                      if (value !== undefined) {
                        valueBg = "bg-slate-900 text-slate-300";
                        if (status === 'key') {
                          rowBg = "bg-emerald-950/15 hover:bg-emerald-950/20 border-l-2 border-l-emerald-500 pl-1";
                          textClass = "text-emerald-200 font-bold";
                          valueBg = "bg-emerald-500 text-slate-950 font-extrabold shadow-sm";
                          badge = <Star className="w-3 h-3 text-emerald-400 fill-emerald-400 shrink-0" title="Atributo Clave" />;
                        } else if (status === 'preferred') {
                          rowBg = "bg-emerald-950/5 hover:bg-emerald-900/10 border-l-2 border-l-emerald-600/30 pl-1";
                          textClass = "text-emerald-300 font-medium";
                          valueBg = "bg-emerald-950 text-emerald-300 border border-emerald-800/40 font-bold";
                          badge = <ThumbsUp className="w-3 h-3 text-emerald-400/80 shrink-0" title="Atributo Preferido" />;
                        } else if (status === 'unnecessary') {
                          rowBg = "bg-rose-950/5 hover:bg-rose-950/10 border-l-2 border-l-rose-600/40 pl-1";
                          textClass = "text-rose-450 line-through decoration-rose-500/20";
                          valueBg = "bg-rose-950/50 text-rose-450 border border-rose-900/25 font-semibold";
                          badge = <ThumbsDown className="w-3 h-3 text-rose-500/70 shrink-0" title="Atributo Innecesario" />;
                        }
                      } else {
                        // Unloaded styling
                        if (status === 'key') {
                          rowBg = "border-l border-emerald-500/40 bg-emerald-950/5 hover:bg-emerald-950/10 pl-1";
                          textClass = "text-emerald-400/60";
                        } else if (status === 'preferred') {
                          rowBg = "border-l border-emerald-800/20 hover:bg-slate-900/20 pl-1";
                          textClass = "text-slate-400/70";
                        } else if (status === 'unnecessary') {
                          rowBg = "opacity-60";
                          textClass = "text-slate-500 line-through decoration-slate-600/20";
                        }
                      }
 
                      // For determination - mark as special personality attribute
                      if (attr.key === 'determination') {
                        rowBg += " border-l-2 border-l-amber-500/30";
                      }
 
                      return (
                        <div 
                          key={attr.key}
                          className={`group flex items-center justify-between py-1 px-1.5 rounded transition text-[11px] border border-transparent ${rowBg}`}
                        >
                          <span className="flex items-center gap-1.5 truncate">
                            {badge}
                            <span className={`truncate ${textClass}`} title={`${attr.labelEn}`}>
                              {attr.labelEs}
                              {attr.key === 'determination' && (
                                <span className="text-[8px] bg-amber-950 border border-amber-900/60 text-amber-400 font-mono font-bold px-0.5 rounded ml-1" title="Personalidad">
                                  P
                                </span>
                              )}
                            </span>
                          </span>
 
                          <div className="flex items-center shrink-0">
                            {isEditing ? (
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={value !== undefined ? value : ""}
                                onChange={(e) => handleAttrChange(attr.key, parseInt(e.target.value, 10) || 1)}
                                className="w-10 text-center bg-slate-950 border border-slate-800 text-white font-mono rounded font-bold py-0.5 text-[11px] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                              />
                            ) : (
                              <span className={`w-5.5 h-5 rounded flex items-center justify-center font-mono text-[10px] select-none ${valueBg}`}>
                                {value !== undefined ? value : "-"}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
 
            {/* Right column: Informational and Positional Suitabilities Sidebar (3 columns) */}
            <div className="lg:col-span-3 space-y-3.5">
              
              {/* Template Legend Indicators */}
              <div className="bg-slate-900/20 border border-slate-850/60 p-3 rounded-xl space-y-2">
                <h4 className="text-[10px] font-bold text-white uppercase font-mono tracking-wider pb-1 border-b border-slate-850">
                  📌 Guía de Visualización
                </h4>
                <div className="space-y-1.5 text-[10.5px]">
                  <div className="flex items-center gap-1.5 text-emerald-400">
                    <Star className="w-3 h-3 fill-emerald-400" />
                    <span><strong>Key:</strong> Atributo Clave</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-emerald-500/80">
                    <ThumbsUp className="w-3 h-3" />
                    <span><strong>Preferred:</strong> Preferido</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-rose-450">
                    <ThumbsDown className="w-3 h-3" />
                    <span><strong>Unnecessary:</strong> Innecesario</span>
                  </div>
                </div>
              </div>
 
              {/* Positional Ability suitability matrix (dynamically calculated!) */}
              <div className="bg-slate-900/20 border border-slate-850/60 p-3 rounded-xl flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-extrabold text-white uppercase font-mono tracking-wider pb-1.5 border-b border-slate-850 mb-2">
                    <span>🎯 Aptitudes por Roles</span>
                  </h4>
                  
                  <div className="space-y-1 max-h-[170px] overflow-y-auto">
                    {roleRatings.map(({ role, percentage, ca, coeff }) => {
                      const isSelected = role.code === selectedRoleCode;
                      
                      return (
                        <div 
                          key={role.code}
                          onClick={() => setSelectedRoleCode(role.code)}
                          className={`p-1.5 rounded-lg border transition cursor-pointer text-xs flex justify-between items-center
                            ${isSelected 
                              ? 'bg-emerald-950/40 border-emerald-500/40 text-white font-bold ring-1 ring-emerald-500/10' 
                              : 'bg-slate-950/60 border-slate-900/40 hover:bg-slate-900/30 text-slate-400'
                            }
                          `}
                        >
                          <div className="truncate pr-1">
                            <span className="block font-semibold text-[10.5px] truncate">{role.name}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span className="text-[8.5px] text-slate-500 font-mono tracking-wider block">{role.phase}</span>
                              {percentage !== "-" && (
                                <span className={`text-[8px] px-1 rounded font-sans shrink-0
                                  ${coeff === 1.0 
                                    ? 'text-emerald-400 bg-emerald-950/20' 
                                    : coeff === 0.85 
                                      ? 'text-amber-400 bg-amber-950/20' 
                                      : 'text-rose-400 bg-rose-950/20'
                                  }
                                `}>
                                  {coeff === 1.0 ? 'Nat' : coeff === 0.85 ? 'Sec' : 'Out'}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <span className="text-emerald-400 font-bold block">{percentage === "-" ? "N/D" : `${percentage}%`}</span>
                            <span className="text-[9px] text-slate-400 font-mono block">{ca === "-" ? "N/D" : `${ca} CA`}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
 
                {/* Action buttons (Manual Attributes editing toggle) */}
                <div className="mt-3 pt-3 border-t border-slate-850/60">
                  {isEditing ? (
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        onClick={handleSaveEdit}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 rounded-lg text-[11px] flex items-center justify-center gap-1 transition shadow-md shadow-emerald-950/10"
                      >
                        <Check className="w-3.5 h-3.5" /> Guardar
                      </button>
                      <button
                        onClick={() => setIsEditing(false)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-1.5 rounded-lg text-[11px] transition"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartEdit}
                      className="w-full bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-350 hover:text-white font-bold py-1.5 rounded-lg text-[11px] flex items-center justify-center gap-1 transition"
                    >
                      <Edit2 className="w-3 h-3 text-emerald-500" /> Editar Atributos
                    </button>
                  )}

                  {/* FIXED SECONDARY CLOSE BUTTON - INCREDIBLY PROMINENT */}
                  <button
                    onClick={onClose}
                    className="w-full mt-2.5 bg-slate-800 hover:bg-slate-700 hover:text-white text-slate-300 font-bold py-1.5 rounded-lg text-[11px] transition border border-slate-700/40"
                  >
                    ❌ Cerrar Ficha
                  </button>
                </div>
 
              </div>
 
            </div>
 
          </div>
 
          {/* Scout Report Summary and Coach notes */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 text-xs pt-2">
            
            <div className="md:col-span-4 bg-slate-900/10 border border-slate-850/60 p-3 rounded-xl space-y-1.5">
              <h5 className="font-extrabold text-slate-300 flex items-center gap-1 uppercase tracking-wide text-[10px] font-mono">
                ⭐ Informe de Calidad (CA/PA)
              </h5>
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div>
                  <span className="text-slate-500 text-[9px] uppercase font-mono block">Actual (Stars):</span>
                  <strong className="text-amber-400 font-bold block text-sm mt-0.5">
                    {player.bestRating || (player.currentAbility + "★")}
                  </strong>
                </div>
                <div>
                  <span className="text-slate-500 text-[9px] uppercase font-mono block">Potencial:</span>
                  <strong className="text-cyan-400 font-bold block text-sm mt-0.5">
                    {player.bestPotRating || (player.potentialAbility + "★")}
                  </strong>
                </div>
              </div>
            </div>
 
            <div className="md:col-span-8 bg-slate-900/10 border border-slate-850/60 p-3 rounded-xl flex flex-col justify-between">
              <h5 className="font-extrabold text-slate-300 uppercase tracking-wide text-[10px] font-mono">
                📝 Notas del Mánager / Informe Táctico
              </h5>
              <p className="text-slate-400 italic mt-1 text-[11px] flex-1">
                {player.notes || "No hay notas guardadas sobre el jugador. Puedes redactarlas desde la Matriz de Planeamiento o agregarlas en su perfil."}
              </p>
            </div>

          </div>
 
        </div>
      </div>
    </div>
  );
}
