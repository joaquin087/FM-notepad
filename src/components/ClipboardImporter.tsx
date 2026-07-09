import React, { useState } from 'react';
import { Player } from '../types';
import { Upload, HelpCircle, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';

interface ClipboardImporterProps {
  onImportPlayers: (newPlayers: Player[], mode: 'replace' | 'append') => void;
  currentPlayersCount: number;
  gameDate: string;
  onChangeGameDate: (date: string) => void;
}

const parseImportedRating = (valStr: string): { stars: number; raw: string } => {
  const clean = valStr.trim();
  if (!clean) return { stars: 2, raw: "" };

  // 1. Try to see if there is a percentage inside parentheses, e.g. "3.5 (87.9%)"
  const matchPctInParens = clean.match(/\(([^%)]+%)?\)/) || clean.match(/\(([^)]+)\)/);
  if (matchPctInParens) {
    const inside = matchPctInParens[1].replace('%', '').trim().replace(',', '.');
    const parsedPct = parseFloat(inside);
    if (!isNaN(parsedPct)) {
      const stars = Math.max(0, Math.min(5, Math.round((parsedPct / 100) * 10) / 2));
      return { stars, raw: clean };
    }
  }

  // 2. Try to see if the whole string is a percentage, e.g. "87.9%"
  if (clean.includes('%')) {
    const parsedPct = parseFloat(clean.replace('%', '').trim().replace(',', '.'));
    if (!isNaN(parsedPct)) {
      const stars = Math.max(0, Math.min(5, Math.round((parsedPct / 100) * 10) / 2));
      return { stars, raw: clean };
    }
  }

  // 3. Try to parse as raw number
  const num = parseFloat(clean.replace(',', '.'));
  if (!isNaN(num)) {
    if (num <= 5) {
      return { stars: num, raw: `${(num * 20).toFixed(0)}%` };
    }
    if (num <= 100) {
      const stars = Math.max(0, Math.min(5, Math.round((num / 100) * 10) / 2));
      return { stars, raw: `${num}%` };
    }
    const pct = (num / 200) * 100;
    const stars = Math.max(0, Math.min(5, Math.round((pct / 100) * 10) / 2));
    return { stars, raw: `${pct.toFixed(0)}%` };
  }

  return { stars: 2, raw: clean };
};

