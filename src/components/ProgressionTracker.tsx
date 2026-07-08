import React, { useState, useRef } from 'react';
import { Player, Snapshot } from '../types';
import { 
  History, 
  Plus, 
  Trash2, 
  Calendar, 
  ArrowRight, 
  FileText, 
  Clipboard, 
  Download, 
  TrendingUp, 
  UserPlus, 
  UserMinus, 
  Coins, 
  Clock, 
  ChevronRight, 
  Upload, 
  HelpCircle,
  TrendingDown,
  Check,
  AlertCircle
} from 'lucide-react';

interface ProgressionTrackerProps {
  snapshots: Snapshot[];
  onSaveSnapshot: (name: string, date: string, playersList: Player[]) => void;
  onDeleteSnapshot: (id: string) => void;
  currentPlayers: Player[];
  onLoadSnapshotRoster: (players: Player[]) => void;
}

export function ProgressionTracker({
  snapshots,
  onSaveSnapshot,
  onDeleteSnapshot,
  currentPlayers,
  onLoadSnapshotRoster
}: ProgressionTrackerProps) {
  // Navigation tabs inside Tracker
  const [subTab, setSubTab] = useState<'list' | 'compare' | 'player'>('list');

  // Snapshot Creation States
  const [snapName, setSnapName] = useState('');
  const [snapDate, setSnapDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [creationSource, setCreationSource] = useState<'current' | 'file' | 'paste'>('current');
  const [pasteText, setPasteText] = useState('');
  const [fileError, setFileError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Comparison States
  const [snapAId, setSnapAId] = useState<string>(snapshots[0]?.id || '');
  const [snapBId, setSnapBId] = useState<string>(snapshots[snapshots.length - 1]?.id || '');
  const [compareFilter, setCompareFilter] = useState<'all' | 'up' | 'down' | 'equal'>('all');

  // Player Progression States
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');

  // Drag and Drop State
  const [isDragging, setIsDragging] = useState(false);

  // Helper: Format large financial numbers to readable currency
  const formatWage = (wage: number) => {
    if (wage >= 1000000) return `€${(wage / 1000000).toFixed(1)}M/sem`;
    if (wage >= 1000) return `€${(wage / 1000).toFixed(0)}K/sem`;
    return `€${wage}/sem`;
  };

  const formatValue = (val: number) => {
    if (val >= 1000000) return `€${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `€${(val / 1000).toFixed(0)}K`;
    return `€${val}`;
  };

  // Helper: Parse FM financial strings to numbers
  const parseWageToNumeric = (wageStr: string): number => {
    if (!wageStr) return 0;
    const cleaned = wageStr.replace(/[^\d.KkMm]/g, '');
    let val = parseFloat(cleaned);
    if (isNaN(val)) return 0;
    if (cleaned.toLowerCase().includes('k')) val *= 1000;
    else if (cleaned.toLowerCase().includes('m')) val *= 1000000;
    return val;
  };

  const parseValueToNumeric = (valStr: string): number => {
    if (!valStr) return 0;
    const cleaned = valStr.replace(/[^\d.KkMm]/g, '');
    let val = parseFloat(cleaned);
    if (isNaN(val)) return 0;
    if (cleaned.toLowerCase().includes('k')) val *= 1000;
    else if (cleaned.toLowerCase().includes('m')) val *= 1000000;
    return val;
  };

  // Helper: Extract average statistics of a snapshot's player array
  const getSnapshotStats = (playersList: Player[]) => {
    if (playersList.length === 0) return { count: 0, avgAge: 0, totalWage: 0, avgCA: 0, avgPA: 0 };
    const count = playersList.length;
    const totalAge = playersList.reduce((acc, p) => acc + (p.age || 0), 0);
    const totalWage = playersList.reduce((acc, p) => acc + parseWageToNumeric(p.wage), 0);
    const totalCA = playersList.reduce((acc, p) => acc + (p.currentAbility || 0), 0);
    const totalPA = playersList.reduce((acc, p) => acc + (p.potentialAbility || 0), 0);

    return {
      count,
      avgAge: Math.round((totalAge / count) * 10) / 10,
      totalWage,
      avgCA: Math.round((totalCA / count) * 10) / 10,
      avgPA: Math.round((totalPA / count) * 10) / 10
    };
  };

  // Parsing helper for CSV/TSV exported contents
  const parseFmText = (text: string): Player[] => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length === 0) return [];

    // Decide separator (tab vs comma vs semicolon)
    let separator = "\t";
    const firstLine = lines[0];
    if (firstLine.includes(",")) separator = ",";
    else if (firstLine.includes(";")) separator = ";";

    const cellsInHeader = firstLine.split(separator).map(c => c.toLowerCase().trim());
    const hasHeaders = cellsInHeader.some(cell => 
      cell.includes("id") || cell.includes("nombre") || cell.includes("name") || 
      cell.includes("pos") || cell.includes("edad") || cell.includes("age") || 
      cell.includes("valor") || cell.includes("value") || cell.includes("sueldo") || cell.includes("wage")
    );

    const startIndex = hasHeaders ? 1 : 0;
    const headers = hasHeaders ? cellsInHeader : [];
    const parsedPlayers: Player[] = [];
    let nextIdSeed = Date.now();

    for (let i = startIndex; i < lines.length; i++) {
      const cells = lines[i].split(separator).map(c => c.trim());
      if (cells.length < 2) continue;

      let id = "";
      let name = "";
      let age = 22;
      let position = "M (C)";
      let nationality = "Desconocida";
      let currentAbility = 3;
      let potentialAbility = 4;
      let marketValue = "";
      let wage = "";

      if (hasHeaders) {
        headers.forEach((header, colIndex) => {
          const val = cells[colIndex];
          if (!val) return;

          if (header.includes("id") || header === "pk") {
            id = val;
          } else if (header.includes("nombre") || header.includes("name") || header === "nom") {
            name = val;
          } else if (header.includes("edad") || header.includes("age") || header === "eda") {
            const parsedAge = parseInt(val);
            if (!isNaN(parsedAge)) age = parsedAge;
          } else if (header.includes("pos") || header === "puesto") {
            position = val;
          } else if (header.includes("nacionalidad") || header.includes("nac") || header.includes("nat")) {
            nationality = val;
          } else if (header.includes("valor") || header.includes("value") || header === "val") {
            marketValue = val;
          } else if (header.includes("sueldo") || header.includes("wage") || header.includes("sal") || header.includes("contrato")) {
            wage = val;
          } else if (header.includes("ca") || header.includes("calidad actual") || header.includes("ability") || header.includes("cur") || header.includes("hab")) {
            if (val.includes("*")) {
              currentAbility = val.split('*').length - 1;
            } else {
              const num = parseInt(val);
              if (!isNaN(num)) currentAbility = num > 5 ? Math.round((num / 200) * 5) : num;
            }
          } else if (header.includes("pa") || header.includes("potencial") || header.includes("potential") || header.includes("pot")) {
            if (val.includes("*")) {
              potentialAbility = val.split('*').length - 1;
            } else {
              const num = parseInt(val);
              if (!isNaN(num)) potentialAbility = num > 5 ? Math.round((num / 200) * 5) : num;
            }
          }
        });
      } else {
        // Guessing
        cells.forEach((val, colIdx) => {
          if (!val) return;
          if (/^\d{6,11}$/.test(val)) id = val;
          else if (/^\d{2}$/.test(val) && colIdx !== 0) {
            const parsedAge = parseInt(val);
            if (parsedAge >= 14 && parsedAge <= 45) age = parsedAge;
          } else if (/[€$£M|K]/.test(val)) {
            if (val.toLowerCase().includes("sem") || val.toLowerCase().includes("w") || val.toLowerCase().includes("/s")) wage = val;
            else marketValue = val;
          } else if (/^(GK|POR|DFC|DFC\s*[DIL]|DF\s*[DIL]|LD|LI|CR|MCD|MC|MP|ENG|EXT|DL|ST|AM[LRC]|D[LRC]|M[LRC]|DM|W[BLR])/i.test(val)) {
            position = val;
          } else if (val.includes(" ") && val.length > 3 && !name) {
            name = val;
          } else if (/^[1-5]$/.test(val)) {
            if (currentAbility === 3) currentAbility = parseInt(val);
            else if (potentialAbility === 4) potentialAbility = parseInt(val);
          }
        });
        if (!name) {
          const textCells = cells.filter(c => !/^\d+$/.test(c) && c.length > 2);
          name = textCells[0] || `Jugador #${i}`;
        }
      }

      id = id || String(nextIdSeed++);
      marketValue = marketValue || "€2M";
      wage = wage || "€10K/sem";

      parsedPlayers.push({
        id,
        name,
        age,
        position: cleanFmPosition(position),
        nationality,
        currentAbility: Math.max(1, Math.min(5, currentAbility)),
        potentialAbility: Math.max(1, Math.min(5, potentialAbility)),
        marketValue,
        wage,
        squadStatus: "no_asignado"
      });
    }

    return parsedPlayers;
  };

  const cleanFmPosition = (pos: string): string => {
    const upper = pos.toUpperCase();
    if (upper.includes("GK") || upper.includes("POR")) return "GK";
    if (upper.includes("D (C)") || upper.includes("DFC")) return "D (C)";
    if (upper.includes("D (L)") || upper.includes("DF I") || upper.includes("LI") || upper.includes("DFL")) return "D (L)";
    if (upper.includes("D (R)") || upper.includes("DF D") || upper.includes("LD") || upper.includes("DFR")) return "D (R)";
    if (upper.includes("DM") || upper.includes("MCD")) return "DM";
    if (upper.includes("M (C)") || upper.includes("MC")) return "M (C)";
    if (upper.includes("AM (L)") || upper.includes("MP I") || upper.includes("AML") || upper.includes("EXT I")) return "AM (L)";
    if (upper.includes("AM (R)") || upper.includes("MP D") || upper.includes("AMR") || upper.includes("EXT D")) return "AM (R)";
    if (upper.includes("AM (C)") || upper.includes("ENG") || upper.includes("AMC") || upper.includes("MP C")) return "AM (C)";
    if (upper.includes("ST") || upper.includes("DL") || upper.includes("STC") || upper.includes("ST (C)")) return "ST (C)";
    return pos;
  };

  const handleCreateSnapshot = () => {
    setFileError(null);
    setSuccessMsg(null);

    const trimmedName = snapName.trim() || `Foto del Plantel - ${snapDate}`;

    if (creationSource === 'current') {
      if (currentPlayers.length === 0) {
        setFileError("No hay jugadores en tu plantilla actual para guardar.");
        return;
      }
      onSaveSnapshot(trimmedName, snapDate, currentPlayers);
      setSnapName('');
      setSuccessMsg(`¡Foto "${trimmedName}" guardada con éxito a partir de la pizarra!`);
      // Update default comparison select
      setTimeout(() => {
        setSubTab('list');
      }, 800);
    } else if (creationSource === 'paste') {
      const parsed = parseFmText(pasteText);
      if (parsed.length === 0) {
        setFileError("No pudimos identificar jugadores válidos en el texto. Asegúrate de copiar columnas tabuladas desde FM.");
        return;
      }
      onSaveSnapshot(trimmedName, snapDate, parsed);
      setPasteText('');
      setSnapName('');
      setSuccessMsg(`¡Foto "${trimmedName}" creada correctamente con ${parsed.length} jugadores importados!`);
      setTimeout(() => {
        setSubTab('list');
      }, 800);
    }
  };

  // Handle uploaded TXT or CSV file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file: File) => {
    setFileError(null);
    setSuccessMsg(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = parseFmText(text);
        if (parsed.length === 0) {
          setFileError("El archivo está vacío o no contiene una lista legible en formato TSV/CSV de Football Manager.");
          return;
        }
        const trimmedName = snapName.trim() || `Foto de Archivo - ${file.name.replace(/\.[^/.]+$/, "")}`;
        onSaveSnapshot(trimmedName, snapDate, parsed);
        setSnapName('');
        setSuccessMsg(`¡Foto "${trimmedName}" guardada con éxito! Se cargaron ${parsed.length} jugadores desde el archivo.`);
        setTimeout(() => {
          setSubTab('list');
        }, 1200);
      } catch (err: any) {
        setFileError(`Error de lectura: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // --- COMPARISON CALCULATIONS ---
  const getComparisonResults = () => {
    const snapA = snapshots.find(s => s.id === snapAId);
    const snapB = snapshots.find(s => s.id === snapBId);

    if (!snapA || !snapB) return null;

    const mapA = new Map<string, Player>();
    snapA.players.forEach(p => mapA.set(p.id, p));

    const mapB = new Map<string, Player>();
    snapB.players.forEach(p => mapB.set(p.id, p));

    // Altas (In B but not in A)
    const altas: Player[] = [];
    snapB.players.forEach(p => {
      if (!mapA.has(p.id)) {
        altas.push(p);
      }
    });

    // Bajas (In A but not in B)
    const bajas: Player[] = [];
    snapA.players.forEach(p => {
      if (!mapB.has(p.id)) {
        bajas.push(p);
      }
    });

    // Cambios (In both, compared stats)
    interface PlayerChange {
      id: string;
      name: string;
      position: string;
      ageA: number;
      ageB: number;
      caA: number;
      caB: number;
      paA: number;
      paB: number;
      valA: number;
      valB: number;
      wageA: number;
      wageB: number;
    }

    const changes: PlayerChange[] = [];
    snapB.players.forEach(pB => {
      const pA = mapA.get(pB.id);
      if (pA) {
        changes.push({
          id: pB.id,
          name: pB.name,
          position: pB.position,
          ageA: pA.age,
          ageB: pB.age,
          caA: pA.currentAbility,
          caB: pB.currentAbility,
          paA: pA.potentialAbility,
          paB: pB.potentialAbility,
          valA: parseValueToNumeric(pA.marketValue),
          valB: parseValueToNumeric(pB.marketValue),
          wageA: parseWageToNumeric(pA.wage),
          wageB: parseWageToNumeric(pB.wage)
        });
      }
    });

    // Filter changes based on selector
    const filteredChanges = changes.filter(c => {
      if (compareFilter === 'up') return c.caB > c.caA;
      if (compareFilter === 'down') return c.caB < c.caA;
      if (compareFilter === 'equal') return c.caB === c.caA;
      return true;
    });

    return {
      snapAName: snapA.name,
      snapBName: snapB.name,
      altas,
      bajas,
      changes: filteredChanges,
      allChangesCount: changes.length
    };
  };

  const comparison = getComparisonResults();

  // --- INDIVIDUAL PLAYER PROGRESSION ---
  // List of all unique player IDs and names across all snapshots
  const getAllUniquePlayers = () => {
    const map = new Map<string, { id: string; name: string; position: string }>();
    
    // Add current players
    currentPlayers.forEach(p => map.set(p.id, { id: p.id, name: p.name, position: p.position }));

    // Add players from snapshots
    snapshots.forEach(snap => {
      snap.players.forEach(p => {
        map.set(p.id, { id: p.id, name: p.name, position: p.position });
      });
    });

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  };

  const allPlayers = getAllUniquePlayers();
  const filteredPlayerList = allPlayers.filter(p => 
    p.name.toLowerCase().includes(playerSearchQuery.toLowerCase()) || 
    p.id.includes(playerSearchQuery) ||
    p.position.toLowerCase().includes(playerSearchQuery.toLowerCase())
  );

  // Get chronological history of the selected player
  const getPlayerHistory = (pId: string) => {
    if (!pId) return [];

    // Sort snapshots chronologically
    const sortedSnaps = [...snapshots].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const history: Array<{
      snapshotName: string;
      date: string;
      age: number;
      position: string;
      ca: number;
      pa: number;
      value: number;
      wage: number;
    }> = [];

    sortedSnaps.forEach(snap => {
      const p = snap.players.find(x => x.id === pId);
      if (p) {
        history.push({
          snapshotName: snap.name,
          date: snap.date,
          age: p.age,
          position: p.position,
          ca: p.currentAbility,
          pa: p.potentialAbility,
          value: parseValueToNumeric(p.marketValue),
          wage: parseWageToNumeric(p.wage)
        });
      }
    });

    return history;
  };

  const activePlayerHistory = getPlayerHistory(selectedPlayerId);
  const selectedPlayerMeta = allPlayers.find(p => p.id === selectedPlayerId);

  return (
    <div className="bg-slate-950 p-6 rounded-2xl border border-slate-800 space-y-6">
      
      {/* Tab Header & Intro */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <History className="text-emerald-500 w-5 h-5" /> Álbum de Plantel y Progreso de Jugadores
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Sube fotos de tu plantilla periódicamente. El sistema vinculará a los jugadores mediante su ID único de Football Manager para trazar su evolución, detectar fichajes nuevos y salidas.
          </p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 self-stretch md:self-auto">
          <button
            onClick={() => setSubTab('list')}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all
              ${subTab === 'list' 
                ? 'bg-slate-800 text-emerald-400 shadow' 
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
          >
            📸 Fotos Guardadas ({snapshots.length})
          </button>
          <button
            onClick={() => {
              setSubTab('compare');
              if (snapshots.length >= 2) {
                if (!snapAId) setSnapAId(snapshots[0].id);
                if (!snapBId) setSnapBId(snapshots[snapshots.length - 1].id);
              }
            }}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all
              ${subTab === 'compare' 
                ? 'bg-slate-800 text-emerald-400 shadow' 
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
          >
            ⚔️ Comparar Fotos
          </button>
          <button
            onClick={() => {
              setSubTab('player');
              if (allPlayers.length > 0 && !selectedPlayerId) {
                setSelectedPlayerId(allPlayers[0].id);
              }
            }}
            className={`flex-1 md:flex-none px-3.5 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all
              ${subTab === 'player' 
                ? 'bg-slate-800 text-emerald-400 shadow' 
                : 'text-slate-400 hover:text-slate-200'
              }
            `}
          >
            📈 Evolución de Jugador
          </button>
        </div>
      </div>

      {/* --- SUBTAB 1: SNAPSHOTS LIST & IMPORT --- */}
      {subTab === 'list' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Snapshots Grid (Left, 7 cols) */}
          <div className="lg:col-span-7 space-y-4">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
              Historial Cronológico de Fotos ({snapshots.length})
            </h3>

            {snapshots.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs space-y-2">
                <Calendar className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="font-semibold">No has tomado ninguna foto del plantel todavía.</p>
                <p className="text-[11px] text-slate-600 max-w-sm mx-auto">
                  Utiliza el formulario de la derecha para guardar el plantel actual o importar un archivo para crear tu primera foto.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...snapshots].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(snap => {
                  const stats = getSnapshotStats(snap.players);
                  return (
                    <div 
                      key={snap.id} 
                      className="bg-slate-900 border border-slate-800 hover:border-slate-750 p-4 rounded-xl flex flex-col justify-between space-y-3 transition group relative"
                    >
                      <div>
                        {/* Header info */}
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-sm font-bold text-white truncate pr-6">{snap.name}</h4>
                          <span className="text-[10px] font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-slate-850 whitespace-nowrap">
                            {snap.date}
                          </span>
                        </div>

                        {/* Summary Metrics */}
                        <div className="grid grid-cols-2 gap-2 mt-3 bg-slate-950/40 p-2 rounded-lg border border-slate-850/50 text-[11px] font-mono">
                          <div>
                            <span className="text-slate-500 block">Plantilla:</span>
                            <strong className="text-emerald-400">{stats.count} jugadores</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Masa Salarial:</span>
                            <strong className="text-slate-300">{formatWage(stats.totalWage)}</strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">CA Promedio:</span>
                            <strong className="text-amber-400 flex items-center gap-0.5">
                              {stats.avgCA}★
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">Edad Promedio:</span>
                            <strong className="text-slate-300">{stats.avgAge} años</strong>
                          </div>
                        </div>
                      </div>

                      {/* Action buttons inside card */}
                      <div className="flex gap-2 pt-2 border-t border-slate-800">
                        <button
                          onClick={() => {
                            if (confirm(`¿Estás seguro que quieres cargar el plantel de la foto "${snap.name}" como la plantilla activa actual de la pizarra?`)) {
                              onLoadSnapshotRoster(snap.players);
                            }
                          }}
                          className="flex-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-[11px] py-1.5 rounded-lg font-bold transition flex items-center justify-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" /> Restaurar Activa
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`¿Estás seguro de que quieres eliminar la foto "${snap.name}"? Esto borrará este historial.`)) {
                              onDeleteSnapshot(snap.id);
                            }
                          }}
                          className="p-1.5 bg-rose-950/20 hover:bg-rose-900/40 border border-rose-900/30 hover:border-rose-900/50 text-rose-400 rounded-lg transition"
                          title="Eliminar Foto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Snapshot Creation Form (Right, 5 cols) */}
          <div className="lg:col-span-5 bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" /> Tomar Nueva Foto de Plantel
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Congela el estado actual de los jugadores o sube un archivo nuevo para registrar el avance de la temporada.
              </p>
            </div>

            {/* Inputs */}
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  placeholder="Ej: Fin Mercado Verano 2026, Inicio Temporada 2"
                  value={snapName}
                  onChange={(e) => setSnapName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
                />
              </div>

              <div>
                <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block mb-1">Fecha de la Foto</label>
                <input
                  type="date"
                  value={snapDate}
                  onChange={(e) => setSnapDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>
            </div>

            {/* Source Selector */}
            <div className="space-y-2 border-t border-slate-800 pt-3">
              <label className="text-[10px] uppercase font-bold text-slate-400 font-mono block">Origen de los Datos</label>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setCreationSource('current')}
                  className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1.5
                    ${creationSource === 'current' 
                      ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }
                  `}
                >
                  <Calendar className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Pizarra Activa</span>
                </button>

                <button
                  onClick={() => setCreationSource('file')}
                  className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1.5
                    ${creationSource === 'file' 
                      ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }
                  `}
                >
                  <Upload className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Subir Archivo</span>
                </button>

                <button
                  onClick={() => setCreationSource('paste')}
                  className={`p-2 rounded-lg border text-center transition flex flex-col items-center justify-center gap-1.5
                    ${creationSource === 'paste' 
                      ? 'bg-emerald-950/20 border-emerald-500/50 text-emerald-400' 
                      : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300'
                    }
                  `}
                >
                  <Clipboard className="w-4 h-4" />
                  <span className="text-[10px] font-bold">Pegar Texto</span>
                </button>
              </div>
            </div>

            {/* Sub-form based on selection */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-850">
              {creationSource === 'current' && (
                <div className="text-xs text-slate-400 space-y-2">
                  <p>📸 Se creará una foto del plantel a partir de tus **{currentPlayers.length} jugadores** activos con su estatus y habilidades actuales.</p>
                  <p className="text-[10px] text-slate-500">Perfecto para guardar los avances manuales que hayas hecho en el visor.</p>
                </div>
              )}

              {creationSource === 'file' && (
                <div className="space-y-3">
                  <div 
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition
                      ${isDragging 
                        ? 'border-emerald-500 bg-emerald-950/10' 
                        : 'border-slate-800 hover:border-slate-750 bg-slate-900/50'
                      }
                    `}
                  >
                    <Upload className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                    <span className="text-xs font-bold block text-slate-300">
                      Arrastra tu exportado aquí o haz clic
                    </span>
                    <span className="text-[10px] text-slate-500 block mt-1">
                      Soporta archivos .txt y .csv exportados de FM
                    </span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept=".txt,.csv"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </div>

                  <div className="bg-slate-900 border border-slate-850 p-2.5 rounded-lg text-[10px] text-slate-400 leading-relaxed">
                    <strong className="text-emerald-400 block mb-0.5">💡 ¿Qué formato exportado?</strong>
                    En Football Manager puedes exportar tu vista de plantel como un archivo de texto (**Ctrl + P** e imprimir en archivo de texto) o copiarlo masivamente. Ese archivo contiene los IDs, nombres y habilidades listos para procesar.
                  </div>
                </div>
              )}

              {creationSource === 'paste' && (
                <div className="space-y-2.5">
                  <textarea
                    rows={4}
                    value={pasteText}
                    onChange={(e) => setPasteText(e.target.value)}
                    placeholder={`ID\tNombre\tEdad\tCur A\tPot A\tValor\tSueldo\n45012\tMartin Ødegaard\t25\t5\t5\t€95M\t€200K/sem`}
                    className="w-full bg-slate-900 border border-slate-850 rounded-lg p-2 text-[10px] font-mono text-slate-300 focus:outline-none focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 placeholder-slate-700"
                  />
                  <span className="text-[10px] text-slate-500 block">Pega la tabla copiada con Ctrl+A / Ctrl+C en Football Manager.</span>
                </div>
              )}
            </div>

            {/* Error and Success messaging */}
            {fileError && (
              <div className="p-2.5 bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs rounded-lg flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{fileError}</span>
              </div>
            )}
            {successMsg && (
              <div className="p-2.5 bg-emerald-950/20 border border-emerald-900/30 text-emerald-400 text-xs rounded-lg flex items-center gap-1.5">
                <Check className="w-4 h-4 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Submit Button */}
            {creationSource !== 'file' && (
              <button
                onClick={handleCreateSnapshot}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 rounded-lg transition shadow-lg shadow-emerald-950/20 flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Tomar Foto del Plantel
              </button>
            )}

            {/* Help guidelines inside snap form */}
            <div className="border-t border-slate-800 pt-3 text-[10px] text-slate-500 space-y-1">
              <span className="font-bold text-slate-400 block">¿Cómo te sirve más pasar los archivos?</span>
              <p>
                El sistema lee perfectamente archivos **.txt** y **.csv** generados con la tabla del plantel de FM. Se recomienda copiar todo en FM (**Ctrl + A** y **Ctrl + C**) y usar la opción **Pegar Texto** para una velocidad instantánea.
              </p>
            </div>

          </div>

        </div>
      )}

      {/* --- SUBTAB 2: COMPARE SNAPSHOTS --- */}
      {subTab === 'compare' && (
        <div className="space-y-6">
          
          {/* Selectors */}
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-wrap items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">Foto Inicial (A)</span>
                <select
                  value={snapAId}
                  onChange={(e) => setSnapAId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none"
                >
                  {snapshots.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.date})</option>
                  ))}
                </select>
              </div>

              <div className="text-slate-600 self-end mb-2 hidden sm:block">
                <ArrowRight className="w-4 h-4" />
              </div>

              <div>
                <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">Foto Posterior (B)</span>
                <select
                  value={snapBId}
                  onChange={(e) => setSnapBId(e.target.value)}
                  className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 focus:outline-none"
                >
                  {snapshots.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.date})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Progression Filter */}
            <div>
              <span className="text-[10px] uppercase font-mono font-bold text-slate-500 block mb-1">Filtro de Evolución (CA)</span>
              <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-[11px] font-sans font-medium">
                <button
                  onClick={() => setCompareFilter('all')}
                  className={`px-2.5 py-1 rounded transition
                    ${compareFilter === 'all' ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-200'}
                  `}
                >
                  Todos
                </button>
                <button
                  onClick={() => setCompareFilter('up')}
                  className={`px-2.5 py-1 rounded transition flex items-center gap-0.5
                    ${compareFilter === 'up' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30 font-bold' : 'text-slate-400 hover:text-slate-200'}
                  `}
                >
                  <TrendingUp className="w-3 h-3" /> Subieron
                </button>
                <button
                  onClick={() => setCompareFilter('down')}
                  className={`px-2.5 py-1 rounded transition flex items-center gap-0.5
                    ${compareFilter === 'down' ? 'bg-rose-950/40 text-rose-400 border border-rose-900/30 font-bold' : 'text-slate-400 hover:text-slate-200'}
                  `}
                >
                  <TrendingDown className="w-3 h-3" /> Bajaron
                </button>
              </div>
            </div>

          </div>

          {/* Validation of enough snapshots */}
          {snapshots.length < 2 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-xs space-y-2">
              <HelpCircle className="w-8 h-8 text-slate-700 mx-auto" />
              <p className="font-semibold text-slate-300">Se necesitan al menos 2 fotos del plantel para comparar.</p>
              <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                Toma una foto inicial de tu equipo actual, juega unos meses en tu partida, exporta la nueva plantilla y toma una segunda foto para compararlas aquí.
              </p>
            </div>
          ) : !comparison ? (
            <div className="text-center text-slate-500 text-xs">Error de emparejamiento. Revisa las fotos seleccionadas.</div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* ALTAS / BAJAS SUMMARY COLUMN (Left, 4 cols) */}
              <div className="lg:col-span-4 space-y-5">
                
                {/* ALTAS (Signings) */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-emerald-400 flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5"><UserPlus className="w-4 h-4" /> Altas / Nuevos ({comparison.altas.length})</span>
                    <span className="text-[10px] bg-emerald-950 border border-emerald-900 text-emerald-400 px-1.5 py-0.2 rounded font-normal font-mono">
                      + Incorporaciones
                    </span>
                  </h4>

                  {comparison.altas.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No se detectaron nuevos jugadores en esta foto.</p>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {comparison.altas.map(p => (
                        <div key={p.id} className="bg-slate-950 border border-slate-850 p-2 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-white block truncate max-w-[150px]">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{p.position} • {p.age} años</span>
                          </div>
                          <div className="text-right font-mono text-[10px]">
                            <span className="text-emerald-400 block">{p.marketValue}</span>
                            <span className="text-slate-500">{p.currentAbility}★ CA</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* BAJAS (Departures) */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold uppercase font-mono tracking-wider text-rose-400 flex items-center justify-between border-b border-slate-800 pb-2">
                    <span className="flex items-center gap-1.5"><UserMinus className="w-4 h-4" /> Bajas / Salidas ({comparison.bajas.length})</span>
                    <span className="text-[10px] bg-rose-950 border border-rose-900 text-rose-400 px-1.5 py-0.2 rounded font-normal font-mono">
                      - Bajas del Club
                    </span>
                  </h4>

                  {comparison.bajas.length === 0 ? (
                    <p className="text-[11px] text-slate-500 italic">No se detectaron salidas en esta foto.</p>
                  ) : (
                    <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                      {comparison.bajas.map(p => (
                        <div key={p.id} className="bg-slate-950 border border-slate-850 p-2 rounded-lg flex justify-between items-center text-xs">
                          <div>
                            <span className="font-bold text-slate-300 block truncate max-w-[150px]">{p.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{p.position} • {p.age} años</span>
                          </div>
                          <div className="text-right font-mono text-[10px] text-slate-500">
                            <span className="block strike">{p.marketValue}</span>
                            <span>{p.currentAbility}★ CA</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* CORE PROGRESSION LIST (Right, 8 cols) */}
              <div className="lg:col-span-8 bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Rendimiento y Variación de Atributos ({comparison.changes.length})
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Seguimiento de jugadores presentes en ambos planteles. Compara su Habilidad Actual (CA) y valorización.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-slate-500">
                    Estables: {comparison.allChangesCount - comparison.altas.length - comparison.bajas.length} jug.
                  </span>
                </div>

                {comparison.changes.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-xs italic">
                    Ningún jugador coincide con el filtro seleccionado.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-mono text-[10px] uppercase">
                          <th className="py-2.5 font-bold">Jugador</th>
                          <th className="py-2.5 text-center font-bold">Edad</th>
                          <th className="py-2.5 text-center font-bold">Habilidad (CA)</th>
                          <th className="py-2.5 text-center font-bold">Potencial (PA)</th>
                          <th className="py-2.5 text-right font-bold">Sueldo /sem</th>
                          <th className="py-2.5 text-right font-bold">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850">
                        {comparison.changes.map(c => {
                          const caDiff = c.caB - c.caA;
                          const paDiff = c.paB - c.paA;
                          const wageDiff = c.wageB - c.wageA;
                          const valDiff = c.valB - c.valA;

                          return (
                            <tr key={c.id} className="hover:bg-slate-950/40 transition group">
                              {/* Player & Pos */}
                              <td className="py-3">
                                <span className="font-bold text-white block group-hover:text-emerald-400 transition cursor-pointer" onClick={() => {
                                  setSelectedPlayerId(c.id);
                                  setSubTab('player');
                                }}>
                                  {c.name}
                                </span>
                                <span className="text-[10px] text-slate-500 font-mono uppercase">{c.position}</span>
                              </td>

                              {/* Age change */}
                              <td className="py-3 text-center font-mono text-slate-300">
                                {c.ageA === c.ageB ? `${c.ageA}` : `${c.ageA} ➔ ${c.ageB}`}
                              </td>

                              {/* CA Change */}
                              <td className="py-3 text-center">
                                <div className="inline-flex items-center gap-1.5 bg-slate-950 px-2 py-0.5 rounded border border-slate-850 font-mono text-[11px]">
                                  <span className="text-slate-400">{c.caA}★</span>
                                  <span className="text-slate-600">➔</span>
                                  <span className="text-white font-bold">{c.caB}★</span>
                                  {caDiff > 0 && <span className="text-emerald-400 text-[10px] font-bold">+{caDiff}</span>}
                                  {caDiff < 0 && <span className="text-rose-400 text-[10px] font-bold">{caDiff}</span>}
                                </div>
                              </td>

                              {/* PA Change */}
                              <td className="py-3 text-center">
                                <div className="inline-flex items-center gap-1 text-slate-400 font-mono text-[11px]">
                                  <span>{c.paA}★</span>
                                  <span className="text-slate-700">➔</span>
                                  <span className="text-slate-200">{c.paB}★</span>
                                  {paDiff > 0 && <span className="text-emerald-500 text-[10px] font-bold">+{paDiff}</span>}
                                  {paDiff < 0 && <span className="text-rose-500 text-[10px] font-bold">{paDiff}</span>}
                                </div>
                              </td>

                              {/* Wage Change */}
                              <td className="py-3 text-right font-mono text-[11px]">
                                <span className="text-slate-300 block">{formatWage(c.wageB)}</span>
                                {wageDiff !== 0 && (
                                  <span className={`text-[10px] ${wageDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {wageDiff > 0 ? `+${formatWage(wageDiff)}` : `-${formatWage(Math.abs(wageDiff))}`}
                                  </span>
                                )}
                              </td>

                              {/* Value Change */}
                              <td className="py-3 text-right font-mono text-[11px]">
                                <span className="text-emerald-400 font-bold block">{formatValue(c.valB)}</span>
                                {valDiff !== 0 && (
                                  <span className={`text-[10px] font-bold ${valDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                    {valDiff > 0 ? `+${formatValue(valDiff)}` : `-${formatValue(Math.abs(valDiff))}`}
                                  </span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

        </div>
      )}

      {/* --- SUBTAB 3: INDIVIDUAL PROGRESSION TRACKER --- */}
      {subTab === 'player' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Player Selector (Left, 4 cols) */}
          <div className="lg:col-span-4 bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col h-[520px]">
            <span className="text-[10px] uppercase font-mono font-bold text-slate-400 block mb-2">
              Buscar Jugador ({allPlayers.length})
            </span>
            <div className="relative mb-3">
              <input
                type="text"
                placeholder="Buscar por nombre o ID..."
                value={playerSearchQuery}
                onChange={(e) => setPlayerSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-3 pr-8 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none"
              />
            </div>

            {/* List scrollable */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              {filteredPlayerList.map(p => (
                <button
                  key={p.id}
                  onClick={() => setSelectedPlayerId(p.id)}
                  className={`w-full text-left p-2.5 rounded-lg flex justify-between items-center transition text-xs
                    ${selectedPlayerId === p.id 
                      ? 'bg-slate-850 border border-emerald-500/30 text-emerald-400 shadow' 
                      : 'bg-slate-950/40 hover:bg-slate-950 border border-slate-850/30 hover:border-slate-800 text-slate-300'
                    }
                  `}
                >
                  <div className="truncate max-w-[180px]">
                    <span className="font-bold block truncate">{p.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono">ID: {p.id}</span>
                  </div>
                  <span className="text-[10px] bg-slate-900 px-1.5 py-0.5 rounded font-mono border border-slate-800 text-slate-400 shrink-0 uppercase">
                    {p.position}
                  </span>
                </button>
              ))}

              {filteredPlayerList.length === 0 && (
                <p className="text-center text-slate-600 py-8 text-xs italic">No hay jugadores.</p>
              )}
            </div>
          </div>

          {/* Player Evolution Timeline / Custom SVG Chart (Right, 8 cols) */}
          <div className="lg:col-span-8 bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col justify-between min-h-[520px]">
            
            {/* Player details header */}
            {!selectedPlayerMeta ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-500 p-8 space-y-2">
                <HelpCircle className="w-10 h-10 text-slate-700" />
                <p className="font-semibold">Selecciona un jugador para auditar su progreso</p>
                <p className="text-[11px] text-slate-600 max-w-sm">
                  Verás un gráfico histórico detallado de sus habilidades y su valor en el tiempo a lo largo de todas tus fotos.
                </p>
              </div>
            ) : (
              <div className="space-y-6 flex-1 flex flex-col">
                
                {/* Header Profile Info */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[9px] bg-emerald-950/50 text-emerald-400 border border-emerald-900/40 px-2 py-0.5 rounded font-mono font-bold uppercase tracking-wider">
                      Ficha de Evolución FM
                    </span>
                    <h3 className="text-lg font-bold text-white mt-1">{selectedPlayerMeta.name}</h3>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      ID ÚNICO DE REGISTRO: <span className="text-slate-300 font-bold">{selectedPlayerMeta.id}</span> • POSICIÓN: <span className="text-slate-300 font-bold">{selectedPlayerMeta.position}</span>
                    </p>
                  </div>

                  <div className="text-right font-mono">
                    <span className="text-slate-500 text-[10px] block">Fotos Registrado:</span>
                    <strong className="text-emerald-400 text-sm">{activePlayerHistory.length} / {snapshots.length}</strong>
                  </div>
                </div>

                {/* History Analytics Content */}
                {activePlayerHistory.length < 1 ? (
                  <div className="flex-1 flex items-center justify-center text-center p-8 text-slate-500 italic text-xs">
                    Este jugador no registra participación en ninguna foto de plantel guardada.
                  </div>
                ) : (
                  <div className="space-y-6 flex-1 flex flex-col">
                    
                    {/* CUSTOM SVG PROGRESSION CHART */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono">
                          Gráfico de Habilidad Temporal (Progreso de Calidad)
                        </span>
                        {/* Legend */}
                        <div className="flex items-center gap-3 text-[10px] font-mono">
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-emerald-400 rounded-full inline-block"></span> CA (Habilidad Actual)</span>
                          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-purple-500 rounded-full inline-block"></span> PA (Habilidad Potencial)</span>
                        </div>
                      </div>

                      {/* Line Chart Render */}
                      <div className="bg-slate-950 rounded-xl p-4 border border-slate-850 relative">
                        {activePlayerHistory.length < 2 ? (
                          <div className="h-44 flex items-center justify-center text-center text-slate-600 text-xs italic">
                            Se necesitan al menos 2 fotos del plantel con este jugador para graficar su línea de tendencia.
                          </div>
                        ) : (
                          <div className="w-full">
                            {/* Simple dynamic responsive SVG generator */}
                            <svg viewBox="0 0 500 160" className="w-full h-44 overflow-visible">
                              {/* Horizontal Grid lines (1 to 5 stars) */}
                              {[1, 2, 3, 4, 5].map((star) => {
                                const y = 140 - (star - 1) * 28;
                                return (
                                  <g key={star} className="opacity-20">
                                    <line x1="40" y1={y} x2="480" y2={y} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
                                    <text x="15" y={y + 4} fill="#94a3b8" fontSize="9" fontFamily="monospace">{star}★</text>
                                  </g>
                                );
                              })}

                              {/* Snapshot Labels at Bottom */}
                              {activePlayerHistory.map((pt, index) => {
                                const count = activePlayerHistory.length;
                                const x = 40 + (index * (440 / (count - 1)));
                                return (
                                  <g key={index} className="opacity-40">
                                    <line x1={x} y1="20" x2={x} y2="140" stroke="#334155" strokeWidth="0.5" />
                                    <text x={x} y="152" fill="#94a3b8" fontSize="8" textAnchor="middle" className="font-mono">
                                      {pt.snapshotName.slice(0, 10)}
                                    </text>
                                  </g>
                                );
                              })}

                              {/* Draw PA Line Path (Potential) */}
                              {(() => {
                                const count = activePlayerHistory.length;
                                const points = activePlayerHistory.map((pt, index) => {
                                  const x = 40 + (index * (440 / (count - 1)));
                                  const y = 140 - (pt.pa - 1) * 28;
                                  return `${x},${y}`;
                                }).join(' ');

                                return (
                                  <>
                                    <polyline fill="none" stroke="#a855f7" strokeWidth="2.5" strokeDasharray="4 4" points={points} className="opacity-70" />
                                    {activePlayerHistory.map((pt, index) => {
                                      const x = 40 + (index * (440 / (count - 1)));
                                      const y = 140 - (pt.pa - 1) * 28;
                                      return (
                                        <g key={`pa-pt-${index}`}>
                                          <circle cx={x} cy={y} r="3.5" fill="#1e1b4b" stroke="#a855f7" strokeWidth="2" />
                                          <text x={x} y={y - 8} fill="#d8b4fe" fontSize="8" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                            {pt.pa}
                                          </text>
                                        </g>
                                      );
                                    })}
                                  </>
                                );
                              })()}

                              {/* Draw CA Line Path (Current) */}
                              {(() => {
                                const count = activePlayerHistory.length;
                                const points = activePlayerHistory.map((pt, index) => {
                                  const x = 40 + (index * (440 / (count - 1)));
                                  const y = 140 - (pt.ca - 1) * 28;
                                  return `${x},${y}`;
                                }).join(' ');

                                return (
                                  <>
                                    <polyline fill="none" stroke="#34d399" strokeWidth="3" points={points} />
                                    {activePlayerHistory.map((pt, index) => {
                                      const x = 40 + (index * (440 / (count - 1)));
                                      const y = 140 - (pt.ca - 1) * 28;
                                      return (
                                        <g key={`ca-pt-${index}`}>
                                          <circle cx={x} cy={y} r="4.5" fill="#34d399" />
                                          <text x={x} y={y + 12} fill="#34d399" fontSize="9" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
                                            {pt.ca}★
                                          </text>
                                        </g>
                                      );
                                    })}
                                  </>
                                );
                              })()}
                            </svg>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Timeline Data Table */}
                    <div className="flex-1 space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 font-mono block">
                        Registros Históricos del Jugador ({activePlayerHistory.length})
                      </span>
                      <div className="overflow-x-auto rounded-lg border border-slate-800">
                        <table className="w-full text-left text-xs text-slate-300">
                          <thead className="bg-slate-950 font-mono text-[9px] uppercase tracking-wider text-slate-500">
                            <tr>
                              <th className="p-2.5">Foto de Plantel</th>
                              <th className="p-2.5 text-center">Edad</th>
                              <th className="p-2.5 text-center">Habilidad (CA)</th>
                              <th className="p-2.5 text-center">Potencial (PA)</th>
                              <th className="p-2.5 text-right">Sueldo /sem</th>
                              <th className="p-2.5 text-right">Valor de Mercado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-850">
                            {activePlayerHistory.map((record, index) => {
                              // Calculate value differences
                              const prevRecord = index > 0 ? activePlayerHistory[index - 1] : null;
                              const valDiff = prevRecord ? record.value - prevRecord.value : 0;
                              const caDiff = prevRecord ? record.ca - prevRecord.ca : 0;

                              return (
                                <tr key={index} className="hover:bg-slate-950/20">
                                  <td className="p-2.5 font-bold">
                                    <span className="text-white block">{record.snapshotName}</span>
                                    <span className="text-[9px] text-slate-500 font-mono block">{record.date}</span>
                                  </td>
                                  <td className="p-2.5 text-center font-mono">{record.age}y</td>
                                  <td className="p-2.5 text-center">
                                    <span className="font-bold font-mono inline-flex items-center gap-1">
                                      {record.ca}★
                                      {caDiff > 0 && <span className="text-emerald-400 text-[10px]">(+{caDiff})</span>}
                                      {caDiff < 0 && <span className="text-rose-400 text-[10px]">({caDiff})</span>}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-center font-mono text-slate-400">{record.pa}★</td>
                                  <td className="p-2.5 text-right font-mono text-slate-300">{formatWage(record.wage)}</td>
                                  <td className="p-2.5 text-right font-mono">
                                    <span className="text-emerald-400 font-bold block">{formatValue(record.value)}</span>
                                    {valDiff !== 0 && (
                                      <span className={`text-[9px] font-bold ${valDiff > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                        {valDiff > 0 ? `+${formatValue(valDiff)}` : `-${formatValue(Math.abs(valDiff))}`}
                                      </span>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* General bottom advice */}
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-850 mt-4 text-[10px] text-slate-500 flex items-start gap-2">
              <Clock className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
              <p>
                Los jugadores se emparejan estrictamente por el **ID** único. Si cambias de nombre al jugador pero mantienes el ID, el sistema seguirá sabiendo que es el mismo jugador y mostrará su progresión de forma impecable.
              </p>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
