// maxAppleOperations.ts

export type OperationType = "1" | "2" | "3" | "4-1" | "4-2";

export interface OperationResult<T extends string> {
  type: OperationType;
  names: T[];
}

export interface Result<T extends string> {
  count: number;
  operations: OperationResult<T>[];
  remaining: Record<T, number>;
}

// 内部用 Result 型（インデックス管理用）
interface OperationInternal {
  type: OperationType;
  k: number;
}

interface ResultInternal {
  count: number;
  operations: OperationInternal[];
  remaining: number[];
}

export function mergeResults<T extends readonly string[]>(
  ...results: { [K in keyof T]: Result<T[K]> }
): Result<T[number]> {
  type U = T[number];
  const merged: Result<U> = {
    count: 0,
    operations: [],
    remaining: {} as Record<U, number>,
  };

  for (const res of results) {
    merged.count += res.count;
    merged.operations.push(
      ...res.operations.map(op => ({ ...op, names: op.names as U[] }))
    );
    for (const key in res.remaining) {
      merged.remaining[key as U] =
        (merged.remaining[key as U] || 0) + res.remaining[key as U];
    }
  }
  return merged;
}

// memo は状態と残り必須操作数をキーにキャッシュする
const memo: Map<string, ResultInternal> = new Map();

/**
 * maxAppleOperations
 *
 * @param appleBoxes 箱のオブジェクト。キーは箱名、値は果物の個数（0～4）。
 *                   appleBoxes は9個以上のキーを持つ可能性があります。
 * @param boxNames   長さ9のタプル。各要素は appleBoxes のキーであり、これらの順番で内部状態配列を構築します。
 * @param requiredOperation3Count 操作3（B[k] -= 2）を正確に実行する必要がある回数 (0～2)
 * @param requiredOperation4Count 操作4系（4-1, 4-2）を正確に実行する必要がある回数 (0～1)
 * @returns 結果。count: 最大操作回数、operations: 各操作の対象箱を箱名で表現したシーケンス、remaining: 箱名をキーにした最終状態
 */
