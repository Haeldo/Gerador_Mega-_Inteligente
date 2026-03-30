
export interface LotteryDraw {
  id: number;
  date: string;
  numbers: number[];
}

export interface DrawDetails {
  numero: number;
  dataApuracao: string;
  localSorteio: string;
  nomeMunicipioUFSorteio: string;
  valorAcumuladoPrximoConcurso: number;
  listaDezenas: string[];
  listaRateioPremio: {
    descricaoFaixa: string;
    numeroDeGanhadores: number;
    valorPremio: number;
  }[];
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
  mode: 'intelligent' | 'random' | 'manual';
  bets: number[][];
  totalCost?: number;
}
