import { ProcessingState } from '@shared/processing/context/ProcessingContext';
import { RealmBoss, SanmaTile, SANMA_TILES, SANMA_MANZU_TILES, PINZU_TILES, SOZU_TILES, isSanmaManzuTile, isPinzuTile, isSozuTile, isWindTile, WIND_TILES, isDragonTile, DRAGON_TILES, WallTile, SANMA_TILE_RECORD_FALSE, Hand, SANMA_TILE_RECORD_0, RealmTenpaiResult, MENTSU_TYPES, SANMA_TILE_RECORD_NUMBER_ARRAY, Sozu, RealmTenpai, NON_SEQUENTIAL_TILES, DECOMPOSER_TILE_SET_IDS, SANMA_TILE_RECORD_MINUS_1, RealmSimulationProgress, RealmPhaseAction, SanmaTileOrNonRealm, SANMA_TILES_OR_NON_REALM_RECORD_0, RealmPhase, isSanmaTile, EMPTY_REALM_TENPAI, DecomposedResult } from '@shared/types/simulation';
import { enumerateMultisetPermutations } from '@shared/utils/combinatorics';
import { IndexedTree } from '@shared/utils/indexedTree';

import { WinsLogic } from '../hooks/useWinsLogic';

import { decomposeTilesIntoBlocks, ResultInternal } from './blockDecomposer';

/**
 * 全ての牌について領域牌かどうかを判定する
 * @param boss ボス（ステージ効果）
 * @param doraIndicators ドラ表示牌
 * @returns 各牌が領域牌かどうか
 */
export const calcIsRealmEachTile = (boss: RealmBoss, doraIndicators: SanmaTile[]): Record<SanmaTile, boolean> => {
  const isRealmEachTile = { ...SANMA_TILE_RECORD_FALSE };
  if (boss === 'empty') return isRealmEachTile;

  const markRealmTileForGroup = <T extends SanmaTile>(
    doraIndicator: SanmaTile,
    predicate: (tile: SanmaTile) => tile is T,
    tiles: readonly T[],
    tBoss?: RealmBoss,
  ) => {
    if (!predicate(doraIndicator)) return;
    if (tBoss && boss === tBoss) return;
    isRealmEachTile[doraIndicator] = true;
    const tile = doraIndicator as T;
    const index = tiles.indexOf(tile);
    const nextIndex = (index + 1) % tiles.length;
    isRealmEachTile[tiles[nextIndex]] = true;
  };

  doraIndicators.forEach(doraIndicator => {
    markRealmTileForGroup(doraIndicator, isSanmaManzuTile, SANMA_MANZU_TILES, 'dora_manzu');
    markRealmTileForGroup(doraIndicator, isPinzuTile, PINZU_TILES, 'dora_pinzu');
    markRealmTileForGroup(doraIndicator, isSozuTile, SOZU_TILES, 'dora_sozu');
    markRealmTileForGroup(doraIndicator, isWindTile, WIND_TILES);
    markRealmTileForGroup(doraIndicator, isDragonTile, DRAGON_TILES);
  });

  return isRealmEachTile;
};

/**
 * 巡目ごとの牌山から各牌を最初に引く巡目を計算する（存在しない場合は-1巡目）
 * @param wall 牌山
 * @param usableWallCount 使用可能な牌山の枚数
 * @returns 巡目ごとの牌山から各牌を最初に引く巡目
 */
export const calcFirstDrawTurnByTilesByTurns = (wall: WallTile[], maxWall: number, usableWallCount: number): Record<SanmaTile, number>[] => {
  const result: Record<SanmaTile, number>[] = new Array(usableWallCount + 1);

  const firstDrawTurnByTiles = { ...SANMA_TILE_RECORD_MINUS_1 };
  result[maxWall] = { ...firstDrawTurnByTiles };

  for (let turn = maxWall - 1; turn >= 0; --turn) {
    if (turn < usableWallCount) {
      const nextTile = wall[turn];
      if (nextTile !== 'empty' && nextTile !== 'closed') {
        firstDrawTurnByTiles[nextTile] = turn + 1;
      }
    }
    result[turn] = { ...firstDrawTurnByTiles };
  }

  return result;
};

