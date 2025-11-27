
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
