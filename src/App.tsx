import React, { useState, useEffect } from 'react';
import { Player, PitchPosition, Formation, SquadPlan, Snapshot } from './types';
import { defaultPlayers, defaultFormations } from './defaultPlayers';
import { PitchView } from './components/PitchView';
import { RosterManager } from './components/RosterManager';
import { ClipboardImporter } from './components/ClipboardImporter';
import { ProgressionTracker } from './components/ProgressionTracker';
import { PlanningGrid, getAutoColumn } from './components/PlanningGrid';
import { isTurkishPlayer } from './utils/flags';
import { 
  Users, 
  Settings, 
  HelpCircle, 
  Shield, 
  FileCode, 
  BarChart2, 
  Star, 
  AlertCircle, 
  Check, 
  X, 
  TrendingUp, 
  ArrowRight,
  Sparkles,
  Search,
  Download,
  Upload,
  History
} from 'lucide-react';

export default function App() {
  // Global States
  const [players, setPlayers] = useState<Player[]>(() => {
    const saved = localStorage.getItem("fm_players");
    const rawList: Player[] = saved ? JSON.parse(saved) : defaultPlayers;
    const seen = new Set<string>();
    return rawList.filter(p => {
      if (!p || !p.id) return false;
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  });

  const [assignments, setAssignments] = useState<Record<string, { titular: string | null; suplente: string | null; juvenil: string | null }>>(() => {
    const saved = localStorage.getItem("fm_assignments");
    return saved ? JSON.parse(saved) : {};
  });

  const [activeFormationKey, setActiveFormationKey] = useState<string>(() => {
    return localStorage.getItem("fm_active_formation") || "4231";
  });

  const [snapshots, setSnapshots] = useState<Snapshot[]>(() => {
    const saved = localStorage.getItem("fm_snapshots");
    return saved ? JSON.parse(saved) : [];
  });

  const [gameYear, setGameYear] = useState<number>(() => {
    const saved = localStorage.getItem("fm_game_year");
    return saved ? parseInt(saved, 10) : 2036;
  });

  const [gameDate, setGameDate] = useState<string>(() => {
    const saved = localStorage.getItem("fm_game_date");
    return saved ? saved : `30/06/${saved ? parseInt(saved, 10) : 2036}`;
  });

  const [isEditingYear, setIsEditingYear] = useState(false);
  const [tempYearInput, setTempYearInput] = useState(String(gameYear));

  // keep tempYearInput in sync with gameYear
  useEffect(() => {
    setTempYearInput(String(gameYear));
  }, [gameYear]);

  // Sync gameDate with localStorage and update gameYear if gameDate is edited elsewhere
  useEffect(() => {
    localStorage.setItem("fm_game_date", gameDate);
    const parts = gameDate.split(/[\.\-\/]+/);
    if (parts.length === 3) {
      const year = parseInt(parts[2]);
      if (!isNaN(year) && year >= 1900 && year <= 2100) {
        setGameYear(year);
      }
    }
  }, [gameDate]);

  const updateGameYear = (year: number) => {
    setGameYear(year);
    const parts = gameDate.split(/[\.\-\/]+/);
    if (parts.length === 3) {
      setGameDate(`${parts[0]}/${parts[1]}/${year}`);
    } else {
      setGameDate(`30/06/${year}`);
    }
  };

  const handleYearSubmit = () => {
    const val = parseInt(tempYearInput, 10);
    if (!isNaN(val) && val >= 1900 && val <= 2100) {
      updateGameYear(val);
    } else {
      setTempYearInput(String(gameYear));
    }
    setIsEditingYear(false);
  };

  const monthsList = [
    { value: 1, label: 'Enero' },
    { value: 2, label: 'Febrero' },
    { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Mayo' },
    { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' },
    { value: 11, label: 'Noviembre' },
    { value: 12, label: 'Diciembre' },
  ];

  const getGameMonth = (): number => {
    const parts = gameDate.split(/[\.\-\/]+/);
    if (parts.length === 3) {
      const month = parseInt(parts[1], 10);
      if (!isNaN(month) && month >= 1 && month <= 12) {
        return month;
      }
    }
    return 6; // default to June (06)
  };

  const updateGameMonth = (month: number) => {
    const parts = gameDate.split(/[\.\-\/]+/);
    const day = parts.length === 3 ? parts[0] : '30';
    const year = parts.length === 3 ? parts[2] : String(gameYear);
    const formattedMonth = String(month).padStart(2, '0');
    setGameDate(`${day}/${formattedMonth}/${year}`);
  };

  const [activeTab, setActiveTab] = useState<'squad_pitch' | 'players_list' | 'clipboard_import' | 'stats' | 'progression_tracker' | 'planning_grid'>('planning_grid');
  const [selectedPosition, setSelectedPosition] = useState<PitchPosition | null>(null);
  const [candidateSearch, setCandidateSearch] = useState('');
  const [showAllCandidates, setShowAllCandidates] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Auto-hide toast after 4 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Auto-save states in localStorage
  useEffect(() => {
    localStorage.setItem("fm_players", JSON.stringify(players));
  }, [players]);

  useEffect(() => {
    localStorage.setItem("fm_snapshots", JSON.stringify(snapshots));
  }, [snapshots]);

  useEffect(() => {
    localStorage.setItem("fm_assignments", JSON.stringify(assignments));
  }, [assignments]);

  useEffect(() => {
    localStorage.setItem("fm_active_formation", activeFormationKey);
  }, [activeFormationKey]);

  useEffect(() => {
    localStorage.setItem("fm_game_year", String(gameYear));
  }, [gameYear]);

  // Find active formation object
  const activeFormation = defaultFormations.find(f => f.key === activeFormationKey) || defaultFormations[0];

  // Helper: Assign a player to a specific position and role
  const assignPlayer = (playerId: string, posKey: string, role: 'titular' | 'suplente' | 'juvenil') => {
    const nextAssignments = { ...assignments };

    // Initialize position block if empty
    if (!nextAssignments[posKey]) {
      nextAssignments[posKey] = { titular: null, suplente: null, juvenil: null };
    }

    // 1. Remove this player from any previous slot in assignments to avoid duplicates on the pitch
    Object.keys(nextAssignments).forEach(pk => {
      const slot = nextAssignments[pk];
      if (slot) {
        if (slot.titular === playerId) slot.titular = null;
        if (slot.suplente === playerId) slot.suplente = null;
        if (slot.juvenil === playerId) slot.juvenil = null;
      }
    });

    // 2. Clear old player from current slot and record ID to reset status
    const prevPlayerId = nextAssignments[posKey][role];

    // 3. Assign new player
    nextAssignments[posKey][role] = playerId;

    // 4. Update the player lists to match squad statuses
    setPlayers(prevPlayers => prevPlayers.map(p => {
      // Set newly assigned player's status to their pitch role
      if (p.id === playerId) {
        return { ...p, squadStatus: role };
      }
      // Reset the kicked-out player's status to unassigned
      if (prevPlayerId && p.id === prevPlayerId) {
        return { ...p, squadStatus: 'no_asignado' };
      }
      return p;
    }));

    setAssignments(nextAssignments);
    setCandidateSearch('');
  };

  // Helper: Unassign a player from a role
  const unassignPlayer = (posKey: string, role: 'titular' | 'suplente' | 'juvenil') => {
    const nextAssignments = { ...assignments };
    if (!nextAssignments[posKey]) return;

    const playerId = nextAssignments[posKey][role];
    if (!playerId) return;

    nextAssignments[posKey][role] = null;

    setPlayers(prevPlayers => prevPlayers.map(p => {
      if (p.id === playerId) {
        return { ...p, squadStatus: 'no_asignado' };
      }
      return p;
    }));

    setAssignments(nextAssignments);
  };

  // Helper: Try to auto assign a player to an empty compatible pitch slot
  const tryAutoAssignToPitch = (player: Player, role: 'titular' | 'suplente' | 'juvenil', currentAssignments: Record<string, { titular: string | null; suplente: string | null; juvenil: string | null }>, formation: Formation) => {
    const nextAssignments = { ...currentAssignments };

    // 1. Is this player already assigned somewhere on the pitch?
    let isAlreadyAssigned = false;
    Object.keys(nextAssignments).forEach(pk => {
      const slot = nextAssignments[pk];
      if (slot && (slot.titular === player.id || slot.suplente === player.id || slot.juvenil === player.id)) {
        isAlreadyAssigned = true;
      }
    });

    if (isAlreadyAssigned) return nextAssignments;

    // 2. Determine generic position in matrix
    const genericPos = player.assignedPosition || getAutoColumn(player.position);

    // 3. Find compatible position key in formation
    const matchedPosition = formation.positions.find(pos => {
      const slot = nextAssignments[pos.key];
      // Skip if slot for this role is already filled
      if (slot && slot[role]) return false;

      const shortLabelUpper = pos.shortLabel.toUpperCase();
      const playerPosUpper = player.position.toUpperCase();

      if (genericPos === 'GK' && (pos.key === 'GK' || shortLabelUpper.includes('POR'))) return true;
      if (genericPos === 'DFCD' && (pos.key === 'DFCR' || shortLabelUpper.includes('DFC D') || shortLabelUpper.includes('DFC C'))) return true;
      if (genericPos === 'DFCI' && (pos.key === 'DFCL' || shortLabelUpper.includes('DFC I') || shortLabelUpper.includes('DFC C'))) return true;
      if (genericPos === 'WR' && (pos.key === 'DFR' || pos.key === 'WBR' || shortLabelUpper.includes('DFD') || shortLabelUpper.includes('CR D'))) return true;
      if (genericPos === 'WL' && (pos.key === 'DFL' || pos.key === 'WBL' || shortLabelUpper.includes('DFI') || shortLabelUpper.includes('CR I'))) return true;
      if (genericPos === 'DM' && (pos.key === 'DM' || shortLabelUpper.includes('MCD'))) return true;
      if (genericPos === 'MC' && (pos.key === 'MCR' || pos.key === 'MCL' || pos.key === 'MCC' || shortLabelUpper.includes('MC D') || shortLabelUpper.includes('MC I') || shortLabelUpper.includes('MC C'))) return true;
      if (genericPos === 'MPC' && (pos.key === 'AMC' || shortLabelUpper.includes('ENG') || shortLabelUpper.includes('MPC') || shortLabelUpper.includes('SD'))) return true;
      if (genericPos === 'MPI' && (pos.key === 'AML' || pos.key === 'ML' || shortLabelUpper.includes('MP I') || shortLabelUpper.includes('MI'))) return true;
      if (genericPos === 'MPD' && (pos.key === 'AMR' || pos.key === 'MR' || shortLabelUpper.includes('MP D') || shortLabelUpper.includes('MD'))) return true;
      if (genericPos === 'DLC' && (pos.key === 'STC' || pos.key === 'STCL' || pos.key === 'STCR' || shortLabelUpper.includes('DL') || shortLabelUpper.includes('DL D') || shortLabelUpper.includes('DL I'))) return true;

      return pos.compatiblePositions.some(comp => playerPosUpper.includes(comp.toUpperCase()));
    });

    if (matchedPosition) {
      if (!nextAssignments[matchedPosition.key]) {
        nextAssignments[matchedPosition.key] = { titular: null, suplente: null, juvenil: null };
      }
      nextAssignments[matchedPosition.key][role] = player.id;
    }

    return nextAssignments;
  };

  // Callback: Update existing player (from table inline editing or custom editing)
  const handleUpdatePlayer = (updatedPlayer: Player) => {
    let resolvedPlayer = { ...updatedPlayer };
    if (!resolvedPlayer.assignedPosition) {
      resolvedPlayer.assignedPosition = getAutoColumn(resolvedPlayer.position);
    }

    const nextAssignments = { ...assignments };
    let assignmentsChanged = false;

    // 1. Remove from all existing slots first (to avoid duplicates or if their status changed)
    Object.keys(nextAssignments).forEach(pk => {
      const slot = nextAssignments[pk];
      if (slot) {
        if (slot.titular === resolvedPlayer.id) {
          slot.titular = null;
          assignmentsChanged = true;
        }
        if (slot.suplente === resolvedPlayer.id) {
          slot.suplente = null;
          assignmentsChanged = true;
        }
        if (slot.juvenil === resolvedPlayer.id) {
          slot.juvenil = null;
          assignmentsChanged = true;
        }
      }
    });

    // 2. If their status is pitch-eligible, try to auto-assign them
    if (resolvedPlayer.squadStatus === 'titular' || resolvedPlayer.squadStatus === 'suplente' || resolvedPlayer.squadStatus === 'juvenil') {
      const role = resolvedPlayer.squadStatus;
      const autoAssigned = tryAutoAssignToPitch(resolvedPlayer, role, nextAssignments, activeFormation);
      Object.assign(nextAssignments, autoAssigned);
      assignmentsChanged = true;
    }

    setPlayers(prevPlayers => prevPlayers.map(p => p.id === resolvedPlayer.id ? resolvedPlayer : p));
    if (assignmentsChanged) {
      setAssignments(nextAssignments);
    }
  };

  // Callback: Register brand new player
  const handleAddPlayer = (newPlayer: Player) => {
    let resolvedPlayer = { ...newPlayer };
    if (!resolvedPlayer.assignedPosition) {
      resolvedPlayer.assignedPosition = getAutoColumn(resolvedPlayer.position);
    }

    const nextAssignments = { ...assignments };
    let assignmentsChanged = false;

    if (resolvedPlayer.squadStatus === 'titular' || resolvedPlayer.squadStatus === 'suplente' || resolvedPlayer.squadStatus === 'juvenil') {
      const role = resolvedPlayer.squadStatus;
      const autoAssigned = tryAutoAssignToPitch(resolvedPlayer, role, nextAssignments, activeFormation);
      Object.assign(nextAssignments, autoAssigned);
      assignmentsChanged = true;
    }

    setPlayers(prev => [resolvedPlayer, ...prev]);
    if (assignmentsChanged) {
      setAssignments(nextAssignments);
    }
  };

  // Callback: Delete player from roster
  const handleDeletePlayer = (playerId: string) => {
    // Also remove from assignments if assigned
    const nextAssignments = { ...assignments };
    let assignmentsChanged = false;

    Object.keys(nextAssignments).forEach(pk => {
      const slot = nextAssignments[pk];
      if (slot) {
        if (slot.titular === playerId) {
          slot.titular = null;
          assignmentsChanged = true;
        }
        if (slot.suplente === playerId) {
          slot.suplente = null;
          assignmentsChanged = true;
        }
        if (slot.juvenil === playerId) {
          slot.juvenil = null;
          assignmentsChanged = true;
        }
      }
    });

    setPlayers(prev => prev.filter(p => p.id !== playerId));
    if (assignmentsChanged) {
      setAssignments(nextAssignments);
    }
  };

  // Callback: Clipboard paste massive import
  const handleImportPlayers = (newPlayers: Player[], mode: 'replace' | 'append') => {
    setPlayers(prev => {
      const prevMap = new Map<string, Player>();
      prev.forEach(p => prevMap.set(p.id, p));

      const processedNew = newPlayers.map(p => {
        const existing = prevMap.get(p.id);
        if (existing) {
          // Merge: keep status, assigned matrix position, and notes, but update stats (age, value, wage, ratings, nationality)
          let mergedStatus = existing.squadStatus;
          if (mergedStatus === 'no_asignado' && p.squadStatus !== 'no_asignado') {
            mergedStatus = p.squadStatus;
          } else if (mergedStatus as string === 'cedido') {
            mergedStatus = 'cedidos';
          } else if (mergedStatus as string === 'vender') {
            mergedStatus = 'venta';
          }
          return {
            ...p,
            squadStatus: mergedStatus,
            assignedPosition: existing.assignedPosition || p.assignedPosition || getAutoColumn(p.position),
            notes: existing.notes || p.notes
          };
        } else {
          // New player: auto-detect tactical column and map status
          let status = p.squadStatus;
          if (status === 'no_asignado') {
            status = 'recambio';
          } else if (status as string === 'cedido') {
            status = 'cedidos';
          } else if (status as string === 'vender') {
            status = 'venta';
          }
          const autoCol = p.assignedPosition || getAutoColumn(p.position);
          return {
            ...p,
            assignedPosition: autoCol,
            squadStatus: status,
            notes: p.notes || "Nuevo jugador importado"
          };
        }
      });

      // Deduplicate processedNew within itself
      const seenIds = new Set<string>();
      const deduplicatedNew = processedNew.filter(p => {
        if (!p || !p.id) return false;
        if (seenIds.has(p.id)) return false;
        seenIds.add(p.id);
        return true;
      });

      if (mode === 'replace') {
        return deduplicatedNew;
      } else {
        const existingIds = new Set(prev.map(x => x.id));
        const filteredNew = deduplicatedNew.filter(x => !existingIds.has(x.id));
        return [...filteredNew, ...prev];
      }
    });
  };

  // Reset entirely to standard default 110 database
  const handleDeleteAllPlayers = () => {
    setPlayers([]);
    setAssignments({});
  };

  const handleResetToDefaults = () => {
    setPlayers(defaultPlayers);
    setAssignments({});
    setSnapshots([]);
    setActiveFormationKey("4231");
    setSelectedPosition(null);
    localStorage.removeItem("fm_ai_report");
  };

  // --- SNAPSHOT LIFECYCLE HANDLERS ---
  const handleSaveSnapshot = (name: string, date: string, playersList: Player[]) => {
    const newSnapshot: Snapshot = {
      id: `snap_${Date.now()}`,
      name,
      date,
      players: JSON.parse(JSON.stringify(playersList))
    };
    setSnapshots(prev => [...prev, newSnapshot]);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots(prev => prev.filter(s => s.id !== id));
  };

  const handleLoadSnapshotRoster = (playersList: Player[]) => {
    // Overwrite the main active squad roster with this snapshot's state
    setPlayers(JSON.parse(JSON.stringify(playersList)));
    
    // Clean up or remove orphan assignments that don't exist in this snapshot
    const validPlayerIds = new Set(playersList.map(p => p.id));
    const nextAssignments = { ...assignments };
    let assignmentsChanged = false;

    Object.keys(nextAssignments).forEach(pk => {
      const slot = nextAssignments[pk];
      if (slot) {
        if (slot.titular && !validPlayerIds.has(slot.titular)) {
          slot.titular = null;
          assignmentsChanged = true;
        }
        if (slot.suplente && !validPlayerIds.has(slot.suplente)) {
          slot.suplente = null;
          assignmentsChanged = true;
        }
        if (slot.juvenil && !validPlayerIds.has(slot.juvenil)) {
          slot.juvenil = null;
          assignmentsChanged = true;
        }
      }
    });

    if (assignmentsChanged) {
      setAssignments(nextAssignments);
    }
  };

  // Export Roster + Assignments as a clean JSON file backup
  const handleExportBackup = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(
      JSON.stringify({
        players,
        assignments,
        activeFormationKey,
        snapshots
      }, null, 2)
    );
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `FM_SquadPlanner_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import Roster + Assignments from JSON file backup
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    const file = e.target.files?.[0];
    if (!file) return;

    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.players && Array.isArray(parsed.players)) {
          setPlayers(parsed.players);
          setAssignments(parsed.assignments || {});
          if (parsed.activeFormationKey) {
            setActiveFormationKey(parsed.activeFormationKey);
          }
          if (parsed.snapshots && Array.isArray(parsed.snapshots)) {
            setSnapshots(parsed.snapshots);
          } else {
            setSnapshots([]);
          }
          setToast({ message: "¡Copia de seguridad importada con éxito!", type: 'success' });
        } else {
          setToast({ message: "El archivo JSON no tiene un formato válido.", type: 'error' });
        }
      } catch (err) {
        setToast({ message: "Error al leer el archivo JSON.", type: 'error' });
      }
    };
    fileReader.readAsText(file);
  };

  // Calculate high level stats for display
  const totalPlayers = players.length;
  const planGksCount = players.filter(p => p.squadStatus && p.squadStatus !== 'no_asignado').length;
  const loanListCount = players.filter(p => p.squadStatus === 'cedidos').length;
  const sellListCount = players.filter(p => p.squadStatus === 'venta').length;
  const unassignedCount = players.filter(p => p.squadStatus === 'no_asignado').length;

  // Calculate non-Turkish squad players limit (titular, suplente, juvenil)
  const coreSquadPlayers = players.filter(p => 
    p.squadStatus === 'titular' || 
    p.squadStatus === 'suplente' || 
    p.squadStatus === 'juvenil'
  );
  const nonTurkishCorePlayers = coreSquadPlayers.filter(p => !isTurkishPlayer(p.nationality));
  const nonTurkishCount = nonTurkishCorePlayers.length;

  const averageAge = totalPlayers > 0 
    ? (players.reduce((sum, p) => sum + p.age, 0) / totalPlayers).toFixed(1) 
    : "0";

  // Compute total wage (parse e.g. "€10K/sem" or "€150K/sem" into numeric euro values)
  const parseWageNumeric = (wageStr: string): number => {
    const clean = wageStr.toUpperCase();
    const numMatch = clean.match(/[\d.]+/);
    if (!numMatch) return 0;
    const num = parseFloat(numMatch[0]);
    if (clean.includes("K")) return num * 1000;
    if (clean.includes("M")) return num * 1000000;
    return num;
  };

  // Filter out players with 'cedidos' status from budget sum
  const totalWeeklyWages = players
    .filter(p => p.squadStatus !== 'cedidos')
    .reduce((sum, p) => sum + parseWageNumeric(p.wage), 0);

  // Compute total annual wage (weekly * 52)
  const totalAnnualWages = totalWeeklyWages * 52;
  const formattedAnnualWages = `€${Math.round(totalAnnualWages).toLocaleString()} p/a`;

  // Filter candidates for selected position
  const getCandidatesForSelectedPosition = () => {
    if (!selectedPosition) return [];

    return players.filter(p => {
      // Filter out players already assigned as other roles unless they are currently in the selected slots
      const isCurrentlyAssignedElsewhere = Object.entries(assignments).some(([posKey, rawSlot]) => {
        const slot = rawSlot as { titular: string | null; suplente: string | null; juvenil: string | null };
        if (posKey === selectedPosition.key) return false; // Allowed if on the current position
        return slot && (slot.titular === p.id || slot.suplente === p.id || slot.juvenil === p.id);
      });

      if (isCurrentlyAssignedElsewhere) return false;

      // Text search matching
      const matchesSearch = p.name.toLowerCase().includes(candidateSearch.toLowerCase()) || 
                            p.nationality.toLowerCase().includes(candidateSearch.toLowerCase());

      if (!matchesSearch) return false;

      // Position filter: If "showAllCandidates" is true, show everyone, else show natural fits
      if (showAllCandidates) return true;

      // Treat D(CL), D(CR), and D(C) as fully compatible
      return selectedPosition.compatiblePositions.some(comp => {
        const pPos = p.position.toUpperCase().trim();
        const cPos = comp.toUpperCase().trim();

        const isPlayerDC = pPos.includes("D (C)") || pPos.includes("D(C)") || pPos.includes("D (CL)") || pPos.includes("D (CR)") || pPos.includes("D(CL)") || pPos.includes("D(CR)");
        const isCompDC = cPos.includes("D (C)") || cPos.includes("D(C)") || cPos.includes("D (CL)") || cPos.includes("D (CR)") || cPos.includes("D(CL)") || cPos.includes("D(CR)");

        if (isPlayerDC && isCompDC) {
          return true;
        }
        return pPos.includes(cPos);
      });
    }).sort((a, b) => b.currentAbility - a.currentAbility); // Sort by quality first
  };

  return (
    <div className="bg-slate-950 text-slate-200 min-h-screen font-sans">
      
      {/* Immersive Brand Top Header */}
      <header className="h-auto md:h-16 border-b border-slate-800 flex flex-col md:flex-row items-center justify-between px-6 py-3 md:py-0 bg-slate-900/50 gap-4 shadow-md">
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="w-8 h-8 bg-emerald-500 rounded flex items-center justify-center text-slate-950 font-bold select-none shrink-0 shadow-lg font-sans">
            FM
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-white flex items-center gap-2">
              Squad Architect <span className="text-slate-500 font-normal text-xs">v1.2</span>
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase">GESTIÓN DE PLANTILLAS Y ANÁLISIS DE PROFUNDIDAD</p>
          </div>
        </div>

        {/* Quick Info Badges in Sophisticated Dark Pill style */}
        <div className="flex flex-wrap items-center gap-2 text-xs font-sans w-full md:w-auto justify-end">
          {/* Year Selector */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 text-slate-300 select-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono px-1">Año:</span>
            <button
              onClick={() => updateGameYear(Math.max(1900, gameYear - 1))}
              className="w-4.5 h-4.5 rounded-full bg-slate-950 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-[10px] border border-slate-700 transition"
              title="Restar año"
            >
              -
            </button>
            {isEditingYear ? (
              <input
                type="text"
                value={tempYearInput}
                onChange={(e) => setTempYearInput(e.target.value)}
                onBlur={handleYearSubmit}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleYearSubmit();
                  if (e.key === 'Escape') {
                    setTempYearInput(String(gameYear));
                    setIsEditingYear(false);
                  }
                }}
                className="w-12 text-center bg-slate-950 border border-slate-700 rounded text-white font-mono text-[11px] focus:outline-none"
                autoFocus
              />
            ) : (
              <strong 
                onClick={() => setIsEditingYear(true)}
                className="text-white font-semibold font-mono px-1 text-[11px] cursor-pointer hover:bg-slate-700 rounded transition"
                title="Haga clic para introducir con el teclado"
              >
                {gameYear}
              </strong>
            )}
            <button
              onClick={() => updateGameYear(Math.min(2100, gameYear + 1))}
              className="w-4.5 h-4.5 rounded-full bg-slate-950 hover:bg-slate-700 text-white font-bold flex items-center justify-center text-[10px] border border-slate-700 transition"
              title="Sumar año"
            >
              +
            </button>
          </div>

          {/* Month Selector */}
          <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 rounded-full px-2 py-0.5 text-slate-300 select-none">
            <span className="text-[10px] uppercase font-bold text-slate-400 font-mono px-1">Mes:</span>
            <select
              value={getGameMonth()}
              onChange={(e) => updateGameMonth(parseInt(e.target.value, 10))}
              className="bg-transparent border-0 text-[11px] font-mono text-white font-semibold focus:outline-none focus:ring-0 cursor-pointer pr-4 py-0"
              style={{ WebkitAppearance: 'none', MozAppearance: 'none', appearance: 'none' }}
            >
              {monthsList.map((m) => (
                <option key={m.value} value={m.value} className="bg-slate-900 text-slate-200 text-xs">
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium border border-slate-700 text-slate-300">
            Total: <strong className="text-white font-semibold font-sans">{totalPlayers} Jugadores</strong>
          </span>
          <span className="px-3 py-1 bg-slate-800 rounded-full text-xs font-medium border border-slate-700 text-slate-300">
            Presupuesto: <strong className="text-white font-semibold font-sans">{formattedAnnualWages}</strong>
          </span>
          <span className="px-3 py-1 bg-emerald-900/30 text-emerald-400 rounded-full text-xs font-medium border border-emerald-800/50">
            Media Edad: <strong className="text-emerald-300 font-semibold font-sans">{averageAge} años</strong>
          </span>
        </div>
      </header>

      {/* Primary Navigation Tabs */}
      <nav className="bg-slate-900/60 border-b border-slate-850 sticky top-0 z-40 backdrop-blur">
        <div className="max-w-[98%] w-[98%] mx-auto px-4 flex justify-between items-center overflow-x-auto">
          <div className="flex space-x-1 py-1.5 scrollbar-none">
            <button
              onClick={() => setActiveTab('planning_grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 whitespace-nowrap
                ${activeTab === 'planning_grid' 
                  ? 'bg-slate-800 text-emerald-400 shadow-inner' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }
              `}
            >
              🧮 Matriz de Planeamiento
            </button>
            <button
              onClick={() => setActiveTab('squad_pitch')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 whitespace-nowrap
                ${activeTab === 'squad_pitch' 
                  ? 'bg-slate-800 text-emerald-400 shadow-inner' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }
              `}
            >
              📊 Pizarra Táctica (3 por puesto)
            </button>
            <button
              onClick={() => setActiveTab('players_list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 whitespace-nowrap
                ${activeTab === 'players_list' 
                  ? 'bg-slate-800 text-emerald-400 shadow-inner' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }
              `}
            >
              🏃‍♂️ Lista de Jugadores
            </button>
            <button
              onClick={() => setActiveTab('clipboard_import')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 whitespace-nowrap
                ${activeTab === 'clipboard_import' 
                  ? 'bg-slate-800 text-emerald-400 shadow-inner' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }
              `}
            >
              📥 Importar de FM (Clipboard)
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 whitespace-nowrap
                ${activeTab === 'stats' 
                  ? 'bg-slate-800 text-emerald-400 shadow-inner' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }
              `}
            >
              📈 Auditoría de Plantilla
            </button>
            <button
              onClick={() => setActiveTab('progression_tracker')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition flex items-center gap-1.5 whitespace-nowrap
                ${activeTab === 'progression_tracker' 
                  ? 'bg-slate-800 text-emerald-400 shadow-inner' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }
              `}
            >
              📸 Historial y Progreso
            </button>
          </div>

          {/* Quick backup controls */}
          <div className="flex items-center gap-2 pl-3 py-1 border-l border-slate-800 shrink-0">
            <button
              onClick={handleExportBackup}
              title="Exportar respaldo de plantilla (.json)"
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition"
            >
              <Download className="w-3.5 h-3.5" />
            </button>
            <label
              title="Importar respaldo de plantilla (.json)"
              className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 rounded-lg transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <input
                type="file"
                accept=".json"
                onChange={handleImportBackup}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-[98%] w-[98%] mx-auto px-4 py-5 font-sans">
        
        {/* TAB 0: DETAILED PLANNING GRID MATRIX */}
        {activeTab === 'planning_grid' && (
          <PlanningGrid
            players={players}
            onUpdatePlayer={handleUpdatePlayer}
            onUpdatePlayersBatch={(updatedBatch) => {
              setPlayers(updatedBatch);
            }}
            gameYear={gameYear}
          />
        )}

        {/* TAB 1: SQUAD PLANNER WITH THE INTERACTIVE PITCH */}
        {activeTab === 'squad_pitch' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* Left col: Visual Pitch (7 columns) */}
            <div className="lg:col-span-7 space-y-4">
              
              {/* Formation Selector */}
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-850 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-white block">Estrategia y Alineación de Temporada</span>
                  <span className="text-slate-400 text-[11px]">Cambia la estructura táctica en la pizarra para reubicar los puestos.</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] uppercase font-bold text-slate-500 font-mono mr-1">Táctica:</span>
                  <select
                    value={activeFormationKey}
                    onChange={(e) => {
                      setActiveFormationKey(e.target.value);
                      setSelectedPosition(null); // Reset selection
                    }}
                    className="bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg text-slate-200 cursor-pointer focus:outline-none focus:border-emerald-600 font-sans text-xs"
                  >
                    {defaultFormations.map(form => (
                      <option key={form.key} value={form.key}>{form.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tactical Board Canvas */}
              <PitchView
                activeFormation={activeFormation}
                players={players}
                assignments={assignments}
                onSelectPosition={(pos) => {
                  setSelectedPosition(pos);
                  setCandidateSearch('');
                  setShowAllCandidates(false);
                }}
                activePositionKey={selectedPosition?.key || null}
              />
            </div>

            {/* Right col: Position Assignation Drawer / Details (5 columns) */}
            <div className="lg:col-span-5">
              {selectedPosition ? (
                <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-xl">
                  
                  {/* Position Header */}
                  <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-white flex items-center gap-1.5 uppercase font-mono">
                        🛡️ {selectedPosition.label} ({selectedPosition.shortLabel})
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Asigna los 3 niveles requeridos por puesto para tener cubierto tu plan de temporada.
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedPosition(null)}
                      className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* 3 SLOTS SUMMARY */}
                  <div className="grid grid-cols-1 gap-2.5">
                    
                    {/* STARTER (TITULAR) */}
                    <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="bg-emerald-950/50 border border-emerald-500/20 text-emerald-400 font-mono font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                          T
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold tracking-wider">Titular Recomendado</span>
                          <span className="text-xs font-semibold text-white truncate max-w-[170px] block">
                            {assignments[selectedPosition.key]?.titular 
                              ? players.find(p => p.id === assignments[selectedPosition.key]?.titular)?.name 
                              : "Ninguno asignado"
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {assignments[selectedPosition.key]?.titular && (
                          <button
                            onClick={() => unassignPlayer(selectedPosition.key, 'titular')}
                            className="bg-rose-950 hover:bg-rose-900 border border-rose-500/10 text-rose-400 px-2 py-1 rounded text-[10px] font-bold font-sans transition"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* BACKUP (SUPLENTE) */}
                    <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="bg-amber-950/50 border border-amber-500/20 text-amber-400 font-mono font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                          S
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold tracking-wider">Suplente Inmediato</span>
                          <span className="text-xs font-semibold text-white truncate max-w-[170px] block">
                            {assignments[selectedPosition.key]?.suplente 
                              ? players.find(p => p.id === assignments[selectedPosition.key]?.suplente)?.name 
                              : "Ninguno asignado"
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {assignments[selectedPosition.key]?.suplente && (
                          <button
                            onClick={() => unassignPlayer(selectedPosition.key, 'suplente')}
                            className="bg-rose-950 hover:bg-rose-900 border border-rose-500/10 text-rose-400 px-2 py-1 rounded text-[10px] font-bold font-sans transition"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>

                    {/* YOUTH PROSPECT (JUVENIL) */}
                    <div className="bg-slate-950 border border-slate-850 p-3 rounded-xl flex items-center justify-between gap-2.5">
                      <div className="flex items-center gap-3">
                        <div className="bg-cyan-950/50 border border-cyan-500/20 text-cyan-400 font-mono font-bold text-xs w-6 h-6 rounded-full flex items-center justify-center">
                          J
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase font-mono font-bold tracking-wider">Juvenil de Proyección</span>
                          <span className="text-xs font-semibold text-white truncate max-w-[170px] block">
                            {assignments[selectedPosition.key]?.juvenil 
                              ? players.find(p => p.id === assignments[selectedPosition.key]?.juvenil)?.name 
                              : "Ninguno asignado"
                            }
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {assignments[selectedPosition.key]?.juvenil && (
                          <button
                            onClick={() => unassignPlayer(selectedPosition.key, 'juvenil')}
                            className="bg-rose-950 hover:bg-rose-900 border border-rose-500/10 text-rose-400 px-2 py-1 rounded text-[10px] font-bold font-sans transition"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* CANDIDATE SELECTOR PANEL */}
                  <div className="space-y-2 border-t border-slate-800 pt-4">
                    
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-300">Asignar Candidato</span>
                      
                      {/* Filter natural fit vs showing everyone toggle */}
                      <button
                        onClick={() => setShowAllCandidates(!showAllCandidates)}
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all
                          ${showAllCandidates 
                            ? 'bg-amber-950/30 text-amber-400 border-amber-500/20' 
                            : 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20'
                          }
                        `}
                      >
                        {showAllCandidates ? "Mostrando Todo el Club" : "Aptos para el Puesto"}
                      </button>
                    </div>

                    {/* Quick search inside selection box */}
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-600" />
                      <input
                        type="text"
                        placeholder="Buscar candidatos..."
                        value={candidateSearch}
                        onChange={(e) => setCandidateSearch(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-850 text-xs pl-8 pr-3 py-1.5 rounded-lg text-slate-200 placeholder-slate-650 focus:outline-none focus:border-emerald-600"
                      />
                    </div>

                    {/* Candidates Scroll Container */}
                    <div className="max-h-[190px] overflow-y-auto space-y-1.5 pr-1 text-xs">
                      {getCandidatesForSelectedPosition().length === 0 ? (
                        <div className="text-center py-6 text-slate-500 italic text-[11px]">
                          Ningún candidato apto disponible. Intenta activar "Mostrando Todo el Club" arriba.
                        </div>
                      ) : (
                        getCandidatesForSelectedPosition().map(p => {
                          return (
                            <div 
                              key={p.id}
                              className="bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 p-2 rounded-lg flex items-center justify-between gap-2.5 transition"
                            >
                              <div className="truncate flex-1">
                                <div className="flex items-center gap-1">
                                  <span className="font-semibold text-slate-200 truncate block text-[11px]">{p.name}</span>
                                  <span className="text-[9px] bg-slate-900 border border-slate-800 text-slate-400 px-1 rounded font-mono uppercase">{p.position}</span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono mt-0.5">
                                  <span>{p.age} años</span>
                                  <span>•</span>
                                  <span>{p.marketValue}</span>
                                  <span>•</span>
                                  <span className="text-amber-400 font-medium">★ {p.currentAbility}/{p.potentialAbility}</span>
                                </div>
                              </div>

                              {/* Slot Assign Action Buttons */}
                              <div className="flex gap-1">
                                <button
                                  onClick={() => assignPlayer(p.id, selectedPosition.key, 'titular')}
                                  className="bg-emerald-900/60 hover:bg-emerald-800/80 text-emerald-300 font-bold px-1.5 py-1 rounded text-[9px] font-mono transition"
                                  title="Asignar como Titular"
                                >
                                  T
                                </button>
                                <button
                                  onClick={() => assignPlayer(p.id, selectedPosition.key, 'suplente')}
                                  className="bg-amber-900/60 hover:bg-amber-800/80 text-amber-300 font-bold px-1.5 py-1 rounded text-[9px] font-mono transition"
                                  title="Asignar como Suplente"
                                >
                                  S
                                </button>
                                <button
                                  onClick={() => assignPlayer(p.id, selectedPosition.key, 'juvenil')}
                                  className="bg-cyan-900/60 hover:bg-cyan-800/80 text-cyan-300 font-bold px-1.5 py-1 rounded text-[9px] font-mono transition"
                                  title="Asignar como Juvenil de Proyección"
                                >
                                  J
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-900 border border-slate-800/60 rounded-2xl p-8 text-center text-xs text-slate-500 space-y-4 shadow-md">
                  <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-emerald-500 shadow-inner">
                    <Shield className="w-5 h-5" />
                  </div>
                  <div className="max-w-xs mx-auto space-y-1">
                    <h3 className="font-bold text-slate-300">Planificador de Puestos</h3>
                    <p className="leading-relaxed">
                      Haz clic sobre cualquier posición en la pizarra táctica para desplegar sus 3 niveles y asignarle jugadores de tu plantilla.
                    </p>
                  </div>
                  
                  {/* Small coverage summary widget inside unselected area */}
                  <div className="bg-slate-950 border border-slate-850 rounded-xl p-3 text-left space-y-2 font-mono text-[10px] text-slate-400">
                    <span className="font-bold text-slate-300 block border-b border-slate-900 pb-1 uppercase tracking-wider text-[9px]">Cobertura del Esquema</span>
                    <div className="flex justify-between items-center">
                      <span>Puestos cubiertos del plan:</span>
                      <span className="text-slate-200 font-bold font-sans">
                        {(Object.values(assignments) as Array<{ titular: string | null; suplente: string | null; juvenil: string | null }>).filter(a => a && a.titular && a.suplente && a.juvenil).length} / 11
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Total en plantilla:</span>
                      <span className="text-slate-200 font-bold font-sans">{players.length} jugadores</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: ROSTER LIST */}
        {activeTab === 'players_list' && (
          <RosterManager
            players={players}
            onUpdatePlayer={handleUpdatePlayer}
            onAddPlayer={handleAddPlayer}
            onDeletePlayer={handleDeletePlayer}
            onResetToDefaults={handleResetToDefaults}
            onDeleteAllPlayers={handleDeleteAllPlayers}
            gameYear={gameYear}
            gameDate={gameDate}
          />
        )}

        {/* TAB 3: CLIPBOARD COPIED FM IMPORTER */}
        {activeTab === 'clipboard_import' && (
          <ClipboardImporter
            onImportPlayers={handleImportPlayers}
            currentPlayersCount={players.length}
            gameDate={gameDate}
            onChangeGameDate={setGameDate}
          />
        )}

        {/* TAB 5: STATS AUDIT */}
        {activeTab === 'stats' && (
          <div className="space-y-5">
            {/* Auditing Cards */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 text-xs font-mono">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow-md">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">Plantilla del Club</span>
                <span className="text-white font-sans text-xl font-extrabold">{totalPlayers}</span>
                <span className="text-slate-500 text-[10px] block mt-1">Total registrados en primer y segundo equipo</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow-md">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">Planificados en Esquema</span>
                <span className="text-emerald-400 font-sans text-xl font-extrabold">{planGksCount}</span>
                <span className="text-slate-500 text-[10px] block mt-1">Convocados al plan de 3 por puesto (Stay)</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow-md">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">Lista de Préstamos</span>
                <span className="text-cyan-400 font-sans text-xl font-extrabold">{loanListCount}</span>
                <span className="text-slate-500 text-[10px] block mt-1">Jugadores listados para ceder (Préstamos)</span>
              </div>
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl space-y-1 shadow-md">
                <span className="text-slate-500 uppercase text-[9px] font-bold block">Lista de Ventas</span>
                <span className="text-rose-400 font-sans text-xl font-extrabold">{sellListCount}</span>
                <span className="text-slate-500 text-[10px] block mt-1">Jugadores listados como transferibles</span>
              </div>
              <div className={`border p-4 rounded-xl space-y-1 shadow-md transition-all ${
                nonTurkishCount > 17 
                  ? 'bg-rose-950/20 border-rose-500/30' 
                  : 'bg-slate-900 border-slate-800'
              }`}>
                <span className="text-slate-500 uppercase text-[9px] font-bold block">Cupo Extranjeros</span>
                <span className={`font-sans text-xl font-extrabold flex items-baseline gap-1 ${
                  nonTurkishCount > 17 ? 'text-rose-500 animate-pulse' : 'text-emerald-400'
                }`}>
                  {nonTurkishCount} <span className="text-xs text-slate-500 font-normal">/ 17</span>
                </span>
                <span className={`text-[10px] block mt-1 ${
                  nonTurkishCount > 17 ? 'text-rose-300 font-sans font-medium' : 'text-slate-500'
                }`}>
                  {nonTurkishCount > 17 
                    ? '⚠️ ¡Supera límite de 17!' 
                    : 'Regla de extranjeros OK'
                  }
                </span>
              </div>
            </div>

            {/* In-depth position analysis lists */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Posición por Posición coverage checklist */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 shadow-md">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-mono uppercase tracking-wide border-b border-slate-800 pb-2">
                  📊 Auditoría de Cobertura por Puesto
                </h3>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {activeFormation.positions.map(pos => {
                    const slot = assignments[pos.key] || { titular: null, suplente: null, juvenil: null };
                    const coveredCount = [slot.titular, slot.suplente, slot.juvenil].filter(Boolean).length;
                    
                    return (
                      <div key={pos.key} className="flex justify-between items-center text-xs font-mono p-1 border-b border-slate-850 last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-slate-500 font-bold w-12">{pos.shortLabel}</span>
                          <span className="text-slate-300 font-sans text-[11px] truncate max-w-[150px]">{pos.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {/* Progress Dots */}
                          <div className="flex gap-1">
                            <span className={`w-2 h-2 rounded-full ${slot.titular ? 'bg-emerald-500' : 'bg-slate-800'}`} title="Titular" />
                            <span className={`w-2 h-2 rounded-full ${slot.suplente ? 'bg-amber-500' : 'bg-slate-800'}`} title="Suplente" />
                            <span className={`w-2 h-2 rounded-full ${slot.juvenil ? 'bg-cyan-500' : 'bg-slate-800'}`} title="Juvenil" />
                          </div>
                          <span className={`font-bold w-6 text-right font-sans ${coveredCount === 3 ? 'text-emerald-400' : coveredCount > 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                            {coveredCount}/3
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Transfers lists summarized */}
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4 shadow-md">
                
                {/* LOANED LIST PREVIEW */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-cyan-400 flex items-center gap-1.5 font-mono uppercase tracking-wide border-b border-slate-800 pb-1.5">
                    ✈️ Lista de Préstamos Activa ({loanListCount})
                  </h3>
                  <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 text-[11px] font-sans">
                    {players.filter(p => p.squadStatus === 'cedidos').length === 0 ? (
                      <div className="text-slate-500 italic py-2">Ningún jugador marcado para préstamo.</div>
                    ) : (
                      players.filter(p => p.squadStatus === 'cedidos').map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-950 p-1.5 rounded border border-slate-850">
                          <span className="text-slate-200 font-medium">{p.name} ({p.position})</span>
                          <span className="text-amber-400 font-mono">★ {p.potentialAbility} pot</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* TRANSFER LIST PREVIEW */}
                <div className="space-y-2 pt-2">
                  <h3 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 font-mono uppercase tracking-wide border-b border-slate-800 pb-1.5">
                    💰 Lista de Transferibles Activa ({sellListCount})
                  </h3>
                  <div className="max-h-[140px] overflow-y-auto space-y-1 pr-1 text-[11px] font-sans">
                    {players.filter(p => p.squadStatus === 'venta').length === 0 ? (
                      <div className="text-slate-500 italic py-2">Ningún jugador marcado para transferir.</div>
                    ) : (
                      players.filter(p => p.squadStatus === 'venta').map(p => (
                        <div key={p.id} className="flex justify-between items-center bg-slate-950 p-1.5 rounded border border-slate-850">
                          <span className="text-slate-200 font-medium">{p.name} ({p.position})</span>
                          <span className="text-slate-400 font-mono font-medium">{p.marketValue}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* TAB 6: PROGRESSION TRACKER & SNAPSHOTS */}
        {activeTab === 'progression_tracker' && (
          <ProgressionTracker
            snapshots={snapshots}
            onSaveSnapshot={handleSaveSnapshot}
            onDeleteSnapshot={handleDeleteSnapshot}
            currentPlayers={players}
            onLoadSnapshotRoster={handleLoadSnapshotRoster}
          />
        )}

      </main>

      {/* Brand Footer */}
      <footer className="bg-slate-900 border-t border-slate-850 mt-12 py-6 text-xs text-slate-500 font-mono text-center">
        <div className="max-w-7xl mx-auto px-4 space-y-1.5">
          <p>© 2026 Football Manager Squad Planner - Todos los derechos reservados.</p>
          <p className="text-[10px]">Diseñado para mánagers profesionales de simulación de fútbol. Datos almacenados de forma segura en tu navegador de manera persistente.</p>
        </div>
      </footer>

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 max-w-sm bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 flex items-start gap-3 animate-fade-in transition-all">
          {toast.type === 'success' ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-1.5 rounded-lg shrink-0">
              <Check className="w-4 h-4" />
            </div>
          ) : (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-1.5 rounded-lg shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          )}
          <div className="flex-1 space-y-1">
            <p className="text-xs font-bold text-white font-sans">
              {toast.type === 'success' ? 'Operación Exitosa' : 'Aviso / Error'}
            </p>
            <p className="text-[11px] text-slate-300 font-sans leading-relaxed">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-slate-500 hover:text-slate-300 transition-colors shrink-0 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

    </div>
  );
}
