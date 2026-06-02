
import { AnalysisData } from '../types';

export const generateIntelligentBets = async (
  analysisData: AnalysisData,
  numberOfBets: number,
  dezenasPorJogo: number = 6
): Promise<number[][]> => {
  const response = await fetch('/api/generate-bets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      analysisData,
      numberOfBets,
      dezenasPorJogo,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Falha ao se comunicar com o servidor da IA.');
  }

  return data.bets;
};
