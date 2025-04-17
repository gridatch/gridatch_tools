import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { Hand, INITIAL_HAND, RealmSimulationProgress, SANMA_TILE_RECORD_0, SANMA_TILES, SanmaTile, WallTile } from "../types/simulation";
import { RealmProgressState } from "./useRealmProgressState";
import { RealmSnapshot, useRealmHistoryState } from "./useRealmHistoryState";

const MAX_HAND = 13;

export interface RealmHandState {
  hand: Hand;
  setHand: Dispatch<SetStateAction<Hand>>;
  discardedTiles: Record<SanmaTile, number>;
  setDiscardedTiles: Dispatch<SetStateAction<Record<SanmaTile, number>>>;
  maxHand: number;
  handTileCount: number;
  pushHistory: (snapshotDiff: Partial<RealmSnapshot>) => void;
  updateCurrentHistory: (snapshotDiff?: Partial<RealmSnapshot>) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clearHandState: () => void;
}

/** 手牌履歴のスナップショット */
interface HandSnapshot {
  progress: RealmSimulationProgress;
  hand: Hand;
  discardedTiles: Record<SanmaTile, number>;
}

/**
 * 領域の手牌のカスタムフック
 * @param isRealmEachTile 各牌が領域牌かどうか
 * @param remainingTiles 各牌の残り枚数
 * @param wall 牌山
 * @param initialHand 初期手牌
 * @returns 手牌とその操作関数をまとめたオブジェクト
 */
export const useRealmHandState = (
  progressState: RealmProgressState,
  isRealmEachTile: Record<SanmaTile, boolean>,
  remainingTiles: Record<SanmaTile, number>,
  wall: WallTile[],
  initialHand: Hand = structuredClone(INITIAL_HAND),
): RealmHandState => {
  const {
    simulationProgress: progress,
    setSimulationProgress,
  } = progressState;

  const [hand, setHand] = useState<Hand>(initialHand);
  const [discardedTiles, setDiscardedTiles] = useState<Record<SanmaTile, number>>({ ...SANMA_TILE_RECORD_0 });

  const getSnapshot = useCallback((): HandSnapshot => ({
    progress,
    hand,
    discardedTiles,
  }), [progress, hand, discardedTiles]);

  // 手牌履歴のスナップショットを適用する関数
  const applySnapshot = useCallback((snapshot: HandSnapshot) => {
    setSimulationProgress(snapshot.progress);
    setHand(snapshot.hand);
    setDiscardedTiles(snapshot.discardedTiles);
  }, [setSimulationProgress]);

  // 手牌履歴の初期化
  const initialSnapshot: HandSnapshot = {
    progress,
    hand: initialHand,
    discardedTiles: { ...SANMA_TILE_RECORD_0 },
  };
  const historyState = useRealmHistoryState(initialSnapshot, getSnapshot, applySnapshot);

  const handTileCount = useMemo(() => (
    SANMA_TILES.reduce((acc, tile) => acc + hand.closed[tile].length, 0)
  ), [hand.closed]);
  
  /** 手牌、捨て牌、手牌履歴をリセットする */
  const clearHandState = useCallback(() => {
    const clearedState = structuredClone(INITIAL_HAND);
    const clearedDiscarded = { ...SANMA_TILE_RECORD_0 };
    setHand(clearedState);
    setDiscardedTiles(clearedDiscarded);
    historyState.clearHistory();
  }, [historyState]);

  return {
    hand,
    setHand,
    discardedTiles,
    setDiscardedTiles,
    maxHand: MAX_HAND,
    handTileCount,
    pushHistory: historyState.pushHistory,
    updateCurrentHistory: historyState.updateCurrentHistory,
    canUndo: historyState.canUndo,
    canRedo: historyState.canRedo,
    undo: historyState.undo,
    redo: historyState.redo,
    clearHandState,
  };
};
