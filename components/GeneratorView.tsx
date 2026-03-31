
import React, { useState, useCallback } from 'react';
import { AnalysisData } from '../types';
import { generateIntelligentBets } from '../services/geminiService';
import { BetSlip } from './BetSlip';
import { SparklesIcon, CubeIcon } from './icons';

interface GeneratorViewProps {
  analysisData: AnalysisData | null;
  onBetsGenerated: (bets: number[][], mode: GenerationMode, totalCost: number) => void;
}

type GenerationMode = 'intelligent' | 'random' | 'manual';

export const GeneratorView: React.FC<GeneratorViewProps> = ({ analysisData, onBetsGenerated }) => {
  const [numGames, setNumGames] = useState<number>(5);
  const [betValue, setBetValue] = useState<number>(6.00); // Valor padrão da aposta
  const [dezenasPorJogo, setDezenasPorJogo] = useState<number>(6);
  const [mode, setMode] = useState<GenerationMode>('intelligent');
  const [generatedBets, setGeneratedBets] = useState<number[][]>([]);
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateRandomBets = (count: number, size: number): number[][] => {
    const bets: number[][] = [];
    for (let i = 0; i < count; i++) {
      const numbers = new Set<number>();
      while (numbers.size < size) {
        numbers.add(Math.floor(Math.random() * 60) + 1);
      }
      bets.push(Array.from<number>(numbers).sort((a, b) => a - b));
    }
    return bets;
  };

  const handleGenerate = useCallback(async () => {
    // Validação de limite
    const safeNumGames = mode === 'manual' ? 1 : Math.min(Math.max(numGames, 1), 100);
    
    setIsLoading(true);
    setError(null);

    try {
      let bets: number[][] = [];
      if (mode === 'intelligent' && analysisData) {
        bets = await generateIntelligentBets(analysisData, safeNumGames, dezenasPorJogo);
      } else if (mode === 'random') {
        bets = generateRandomBets(safeNumGames, dezenasPorJogo);
      } else if (mode === 'manual') {
        if (selectedNumbers.size !== dezenasPorJogo) {
            setError(`Selecione exatamente ${dezenasPorJogo} dezenas.`);
            setIsLoading(false);
            return;
        }
        bets = [Array.from<number>(selectedNumbers).sort((a, b) => a - b)];
      }
      
      if (mode === 'manual') {
          setGeneratedBets(prev => [...prev, ...bets]);
          setSelectedNumbers(new Set()); // Clear selection after generating
      } else {
          setGeneratedBets(bets);
      }
    } catch (err) {
      setError('Ocorreu um erro ao gerar as apostas. Tente novamente.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [analysisData, numGames, mode, betValue, dezenasPorJogo, selectedNumbers]);

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

  const handleModeChange = (newMode: GenerationMode) => {
      setMode(newMode);
      if (newMode === 'manual') {
          setNumGames(1);
      }
  };

  const toggleNumber = (num: number) => {
    const newSet = new Set(selectedNumbers);
    if (newSet.has(num)) {
      newSet.delete(num);
    } else {
      if (newSet.size >= dezenasPorJogo) {
        alert(`Você já selecionou ${dezenasPorJogo} dezenas.`);
        return;
      }
      newSet.add(num);
    }
    setSelectedNumbers(newSet);
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
                    <label htmlFor="dezenasPorJogo" className="text-xs text-gray-400 mb-1">Dezenas</label>
                    <select
                        id="dezenasPorJogo"
                        value={dezenasPorJogo}
                        onChange={(e) => {
                            setDezenasPorJogo(Number(e.target.value));
                            setSelectedNumbers(new Set());
                        }}
                        className="bg-gray-700 border border-gray-600 rounded-md p-2 w-20 text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none text-white"
                    >
                        {[6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col">
                    <label htmlFor="numGames" className="text-xs text-gray-400 mb-1">Qtd. Jogos</label>
                    <input
                        type="number"
                        id="numGames"
                        min="1"
                        max="100"
                        value={mode === 'manual' ? generatedBets.length : (numGames === 0 ? '' : numGames)}
                        onChange={handleNumGamesChange}
                        disabled={mode === 'manual'}
                        className="bg-gray-700 border border-gray-600 rounded-md p-2 w-24 text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none text-white disabled:opacity-50"
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
                        R$ {((mode === 'manual' ? generatedBets.length : numGames) * betValue).toFixed(2)}
                     </div>
                </div>
            </div>

            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                <div className="flex items-center gap-2 bg-gray-700 p-1 rounded-lg w-full md:w-auto justify-center">
                    <button
                        onClick={() => handleModeChange('intelligent')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                        mode === 'intelligent' ? 'bg-emerald-500 text-white' : 'text-gray-300'
                        }`}
                    >
                        <SparklesIcon className="w-4 h-4" /> Inteligente
                    </button>
                    <button
                        onClick={() => handleModeChange('random')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                        mode === 'random' ? 'bg-blue-500 text-white' : 'text-gray-300'
                        }`}
                    >
                        <CubeIcon className="w-4 h-4"/> Aleatório
                    </button>
                    <button
                        onClick={() => handleModeChange('manual')}
                        className={`flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors ${
                        mode === 'manual' ? 'bg-purple-500 text-white' : 'text-gray-300'
                        }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" /></svg> Manual
                    </button>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={isLoading || (mode !== 'manual' && (numGames < 1 || numGames > 100)) || (mode === 'manual' && selectedNumbers.size !== dezenasPorJogo)}
                    className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:bg-gray-600 disabled:cursor-not-allowed"
                >
                    {isLoading ? 'Aguarde...' : (mode === 'manual' ? 'Adicionar Aposta' : 'Gerar Apostas')}
                </button>
            </div>
        </div>

        {mode === 'manual' && (
            <div className="mt-6 border-t border-gray-700 pt-4 animate-fade-in">
                <div className="flex justify-between items-center mb-4">
                    <p className="text-sm text-gray-300">
                        Selecione <span className="font-bold text-emerald-400">{dezenasPorJogo}</span> dezenas para o seu jogo:
                    </p>
                    <p className="text-sm text-gray-400">
                        Selecionadas: <span className="font-bold text-white">{selectedNumbers.size}</span> / {dezenasPorJogo}
                    </p>
                </div>
                <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
                    {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => {
                        const isSelected = selectedNumbers.has(num);
                        return (
                            <button
                                key={num}
                                onClick={() => toggleNumber(num)}
                                className={`
                                    h-10 rounded-md font-bold text-sm transition-all
                                    ${isSelected 
                                        ? 'bg-purple-500 text-white ring-2 ring-white scale-105' 
                                        : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}
                                `}
                            >
                                {num}
                            </button>
                        );
                    })}
                </div>
            </div>
        )}
      </div>

      {error && <p className="text-center text-red-400">{error}</p>}
      
      {isLoading && <div className="text-center p-8 text-gray-400 animate-pulse">Processando...</div>}

      {generatedBets.length > 0 && (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-800 p-4 rounded-lg gap-4">
                <h3 className="text-xl font-bold">Apostas Geradas ({generatedBets.length})</h3>
                <div className="flex flex-wrap justify-center gap-2">
                    <button 
                        onClick={() => setGeneratedBets([])}
                        className="text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        Limpar
                    </button>
                    <button 
                        onClick={() => {
                            const totalCost = generatedBets.length * betValue;
                            onBetsGenerated(generatedBets, mode, totalCost);
                            alert(`${generatedBets.length} jogos salvos no histórico com valor total de R$ ${totalCost.toFixed(2)}!`);
                            setGeneratedBets([]);
                        }}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors font-semibold"
                    >
                        Salvar no Histórico
                    </button>
                </div>
            </div>
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
