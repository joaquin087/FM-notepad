import React, { useState, useEffect } from 'react';
import { Player, Formation } from '../types';
import { Sparkles, Cpu, AlertTriangle, Play } from 'lucide-react';
import { MarkdownRenderer } from './MarkdownRenderer';

interface AICoachProps {
  players: Player[];
  activeFormation: Formation;
  assignments: Record<string, { titular: string | null; suplente: string | null; juvenil: string | null }>;
}

const loadingQuotes = [
  "Analizando estadísticas físicas del plantel...",
  "Observando videos del plantel juvenil (Sub-19)...",
  "Calculando la sobrepoblación del presupuesto salarial...",
  "Evaluando familiaridad táctica con el esquema elegido...",
  "Redactando informes de ojeadores para posibles ventas...",
  "Discutiendo con el Preparador Físico sobre la intensidad del entrenamiento...",
  "Comparando atributos clave de tus suplentes contra el titular...",
  "Revisando contratos próximos a vencer para evitar fugas gratis..."
];

export function AICoach({ players, activeFormation, assignments }: AICoachProps) {
  const [loading, setLoading] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [report, setReport] = useState<string | null>(() => {
    return localStorage.getItem("fm_ai_report") || null;
  });
  const [error, setError] = useState<string | null>(null);

  // Rotate loading quotes when loading
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % loadingQuotes.length);
    }, 2800);
    return () => clearInterval(interval);
  }, [loading]);

  const handleGenerateReport = async () => {
    setLoading(true);
    setError(null);
    setQuoteIndex(0);

    try {
      // Clean up assignments to map names/positions instead of just raw IDs
      const mappedAssignments: Record<string, any> = {};
      Object.entries(assignments).forEach(([posKey, slot]) => {
        const getPlayerDetails = (id: string | null) => {
          if (!id) return null;
          const p = players.find(player => player.id === id);
          return p ? { nombre: p.name, edad: p.age, ca: p.currentAbility, pa: p.potentialAbility, valor: p.marketValue } : null;
        };

        mappedAssignments[posKey] = {
          titular: getPlayerDetails(slot.titular),
          suplente: getPlayerDetails(slot.suplente),
          juvenil: getPlayerDetails(slot.juvenil)
        };
      });

      const response = await fetch("/api/analyze-squad", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          players,
          formation: activeFormation.name,
          activeSquadPlan: mappedAssignments
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Ocurrió un error al procesar el reporte táctico.");
      }

      const data = await response.json();
      setReport(data.analysis);
      localStorage.setItem("fm_ai_report", data.analysis);

    } catch (err: any) {
      console.error(err);
      setError(err.message || "Error de comunicación con el servidor del asistente táctico.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-5">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            🧠 Asistente Táctico de IA (Gemini Advisor)
          </h2>
          <p className="text-xs text-slate-400">
            Tu mánager asistente analiza las estrellas de potencial, salarios y posiciones para armar la lista de préstamos, descartes y fichajes sugeridos.
          </p>
        </div>

        <button
          onClick={handleGenerateReport}
          disabled={loading}
          className={`px-4 py-2.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-md
            ${loading 
              ? 'bg-slate-850 border border-slate-850 text-slate-500 cursor-not-allowed' 
              : 'bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-[1.02] cursor-pointer'
            }
          `}
        >
          <Sparkles className="w-4 h-4 text-emerald-300 animate-pulse" />
          {loading ? "Analizando Plantilla..." : "Pedir Informe al Asistente"}
        </button>
      </div>

      {/* Banner API Key information */}
      <div className="flex items-start gap-2 bg-slate-900/40 border border-slate-800/60 p-3 rounded-lg text-[11px] text-slate-400 font-sans">
        <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
        <p>
          Este análisis utiliza el modelo <strong className="text-emerald-300 font-semibold font-mono">gemini-3.5-flash</strong> configurado de forma segura en nuestro servidor. Las API Keys y secretos se gestionan en segundo plano de manera privada sin exponerse al navegador.
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-rose-950/20 border border-rose-500/20 p-4 rounded-xl text-xs text-rose-400 flex items-start gap-2.5">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-400 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold">Error del Asistente Táctico:</span>
            <p className="font-mono leading-relaxed">{error}</p>
            <p className="text-slate-500 text-[10px] italic mt-1">
              Verifica que el archivo .env tenga configurado tu GEMINI_API_KEY o que la plataforma lo inyecte de forma automática en los secretos de la aplicación.
            </p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center space-y-4">
          {/* Custom Spinner */}
          <div className="relative w-16 h-16 flex items-center justify-center">
            <div className="absolute inset-0 border-4 border-slate-800 border-t-emerald-500 rounded-full animate-spin" />
            <span className="text-xs font-mono font-bold text-emerald-400">FM</span>
          </div>
          
          <div className="space-y-1 max-w-sm">
            <h3 className="text-sm font-semibold text-white">Generando Informe Deportivo...</h3>
            <p className="text-xs text-slate-400 font-mono italic animate-fade">
              "{loadingQuotes[quoteIndex]}"
            </p>
          </div>
        </div>
      ) : report ? (
        <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/80 max-h-[500px] overflow-y-auto shadow-inner animate-fade-in">
          {/* Custom report heading */}
          <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4 text-xs font-mono">
            <span className="text-slate-500">REPORTE TÁCTICO DE IA - FM PLANNER</span>
            <span className="text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-900">SECRETARÍA TÉCNICA</span>
          </div>

          <MarkdownRenderer content={report} />
        </div>
      ) : (
        <div className="bg-slate-900/20 border border-slate-850 rounded-2xl p-8 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center mx-auto text-emerald-400 shadow-md">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="max-w-xs mx-auto space-y-1">
            <h3 className="text-xs font-bold text-slate-200">¿Falta profundidad en alguna línea?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Haz clic en el botón de arriba para que la IA escudriñe a tus 110 jugadores y redacte un plan táctico de temporada listo para ganar copas.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
