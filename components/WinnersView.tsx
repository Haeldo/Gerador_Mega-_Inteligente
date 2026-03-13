import React, { useState, useEffect } from 'react';
import { Search, MapPin, Calendar, Hash, Trophy, DollarSign, AlertCircle, Loader2 } from 'lucide-react';
import { fetchDrawDetails } from '../services/lotteryService';
import { DrawDetails } from '../types';

export const WinnersView: React.FC = () => {
  const [drawNumber, setDrawNumber] = useState<string>('');
  const [details, setDetails] = useState<DrawDetails | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDetails = async (number?: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchDrawDetails(number);
      setDetails(data);
      if (data && data.numero) {
        setDrawNumber(data.numero.toString());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar detalhes.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load the latest draw on mount
  useEffect(() => {
    loadDetails();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseInt(drawNumber, 10);
    if (!isNaN(num) && num > 0) {
      loadDetails(num);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getPrizeInfo = (faixa: number) => {
    if (!details || !details.listaRateioPremio) return null;
    return details.listaRateioPremio.find(r => r.descricaoFaixa.includes(faixa.toString()));
  };

  const sena = getPrizeInfo(6);
  const quina = getPrizeInfo(5);
  const quadra = getPrizeInfo(4);

  return (
    <div className="space-y-6">
      <div className="bg-slate-800 rounded-xl p-6 border border-slate-700 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Trophy className="w-6 h-6 text-emerald-400" />
              Ganhadores e Rateio
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Consulte os detalhes de premiação de qualquer concurso
            </p>
          </div>

          <form onSubmit={handleSearch} className="flex gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Hash className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="number"
                value={drawNumber}
                onChange={(e) => setDrawNumber(e.target.value)}
                placeholder="Nº do Concurso"
                className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-lg leading-5 bg-slate-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={isLoading || !drawNumber}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </form>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3 mb-6">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
        )}

        {isLoading && !details && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
          </div>
        )}

        {details && !isLoading && (
          <div className="space-y-6">
            {/* Drawn Numbers */}
            {details.listaDezenas && details.listaDezenas.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/50">
                {details.listaDezenas.map((num, idx) => (
                  <div 
                    key={idx}
                    className="w-12 h-12 rounded-full bg-emerald-500 text-white flex items-center justify-center text-lg font-bold shadow-lg shadow-emerald-500/20 border-2 border-emerald-400"
                  >
                    {num}
                  </div>
                ))}
              </div>
            )}

            {/* Header Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Hash className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Concurso</p>
                  <p className="text-lg font-bold text-white">{details.numero}</p>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <Calendar className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Data do Sorteio</p>
                  <p className="text-lg font-bold text-white">{details.dataApuracao}</p>
                </div>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/50 flex items-center gap-3">
                <div className="p-2 bg-slate-800 rounded-lg">
                  <MapPin className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wider">Local</p>
                  <p className="text-sm font-medium text-white line-clamp-2">
                    {details.localSorteio} {details.nomeMunicipioUFSorteio ? `- ${details.nomeMunicipioUFSorteio}` : ''}
                  </p>
                </div>
              </div>
            </div>

            {/* Accumulated */}
            {details.valorAcumuladoPrximoConcurso > 0 && (
              <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900/40 rounded-lg p-5 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-sm text-emerald-400 font-semibold uppercase tracking-wider mb-1">Acumulado para o próximo concurso</p>
                  <p className="text-2xl font-bold text-white">{formatCurrency(details.valorAcumuladoPrximoConcurso)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-emerald-500/50" />
              </div>
            )}

            {/* Prizes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Sena */}
              <div className="bg-slate-900 rounded-lg p-5 border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-sm">6</span>
                  Acertos (Sena)
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Ganhadores</p>
                    <p className="text-xl font-bold text-emerald-400">{sena?.numeroDeGanhadores || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Prêmio</p>
                    <p className="text-lg font-semibold text-white">{formatCurrency(sena?.valorPremio || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Quina */}
              <div className="bg-slate-900 rounded-lg p-5 border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-sm">5</span>
                  Acertos (Quina)
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Ganhadores</p>
                    <p className="text-xl font-bold text-blue-400">{quina?.numeroDeGanhadores || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Prêmio</p>
                    <p className="text-lg font-semibold text-white">{formatCurrency(quina?.valorPremio || 0)}</p>
                  </div>
                </div>
              </div>

              {/* Quadra */}
              <div className="bg-slate-900 rounded-lg p-5 border border-slate-700 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 bg-purple-500/10 rounded-bl-full -mr-8 -mt-8"></div>
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-sm">4</span>
                  Acertos (Quadra)
                </h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Ganhadores</p>
                    <p className="text-xl font-bold text-purple-400">{quadra?.numeroDeGanhadores || 0}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400 uppercase">Prêmio</p>
                    <p className="text-lg font-semibold text-white">{formatCurrency(quadra?.valorPremio || 0)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
