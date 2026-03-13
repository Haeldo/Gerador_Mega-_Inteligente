
import { LotteryDraw, AnalysisData, NumberStat } from '../types';

declare const XLSX: any; // Using XLSX from a CDN script

/**
 * Parses a date from various possible input formats (Date object, string, Excel serial).
 * Handles common string formats like DD/MM/YYYY.
 */
const parseDate = (dateInput: any): Date | null => {
  if (!dateInput) return null;

  // If it's already a valid Date object
  if (dateInput instanceof Date && !isNaN(dateInput.getTime())) {
    return dateInput;
  }

  // Handle Excel Serial Date (numbers around 40000-50000)
  if (typeof dateInput === 'number' && dateInput > 20000) {
     // Excel base date is usually Dec 30 1899
     const date = new Date((dateInput - (25567 + 2)) * 86400 * 1000);
     if (!isNaN(date.getTime())) return date;
  }

  // If it's a string, try to parse it
  if (typeof dateInput === 'string') {
    // Try parsing DD/MM/YYYY or DD-MM-YYYY
    const parts = dateInput.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (parts) {
      // parts[1] = DD, parts[2] = MM, parts[3] = YYYY
      const d = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Fallback for other formats recognized by new Date() (like YYYY-MM-DD)
  const d = new Date(dateInput);
  if (!isNaN(d.getTime())) return d;

  return null;
};

/**
 * Helper to normalize string keys for flexible matching
 * e.g. "Bola 1" -> "bola1", "1ª Dezena" -> "1adezena"
 */
const normalizeKey = (key: string) => key.toLowerCase().replace(/[\s_\W]/g, '');

export const parseExcelFile = (file: File): Promise<LotteryDraw[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Use type: 'array' for better compatibility with ArrayBuffer and encodings
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        // First, convert to array of arrays to find the header row
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        
        let headerRowIndex = 0;
        let foundHeader = false;

        // Scan first 25 rows to find the header containing "Concurso"
        for (let i = 0; i < Math.min(rawData.length, 25); i++) {
            const row = rawData[i] as any[];
            const rowStr = row.map(cell => String(cell).toLowerCase()).join(' ');
            
            // Relaxed check: Look for "concurso" heavily
            if (rowStr.includes('concurso')) {
                headerRowIndex = i;
                foundHeader = true;
                break;
            }
        }

        const json: any[] = XLSX.utils.sheet_to_json(worksheet, { range: headerRowIndex });

        const draws: LotteryDraw[] = [];
        
        for (const row of json) {
            // Create a normalized map of keys for this row
            const normalizedRow: {[key: string]: any} = {};
            Object.keys(row).forEach(key => {
                normalizedRow[normalizeKey(key)] = row[key];
            });

            // Flexible field matching
            const concursoKey = Object.keys(normalizedRow).find(k => k.includes('concurso') || k === 'conc');
            // Match any key that contains 'data' or 'dt'
            const dateKey = Object.keys(normalizedRow).find(k => k.includes('data') || k.includes('dt'));

            const concurso = concursoKey ? normalizedRow[concursoKey] : null;
            const date = dateKey ? parseDate(normalizedRow[dateKey]) : null;

            if (!concurso || !date) continue;

            const numbers: number[] = [];
            
            // Try to find balls 1 through 6
            for (let i = 1; i <= 6; i++) {
                // Heuristic matching for columns like "Bola 1", "Dezena 01", "1ª Dezena", etc.
                const ballKey = Object.keys(normalizedRow).find(k => {
                    // Check strict patterns first
                    if (k === `bola${i}` || k === `bola0${i}`) return true;
                    if (k === `dezena${i}` || k === `dezena0${i}`) return true;
                    if (k === `dez${i}` || k === `dez0${i}`) return true;
                    if (k === `d${i}` || k === `d0${i}`) return true;
                    if (k === `${i}adezena` || k === `${i}ad`) return true;
                    if (k === `n${i}` || k === `num${i}`) return true;
                    return false;
                });

                if (ballKey) {
                    const num = Number(normalizedRow[ballKey]);
                    if (!isNaN(num) && num > 0 && num <= 60) {
                        numbers.push(num);
                    }
                }
            }

            // If we found exactly 6 valid numbers, add to draws
            if (numbers.length >= 6) {
                // Handle duplicate detections if any
                const uniqueNumbers = Array.from(new Set(numbers));
                if (uniqueNumbers.length >= 6) {
                     draws.push({
                        id: Number(concurso),
                        date: date.toLocaleDateString('pt-BR'),
                        numbers: uniqueNumbers.slice(0, 6).sort((a, b) => a - b),
                    });
                }
            }
        }
        
        if (draws.length > 0) {
            // Sort by contest number descending to have most recent draws first
            resolve(draws.sort((a, b) => b.id - a.id));
        } else {
            reject(new Error("Não foi possível identificar as colunas 'Concurso', 'Data' e as 'Dezenas'. Verifique o formato do arquivo."));
        }

      } catch (error) {
        console.error(error);
        reject(new Error('Erro ao ler o arquivo. Certifique-se que é um Excel (.xlsx) ou CSV válido.'));
      }
    };
    
    reader.onerror = (error) => reject(error);
    
    reader.readAsArrayBuffer(file);
  });
};

