import express from "express";
import path from "path";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Gemini
  app.post("/api/generate-bets", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable not set" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const { analysisData, numberOfBets, dezenasPorJogo = 6 } = req.body;

      if (!analysisData || !numberOfBets) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const topFrequent = [...analysisData.stats].sort((a, b) => b.count - a.count).slice(0, 20);
      const topDelayed = [...analysisData.stats].sort((a, b) => b.delay - a.delay).slice(0, 20);

      const prompt = `
        Com base na seguinte análise de resultados anteriores da Mega-Sena, por favor, gere ${numberOfBets} novas apostas únicas.

        Regras para geração:
        1. Cada aposta deve conter ${dezenasPorJogo} números únicos de 1 a 60, ordenados em ordem crescente.
        2. Priorize números que aparecem com frequência na lista de "Mais Frequentes".
        3. Considere números que estão "atrasados" (não aparecem há algum tempo) como candidatos potenciais.
        4. Cada aposta deve ter um equilíbrio entre números pares e ímpares.
        5. Cada aposta deve ter uma distribuição equilibrada entre as faixas numéricas: 1-20, 21-40, 41-60.
        6. Todas as apostas geradas devem ser únicas umas das outras.

        Dados Estatísticos:
        - 20 Dezenas Mais Frequentes (dezena: contagem): ${JSON.stringify(topFrequent.map(s => ({ [s.number]: s.count })))}
        - 20 Dezenas Mais Atrasadas (dezena: sorteios desde a última aparição): ${JSON.stringify(topDelayed.map(s => ({ [s.number]: s.delay })))}

        Gere ${numberOfBets} apostas.
      `;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              bets: {
                type: Type.ARRAY,
                description: "Uma lista de apostas geradas para a loteria.",
                items: {
                  type: Type.ARRAY,
                  description: `Uma única aposta com ${dezenasPorJogo} números únicos entre 1 e 60, ordenados crescentemente.`,
                  items: {
                    type: Type.INTEGER,
                  },
                },
              },
            },
            required: ["bets"],
          },
        },
      });

      const jsonText = response.text?.trim() || "";
      const result = JSON.parse(jsonText);

      if (result && Array.isArray(result.bets)) {
        res.json({ bets: result.bets });
      } else {
        res.status(500).json({ error: "Resposta da IA em formato inesperado." });
      }
    } catch (error) {
      console.error("Erro na chamada da API Gemini:", error);
      res.status(500).json({ error: "Falha ao se comunicar com o serviço de IA." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
