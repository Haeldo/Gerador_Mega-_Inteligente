
import React, { useState, useEffect, useCallback } from 'react';
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
  saveDrawsToStorage, 
  saveHistoryToStorage, 
  saveAnalysisToStorage,
  clearAllStorage 
} from './services/storageService';
import { analyzeDraws, updateDraws } from './services/lotteryService';

type Tab = 'analysis' | 'generator' | 'closing' | 'history' | 'checker';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('analysis');
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  const [draws, setDraws] = useState<LotteryDraw[]>([]);
  const [history, setHistory] = useState<GeneratedBetsSet[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // 1. Inicialização: Carrega do Banco de Dados Local (LocalStorage)
  useEffect(() => {
    document.documentElement.classList.add('dark');
    
    const storedDraws = getDrawsFromStorage();
    const storedHistory = getHistoryFromStorage();

    if (storedDraws && storedDraws.length > 0) {
      setDraws(storedDraws);
      // Re-analisa para garantir que os dados de IA estejam frescos
      const analysis = analyzeDraws(storedDraws);
      setAnalysisData(analysis);
    }
    
    if (storedHistory) {
      setHistory(storedHistory);
    }
    
    setIsInitialized(true);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  // 2. Persistência Automática: Salva sempre que houver mudanças (apenas após inicializar)
  useEffect(() => {
    if (isInitialized) {
      saveDrawsToStorage(draws);
      if (draws.length > 0) {
        const analysis = analyzeDraws(draws);
        setAnalysisData(analysis);
        saveAnalysisToStorage(analysis);
      } else {
        setAnalysisData(null);
      }
    }
  }, [draws, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      saveHistoryToStorage(history);
    }
  }, [history, isInitialized]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleDataAnalyzed = (data: AnalysisData, rawDraws: LotteryDraw[]) => {
    setDraws(rawDraws);
    setAnalysisData(data);
  };

  const handleManualAdd = (newDraw: LotteryDraw) => {
    if (draws.some(d => d.id === newDraw.id)) {
      alert(`O concurso ${newDraw.id} já existe no banco de dados.`);
      return;
    }
    setDraws(prev => [newDraw, ...prev].sort((a, b) => b.id - a.id));
    alert('Sorteio adicionado e salvo com sucesso!');
  };

  const handleUpdateData = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      const newDraws = await updateDraws(draws);
      if (newDraws.length > 0) {
        setDraws(prev => {
          const combined = [...newDraws, ...prev];
          // Remove duplicates just in case
          const uniqueDraws = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return uniqueDraws.sort((a, b) => b.id - a.id);
        });
        alert(`${newDraws.length} novo(s) sorteio(s) atualizado(s) com sucesso!`);
      } else {
        alert('O banco de dados já está atualizado com o último sorteio da Caixa.');
      }
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Erro ao atualizar os sorteios.');
    } finally {
      setIsUpdating(false);
    }
  };

  const addBetsToHistory = (bets: number[][], mode: 'intelligent' | 'random', totalCost: number = 0) => {
    const newSet: GeneratedBetsSet = {
      id: `set-${Date.now()}`,
      timestamp: new Date(),
      mode,
      bets,
      totalCost
    };
    setHistory(prev => [newSet, ...prev]);
  };

  const handleClearDatabase = useCallback(() => {
    if (window.confirm('ATENÇÃO: Deseja apagar permanentemente todos os sorteios e o histórico de apostas do banco de dados local?')) {
      try {
        // Clear storage keys
        clearAllStorage();
        
        // Reset all relevant states
        setDraws([]);
        setHistory([]);
        setAnalysisData(null);
        setIsUpdating(false);
        
        alert('Banco de dados limpo com sucesso.');
      } catch (error) {
        console.error('Erro ao limpar banco de dados:', error);
        alert('Ocorreu um erro ao tentar limpar o banco de dados.');
      }
    }
  }, []);

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
      <Header onInstall={handleInstallClick} showInstallButton={!!deferredPrompt} />
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
            {!isInitialized ? (
              <div className="flex flex-col items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mb-4"></div>
                <p className="text-gray-400">Acessando banco de dados local...</p>
              </div>
            ) : (
              <>
                {activeTab === 'analysis' && (
                  <AnalysisView 
                    onDataAnalyzed={handleDataAnalyzed} 
                    onClearData={handleClearDatabase}
                    onManualAdd={handleManualAdd}
                    onUpdateData={handleUpdateData}
                    isUpdating={isUpdating}
                    analysisData={analysisData}
                  />
                )}
                {activeTab === 'generator' && <GeneratorView analysisData={analysisData} onBetsGenerated={addBetsToHistory} />}
                {activeTab === 'closing' && <ClosingView analysisData={analysisData} onBetsGenerated={addBetsToHistory} />}
                {activeTab === 'history' && <HistoryView history={history} clearHistory={() => setHistory([])} />}
                {activeTab === 'checker' && <CheckerView history={history} draws={draws} />}
              </>
            )}
          </div>
        </div>
        <footer className="text-center text-gray-500 text-xs mt-8">
          <p>Os dados são armazenados localmente no seu navegador.</p>
          <p>&copy; 2024 Gerador Mega Inteligente</p>
        </footer>
      </main>
    </div>
  );
}