const fetchWithFallback = async (url: string) => {
  if (!navigator.onLine) {
    throw new Error('Você parece estar offline. Verifique sua conexão com a internet.');
  }

  const proxies = [
    { url: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`, type: 'raw' },
    { url: (u: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(u)}`, type: 'wrapped' },
    { url: (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`, type: 'raw' },
    { url: (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`, type: 'raw' },
    { url: (u: string) => `https://thingproxy.freeboard.io/fetch/${u}`, type: 'raw' },
    { url: (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}&timestamp=${Date.now()}`, type: 'raw' } // Cache busting
  ];

  let lastError = null;
  for (const proxy of proxies) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const response = await fetch(proxy.url(url), { 
        cache: 'no-store',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        const text = await response.text();
        let jsonData;
        
        try {
          // Try direct parse
          jsonData = JSON.parse(text);
          // If it's wrapped by AllOrigins
          if (proxy.type === 'wrapped' && jsonData.contents) {
            jsonData = JSON.parse(jsonData.contents);
          }
        } catch (e) {
          // If direct parse failed, maybe it's wrapped but we didn't mark it as such
          try {
            const wrapped = JSON.parse(text);
            if (wrapped.contents) {
              jsonData = JSON.parse(wrapped.contents);
            } else {
              continue; // Not the data we want
            }
          } catch (e2) {
            continue; // Not JSON at all
          }
        }

        // Validate that it looks like a Caixa response
        if (jsonData && (jsonData.numero || jsonData.listaDezenas)) {
          return jsonData;
        }
      }
    } catch (e) {
      lastError = e;
      console.warn(`Falha no proxy ao acessar ${url}, tentando próximo...`, e);
      // Small delay before next proxy to avoid spamming
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }
  throw lastError || new Error('Não foi possível acessar a API da Caixa através dos proxies disponíveis.');
};

export const updateDraws = async (currentDraws: LotteryDraw[]): Promise<LotteryDraw[]> => {
  try {
    const latestLocalId = currentDraws.length > 0 ? Math.max(...currentDraws.map(d => d.id)) : 0;
    
    // Try Heroku API first for latest
    let latestApiId = 0;
    try {
      const res = await fetch('https://loteriascaixa-api.herokuapp.com/api/megasena/latest');
      if (res.ok) {
        const data = await res.json();
        latestApiId = data.concurso;
      }
    } catch (e) {
      console.warn('Heroku API failed for latest, falling back to Caixa API');
    }

    if (!latestApiId) {
      const apiUrl = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/';
      const latestData = await fetchWithFallback(apiUrl);
      latestApiId = latestData.numero;
    }

    if (!latestApiId || latestApiId <= latestLocalId) {
      return []; 
    }

    const newDraws: LotteryDraw[] = [];
    const drawsToFetch = latestApiId - latestLocalId;
    const maxToFetch = Math.min(drawsToFetch, 15); 

    for (let i = latestLocalId + 1; i <= latestLocalId + maxToFetch; i++) {
      try {
        let data: any = null;
        try {
          const res = await fetch(`https://loteriascaixa-api.herokuapp.com/api/megasena/${i}`);
          if (res.ok) {
            const herokuData = await res.json();
            data = {
              numero: herokuData.concurso,
              dataApuracao: herokuData.data,
              listaDezenas: herokuData.dezenas
            };
          }
        } catch (e) {
          // Fallback
        }

        if (!data) {
          const url = `https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/${i}`;
          data = await fetchWithFallback(url);
        }

        if (data && data.numero && data.listaDezenas) {
          newDraws.push({
            id: data.numero,
            date: data.dataApuracao,
            numbers: data.listaDezenas.map((n: string) => parseInt(n, 10)).sort((a: number, b: number) => a - b)
          });
        }
        await new Promise(resolve => setTimeout(resolve, 300));
      } catch (e) {
        console.warn(`Falha ao buscar concurso ${i}, pulando...`);
      }
    }

    return newDraws.sort((a, b) => b.id - a.id);
  } catch (error) {
    console.error('Erro ao atualizar sorteios:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    throw new Error(`Falha ao buscar novos resultados: ${msg}. Tente novamente em alguns instantes.`);
  }
};

