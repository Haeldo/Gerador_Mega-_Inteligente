
import React from 'react';
import { GeneratedBetsSet } from '../types';
import { BetSlip } from './BetSlip';
import { HistoryIcon, TrashIcon, PrinterIcon } from './icons';
import { generateA4PDF } from '../services/pdfService';

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

  const handlePrint = (set: GeneratedBetsSet) => {
    generateA4PDF(set.bets, `Histórico - ${new Date(set.timestamp).toLocaleString('pt-BR')}`);
  };

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
          <div className="mb-4 pb-2 border-b border-gray-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h3 className="font-semibold text-lg">
                Gerado em: {new Date(set.timestamp).toLocaleString('pt-BR')}
                </h3>
                <div className="flex gap-4 mt-1">
                    <p className="text-sm text-gray-400">
                    Modo: <span className="font-medium text-emerald-400">{set.mode === 'intelligent' ? 'Inteligente' : 'Aleatório'}</span>
                    </p>
                    {set.totalCost !== undefined && (
                         <p className="text-sm text-gray-400">
                         Investimento: <span className="font-bold text-yellow-400">R$ {set.totalCost.toFixed(2)}</span>
                         </p>
                    )}
                </div>
            </div>
            <button 
                onClick={() => handlePrint(set)}
                className="flex items-center gap-2 text-sm bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-md transition-colors w-full md:w-auto justify-center"
                title="Imprimir jogos desta série em A4"
            >
                <PrinterIcon className="w-4 h-4"/> Imprimir A4
            </button>
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
