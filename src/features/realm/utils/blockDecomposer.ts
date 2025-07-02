import { SOZU_RECORD_0, SOZU_TILES, Block, BlockType, DecomposedResult, DecomposerTileSetId } from '@shared/types/simulation';

// 内部では牌の種類を区別せず、整数で牌を管理する。
// 整数で管理することで、牌の種類に依らず共通の牌姿になった際に共通のmemoを使うことができる。

/**
 * 内部処理用ブロック
 */
interface BlockInternal {
  type: BlockType;
  left: number;
}

/**
 * 内部処理用分解結果
 */
export interface ResultInternal {
  count: number;
  blocks: BlockInternal[];
  remaining: number[];
  nonRealmWins: number[];
}

/**
 * 牌プール内の指定した牌をブロック分解する関数
 * @param memo 牌姿と残り必須ブロック数をキーとして分解結果をメモ化（キャッシュ）するオブジェクト
 * @param pool 牌プール
 * @param tileSetId 対象の牌の識別子
 * @param tiles 対象の牌
 * @param requiredToitsuCount 必要な対子の数（超過も不可）
 * @param requiredTaatsuCount 必要な塔子の数（超過も不可）
 * @param allowKotsuAsToitsu 刻子を対子扱いできるケースを許可するか
 * @param isSequential 対象の牌が連続している（索子や筒子）かどうか
 * @param nonRealmWinsEachSozu 各牌の非領域の和了回数
 * @returns 分解結果
 */