/**
 * 各牌を引く巡目を計算する（手牌にある牌は0巡目）
 * @param progress シミュレーションの進行状況
 * @param hand 手牌
 * @param wall 牌山
 * @param usableWallCount 使用可能な牌山の枚数
 * @returns 各牌を引く巡目
 */
export const calcDrawTurnsByTiles = (progress: RealmSimulationProgress, hand: Hand, wall: WallTile[], usableWallCount: number): Record<SanmaTile, number[]> => {
  const result = structuredClone(SANMA_TILE_RECORD_NUMBER_ARRAY);
  for (const tile of SANMA_TILES) {
    for (const status of hand.closed[tile]) {
      // 打牌候補は除外
      if (progress.action === RealmPhaseAction.Discard && status.isSelected) continue;
      result[tile].push(0);
    }
  }
  if (isSanmaTile(hand.drawn.tile) && !(progress.action === RealmPhaseAction.Discard && hand.drawn.isSelected)) result[hand.drawn.tile].push(0);

  for (let turn = progress.turn + 1; turn <= usableWallCount; ++turn) {
    const tile = wall[turn - 1];
    if (!isSanmaTile(tile)) continue;
    result[tile].push(turn);
  }

  return result;
};

/** 各牌の総枚数を返す */
const totalTiles = (counter: Record<SanmaTile, number>): number =>
  SANMA_TILES.reduce((acc, tile) => acc + counter[tile], 0);

/**
 * 面子手聴牌の手牌作成
 * 索子待ちのみ
 * @param pool 牌プール
 * @param nonRealmWinsEachSozu 各索子牌の非領域の和了回数
 * @param memo 分解結果のメモ
 * @returns 聴牌手牌
 */
