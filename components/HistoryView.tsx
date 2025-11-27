
import React from 'react';
import { GeneratedBetsSet } from '../types';
import { BetSlip } from './BetSlip';
import { HistoryIcon, TrashIcon } from './icons';

interface HistoryViewProps {
  history: GeneratedBetsSet[];
  clearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ history, clearHistory }) => {
  if (history.length === 0) {
    return (
      <div className="text-center p-8 text-gray-400 bg-gray-900/50 rounded-lg">
        <HistoryIcon className="w-12 h-12 mx-auto mb-4 text-gray-500"/>
        <h3 className="text-lg font-semibold">Nenhum jogo gerado ainda.</h3>
        <p>Vá para a aba "Gerador" para criar novas apostas. Elas aparecerão aqui.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
       <div className="flex justify-between items-center">
         <h2 className="text-2xl font-bold text-emerald-400">Histórico de Apostas</h2>
         <button onClick={clearHistory} className="flex items-center gap-2 px-3 py-1.5 text-sm font-semibold rounded-md transition-colors bg-red-800 hover:bg-red-700 text-white">
            <TrashIcon className="w-4 h-4" /> Limpar Histórico
         </button>
       </div>
      {history.map((set) => (
        <div key={set.id} className="bg-gray-900 p-4 rounded-lg">
          <div className="mb-4 pb-2 border-b border-gray-700">
            <h3 className="font-semibold">
              Gerado em: {set.timestamp.toLocaleString('pt-BR')}
            </h3>
            <p className="text-sm text-gray-400">
              Modo: <span className="font-medium text-emerald-400">{set.mode === 'intelligent' ? 'Inteligente' : 'Aleatório'}</span>
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {set.bets.map((bet, index) => (
              <BetSlip key={index} betNumber={index + 1} numbers={bet} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