export function decomposeTilesIntoBlocks<T extends string>(
  memo: Map<number, ResultInternal>,
  pool: Record<T, number>,
  tileSetId: DecomposerTileSetId,
  tiles: readonly T[],
  requiredToitsuCount: number,
  requiredTaatsuCount: number,
  allowKotsuAsToitsu: boolean,
  isSequential: boolean,
  nonRealmWinsEachSozu?: Record<T, number>,
): DecomposedResult<T> {
  const n = tiles.length;

  // メモ化用の指数計算
  // 牌姿を5進数としてエンコードするために使用する
  const base = 5;
  const power: number[] = new Array(n);
  power[0] = 1;
  for (let i = 1; i < n; i++) {
    power[i] = power[i - 1] * base;
  }

  // int型牌姿（対象の牌の数をint配列化したもの）
  const initialTileCounts: number[] = tiles.map(tile => pool[tile]);

  // int型非領域牌の和了回数
  const nonRealmWins: number[] = tiles.map(tile => nonRealmWinsEachSozu ? nonRealmWinsEachSozu[tile] : 0);

  // int型牌姿を一意な整数にエンコードする関数
  function encode(tileCounts: number[]): number {
    let code = 0;
    for (let i = 0; i < n; i++) {
      code += tileCounts[i] * power[i];
    }
    return code;
  }

  /**
   * DFSによるブロック分解
   * @param tileCounts int型牌姿
   * @param requiredToitsuCount 必要な対子の数（超過も不可）
   * @param requiredTaatsuCount 必要な塔子の数（超過も不可）
   * @returns int型管理の分解結果
   * 必要なブロックを確保出来なかった場合 分解結果.count = -Infinity
   */
  function dfs(tileCounts: number[], requiredToitsuCount: number, requiredTaatsuCount: number): ResultInternal {
    const key = tileSetId + (allowKotsuAsToitsu ? 1 : 0) * 10 + requiredTaatsuCount * 100 + requiredToitsuCount * 1000 + encode(tileCounts) * 10000;
    if (memo.has(key)) return memo.get(key)!;

    let best: ResultInternal = {
      count: (requiredToitsuCount === 0 && requiredTaatsuCount === 0) ? 0 : Number.NEGATIVE_INFINITY,
      blocks: [],
      remaining: tileCounts.slice(),
      nonRealmWins: nonRealmWins.slice().fill(0),
    };

    /**
     * 刻子を対子扱いできるかどうか判定する
     * ※他色対子とのシャンポン待ちを除外するため
     * @param result int型管理の分解結果
     * @returns 刻子を対子扱いできるかどうか
     */
    function canUseKotsuAsToitsu(result: ResultInternal): boolean {
      // 刻子の牌で待つ塔子が存在する場合、順子 + 対子と扱うことができる

      // （他色対子 + ）刻子 + 両面（例：22234s、22234567s）
      const ryanmen = result.blocks.find(block => block.type === 'ryanmen');
      // （他色対子 + ）刻子 + 嵌張（例：23334s）
      const kanchan = result.blocks.find(block => block.type === 'kanchan');
      // （他色対子 + ）刻子 + 辺張（例：12333s）
      const penchan = result.blocks.find(block => block.type === 'penchan');

      if (!ryanmen && !kanchan && !penchan) return false;

      const waits: number[] = [];

      if (ryanmen) {
        const left = ryanmen.left;
        const right = ryanmen.left + 1;
        waits.push(left - 1);
        waits.push(right + 1);

        const lowShuntsuLeft = left - 3;
        const highShuntsuLeft = right + 1;
        const highShuntsuRight = right + 3;
        if (lowShuntsuLeft > 0) {
          if (result.blocks.some(block => block.type === 'shuntsu' && block.left === lowShuntsuLeft)) {
            // 左に三面張
            waits.push(lowShuntsuLeft - 1);
          }
        }
        if (highShuntsuRight < n - 1) {
          if (result.blocks.some(block => block.type === 'shuntsu' && block.left === highShuntsuLeft)) {
            // 右に三面張
            waits.push(highShuntsuRight + 1);
          }
        }
      }
      if (kanchan) {
        waits.push(kanchan.left + 1);
      }
      if (penchan) {
        if (penchan.left === 0) {
          waits.push(penchan.left + 2);
        } else {
          waits.push(penchan.left - 1);
        }
      }

      // 刻子の牌で待っている === 対子 + 順子と読み替えることができる
      const waitingKotsuTile = waits.some(wait => result.blocks.some(block => block.type === 'kotsu' && block.left === wait));

      return waitingKotsuTile;
    }

    /**
     * 非領域牌の和了回数を設定する
     * @param result int型管理の分解結果
     */
    function setNonRealmWins(result: ResultInternal) {
      const ryanmen = result.blocks.find(block => block.type === 'ryanmen');
      const kanchan = result.blocks.find(block => block.type === 'kanchan');
      const penchan = result.blocks.find(block => block.type === 'penchan');

      if (!ryanmen && !kanchan && !penchan) return;

      if (ryanmen) {
        const left = ryanmen.left;
        const right = ryanmen.left + 1;
        result.nonRealmWins[left - 1] = nonRealmWins[left - 1];
        result.nonRealmWins[right + 1] = nonRealmWins[right + 1];

        const lowShuntsuLeft = left - 3;
        const highShuntsuLeft = right + 1;
        const highShuntsuRight = right + 3;
        if (lowShuntsuLeft > 0) {
          if (result.blocks.some(block => block.type === 'shuntsu' && block.left === lowShuntsuLeft)) {
            // 左に三面張
            result.nonRealmWins[lowShuntsuLeft - 1] = nonRealmWins[lowShuntsuLeft - 1];
          }
        }
        if (highShuntsuRight < n - 1) {
          if (result.blocks.some(block => block.type === 'shuntsu' && block.left === highShuntsuLeft)) {
            // 右に三面張
            result.nonRealmWins[highShuntsuRight + 1] = nonRealmWins[highShuntsuRight + 1];
          }
        }
      }
      if (kanchan) {
        result.nonRealmWins[kanchan.left + 1] = nonRealmWins[kanchan.left + 1];
      }
      if (penchan) {
        if (penchan.left === 0) {
          result.nonRealmWins[penchan.left + 2] = nonRealmWins[penchan.left + 2];
        } else {
          result.nonRealmWins[penchan.left - 1] = nonRealmWins[penchan.left - 1];
        }
      }
    }

    // 刻子
    for (let left = 0; left < n; left++) {
      if (tileCounts[left] >= 3) {
        tileCounts[left] -= 3;
        const candidate = dfs(tileCounts, requiredToitsuCount, requiredTaatsuCount);
        if (candidate.count !== Number.NEGATIVE_INFINITY) {
          const block: BlockInternal = { type: 'kotsu', left };
          const candidateWithBlock: ResultInternal = {
            count: candidate.count + 1,
            blocks: [block].concat(candidate.blocks),
            remaining: candidate.remaining.slice(),
            nonRealmWins: candidate.nonRealmWins.slice(),
          };
          setNonRealmWins(candidateWithBlock);
          if (allowKotsuAsToitsu || !canUseKotsuAsToitsu(candidateWithBlock)) {
            const candidateTotalWins = candidateWithBlock.nonRealmWins.reduce((sum, wins) => sum + wins, 0);
            const bestTotalWins = best.nonRealmWins.reduce((sum, wins) => sum + wins, 0);
            if (
              candidateWithBlock.count > best.count
              || (candidateWithBlock.count === best.count && candidateTotalWins > bestTotalWins)
            ) best = candidateWithBlock;
          }
        }
        tileCounts[left] += 3;
      }
    }

    // 順子
    for (let left = 0; left <= n - 3; left++) {
      if (!isSequential) break;
      if (tileCounts[left] >= 1 && tileCounts[left + 1] >= 1 && tileCounts[left + 2] >= 1) {
        tileCounts[left]--;
        tileCounts[left + 1]--;
        tileCounts[left + 2]--;
        const candidate = dfs(tileCounts, requiredToitsuCount, requiredTaatsuCount);
        if (candidate.count !== Number.NEGATIVE_INFINITY) {
          const block: BlockInternal = { type: 'shuntsu', left };
          const candidateWithBlock: ResultInternal = {
            count: candidate.count + 1,
            blocks: [block].concat(candidate.blocks),
            remaining: candidate.remaining.slice(),
            nonRealmWins: candidate.nonRealmWins.slice(),
          };
          setNonRealmWins(candidateWithBlock);
          if (allowKotsuAsToitsu || !canUseKotsuAsToitsu(candidateWithBlock)) {
            const candidateTotalWins = candidateWithBlock.nonRealmWins.reduce((sum, wins) => sum + wins, 0);
            const bestTotalWins = best.nonRealmWins.reduce((sum, wins) => sum + wins, 0);
            if (
              candidateWithBlock.count > best.count
              || (candidateWithBlock.count === best.count && candidateTotalWins > bestTotalWins)
            ) best = candidateWithBlock;
          }
        }
        tileCounts[left]++;
        tileCounts[left + 1]++;
        tileCounts[left + 2]++;
      }
    }

    // 対子
    if (requiredToitsuCount > 0) {
      for (let left = 0; left < n; left++) {
        if (tileCounts[left] >= 2) {
          tileCounts[left] -= 2;
          const candidate = dfs(tileCounts, requiredToitsuCount - 1, requiredTaatsuCount);
          if (candidate.count !== Number.NEGATIVE_INFINITY) {
            const block: BlockInternal = { type: 'toitsu', left };
            const candidateWithBlock: ResultInternal = {
              count: candidate.count + 1,
              blocks: [block].concat(candidate.blocks),
              remaining: candidate.remaining.slice(),
              nonRealmWins: candidate.nonRealmWins.slice(),
            };
            setNonRealmWins(candidateWithBlock);
            if (allowKotsuAsToitsu || !canUseKotsuAsToitsu(candidateWithBlock)) {
              const candidateTotalWins = candidateWithBlock.nonRealmWins.reduce((sum, wins) => sum + wins, 0);
              const bestTotalWins = best.nonRealmWins.reduce((sum, wins) => sum + wins, 0);
              if (
                candidateWithBlock.count > best.count
                || (candidateWithBlock.count === best.count && candidateTotalWins > bestTotalWins)
              ) best = candidateWithBlock;
            }
          }
          tileCounts[left] += 2;
        }
      }
    }

    // 両面・辺張
    if (requiredTaatsuCount > 0) {
      for (let left = 0; left < n - 1; left++) {
        if (!isSequential) break;
        if (tileCounts[left] >= 1 && tileCounts[left + 1] >= 1) {
          tileCounts[left]--;
          tileCounts[left + 1]--;
          const candidate = dfs(tileCounts, requiredToitsuCount, requiredTaatsuCount - 1);
          if (candidate.count !== Number.NEGATIVE_INFINITY) {
            const blockType: BlockType = (left === 0 || left + 1 === (n - 1)) ? 'penchan' : 'ryanmen';
            const block: BlockInternal = { type: blockType, left };
            const candidateWithBlock: ResultInternal = {
              count: candidate.count + 1,
              blocks: [block].concat(candidate.blocks),
              remaining: candidate.remaining.slice(),
              nonRealmWins: candidate.nonRealmWins.slice(),
            };
            setNonRealmWins(candidateWithBlock);
            if (allowKotsuAsToitsu || !canUseKotsuAsToitsu(candidateWithBlock)) {
              const candidateTotalWins = candidateWithBlock.nonRealmWins.reduce((sum, wins) => sum + wins, 0);
              const bestTotalWins = best.nonRealmWins.reduce((sum, wins) => sum + wins, 0);
              if (
                candidateWithBlock.count > best.count
                || (candidateWithBlock.count === best.count && candidateTotalWins > bestTotalWins)
              ) best = candidateWithBlock;
            }
          }
          tileCounts[left]++;
          tileCounts[left + 1]++;
        }
      }

      // 嵌張
      for (let left = 0; left <= n - 3; left++) {
        if (!isSequential) break;
        if (tileCounts[left] >= 1 && tileCounts[left + 2] >= 1) {
          tileCounts[left]--;
          tileCounts[left + 2]--;
          const candidate = dfs(tileCounts, requiredToitsuCount, requiredTaatsuCount - 1);
          if (candidate.count !== Number.NEGATIVE_INFINITY) {
            const block: BlockInternal = { type: 'kanchan', left: left };
            const candidateWithBlock: ResultInternal = {
              count: candidate.count + 1,
              blocks: [block].concat(candidate.blocks),
              remaining: candidate.remaining.slice(),
              nonRealmWins: candidate.nonRealmWins.slice(),
            };
            setNonRealmWins(candidateWithBlock);
            if (allowKotsuAsToitsu || !canUseKotsuAsToitsu(candidateWithBlock)) {
              const candidateTotalWins = candidateWithBlock.nonRealmWins.reduce((sum, wins) => sum + wins, 0);
              const bestTotalWins = best.nonRealmWins.reduce((sum, wins) => sum + wins, 0);
              if (
                candidateWithBlock.count > best.count
                || (candidateWithBlock.count === best.count && candidateTotalWins > bestTotalWins)
              ) best = candidateWithBlock;
            }
          }
          tileCounts[left]++;
          tileCounts[left + 2]++;
        }
      }
    }

    memo.set(key, best);
    return best;
  }

  // DFS
  const resultInternal = dfs(initialTileCounts.slice(), requiredToitsuCount, requiredTaatsuCount);

  // int型管理の分解結果を、牌名ベースに変換
  const convertedBlocks: Block<T>[] = resultInternal.blocks.map(block => {
    switch (block.type) {
      case 'kotsu':
        return { type: block.type, tiles: [tiles[block.left], tiles[block.left], tiles[block.left]] };
      case 'shuntsu':
        return { type: block.type, tiles: [tiles[block.left], tiles[block.left + 1], tiles[block.left + 2]] };
      case 'toitsu':
        return { type: block.type, tiles: [tiles[block.left], tiles[block.left]] };
      case 'ryanmen':
      case 'penchan':
        return { type: block.type, tiles: [tiles[block.left], tiles[block.left + 1]] };
      case 'kanchan':
        return { type: block.type, tiles: [tiles[block.left], tiles[block.left + 2]] };
      default:
        throw new Error('Unknown block type: ' + block.type);
    }
  });

  // int型管理の残り牌を牌名に変換
  const convertedRemaining = {} as Record<T, number>;
  for (let i = 0; i < n; ++i) {
    convertedRemaining[tiles[i]] = resultInternal.remaining[i];
  }

  // int型管理の非領域牌の和了回数を牌名に変換
  const convertedNonRealmWins = { ...SOZU_RECORD_0 };
  if (nonRealmWinsEachSozu) {
    for (let i = 0; i < n; ++i) {
      convertedNonRealmWins[SOZU_TILES[i]] = resultInternal.nonRealmWins[i];
    }
  }

  return {
    count: resultInternal.count,
    blocks: convertedBlocks,
    remaining: convertedRemaining,
    nonRealmWinsEachTiles: convertedNonRealmWins,
  };
}
