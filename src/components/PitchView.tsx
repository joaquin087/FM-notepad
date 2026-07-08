import React from 'react';
import { Player, PitchPosition, Formation } from '../types';
import { Shield, User, Sparkles, Plus, AlertCircle } from 'lucide-react';

interface PitchViewProps {
  activeFormation: Formation;
  players: Player[];
  assignments: Record<string, { titular: string | null; suplente: string | null; juvenil: string | null }>;
  onSelectPosition: (position: PitchPosition) => void;
  activePositionKey: string | null;
}

// Coordinate mapper for positions in each formation
const getPositionStyle = (formationKey: string, posKey: string): { left: string; top: string } => {
  const coords: Record<string, Record<string, { left: string; top: string }>> = {
    "4231": {
      GK: { left: '50%', top: '88%' },
      DFL: { left: '16%', top: '70%' },
      DFCL: { left: '38%', top: '72%' },
      DFCR: { left: '62%', top: '72%' },
      DFR: { left: '84%', top: '70%' },
      MCL: { left: '34%', top: '54%' },
      MCR: { left: '66%', top: '54%' },
      AML: { left: '16%', top: '32%' },
      AMC: { left: '50%', top: '34%' },
      AMR: { left: '84%', top: '32%' },
      STC: { left: '50%', top: '14%' },
    },
    "433": {
      GK: { left: '50%', top: '88%' },
      DFL: { left: '16%', top: '70%' },
      DFCL: { left: '38%', top: '72%' },
      DFCR: { left: '62%', top: '72%' },
      DFR: { left: '84%', top: '70%' },
      DM: { left: '50%', top: '56%' },
      MCL: { left: '30%', top: '40%' },
      MCR: { left: '70%', top: '40%' },
      AML: { left: '18%', top: '22%' },
      AMR: { left: '82%', top: '22%' },
      STC: { left: '50%', top: '12%' },
    },
    "352": {
      GK: { left: '50%', top: '88%' },
      DFCL: { left: '26%', top: '72%' },
      DFCC: { left: '50%', top: '74%' },
      DFCR: { left: '74%', top: '72%' },
      WBL: { left: '12%', top: '48%' },
      MCL: { left: '32%', top: '48%' },
      MCC: { left: '50%', top: '36%' },
      MCR: { left: '68%', top: '48%' },
      WBR: { left: '88%', top: '48%' },
      STCL: { left: '33%', top: '16%' },
      STCR: { left: '67%', top: '16%' },
    },
    "442": {
      GK: { left: '50%', top: '88%' },
      DFL: { left: '16%', top: '70%' },
      DFCL: { left: '38%', top: '72%' },
      DFCR: { left: '62%', top: '72%' },
      DFR: { left: '84%', top: '70%' },
      ML: { left: '16%', top: '44%' },
      MCL: { left: '38%', top: '46%' },
      MCR: { left: '62%', top: '46%' },
      MR: { left: '84%', top: '44%' },
      STCL: { left: '33%', top: '16%' },
      STCR: { left: '67%', top: '16%' },
    }
  };
  return coords[formationKey]?.[posKey] || { left: '50%', top: '50%' };
};