export function ClipboardImporter({ onImportPlayers, currentPlayersCount, gameDate, onChangeGameDate }: ClipboardImporterProps) {
  const [pasteData, setPasteData] = useState('');
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Helper to format wage and value beautifully on import
  const formatImportedWage = (rawWage: string): string => {
    let val = rawWage.trim();
    if (!val) return "€10K/sem";
    
    if (/[kKmM]/.test(val) && /[€$£]/.test(val)) {
      return val;
    }
    
    let clean = val.replace(/[€$£\s]/g, '');
    const rawNumStr = clean.replace(/[\.,]/g, '');
    const num = parseInt(rawNumStr);
    
    if (isNaN(num)) return val;
    
    if (num >= 1000000) {
      const mVal = num / 1000000;
      return `€${mVal % 1 === 0 ? mVal.toFixed(0) : mVal.toFixed(1)}M/sem`;
    } else if (num >= 1000) {
      const kVal = num / 1000;
      return `€${kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1)}K/sem`;
    } else {
      return `€${num}/sem`;
    }
  };

  const formatImportedValue = (rawValue: string): string => {
    let val = rawValue.trim();
    if (!val) return "€2M";
    
    if (/[kKmM]/.test(val) && /[€$£]/.test(val)) {
      return val;
    }
    
    let clean = val.replace(/[€$£\s]/g, '');
    const rawNumStr = clean.replace(/[\.,]/g, '');
    const num = parseInt(rawNumStr);
    
    if (isNaN(num)) return val;
    
    if (num >= 1000000) {
      const mVal = num / 1000000;
      return `€${mVal % 1 === 0 ? mVal.toFixed(0) : mVal.toFixed(1)}M`;
    } else if (num >= 1000) {
      const kVal = num / 1000;
      return `€${kVal % 1 === 0 ? kVal.toFixed(0) : kVal.toFixed(1)}K`;
    } else {
      return `€${num}`;
    }
  };

  const handleParseAndImport = () => {
    const text = pasteData.trim();
    if (!text) {
      setStatusMessage({ type: 'error', text: 'Por favor, pega datos válidos en el cuadro de texto.' });
      return;
    }

    try {
      const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
      if (lines.length === 0) {
        setStatusMessage({ type: 'error', text: 'No se encontraron líneas de texto válidas.' });
        return;
      }

      // Automatically detect the delimiter (tab, pipe, semicolon, or comma)
      const detectDelimiter = (line: string): string => {
        const candidates = ["\t", "|", ";", ","];
        let best = "\t";
        let maxCount = 0;
        candidates.forEach(cand => {
          const count = line.split(cand).length - 1;
          if (count > maxCount) {
            maxCount = count;
            best = cand;
          }
        });
        return maxCount > 0 ? best : "\t";
      };

      const delimiter = detectDelimiter(lines[0]);
      const parsedPlayers: Player[] = [];
      let nextIdSeed = Date.now();

      // Check if first line contains column headers
      const headerLine = lines[0];
      const cellsInHeader = headerLine.split(delimiter).map(c => c.toLowerCase().trim());
      
      const hasHeaders = cellsInHeader.some(cell => 
        cell.includes("id") || cell.includes("nombre") || cell.includes("name") || 
        cell.includes("pos") || cell.includes("edad") || cell.includes("age") || 
        cell.includes("valor") || cell.includes("value") || cell.includes("vlr") ||
        cell.includes("sueldo") || cell.includes("wage") || cell.includes("sal") ||
        cell.includes("sdo")
      );

      const startIndex = hasHeaders ? 1 : 0;
      const headers = hasHeaders ? cellsInHeader : [];

      for (let i = startIndex; i < lines.length; i++) {
        // Skip decorator lines or lines composed entirely of dashes/pipes/decorations
        const cleanLine = lines[i].replace(/[| \-_=+*\s\t,;]/g, "");
        if (cleanLine.length === 0) continue;

        const cells = lines[i].split(delimiter).map(c => c.trim());
        if (cells.length < 2) continue; // Skip lines with insufficient columns

        let id = "";
        let name = "";
        let age = 22;
        let position = "M (C)";
        let nationality = "Desconocida";
        let currentAbility = 2;
        let potentialAbility = 3;
        let marketValue = "";
        let wage = "";
        
        let club = "";
        let saleValue = "";
        let bestRating = "";
        let bestPotRating = "";
        let contractEnd = "";
        let dateOfBirth = "";
        let clubId = "";
        let intCaps = 0;
        let intGoals = 0;

        if (hasHeaders) {
          headers.forEach((header, colIndex) => {
            const val = cells[colIndex];
            if (val === undefined || val === null || val === "") return;

            if (header === "club id" || header === "clubid") {
              clubId = val;
            } else if (header.includes("best pot rating") || header.includes("bestpotrating") || header.includes("mejor pot") || header.includes("calidad potencial %") || header === "best pot rating") {
              const res = parseImportedRating(val);
              bestPotRating = res.raw;
              potentialAbility = res.stars;
            } else if (header.includes("best rating") || header.includes("bestrating") || header.includes("mejor cal") || header.includes("calidad actual %") || header.includes("calidad de juego") || header === "best rating") {
              const res = parseImportedRating(val);
              bestRating = res.raw;
              currentAbility = res.stars;
            } else if (header === "unique id" || header === "uid" || header === "id único" || header === "id" || header === "pk" || (header.includes("id") && !header.includes("club"))) {
              id = val;
            } else if (header.includes("nombre") || header.includes("name") || header === "nom") {
              name = val;
            } else if (header === "edad" || header === "age" || header === "eda" || (header.includes("age") && !header.includes("wage") && !header.includes("percentage"))) {
              const parsedAge = parseInt(val);
              if (!isNaN(parsedAge)) age = parsedAge;
            } else if (header.includes("pos") || header === "puesto" || header === "position") {
              position = val;
            } else if (header.includes("nacionalidad") || header.includes("nac") || header.includes("nat") || header.includes("país") || header.includes("nation")) {
              nationality = val;
            } else if (header.includes("valor") || header.includes("value") || header === "val" || header === "vlr" || header.includes("vlr")) {
              marketValue = formatImportedValue(val);
            } else if (header.includes("sueldo") || header.includes("wage") || header.includes("sal") || header.includes("sdo") || header === "sdo" || header === "sdo.") {
              wage = formatImportedWage(val);
            } else if (header === "club") {
              club = val;
            } else if (header.includes("sale value") || header.includes("valor de venta") || header.includes("salevalue")) {
              saleValue = val;
            } else if (header.includes("contract end") || header.includes("fin contr") || header.includes("contractend") || header.includes("vence")) {
              contractEnd = val;
            } else if (header.includes("date of birth") || header.includes("fecha nac") || header.includes("dob") || header.includes("nacimiento")) {
              dateOfBirth = val;
            } else if (header.includes("int caps") || header.includes("partidos int") || header.includes("intcaps")) {
              intCaps = parseInt(val) || 0;
            } else if (header.includes("int goals") || header.includes("goles int") || header.includes("intgoals")) {
              intGoals = parseInt(val) || 0;
            } else if (header.includes("ca") || header.includes("calidad actual") || header.includes("ability") || header.includes("cur")) {
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
          // INTELLIGENT HEURISTIC GUESSING IF NO HEADERS
          cells.forEach((val, colIdx) => {
            if (!val) return;

            // 1. Check for FM Unique ID (Usually 8-10 digit numbers)
            if (/^\d{6,11}$/.test(val)) {
              id = val;
            }
            // 2. Check for Age (Usually 14 to 45)
            else if (/^\d{2}$/.test(val) && colIdx !== 0) {
              const parsedAge = parseInt(val);
              if (parsedAge >= 14 && parsedAge <= 45) {
                age = parsedAge;
              }
            }
            // 3. Check for currency values (Value or Wage)
            else if (/[€$£M|K|d]/.test(val)) {
              if (val.toLowerCase().includes("sem") || val.toLowerCase().includes("w") || val.toLowerCase().includes("/s") || val.toLowerCase().includes("semana")) {
                wage = formatImportedWage(val);
              } else {
                marketValue = formatImportedValue(val);
              }
            }
            // 4. Check for standard positions keywords
            else if (/^(GK|POR|DFC|DFC\s*[DIL]|DF\s*[DIL]|LD|LI|CR|MCD|MC|MP|ENG|EXT|DL|ST|AM[LRC]|D[LRC]|M[LRC]|DM|W[BLR])/i.test(val)) {
              position = val;
            }
            // 5. If it looks like a full name (letters, spaces, length > 4) and we don't have one yet
            else if (val.includes(" ") && val.length > 3 && !name) {
              name = val;
            }
            // 6. Stars or scale (1 to 5)
            else if (/^[1-5]$/.test(val)) {
              if (currentAbility === 2) currentAbility = parseInt(val);
              else if (potentialAbility === 3) potentialAbility = parseInt(val);
            }
          });

          // Fallback name guessing if none detected
          if (!name) {
            // First text-heavy cell
            const textCells = cells.filter(c => !/^\d+$/.test(c) && c.length > 2);
            name = textCells[0] || `Jugador Importado #${i}`;
          }
        }

        // Clean up and default-values for parsed cells
        id = id || String(nextIdSeed++);
        marketValue = marketValue || "€2M";
        wage = wage || "€10K/sem";

        const mappedPosition = mapBestRatingToPosition(bestRating, position);

        parsedPlayers.push({
          id,
          name,
          age,
          position: cleanFmPosition(mappedPosition),
          nationality,
          currentAbility: Math.max(1, Math.min(5, currentAbility)),
          potentialAbility: Math.max(1, Math.min(5, potentialAbility)),
          marketValue,
          wage,
          squadStatus: "no_asignado",
          notes: "Importado desde planilla Football Manager",
          
          club,
          saleValue,
          bestRating,
          bestPotRating,
          contractEnd,
          dateOfBirth,
          clubId,
          intCaps,
          intGoals
        });
      }

      if (parsedPlayers.length === 0) {
        setStatusMessage({ type: 'error', text: 'No se pudo identificar ningún jugador válido en el texto pegado.' });
        return;
      }

      onImportPlayers(parsedPlayers, importMode);
      setPasteData('');
      setStatusMessage({
        type: 'success',
        text: `¡Éxito! Se han importado correctamente ${parsedPlayers.length} jugadores en tu plantel.`
      });

    } catch (err: any) {
      console.error(err);
      setStatusMessage({ type: 'error', text: `Ocurrió un error al procesar el archivo: ${err.message}` });
    }
  };

  // Helper to map Best Rating column tag to our standard positions
  const mapBestRatingToPosition = (bestRatingStr: string, rawFmPosition: string): string => {
    if (!bestRatingStr) return rawFmPosition;
    
    // Extract tag inside parenthesis if present, e.g., "91,3% (W)" -> "W"
    const match = bestRatingStr.match(/\(([^)]+)\)/);
    const tag = (match ? match[1] : bestRatingStr).toUpperCase().trim();
    
    if (tag === "GK" || tag === "POR") return "GK";
    
    // FB -> DFI or DFD (Must be WR or WL, corresponding to D (L) or D (R) in our database)
    if (tag === "FB" || tag === "DFI" || tag === "DFD" || tag === "SB") {
      const upperRaw = rawFmPosition.toUpperCase();
      const upperBest = bestRatingStr.toUpperCase();
      if (upperRaw.includes("L") || upperRaw.includes("I") || upperBest.includes("L") || upperBest.includes("I")) {
        return "D (L)";
      }
      return "D (R)";
    }
    
    // CB -> DFC I or DFC D (Merge to DFC / D (C))
    if (tag === "CB" || tag === "DFC" || tag === "CD") return "D (C)";
    
    // DM -> MCD ("DM")
    if (tag === "DM" || tag === "MCD") return "DM";
    
    // M -> MC D ("M (C)")
    if (tag === "M" || tag === "MC" || tag === "MC D" || tag === "MCC") return "M (C)";
    
    // AM -> MC I (mapped to "AM (C)")
    if (tag === "AM" || tag === "AMC" || tag === "MC I") return "AM (C)";
    
    // W -> MPI or MPD ("AM (L)" or "AM (R)")
    if (tag === "W" || tag === "MPI" || tag === "MPD" || tag === "WING") {
      const upperRaw = rawFmPosition.toUpperCase();
      const upperBest = bestRatingStr.toUpperCase();
      if (upperRaw.includes("L") || upperRaw.includes("I") || upperBest.includes("L") || upperBest.includes("I")) {
        return "AM (L)";
      }
      return "AM (R)";
    }
    
    // FS or TS -> DL ("ST (C)")
    if (tag === "FS" || tag === "TS" || tag === "ST" || tag === "DL") return "ST (C)";
    
    return rawFmPosition;
  };

  // Helper to map complex FM positions to our compact pitch positions
  const cleanFmPosition = (pos: string): string => {
    const upper = pos.toUpperCase();
    if (upper.includes("GK") || upper.includes("POR")) return "GK";
    if (upper.includes("D (C)") || upper.includes("DFC") || upper.includes("D C") || upper === "DC") return "D (C)";
    if (upper.includes("D (L)") || upper.includes("DF I") || upper.includes("LI") || upper.includes("DFL") || upper.includes("WB (L)") || upper.includes("WBL") || upper.includes("D L") || upper.includes("WB L")) return "D (L)";
    if (upper.includes("D (R)") || upper.includes("DF D") || upper.includes("LD") || upper.includes("DFR") || upper.includes("WB (R)") || upper.includes("WBR") || upper.includes("D R") || upper.includes("WB R")) return "D (R)";
    if (upper.includes("DM") || upper.includes("MCD")) return "DM";
    if (upper.includes("M (C)") || upper.includes("MC") || upper.includes("M C")) return "M (C)";
    if (upper.includes("AM (L)") || upper.includes("MP I") || upper.includes("AML") || upper.includes("EXT I") || upper.includes("AM L") || upper.includes("AMP L") || upper.includes("MP L")) return "AM (L)";
    if (upper.includes("AM (R)") || upper.includes("MP D") || upper.includes("AMR") || upper.includes("EXT D") || upper.includes("AM R") || upper.includes("AMP R") || upper.includes("MP R")) return "AM (R)";
    if (upper.includes("AM (C)") || upper.includes("ENG") || upper.includes("AMC") || upper.includes("MP C") || upper.includes("AM C") || upper.includes("MP C")) return "AM (C)";
    if (upper.includes("ST") || upper.includes("DL") || upper.includes("STC") || upper.includes("ST (C)") || upper.includes("F C") || upper.includes("FC")) return "ST (C)";
    return pos; // Fallback
  };

  return (
    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
      
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          📥 Importador de Jugadores (Desde Football Manager)
        </h2>
        <p className="text-xs text-slate-400">
          No cargues tus jugadores uno por uno. Nuestro importador lee los datos directamente del portapapeles de FM de forma masiva.
        </p>
      </div>

      {/* Guide Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3 text-xs">
        <h3 className="font-bold text-emerald-400 flex items-center gap-1">
          <HelpCircle className="w-4 h-4" /> ¿Cómo extraer tu plantel de Football Manager e importarlo aquí?
        </h3>
        <ol className="list-decimal pl-5 space-y-1.5 text-slate-300">
          <li>Abre tu partida en **Football Manager**.</li>
          <li>Ve a la sección **Plantilla (Squad)** en el menú lateral izquierdo.</li>
          <li>Asegúrate de que tu vista de plantilla tenga al menos las columnas clave (**ID único**, **Nombre**, **Edad**, **Posición**, **Valor de mercado**, **Sueldo**).</li>
          <li>Haz clic sobre cualquier fila del plantel y pulsa **Ctrl + A** (para seleccionar todo tu plantel) o usa Shift + Click.</li>
          <li>Pulsa **Ctrl + C** (Copiar) en tu teclado. Esto copiará automáticamente toda la tabla como datos tabulados (TSV).</li>
          <li>Regresa aquí, selecciona tu modo de importación abajo y **pega (Ctrl + V)** el texto en el área grande.</li>
        </ol>
        <p className="text-[10px] text-slate-500 font-mono italic">
          *Nota: El extractor es inteligente. No importa en qué orden estén las columnas o si traduces el juego, adivinará la información de tus jugadores.
        </p>
      </div>

      {/* Game Date Config Block */}
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-200 block">📅 Fecha de Juego Actual (FM)</span>
          <span className="text-[10.5px] text-slate-400">Esta fecha se utilizará como referencia exacta para calcular las edades y contratos.</span>
        </div>
        <input
          type="text"
          placeholder="Ej. 18/12/2036"
          value={gameDate}
          onChange={(e) => onChangeGameDate(e.target.value)}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-1.5 text-white font-mono text-center w-40 focus:border-emerald-500 focus:outline-none"
        />
      </div>

      {/* Paste Zone */}
      <div className="space-y-2">
        <label className="text-xs uppercase font-mono font-bold text-slate-400">Pega tu portapapeles aquí:</label>
        <textarea
          rows={7}
          value={pasteData}
          onChange={(e) => setPasteData(e.target.value)}
          placeholder={`ID\tNombre\tEdad\tPosición\tValor\tSueldo\n1001\tMarc-André Ter Steger\t31\tGK\t€35M\t€150K/sem\n2001\tRonaldo Araújo\t25\tD (C)\t€75M\t€180K/sem`}
          className="w-full bg-slate-900 border border-slate-800 text-xs font-mono p-3 rounded-lg text-slate-300 placeholder-slate-600 focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/20"
        />
      </div>

      {/* Actions and Mode Selector */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-slate-900/50 p-3 rounded-xl border border-slate-850">
        
        {/* Mode choice */}
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <span className="font-bold text-slate-300">Modo de Importación:</span>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'append'}
              onChange={() => setImportMode('append')}
              className="text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-800"
            />
            <span>Solo añadir nuevos ({currentPlayersCount} actuales)</span>
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input
              type="radio"
              name="importMode"
              checked={importMode === 'replace'}
              onChange={() => setImportMode('replace')}
              className="text-emerald-500 focus:ring-emerald-500 bg-slate-950 border-slate-800"
            />
            <span className="text-amber-400 font-medium">Actualizar existentes y añadir nuevos (Fusionar sin borrar)</span>
          </label>
        </div>

        {/* Action Button */}
        <button
          onClick={handleParseAndImport}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white text-xs px-5 py-2.5 rounded-lg flex items-center justify-center gap-1.5 font-bold transition shadow-md shadow-emerald-950/20"
        >
          <Upload className="w-4 h-4" /> Importar de Inmediato
        </button>
      </div>

      {/* Feedback messages */}
      {statusMessage && (
        <div className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/30 text-emerald-400 border-emerald-500/20' 
            : 'bg-rose-950/30 text-rose-400 border-rose-500/20'
        }`}>
          {statusMessage.type === 'success' ? <CheckCircle className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
          <span>{statusMessage.text}</span>
        </div>
      )}
    </div>
  );
}
