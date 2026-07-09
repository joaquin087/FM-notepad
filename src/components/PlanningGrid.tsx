import React, { useState, useMemo } from 'react';
import { Player } from '../types';
import { getFlagEmoji, isTurkishPlayer } from '../utils/flags';
import { 
  Users, 
  Plus, 
  X, 
  Trash2, 
  HelpCircle, 
  Search, 
  Check, 
  ChevronDown, 
  Sparkles, 
  Filter, 
  UserMinus, 
  ArrowRightLeft,
  MessageSquare,
  Bookmark,
  TrendingUp,
  Sliders,
  DollarSign
} from 'lucide-react';

interface PlanningGridProps {
  players: Player[];
  onUpdatePlayer: (updatedPlayer: Player) => void;
  onUpdatePlayersBatch: (updatedPlayers: Player[]) => void;
}

export const SQUAD_CATEGORIES = [
  { key: 'titular', label: 'Titular', textColor: 'text-emerald-400', bgColor: 'bg-emerald-950/20', borderColor: 'border-emerald-500/30', headerColor: 'border-l-4 border-l-emerald-500' },
  { key: 'suplente', label: 'Suplente', textColor: 'text-amber-400', bgColor: 'bg-amber-950/20', borderColor: 'border-amber-500/30', headerColor: 'border-l-4 border-l-amber-500' },
  { key: 'juvenil', label: 'Juvenil', textColor: 'text-cyan-400', bgColor: 'bg-cyan-950/20', borderColor: 'border-cyan-500/30', headerColor: 'border-l-4 border-l-cyan-500' },
  { key: 'recambio', label: 'Recambio', textColor: 'text-slate-200', bgColor: 'bg-slate-900/50', borderColor: 'border-slate-800', headerColor: 'border-l-4 border-l-slate-400' },
  { key: 'cedidos', label: 'Cedidos', textColor: 'text-violet-400', bgColor: 'bg-violet-950/20', borderColor: 'border-violet-500/30', headerColor: 'border-l-4 border-l-violet-500' },
  { key: 'aceder', label: 'A ceder', textColor: 'text-purple-400', bgColor: 'bg-purple-950/20', borderColor: 'border-purple-500/30', headerColor: 'border-l-4 border-l-purple-500' },
  { key: 'venta', label: 'Venta', textColor: 'text-rose-400', bgColor: 'bg-rose-950/20', borderColor: 'border-rose-500/30', headerColor: 'border-l-4 border-l-rose-500' },
  { key: 'desarrollo', label: 'Desarrollo', textColor: 'text-blue-400', bgColor: 'bg-blue-950/20', borderColor: 'border-blue-500/30', headerColor: 'border-l-4 border-l-blue-500' },
  { key: 'descartes', label: 'Descartes', textColor: 'text-slate-500', bgColor: 'bg-slate-950/40', borderColor: 'border-slate-900', headerColor: 'border-l-4 border-l-slate-700' },
] as const;

export const POSITION_COLUMNS = [
  { key: 'GK', label: 'GK', name: 'Arquero' },
  { key: 'DFCD', label: 'DFCD', name: 'Defensor Central Der.' },
  { key: 'DFCI', label: 'DFCI', name: 'Defensor Central Izq.' },
  { key: 'WR', label: 'WR', name: 'Carrilero Derecho' },
  { key: 'DM', label: 'DM', name: 'Pivote Defensivo' },
  { key: 'WL', label: 'WL', name: 'Carrilero Izquierdo' },
  { key: 'MC', label: 'MC', name: 'Mediocentro' },
  { key: 'MPC', label: 'MPC', name: 'Mediapunta Centro' },
  { key: 'MPI', label: 'MPI', name: 'Extremo Izquierdo' },
  { key: 'MPD', label: 'MPD', name: 'Extremo Derecho' },
  { key: 'DLC', label: 'DLC', name: 'Delantero Centro' }
] as const;

