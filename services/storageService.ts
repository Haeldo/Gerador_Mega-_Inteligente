import { LotteryDraw, GeneratedBetsSet, AnalysisData } from '../types';

const KEYS = {
  DRAWS: 'lottery_smart_draws',
  HISTORY: 'lottery_smart_history',
  ANALYSIS: 'lottery_smart_analysis'
};

export const saveDrawsToStorage = (draws: LotteryDraw[]) => {
  try {
    localStorage.setItem(KEYS.DRAWS, JSON.stringify(draws));
  } catch (error) {
    console.error('Erro ao salvar sorteios:', error);
  }
};

export const getDrawsFromStorage = (): LotteryDraw[] | null => {
  try {
    const data = localStorage.getItem(KEYS.DRAWS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const saveHistoryToStorage = (history: GeneratedBetsSet[]) => {
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  } catch (error) {
    console.error('Erro ao salvar histórico:', error);
  }
};

export const getHistoryFromStorage = (): GeneratedBetsSet[] | null => {
  try {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const saveAnalysisToStorage = (data: AnalysisData) => {
  try {
    localStorage.setItem(KEYS.ANALYSIS, JSON.stringify(data));
  } catch (error) {
    console.error('Erro ao salvar análise:', error);
  }
};

export const getAnalysisFromStorage = (): AnalysisData | null => {
  try {
    const data = localStorage.getItem(KEYS.ANALYSIS);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const clearAllStorage = () => {
  localStorage.removeItem(KEYS.DRAWS);
  localStorage.removeItem(KEYS.HISTORY);
  localStorage.removeItem(KEYS.ANALYSIS);
};