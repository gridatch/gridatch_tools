import { MultisetPermutation } from "@shared/types/simulation";

/** nPk を計算する */
function perm(n: number, k: number): number {
  if (k < 0 || k > n) return 0;
  let r = 1;
  for (let i = 0; i < k; i++) {
    r *= (n - i);
  }
  return r;
}

/**
 * 各要素の残り枚数を考慮して重複順列オブジェクトを列挙する
 *
 * @template T 要素の型
 * @param domainCountsOrig 各要素の残り枚数
 * @param pickCount 取り出す要素数
 * @returns 重複順列オブジェクトの配列
 */
export function enumerateMultisetPermutations<
  T extends string
>(
  domainCountsOrig: Readonly<Record<T, number>>,
  pickCount: number
): MultisetPermutation<T>[] {
  const domain = Object.keys(domainCountsOrig) as T[];
  const domainCounts: Record<T, number> = { ...domainCountsOrig };
  const totalDomain = domain.reduce((acc, t) => acc + domainCountsOrig[t], 0)
  const T_RECORD_0 = Object.freeze(Object.fromEntries(domain.map(t => [t, 0])) as Record<T, number>);

  const permutation: T[] = [];
  const waysDenominator = perm(totalDomain, pickCount);
  
  const result: MultisetPermutation<T>[] = [];

  const backtrack = () => {
    if (permutation.length === pickCount) {
      // 一つの重複順列に含まれる各要素の頻度
      const freq: Record<T, number> = { ...T_RECORD_0 };
      permutation.forEach(t => ++freq[t]);

      // 一つの重複順列の通り数（同一要素を区別したときに何通りあるか）
      let waysNumerator = 1;
      for (const t of domain) {
        if (freq[t] > 0) waysNumerator *= perm(domainCountsOrig[t], freq[t]);
      }
      const probability = waysNumerator / waysDenominator;

      result.push({ tiles: [...permutation], probability });
      return;
    }

    // 各要素の残り枚数を考慮して重複順列を列挙
    for (const t of domain) {
      if (domainCounts[t] > 0) {
        // 重複順列に含める際に要素数を減らし、バックトラック時に要素数を戻す。
        --domainCounts[t];
        permutation.push(t);

        backtrack();

        permutation.pop();
        ++domainCounts[t];
      }
    }
  };

  backtrack();
  return result;
}