function createStandardTenpai(
  pool: Record<SanmaTile, number>,
  nonRealmWinsEachSozu: Record<Sozu, number>,
  memo: Map<number, ResultInternal>,
): RealmTenpai {
  type BlockCombinationBreakDown = { toitsu: number; taatsu: number; allowKotsuAsToitsu: boolean };
  type BlockCombination = {
    requiredMentsuCount: number;
    requireSozuTanki: boolean;
    nonSequential: BlockCombinationBreakDown;
    pinzu: BlockCombinationBreakDown;
    sozu: BlockCombinationBreakDown;
  };

  // 聴牌形のブロックの組み合わせ
  // 索子以外の待ちが含まれる牌姿（他色対子 + 索子対子）などは除外
  const blockCombinations: BlockCombination[] = [
    // 3面子 + 対子1組（萬子・字牌） + 塔子1組（索子）
    {
      requiredMentsuCount: 3,
      requireSozuTanki: false,
      nonSequential: { toitsu: 1, taatsu: 0, allowKotsuAsToitsu: true },
      pinzu: { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      sozu: { toitsu: 0, taatsu: 1, allowKotsuAsToitsu: false },
    },
    // 3面子 + 対子1組（筒子） + 塔子1組（索子）
    {
      requiredMentsuCount: 3,
      requireSozuTanki: false,
      nonSequential: { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      pinzu: { toitsu: 1, taatsu: 0, allowKotsuAsToitsu: true },
      sozu: { toitsu: 0, taatsu: 1, allowKotsuAsToitsu: false },
    },
    // 3面子 + 対子1組（索子） + 塔子1組（索子）
    {
      requiredMentsuCount: 3,
      requireSozuTanki: false,
      nonSequential: { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      pinzu: { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      sozu: { toitsu: 1, taatsu: 1, allowKotsuAsToitsu: true },
    },
    // 3面子 + 対子2組（索子）
    {
      requiredMentsuCount: 3,
      requireSozuTanki: false,
      nonSequential: { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      pinzu: { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      sozu: { toitsu: 2, taatsu: 0, allowKotsuAsToitsu: true },
    },
    // 4面子 + 単騎1枚（索子）
    {
      requiredMentsuCount: 4,
      requireSozuTanki: true,
      nonSequential: { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      pinzu: { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      sozu: { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
    },
  ];

  let bestTenpai = EMPTY_REALM_TENPAI;

  for (const blockCombination of blockCombinations) {
    const { requiredMentsuCount, requireSozuTanki, nonSequential, pinzu, sozu } = blockCombination;
    const nonSequentialResult = decomposeTilesIntoBlocks(memo, pool, DECOMPOSER_TILE_SET_IDS.nonSequential, NON_SEQUENTIAL_TILES, nonSequential.toitsu, nonSequential.taatsu, nonSequential.allowKotsuAsToitsu, false);
    const pinzuResult = decomposeTilesIntoBlocks(memo, pool, DECOMPOSER_TILE_SET_IDS.pinzu, PINZU_TILES, pinzu.toitsu, pinzu.taatsu, pinzu.allowKotsuAsToitsu, true);
    const sozuResult = decomposeTilesIntoBlocks(memo, pool, DECOMPOSER_TILE_SET_IDS.sozu, SOZU_TILES, sozu.toitsu, sozu.taatsu, sozu.allowKotsuAsToitsu, true, nonRealmWinsEachSozu);

    const result: DecomposedResult<SanmaTile> = {
      count: nonSequentialResult.count + pinzuResult.count + sozuResult.count,
      blocks: [...nonSequentialResult.blocks, ...pinzuResult.blocks, ...sozuResult.blocks],
      remaining: { ...nonSequentialResult.remaining, ...pinzuResult.remaining, ...sozuResult.remaining },
      nonRealmWinsEachTiles: sozuResult.nonRealmWinsEachTiles,
    };
    if (result.count === Number.NEGATIVE_INFINITY) continue;

    const mentsuBlocks = result.blocks.filter(block => MENTSU_TYPES.some(type => type === block.type));
    if (mentsuBlocks.length < requiredMentsuCount) continue;

    const hand = { ...SANMA_TILE_RECORD_0 };
    if (requireSozuTanki) {
      // 単騎用の索子牌を探す処理
      const isSozuTileRemaining = SOZU_TILES.some(tile => sozuResult.remaining[tile] > 0);
      const isSozuMentsuRemaining = mentsuBlocks.length >= 5 && sozuResult.count > 0;

      if (!isSozuTileRemaining && !isSozuMentsuRemaining) continue;
      if (isSozuTileRemaining) {
        // 索子の余り牌を単騎に使用
        const sozuTile = SOZU_TILES.find(tile => result.remaining[tile] > 0)!;
        hand[sozuTile] += 1;
        ++result.remaining[sozuTile];
      } else if (isSozuMentsuRemaining) {
        // 5面子以上ある場合、索子の面子を崩して単騎に使用
        const sozuBlockIndex = result.blocks.findIndex(block => SOZU_TILES.some(tile => tile === block.tiles[0]));
        const sozuBlock = result.blocks.splice(sozuBlockIndex, 1)[0];
        hand[sozuBlock.tiles[0]] += 1;
        ++result.remaining[sozuBlock.tiles[1]];
        ++result.remaining[sozuBlock.tiles[2]];
      }
    }

    // 索子ブロックを優先するためのソート
    result.blocks.sort((a, b) => {
      const aIsMentsu = MENTSU_TYPES.some(type => type === a.type);
      const bIsMentsu = MENTSU_TYPES.some(type => type === b.type);
      if (aIsMentsu && bIsMentsu) {
        const aIsSozu = SOZU_TILES.some(s => s === a.tiles[0]);
        const bIsSozu = SOZU_TILES.some(s => s === b.tiles[0]);
        // 索子面子を前に、他色面子を後ろに
        if (aIsSozu && !bIsSozu) return -1;
        if (!aIsSozu && bIsSozu) return 1;
        return 0;
      }
      // 面子を前に、その他を後ろに
      if (aIsMentsu && !bIsMentsu) return -1;
      if (!aIsMentsu && bIsMentsu) return 1;
      return 0;
    });

    let blockCount = 0;
    result.blocks.forEach(block => {
      if (MENTSU_TYPES.some(type => type === block.type)) {
        if (blockCount >= requiredMentsuCount) return;
        ++blockCount;
      }
      // 手牌に指定された数の面子と面子以外の全てのブロックを追加
      block.tiles.forEach(tile => ++hand[tile]);
    });

    const totalNonRealmWins = SOZU_TILES.reduce((sum, tile) => sum + result.nonRealmWinsEachTiles[tile], 0);
    const tenpai: RealmTenpai = {
      hand,
      totalNonRealmWins,
      nonRealmWinsEachTiles: result.nonRealmWinsEachTiles,
    };
    if (tenpai.totalNonRealmWins > bestTenpai.totalNonRealmWins) {
      bestTenpai = tenpai;
    }
  }

  return bestTenpai;
}

/**
 * 七対子聴牌の手牌作成
 * 索子単騎待ちのみ
 * @param pool 牌プール
 * @returns 聴牌手牌
 */
function createSevenPairsTenpai(pool: Record<SanmaTile, number>): RealmTenpai {
  const result = {
    hand: { ...SANMA_TILE_RECORD_0 },
    totalNonRealmWins: 0,
    nonRealmWinsEachTiles: { ...SANMA_TILE_RECORD_0 },
  };

  const pairTiles = SANMA_TILES.filter(tile => pool[tile] >= 2);

  // 6対子以上 + 索子単体牌
  const sozuSingleTiles = SOZU_TILES.filter(tile => pool[tile] === 1);
  if (pairTiles.length >= 6 && sozuSingleTiles.length > 0) {
    for (let i = 0; i < 6; ++i) {
      result.hand[pairTiles[i]] = 2;
    }
    result.hand[sozuSingleTiles[0]] = 1;
    return result;
  }

  // 7対子以上(索子含む)
  const sozuPairTiles = SOZU_TILES.filter(tile => pool[tile] >= 2);
  if (pairTiles.length >= 7 && sozuPairTiles.length >= 1) {
    // 手牌に対子を6組追加
    for (let i = 0; i < 6; i++) {
      result.hand[pairTiles[i]] = 2;
    }
    const firstSozuTileAdded = pairTiles.slice(0, 6).find(isSozuTile);
    if (firstSozuTileAdded) {
      // 追加した対子に索子牌があれば、その対子を単騎の1枚に変更し、7番目の対子を追加
      result.hand[firstSozuTileAdded] = 1;
      result.hand[pairTiles[6]] = 2;
    } else {
      // 追加した対子に索子牌がない場合は、別途索子の対子から単騎の1枚を追加
      result.hand[sozuPairTiles[0]] = 1;
    }
    return result;
  }

  return EMPTY_REALM_TENPAI;
}

/**
 * 国士無双聴牌の手牌作成
 * 1s待ちか9s待ちのどちらか
 * @param pool 牌プール
 * @param nonRealmWinsEachSozu 各索子牌の非領域の和了回数
 * @returns 聴牌手牌
 */
function createKokushiTenpai(pool: Record<SanmaTile, number>, nonRealmWinsEachSozu: Record<Sozu, number>): RealmTenpai {
  const kokushiTiles: SanmaTile[] = ['1m', '9m', '1p', '9p', '1s', '9s', 'E', 'S', 'W', 'N', 'P', 'F', 'C'];
  const result = {
    hand: { ...SANMA_TILE_RECORD_0 },
    totalNonRealmWins: 0,
    nonRealmWinsEachTiles: { ...SANMA_TILE_RECORD_0 },
  };

  // 国士の雀頭
  let pairExists = false;
  for (const tile of kokushiTiles) {
    if (pool[tile] >= 2) {
      pairExists = true;
      result.hand[tile] = 2;
      break;
    }
  }
  if (!pairExists) return EMPTY_REALM_TENPAI;

  // 索子以外は最低1枚必要
  for (const tile of kokushiTiles) {
    if (tile === '1s' || tile === '9s') continue;
    if (result.hand[tile] === 2) continue;
    if (pool[tile] === 0) return EMPTY_REALM_TENPAI;
    result.hand[tile] = 1;
  }

  // 索子の待ち
  if (pool['1s'] === 0 && pool['9s'] === 0) return EMPTY_REALM_TENPAI;
  if (result.hand['1s'] !== 2 && result.hand['9s'] !== 2) {
    if (pool['1s'] > 0) {
      result.hand['1s'] = 1;
    } else {
      result.hand['9s'] = 1;
    }
  }

  // 非領域牌の和了
  if (result.hand['1s'] === 0) {
    result.totalNonRealmWins = nonRealmWinsEachSozu['1s'];
    result.nonRealmWinsEachTiles['1s'] = nonRealmWinsEachSozu['1s'];
  }
  if (result.hand['9s'] === 0) {
    result.totalNonRealmWins = nonRealmWinsEachSozu['9s'];
    result.nonRealmWinsEachTiles['9s'] = nonRealmWinsEachSozu['9s'];
  }

  return result;
}

/**
 * 各聴牌形（面子手、七対子、国士無双）で索子待ちの聴牌をする最も早い巡目と聴牌時の手牌を計算する
 * 純粋な索子待ちのみを結果に含める
 * @param progress シミュレーションの進行状況
 * @param isRealmEachTile 各牌が領域牌かどうか
 * @param hand 手牌
 * @param wall 牌山
 * @param usableWallCount 使用可能な牌山の枚数
 * @param winsLogic 和了回数計算ロジック
 * @returns 各聴牌形で索子待ちの聴牌をする最も早い巡目と聴牌時の手牌。聴牌しない場合は正の無限大の巡目と空の手牌を設定する。
 */
export const calcRealmTenpai = (
  progress: RealmSimulationProgress,
  isRealmEachTile: Record<SanmaTile, boolean>,
  hand: Hand,
  wall: WallTile[],
  usableWallCount: number,
  winsLogic: WinsLogic,
): RealmTenpaiResult[] => {
  const pool: Record<SanmaTile, number> = { ...SANMA_TILE_RECORD_0 };
  for (const tile of SANMA_TILES) {
    if (!isRealmEachTile[tile]) continue;
    // ツモアクション中は選択中のツモ候補を牌プールに含める
    // 打牌アクション中は選択中の打牌候補を牌プールから除外する
    pool[tile] = hand.closed[tile].filter(status => {
      if (progress.action === RealmPhaseAction.Draw) return true;
      if (progress.action === RealmPhaseAction.Discard) return !status.isSelected;
    }).length;
  }

  (() => {
    if (hand.drawn.tile === 'empty' || hand.drawn.tile === 'closed') return;
    if (!isRealmEachTile[hand.drawn.tile]) return;
    // 打牌アクション中は選択中のツモ牌を牌プールから除外する
    if (progress.action === RealmPhaseAction.Discard && hand.drawn.isSelected) return;
    ++pool[hand.drawn.tile];
  })();

  const standardResult: RealmTenpaiResult = {
    type: 'standard',
    turn: Number.POSITIVE_INFINITY,
    hand: { ...SANMA_TILE_RECORD_0 },
    totalWins: Number.NEGATIVE_INFINITY,
    totalNonRealmWins: Number.NEGATIVE_INFINITY,
    nonRealmWinsEachTiles: { ...SANMA_TILE_RECORD_0 },
  };
  const sevenPairsResult: RealmTenpaiResult = {
    type: 'sevenPairs',
    turn: Number.POSITIVE_INFINITY,
    hand: { ...SANMA_TILE_RECORD_0 },
    totalWins: Number.NEGATIVE_INFINITY,
    totalNonRealmWins: Number.NEGATIVE_INFINITY,
    nonRealmWinsEachTiles: { ...SANMA_TILE_RECORD_0 },
  };
  const kokushiResult: RealmTenpaiResult = {
    type: 'kokushi',
    turn: Number.POSITIVE_INFINITY,
    hand: { ...SANMA_TILE_RECORD_0 },
    totalWins: Number.NEGATIVE_INFINITY,
    totalNonRealmWins: Number.NEGATIVE_INFINITY,
    nonRealmWinsEachTiles: { ...SANMA_TILE_RECORD_0 },
  };

  const results: RealmTenpaiResult[] = [];

  for (let turn = progress.turn; turn <= usableWallCount; ++turn) {
    // 現在ターン（progress.turn）の牌は手牌のツモ牌に含まれているため牌プールに加算しない
    if (turn > progress.turn) {
      const tile = wall[turn - 1];
      if (tile === 'empty' || tile === 'closed') continue;
      if (!isRealmEachTile[tile]) continue;
      pool[tile] += 1;
    }
    if (totalTiles(pool) < 13) continue;

    const nonRealmWinsEachSozu = winsLogic.nonRealmWinsEachSozuByTenpaiTurn[turn];
    const realmWins = winsLogic.realmWinsByTenpaiTurn[turn];
    const maxPossibleNonRealmWins = winsLogic.maxPossibleNonRealmWinsByTenpaiTurn[turn];
    const maxPossibleWins = realmWins + maxPossibleNonRealmWins;
    const memo: Map<number, ResultInternal> = new Map();

    if (standardResult.totalWins < maxPossibleWins) {
      // 非領域牌の和了による和了回数更新の見込みがある間は探索継続
      const standardTenpai = createStandardTenpai(pool, nonRealmWinsEachSozu, memo);
      const wins = realmWins + standardTenpai.totalNonRealmWins;
      if (wins > standardResult.totalWins) {
        standardResult.turn = turn;
        standardResult.hand = standardTenpai.hand;
        standardResult.totalWins = wins;
        standardResult.totalNonRealmWins = standardTenpai.totalNonRealmWins;
        standardResult.nonRealmWinsEachTiles = standardTenpai.nonRealmWinsEachTiles;
      }
    }
    if (sevenPairsResult.turn === Number.POSITIVE_INFINITY) {
      const sevenPairsTenpai = createSevenPairsTenpai(pool);
      const wins = realmWins + sevenPairsTenpai.totalNonRealmWins;
      if (wins > sevenPairsResult.totalWins) {
        sevenPairsResult.turn = turn;
        sevenPairsResult.hand = sevenPairsTenpai.hand;
        sevenPairsResult.totalWins = realmWins + sevenPairsTenpai.totalNonRealmWins;
        sevenPairsResult.totalNonRealmWins = sevenPairsTenpai.totalNonRealmWins;
        sevenPairsResult.nonRealmWinsEachTiles = sevenPairsTenpai.nonRealmWinsEachTiles;
      }
    }
    if (kokushiResult.turn === Number.POSITIVE_INFINITY) {
      const kokushiTenpai = createKokushiTenpai(pool, nonRealmWinsEachSozu);
      const wins = realmWins + kokushiTenpai.totalNonRealmWins;
      if (wins > kokushiResult.totalWins) {
        kokushiResult.turn = turn;
        kokushiResult.hand = kokushiTenpai.hand;
        kokushiResult.totalWins = realmWins + kokushiTenpai.totalNonRealmWins;
        kokushiResult.totalNonRealmWins = kokushiTenpai.totalNonRealmWins;
        kokushiResult.nonRealmWinsEachTiles = kokushiTenpai.nonRealmWinsEachTiles;
      }
    }
    if (
      standardResult.totalWins >= maxPossibleWins
      && sevenPairsResult.turn !== Number.POSITIVE_INFINITY
      && kokushiResult.turn !== Number.POSITIVE_INFINITY
    ) {
      break;
    }
  }

  results.push(standardResult);
  results.push(sevenPairsResult);
  results.push(kokushiResult);
  results.sort((a, b) => b.totalWins - a.totalWins);
  return results;
};

/**
 * 捨て牌ごとの平均和了回数を計算する
 * @param progress シミュレーションの進行状況
 * @param isRealmEachTile 各牌が領域牌かどうか
 * @param remainingTiles 残り牌
 * @param hand 手牌
 * @param wall 牌山
 * @param usableWallCount 使用可能な牌山の枚数
 * @param realmWinsByTenpaiTurns 聴牌巡目ごとの領域の和了回数
 * @param openNonRealmWinsByTenpaiTurnsPerSozu 聴牌巡目ごとの各索子牌の非領域の和了回数
 * @param maxClosedTilesToEnumerate 裏牌を総当たり列挙する数（2以上だと先の裏牌が見えている前提の打牌になってしまったため1に修正）
 * @returns 捨て牌ごとの平均和了回数
 */
export const calcRealmWinsAverageByDiscard = async (
  progress: RealmSimulationProgress,
  processingState: ProcessingState,
  isRealmEachTile: Record<SanmaTile, boolean>,
  remainingTiles: Record<SanmaTile, number>,
  hand: Hand,
  wall: WallTile[],
  usableWallCount: number,
  winsLogic: WinsLogic,
  maxClosedTilesToEnumerate: number = 1,
): Promise<Record<SanmaTile, number> | null> => {
  if (!isSanmaTile(hand.drawn.tile)) {
    console.error('[calcRealmWinCountAverageByDiscard] Unexpected drawn tile', hand.drawn.tile);
    return null;
  }
  if (progress.phase !== RealmPhase.Main || progress.action === RealmPhaseAction.Draw) {
    console.error('[calcRealmWinCountAverageByDiscard] Unexpected phase or action', progress);
    return null;
  }

  const pool: Record<SanmaTile, number> = { ...SANMA_TILE_RECORD_0 };
  // プールの作成
  for (const tile of SANMA_TILES) {
    if (isRealmEachTile[tile]) pool[tile] += hand.closed[tile].length;
  }
  if (isRealmEachTile[hand.drawn.tile]) ++pool[hand.drawn.tile];

  // 打牌候補
  const handTilesToDiscard = SANMA_TILES.filter(tile => hand.closed[tile].length > 0 || hand.drawn.tile === tile);

  const closedDomains: SanmaTileOrNonRealm[] = ['nonRealm'];
  const closedDomainCounts = { ...SANMA_TILES_OR_NON_REALM_RECORD_0 };
  for (const tile of SANMA_TILES) {
    if (remainingTiles[tile] <= 0) continue;
    if (isRealmEachTile[tile]) {
      closedDomains.push(tile);
      closedDomainCounts[tile] = remainingTiles[tile];
    } else {
      closedDomainCounts.nonRealm += remainingTiles[tile];
    }
  }

  // 列挙する裏牌の数
  let closedCountToEnumerate = 0;
  // 裏牌枚数ごとの順列リスト
  const permutationsByClosedCount = Array.from({ length: maxClosedTilesToEnumerate + 1 }).map((_, i) =>
    enumerateMultisetPermutations(closedDomainCounts, i),
  );

  // 捨て牌ごとの探索済み管理
  const indexedTreeByDiscard = handTilesToDiscard.map(() => {
    const indexedTree = new IndexedTree(closedDomains, maxClosedTilesToEnumerate);
    indexedTree.loadPermutations(permutationsByClosedCount[maxClosedTilesToEnumerate]);
    return indexedTree;
  });

  // 和了回数のメモ。重複順列の部分集合のうち同じ牌の組み合わせの結果を再利用する
  const winsMemoByDiscard = Array.from({ length: handTilesToDiscard.length }).map(() => new Map<string, number>());
  // 捨て牌ごとの和了回数の合計
  const totalWinsByDiscard = { ...SANMA_TILE_RECORD_0 };

  processingState.setIsBusy(true);

  const startTurn = progress.turn;
  const endTurn = usableWallCount;
  const totalTurns = endTurn - startTurn + 1;

  const updatePercent = async (turn: number) => {
    const newPercent = Math.floor((turn - startTurn + 1) / totalTurns * 100);
    processingState.setPercent(newPercent);
    await (() => new Promise(resolve => setTimeout(resolve, 0)))();
  };

  for (let turn = startTurn; turn <= endTurn; await updatePercent(turn), ++turn) {
    // 現在の巡目の牌山の牌は手牌のツモ牌に含まれているため牌プールに加算しない
    if (turn > progress.turn) {
      const tile = wall[turn - 1];
      if (tile === 'empty') continue;
      if (tile === 'closed') {
        if (maxClosedTilesToEnumerate > closedCountToEnumerate) {
          ++closedCountToEnumerate;
        } else {
          continue;
        }
      } else {
        if (!isRealmEachTile[tile]) continue;
        pool[tile] += 1;
      }
    }

    const memo: Map<number, ResultInternal> = new Map();

    handTilesToDiscard.forEach((tileToDiscard, discardIndex) => {
      permutationsByClosedCount[closedCountToEnumerate].forEach(permutation => {
        const realmWins = winsLogic.calcAdjustedRealmWinsForClosedPermutation(turn, permutation.tiles);

        const maxPossibleNonRealmWins = winsLogic.calcAdjustedMaxPossibleNonRealmWinsForClosedPermutation(turn, permutation.tiles);
        const maxPossibleWins = realmWins + maxPossibleNonRealmWins;

        const maxWins = indexedTreeByDiscard[discardIndex].getScore(permutation.tiles);
        if (maxPossibleWins <= maxWins) return;

        const winsMemoKey = `${turn}:${[...permutation.tiles].sort().join('_')}`;
        if (winsMemoByDiscard[discardIndex].has(winsMemoKey)) {
          const wins = winsMemoByDiscard[discardIndex].get(winsMemoKey)!;
          indexedTreeByDiscard[discardIndex].setScore(permutation.tiles, wins);

          const winDiff = wins - maxWins;
          const expectedWinsDiff = winDiff * permutation.probability;
          totalWinsByDiscard[tileToDiscard] += expectedWinsDiff;
          return;
        }

        const tenpais = [];

        --pool[tileToDiscard];
        permutation.tiles.forEach(closedTile => {
          if (closedTile !== 'nonRealm') ++pool[closedTile];
        });
        const standardTenpai = createStandardTenpai(pool, winsLogic.nonRealmWinsEachSozuByTenpaiTurn[turn], memo);
        if (standardTenpai.totalNonRealmWins >= 0) tenpais.push(standardTenpai);
        const sevenPairsTenpai = createSevenPairsTenpai(pool);
        if (sevenPairsTenpai.totalNonRealmWins >= 0) tenpais.push(sevenPairsTenpai);
        const kokushiTenpai = createKokushiTenpai(pool, winsLogic.nonRealmWinsEachSozuByTenpaiTurn[turn]);
        if (kokushiTenpai.totalNonRealmWins >= 0) tenpais.push(kokushiTenpai);
        ++pool[tileToDiscard];
        permutation.tiles.forEach(closedTile => {
          if (closedTile !== 'nonRealm') --pool[closedTile];
        });

        if (tenpais.length > 0) {
          tenpais.sort((a, b) => b.totalNonRealmWins - a.totalNonRealmWins);

          const nonRealmWins = winsLogic.calcAdjustedNonRealmWinsForClosedPermutation(turn, permutation.tiles, tenpais[0]);
          const wins = realmWins + nonRealmWins;
          if (wins <= maxWins) return;

          winsMemoByDiscard[discardIndex].set(winsMemoKey, wins);
          indexedTreeByDiscard[discardIndex].setScore(permutation.tiles, wins);

          const winDiff = wins - maxWins;
          const expectedWinsDiff = winDiff * permutation.probability;
          totalWinsByDiscard[tileToDiscard] += expectedWinsDiff;
        }
      });
    });
  }

  processingState.setIsBusy(false);

  return totalWinsByDiscard;
};
