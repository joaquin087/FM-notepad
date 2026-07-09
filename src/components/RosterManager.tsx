import React, { useState } from 'react';
import { Player } from '../types';
import { getFlagEmoji, isTurkishPlayer, formatRatingWithPercentage, getPlayerFlags, calculateAgeFromDOB, calculateContractYearsRemaining } from '../utils/flags';
import { Search, Filter, Plus, Trash2, Edit3, Check, X, Star, AlertCircle, RefreshCw, Trash } from 'lucide-react';

interface RosterManagerProps {
  players: Player[];
  onUpdatePlayer: (player: Player) => void;
  onAddPlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
  onResetToDefaults: () => void;
  onDeleteAllPlayers: () => void;
  gameYear: number;
}

export function RosterManager({ players, onUpdatePlayer, onAddPlayer, onDeletePlayer, onResetToDefaults, onDeleteAllPlayers, gameYear }: RosterManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAdding, setIsAdding] = useState(false);

  // Sorting state
  const [sortField, setSortField] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Inline confirmations and form errors
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [confirmResetBase, setConfirmResetBase] = useState(false);
  const [confirmBajaId, setConfirmBajaId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  // Helper to parse wage to numeric weekly wage
  const parseWageToNumeric = (wageStr: string): number => {
    if (!wageStr) return 0;
    const clean = wageStr.replace(/\s/g, '').toLowerCase();
    const parsedNum = clean.replace(/[^0-9.]/g, '');
    let numberPart = parseFloat(parsedNum);
    if (isNaN(numberPart)) return 0;
    if (clean.includes('k')) {
      numberPart *= 1000;
    } else if (clean.includes('m')) {
      numberPart *= 1000000;
    }
    return numberPart;
  };

  // Helper to parse market value to numeric
  const parseMarketValueToNumeric = (valStr: string): number => {
    if (!valStr) return 0;
    const clean = valStr.replace(/\s/g, '').toLowerCase();
    const parsedNum = clean.replace(/[^0-9.]/g, '');
    let numberPart = parseFloat(parsedNum);
    if (isNaN(numberPart)) return 0;
    if (clean.includes('k')) {
      numberPart *= 1000;
    } else if (clean.includes('m')) {
      numberPart *= 1000000;
    }
    return numberPart;
  };

  // Helper to parse ability input (stars, percentage or 1-200 score)
  const parseAbilityInput = (valStr: string): { stars: number; rawRating: string } => {
    const clean = valStr.trim();
    if (!clean) return { stars: 2, rawRating: '' };
    
    // If it contains percentage
    if (clean.includes('%')) {
      const parsedPct = parseFloat(clean);
      if (!isNaN(parsedPct)) {
        const stars = Math.max(1, Math.min(5, Math.round((parsedPct / 100) * 5)));
        return { stars, rawRating: clean };
      }
    }

    const num = parseInt(clean);
    if (isNaN(num)) {
      return { stars: 2, rawRating: '' };
    }

    if (num > 5) {
      // scale 1-200
      const stars = Math.max(1, Math.min(5, Math.round((num / 200) * 5)));
      return { stars, rawRating: String(num) };
    } else {
      // stars (1-5)
      return { stars: Math.max(1, Math.min(5, num)), rawRating: String(num) };
    }
  };

  // New player temporary state
  const [newPlayer, setNewPlayer] = useState<Omit<Player, 'id'>>({
    name: '',
    age: 18,
    position: 'M (C)',
    nationality: 'Argentina',
    currentAbility: 2,
    potentialAbility: 4,
    marketValue: '€1.5M',
    wage: '€8K/sem',
    squadStatus: 'no_asignado',
    notes: '',
    contractEnd: '30/6/2028',
    dateOfBirth: '18/12/2001',
    club: '',
    bestRating: '',
    bestPotRating: ''
  });

  const [newCaInput, setNewCaInput] = useState('120');
  const [newPaInput, setNewPaInput] = useState('160');
  const [customId, setCustomId] = useState('');
  const [contractEndInput, setContractEndInput] = useState('30/6/2028');
  const [dateOfBirthInput, setDateOfBirthInput] = useState('18/12/2001');
  const [clubInput, setClubInput] = useState('');

  const [editCaInput, setEditCaInput] = useState('');
  const [editPaInput, setEditPaInput] = useState('');

  // Unique list of positions for filter
  const positionsList = ['ALL', 'GK', 'D (C)', 'D (L)', 'D (R)', 'DM', 'M (C)', 'AM (L)', 'AM (R)', 'AM (C)', 'ST (C)'];
  const statusLabels: Record<string, string> = {
    'titular': '🟢 Titular',
    'suplente': '🟡 Suplente',
    'juvenil': '🔵 Juvenil',
    'recambio': '🔄 Recambio',
    'cedidos': '✈️ Cedido',
    'aceder': '📋 A ceder',
    'venta': '💰 Venta',
    'desarrollo': '🌱 Desarrollo',
    'descartes': '❌ Descarte',
    'no_asignado': '⚪ Sin Asignar',
    'baja': '📉 Baja del Club'
  };

  // Filter players
  const activeRosterPlayers = players.filter(p => p.squadStatus !== 'baja');
  const bajasPlayers = players.filter(p => p.squadStatus === 'baja');

  const filteredPlayers = activeRosterPlayers.filter(player => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          player.id.includes(searchTerm) ||
                          player.nationality.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Position filters. Support simple inclusion check
    const matchesPosition = positionFilter === 'ALL' || 
                            player.position.toLowerCase() === positionFilter.toLowerCase() ||
                            player.position.toLowerCase().includes(positionFilter.toLowerCase());
                            
    const matchesStatus = statusFilter === 'ALL' || player.squadStatus === statusFilter;

    return matchesSearch && matchesPosition && matchesStatus;
  });

  // Calculate sortedPlayers
  const sortedPlayers = [...filteredPlayers].sort((a, b) => {
    if (!sortField) return 0;

    let valA: any = '';
    let valB: any = '';

    switch (sortField) {
      case 'id':
        const numA = parseInt(a.id);
        const numB = parseInt(b.id);
        if (!isNaN(numA) && !isNaN(numB)) {
          valA = numA;
          valB = numB;
        } else {
          valA = a.id;
          valB = b.id;
        }
        break;
      case 'name':
        valA = a.name.toLowerCase();
        valB = b.name.toLowerCase();
        break;
      case 'nationality':
        valA = a.nationality.toLowerCase();
        valB = b.nationality.toLowerCase();
        break;
      case 'position':
        valA = a.position.toLowerCase();
        valB = b.position.toLowerCase();
        break;
      case 'age':
        valA = a.age;
        valB = b.age;
        break;
      case 'wage':
        valA = parseWageToNumeric(a.wage);
        valB = parseWageToNumeric(b.wage);
        break;
      case 'marketValue':
        valA = parseMarketValueToNumeric(a.marketValue);
        valB = parseMarketValueToNumeric(b.marketValue);
        break;
      case 'ca':
        valA = a.currentAbility;
        valB = b.currentAbility;
        break;
      case 'pa':
        valA = a.potentialAbility;
        valB = b.potentialAbility;
        break;
      case 'contractEnd':
        valA = (a.contractEnd || '').toLowerCase();
        valB = (b.contractEnd || '').toLowerCase();
        break;
      case 'dateOfBirth':
        valA = (a.dateOfBirth || '').toLowerCase();
        valB = (b.dateOfBirth || '').toLowerCase();
        break;
      case 'squadStatus':
        valA = (a.squadStatus || '').toLowerCase();
        valB = (b.squadStatus || '').toLowerCase();
        break;
      default:
        return 0;
    }

    if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
    if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });

  const handleEditClick = (player: Player) => {
    setEditingPlayer({ ...player });
    setEditCaInput(player.bestRating || String(player.currentAbility * 40));
    setEditPaInput(player.bestPotRating || String(player.potentialAbility * 40));
    setFormError('');
  };

  const handleSaveEdit = () => {
    if (editingPlayer) {
      if (!editingPlayer.name.trim()) {
        setFormError("El nombre del jugador es requerido.");
        return;
      }
      
      const parsedCa = parseAbilityInput(editCaInput);
      const parsedPa = parseAbilityInput(editPaInput);

      const updatedPlayer: Player = {
        ...editingPlayer,
        currentAbility: parsedCa.stars,
        potentialAbility: parsedPa.stars,
        bestRating: parsedCa.rawRating,
        bestPotRating: parsedPa.rawRating,
      };

      onUpdatePlayer(updatedPlayer);
      setEditingPlayer(null);
      setFormError('');
    }
  };

  const handleCreatePlayer = () => {
    if (!newPlayer.name.trim()) {
      setFormError("El nombre del jugador es requerido.");
      return;
    }
    const generatedId = customId.trim() || String(Date.now());
    const parsedCa = parseAbilityInput(newCaInput);
    const parsedPa = parseAbilityInput(newPaInput);

    onAddPlayer({
      ...newPlayer,
      id: generatedId,
      currentAbility: parsedCa.stars,
      potentialAbility: parsedPa.stars,
      bestRating: parsedCa.rawRating,
      bestPotRating: parsedPa.rawRating,
      contractEnd: contractEndInput.trim() || 'N/A',
      dateOfBirth: dateOfBirthInput.trim() || 'N/A',
      club: clubInput.trim() || 'N/A'
    });
    setIsAdding(false);
    setFormError('');
    // Reset form
    setNewPlayer({
      name: '',
      age: 18,
      position: 'M (C)',
      nationality: 'Argentina',
      currentAbility: 2,
      potentialAbility: 4,
      marketValue: '€1.5M',
      wage: '€8K/sem',
      squadStatus: 'no_asignado',
      notes: '',
      contractEnd: '30/6/2028',
      dateOfBirth: '18/12/2001',
      club: '',
      bestRating: '',
      bestPotRating: ''
    });
    setNewCaInput('120');
    setNewPaInput('160');
    setCustomId('');
    setContractEndInput('30/6/2028');
    setDateOfBirthInput('18/12/2001');
    setClubInput('');
  };

  // Helper to render beautiful yellow stars with percentage
  const renderStarsWithPercentage = (starsCount: number, customRating?: string) => {
    let pct = `${(starsCount * 20).toFixed(1)}%`;
    if (customRating) {
      if (customRating.includes('%')) {
        pct = customRating;
      } else {
        const parsed = parseFloat(customRating);
        if (!isNaN(parsed)) {
          pct = parsed <= 100 ? `${parsed.toFixed(1)}%` : `${((parsed / 200) * 100).toFixed(1)}%`;
        }
      }
    }

    return (
      <div className="flex items-center gap-1.5 font-sans">
        <div className="flex gap-0.5 text-amber-400">
          {Array.from({ length: 5 }).map((_, i) => {
            const isFilled = i < Math.floor(starsCount);
            const isHalf = !isFilled && (starsCount - i >= 0.5);
            return (
              <div key={i} className="relative w-3.5 h-3.5 flex items-center justify-center">
                <Star 
                  className="w-3.5 h-3.5 text-slate-700 absolute" 
                />
                {isFilled && (
                  <Star 
                    className="w-3.5 h-3.5 fill-amber-400 text-amber-400 absolute" 
                  />
                )}
                {isHalf && (
                  <div className="absolute top-0 left-0 w-1/2 overflow-hidden h-3.5">
                    <Star 
                      className="w-3.5 h-3.5 fill-amber-400 text-amber-400" 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <span className="text-slate-400 text-[10px] font-sans font-medium">({pct})</span>
      </div>
    );
  };

  const renderSortHeader = (field: string, label: string, extraClass: string = '') => {
    const isSorted = sortField === field;
    return (
      <th 
        onClick={() => handleSort(field)}
        className={`px-3 py-3 font-semibold text-slate-400 hover:text-white cursor-pointer select-none transition group/hdr ${extraClass}`}
      >
        <div className="flex items-center gap-1.5">
          <span>{label}</span>
          <span className="text-[8px] text-slate-600 group-hover/hdr:text-slate-300">
            {isSorted ? (sortDirection === 'asc' ? '▲' : '▼') : '↕'}
          </span>
        </div>
      </th>
    );
  };

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🏃‍♂️ Plantilla General ({activeRosterPlayers.length} jugadores)
          </h2>
          <p className="text-xs text-slate-400">Filtra, busca y gestiona el estado contractual o deportivo de tus jugadores.</p>
        </div>
        
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsAdding(true)}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition"
          >
            <Plus className="w-3.5 h-3.5" /> Nuevo Jugador
          </button>

          {confirmDeleteAll ? (
            <div className="flex items-center gap-1 bg-rose-950/60 border border-rose-500/30 p-1 rounded-lg">
              <span className="text-[10px] font-bold text-rose-300 px-1 font-sans">¿Borrar todo?</span>
              <button
                onClick={() => {
                  onDeleteAllPlayers();
                  setConfirmDeleteAll(false);
                }}
                className="bg-rose-600 hover:bg-rose-500 text-white text-[10px] px-2 py-0.5 rounded font-bold transition"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmDeleteAll(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setConfirmDeleteAll(true);
                setConfirmResetBase(false);
              }}
              className="bg-rose-950/60 hover:bg-rose-900 text-rose-400 hover:text-rose-200 border border-rose-900/40 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-semibold transition"
            >
              <Trash className="w-3.5 h-3.5" /> Eliminar todos
            </button>
          )}
          
          {confirmResetBase ? (
            <div className="flex items-center gap-1 bg-slate-900 border border-emerald-500/30 p-1 rounded-lg">
              <span className="text-[10px] font-bold text-slate-300 px-1 font-sans">¿Restablecer?</span>
              <button
                onClick={() => {
                  onResetToDefaults();
                  setConfirmResetBase(false);
                }}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded font-bold transition"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmResetBase(false)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] px-2 py-0.5 rounded font-medium transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                setConfirmResetBase(true);
                setConfirmDeleteAll(false);
              }}
              className="border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-sans transition"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Restablecer Base
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Buscar por nombre, ID, nacionalidad..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 text-xs pl-9 pr-3 py-2 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-600 font-sans"
          />
        </div>

        {/* Position Filter */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-sans">Pos:</span>
          <select
            value={positionFilter}
            onChange={(e) => setPositionFilter(e.target.value)}
            className="w-full bg-transparent border-0 text-xs py-1.5 text-slate-200 focus:outline-none focus:ring-0 cursor-pointer font-sans"
          >
            {positionsList.map(pos => (
              <option key={pos} value={pos} className="bg-slate-900">{pos === 'ALL' ? 'Todas' : pos}</option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg px-2">
          <span className="text-[10px] uppercase font-bold text-slate-500 font-sans">Estado:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-transparent border-0 text-xs py-1.5 text-slate-200 focus:outline-none focus:ring-0 cursor-pointer font-sans"
          >
            <option value="ALL" className="bg-slate-900">Todos</option>
            {Object.entries(statusLabels).map(([key, val]) => (
              <option key={key} value={key} className="bg-slate-900">{val}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Adding form */}
      {isAdding && (
        <div className="bg-slate-900 border border-emerald-500/30 p-4 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 font-sans uppercase tracking-wider border-b border-slate-800 pb-1">
            🆕 Registrar Nuevo Jugador en el Plantel
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400">ID Único (FMRD)</label>
              <input
                type="text"
                placeholder="Opcional (se auto-genera)"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Nombre Completo</label>
              <input
                type="text"
                placeholder="Ej. Lionel Messi"
                value={newPlayer.name}
                onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Posición Principal</label>
              <select
                value={newPlayer.position}
                onChange={(e) => setNewPlayer({ ...newPlayer, position: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 cursor-pointer"
              >
                {positionsList.filter(p => p !== 'ALL').map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Edad</label>
              <input
                type="number"
                min="14"
                max="50"
                value={newPlayer.age}
                onChange={(e) => setNewPlayer({ ...newPlayer, age: parseInt(e.target.value) || 18 })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400">Nacionalidad</label>
              <input
                type="text"
                placeholder="Ej. Argentina"
                value={newPlayer.nationality}
                onChange={(e) => setNewPlayer({ ...newPlayer, nationality: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Club Actual</label>
              <input
                type="text"
                placeholder="Ej. Galatasaray"
                value={clubInput}
                onChange={(e) => setClubInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Valor de Mercado</label>
              <input
                type="text"
                value={newPlayer.marketValue}
                onChange={(e) => setNewPlayer({ ...newPlayer, marketValue: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Sueldo Estimado</label>
              <input
                type="text"
                value={newPlayer.wage}
                onChange={(e) => setNewPlayer({ ...newPlayer, wage: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400">Fecha Fin Contrato</label>
              <input
                type="text"
                placeholder="Ej. 30/6/2028"
                value={contractEndInput}
                onChange={(e) => setContractEndInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Fecha Nacimiento</label>
              <input
                type="text"
                placeholder="Ej. 18/12/2001"
                value={dateOfBirthInput}
                onChange={(e) => setDateOfBirthInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 flex justify-between">
                <span>Calidad Actual (CA)</span>
                <span className="text-slate-500 font-mono">1-200 o stars</span>
              </label>
              <input
                type="text"
                placeholder="Ej. 135"
                value={newCaInput}
                onChange={(e) => setNewCaInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-slate-100 font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 flex justify-between">
                <span>Potencial (PA)</span>
                <span className="text-slate-500 font-mono">1-200 o stars</span>
              </label>
              <input
                type="text"
                placeholder="Ej. 160"
                value={newPaInput}
                onChange={(e) => setNewPaInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded p-1.5 text-slate-100 font-mono"
              />
            </div>
          </div>

          {formError && (
            <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 text-xs">
            <button
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreatePlayer}
              className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Confirmar Registro
            </button>
          </div>
        </div>
      )}

      {/* Editing Player Inline Modal overlay */}
      {editingPlayer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  ✍️ Editar Ficha del Jugador
                </h3>
                <span className="text-[10px] font-mono text-slate-500">ID Único: {editingPlayer.id}</span>
              </div>
              <button onClick={() => setEditingPlayer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Nombre</label>
                <input
                  type="text"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Posición Principal</label>
                <select
                  value={editingPlayer.position}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 cursor-pointer"
                >
                  {positionsList.filter(p => p !== 'ALL').map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Edad</label>
                <input
                  type="number"
                  value={editingPlayer.age}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, age: parseInt(e.target.value) || editingPlayer.age })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Nacionalidad</label>
                <input
                  type="text"
                  value={editingPlayer.nationality}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, nationality: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Club Actual</label>
                <input
                  type="text"
                  value={editingPlayer.club || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, club: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Sueldo semanal</label>
                <input
                  type="text"
                  value={editingPlayer.wage}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, wage: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Valor de mercado</label>
                <input
                  type="text"
                  value={editingPlayer.marketValue}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, marketValue: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Fecha Fin Contrato</label>
                <input
                  type="text"
                  value={editingPlayer.contractEnd || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, contractEnd: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Fecha de Nacimiento</label>
                <input
                  type="text"
                  value={editingPlayer.dateOfBirth || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, dateOfBirth: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans flex justify-between">
                  <span>Calidad Actual (CA)</span>
                  <span className="text-slate-500 font-mono">1-200 o stars</span>
                </label>
                <input
                  type="text"
                  value={editCaInput}
                  onChange={(e) => setEditCaInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans flex justify-between">
                  <span>Calidad Potencial (PA)</span>
                  <span className="text-slate-500 font-mono">1-200 o stars</span>
                </label>
                <input
                  type="text"
                  value={editPaInput}
                  onChange={(e) => setEditPaInput(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 font-mono mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Estado en Plantilla</label>
                <select
                  value={editingPlayer.squadStatus}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, squadStatus: e.target.value as Player['squadStatus'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 cursor-pointer"
                >
                  <option value="no_asignado">⚪ Sin Asignar / Reserva</option>
                  <option value="titular">🟢 Planificado Titular</option>
                  <option value="suplente">🟡 Planificado Suplente</option>
                  <option value="juvenil">🔵 Planificado Juvenil</option>
                  <option value="recambio">🔄 Planificado Recambio</option>
                  <option value="cedidos">✈️ Cedido (Préstamo)</option>
                  <option value="aceder">📋 A ceder</option>
                  <option value="venta">💰 Transferible (Venta)</option>
                  <option value="desarrollo">🌱 Desarrollo</option>
                  <option value="descartes">❌ Descarte</option>
                  <option value="baja">📉 Baja del Club</option>
                </select>
              </div>

              {editingPlayer.squadStatus === 'baja' && (
                <div className="md:col-span-2 grid grid-cols-2 gap-2 bg-rose-950/10 p-3 rounded-xl border border-rose-900/20">
                  <div className="col-span-2 text-rose-400 font-sans text-[10px] font-bold uppercase tracking-wider">
                    📋 Información de la Baja / Venta
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Año de Baja</label>
                    <input
                      type="text"
                      placeholder="Ej. 2026"
                      value={editingPlayer.fechaBaja || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, fechaBaja: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 mt-1 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-slate-400">Monto (€)</label>
                    <input
                      type="text"
                      placeholder="Ej. €15M"
                      value={editingPlayer.montoBaja || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, montoBaja: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 mt-1 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400">Club Destino</label>
                    <input
                      type="text"
                      placeholder="Ej. Galatasaray"
                      value={editingPlayer.clubBaja || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, clubBaja: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 mt-1 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-[10px] text-slate-400">Comentarios de Salida</label>
                    <input
                      type="text"
                      placeholder="Cláusulas, motivos de la baja..."
                      value={editingPlayer.comentarioBaja || ''}
                      onChange={(e) => setEditingPlayer({ ...editingPlayer, comentarioBaja: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 mt-1 focus:border-rose-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-sans">Notas del Mánager</label>
                <textarea
                  value={editingPlayer.notes || ''}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, notes: e.target.value })}
                  placeholder="Ej. Excelente cabezazo, entrenar velocidad..."
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1 h-16 resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 text-xs pt-2">
              <button
                onClick={() => setEditingPlayer(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
              >
                Descartar
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Roster Table */}
      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/40">
        <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-sans">
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-sans font-semibold text-[10px] whitespace-nowrap">
            <tr>
              {renderSortHeader('id', 'ID Único', 'w-[75px]')}
              {renderSortHeader('name', 'Nombre', 'w-[160px]')}
              {renderSortHeader('nationality', 'Nac', 'w-[50px]')}
              {renderSortHeader('position', 'Pos', 'w-[70px]')}
              {renderSortHeader('age', 'Edad', 'w-[60px]')}
              {renderSortHeader('wage', 'Sueldo Anual', 'w-[105px]')}
              {renderSortHeader('marketValue', 'Valor Mercado', 'w-[105px]')}
              {renderSortHeader('ca', 'Calidad (CA)', 'w-[110px]')}
              {renderSortHeader('pa', 'Potencial (PA)', 'w-[110px]')}
              {renderSortHeader('contractEnd', 'Fin Contrato', 'w-[130px]')}
              {renderSortHeader('dateOfBirth', 'F. Nacimiento', 'w-[100px]')}
              {renderSortHeader('squadStatus', 'Estado', 'w-[110px]')}
              <th className="px-3 py-3 font-semibold text-slate-400 text-right w-[110px]">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {sortedPlayers.length === 0 ? (
              <tr>
                <td colSpan={13} className="px-4 py-8 text-center text-slate-500 italic">
                  Ningún jugador coincide con los filtros de búsqueda.
                </td>
              </tr>
            ) : (
              sortedPlayers.map((player) => {
                const isTurkish = isTurkishPlayer(player.nationality);
                
                // Recalculate weekly wage to annual wage (weekly * 52.1429)
                const parseWageToAnnual = (wageStr: string): string => {
                  if (!wageStr) return "€0 p/a";
                  const clean = wageStr.replace(/\s/g, '').toLowerCase();
                  const parsedNum = clean.replace(/[^0-9.]/g, '');
                  let numberPart = parseFloat(parsedNum);
                  if (isNaN(numberPart)) return wageStr; // fallback
                  
                  if (clean.includes('k')) {
                    numberPart *= 1000;
                  } else if (clean.includes('m')) {
                    numberPart *= 1000000;
                  }
                  
                  const annual = numberPart * 52.1429;
                  
                  if (annual >= 1000000) {
                    return `€${(annual / 1000000).toFixed(2)}M p/a`;
                  } else if (annual >= 1000) {
                    return `€${(annual / 1000).toFixed(0)}K p/a`;
                  } else {
                    return `€${Math.round(annual).toLocaleString()} p/a`;
                  }
                };

                return (
                  <tr 
                    key={player.id} 
                    className={`hover:bg-slate-900/40 transition-colors border-b border-slate-800/40 ${
                      isTurkish 
                        ? 'bg-red-950/10 border-l-2 border-l-red-500/80 hover:bg-red-950/15' 
                        : ''
                    }`}
                  >
                    <td className="px-3 py-2 text-slate-500 font-sans font-medium text-[10px]">{player.id}</td>
                    <td className="px-3 py-2 font-medium text-slate-100 max-w-[150px] truncate" title={player.name}>
                      <div className="flex items-center gap-1.5">
                        <span className="truncate">{player.name}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-base font-sans" title={player.nationality}>
                      <div className="flex items-center gap-1">
                        {getPlayerFlags(player.nationality).map((f, idx) => (
                          <span key={idx} className="select-none">{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <span className="bg-slate-800 text-slate-300 font-semibold px-1.5 py-0.5 rounded text-[10px] font-sans whitespace-nowrap">
                        {player.position}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-sans">{calculateAgeFromDOB(player.dateOfBirth, player.age, gameYear)}</td>
                    <td className="px-3 py-2 text-slate-100 font-sans font-bold whitespace-nowrap text-[11px]" title={`Original: ${player.wage}`}>
                      {parseWageToAnnual(player.wage)}
                    </td>
                    <td className="px-3 py-2 text-slate-200 font-sans font-medium whitespace-nowrap">{player.marketValue}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {renderStarsWithPercentage(player.currentAbility, player.bestRating)}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {renderStarsWithPercentage(player.potentialAbility, player.bestPotRating)}
                    </td>
                    <td className="px-3 py-2 text-slate-300 font-sans text-[11px] whitespace-nowrap">
                      {calculateContractYearsRemaining(player.contractEnd, gameYear)}
                    </td>
                    <td className="px-3 py-2 text-slate-400 font-sans text-[11px] whitespace-nowrap">{player.dateOfBirth || 'N/A'}</td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium font-sans
                        ${player.squadStatus === 'titular' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                        ${player.squadStatus === 'suplente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                        ${player.squadStatus === 'juvenil' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : ''}
                        ${player.squadStatus === 'recambio' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : ''}
                        ${player.squadStatus === 'cedidos' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : ''}
                        ${player.squadStatus === 'aceder' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : ''}
                        ${player.squadStatus === 'venta' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : ''}
                        ${player.squadStatus === 'desarrollo' ? 'bg-teal-500/10 text-teal-400 border border-teal-500/20' : ''}
                        ${player.squadStatus === 'descartes' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : ''}
                        ${player.squadStatus === 'no_asignado' ? 'bg-slate-800/50 text-slate-400 border border-slate-700/30' : ''}
                      `}>
                        {statusLabels[player.squadStatus]}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5 items-center">
                        {confirmBajaId === player.id ? (
                          <div className="flex items-center gap-1 bg-rose-950/80 border border-rose-500/30 p-1 rounded">
                            <span className="text-[10px] font-bold text-rose-300 px-1 font-sans">¿Baja?</span>
                            <button
                              onClick={() => {
                                onUpdatePlayer({
                                  ...player,
                                  squadStatus: 'baja',
                                  fechaBaja: String(new Date().getFullYear()),
                                  montoBaja: player.saleValue || 'N/A',
                                  clubBaja: 'N/A',
                                  comentarioBaja: 'Dado de baja'
                                });
                                setConfirmBajaId(null);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold transition font-sans"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmBajaId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-medium transition font-sans"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <>
                            {/* Drop list tags status */}
                            <select
                              value={player.squadStatus}
                              onChange={(e) => {
                                const val = e.target.value as Player['squadStatus'];
                                if (val === 'baja') {
                                  setConfirmBajaId(player.id);
                                } else {
                                  onUpdatePlayer({
                                    ...player,
                                    squadStatus: val
                                  });
                                }
                              }}
                              className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-slate-300 font-sans focus:outline-none focus:border-slate-700 cursor-pointer"
                            >
                              <option value="no_asignado">⚪ Sin Asignar</option>
                              <option value="titular">🟢 Titular</option>
                              <option value="suplente">🟡 Suplente</option>
                              <option value="juvenil">🔵 Juvenil</option>
                              <option value="recambio">🔄 Recambio</option>
                              <option value="cedidos">✈️ Cedido</option>
                              <option value="aceder">📋 A ceder</option>
                              <option value="venta">💰 Venta</option>
                              <option value="desarrollo">🌱 Desarrollo</option>
                              <option value="descartes">❌ Descarte</option>
                              <option value="baja">📉 Dar de Baja</option>
                            </select>

                            <button
                              onClick={() => {
                                handleEditClick(player);
                                setConfirmBajaId(null);
                              }}
                              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                              title="Editar ficha"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => {
                                setConfirmBajaId(player.id);
                              }}
                              className="p-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-400 transition"
                              title="Mandar a Bajas"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* SECCIÓN DE BAJAS Y SALIDAS */}
      <div className="bg-slate-950 p-5 rounded-2xl border border-rose-950/40 space-y-4 mt-6">
        <div className="border-b border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider font-sans flex items-center gap-2">
              📉 SECCIÓN DE BAJAS DEL CLUB ({bajasPlayers.length} jugadores)
            </h3>
            <p className="text-xs text-slate-400">
              Jugadores retirados, transferidos o cedidos que ya no pertenecen al plantel y dejeron de formar parte de la tabla principal.
            </p>
          </div>
        </div>

        {bajasPlayers.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500 italic bg-slate-900/10 rounded-xl border border-dashed border-slate-800/60">
            No tienes bajas registradas en el club actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
            <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-sans">
              <thead className="bg-slate-900/50 text-slate-400 uppercase font-sans font-semibold text-[10px] whitespace-nowrap">
                <tr>
                  <th className="px-3 py-2.5 font-semibold">ID</th>
                  <th className="px-3 py-2.5 font-semibold">Jugador</th>
                  <th className="px-3 py-2.5 font-semibold">Nacionalidad</th>
                  <th className="px-3 py-2.5 font-semibold">Fecha de Baja (Año)</th>
                  <th className="px-3 py-2.5 font-semibold">Monto de Salida</th>
                  <th className="px-3 py-2.5 font-semibold">Club Destino</th>
                  <th className="px-3 py-2.5 font-semibold">Comentarios / Notas de Baja</th>
                  <th className="px-3 py-2.5 font-semibold text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40">
                {bajasPlayers.map((p) => (
                  <tr key={p.id} className="hover:bg-rose-950/10 transition-colors">
                    <td className="px-3 py-2 text-slate-500 font-sans font-medium text-[10px]">{p.id}</td>
                    <td className="px-3 py-2">
                      <div className="font-bold text-slate-100">{p.name}</div>
                      <div className="text-[10px] text-slate-500 font-sans">{p.position} • {p.age} años</div>
                    </td>
                    <td className="px-3 py-2 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <span className="text-base">{getFlagEmoji(p.nationality)}</span>
                        <span>{p.nationality}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Ej. 2026"
                        value={p.fechaBaja || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, fechaBaja: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-20 text-center focus:border-rose-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Ej. €12M"
                        value={p.montoBaja || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, montoBaja: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-28 focus:border-rose-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Ej. Galatasaray"
                        value={p.clubBaja || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, clubBaja: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-36 focus:border-rose-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="text"
                        placeholder="Cláusulas o motivos..."
                        value={p.comentarioBaja || ''}
                        onChange={(e) => onUpdatePlayer({ ...p, comentarioBaja: e.target.value })}
                        className="bg-slate-950 border border-slate-850 rounded px-2 py-1 text-xs text-slate-100 w-full min-w-[150px] focus:border-rose-500 focus:outline-none"
                      />
                    </td>
                    <td className="px-3 py-2 text-right">
                      <div className="flex justify-end gap-1.5">
                        <button
                          onClick={() => {
                            onUpdatePlayer({
                              ...p,
                              squadStatus: 'no_asignado',
                              fechaBaja: undefined,
                              montoBaja: undefined,
                              clubBaja: undefined,
                              comentarioBaja: undefined
                            });
                          }}
                          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded text-[10px] transition"
                        >
                          Reincorporar
                        </button>
                        {confirmDeleteId === p.id ? (
                          <div className="flex items-center gap-1 bg-rose-950 border border-rose-500/30 p-1 rounded">
                            <span className="text-[9px] font-bold text-rose-300 font-sans">¿Eliminar permanentemente?</span>
                            <button
                              onClick={() => {
                                onDeletePlayer(p.id);
                                setConfirmDeleteId(null);
                              }}
                              className="bg-rose-600 hover:bg-rose-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold transition font-sans"
                            >
                              Sí
                            </button>
                            <button
                              onClick={() => setConfirmDeleteId(null)}
                              className="bg-slate-800 hover:bg-slate-700 text-slate-300 text-[9px] px-1.5 py-0.5 rounded font-medium transition font-sans"
                            >
                              No
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setConfirmDeleteId(p.id);
                            }}
                            className="p-1 bg-rose-950/40 hover:bg-rose-900 text-rose-400 border border-rose-900/20 rounded transition"
                            title="Eliminar permanentemente"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
