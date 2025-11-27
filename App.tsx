import React, { useState, useEffect } from 'react';
import { AnalysisView } from './components/AnalysisView';
import { GeneratorView } from './components/GeneratorView';
import { ClosingView } from './components/ClosingView';
import { Header } from './components/Header';
import { AnalysisData, GeneratedBetsSet, LotteryDraw } from './types';
import { ChartIcon, SparklesIcon, HistoryIcon, CheckIcon, GridIcon } from './components/icons';
import { HistoryView } from './components/HistoryView';
import { CheckerView } from './components/CheckerView';
import { 
  getDrawsFromStorage, 
  getHistoryFromStorage, 
  getAnalysisFromStorage, 
  saveDrawsToStorage, 
  saveHistoryToStorage, 
  saveAnalysisToStorage,
  clearAllStorage 
} from './services/storageService';

type Tab = 'analysis' | 'generator' | 'closing' | 'history' | 'checker';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [history, setHistory] = useState<GeneratedBetsSet[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Default to dark theme
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    // Load data from storage on mount
    const storedDraws = getDrawsFromStorage();
    const storedHistory = getHistoryFromStorage();
    const storedAnalysis = getAnalysisFromStorage();

    if (storedDraws) setDraws(storedDraws);
    if (storedHistory) setHistory(storedHistory);
    if (storedAnalysis) setAnalysisData(storedAnalysis);
    
    setDataLoaded(true);
  }, []);

  // Save data whenever it changes (only after initial load)
  useEffect(() => {
    if (dataLoaded) {
      saveDrawsToStorage(draws);
    }
  }, [draws, dataLoaded]);

  useEffect(() => {
    if (dataLoaded) {
      saveHistoryToStorage(history);
    }
  }, [history, dataLoaded]);

  useEffect(() => {
    if (dataLoaded && analysisData) {
      saveAnalysisToStorage(analysisData);
    }
  }, [analysisData, dataLoaded]);

  const handleDataAnalyzed = (data: AnalysisData, rawDraws: LotteryDraw[]) => {
    setAnalysisData(data);
    setDraws(rawDraws);
  };

  const addBetsToHistory = (bets: number[][], mode: 'intelligent' | 'random') => {
    const newSet: GeneratedBetsSet = {
      id: `set-${Date.now()}`,
      timestamp: new Date(),
      mode,
      bets,
    };
    setHistory(prevHistory => [newSet, ...prevHistory]);
  };

  const handleClearDatabase = () => {
    if (window.confirm('Tem certeza que deseja limpar todo o banco de dados? Isso apagará os sorteios importados e o histórico de apostas.')) {
      clearAllStorage();
      setDraws([]);
      setHistory([]);
      setAnalysisData(null);
      alert('Banco de dados limpo com sucesso.');
    }
  };

  const TabButton = ({ tab, label, icon }: { tab: Tab; label: string, icon: React.ReactNode }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-full transition-all duration-300 w-full sm:w-auto ${
        activeTab === tab
          ? 'bg-emerald-500 text-white shadow-lg'
          : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="bg-slate-900 text-white min-h-screen font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="bg-slate-800/50 rounded-lg p-2 md:p-4 max-w-7xl mx-auto ring-1 ring-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 bg-slate-900/60 p-2 rounded-lg mb-6 overflow-x-auto">
            <TabButton tab="analysis" label="Análise" icon={<ChartIcon />} />
            <TabButton tab="generator" label="Gerador IA" icon={<SparklesIcon />} />
            <TabButton tab="closing" label="Fechamento" icon={<GridIcon />} />
            <TabButton tab="history" label="Histórico" icon={<HistoryIcon />} />
            <TabButton tab="checker" label="Conferir" icon={<CheckIcon />} />
          </div>
          
          <div className="transition-opacity duration-300 px-2 md:px-4">
            {activeTab === 'analysis' && (
              <AnalysisView 
                onDataAnalyzed={handleDataAnalyzed} 
                onClearData={handleClearDatabase}
                hasData={!!analysisData}
              />
            )}
            {activeTab === 'generator' && <GeneratorView analysisData={analysisData} onBetsGenerated={addBetsToHistory} />}
            {activeTab === 'closing' && <ClosingView analysisData={analysisData} onBetsGenerated={addBetsToHistory} />}
            {activeTab === 'history' && <HistoryView history={history} clearHistory={() => setHistory([])} />}
            {activeTab === 'checker' && <CheckerView history={history} draws={draws} />}
          </div>
        </div>
        <footer className="text-center text-gray-500 text-xs mt-8">
          <p>Este aplicativo usa estatísticas para gerar jogos de forma divertida e educativa. Não há garantia de acertos.</p>
          <p>&copy; 2024 Gerador Mega Inteligente</p>
        </footer>
      </main>
    </div>
  );
}