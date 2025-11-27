
import React, { useState, useMemo } from 'react';
import { GeneratedBetsSet, LotteryDraw } from '../types';
import { BetSlip } from './BetSlip';
import { CheckIcon, HistoryIcon, SparklesIcon } from './icons';

interface CheckerViewProps {
  history: GeneratedBetsSet[];
  draws: LotteryDraw[];
}

interface HistoricalMatch {
  betIndex: number;
  betNumbers: number[];
  drawId: number;
  drawDate: string;
  drawNumbers: number[];
  hits: number;
}

export const CheckerView: React.FC<CheckerViewProps> = ({ history, draws }) => {
  const [winningNumbersStr, setWinningNumbersStr] = useState('');
  const [selectedDrawId, setSelectedDrawId] = useState<string>('');
  const [checked, setChecked] = useState(false);
  const [historicalMatches, setHistoricalMatches] = useState<HistoricalMatch[]>([]);
  const [showHistoryCheck, setShowHistoryCheck] = useState(false);

  const winningNumbersSet = useMemo(() => {
    const numbers = winningNumbersStr
      .split(/[,.\s]+/)
      .map(n => parseInt(n.trim()))
      .filter(n => !isNaN(n) && n > 0 && n <= 60);
    return new Set(numbers);
  }, [winningNumbersStr]);

  const allBets = useMemo(() => history.flatMap(h => h.bets), [history]);

  const handleCheck = () => {
    if (winningNumbersSet.size === 6) {
      setChecked(true);
      setShowHistoryCheck(false);
    } else {
      alert('Por favor, insira 6 números válidos para conferir.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChecked(false);
    setSelectedDrawId(''); // Clear selection if typing manually
    setWinningNumbersStr(e.target.value);
  };

  const handleSelectDraw = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const drawId = e.target.value;
    setSelectedDrawId(drawId);
    if (drawId) {
        const draw = draws.find(d => d.id === Number(drawId));
        if (draw) {
            setWinningNumbersStr(draw.numbers.join(', '));
            setChecked(false); // Reset check state so user has to click "Conferir" or auto-check
        }
    } else {
        setWinningNumbersStr('');
    }
  };

  const handleCheckHistory = () => {
      if (draws.length === 0 || allBets.length === 0) return;

      const matches: HistoricalMatch[] = [];

      allBets.forEach((bet, betIndex) => {
          const betSet = new Set(bet);
          
          draws.forEach(draw => {
              const hits = draw.numbers.filter(n => betSet.has(n)).length;
              // Quadra (4), Quina (5), Sena (6)
              if (hits >= 4) {
                  matches.push({
                      betIndex: betIndex + 1,
                      betNumbers: bet,
                      drawId: draw.id,
                      drawDate: draw.date,
                      drawNumbers: draw.numbers,
                      hits
                  });
              }
          });
      });

      setHistoricalMatches(matches.sort((a, b) => b.drawId - a.drawId)); // Newest matches first
      setShowHistoryCheck(true);
      setChecked(false);
  };

  if (history.length === 0) {
    return (
      <div className="text-center p-8 text-gray-400 bg-gray-900/50 rounded-lg">
        <CheckIcon className="w-12 h-12 mx-auto mb-4 text-gray-500"/>
        <h3 className="text-lg font-semibold">Sem apostas para conferir.</h3>
        <p>Gere algumas apostas na aba "Gerador" e elas estarão disponíveis aqui para conferência.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gray-900 p-6 rounded-lg space-y-6">
        <h2 className="text-2xl font-bold text-center text-emerald-400">Conferir Apostas</h2>
        
        {/* Draw Selector from Database */}
        {draws.length > 0 && (
            <div className="bg-gray-800 p-4 rounded-lg ring-1 ring-white/10">
                <label htmlFor="drawSelect" className="font-semibold block mb-2 text-sm text-gray-400">
                    Selecione um concurso importado:
                </label>
                <div className="flex gap-2">
                    <select 
                        id="drawSelect" 
                        value={selectedDrawId} 
                        onChange={handleSelectDraw}
                        className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white"
                    >
                        <option value="">-- Digitar Manualmente --</option>
                        {draws.map(draw => (
                            <option key={draw.id} value={draw.id}>
                                Concurso {draw.id} - {draw.date} ({draw.numbers.join(', ')})
                            </option>
                        ))}
                    </select>
                </div>
            </div>
        )}

        {/* Manual/Auto Input */}
        <div>
            <label htmlFor="winningNumbers" className="font-semibold block mb-2 text-sm text-gray-400">
            Dezenas sorteadas (confira ou digite):
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
                <input
                    type="text"
                    id="winningNumbers"
                    value={winningNumbersStr}
                    onChange={handleInputChange}
                    placeholder="Ex: 5, 12, 23, 34, 45, 56"
                    className="w-full bg-gray-700 border border-gray-600 rounded-md p-2 text-white focus:ring-emerald-500 focus:border-emerald-500 font-mono text-lg"
                />
                <button
                    onClick={handleCheck}
                    disabled={winningNumbersSet.size !== 6}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center justify-center gap-2 disabled:bg-gray-500 disabled:cursor-not-allowed whitespace-nowrap"
                >
                    <CheckIcon className="w-4 h-4" /> Conferir
                </button>
            </div>
        </div>

        {/* Historic Check Button */}
        {draws.length > 0 && (
            <div className="pt-4 border-t border-gray-700 text-center">
                <p className="text-sm text-gray-400 mb-3">
                    Curioso? Verifique se seus jogos gerados já ganharam algum prêmio no passado.
                </p>
                <button
                    onClick={handleCheckHistory}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg transition-all flex items-center justify-center gap-2 mx-auto"
                >
                    <HistoryIcon className="w-4 h-4" /> Verificar em Todo Histórico
                </button>
            </div>
        )}
      </div>

      {/* Results View: Manual/Single Check */}
      {checked && (
        <div className="space-y-6 animate-fade-in">
            <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Resultados da Conferência</h3>
                <span className="text-sm bg-gray-700 px-3 py-1 rounded-full text-gray-300">
                    Sorteio: {winningNumbersStr}
                </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {allBets.map((bet, index) => (
                    <BetSlip key={index} betNumber={index + 1} numbers={bet} winningNumbers={winningNumbersSet} />
                ))}
            </div>
        </div>
      )}

      {/* Results View: Historical Check */}
      {showHistoryCheck && (
          <div className="space-y-6 animate-fade-in">
             <h3 className="text-xl font-bold border-l-4 border-indigo-500 pl-4">
                 Análise Histórica de Premiação
             </h3>
             
             {historicalMatches.length === 0 ? (
                 <div className="bg-gray-800 p-6 rounded-lg text-center text-gray-400">
                     <p>Nenhuma aposta gerada teria ganho Quadra, Quina ou Sena nos concursos importados.</p>
                 </div>
             ) : (
                 <div className="space-y-4">
                     <p className="text-gray-300">Encontramos {historicalMatches.length} coincidências no passado (Quadra+):</p>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {historicalMatches.map((match, idx) => (
                            <div key={idx} className="bg-slate-800 p-4 rounded-lg border border-slate-700 flex flex-col gap-2">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-gray-700 text-xs px-2 py-1 rounded">Aposta #{match.betIndex}</span>
                                        <span className={`text-xs font-bold px-2 py-1 rounded ${
                                            match.hits === 6 ? 'bg-emerald-500 text-white' : 
                                            match.hits === 5 ? 'bg-blue-500 text-white' : 'bg-yellow-600 text-white'
                                        }`}>
                                            {match.hits === 6 ? 'SENA' : match.hits === 5 ? 'QUINA' : 'QUADRA'}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-bold text-white">Concurso {match.drawId}</p>
                                        <p className="text-xs text-gray-500">{match.drawDate}</p>
                                    </div>
                                </div>
                                <div className="mt-2 text-sm">
                                    <p className="text-gray-400 text-xs mb-1">Números Sorteados:</p>
                                    <div className="flex flex-wrap gap-1">
                                        {match.drawNumbers.map(n => (
                                            <span key={n} className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${match.betNumbers.includes(n) ? 'bg-emerald-500/50 text-emerald-100 ring-1 ring-emerald-500' : 'bg-gray-700 text-gray-500'}`}>
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="mt-2 text-sm">
                                    <p className="text-gray-400 text-xs mb-1">Sua Aposta:</p>
                                    <div className="flex flex-wrap gap-1">
                                         {match.betNumbers.map(n => (
                                            <span key={n} className={`w-6 h-6 flex items-center justify-center rounded-full text-xs ${match.drawNumbers.includes(n) ? 'bg-emerald-500 text-white font-bold' : 'bg-gray-700 text-gray-400'}`}>
                                                {n}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                     </div>
                 </div>
             )}
          </div>
      )}
    </div>
  );
};
