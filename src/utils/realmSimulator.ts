import { RealmBoss, SanmaTile, SANMA_TILES, SANMA_MANZU_TILES, PINZU_TILES, SOZU_TILES, isSanmaManzuTile, isPinzuTile, isSozuTile, isWindTile, WIND_TILES, isDragonTile, DRAGON_TILES, WallTile, SANMA_TILE_RECORD_4, SANMA_TILE_RECORD_FALSE, Hand, SANMA_TILE_RECORD_0, RealmTenpaiResult, MENTSU_TYPES, SANMA_TILE_RECORD_NUMBER_ARRAY, Sozu, SOZU_RECORD_0, RealmTenpai, NON_SEQUENTIAL_TILES, DECOMPOSER_TILE_SET_IDS, SANMA_TILE_RECORD_MINUS_1, RealmSimulationProgress, RealmPhaseAction } from "../types/simulation";
import { decomposeTilesIntoBlocks, mergeDecomposedResult, ResultInternal } from "./blockDecomposer";

/**
 * 領域牌の枚数を計算する
 * @param boss ボス（ステージ効果）
 * @param doraIndicators ドラ表示牌
 * @returns 各領域牌の枚数
 */
export const calcRealmTiles = (boss: RealmBoss, doraIndicators: SanmaTile[]): Map<SanmaTile, number> => {
  const realmTileCounter = new Map<SanmaTile, number>();
  if (boss === "empty") return realmTileCounter;
  
  const isRealm: { [key in SanmaTile]: boolean } = Object.fromEntries(SANMA_TILES.map(tile => [tile, false])) as { [key in SanmaTile]: boolean };
  const tileCounter: { [key in SanmaTile]: number } = Object.fromEntries(SANMA_TILES.map(tile => [tile, 4])) as { [key in SanmaTile]: number };
  
  const markRealmTileForGroup = <T extends SanmaTile>(
    doraIndicator: SanmaTile,
    predicate: (tile: SanmaTile) => tile is T,
    tiles: readonly T[],
    tBoss?: RealmBoss
  ) => {
    if (!predicate(doraIndicator)) return;
    if (tBoss && boss === tBoss) return;
    isRealm[doraIndicator] = true;
    const tile = doraIndicator as T;
    const index = tiles.indexOf(tile);
    const nextIndex = (index + 1) % tiles.length;
    isRealm[tiles[nextIndex]] = true;
  };

  doraIndicators.forEach((doraIndicator) => {
    --tileCounter[doraIndicator];
    markRealmTileForGroup(doraIndicator, isSanmaManzuTile, SANMA_MANZU_TILES, "dora_manzu");
    markRealmTileForGroup(doraIndicator, isPinzuTile, PINZU_TILES, "dora_pinzu");
    markRealmTileForGroup(doraIndicator, isSozuTile, SOZU_TILES, "dora_sozu");
    markRealmTileForGroup(doraIndicator, isWindTile, WIND_TILES);
    markRealmTileForGroup(doraIndicator, isDragonTile, DRAGON_TILES);
  });
  
  SANMA_TILES.forEach(tile => {
    if (isRealm[tile]) realmTileCounter.set(tile, tileCounter[tile]);
  });
  return realmTileCounter;
};

/**
 * 全ての牌について領域牌かどうかを判定する
 * @param boss ボス（ステージ効果）
 * @param doraIndicators ドラ表示牌
 * @returns 各牌が領域牌かどうか
 */
export const calcIsRealmEachTile = (boss: RealmBoss, doraIndicators: SanmaTile[]): Record<SanmaTile, boolean> => {
  const isRealmEachTile = { ...SANMA_TILE_RECORD_FALSE };
  if (boss === "empty") return isRealmEachTile;

  const markRealmTileForGroup = <T extends SanmaTile>(
    doraIndicator: SanmaTile,
    predicate: (tile: SanmaTile) => tile is T,
    tiles: readonly T[],
    tBoss?: RealmBoss
  ) => {
    if (!predicate(doraIndicator)) return;
    if (tBoss && boss === tBoss) return;
    isRealmEachTile[doraIndicator] = true;
    const tile = doraIndicator as T;
    const index = tiles.indexOf(tile);
    const nextIndex = (index + 1) % tiles.length;
    isRealmEachTile[tiles[nextIndex]] = true;
  };

  doraIndicators.forEach((doraIndicator) => {
    markRealmTileForGroup(doraIndicator, isSanmaManzuTile, SANMA_MANZU_TILES, "dora_manzu");
    markRealmTileForGroup(doraIndicator, isPinzuTile, PINZU_TILES, "dora_pinzu");
    markRealmTileForGroup(doraIndicator, isSozuTile, SOZU_TILES, "dora_sozu");
    markRealmTileForGroup(doraIndicator, isWindTile, WIND_TILES);
    markRealmTileForGroup(doraIndicator, isDragonTile, DRAGON_TILES);
  });
  
  return isRealmEachTile;
};