// Helper function to auto-detect the best column from actual FM position
export const getAutoColumn = (posStr: string): string => {
  const p = posStr.toUpperCase();
  if (p.includes("GK") || p.includes("POR")) return "GK";
  
  // Center defenders
  if (p.includes("D (C)") || p.includes("DFC")) {
    return "DFCD"; // Default to DFCD, user can move to DFCI
  }
  
  // Full backs / Wing backs Right
  if (p.includes("D (R)") || p.includes("DF D") || p.includes("LD") || p.includes("DFR") || p.includes("WR") || p.includes("WBR") || p.includes("CRD")) {
    return "WR";
  }
  
  // Full backs / Wing backs Left
  if (p.includes("D (L)") || p.includes("DF I") || p.includes("LI") || p.includes("DFL") || p.includes("WL") || p.includes("WBL") || p.includes("CRI")) {
    return "WL";
  }
  
  // Defensive midfielder
  if (p.includes("DM") || p.includes("MCD")) return "DM";
  
  // Midfielder Central
  if (p.includes("M (C)") || p.includes("MC")) return "MC";
  
  // Attacking midfielders
  if (p.includes("AM (C)") || p.includes("AMC") || p.includes("MP C") || p.includes("MPC") || p.includes("ENG")) return "MPC";
  if (p.includes("AM (L)") || p.includes("AML") || p.includes("MP I") || p.includes("MPI") || p.includes("EXT I")) return "MPI";
  if (p.includes("AM (R)") || p.includes("AMR") || p.includes("MP D") || p.includes("MPD") || p.includes("EXT D")) return "MPD";
  
  // Strikers
  if (p.includes("ST") || p.includes("DL") || p.includes("DLC") || p.includes("ST (C)")) return "DLC";
  
  return "MC"; // Fallback
};

