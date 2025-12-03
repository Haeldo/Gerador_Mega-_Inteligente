
import React, { useState, useMemo } from 'react';
import { AnalysisData } from '../types';
import { calculateCombinationCount, generateCombinations } from '../services/mathService';
import { BetSlip } from './BetSlip';
import { GridIcon, SparklesIcon, TrashIcon, PrinterIcon } from './icons';
import { generateA4PDF } from '../services/pdfService';

interface ClosingViewProps {
  analysisData: AnalysisData | null;
  onBetsGenerated: (bets: number[][], mode: 'intelligent') => void;
}

export const ClosingView: React.FC<ClosingViewProps> = ({ analysisData, onBetsGenerated }) => {
  const [selectedNumbers, setSelectedNumbers] = useState<Set<number>>(new Set());
  const [generatedBets, setGeneratedBets] = useState<number[][]>([]);
  
  // Constantes de limite para evitar travamento da UI
  const MIN_SELECTION = 6;
  const MAX_SELECTION = 12; // C(12,6) = 924 jogos (limite razoável para renderizar)

  const toggleNumber = (num: number) => {
    const newSet = new Set(selectedNumbers);
    if (newSet.has(num)) {
      newSet.delete(num);
    } else {
      if (newSet.size >= MAX_SELECTION) {
        alert(`O limite para desdobramento nesta ferramenta é de ${MAX_SELECTION} números (geraria ${calculateCombinationCount(MAX_SELECTION, 6)} jogos).`);
        return;
      }
      newSet.add(num);
    }
    setSelectedNumbers(newSet);
    // Limpa jogos gerados se mudar a seleção para evitar confusão
    if (generatedBets.length > 0) setGeneratedBets([]);
  };

  const selectTopNumbers = () => {
    if (!analysisData) {
        alert("É necessário importar uma planilha na aba 'Análise' para usar esta função.");
        return;
    }
    
    // Pega os 10 mais frequentes
    const top10 = [...analysisData.stats]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(s => s.number);
    
    setSelectedNumbers(new Set(top10));
    setGeneratedBets([]);
  };

  const handleGenerate = () => {
    const pool = (Array.from(selectedNumbers) as number[]).sort((a, b) => a - b);
    
    if (pool.length < 6) {
        alert("Selecione pelo menos 6 números.");
        return;
    }

    const combinations = generateCombinations(pool, 6);
    setGeneratedBets(combinations);
  };

  const handleSaveToHistory = () => {
      onBetsGenerated(generatedBets, 'intelligent');
      alert(`${generatedBets.length} jogos salvos no histórico!`);
  };

  const handlePrintA4 = () => {
      generateA4PDF(generatedBets, "Relatório de Fechamento");
  };

  const clearSelection = () => {
      setSelectedNumbers(new Set());
      setGeneratedBets([]);
  };

  const combinationCount = calculateCombinationCount(selectedNumbers.size, 6);
  const hotNumbers = useMemo(() => {
      if (!analysisData) return new Set<number>();
      // Top 10 hot numbers for visual highlighting
      return new Set([...analysisData.stats].sort((a, b) => b.count - a.count).slice(0, 10).map(s => s.number));
  }, [analysisData]);

  return (
    <div className="space-y-6">
      <div className="bg-gray-900 p-6 rounded-lg ring-1 ring-white/10">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h2 className="text-2xl font-bold text-emerald-400 flex items-center gap-2">
                    <GridIcon className="w-6 h-6"/> Fechamento Matemático
                </h2>
                <p className="text-gray-400 text-sm mt-1">
                    Selecione de 7 a {MAX_SELECTION} números para gerar todas as combinações possíveis (Desdobramento Total).
                </p>
            </div>
            
            <div className="flex gap-2">
                 <button 
                    onClick={selectTopNumbers}
                    disabled={!analysisData}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    title={!analysisData ? "Necessário realizar análise primeiro" : "Seleciona os 10 números mais frequentes"}
                >
                    <SparklesIcon className="w-4 h-4" /> Sugerir Melhores
                </button>
                <button 
                    onClick={clearSelection}
                    className="flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-md bg-gray-700 hover:bg-red-900/50 hover:text-red-200 text-gray-300 transition-colors"
                >
                    <TrashIcon className="w-4 h-4" /> Limpar
                </button>
            </div>
        </div>

        {/* Number Grid */}
        <div className="grid grid-cols-6 sm:grid-cols-10 gap-2 mb-6">
            {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => {
                const isSelected = selectedNumbers.has(num);
                const isHot = hotNumbers.has(num);
                
                return (
                    <button
                        key={num}
                        onClick={() => toggleNumber(num)}
                        className={`
                            h-10 rounded-md font-bold text-sm transition-all relative
                            ${isSelected 
                                ? 'bg-emerald-500 text-white ring-2 ring-white scale-105 z-10' 
                                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}
                        `}
                    >
                        {num}
                        {isHot && !isSelected && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-amber-500 rounded-full" title="Número Quente (Frequente)"></span>
                        )}
                    </button>
                );
            })}
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-gray-700 pt-4">
            <div className="text-center sm:text-left">
                <p className="text-gray-300">
                    Números selecionados: <span className="font-bold text-white">{selectedNumbers.size}</span>
                </p>
                <p className="text-sm text-gray-500">
                    Jogos a gerar: <span className="font-mono text-emerald-400 font-bold">{combinationCount}</span>
                </p>
            </div>
            
            <button
                onClick={handleGenerate}
                disabled={selectedNumbers.size < 6}
                className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-8 rounded-lg transition-all disabled:bg-gray-600 disabled:cursor-not-allowed shadow-lg"
            >
                Gerar Desdobramento
            </button>
        </div>
      </div>

      {/* Results */}
      {generatedBets.length > 0 && (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center bg-gray-800 p-4 rounded-lg">
                <h3 className="text-xl font-bold">Jogos Gerados ({generatedBets.length})</h3>
                <div className="flex gap-2">
                    <button 
                        onClick={handlePrintA4}
                        className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
                    >
                        <PrinterIcon className="w-4 h-4"/> Imprimir A4
                    </button>
                    <button 
                        onClick={handleSaveToHistory}
                        className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
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