/**
 * 各牌の残り枚数を計算する
 * @param doraIndicators ドラ表示牌
 * @param wall 牌山
 * @param hand 手牌
 * @param discardedTiles 捨て牌
 * @returns 各牌の残り枚数
 */
export const calcRemainingTiles = (
  doraIndicators: SanmaTile[],
  wall: WallTile[],
  hand: Hand,
  discardedTiles: Record<SanmaTile, number>
): Record<SanmaTile, number> => {
  const remainingTiles = {...SANMA_TILE_RECORD_4};

  doraIndicators.forEach((tile) => {
    --remainingTiles[tile];
  });

  wall.forEach((tile) => {
    if (tile === "closed" || tile === "empty") return;
    --remainingTiles[tile];
  });

  SANMA_TILES.forEach((tile) => {
    remainingTiles[tile] -= hand.closed[tile].length;
  });

  SANMA_TILES.forEach((tile) => {
    remainingTiles[tile] -= discardedTiles[tile];
  });
  
  return remainingTiles;
};

/**
 * 牌山から各牌を最初に引く巡目を計算する（存在しない場合は-1巡目）
 * @param wall 牌山
 * @returns 牌山から各牌を最初に引く巡目
 */
export const calcFirstDrawTurnByTiles = (wall: WallTile[]): Record<SanmaTile, number> => {
  const result = { ...SANMA_TILE_RECORD_MINUS_1 };
  wall.forEach((tile, i) => {
    if (tile === "closed" || tile === "empty") return;
    if (result[tile] === -1) result[tile] = (i + 1);
  })
  
  return result;
};

/**
 * 各牌を引く巡目を計算する（手牌にある牌は0巡目）
 * @param handState 手牌
 * @param wall 牌山
 * @returns 各牌を引く巡目
 */
export const calcDrawTurnsByTiles = (handState: Hand, wall: WallTile[]): Record<SanmaTile, number[]> => {
  const result = structuredClone(SANMA_TILE_RECORD_NUMBER_ARRAY);
  for (const tile of SANMA_TILES) {
    for (let i = 0; i < handState.closed[tile].length; ++i) {
      result[tile].push(0);
    }
  }
  wall.forEach((tile, i) => {
    if (tile === "closed" || tile === "empty") return;
    result[tile].push(i + 1);
  })
  
  return result;
};

/**
 * 聴牌巡目ごとの領域の和了回数を計算する
 * @param wall 牌山
 * @param maxWall 牌山の最大枚数
 * @param isRealmEachTile 各牌が領域牌かどうか
 * @returns 聴牌巡目ごとの領域の和了回数
 */
export const calcRealmWinsByTenpaiTurns = (wall: WallTile[], maxWall: number, isRealmEachTile: Record<SanmaTile, boolean>): number[] => {
  // 最終巡目の聴牌は0和了確定
  const result = Array.from({ length: maxWall + 1 }, () => 0);
  let wins = 0;
  
  for (let tenpaiTurn = maxWall - 1; tenpaiTurn >= 0; --tenpaiTurn) {
    // 15巡目に聴牌したとき、16枚目（wall[15]）以降で和了可能
    const nextTileAfterTenpai = wall[tenpaiTurn];
    if (nextTileAfterTenpai !== "empty" && nextTileAfterTenpai !== "closed") {
      if (isRealmEachTile[nextTileAfterTenpai]) ++wins;
    }
    result[tenpaiTurn] = wins;
  }
  return result;
};

/**
 * 聴牌巡目ごとの各索子牌による非領域の和了回数を計算する
 * @param wall 牌山
 * @param maxWall 牌山の最大枚数
 * @param isRealmEachTile 各牌が領域牌かどうか
 * @returns 聴牌巡目ごとの各索子牌による非領域の和了回数
 */
