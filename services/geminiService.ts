
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisData } from '../types';

export const generateIntelligentBets = async (
  analysisData: AnalysisData,
  numberOfBets: number
): Promise<number[][]> => {
  if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const topFrequent = [...analysisData.stats].sort((a, b) => b.count - a.count).slice(0, 20);
  const topDelayed = [...analysisData.stats].sort((a, b) => b.delay - a.delay).slice(0, 20);

  const prompt = `
    Com base na seguinte análise de resultados anteriores da Mega-Sena, por favor, gere ${numberOfBets} novas apostas únicas.

    Regras para geração:
    1. Cada aposta deve conter 6 números únicos de 1 a 60, ordenados em ordem crescente.
    2. Priorize números que aparecem com frequência na lista de "Mais Frequentes".
    3. Considere números que estão "atrasados" (não aparecem há algum tempo) como candidatos potenciais.
    4. Cada aposta deve ter um equilíbrio entre números pares e ímpares (por exemplo, 3 pares/3 ímpares, 2/4 ou 4/2).
    5. Cada aposta deve ter uma distribuição equilibrada entre as faixas numéricas: 1-20, 21-40, 41-60.
    6. Todas as apostas geradas devem ser únicas umas das outras.

    Dados Estatísticos:
    - 20 Dezenas Mais Frequentes (dezena: contagem): ${JSON.stringify(topFrequent.map(s => ({ [s.number]: s.count })))}
    - 20 Dezenas Mais Atrasadas (dezena: sorteios desde a última aparição): ${JSON.stringify(topDelayed.map(s => ({ [s.number]: s.delay })))}

    Gere ${numberOfBets} apostas.
    `;

  try {
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
                            description: "Uma única aposta com 6 números únicos entre 1 e 60, ordenados crescentemente.",
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

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);

    if (result && Array.isArray(result.bets)) {
        return result.bets;
    } else {
        throw new Error("Resposta da IA em formato inesperado.");
    }

  } catch (error) {
    console.error("Erro na chamada da API Gemini:", error);
    throw new Error("Falha ao se comunicar com o serviço de IA.");
  }
};
