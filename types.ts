
export interface LotteryDraw {
  id: number;
  date: string;
  numbers: number[];
}

export interface NumberStat {
  number: number;
  count: number;
  delay: number;
}

export interface AnalysisData {
  stats: NumberStat[];
  totalDraws: number;
  averageFrequency: number;
}

export interface GeneratedBetsSet {
  id: string;
  timestamp: Date;
  mode: 'intelligent' | 'random';
  bets: number[][];
}