export const calcNonRealmWinsByTenpaiTurnsPerSozu = (wall: WallTile[], maxWall: number, isRealmEachTile: Record<SanmaTile, boolean>): Record<Sozu, number>[] => {
  // 最終巡目の聴牌は0和了確定
  const result = Array.from({ length: maxWall + 1 }, () => { return { ...SOZU_RECORD_0 }; });
  const winsPerSozu = { ...SOZU_RECORD_0 };
  
  for (let tenpaiTurn = maxWall - 1; tenpaiTurn >= 0; --tenpaiTurn) {
    // 15巡目に聴牌したとき、16枚目（wall[15]）以降で和了可能
    const nextTileAfterTenpai = wall[tenpaiTurn];
    if (nextTileAfterTenpai !== "empty" && nextTileAfterTenpai !== "closed") {
      if (!isRealmEachTile[nextTileAfterTenpai] && isSozuTile(nextTileAfterTenpai)) ++winsPerSozu[nextTileAfterTenpai];
    }
    result[tenpaiTurn] = { ...winsPerSozu };
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
 * @param nonRealmWinsPerSozu 各索子牌の非領域の和了回数
 * @returns 聴牌手牌または null
 */
function createStandardTenpai(pool: Record<SanmaTile, number>, nonRealmWinsPerSozu: Record<Sozu, number>): RealmTenpai | null {
  type BlockCombinationBreakDown = { toitsu: number; taatsu: number, allowKotsuAsToitsu: boolean };
  type BlockCombination = {
    requiredMentsuCount: number,
    requireSozuTanki: boolean,
    nonSequential: BlockCombinationBreakDown,
    pinzu: BlockCombinationBreakDown,
    sozu: BlockCombinationBreakDown,
  };

  // 聴牌形のブロックの組み合わせ
  // 索子以外の待ちが含まれる牌姿（他色対子 + 索子対子）などは除外
  const blockCombinations: BlockCombination[] = [
    // 3面子 + 対子1組（萬子・字牌） + 塔子1組（索子）
    {
      requiredMentsuCount: 3,
      requireSozuTanki: false,
      nonSequential:  { toitsu: 1, taatsu: 0, allowKotsuAsToitsu: true },
      pinzu:          { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      sozu:           { toitsu: 0, taatsu: 1, allowKotsuAsToitsu: false },
    },
    // 3面子 + 対子1組（筒子） + 塔子1組（索子）
    {
      requiredMentsuCount: 3,
      requireSozuTanki: false,
      nonSequential:  { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      pinzu:          { toitsu: 1, taatsu: 0, allowKotsuAsToitsu: true },
      sozu:           { toitsu: 0, taatsu: 1, allowKotsuAsToitsu: false },
    },
    // 3面子 + 対子1組（索子） + 塔子1組（索子）
    {
      requiredMentsuCount: 3,
      requireSozuTanki: false,
      nonSequential:  { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      pinzu:          { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      sozu:           { toitsu: 1, taatsu: 1, allowKotsuAsToitsu: true },
    },
    // 3面子 + 対子2組（索子）
    {
      requiredMentsuCount: 3,
      requireSozuTanki: false,
      nonSequential:  { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      pinzu:          { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      sozu:           { toitsu: 2, taatsu: 0, allowKotsuAsToitsu: true },
    },
    // 4面子 + 単騎1枚（索子）
    {
      requiredMentsuCount: 4,
      requireSozuTanki: true,
      nonSequential:  { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      pinzu:          { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
      sozu:           { toitsu: 0, taatsu: 0, allowKotsuAsToitsu: true },
    },
  ];
  
  const memo: Map<string, ResultInternal> = new Map();
  
  let bestTenpai = {
    hand: { ...SANMA_TILE_RECORD_0 },
    totalNonRealmWins: Number.NEGATIVE_INFINITY,
    nonRealmWinsPerTiles: { ...SANMA_TILE_RECORD_0 },
  };
  
  for (const blockCombination of blockCombinations) {
    const { requiredMentsuCount, requireSozuTanki, nonSequential, pinzu, sozu } = blockCombination;
    const nonSequentialResult = decomposeTilesIntoBlocks(memo, pool, DECOMPOSER_TILE_SET_IDS.nonSequential, NON_SEQUENTIAL_TILES, nonSequential.toitsu, nonSequential.taatsu, nonSequential.allowKotsuAsToitsu, false);
    const pinzuResult = decomposeTilesIntoBlocks(memo, pool, DECOMPOSER_TILE_SET_IDS.pinzu, PINZU_TILES, pinzu.toitsu, pinzu.taatsu, pinzu.allowKotsuAsToitsu, true);
    const sozuResult = decomposeTilesIntoBlocks(memo, pool, DECOMPOSER_TILE_SET_IDS.sozu, SOZU_TILES, sozu.toitsu, sozu.taatsu, sozu.allowKotsuAsToitsu, true, nonRealmWinsPerSozu);
    
    const result = mergeDecomposedResult(nonSequentialResult, pinzuResult, sozuResult);
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
    })
    
    const totalNonRealmWins = SANMA_TILES.reduce((sum, tile) => sum + result.nonRealmWinsPerTiles[tile], 0);
    const tenpai: RealmTenpai = {
      hand,
      totalNonRealmWins,
      nonRealmWinsPerTiles: result.nonRealmWinsPerTiles,
    }
    if (tenpai.totalNonRealmWins > bestTenpai.totalNonRealmWins) {
      bestTenpai = tenpai;
    }
  }
  
  if (bestTenpai.totalNonRealmWins >= 0) return bestTenpai;
  
  return null;
}

/**
 * 七対子聴牌の手牌作成
 * 索子単騎待ちのみ
 * @param pool 牌プール
 * @returns 聴牌手牌または null
 */
function createSevenPairsTenpai(pool: Record<SanmaTile, number>): RealmTenpai | null {
  const result = {
    hand: { ...SANMA_TILE_RECORD_0 },
    totalNonRealmWins: 0,
    nonRealmWinsPerTiles: { ...SANMA_TILE_RECORD_0 },
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
  
  return null;
}

/**
 * 国士無双聴牌の手牌作成
 * 1s待ちか9s待ちのどちらか
 * @param pool 牌プール
 * @param nonRealmWinsPerSozu 各索子牌の非領域の和了回数
 * @returns 聴牌手牌または null
 */
function createKokushiTenpai(pool: Record<SanmaTile, number>, nonRealmWinsPerSozu: Record<Sozu, number>): RealmTenpai | null {
  const kokushiTiles: SanmaTile[] = ["1m", "9m", "1p", "9p", "1s", "9s", "E", "S", "W", "N", "P", "F", "C"];
  const result = {
    hand: { ...SANMA_TILE_RECORD_0 },
    totalNonRealmWins: 0,
    nonRealmWinsPerTiles: { ...SANMA_TILE_RECORD_0 },
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
  if (!pairExists) return null;
  
  // 索子の待ち
  if (pool["1s"] === 0 && pool["9s"] === 0) return null;
  if (result.hand["1s"] !== 2 && result.hand["9s"] !== 2) {
    if (pool["1s"] > 0) {
      result.hand["1s"] = 1;
    } else {
      result.hand["9s"] = 1;
    }
  }
  
  // 非領域牌の和了加算
  if (result.hand["1s"] === 0) {
    result.totalNonRealmWins += nonRealmWinsPerSozu["1s"];
    result.nonRealmWinsPerTiles["1s"] += nonRealmWinsPerSozu["1s"];
  }
  if (result.hand["9s"] === 0) {
    result.totalNonRealmWins += nonRealmWinsPerSozu["9s"];
    result.nonRealmWinsPerTiles["9s"] += nonRealmWinsPerSozu["9s"];
  }
  
  // 索子以外は最低1枚必要
  for (const tile of kokushiTiles) {
    if (tile === "1s" || tile === "9s") continue;
    if (result.hand[tile] === 2) continue;
    if (pool[tile] === 0) return null;
    result.hand[tile] = 1;
  }
  
  return result;
}

/**
 * 各聴牌形（面子手、七対子、国士無双）で索子待ちの聴牌をする最も早い巡目と聴牌時の手牌を計算する
 * 純粋な索子待ちのみを結果に含める
 * @param isDrawPhase ツモフェーズ or 打牌フェーズ
 * @param isRealmEachTile 各牌が領域牌かどうか
 * @param hand 手牌
 * @param wall 牌山
 * @param realmWinsByTenpaiTurns 聴牌巡目ごとの領域の和了回数
 * @param nonRealmWinsByTenpaiTurnsPerSozu 聴牌巡目ごとの各索子牌の非領域の和了回数
 * @returns 各聴牌形で索子待ちの聴牌をする最も早い巡目と聴牌時の手牌。聴牌しない場合は正の無限大の巡目と空の手牌を設定する。
 */
export const calcRealmTenpai = (
  simulationProgress: RealmSimulationProgress,
  isRealmEachTile: Record<SanmaTile, boolean>,
  hand: Hand,
  wall: WallTile[],
  realmWinsByTenpaiTurns: number[],
  nonRealmWinsByTenpaiTurnsPerSozu: Record<Sozu, number>[],
): RealmTenpaiResult[] => {
  const pool: Record<SanmaTile, number> = { ...SANMA_TILE_RECORD_0 };
  for (const tile of SANMA_TILES) {
    if (!isRealmEachTile[tile]) continue;
    // ツモフェーズ時はツモ候補を牌プールに含める
    // 打牌フェーズ時は打牌候補を牌プールから除外する
    pool[tile] = hand.closed[tile].filter(status =>
      simulationProgress.action === RealmPhaseAction.Draw
        ? true
        : !status.isSelected
    ).length;
  }
  
  const standardResult: RealmTenpaiResult = {
    type: "standard",
    turn: Number.POSITIVE_INFINITY,
    hand: { ...SANMA_TILE_RECORD_0 },
    totalWins: 0,
    totalNonRealmWins: 0,
    nonRealmWinsPerTiles: { ...SANMA_TILE_RECORD_0 },
  };
  const sevenPairsResult: RealmTenpaiResult = {
    type: "sevenPairs",
    turn: Number.POSITIVE_INFINITY,
    hand: { ...SANMA_TILE_RECORD_0 },
    totalWins: 0,
    totalNonRealmWins: 0,
    nonRealmWinsPerTiles: { ...SANMA_TILE_RECORD_0 },
  };
  const kokushiResult: RealmTenpaiResult = {
    type: "kokushi",
    turn: Number.POSITIVE_INFINITY,
    hand: { ...SANMA_TILE_RECORD_0 },
    totalWins: 0,
    totalNonRealmWins: 0,
    nonRealmWinsPerTiles: { ...SANMA_TILE_RECORD_0 },
  };
  
  const results: RealmTenpaiResult[] = [];
  
  for (let turn = 0; turn <= wall.length; ++turn) {
    if (turn >= 1) {
      const drawn = wall[turn - 1];
      if (drawn === "closed" || drawn === "empty") continue;
      if (!isRealmEachTile[drawn]) continue;
      pool[drawn] += 1;
    }
    if (totalTiles(pool) < 13) continue;
    
    const nonRealmWinsPerSozu = nonRealmWinsByTenpaiTurnsPerSozu[turn];
    const realmWins = realmWinsByTenpaiTurns[turn];
    
    if (standardResult.turn === Number.POSITIVE_INFINITY) {
      const standardTenpai = createStandardTenpai(pool, nonRealmWinsPerSozu);
      if (standardTenpai) {
        standardResult.turn = turn;
        standardResult.hand = standardTenpai.hand;
        standardResult.totalWins = realmWins + standardTenpai.totalNonRealmWins;
        standardResult.totalNonRealmWins = standardTenpai.totalNonRealmWins;
        standardResult.nonRealmWinsPerTiles = standardTenpai.nonRealmWinsPerTiles;
      }
    }
    if (sevenPairsResult.turn === Number.POSITIVE_INFINITY) {
      const sevenPairsTenpai = createSevenPairsTenpai(pool);
      if (sevenPairsTenpai) {
        sevenPairsResult.turn = turn;
        sevenPairsResult.hand = sevenPairsTenpai.hand;
        sevenPairsResult.totalWins = realmWins + sevenPairsTenpai.totalNonRealmWins;
        sevenPairsResult.totalNonRealmWins = sevenPairsTenpai.totalNonRealmWins;
        sevenPairsResult.nonRealmWinsPerTiles = sevenPairsTenpai.nonRealmWinsPerTiles;
      }
    }
    if (kokushiResult.turn === Number.POSITIVE_INFINITY) {
      const kokushiTenpai = createKokushiTenpai(pool, nonRealmWinsPerSozu);
      if (kokushiTenpai) {
        kokushiResult.turn = turn;
        kokushiResult.hand = kokushiTenpai.hand;
        kokushiResult.totalWins = realmWins + kokushiTenpai.totalNonRealmWins;
        kokushiResult.totalNonRealmWins = kokushiTenpai.totalNonRealmWins;
        kokushiResult.nonRealmWinsPerTiles = kokushiTenpai.nonRealmWinsPerTiles;
      }
    }
    if (
      standardResult.turn !== Number.POSITIVE_INFINITY
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
