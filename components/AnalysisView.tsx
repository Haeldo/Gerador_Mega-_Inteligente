import React, { useState, useMemo, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { parseExcelFile, analyzeDraws } from '../services/lotteryService';
import { AnalysisData, LotteryDraw } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import { TrendingUpIcon, ClockIcon, ClipboardIcon, BarChartIcon2, FileDocumentIcon, DataDistributionIcon, DatabaseIcon, TrashIcon } from './icons';
import { getAnalysisFromStorage } from '../services/storageService';

interface AnalysisViewProps {
  onDataAnalyzed: (data: AnalysisData, draws: LotteryDraw[]) => void;
  onClearData: () => void;
  hasData: boolean;
}

const StatCard: React.FC<{ title: string; value: string; subtitle: string; icon: React.ReactNode; colorClass: string }> = ({ title, value, subtitle, icon, colorClass }) => (
  <div className={`bg-slate-800 p-6 rounded-lg ring-1 ring-white/10 flex items-start gap-4 ${colorClass}`}>
    <div className="bg-slate-900 p-3 rounded-lg">{icon}</div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  </div>
);

const ChartContainer: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
  <div className="bg-slate-800 p-6 rounded-lg ring-1 ring-white/10">
    <div className="flex items-center gap-2 mb-4">
      {icon}
      <h3 className="font-semibold text-white">{title}</h3>
    </div>
    <div className="h-72">
      {children}
    </div>
  </div>
);

export const AnalysisView: React.FC<AnalysisViewProps> = ({ onDataAnalyzed, onClearData, hasData }) => {
  return <AnalysisViewWithDataFetch onDataAnalyzed={onDataAnalyzed} onClearData={onClearData} />;
};