export function PlanningGrid({ players, onUpdatePlayer, onUpdatePlayersBatch }: PlanningGridProps) {
  // UI states
  const [activeCell, setActiveCell] = useState<{ rowKey: string; colKey: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [filterUnassignedOnly, setFilterUnassignedOnly] = useState(true);

  // Active players (excluding those who are Bajas)
  const activePlayers = useMemo(() => {
    return players.filter(p => p.squadStatus !== 'baja');
  }, [players]);

  // Group players by assigned position and status for instant O(1) grid queries
  const gridData = useMemo(() => {
    const map: Record<string, Player[]> = {};
    activePlayers.forEach(p => {
      if (p.squadStatus && p.squadStatus !== 'no_asignado' && p.assignedPosition) {
        const key = `${p.squadStatus}_${p.assignedPosition}`;
        if (!map[key]) map[key] = [];
        map[key].push(p);
      }
    });
    return map;
  }, [activePlayers]);

  // Unassigned players list
  const unassignedPlayers = useMemo(() => {
    return activePlayers.filter(p => !p.assignedPosition || p.squadStatus === 'no_asignado');
  }, [activePlayers]);

  // Quick Action: Auto assign all unclassified/unassigned players based on their FM position!
  const handleAutoAlignAll = () => {
    if (confirm('¿Quieres alinear automáticamente a todos los jugadores sin categoría en las columnas de la matriz según su posición de Football Manager? No modificará a los ya asignados.')) {
      const updated = players.map(p => {
        if (!p.assignedPosition || p.squadStatus === 'no_asignado') {
          // Find their category
          const defaultCat = p.squadStatus !== 'no_asignado' ? p.squadStatus : 'recambio';
          const detectedCol = getAutoColumn(p.position);
          return {
            ...p,
            squadStatus: defaultCat,
            assignedPosition: detectedCol
          };
        }
        return p;
      });
      onUpdatePlayersBatch(updated);
    }
  };

  // Quick Action: Reset entire board
  const handleResetBoard = () => {
    if (confirm('🚨 ¿Estás seguro de que quieres limpiar la matriz de planeamiento? Todos los jugadores quedarán "Sin Asignar" en la lista lateral. No borrará los stats de los jugadores.')) {
      const updated = players.map(p => ({
        ...p,
        squadStatus: 'no_asignado' as const,
        assignedPosition: undefined
      }));
      onUpdatePlayersBatch(updated);
    }
  };

  // Assign player to cell
  const handleAssignToCell = (player: Player, rowKey: string, colKey: string) => {
    const updated = {
      ...player,
      squadStatus: rowKey as any,
      assignedPosition: colKey
    };
    onUpdatePlayer(updated);
    setActiveCell(null);
    setSearchQuery('');
  };

  // Unassign player from cell
  const handleUnassignPlayer = (player: Player) => {
    const updated = {
      ...player,
      squadStatus: 'no_asignado' as const,
      assignedPosition: undefined
    };
    onUpdatePlayer(updated);
    setSelectedPlayer(null);
  };

  // Move player from cell
  const handleMovePlayer = (player: Player, targetRow: string, targetCol: string) => {
    const updated = {
      ...player,
      squadStatus: targetRow as any,
      assignedPosition: targetCol
    };
    onUpdatePlayer(updated);
    setSelectedPlayer(null);
  };

  // Update notes of a player
  const handleUpdateNotes = (player: Player, notes: string) => {
    onUpdatePlayer({
      ...player,
      notes
    });
  };

  // Filter candidate list for assigning to cell
  const candidates = useMemo(() => {
    return activePlayers.filter(p => {
      // If we only want unassigned, filter out already assigned players
      if (filterUnassignedOnly && p.assignedPosition && p.squadStatus !== 'no_asignado') {
        return false;
      }
      
      const query = searchQuery.toLowerCase();
      return (
        p.name.toLowerCase().includes(query) ||
        p.position.toLowerCase().includes(query) ||
        p.id.includes(query)
      );
    });
  }, [activePlayers, searchQuery, filterUnassignedOnly]);

  return (
    <div className="space-y-6">
      
      {/* Top action dashboard & control guide */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900 p-5 rounded-2xl border border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Users className="text-emerald-500 w-5.5 h-5.5" /> Matriz de Planeamiento Deportivo
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Delinea y ordena tu plantel por jerarquías y posiciones tácticas exactas. Haz clic en cualquier casilla para sumar un jugador de tu plantilla, u organiza todo automáticamente con un clic.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2 self-stretch md:self-auto">
          <button
            onClick={handleAutoAlignAll}
            className="flex-1 md:flex-none px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950/20"
          >
            <Sparkles className="w-3.5 h-3.5" /> Alinear Automático
          </button>
          <button
            onClick={handleResetBoard}
            className="flex-1 md:flex-none px-4 py-2 bg-slate-800 hover:bg-slate-700 hover:text-rose-400 text-slate-400 font-semibold rounded-xl text-xs transition flex items-center justify-center gap-1.5"
            title="Limpiar toda la pizarra"
          >
            <Trash2 className="w-3.5 h-3.5" /> Limpiar Matriz
          </button>
        </div>
      </div>

      {/* Main Grid Structure and sidebar container */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* SQUAD PLANNING BOARD GRID (Left, 9 cols) */}
        <div className="xl:col-span-9 bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          
          {/* Scrollable Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left min-w-[900px]">
              
              {/* Header row containing Positions */}
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800">
                  <th className="p-3 text-[10px] uppercase tracking-wider font-mono font-bold text-slate-400 w-36 bg-slate-900 sticky left-0 z-10 border-r border-slate-800">
                    Estatus / Categoría
                  </th>
                  {POSITION_COLUMNS.map(col => (
                    <th key={col.key} className="p-3 text-center border-r border-slate-850/50 min-w-[85px] group">
                      <div className="text-xs font-bold text-white tracking-wide">{col.key}</div>
                      <div className="text-[9px] text-slate-500 font-mono font-medium truncate max-w-[85px]" title={col.name}>
                        {col.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>

              {/* Rows representing Categories */}
              <tbody className="divide-y divide-slate-850">
                {SQUAD_CATEGORIES.map(row => {
                  return (
                    <tr key={row.key} className="hover:bg-slate-900/30 transition-colors">
                      
                      {/* Row Left Label */}
                      <td className={`p-3 font-semibold text-xs font-sans sticky left-0 z-10 bg-slate-950 border-r border-slate-800 ${row.headerColor} ${row.textColor}`}>
                        <div className="flex flex-col justify-center">
                          <span>{row.label}</span>
                          <span className="text-[9px] text-slate-500 font-mono font-normal">
                            {activePlayers.filter(p => p.squadStatus === row.key).length} jug.
                          </span>
                        </div>
                      </td>

                      {/* Cells for each Position */}
                      {POSITION_COLUMNS.map(col => {
                        const cellKey = `${row.key}_${col.key}`;
                        const cellPlayers = gridData[cellKey] || [];

                        return (
                          <td 
                            key={col.key} 
                            className={`p-1.5 border-r border-slate-850/40 relative min-w-[90px] h-16 hover:bg-slate-900/40 transition group`}
                          >
                            <div className="h-full w-full flex flex-col justify-between">
                              
                              {/* Player items inside this cell */}
                              <div className="space-y-1">
                                {cellPlayers.map(p => {
                                  // Determine capability color badge
                                  const ratingColor = p.currentAbility >= 4.5 ? 'text-amber-400' : p.currentAbility >= 3.5 ? 'text-emerald-400' : 'text-slate-400';
                                  const isTurkish = isTurkishPlayer(p.nationality);
                                  const flag = getFlagEmoji(p.nationality);

                                  return (
                                    <div 
                                      key={p.id}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedPlayer(p);
                                      }}
                                      className={`p-1 rounded-lg border cursor-pointer transition flex flex-col justify-between shadow-sm relative group/item ${
                                        isTurkish
                                          ? 'bg-red-950/20 border-red-500/40 shadow-[0_0_6px_rgba(239,68,68,0.2)] hover:border-red-500 hover:bg-red-950/30'
                                          : 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 hover:bg-slate-850'
                                      }`}
                                    >
                                      {/* Player Name */}
                                      <div className="text-[10px] font-bold text-slate-100 truncate pr-2.5 leading-tight flex items-center gap-1" title={`${p.name} (${p.nationality})`}>
                                        <span className="text-[9px]" title={p.nationality}>{flag}</span>
                                        <span className="truncate">{p.name.split(' ').pop() || p.name}</span>
                                      </div>
                                      
                                      {/* Ability, Age */}
                                      <div className="flex justify-between items-center text-[8px] font-mono mt-0.5 text-slate-400">
                                        <span className={ratingColor}>{p.currentAbility}★</span>
                                        <span>{p.age}a</span>
                                      </div>

                                      {/* Small remove icon on hover */}
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleUnassignPlayer(p);
                                        }}
                                        className="absolute right-0.5 top-0.5 w-3 h-3 text-slate-600 hover:text-rose-400 rounded-full flex items-center justify-center bg-slate-950/80 scale-0 group-hover/item:scale-100 transition z-10"
                                        title="Quitar de esta casilla"
                                      >
                                        <X className="w-2 h-2" />
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Click-to-add overlay icon inside cell if empty or to add secondary player */}
                              {cellPlayers.length < 3 && (
                                <button
                                  onClick={() => setActiveCell({ rowKey: row.key, colKey: col.key })}
                                  className="w-full py-0.5 rounded border border-dashed border-slate-850 hover:border-slate-700 bg-transparent flex items-center justify-center opacity-0 group-hover:opacity-100 transition self-end mt-auto text-[8px] font-mono text-slate-500 hover:text-emerald-400 font-bold"
                                >
                                  <Plus className="w-2.5 h-2.5 mr-0.5" /> Sumar
                                </button>
                              )}

                            </div>
                          </td>
                        );
                      })}

                    </tr>
                  );
                })}
              </tbody>

            </table>
          </div>

          {/* Table Footer with overall column metrics */}
          <div className="bg-slate-900 p-3 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
            <span className="font-mono text-[10px] flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Almacenamiento local activo y sincronizado en tiempo real.
            </span>
            <span className="text-[10px]">
              Total asignados: <strong className="text-emerald-400">{activePlayers.filter(p => p.assignedPosition && p.squadStatus !== 'no_asignado').length}</strong> / {activePlayers.length} jugadores
            </span>
          </div>

        </div>

        {/* UNASSIGNED PLAYERS SIDEBAR (Right, 3 cols) */}
        <div className="xl:col-span-3 space-y-4">
          
          {/* Quick Stats Widget */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400 mb-2.5">
              Balance General
            </h3>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 block uppercase font-mono">Titulares</span>
                <span className="text-base font-bold text-emerald-400 font-sans">
                  {activePlayers.filter(p => p.squadStatus === 'titular').length}
                </span>
                <span className="text-[9px] text-slate-500 block">/ 11 de gala</span>
              </div>
              <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-850">
                <span className="text-[9px] text-slate-500 block uppercase font-mono">Suplentes</span>
                <span className="text-base font-bold text-amber-400 font-sans">
                  {activePlayers.filter(p => p.squadStatus === 'suplente').length}
                </span>
                <span className="text-[9px] text-slate-500 block">en el banco</span>
              </div>
            </div>
          </div>

          {/* List of Players "Sin Clasificar" */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col max-h-[500px]">
            <div className="p-3.5 bg-slate-850 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-white flex items-center gap-1.5 uppercase font-mono">
                  <UserMinus className="w-3.5 h-3.5 text-slate-400" /> Sin Clasificar ({unassignedPlayers.length})
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">Usa estos jugadores para llenar la cuadrícula.</p>
              </div>
            </div>

            {/* List scroll container */}
            <div className="p-2 overflow-y-auto divide-y divide-slate-850">
              {unassignedPlayers.length === 0 ? (
                <div className="p-6 text-center text-[11px] text-slate-500 italic">
                  ¡Todos los jugadores están asignados en la matriz!
                </div>
              ) : (
                unassignedPlayers.map(p => {
                  const autoCol = getAutoColumn(p.position);
                  return (
                    <div 
                      key={p.id}
                      className="p-2 hover:bg-slate-850/50 rounded-lg flex items-center justify-between gap-2 group transition text-xs"
                    >
                      <div className="truncate flex-1">
                        <div className="font-bold text-white truncate">{p.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                          <span className="text-emerald-400 font-bold">{p.position}</span>
                          <span>•</span>
                          <span>{p.age} años</span>
                        </div>
                      </div>

                      {/* Dropdown/Buttons to quickly place in a cell */}
                      <div className="flex gap-1 shrink-0">
                        {/* Auto-suggest button */}
                        <button
                          onClick={() => handleAssignToCell(p, 'recambio', autoCol)}
                          className="px-1.5 py-1 bg-emerald-950/20 text-emerald-400 border border-emerald-900/40 hover:bg-emerald-900 hover:text-white rounded text-[9px] font-mono font-bold transition flex items-center gap-0.5"
                          title={`Asignar automáticamente a Recambio / columna ${autoCol}`}
                        >
                          Alinear
                        </button>
                        
                        {/* Manual placement click trigger */}
                        <button
                          onClick={() => {
                            setSelectedPlayer(p);
                          }}
                          className="p-1 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded text-slate-400 hover:text-white transition"
                          title="Ubicar de forma manual"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL 1: ADD PLAYER TO SPECIFIC CELL [rowKey, colKey] */}
      {activeCell && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
            
            {/* Header */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-center">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-500" /> Ubicar Jugador en la Celda
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Fila: <span className="text-emerald-400 font-bold uppercase">{activeCell.rowKey}</span> • Columna: <span className="text-emerald-400 font-bold">{activeCell.colKey}</span>
                </p>
              </div>
              <button 
                onClick={() => {
                  setActiveCell(null);
                  setSearchQuery('');
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Filters */}
            <div className="p-3 bg-slate-900/50 border-b border-slate-850 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-600" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, posición..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                  autoFocus
                />
              </div>

              {/* Filter unassigned check */}
              <label className="flex items-center gap-1.5 cursor-pointer text-[10px] text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={filterUnassignedOnly}
                  onChange={(e) => setFilterUnassignedOnly(e.target.checked)}
                  className="rounded border-slate-800 bg-slate-950 text-emerald-600 focus:ring-0 focus:ring-offset-0"
                />
                <span>Mostrar solo jugadores "Sin Clasificar"</span>
              </label>
            </div>

            {/* List candidate players */}
            <div className="flex-1 overflow-y-auto p-2 divide-y divide-slate-850">
              {candidates.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-500 italic">
                  No se encontraron jugadores que coincidan con la búsqueda.
                </div>
              ) : (
                candidates.map(p => {
                  const autoCol = getAutoColumn(p.position);
                  const isMatchingColumn = autoCol === activeCell.colKey;

                  return (
                    <div 
                      key={p.id}
                      onClick={() => handleAssignToCell(p, activeCell.rowKey, activeCell.colKey)}
                      className={`p-2.5 hover:bg-slate-900 rounded-xl cursor-pointer flex justify-between items-center transition
                        ${isMatchingColumn ? 'bg-emerald-950/5' : ''}
                      `}
                    >
                      <div>
                        <div className="font-bold text-xs text-white flex items-center gap-1.5">
                          {p.name}
                          {isMatchingColumn && (
                            <span className="text-[8px] bg-emerald-950 border border-emerald-900 text-emerald-400 px-1 py-0.2 rounded uppercase font-mono font-bold">
                              Posición Compatible
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          {p.position} • {p.age} años • {p.currentAbility}★ CA
                        </div>
                      </div>

                      <div className="text-right text-[10px] font-mono text-slate-400">
                        {p.squadStatus && p.squadStatus !== 'no_asignado' ? (
                          <span className="text-amber-500/80">Reasignar ({p.squadStatus})</span>
                        ) : (
                          <span className="text-emerald-400">Seleccionar</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: VIEW PLAYER CARD / ACTIONS / NOTES */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-950 border border-slate-800 w-full max-w-md rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            
            {/* Header info */}
            <div className="p-4 bg-slate-900 border-b border-slate-800 flex justify-between items-start">
              <div>
                <span className="text-[9px] bg-slate-950 border border-slate-850 text-slate-400 px-2 py-0.5 rounded font-mono">
                  ID: {selectedPlayer.id}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{selectedPlayer.name}</h3>
                <p className="text-xs text-emerald-400 font-bold">{selectedPlayer.position} • {selectedPlayer.nationality}</p>
              </div>
              <button 
                onClick={() => setSelectedPlayer(null)}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Quick stats details */}
            <div className="grid grid-cols-3 gap-2 p-4 bg-slate-900/30 border-b border-slate-850 text-center text-xs">
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Edad</span>
                <strong className="text-slate-200">{selectedPlayer.age} años</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Sueldo</span>
                <strong className="text-slate-200">{selectedPlayer.wage}</strong>
              </div>
              <div className="p-2 bg-slate-950 rounded-lg border border-slate-850">
                <span className="text-[10px] text-slate-500 block uppercase font-mono">Valoración</span>
                <strong className="text-slate-200">{selectedPlayer.marketValue}</strong>
              </div>
            </div>

            {/* Star ratings */}
            <div className="p-4 border-b border-slate-850 flex justify-around text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">CA:</span>
                <div className="flex text-amber-400 font-bold">
                  {Array.from({ length: selectedPlayer.currentAbility }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                  {Array.from({ length: 5 - selectedPlayer.currentAbility }).map((_, i) => (
                    <span key={i} className="text-slate-800">★</span>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500 font-semibold">PA:</span>
                <div className="flex text-cyan-400 font-bold">
                  {Array.from({ length: selectedPlayer.potentialAbility }).map((_, i) => (
                    <span key={i}>★</span>
                  ))}
                  {Array.from({ length: 5 - selectedPlayer.potentialAbility }).map((_, i) => (
                    <span key={i} className="text-slate-800">★</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Planning position relocation selectors */}
            <div className="p-4 space-y-3">
              <label className="text-[10px] font-bold font-mono text-slate-400 uppercase block">Reubicar en la Matriz</label>
              
              {/* Row Selector */}
              <div>
                <span className="text-[9px] text-slate-500 block mb-1">Categoría (Fila)</span>
                <div className="grid grid-cols-4 gap-1.5">
                  {SQUAD_CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => handleMovePlayer(selectedPlayer, cat.key, selectedPlayer.assignedPosition || getAutoColumn(selectedPlayer.position))}
                      className={`py-1 rounded text-[10px] font-semibold border transition
                        ${selectedPlayer.squadStatus === cat.key 
                          ? `${cat.bgColor} ${cat.borderColor} ${cat.textColor} font-bold ring-1 ring-emerald-500/30` 
                          : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                        }
                      `}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Column Selector */}
              <div>
                <span className="text-[9px] text-slate-500 block mb-1">Posición Táctica (Columna)</span>
                <div className="flex flex-wrap gap-1">
                  {POSITION_COLUMNS.map(col => (
                    <button
                      key={col.key}
                      onClick={() => handleMovePlayer(selectedPlayer, selectedPlayer.squadStatus || 'recambio', col.key)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border transition
                        ${selectedPlayer.assignedPosition === col.key 
                          ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-400' 
                          : 'bg-slate-900 border-slate-850 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
                        }
                      `}
                    >
                      {col.key}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Notes Textarea */}
            <div className="px-4 pb-4">
              <label className="text-[10px] font-bold font-mono text-slate-400 uppercase block mb-1">Notas / Informe sobre el jugador</label>
              <textarea
                rows={2}
                value={selectedPlayer.notes || ''}
                onChange={(e) => handleUpdateNotes(selectedPlayer, e.target.value)}
                placeholder="Ej: Futura promesa, para ceder el próximo mercado, o pieza fundamental..."
                className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-xs text-slate-300 placeholder-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Modal Actions */}
            <div className="p-3 bg-slate-900 border-t border-slate-800 flex justify-between items-center">
              <button
                onClick={() => handleUnassignPlayer(selectedPlayer)}
                className="px-3 py-1.5 bg-rose-950/20 hover:bg-rose-900/40 border border-rose-900/30 hover:border-rose-900/50 text-rose-400 text-xs font-semibold rounded-lg transition flex items-center gap-1"
              >
                <UserMinus className="w-3.5 h-3.5" /> Quitar de la Matriz
              </button>
              
              <button
                onClick={() => setSelectedPlayer(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition"
              >
                Cerrar
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
