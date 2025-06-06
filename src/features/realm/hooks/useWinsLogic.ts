import { useCallback, useMemo } from "react";
import { isSozuTile, RealmEditPhase, RealmPhase, RealmTenpai, SanmaTile, SanmaTileOrNonRealm, Sozu, SOZU_RECORD_0, SOZU_TILES } from "../../../shared/types/simulation";
import { ProgressState } from "./useProgressState";
import { WallState } from "./useWallState";
import { RemainingTilesLogic } from "./useRemainingTilesLogic";


export interface WinsLogic {
  realmWinsByTenpaiTurn: number[],
  nonRealmWinsEachSozuByTenpaiTurn: Record<Sozu, number>[],
  maxPossibleNonRealmWinsByTenpaiTurn: number[],
  calcAdjustedRealmWinsForClosedPermutation: (turn: number, permutation: SanmaTileOrNonRealm[]) => number;
  calcAdjustedNonRealmWinsForClosedPermutation: (turn: number, permutation: SanmaTileOrNonRealm[], tenpai: RealmTenpai) => number;
  calcAdjustedMaxPossibleNonRealmWinsForClosedPermutation: (turn: number, permutation: SanmaTileOrNonRealm[]) => number;
}

export const useWinsLogic = (
  progressState: ProgressState,
  isRealmEachTile: Record<SanmaTile, boolean>,
  wallState: WallState,
  remainingTilesLogic: RemainingTilesLogic,
): WinsLogic => {
  const { remainingTiles, totalRealmRemainingCount, totalNonRealmRemainingCount, totalRemainingCount } = remainingTilesLogic;
  
  const shouldCalcWins = useMemo(() => {
    if (progressState.simulationProgress.phase <= RealmPhase.Wall) return false;
    if (progressState.editProgress.isEditing) {
      if (progressState.editProgress.phase !== RealmEditPhase.Wall) return false;
      if (wallState.wall.some(tile => tile === "empty")) return false;
      // 編集モード終了直後にシミュレーションを行えるよう、編集モード終了直前にもこの値を計算しておく
    }
    return true;
  }, [progressState.editProgress.isEditing, progressState.editProgress.phase, progressState.simulationProgress.phase, wallState.wall]);
    
  /** 表裏それぞれの、聴牌巡目ごとの領域の和了回数 */
  const realmWinsByTenpaiTurnsEachVisibility = useMemo(() => {
    const emptyResult = { open: [] as number[], closed: [] as number[], total: [] as number[] };
    if (!shouldCalcWins) return emptyResult;
    
    const result = { open: [] as number[], closed: [] as number[], total: [] as number[] };
    let openWins = 0;
    let closedWins = 0;
    
    // 最終巡目の聴牌は0和了確定
    result.open[wallState.maxWall] = openWins;
    result.closed[wallState.maxWall] = closedWins;
    result.total[wallState.maxWall] = openWins + closedWins;
    
    for (let tenpaiTurn = wallState.maxWall - 1; tenpaiTurn >= 0; --tenpaiTurn) {
      // 例：15巡目に聴牌したとき、16枚目（wall[15]）以降で和了可能
      const nextTileAfterTenpai = wallState.wall[tenpaiTurn];
      if (nextTileAfterTenpai === "empty") {
        console.error("[realmWinsByTenpaiTurnsEachVisibility] Unexpected empty wall tile", nextTileAfterTenpai);
        return emptyResult;
      }
      if (tenpaiTurn < wallState.usableWallCount) {
        if (nextTileAfterTenpai === "closed") {
          // 裏牌
          closedWins += totalRealmRemainingCount / totalRemainingCount;
        } else {
          // 表牌
          if (isRealmEachTile[nextTileAfterTenpai]) ++openWins;
        }
      }
      result.open[tenpaiTurn] = openWins;
      result.closed[tenpaiTurn] = closedWins;
      result.total[tenpaiTurn] = openWins + closedWins;
    }
    return result;
  }, [
    shouldCalcWins,
    wallState.wall,
    wallState.maxWall,
    wallState.usableWallCount,
    isRealmEachTile,
    totalRealmRemainingCount,
    totalRemainingCount,
  ]);
  
  /** 表裏それぞれの、聴牌巡目ごとの各索子牌による非領域の和了回数 */
  const nonRealmWinsEachSozuByTenpaiTurnEachVisibility = useMemo(() => {
    const emptyResult = {
      open: [] as Record<Sozu, number>[],
      closed: [] as Record<Sozu, number>[],
      total: [] as Record<Sozu, number>[],
    };
    if (!shouldCalcWins) return emptyResult;

    const result = {
      open: [] as Record<Sozu, number>[],
      closed: [] as Record<Sozu, number>[],
      total: [] as Record<Sozu, number>[],
    };
    
    const openWinsEachSozu = { ...SOZU_RECORD_0 };
    const closedWinsEachSozu = { ...SOZU_RECORD_0 };
    const winsEachSozu = { ...SOZU_RECORD_0 };
    
    // 最終巡目の聴牌は0和了確定
    result.open[wallState.maxWall] = { ...openWinsEachSozu };
    result.closed[wallState.maxWall] = { ...closedWinsEachSozu };
    result.total[wallState.maxWall] = { ...winsEachSozu };
    
    for (let tenpaiTurn = wallState.maxWall - 1; tenpaiTurn >= 0; --tenpaiTurn) {
      // 例：15巡目に聴牌したとき、16枚目（wall[15]）以降で和了可能
      const nextTileAfterTenpai = wallState.wall[tenpaiTurn];
      if (nextTileAfterTenpai === "empty") {
        console.error("[nonRealmWinsEachSozuByTenpaiTurnEachVisibility] Unexpected empty wall tile", nextTileAfterTenpai);
        return emptyResult;
      }
      if (tenpaiTurn < wallState.usableWallCount) {
        if (nextTileAfterTenpai === "closed") {
          // 裏牌
          SOZU_TILES.forEach(tile => {
            if (!isRealmEachTile[tile]) {
              closedWinsEachSozu[tile] += remainingTiles[tile] / totalRemainingCount;
              winsEachSozu[tile] += remainingTiles[tile] / totalRemainingCount;
            }
          });
        } else {
          // 表牌
          if (!isRealmEachTile[nextTileAfterTenpai] && isSozuTile(nextTileAfterTenpai)) {
            ++openWinsEachSozu[nextTileAfterTenpai];
            ++winsEachSozu[nextTileAfterTenpai];
          }
        }
      }
      result.open[tenpaiTurn] = { ...openWinsEachSozu };
      result.closed[tenpaiTurn] = { ...closedWinsEachSozu };
      result.total[tenpaiTurn] = { ...winsEachSozu };
    }
    return result;
  }, [
    shouldCalcWins,
    wallState.wall,
    wallState.maxWall,
    wallState.usableWallCount,
    isRealmEachTile,
    remainingTiles,
    totalRemainingCount,
  ]);
  
  interface RealmRunLength {
    isRealm: boolean;
    length: number;
    left: number;
  }
  
  /** 索子が領域牌かどうかのランレングス配列 */
  const sozuRealmRunLengths = useMemo(() => {
    const runLengths: RealmRunLength[] = [];
  
    let prevIsRealm = isRealmEachTile[SOZU_TILES[0]];
    let count = 1;
    let left = 0;
  
    for (let i = 1; i < SOZU_TILES.length; ++i) {
      const isRealm = isRealmEachTile[SOZU_TILES[i]];
      if (isRealm === prevIsRealm) {
        ++count;
      } else {
        runLengths.push({ isRealm: prevIsRealm, length: count, left });
        prevIsRealm = isRealm;
        count = 1;
        left = i;
      }
    }
    
    runLengths.push({ isRealm: prevIsRealm, length: count, left });
    return runLengths;
  }, [isRealmEachTile]);
  
  /** 非領域索子待ちの集合 */
  const sozuNonRealmWaitsList = useMemo(() => {
    const lastIndex = SOZU_TILES.length - 1;
    
    const waitsList: Sozu[][] = [];
    const isAdded = SOZU_TILES.map(() => false);

    const pushWaits = (waitIndexes: number[]) => {
      if (waitIndexes.length === 1 && isAdded[waitIndexes[0]]) return;
      waitsList.push(waitIndexes.map(index => SOZU_TILES[index]));
      waitIndexes.forEach(index => isAdded[index] = true);
    };

    // 三面張
    sozuRealmRunLengths.forEach((run) => {
      if (run.isRealm && run.length === 5) {
        const waitL = run.left - 1;
        const waitR = run.left + run.length;
        if (waitL >= 0 && waitR <= lastIndex) pushWaits([waitL, waitR]);
      }
    });

    // 両面
    sozuRealmRunLengths.forEach((run) => {
      if (run.isRealm && run.length === 2) {
        const waitL = run.left - 1;
        const waitR = run.left + run.length;
        if (waitL >= 0 && waitR <= lastIndex) pushWaits([waitL, waitR]);
      }
    });

    // 嵌張
    sozuRealmRunLengths.forEach((run) => {
      if (!run.isRealm && run.length === 1) {
        const wait = run.left;
        if (wait > 0 && wait < lastIndex) pushWaits([wait]);
      }
    });

    // 辺張、あるいは両面の片側
    sozuRealmRunLengths.forEach((run) => {
      if (run.isRealm && run.length >= 2) {
        const waitL = run.left - 1;
        const waitR = run.left + run.length;
        if (waitL >= 0) pushWaits([waitL]);
        if (waitR <= lastIndex) pushWaits([waitR]);
      }
    });

    return waitsList;
  }, [sozuRealmRunLengths]);
  
  /** 表裏それぞれの、聴牌巡目ごとの非領域の取りうる最大の和了回数 */
  const maxPossibleNonRealmWinsByTenpaiTurnEachVisibility = useMemo(() => {
    const emptyResult = { open: [] as number[], closed: [] as number[], total: [] as number[] };
    if (!shouldCalcWins) return emptyResult;
    
    const result = { open: [] as number[], closed: [] as number[], total: [] as number[] };
    
    // 最終巡目の聴牌は0和了確定
    result.open[wallState.maxWall] = 0;
    result.closed[wallState.maxWall] = 0;
    result.total[wallState.maxWall] = 0;
    
    for (let tenpaiTurn = wallState.maxWall - 1; tenpaiTurn >= 0; --tenpaiTurn) {
      const openWinsEachSozu = nonRealmWinsEachSozuByTenpaiTurnEachVisibility.open[tenpaiTurn];
      const closedWinsEachSozu = nonRealmWinsEachSozuByTenpaiTurnEachVisibility.closed[tenpaiTurn];
      const maxPossibleWins = { open: 0, closed: 0 };
      sozuNonRealmWaitsList.forEach(waits => {
        const openWins = waits.reduce((acc, wait) => acc + openWinsEachSozu[wait], 0);
        const closedWins = waits.reduce((acc, wait) => acc + closedWinsEachSozu[wait], 0);
        if (openWins + closedWins > maxPossibleWins.open + maxPossibleWins.closed ) {
          maxPossibleWins.open = openWins;
          maxPossibleWins.closed = closedWins;
        }
      });
      result.open[tenpaiTurn] = maxPossibleWins.open;
      result.closed[tenpaiTurn] = maxPossibleWins.closed;
      result.total[tenpaiTurn] = maxPossibleWins.open + maxPossibleWins.closed;
    }
    return result;
  }, [
    nonRealmWinsEachSozuByTenpaiTurnEachVisibility.closed,
    nonRealmWinsEachSozuByTenpaiTurnEachVisibility.open,
    shouldCalcWins,
    sozuNonRealmWaitsList,
    wallState.maxWall
  ]);
  
  /** 列挙した裏牌により補正された領域牌の和了回数を計算する */
  const calcAdjustedRealmWinsForClosedPermutation = useCallback((turn: number, permutation: SanmaTileOrNonRealm[]) => {
    const permRealmCount = permutation.filter(tile => tile !== "nonRealm").length;
    const permCount = permutation.length;
    
    const newTotalRealmRemainingCount = totalRealmRemainingCount - permRealmCount;
    const newTotalRemainingCount = totalRemainingCount - permCount;
    
    const adjustmentFactor = (newTotalRealmRemainingCount / totalRealmRemainingCount) * (newTotalRemainingCount / totalRemainingCount);
    
    return realmWinsByTenpaiTurnsEachVisibility.open[turn] + realmWinsByTenpaiTurnsEachVisibility.closed[turn] * adjustmentFactor;
  }, [realmWinsByTenpaiTurnsEachVisibility.closed, realmWinsByTenpaiTurnsEachVisibility.open, totalRealmRemainingCount, totalRemainingCount]);
  
  /** 列挙した裏牌により補正された非領域牌の和了回数を計算する */
  const calcAdjustedNonRealmWinsForClosedPermutation = useCallback((turn: number, permutation: SanmaTileOrNonRealm[], tenpai: RealmTenpai) => {
    const permNonRealmCount = permutation.filter(tile => tile === "nonRealm").length;
    const permCount = permutation.length;
    
    const newTotalNonRealmRemainingCount = totalNonRealmRemainingCount - permNonRealmCount;
    const newTotalRemainingCount = totalRemainingCount - permCount;
    
    let openWins = 0;
    let closedWins = 0;
    
    SOZU_TILES.forEach(tile => {
      if (tenpai.nonRealmWinsEachTiles[tile] === 0) return;
      openWins += nonRealmWinsEachSozuByTenpaiTurnEachVisibility.open[turn][tile];
      closedWins += nonRealmWinsEachSozuByTenpaiTurnEachVisibility.closed[turn][tile];
    });
    
    const adjustmentFactor = (newTotalNonRealmRemainingCount / totalNonRealmRemainingCount) * (newTotalRemainingCount / totalRemainingCount);
    
    return openWins + closedWins * adjustmentFactor;
  }, [nonRealmWinsEachSozuByTenpaiTurnEachVisibility.closed, nonRealmWinsEachSozuByTenpaiTurnEachVisibility.open, totalNonRealmRemainingCount, totalRemainingCount]);
  
  /** 列挙した裏牌により補正された非領域の取りうる最大の和了回数を計算する */
  const calcAdjustedMaxPossibleNonRealmWinsForClosedPermutation = useCallback((turn: number, permutation: SanmaTileOrNonRealm[]) => {
    const permNonRealmCount = permutation.filter(tile => tile === "nonRealm").length;
    const permCount = permutation.length;
    
    const newTotalNonRealmRemainingCount = totalNonRealmRemainingCount - permNonRealmCount;
    const newTotalRemainingCount = totalRemainingCount - permCount;
    
    const adjustmentFactor = (newTotalNonRealmRemainingCount / totalNonRealmRemainingCount) * (newTotalRemainingCount / totalRemainingCount);
    
    return maxPossibleNonRealmWinsByTenpaiTurnEachVisibility.open[turn] + maxPossibleNonRealmWinsByTenpaiTurnEachVisibility.closed[turn] * adjustmentFactor;
  }, [maxPossibleNonRealmWinsByTenpaiTurnEachVisibility.closed, maxPossibleNonRealmWinsByTenpaiTurnEachVisibility.open, totalNonRealmRemainingCount, totalRemainingCount]);
  
  return useMemo(() => ({
    realmWinsByTenpaiTurn: realmWinsByTenpaiTurnsEachVisibility.total,
    nonRealmWinsEachSozuByTenpaiTurn: nonRealmWinsEachSozuByTenpaiTurnEachVisibility.total,
    maxPossibleNonRealmWinsByTenpaiTurn: maxPossibleNonRealmWinsByTenpaiTurnEachVisibility.total,
    calcAdjustedRealmWinsForClosedPermutation,
    calcAdjustedNonRealmWinsForClosedPermutation,
    calcAdjustedMaxPossibleNonRealmWinsForClosedPermutation,
  }), [
    realmWinsByTenpaiTurnsEachVisibility.total,
    nonRealmWinsEachSozuByTenpaiTurnEachVisibility.total,
    maxPossibleNonRealmWinsByTenpaiTurnEachVisibility.total,
    calcAdjustedRealmWinsForClosedPermutation,
    calcAdjustedNonRealmWinsForClosedPermutation,
    calcAdjustedMaxPossibleNonRealmWinsForClosedPermutation,
  ]);
};