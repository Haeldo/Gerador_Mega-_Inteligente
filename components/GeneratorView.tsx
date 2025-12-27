
import React, { useState, useCallback } from 'react';
import { AnalysisData } from '../types';
import { generateIntelligentBets } from '../services/geminiService';
import { BetSlip } from './BetSlip';
import { SparklesIcon, CubeIcon } from './icons';

interface GeneratorViewProps {
  analysisData: AnalysisData | null;
  onBetsGenerated: (bets: number[][], mode: GenerationMode, totalCost: number) => void;
}

type GenerationMode = 'intelligent' | 'random';

export const GeneratorView: React.FC<GeneratorViewProps> = ({ analysisData, onBetsGenerated }) => {
  const [numGames, setNumGames] = useState<number>(5);
  const [betValue, setBetValue] = useState<number>(5.00); // Valor padrão da aposta
  const [mode, setMode] = useState<GenerationMode>('intelligent');
  const [generatedBets, setGeneratedBets] = useState<number[][]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRandomBets = (count: number): number[][] => {
    const bets: number[][] = [];
    for (let i = 0; i < count; i++) {
      const numbers = new Set<number>();
      while (numbers.size < 6) {
        numbers.add(Math.floor(Math.random() * 60) + 1);
      }
      bets.push(Array.from(numbers).sort((a, b) => a - b));
    }
    return bets;
  };

  const handleGenerate = useCallback(async () => {
    // Validação de limite
    const safeNumGames = Math.min(Math.max(numGames, 1), 100);
    
    setIsLoading(true);
    setError(null);
    setGeneratedBets([]);

    try {
      let bets: number[][] = [];
      if (mode === 'intelligent' && analysisData) {
        bets = await generateIntelligentBets(analysisData, safeNumGames);
      } else {
        bets = generateRandomBets(safeNumGames);
      }
      setGeneratedBets(bets);
      if (bets.length > 0) {
        const totalCost = bets.length * betValue;
        onBetsGenerated(bets, mode, totalCost);
      }
    } catch (err) {
      setError('Ocorreu um erro ao gerar as apostas. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [analysisData, numGames, mode, betValue, onBetsGenerated]);

  const handleNumGamesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    if (!isNaN(val)) {
        setNumGames(val);
    } else if (e.target.value === '') {
        // Permite limpar o campo para digitar
        setNumGames(0);
    }
  };

  const handleBetValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseFloat(e.target.value);
      if (!isNaN(val)) {
          setBetValue(val);
      }
  };

  if (!analysisData) {
    return (
      <div className="text-center p-8 text-yellow-400 bg-yellow-900/20 rounded-lg">
        <p>Por favor, carregue e analise um arquivo de resultados na aba "Análise" para habilitar a geração inteligente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-4 rounded-lg space-y-4">
        
        {/* Controls Row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
                <div className="flex flex-col">
                    <label htmlFor="numGames" className="text-xs text-gray-400 mb-1">Qtd. Jogos</label>
                    <input
                        type="number"
                        id="numGames"
                        min="1"
                        max="100"
                        value={numGames === 0 ? '' : numGames}
                        onChange={handleNumGamesChange}
                        className="bg-gray-700 border border-gray-600 rounded-md p-2 w-24 text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none text-white"
                    />
                </div>

                <div className="flex flex-col">
                    <label htmlFor="betValue" className="text-xs text-gray-400 mb-1">Valor Aposta (R$)</label>
                    <input
                        type="number"
                        id="betValue"
                        min="0"
                        step="0.50"
                        value={betValue}
                        onChange={handleBetValueChange}
                        className="bg-gray-700 border border-gray-600 rounded-md p-2 w-24 text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none text-white"
                    />
                </div>

                <div className="flex flex-col">
                     <span className="text-xs text-gray-400 mb-1">Custo Total Est.</span>
                     <div className="bg-gray-800 border border-gray-700 rounded-md p-2 px-4 text-emerald-400 font-bold min-w-[100px] text-center">
                        R$ {(numGames * betValue).toFixed(2)}
                     </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-gray-700 p-1 rounded-lg w-full md:w-auto justify-center">
                    <button
                        onClick={() => setMode('intelligent')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                        mode === 'intelligent' ? 'bg-emerald-500 text-white' : 'text-gray-300'
                        }`}
                    >
                        <SparklesIcon className="w-4 h-4" /> Inteligente
                    </button>
                    <button
                        onClick={() => setMode('random')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                        mode === 'random' ? 'bg-blue-500 text-white' : 'text-gray-300'
                        }`}
                    >
                        <CubeIcon className="w-4 h-4"/> Aleatório
                    </button>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || numGames < 1 || numGames > 100}
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Gerando...' : 'Gerar Apostas'}
                </button>
            </div>
        </div>
      </div>

      {error && <p className="text-center text-red-400">{error}</p>}
      
      {isLoading && <div className="text-center p-8 text-gray-400 animate-pulse">A IA está analisando padrões e gerando seus jogos...</div>}

      {generatedBets.length > 0 && (
        <div className="space-y-8 animate-fade-in">
            <h3 className="text-xl font-bold text-center">Apostas Geradas ({generatedBets.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {generatedBets.map((bet, index) => (
                    <BetSlip key={index} betNumber={index + 1} numbers={bet} />
                ))}
            </div>
        </div>
      )}
    </div>
  );
};
