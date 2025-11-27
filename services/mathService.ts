
/**
 * Gera todas as combinações possíveis de k elementos a partir de um array de números.
 * Utilizado para gerar desdobramentos (fechamentos totais).
 * 
 * @param pool Array de números selecionados (ex: [1, 2, 3, 4, 5, 6, 7])
 * @param k Tamanho do agrupamento (ex: 6 para Mega-Sena)
 */
export const generateCombinations = (pool: number[], k: number): number[][] => {
  const result: number[][] = [];
  
  function backtrack(start: number, currentCombo: number[]) {
    if (currentCombo.length === k) {
      result.push([...currentCombo]);
      return;
    }

    for (let i = start; i < pool.length; i++) {
      currentCombo.push(pool[i]);
      backtrack(i + 1, currentCombo);
      currentCombo.pop();
    }
  }

  backtrack(0, []);
  return result;
};

/**
 * Calcula o fatorial de um número.
 */
export const factorial = (n: number): number => {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
};

/**
 * Calcula o número de combinações (Binomial coefficient) C(n, k).
 * Útil para mostrar ao usuário quantos jogos serão gerados antes de processar.
 */
export const calculateCombinationCount = (n: number, k: number): number => {
  if (k < 0 || k > n) return 0;
  if (k === 0 || k === n) return 1;
  if (k > n / 2) k = n - k;
  
  let res = 1;
  for (let i = 1; i <= k; i++) {
    res = res * (n - i + 1) / i;
  }
  return Math.round(res);
};
