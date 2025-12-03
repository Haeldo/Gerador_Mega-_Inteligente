import React from 'react';
import { DownloadIcon } from './icons';

interface HeaderProps {
  onInstall?: () => void;
  showInstallButton?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onInstall, showInstallButton }) => {
  return (
    <header className="py-8 relative">
      <div className="container mx-auto px-4 md:px-8 text-center relative">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Gerador Mega Inteligente
        </h1>
        <p className="text-md text-gray-400 mt-2">
          Análise estatística e geração inteligente de apostas para Mega-Sena
        </p>
        
        {showInstallButton && onInstall && (
          <div className="absolute top-0 right-4 md:right-8">
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