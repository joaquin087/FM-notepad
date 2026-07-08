import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Ensure we fail-safe if API key is missing
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY no configurado en las variables de entorno.");
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
};

// JSON parsing with a safe limit
app.use(express.json({ limit: '10mb' }));

// API endpoint for Gemini analysis
app.post("/api/analyze-squad", async (req, res) => {
  try {
    const { players, formation, activeSquadPlan } = req.body;
    
    if (!players || !Array.isArray(players)) {
      return res.status(400).json({ error: "Lista de jugadores inválida." });
    }

    const ai = getGeminiClient();

    // Prepare a summarized dataset to stay within context limits and save tokens
    const summarizedPlayers = players.map(p => ({
      id: p.id,
      nombre: p.name,
      edad: p.age,
      posicion: p.position,
      calidad: `${p.currentAbility}/5`,
      potencial: `${p.potentialAbility}/5`,
      valor: p.marketValue || "Sin valor",
      estado: p.squadStatus,
      salario: p.wage || "N/A"
    }));

    const prompt = `
      Eres el Director Técnico Principal (Mánager) y analista táctico de élite en Football Manager.
      Analiza nuestra plantilla actual de Football Manager, la formación elegida (${formation}) y el plan actual de plantel para la temporada, donde buscamos tener exactamente 3 jugadores por posición: Titular, Suplente y Juvenil de proyección.

      Detalles tácticos clave:
      - Formación elegida: ${formation}
      - Total de jugadores en plantilla: ${players.length} (se espera alrededor de 110 en total, incluyendo reservas y juveniles)
      - Jugadores asignados actualmente en la alineación táctica de 3 por puesto:
        ${JSON.stringify(activeSquadPlan, null, 2)}

      Aquí tienes la lista completa de nuestros jugadores (con sus roles asignados de plantilla):
      ${JSON.stringify(summarizedPlayers.slice(0, 100), null, 2)}

      Por favor, elabora un informe de análisis estratégico profesional de fútbol y Football Manager en formato Markdown estructurado (en Español) con los siguientes puntos específicos:
      
      1. 📋 **Resumen de la Plantilla**: Evaluación general de la profundidad del plantel, la edad promedio y la estructura salarial (si hay demasiada masa salarial).
      2. 🚨 **Análisis de Huecos de la Plantilla**: Identifica claramente qué puestos en la formación "${formation}" carecen de la cobertura ideal de 3 por puesto (ej. falta Titular, Suplente o Juvenil) o cuáles sufren de sobrepoblación absurda.
      3. 🚀 **Joyas a Ceder (Cedidos con potencial)**: Recomienda exactamente 3-5 jugadores con bajo Current Ability pero alta estrella de Potential Ability (>= 4 estrellas) que debamos mandar obligatoriamente a préstamo para que ganen minutos clave de desarrollo. Explica por qué.
      4. 💰 **Operación Salida (Vender de inmediato)**: Recomienda 3-5 jugadores que deberíamos vender urgentemente (ya sea por edad avanzada, salarios ridículamente altos para su estatus de suplente, o simplemente porque no caben en los 33 elegidos del plan de temporada).
      5. 🧠 **Veredicto Táctico**: ¿Esta plantilla se adapta bien a la formación "${formation}"? ¿Deberíamos considerar otro esquema (ej. si tenemos demasiados enganches AMC o carrileros veloces)?
      
      Dale un tono muy Football Manager, motivador, realista, táctico y estratégico de un mánager de élite argentino/español. Utiliza negritas, tablas de forma balanceada y listas de ítems elegantes.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Error en análisis de IA:", error);
    res.status(500).json({ error: error.message || "Error al comunicarse con la IA de Gemini." });
  }
});

// Serve frontend and integrate Vite in development
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Fallo al arrancar el servidor táctico:", error);
});