const AnalysisViewWithDataFetch: React.FC<Omit<AnalysisViewProps, 'hasData'>> = ({ onDataAnalyzed, onClearData }) => {
    const [localData, setLocalData] = useState<AnalysisData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync with storage on mount
    React.useEffect(() => {
        const stored = getAnalysisFromStorage();
        if (stored) setLocalData(stored);
    }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;
        setIsLoading(true);
        setError(null);
        try {
          const draws = await parseExcelFile(file);
          const data = analyzeDraws(draws);
          setLocalData(data);
          onDataAnalyzed(data, draws);
        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Falha ao processar o arquivo.');
          }
          console.error(err);
        } finally {
          setIsLoading(false);
        }
    }, [onDataAnalyzed]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'text/csv': ['.csv'],
        },
        multiple: false
    });

    // Helper for clearing
    const handleClear = () => {
        onClearData();
        setLocalData(null);
    };

    const analysisData = localData;

    const mostFrequent = useMemo(() => {
        if (!analysisData) return { number: 0, count: 0, percentage: '0%' };
        const sorted = [...analysisData.stats].sort((a, b) => b.count - a.count);
        const top = sorted[0];
        const percentage = ((top.count / analysisData.totalDraws) * 100).toFixed(1) + '%';
        return { number: top.number, count: top.count, percentage };
    }, [analysisData]);

    const mostDelayed = useMemo(() => {
        if (!analysisData) return { number: 0, delay: 0 };
        const sorted = [...analysisData.stats].sort((a, b) => b.delay - a.delay);
        return sorted[0];
    }, [analysisData]);

    const top10Frequent = useMemo(() => {
        if (!analysisData) return [];
        return [...analysisData.stats].sort((a, b) => b.count - a.count).slice(0, 10);
    }, [analysisData]);
      
    const top10Delayed = useMemo(() => {
        if (!analysisData) return [];
        return [...analysisData.stats].sort((a, b) => b.delay - a.delay).slice(0, 10);
    }, [analysisData]);

    const frequencyDistribution = useMemo(() => {
        if (!analysisData) return [];
        return [...analysisData.stats].sort((a, b) => b.count - a.count);
    }, [analysisData]);

    if (!analysisData || error) {
        return (
          <div className="space-y-6">
             {error && <div className="text-center p-4 bg-red-900/50 text-red-300 rounded-lg">{error}</div>}
             <div className="bg-slate-800 p-6 rounded-lg ring-1 ring-white/10">
                <h3 className="font-semibold text-white text-center mb-2">
                    {localData ? "Dados Carregados" : "Importar Resultados"}
                </h3>
                <p className="text-gray-400 text-sm text-center mb-6">Importe o arquivo Excel/CSV para gerar as estatísticas</p>
                <div {...getRootProps()} className={`cursor-pointer p-10 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-colors ${isDragActive ? 'border-emerald-500 bg-emerald-900/30' : 'border-gray-600 hover:border-gray-500'}`}>
                    <input {...getInputProps()} />
                    <FileDocumentIcon className="w-12 h-12 text-gray-500 mb-4"/>
                    <p className="font-semibold text-white">Toque para selecionar arquivo</p>
                    <p className="text-sm text-gray-400">Arraste e solte ou clique para fazer o upload</p>
                     {isLoading && <p className="mt-4 text-emerald-400">Processando...</p>}
                </div>
                 <button {...getRootProps()} className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2">
                     <FileDocumentIcon className="w-5 h-5"/> Selecionar Arquivo
                </button>
            </div>
          </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg border-l-4 border-emerald-500">
                <div className="flex items-center gap-3">
                    <DatabaseIcon className="w-6 h-6 text-emerald-400" />
                    <div>
                        <h3 className="font-bold text-white">Banco de Dados Ativo</h3>
                        <p className="text-xs text-gray-400">Resultados importados e salvos localmente.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                     <button {...getRootProps()} className="text-xs bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-md transition-colors flex items-center gap-2">
                        <FileDocumentIcon className="w-3 h-3"/> Atualizar Arquivo
                        <input {...getInputProps()} />
                     </button>
                    <button onClick={handleClear} className="text-xs bg-red-900/80 hover:bg-red-800 text-white px-3 py-2 rounded-md transition-colors flex items-center gap-2">
                        <TrashIcon className="w-3 h-3"/> Limpar Banco de Dados
                    </button>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total de Sorteios" value={analysisData.totalDraws.toString()} subtitle="Concursos analisados" icon={<ClipboardIcon/>} colorClass="border-l-4 border-teal-500" />
                <StatCard title="Mais Frequente" value={`${mostFrequent.number} (${mostFrequent.count}x)`} subtitle={`${mostFrequent.percentage} dos sorteios`} icon={<TrendingUpIcon/>} colorClass="border-l-4 border-emerald-500" />
                <StatCard title="Maior Atraso" value={`${mostDelayed.number} (${mostDelayed.delay})`} subtitle={`Não sai há ${mostDelayed.delay} sorteios`} icon={<ClockIcon/>} colorClass="border-l-4 border-amber-500" />
                <StatCard title="Média de Frequência" value={analysisData.averageFrequency.toLocaleString('pt-BR')} subtitle="Aparições por número" icon={<BarChartIcon2/>} colorClass="border-l-4 border-fuchsia-500" />
            </div>
            
            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <ChartContainer title="Dezenas Mais Frequentes" icon={<TrendingUpIcon className="text-emerald-400"/>}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={top10Frequent} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" strokeOpacity={0.5} />
                            <XAxis dataKey="number" stroke="#94A3B8" fontSize={12} />
                            <YAxis stroke="#94A3B8" fontSize={12} />
                            <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#CBD5E1' }} />
                            <Bar dataKey="count" name="Frequência">
                                {top10Frequent.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="#10B981" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </ChartContainer>
    
                 <ChartContainer title="Maiores Atrasos" icon={<ClockIcon className="text-amber-400"/>}>
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={top10Delayed} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#475569" strokeOpacity={0.5} />
                            <XAxis dataKey="number" stroke="#94A3B8" fontSize={12} />
                            <YAxis stroke="#94A3B8" fontSize={12} />
                            <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#CBD5E1' }} />
                            <Bar dataKey="delay" name="Atraso">
                                 {top10Delayed.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill="#F59E0B" />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                 </ChartContainer>
            </div>
            
            <ChartContainer title="Distribuição de Frequências" icon={<DataDistributionIcon className="text-teal-400"/>}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={frequencyDistribution} margin={{ top: 5, right: 20, left: -10, bottom: 20 }}>
                         <CartesianGrid strokeDasharray="3 3" stroke="#475569" strokeOpacity={0.5} />
                         <XAxis dataKey="number" stroke="#94A3B8" fontSize={10} angle={-45} textAnchor="end" height={50} interval={0} />
                         <YAxis stroke="#94A3B8" fontSize={12} />
                         <Tooltip cursor={{fill: '#334155'}} contentStyle={{ backgroundColor: '#1E293B', border: '1px solid #475569', color: '#CBD5E1' }} />
                         <Line type="monotone" dataKey="count" name="Frequência" stroke="#10B981" strokeWidth={2} dot={{ r: 2, fill: '#10B981' }} />
                    </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
        </div>
    );
};