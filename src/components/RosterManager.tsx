import React, { useState } from 'react';
import { Player } from '../types';
import { Search, Filter, Plus, Trash2, Edit3, Check, X, Star, AlertCircle, RefreshCw } from 'lucide-react';

interface RosterManagerProps {
  players: Player[];
  onUpdatePlayer: (player: Player) => void;
  onAddPlayer: (player: Player) => void;
  onDeletePlayer: (id: string) => void;
  onResetToDefaults: () => void;
}

export function RosterManager({ players, onUpdatePlayer, onAddPlayer, onDeletePlayer, onResetToDefaults }: RosterManagerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [isAdding, setIsAdding] = useState(false);

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
    notes: ''
  });

  // Unique list of positions for filter
  const positionsList = ['ALL', 'GK', 'D (C)', 'D (L)', 'D (R)', 'DM', 'M (C)', 'AM (L)', 'AM (R)', 'AM (C)', 'ST (C)'];
  const statusLabels: Record<string, string> = {
    'titular': '🟢 Titular',
    'suplente': '🟡 Suplente',
    'juvenil': '🔵 Juvenil',
    'recambio': '🔄 Recambio',
    'cesion': '✈️ Cesión',
    'venta': '💰 Venta',
    'desarrollo': '🌱 Desarrollo',
    'descartes': '❌ Descarte',
    'no_asignado': '⚪ Sin Asignar'
  };

  // Filter players
  const filteredPlayers = players.filter(player => {
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

  const handleEditClick = (player: Player) => {
    setEditingPlayer({ ...player });
  };

  const handleSaveEdit = () => {
    if (editingPlayer) {
      onUpdatePlayer(editingPlayer);
      setEditingPlayer(null);
    }
  };

  const handleCreatePlayer = () => {
    if (!newPlayer.name.trim()) {
      alert("El nombre del jugador es requerido.");
      return;
    }
    const generatedId = String(Date.now());
    onAddPlayer({
      ...newPlayer,
      id: generatedId
    });
    setIsAdding(false);
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
      notes: ''
    });
  };

  // Helper to render star ratings
  const renderStars = (count: number) => {
    return (
      <div className="flex gap-0.5 text-amber-400">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star 
            key={i} 
            className={`w-3 h-3 ${i < count ? 'fill-amber-400 text-amber-400' : 'text-slate-700'}`} 
          />
        ))}
      </div>
    );
  };

  return (
    <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
      
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🏃‍♂️ Plantilla General ({players.length} jugadores)
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
          
          <button
            onClick={() => {
              if (window.confirm("¿Estás seguro de que quieres restablecer el plantel por defecto? Se perderán las modificaciones actuales.")) {
                onResetToDefaults();
              }
            }}
            className="border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-400 hover:text-slate-200 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1 font-mono transition"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Restablecer Base
          </button>
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
          <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Pos:</span>
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
          <span className="text-[10px] uppercase font-bold text-slate-500 font-mono">Estado:</span>
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
          <h3 className="text-xs font-bold text-emerald-400 font-mono uppercase tracking-wider border-b border-slate-800 pb-1">
            🆕 Registrar Nuevo Jugador en el Plantel
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
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
            <div>
              <label className="text-[10px] text-slate-400">Nacionalidad</label>
              <input
                type="text"
                value={newPlayer.nationality}
                onChange={(e) => setNewPlayer({ ...newPlayer, nationality: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
            <div>
              <label className="text-[10px] text-slate-400">Calidad Actual (1-5)</label>
              <select
                value={newPlayer.currentAbility}
                onChange={(e) => setNewPlayer({ ...newPlayer, currentAbility: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map(val => (
                  <option key={val} value={val}>{val} {val === 1 ? 'Estrella' : 'Estrellas'}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-[10px] text-slate-400">Potencial (1-5)</label>
              <select
                value={newPlayer.potentialAbility}
                onChange={(e) => setNewPlayer({ ...newPlayer, potentialAbility: parseInt(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded p-1.5 text-slate-100 cursor-pointer"
              >
                {[1, 2, 3, 4, 5].map(val => (
                  <option key={val} value={val}>{val} {val === 1 ? 'Estrella' : 'Estrellas'}</option>
                ))}
              </select>
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
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                ✍️ Editar Ficha del Jugador
              </h3>
              <button onClick={() => setEditingPlayer(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Nombre</label>
                <input
                  type="text"
                  value={editingPlayer.name}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Posición Principal</label>
                <select
                  value={editingPlayer.position}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, position: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                >
                  {positionsList.filter(p => p !== 'ALL').map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Edad</label>
                <input
                  type="number"
                  value={editingPlayer.age}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, age: parseInt(e.target.value) || editingPlayer.age })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Nacionalidad</label>
                <input
                  type="text"
                  value={editingPlayer.nationality}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, nationality: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Sueldo semanal</label>
                <input
                  type="text"
                  value={editingPlayer.wage}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, wage: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Calidad Actual (1-5)</label>
                <select
                  value={editingPlayer.currentAbility}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, currentAbility: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                >
                  {[1, 2, 3, 4, 5].map(val => (
                    <option key={val} value={val}>{val} {val === 1 ? 'Estrella' : 'Estrellas'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Calidad Potencial (1-5)</label>
                <select
                  value={editingPlayer.potentialAbility}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, potentialAbility: parseInt(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                >
                  {[1, 2, 3, 4, 5].map(val => (
                    <option key={val} value={val}>{val} {val === 1 ? 'Estrella' : 'Estrellas'}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Valor de mercado</label>
                <input
                  type="text"
                  value={editingPlayer.marketValue}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, marketValue: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Estado en Plantilla</label>
                <select
                  value={editingPlayer.squadStatus}
                  onChange={(e) => setEditingPlayer({ ...editingPlayer, squadStatus: e.target.value as Player['squadStatus'] })}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 mt-1"
                >
                  <option value="no_asignado">⚪ Sin Asignar / Reserva</option>
                  <option value="titular">🟢 Planificado Titular</option>
                  <option value="suplente">🟡 Planificado Suplente</option>
                  <option value="juvenil">🔵 Planificado Juvenil</option>
                  <option value="cedido">✈️ Enviar a Préstamo (Cedido)</option>
                  <option value="vender">💰 Transferible (Vender)</option>
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono">Notas del Mánager</label>
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
          <thead className="bg-slate-900/80 text-slate-400 uppercase tracking-wider font-mono text-[10px]">
            <tr>
              <th className="px-3 py-3 font-semibold text-slate-400">ID</th>
              <th className="px-3 py-3 font-semibold text-slate-400">Nombre</th>
              <th className="px-3 py-3 font-semibold text-slate-400">Pos</th>
              <th className="px-3 py-3 font-semibold text-slate-400">Edad</th>
              <th className="px-3 py-3 font-semibold text-slate-400">Nac</th>
              <th className="px-3 py-3 font-semibold text-slate-400">CA</th>
              <th className="px-3 py-3 font-semibold text-slate-400">PA</th>
              <th className="px-3 py-3 font-semibold text-slate-400">Valor</th>
              <th className="px-3 py-3 font-semibold text-slate-400">Sueldo</th>
              <th className="px-3 py-3 font-semibold text-slate-400">Estado</th>
              <th className="px-3 py-3 font-semibold text-slate-400 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {filteredPlayers.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500 italic">
                  Ningún jugador coincide con los filtros de búsqueda.
                </td>
              </tr>
            ) : (
              filteredPlayers.map((player) => (
                <tr key={player.id} className="hover:bg-slate-900/30 transition-colors">
                  <td className="px-3 py-2 text-slate-500 font-mono text-[10px]">{player.id}</td>
                  <td className="px-3 py-2 font-medium text-slate-100 truncate max-w-[150px]" title={player.name}>
                    {player.name}
                  </td>
                  <td className="px-3 py-2">
                    <span className="bg-slate-800 text-slate-300 font-semibold px-1.5 py-0.5 rounded text-[10px] font-mono">
                      {player.position}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-slate-300">{player.age}</td>
                  <td className="px-3 py-2 text-slate-400 truncate max-w-[100px]">{player.nationality}</td>
                  <td className="px-3 py-2">{renderStars(player.currentAbility)}</td>
                  <td className="px-3 py-2">{renderStars(player.potentialAbility)}</td>
                  <td className="px-3 py-2 text-slate-200 font-mono font-medium">{player.marketValue}</td>
                  <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">{player.wage}</td>
                  <td className="px-3 py-2">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium font-sans
                      ${player.squadStatus === 'titular' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : ''}
                      ${player.squadStatus === 'suplente' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : ''}
                      ${player.squadStatus === 'juvenil' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : ''}
                      ${player.squadStatus === 'recambio' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : ''}
                      ${player.squadStatus === 'cesion' ? 'bg-violet-500/10 text-violet-400 border border-violet-500/20' : ''}
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
                      {/* Drop list tags status */}
                      <select
                        value={player.squadStatus}
                        onChange={(e) => {
                          onUpdatePlayer({
                            ...player,
                            squadStatus: e.target.value as Player['squadStatus']
                          });
                        }}
                        className="bg-slate-900 border border-slate-800 rounded px-1 py-0.5 text-[10px] text-slate-300 font-sans focus:outline-none focus:border-slate-700 cursor-pointer"
                      >
                        <option value="no_asignado">⚪ Sin Asignar</option>
                        <option value="titular">🟢 Titular</option>
                        <option value="suplente">🟡 Suplente</option>
                        <option value="juvenil">🔵 Juvenil</option>
                        <option value="recambio">🔄 Recambio</option>
                        <option value="cesion">✈️ Cesión</option>
                        <option value="venta">💰 Venta</option>
                        <option value="desarrollo">🌱 Desarrollo</option>
                        <option value="descartes">❌ Descarte</option>
                      </select>

                      <button
                        onClick={() => handleEditClick(player)}
                        className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                        title="Editar ficha"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de que quieres dar de baja a ${player.name} del plantel?`)) {
                            onDeletePlayer(player.id);
                          }
                        }}
                        className="p-1 rounded bg-rose-950 hover:bg-rose-900 text-rose-400 transition"
                        title="Dar de baja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
