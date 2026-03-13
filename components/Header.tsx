import React from 'react';
import { DownloadIcon } from './icons';

interface HeaderProps {
  onInstall?: () => void;
  showInstallButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onInstall, showInstallButton }) => {
  return (
    <header className="py-6 md:py-8 bg-slate-900 border-b border-slate-800">
      <div className="container mx-auto px-4 md:px-8 flex flex-col items-center justify-center relative">
        <div className="text-center w-full">
            <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
              Gerador Mega Inteligente
            </h1>
            <p className="text-sm md:text-base text-gray-400">
              Análise estatística e geração inteligente de apostas para Mega-Sena
            </p>
        </div>
        
        {showInstallButton && onInstall && (
          <div className="mt-4 md:absolute md:top-0 md:right-8 md:mt-0">
            <button
              onClick={onInstall}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold py-2 px-4 rounded-full shadow-lg transition-all animate-bounce"
            >
              <DownloadIcon className="w-4 h-4" />
              Instalar App
            </button>
          </div>
        )}
      </div>
    </header>
  );
};