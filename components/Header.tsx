
import React from 'react';

export const Header: React.FC = () => {
  return (
    <header className="py-8">
      <div className="container mx-auto px-4 md:px-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold text-white">
          Gerador Mega Inteligente
        </h1>
        <p className="text-md text-gray-400 mt-2">
          Análise estatística e geração inteligente de apostas para Mega-Sena
        </p>
      </div>
    </header>
  );
};