export function PitchView({ activeFormation, players, assignments, onSelectPosition, activePositionKey }: PitchViewProps) {
  
  // Helper to extract player's last name or short name
  const getPlayerShortName = (playerId: string | null): string => {
    if (!playerId) return "Vacío";
    const player = players.find(p => p.id === playerId);
    if (!player) return "Vacío";
    
    // Split name and return last part or first name if single word
    const parts = player.name.split(' ');
    if (parts.length > 1) {
      // Return e.g. "Lewandowski" or "De Jong"
      return parts.slice(-1)[0];
    }
    return player.name;
  };

  return (
    <div id="pitch-container" className="w-full relative overflow-hidden bg-slate-950 p-1 md:p-4 rounded-2xl border border-slate-800">
      
      {/* Visual Header */}
      <div className="flex justify-between items-center mb-3 px-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs font-semibold text-slate-400 font-mono">Pizarra Táctica</span>
        </div>
        <span className="text-xs bg-slate-900 border border-slate-800 text-emerald-400 px-2 py-0.5 rounded-full font-mono">
          {activeFormation.name}
        </span>
      </div>

      {/* Grid Pitch */}
      <div className="relative w-full aspect-[4/3] bg-radial from-emerald-800 to-emerald-950 border-2 border-emerald-600 rounded-xl shadow-inner overflow-hidden select-none">
        
        {/* Field Markings */}
        {/* Pitch Stripes */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.06)_50%,transparent_50%)] bg-[size:100%_40px] pointer-events-none" />
        
        {/* Halfway Line */}
        <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-emerald-400/40 transform -translate-y-1/2 pointer-events-none" />
        
        {/* Center Circle */}
        <div className="absolute top-1/2 left-1/2 w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-emerald-400/40 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
        
        {/* Penalty Area Top */}
        <div className="absolute top-0 left-1/2 w-48 h-16 md:w-64 md:h-24 border-2 border-t-0 border-emerald-400/40 transform -translate-x-1/2 pointer-events-none" />
        {/* Goal Area Top */}
        <div className="absolute top-0 left-1/2 w-20 h-6 md:w-28 md:h-8 border-2 border-t-0 border-emerald-400/40 transform -translate-x-1/2 pointer-events-none" />
        
        {/* Penalty Area Bottom */}
        <div className="absolute bottom-0 left-1/2 w-48 h-16 md:w-64 md:h-24 border-2 border-b-0 border-emerald-400/40 transform -translate-x-1/2 pointer-events-none" />
        {/* Goal Area Bottom */}
        <div className="absolute bottom-0 left-1/2 w-20 h-6 md:w-28 md:h-8 border-2 border-b-0 border-emerald-400/40 transform -translate-x-1/2 pointer-events-none" />

        {/* Positions Nodes */}
        {activeFormation.positions.map((pos) => {
          const style = getPositionStyle(activeFormation.key, pos.key);
          const posAssign = assignments[pos.key] || { titular: null, suplente: null, juvenil: null };
          
          const isSelected = activePositionKey === pos.key;
          const isFullyCovered = posAssign.titular && posAssign.suplente && posAssign.juvenil;
          const isPartiallyCovered = posAssign.titular || posAssign.suplente || posAssign.juvenil;

          return (
            <div
              key={pos.key}
              style={{ left: style.left, top: style.top }}
              onClick={() => onSelectPosition(pos)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 
                w-[74px] md:w-[94px] p-1.5 rounded-lg border-2 text-center shadow-lg
                ${isSelected 
                  ? 'bg-slate-900 border-yellow-400 ring-4 ring-yellow-400/20 scale-105' 
                  : isFullyCovered 
                    ? 'bg-slate-900/90 hover:bg-slate-900 border-emerald-500 hover:scale-102' 
                    : isPartiallyCovered
                      ? 'bg-slate-900/85 hover:bg-slate-900 border-blue-500 hover:scale-102'
                      : 'bg-slate-900/80 hover:bg-slate-900 border-rose-600 animate-pulse hover:animate-none'
                }
              `}
            >
              {/* Position Header */}
              <div className="flex items-center justify-between gap-1 mb-1 border-b border-slate-800 pb-0.5">
                <span className="text-[10px] md:text-xs font-bold text-white font-mono tracking-wide uppercase">
                  {pos.shortLabel}
                </span>
                {!isFullyCovered && (
                  <AlertCircle className="w-2.5 h-2.5 text-rose-400" title="Posición incompleta (requiere 3 jugadores)" />
                )}
              </div>

              {/* Cover Slots Summary */}
              <div className="flex flex-col gap-0.5 text-left text-[9px] md:text-[10px] font-mono select-none">
                {/* Titular */}
                <div className="flex justify-between items-center truncate">
                  <span className="text-emerald-400 font-bold mr-1">T:</span>
                  <span className={`truncate flex-1 text-right ${posAssign.titular ? 'text-slate-100 font-medium' : 'text-slate-500 italic'}`}>
                    {getPlayerShortName(posAssign.titular)}
                  </span>
                </div>
                {/* Suplente */}
                <div className="flex justify-between items-center truncate">
                  <span className="text-amber-400 font-bold mr-1">S:</span>
                  <span className={`truncate flex-1 text-right ${posAssign.suplente ? 'text-slate-100 font-medium' : 'text-slate-500 italic'}`}>
                    {getPlayerShortName(posAssign.suplente)}
                  </span>
                </div>
                {/* Juvenil */}
                <div className="flex justify-between items-center truncate">
                  <span className="text-cyan-400 font-bold mr-1">J:</span>
                  <span className={`truncate flex-1 text-right ${posAssign.juvenil ? 'text-slate-100 font-medium' : 'text-slate-500 italic'}`}>
                    {getPlayerShortName(posAssign.juvenil)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
