import React, { useState } from 'react';
import { Player } from '../types';
import { getFlagEmoji, calculateAgeFromDOBPrecise } from '../utils/flags';
import { ArrowUpRight, ArrowDownLeft, Calendar, Filter, ChevronUp, ChevronDown, CheckSquare, Square } from 'lucide-react';

interface TransferHistoryProps {
  players: Player[];
  gameDate: string;
  gameYear: number;
}

export function TransferHistory({ players, gameDate, gameYear }: TransferHistoryProps) {
  // Season state
  const [selectedSeason, setSelectedSeason] = useState<string>(() => {
    // Determine current season based on gameDate
    const parts = gameDate.split('/');
    const month = parts.length === 3 ? parseInt(parts[1]) : 7;
    const year = parts.length === 3 ? parseInt(parts[2]) : gameYear;
    if (month >= 7) {
      return `${year}/${year + 1}`;
    } else {
      return `${year - 1}/${year}`;
    }
  });

  const [showAllTransfers, setShowAllTransfers] = useState<boolean>(false);

  // Sorting state for Transfers In (Altas)
  const [altasSortField, setAltasSortField] = useState<string>('fecha');
  const [altasSortDirection, setAltasSortDirection] = useState<'asc' | 'desc'>('desc');

  // Sorting state for Transfers Out (Bajas)
  const [bajasSortField, setBajasSortField] = useState<string>('fecha');
  const [bajasSortDirection, setBajasSortDirection] = useState<'asc' | 'desc'>('desc');

  // Helper to parse date to timestamp for sorting
  const parseDateToTimestamp = (dStr: string | undefined): number => {
    if (!dStr) return 0;
    const parts = dStr.split(/[\.\-\/]+/);
    if (parts.length === 3) {
      const d = parseInt(parts[0]);
      const m = parseInt(parts[1]) - 1;
      const y = parseInt(parts[2]);
      if (!isNaN(d) && !isNaN(m) && !isNaN(y)) {
        return new Date(y, m, d).getTime();
      }
    }
    return 0;
  };

  // Helper to parse season from date
  const getSeasonFromDate = (dateStr: string | undefined): string | null => {
    if (!dateStr) return null;
    const parts = dateStr.split(/[\.\-\/]+/);
    if (parts.length !== 3) return null;
    const month = parseInt(parts[1]);
    const year = parseInt(parts[2]);
    if (isNaN(month) || isNaN(year)) return null;
    
    if (month >= 7) {
      return `${year}/${year + 1}`;
    } else {
      return `${year - 1}/${year}`;
    }
  };

  // Generate list of seasons from 2024/2025 up to current game date season
  const seasons: string[] = [];
  const currentParts = gameDate.split('/');
  const currentMonth = currentParts.length === 3 ? parseInt(currentParts[1]) : 7;
  const currentYear = currentParts.length === 3 ? parseInt(currentParts[2]) : gameYear;
  const endYear = currentMonth >= 7 ? currentYear : currentYear - 1;

  for (let y = 2024; y <= endYear; y++) {
    seasons.push(`${y}/${y + 1}`);
  }
  // Ensure we have at least the current season in the list
  const currentSeasonStr = currentMonth >= 7 ? `${currentYear}/${currentYear + 1}` : `${currentYear - 1}/${currentYear}`;
  if (!seasons.includes(currentSeasonStr)) {
    seasons.push(currentSeasonStr);
  }

  // Handle season navigation arrow click
  const handlePrevSeason = () => {
    const idx = seasons.indexOf(selectedSeason);
    if (idx > 0) {
      setSelectedSeason(seasons[idx - 1]);
    }
  };

  const handleNextSeason = () => {
    const idx = seasons.indexOf(selectedSeason);
    if (idx < seasons.length - 1) {
      setSelectedSeason(seasons[idx + 1]);
    }
  };

  // Format money to FM-style (e.g. 15000000 -> €15M, 850000 -> €850K)
  const formatMoney = (amount: number | undefined): string => {
    if (amount === undefined || isNaN(amount)) return '-';
    if (amount === 0) return 'Libre';
    if (amount >= 1000000) {
      const val = amount / 1000000;
      return `€${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}M`;
    }
    if (amount >= 1000) {
      const val = amount / 1000;
      return `€${val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)}K`;
    }
    return `€${amount.toLocaleString()}`;
  };

  // Helper to format fee specifically for UI
  const formatFee = (player: Player, type: 'alta' | 'baja'): string => {
    if (type === 'alta') {
      if (player.canterano) return 'inferiores del club';
      if (player.montoCompra !== undefined) {
        return formatMoney(player.montoCompra);
      }
      return '-';
    } else {
      if (player.tipoBaja === 'libre') return 'Libre';
      if (player.tipoBaja === 'retirado') return 'Retirado';
      if (player.montoVenta !== undefined) {
        return formatMoney(player.montoVenta);
      }
      // Fallback for older entries
      if (player.montoBaja) {
        const cleanVal = parseInt(player.montoBaja.replace(/\D/g, ''));
        if (!isNaN(cleanVal)) return formatMoney(cleanVal);
        return player.montoBaja;
      }
      return 'Libre';
    }
  };

  // Extract all "Altas" (transfers in)
  // An "Alta" is any player with a valid arrival date (or we assign a fallback so they appear in transfer history)
  const altasListRaw = players
    .filter(p => p.fechaLlegada || p.origen)
    .map(p => {
      const date = p.fechaLlegada || '01/07/2024';
      const ageAtTransfer = calculateAgeFromDOBPrecise(p.dateOfBirth, p.age, date);
      const season = getSeasonFromDate(date) || '2024/2025';
      const feeLabel = p.canterano ? 'inferiores del club' : formatMoney(p.montoCompra || 0);
      const feeNum = p.canterano ? 0 : p.montoCompra || 0;

      return {
        id: p.id,
        player: p,
        date,
        name: p.name,
        position: p.position,
        age: ageAtTransfer,
        origen: p.origen || 'N/D',
        feeLabel,
        feeNum,
        season,
        nationality: p.nationality
      };
    });

  // Extract all "Bajas" (transfers out)
  // A "Baja" is any player who was marked with squadStatus === 'baja'
  const bajasListRaw = players
    .filter(p => p.squadStatus === 'baja' || p.fechaSalida || p.destino)
    .map(p => {
      const date = p.fechaSalida || p.fechaBaja || '01/07/2024';
      const ageAtTransfer = calculateAgeFromDOBPrecise(p.dateOfBirth, p.age, date);
      const season = getSeasonFromDate(date) || '2024/2025';
      
      let feeNum = p.montoVenta || 0;
      if (p.montoVenta === undefined && p.montoBaja) {
        const cleanVal = parseInt(p.montoBaja.replace(/\D/g, ''));
        if (!isNaN(cleanVal)) feeNum = cleanVal;
      }

      let destination = p.destino || p.clubBaja || 'Libre';
      if (p.tipoBaja === 'libre') destination = 'Libre';
      if (p.tipoBaja === 'retirado') destination = 'Retirado';

      const feeLabel = formatFee(p, 'baja');

      return {
        id: p.id,
        player: p,
        date,
        name: p.name,
        position: p.position,
        age: ageAtTransfer,
        destino: destination,
        feeLabel,
        feeNum,
        season,
        nationality: p.nationality
      };
    });

  // Filter based on selected season (unless All Transfers is checked)
  const filteredAltas = showAllTransfers 
    ? altasListRaw 
    : altasListRaw.filter(a => a.season === selectedSeason);

  const filteredBajas = showAllTransfers 
    ? bajasListRaw 
    : bajasListRaw.filter(b => b.season === selectedSeason);

  // Sorting helper for arrays
  const sortData = (data: any[], field: string, direction: 'asc' | 'desc') => {
    return [...data].sort((a, b) => {
      let valA: any = '';
      let valB: any = '';

      switch (field) {
        case 'fecha':
          valA = parseDateToTimestamp(a.date);
          valB = parseDateToTimestamp(b.date);
          break;
        case 'player':
          valA = a.name.toLowerCase();
          valB = b.name.toLowerCase();
          break;
        case 'position':
          valA = a.position.toLowerCase();
          valB = b.position.toLowerCase();
          break;
        case 'age':
          valA = a.age;
          valB = b.age;
          break;
        case 'club':
          valA = (a.origen || a.destino || '').toLowerCase();
          valB = (b.origen || b.destino || '').toLowerCase();
          break;
        case 'fee':
          valA = a.feeNum;
          valB = b.feeNum;
          break;
        default:
          return 0;
      }

      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const sortedAltas = sortData(filteredAltas, altasSortField, altasSortDirection);
  const sortedBajas = sortData(filteredBajas, bajasSortField, bajasSortDirection);

  // Compute stats totals
  const totalSpent = filteredAltas.reduce((sum, item) => sum + item.feeNum, 0);
  const totalEarned = filteredBajas.reduce((sum, item) => sum + item.feeNum, 0);

  const handleAltasSort = (field: string) => {
    if (altasSortField === field) {
      setAltasSortDirection(altasSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setAltasSortField(field);
      setAltasSortDirection('desc');
    }
  };

  const handleBajasSort = (field: string) => {
    if (bajasSortField === field) {
      setBajasSortDirection(bajasSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setBajasSortField(field);
      setBajasSortDirection('desc');
    }
  };

  const renderSortArrow = (currentField: string, targetField: string, direction: 'asc' | 'desc') => {
    if (currentField !== targetField) return null;
    return direction === 'asc' ? <ChevronUp className="w-3.5 h-3.5 inline ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 inline ml-0.5" />;
  };

  return (
    <div className="max-w-[98%] w-[98%] mx-auto px-4 py-6 space-y-6 text-slate-100">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-2.5 rounded-xl">
              <ArrowUpRight className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-sans text-white uppercase tracking-wider">Historial de Fichajes</h2>
              <p className="text-xs text-slate-400">Año tras año, controla todos los movimientos de altas y bajas del club</p>
            </div>
          </div>
        </div>

        {/* Filters and Navigation Controls */}
        <div className="flex flex-wrap items-center gap-3 self-end md:self-auto">
          {/* Complete History Checkbox Button */}
          <button
            onClick={() => setShowAllTransfers(!showAllTransfers)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition duration-200 border ${
              showAllTransfers
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'bg-slate-950 border-slate-850 text-slate-400 hover:text-slate-200'
            }`}
          >
            {showAllTransfers ? <CheckSquare className="w-4 h-4 text-white" /> : <Square className="w-4 h-4 text-slate-500" />}
            <span>Historial Completo</span>
          </button>

          {/* Season Selector Dropdown */}
          {!showAllTransfers && (
            <div className="flex items-center bg-slate-950 border border-slate-850 rounded-xl p-1 shrink-0 font-sans">
              <button
                disabled={seasons.indexOf(selectedSeason) === 0}
                onClick={handlePrevSeason}
                className="px-2.5 py-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition text-sm font-bold"
              >
                &lt;
              </button>
              
              <select
                value={selectedSeason}
                onChange={(e) => setSelectedSeason(e.target.value)}
                className="bg-transparent text-slate-200 font-bold text-xs px-2.5 py-1 focus:outline-none cursor-pointer text-center"
              >
                {seasons.map(s => (
                  <option key={s} value={s} className="bg-slate-950 text-slate-200">
                    Temporada {s}
                  </option>
                ))}
              </select>

              <button
                disabled={seasons.indexOf(selectedSeason) === seasons.length - 1}
                onClick={handleNextSeason}
                className="px-2.5 py-1 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition text-sm font-bold"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid containing Transfers In (Altas) & Transfers Out (Bajas) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        
        {/* TRANSFERS IN - ALTAS */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-emerald-950/20 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-emerald-500/10 text-emerald-400">
                <ArrowDownLeft className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">
                Altas / Fichajes ({sortedAltas.length})
              </h3>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Gasto Total</div>
              <div className="text-sm font-bold text-rose-400 font-mono">
                {formatMoney(totalSpent)}
              </div>
            </div>
          </div>

          {sortedAltas.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 italic bg-slate-900/10 rounded-xl border border-dashed border-slate-800/60">
              No se registran transferencias de entrada en esta temporada.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
              <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-sans">
                <thead className="bg-slate-900/50 text-slate-400 uppercase font-sans font-semibold text-[10px] whitespace-nowrap">
                  <tr>
                    <th 
                      onClick={() => handleAltasSort('fecha')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
                    >
                      Fecha {renderSortArrow(altasSortField, 'fecha', altasSortDirection)}
                    </th>
                    <th 
                      onClick={() => handleAltasSort('player')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
                    >
                      Jugador {renderSortArrow(altasSortField, 'player', altasSortDirection)}
                    </th>
                    <th 
                      onClick={() => handleAltasSort('position')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
                    >
                      Posición {renderSortArrow(altasSortField, 'position', altasSortDirection)}
                    </th>
                    <th 
                      onClick={() => handleAltasSort('age')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
                    >
                      Edad {renderSortArrow(altasSortField, 'age', altasSortDirection)}
                    </th>
                    <th 
                      onClick={() => handleAltasSort('club')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
                    >
                      Origen {renderSortArrow(altasSortField, 'club', altasSortDirection)}
                    </th>
                    <th 
                      onClick={() => handleAltasSort('fee')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors text-right"
                    >
                      Precio {renderSortArrow(altasSortField, 'fee', altasSortDirection)}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {sortedAltas.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-emerald-950/5 transition-colors whitespace-nowrap">
                      <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">{item.date}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base shrink-0">{getFlagEmoji(item.nationality)}</span>
                          <span className="font-bold text-slate-200 font-sans">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          {item.position}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300 font-mono">{item.age} años</td>
                      <td className="px-3 py-2 text-slate-300">{item.origen}</td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-emerald-400">
                        {item.feeLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* TRANSFERS OUT - BAJAS */}
        <div className="bg-slate-950 p-5 rounded-2xl border border-rose-950/20 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded bg-rose-500/10 text-rose-400">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-sans">
                Bajas / Salidas ({sortedBajas.length})
              </h3>
            </div>
            <div className="text-right">
              <div className="text-[10px] uppercase text-slate-500 font-bold">Ingreso Total</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {formatMoney(totalEarned)}
              </div>
            </div>
          </div>

          {sortedBajas.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 italic bg-slate-900/10 rounded-xl border border-dashed border-slate-800/60">
              No se registran transferencias de salida en esta temporada.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/20">
              <table className="min-w-full divide-y divide-slate-800 text-left text-xs font-sans">
                <thead className="bg-slate-900/50 text-slate-400 uppercase font-sans font-semibold text-[10px] whitespace-nowrap">
                  <tr>
                    <th 
                      onClick={() => handleBajasSort('fecha')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
                    >
                      Fecha {renderSortArrow(bajasSortField, 'fecha', bajasSortDirection)}
                    </th>
                    <th 
                      onClick={() => handleBajasSort('player')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
                    >
                      Jugador {renderSortArrow(bajasSortField, 'player', bajasSortDirection)}
                    </th>
                    <th 
                      onClick={() => handleBajasSort('position')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
                    >
                      Posición {renderSortArrow(bajasSortField, 'position', bajasSortDirection)}
                    </th>
                    <th 
                      onClick={() => handleBajasSort('age')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
                    >
                      Edad {renderSortArrow(bajasSortField, 'age', bajasSortDirection)}
                    </th>
                    <th 
                      onClick={() => handleBajasSort('club')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors"
                    >
                      Destino {renderSortArrow(bajasSortField, 'club', bajasSortDirection)}
                    </th>
                    <th 
                      onClick={() => handleBajasSort('fee')}
                      className="px-3 py-2.5 font-semibold cursor-pointer hover:text-slate-200 hover:bg-slate-900/80 transition-colors text-right"
                    >
                      Precio {renderSortArrow(bajasSortField, 'fee', bajasSortDirection)}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {sortedBajas.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-rose-950/5 transition-colors whitespace-nowrap">
                      <td className="px-3 py-2 text-slate-400 font-mono text-[11px]">{item.date}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-base shrink-0">{getFlagEmoji(item.nationality)}</span>
                          <span className="font-bold text-slate-200 font-sans">{item.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-400">
                          {item.position}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-slate-300 font-mono">{item.age} años</td>
                      <td className="px-3 py-2 text-slate-300">
                        {item.destino === 'Libre' ? (
                          <span className="text-slate-400 italic">Libre</span>
                        ) : item.destino === 'Retirado' ? (
                          <span className="text-slate-500 italic">Retirado</span>
                        ) : (
                          item.destino
                        )}
                      </td>
                      <td className="px-3 py-2 text-right font-mono font-bold text-rose-400">
                        {item.feeLabel}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