export const fetchDrawDetails = async (drawNumber?: number): Promise<any> => {
  try {
    // Try Heroku API first
    try {
      const url = drawNumber 
        ? `https://loteriascaixa-api.herokuapp.com/api/megasena/${drawNumber}`
        : 'https://loteriascaixa-api.herokuapp.com/api/megasena/latest';
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        // Map to expected format
        return {
          numero: data.concurso,
          dataApuracao: data.data,
          localSorteio: data.local ? data.local.split(' em ')[0] : '',
          nomeMunicipioUFSorteio: data.local && data.local.includes(' em ') ? data.local.split(' em ')[1] : data.local,
          valorAcumuladoPrximoConcurso: data.valorAcumuladoProximoConcurso,
          listaDezenas: data.dezenas,
          listaRateioPremio: data.premiacoes.map((p: any) => ({
            descricaoFaixa: p.descricao,
            numeroDeGanhadores: p.ganhadores,
            valorPremio: p.valorPremio
          }))
        };
      }
    } catch (e) {
      console.warn('Heroku API failed, falling back to Caixa API', e);
    }

    // Fallback to Caixa API
    const apiUrl = 'https://servicebus2.caixa.gov.br/portaldeloterias/api/megasena/';
    const url = drawNumber ? `${apiUrl}${drawNumber}` : apiUrl;
    const data = await fetchWithFallback(url);
    
    // Ensure valorAcumuladoPrximoConcurso is mapped correctly if API returns valorAcumuladoProximoConcurso
    if (data && data.valorAcumuladoProximoConcurso !== undefined && data.valorAcumuladoPrximoConcurso === undefined) {
      data.valorAcumuladoPrximoConcurso = data.valorAcumuladoProximoConcurso;
    }
    
    return data;
  } catch (error) {
    console.error(`Erro ao buscar detalhes do concurso ${drawNumber || 'mais recente'}:`, error);
    throw new Error('Falha ao buscar detalhes do concurso. Tente novamente em alguns instantes.');
  }
};

export const analyzeDraws = (draws: LotteryDraw[]): AnalysisData => {
  const statsMap: Map<number, { count: number; lastSeenIndex: number }> = new Map();

  for (let i = 1; i <= 60; i++) {
    statsMap.set(i, { count: 0, lastSeenIndex: -1 });
  }

  // Assumes draws are sorted from most recent to oldest
  draws.forEach((draw, index) => {
    draw.numbers.forEach(num => {
      const currentStat = statsMap.get(num);
      if (currentStat) {
        currentStat.count++;
        // Set lastSeenIndex only the first time we see the number (since list is sorted)
        if (currentStat.lastSeenIndex === -1) {
          currentStat.lastSeenIndex = index;
        }
      }
    });
  });

  const stats: NumberStat[] = [];
  for (const [number, data] of statsMap.entries()) {
    stats.push({
      number: number,
      count: data.count,
      // Delay is the index, so 0 means it was in the very last draw.
      // If lastSeenIndex is -1 (never seen), delay is totalDraws to show it's maximally delayed.
      delay: data.lastSeenIndex === -1 ? draws.length : data.lastSeenIndex,
    });
  }

  // The total number of balls drawn is totalDraws * 6. The average is this total divided by 60 numbers.
  const averageFrequency = Math.round((draws.length * 6) / 60);

  return {
    stats: stats.sort((a, b) => a.number - b.number),
    totalDraws: draws.length,
    averageFrequency,
  };
};
