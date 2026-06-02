
import React, { useRef } from 'react';
import { DownloadIcon, PhotoIcon, FileIcon } from './icons';
import { LotteryDraw } from '../types';

interface BetSlipProps {
  betNumber: number;
  numbers: number[];
  winningNumbers?: Set<number>;
  historicalWins?: { hits: number, draw: LotteryDraw }[];
}

export const BetSlip: React.FC<BetSlipProps> = ({ betNumber, numbers, winningNumbers, historicalWins }) => {
  const slipRef = useRef<HTMLDivElement>(null);
  const numbersSet = new Set(numbers);
  const hits = winningNumbers ? numbers.filter(n => winningNumbers.has(n)).length : 0;


  const handleSaveAsPng = () => {
    if (slipRef.current && (window as any).html2canvas) {
      (window as any).html2canvas(slipRef.current, { backgroundColor: '#1F2937' }).then((canvas: HTMLCanvasElement) => {
        const link = document.createElement('a');
        link.download = `aposta_${betNumber}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      });
    }
  };

  const handleSaveAsPdf = () => {
    if (slipRef.current && (window as any).html2canvas && (window as any).jspdf) {
      const { jsPDF } = (window as any).jspdf;
      (window as any).html2canvas(slipRef.current, { backgroundColor: '#1F2937' }).then((canvas: HTMLCanvasElement) => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'px',
          format: [canvas.width, canvas.height]
        });
        pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
        pdf.save(`aposta_${betNumber}.pdf`);
      });
    }
  };

  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg flex flex-col relative">
      {winningNumbers && (
         <div className={`absolute -top-2 -right-2 px-2 py-1 text-xs font-bold rounded-full text-white ${
            hits >= 4 ? 'bg-emerald-500' : hits > 0 ? 'bg-blue-500' : 'bg-gray-600'
         }`}>
           {hits} {hits === 1 ? 'Acerto' : 'Acertos'}
         </div>
      )}
      <div ref={slipRef} className="bg-gray-800 p-2 sm:p-4">
        <h4 className="font-bold text-lg mb-4 text-emerald-400 text-center">Aposta #{betNumber}</h4>
        <div className="grid grid-cols-10 gap-1 sm:gap-1.5">
          {Array.from({ length: 60 }, (_, i) => i + 1).map((num) => {
            const isSelected = numbersSet.has(num);
            const isWinning = winningNumbers?.has(num);
            
            let style = 'bg-gray-700 text-gray-300';
            if (isSelected) {
                if (winningNumbers) { // Checking mode
                    if (isWinning) {
                        style = 'bg-emerald-500 text-white ring-2 ring-yellow-400 scale-110 shadow-lg';
                    } else {
                        style = 'bg-emerald-600 text-emerald-100 opacity-70';
                    }
                } else { // Normal display mode
                    style = 'bg-emerald-500 text-white scale-110';
                }
            }
            
            return (
              <div
                key={num}
                className={`w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center text-[10px] sm:text-xs font-bold rounded-full transition-all ${style}`}
              >
                {String(num).padStart(2, '0')}
              </div>
            )
          })}
        </div>
        
        {historicalWins && historicalWins.length > 0 && (
          <div className="mt-4 p-3 bg-slate-900/50 rounded-lg border border-slate-700 text-sm">
            <p className="text-gray-300 font-semibold flex items-center gap-2 mb-2">
              <span className="text-xl">🏆</span> Sorteios Passados:
            </p>
            <ul className="space-y-1.5">
              {historicalWins.slice(0, 3).map((win, i) => (
                <li key={i} className="flex justify-between items-center text-xs">
                  <span className={`font-bold px-2 py-0.5 rounded-full ${win.hits === 6 ? 'bg-yellow-500/20 text-yellow-400' : win.hits === 5 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {win.hits === 6 ? 'Sena' : win.hits === 5 ? 'Quina' : 'Quadra'}
                  </span>
                  <span className="text-gray-400">
                    Conc. <span className="text-white font-medium">{win.draw.id}</span>
                  </span>
                  <span className="text-gray-500">{win.draw.date}</span>
                </li>
              ))}
              {historicalWins.length > 3 && (
                <li className="text-gray-500 text-xs text-center mt-2 italic">
                  + {historicalWins.length - 3} outra(s) premiação(ões)...
                </li>
              )}
            </ul>
          </div>
        )}
      </div>
       <div className="mt-4 border-t border-gray-700 pt-3 flex justify-end gap-2">
         <button onClick={handleSaveAsPng} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors text-xs flex items-center gap-1">
            <PhotoIcon className="w-4 h-4"/> PNG
         </button>
         <button onClick={handleSaveAsPdf} className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md transition-colors text-xs flex items-center gap-1">
            <FileIcon className="w-4 h-4"/> PDF
         </button>
      </div>
    </div>
  );
};