export function maxAppleOperations<T extends string>(
  appleBoxes: Record<T, number>,
  boxNames: readonly T[],
  requiredOperation3Count: number,
  requiredOperation4Count: number
): Result<T> {
  const n = boxNames.length;
  const base = 5; // 各箱の個数は 0～4 なので、状態を5進数の各桁としてエンコード可能
  const power: number[] = new Array(n);
  power[0] = 1;
  for (let i = 1; i < n; i++) {
    power[i] = power[i - 1] * base;
  }

  // boxNames の順番に appleBoxes から値を取り出し、内部状態配列を作成
  const B: number[] = boxNames.map(name => {
    if (!(name in appleBoxes)) {
      throw new Error(`appleBoxes is missing key: ${name}`);
    }
    return appleBoxes[name];
  });

  // 状態配列を一意な整数にエンコードする補助関数
  function encode(state: number[]): number {
    let code = 0;
    for (let i = 0; i < n; i++) {
      code += state[i] * power[i];
    }
    return code;
  }

  /**
   * DFS による探索（内部用）
   *
   * @param state 現在の状態（箱の果物の個数。boxNames の順番に対応）
   * @param remainingOp3 これから使う必要がある操作3の回数
   * @param remainingOp4 これから使う必要がある操作4系の回数
   * @returns 内部結果。操作回数、操作シーケンス（内部はインデックスベース）、最終状態（配列）
   *
   * ※末端状態では remainingOp3 === 0 かつ remainingOp4 === 0 の場合のみ有効（それ以外は count = -Infinity）
   */
  function dfs(state: number[], remainingOp3: number, remainingOp4: number): ResultInternal {
    const key = encode(state) + "_" + remainingOp3 + "_" + remainingOp4;
    if (memo.has(key)) return memo.get(key)!;

    let best: ResultInternal = {
      count: (remainingOp3 === 0 && remainingOp4 === 0) ? 0 : Number.NEGATIVE_INFINITY,
      operations: [],
      remaining: state.slice()
    };

    // 操作1: 0 <= k < 9, state[k] >= 3 の場合、B[k] -= 3
    for (let k = 0; k < n; k++) {
      if (state[k] >= 3) {
        state[k] -= 3;
        const candidate = dfs(state, remainingOp3, remainingOp4);
        if (candidate.count !== Number.NEGATIVE_INFINITY) {
          const operation: OperationInternal = { type: "1", k };
          const candidateWithOp: ResultInternal = {
            count: candidate.count + 1,
            operations: [operation].concat(candidate.operations),
            remaining: candidate.remaining
          };
          if (candidateWithOp.count > best.count) best = candidateWithOp;
        }
        state[k] += 3;
      }
    }

    // 操作2: 0 <= k < 7, state[k], state[k+1], state[k+2] が各々 >= 1 の場合、各々1減らす
    for (let k = 0; k <= n - 3; k++) {
      if (state[k] >= 1 && state[k + 1] >= 1 && state[k + 2] >= 1) {
        state[k]--;
        state[k + 1]--;
        state[k + 2]--;
        const candidate = dfs(state, remainingOp3, remainingOp4);
        if (candidate.count !== Number.NEGATIVE_INFINITY) {
          const operation: OperationInternal = { type: "2", k };
          const candidateWithOp: ResultInternal = {
            count: candidate.count + 1,
            operations: [operation].concat(candidate.operations),
            remaining: candidate.remaining
          };
          if (candidateWithOp.count > best.count) best = candidateWithOp;
        }
        state[k]++;
        state[k + 1]++;
        state[k + 2]++;
      }
    }

    // 操作3: 0 <= k < 9, state[k] >= 2 の場合、B[k] -= 2（操作3は remainingOp3 > 0 のときのみ）
    if (remainingOp3 > 0) {
      for (let k = 0; k < n; k++) {
        if (state[k] >= 2) {
          state[k] -= 2;
          const candidate = dfs(state, remainingOp3 - 1, remainingOp4);
          if (candidate.count !== Number.NEGATIVE_INFINITY) {
            const operation: OperationInternal = { type: "3", k };
            const candidateWithOp: ResultInternal = {
              count: candidate.count + 1,
              operations: [operation].concat(candidate.operations),
              remaining: candidate.remaining
            };
            if (candidateWithOp.count > best.count) best = candidateWithOp;
          }
          state[k] += 2;
        }
      }
    }

    // 操作4 系: remainingOp4 > 0 の場合のみ実施可能
    // 操作4-1: 0 <= k < 8, state[k] >= 1 かつ state[k+1] >= 1
    if (remainingOp4 > 0) {
      for (let k = 0; k < n - 1; k++) {
        if (state[k] >= 1 && state[k + 1] >= 1) {
          state[k]--;
          state[k + 1]--;
          const candidate = dfs(state, remainingOp3, remainingOp4 - 1);
          if (candidate.count !== Number.NEGATIVE_INFINITY) {
            const operation: OperationInternal = { type: "4-1", k };
            const candidateWithOp: ResultInternal = {
              count: candidate.count + 1,
              operations: [operation].concat(candidate.operations),
              remaining: candidate.remaining
            };
            if (candidateWithOp.count > best.count) best = candidateWithOp;
          }
          state[k]++;
          state[k + 1]++;
        }
      }

      // 操作4-2: 0 <= k < 7, state[k] >= 1 かつ state[k+2] >= 1
      for (let k = 0; k <= n - 3; k++) {
        if (state[k] >= 1 && state[k + 2] >= 1) {
          state[k]--;
          state[k + 2]--;
          const candidate = dfs(state, remainingOp3, remainingOp4 - 1);
          if (candidate.count !== Number.NEGATIVE_INFINITY) {
            const operation: OperationInternal = { type: "4-2", k };
            const candidateWithOp: ResultInternal = {
              count: candidate.count + 1,
              operations: [operation].concat(candidate.operations),
              remaining: candidate.remaining
            };
            if (candidateWithOp.count > best.count) best = candidateWithOp;
          }
          state[k]++;
          state[k + 2]++;
        }
      }
    }

    memo.set(key, best);
    return best;
  }

  // DFS を開始（内部状態配列 B のコピーと必須操作の残数を渡す）
  const resultInternal = dfs(B.slice(), requiredOperation3Count, requiredOperation4Count);

  // 内部結果を箱名ベースに変換
  // 各操作は内部的に { type, k } で記録されており、boxNames を用いて箱名に変換します。
  const convertedOperations: OperationResult<T>[] = resultInternal.operations.map(op => {
    let names: T[] = [];
    switch (op.type) {
      case "1":
        // 操作1: 対象は boxNames[op.k] を3回
        names = [boxNames[op.k], boxNames[op.k], boxNames[op.k]];
        return { type: "1", names };
      case "2":
        // 操作2: 対象は boxNames[op.k], boxNames[op.k+1], boxNames[op.k+2]
        names = [boxNames[op.k], boxNames[op.k + 1], boxNames[op.k + 2]];
        return { type: "2", names };
      case "3":
        // 操作3: 対象は boxNames[op.k] を2回
        names = [boxNames[op.k], boxNames[op.k]];
        return { type: "3", names };
      case "4-1":
        // 操作4-1: 対象は boxNames[op.k] と boxNames[op.k+1]
        names = [boxNames[op.k], boxNames[op.k + 1]];
        return { type: "4-1", names };
      case "4-2":
        // 操作4-2: 対象は boxNames[op.k] と boxNames[op.k + 2]
        names = [boxNames[op.k], boxNames[op.k + 2]];
        return { type: "4-2", names };
      default:
        throw new Error("Unknown operation type: " + op.type);
    }
  });

  // 内部の remaining (number[]の形) を、boxNames をキーとしたオブジェクトに変換
  const convertedRemaining = {} as Record<T, number>;
  for (let i = 0; i < n; i++) {
    convertedRemaining[boxNames[i]] = resultInternal.remaining[i];
  }

  return {
    count: resultInternal.count,
    operations: convertedOperations,
    remaining: convertedRemaining
  };
}
