import { useCallback, useMemo, useState } from "react";
import { Hand, INITIAL_HAND, RealmPhaseAction, RealmSimulationProgress, SANMA_TILE_RECORD_0, SANMA_TILES, SanmaTile, TileStatus } from "../types/simulation";
import { RealmProgressState } from "./useRealmProgressState";

const MAX_HAND = 13;

/** 
 * 手牌とその操作関数をまとめたオブジェクト
 */
export interface RealmHandState {
  /** 手牌 */
  hand: Hand;
  /** 捨て牌 */
  discardedTiles: Record<SanmaTile, number>;
  /** 手牌の最大枚数 */
  maxHand: number;
  /** 手牌の枚数 */
  totalTileCount: number;
  /** ツモフェーズ：指定した牌をツモ牌候補に加える。 */
  draw: (tile: SanmaTile) => void;
  /** ツモフェーズ：指定の牌のうち、index 番目の牌のツモ牌候補を取り消す。 */
  cancelDraw: (tile: SanmaTile, index: number) => void;
  /** ツモフェーズ：打牌フェーズへ移行する。ツモ牌候補のうち、領域牌は手牌として確定し、非領域牌は自動的に打牌候補とする。 */
  confirmDraw: () => void;
  /** 打牌フェーズ：指定の牌のうち、index 番目の牌について打牌候補かどうかを切り替える。 */
  toggleDiscard: (tile: SanmaTile, index: number) => void;
  /** 打牌フェーズ：ツモフェーズへ移行する。打牌候補を手牌から捨て、捨て牌に加える。 */
  confirmDiscard: () => void;
  /** 手牌、捨て牌、フェーズをリセットする */
  clearHandState: () => void;
  /** undo が可能かどうか */
  canUndo: boolean;
  /** redo が可能かどうか */
  canRedo: boolean;
  /** 履歴を一つ前に戻す */
  undo: () => void;
  /** 履歴を一つ先に進める */
  redo: () => void;
}

/** 手牌履歴のスナップショット */
interface HandSnapshot {
  progress: RealmSimulationProgress;
  hand: Hand;
  discardedTiles: Record<SanmaTile, number>;
}

/**
 * 領域の手牌のカスタムフック
 * @param {Record<SanmaTile, boolean>} isRealmEachTile 各牌が領域牌かどうか
 * @param {Record<SanmaTile, number>} remainingTiles 各牌の残り枚数
 * @param {Hand} [initialHand] 初期手牌
 * @returns {RealmHandState} 手牌とその操作関数をまとめたオブジェクト
 */
export const useRealmHandState = (
  progressState: RealmProgressState,
  isRealmEachTile: Record<SanmaTile, boolean>,
  remainingTiles: Record<SanmaTile, number>,
  initialHand: Hand = structuredClone(INITIAL_HAND),
): RealmHandState => {
  const {
    simulationProgress: progress,
    setSimulationProgress,
    updatePhaseAction,
  } = progressState;
  
  const [hand, setHand] = useState<Hand>(initialHand);
  const [discardedTiles, setDiscardedTiles] = useState<Record<SanmaTile, number>>({ ...SANMA_TILE_RECORD_0 });

  // 履歴の初期化
  const initialSnapshot: HandSnapshot = {
    progress,
    hand: initialHand,
    discardedTiles: { ...SANMA_TILE_RECORD_0 },
  };
  const [history, setHistory] = useState<HandSnapshot[]>([initialSnapshot]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  /**
   * 履歴にスナップショットを追加する
   * 現在のスナップショットより新しいものは破棄する
   */
  const pushHistory = useCallback((snapshot: HandSnapshot) => {
    setHistory((prev) => prev.slice(0, historyIndex + 1).concat(snapshot));
    setHistoryIndex((prev) => prev + 1);
  }, [historyIndex]);
  
  /**
   * 現在のスナップショット以降のスナップショットを破棄する
   */
  const popHistory = useCallback(() => {
    setHistory((prev) => prev.slice(0, historyIndex));
    setHistoryIndex((prev) => (prev >= 0 ? prev - 1 : -1));
  }, [historyIndex]);
  
  /**
   * 現在のスナップショットを更新する
   * 現在のスナップショットより新しいものは破棄する
   */
  const updateCurrentHistory = useCallback(() => {
    popHistory();
    pushHistory({ progress, hand, discardedTiles });
  }, [progress, hand, discardedTiles, pushHistory, popHistory]);

  const totalTileCount = useMemo(() => (
    Object.values(hand.closed).reduce((acc, arr) => acc + arr.length, 0)
  ), [hand.closed]);

  /** 
   * ツモフェーズ：指定した牌をツモ牌候補に加える。
   */
  const draw = useCallback((tile: SanmaTile) => {
    if (progress.action !== RealmPhaseAction.Draw) return;
    if (remainingTiles[tile] <= 0) return;
    if (totalTileCount >= MAX_HAND) return;
    setHand(prev => ({
      ...prev,
      closed: {
        ...prev.closed,
        [tile]: [...prev.closed[tile], { isSelected: true }]
      },
    }));
  }, [progress.action, remainingTiles, totalTileCount]);

  /** 
   * ツモフェーズ：指定の牌のうち、index 番目の牌のツモ牌候補を取り消す。
   */
  const cancelDraw = useCallback((tile: SanmaTile, index: number) => {
    if (progress.action !== RealmPhaseAction.Draw) return;
    setHand(prev => {
      const statuses = prev.closed[tile];
      if (index < 0 || index >= statuses.length) return prev;
      if (!statuses[index].isSelected) return prev;
      const newStatuses = statuses.filter((_, i) => i !== index);
      return {
        ...prev,
        closed: { ...prev.closed, [tile]: newStatuses },
      };
    });
  }, [progress.action]);

  /** 
   * ツモフェーズ：打牌フェーズへ移行する。ツモ牌候補のうち、領域牌は手牌として確定し、非領域牌は自動的に打牌候補とする。
   */
  const confirmDraw = useCallback(() => {
    if (progress.action !== RealmPhaseAction.Draw) return;
    
    updateCurrentHistory();

    const newClosed = {} as Record<SanmaTile, TileStatus[]>;
    SANMA_TILES.forEach(tile => {
      newClosed[tile] = hand.closed[tile].map(() => {
        return { isSelected: !isRealmEachTile[tile] }
      });
    });
    const newHand: Hand = {
      ...hand,
      closed: newClosed,
    };
    setHand(newHand);
    const newProgress = updatePhaseAction(RealmPhaseAction.Discard);
    const newSnapshot: HandSnapshot = {
      hand: newHand,
      discardedTiles,
      progress: newProgress,
    };
    
    pushHistory(newSnapshot);
  }, [progress.action, updatePhaseAction, isRealmEachTile, hand, discardedTiles, pushHistory, updateCurrentHistory]);

  /** 
   * 打牌フェーズ：指定の牌のうち、index 番目の牌について打牌候補かどうかを切り替える。
   */
  const toggleDiscard = useCallback((tile: SanmaTile, index: number) => {
    if (progress.action !== RealmPhaseAction.Discard) return;
    setHand(prev => {
      const statuses = prev.closed[tile];
      if (index < 0 || index >= statuses.length) return prev;
      const newStatuses = statuses.map((status, i) =>
        i === index ? { isSelected: !status.isSelected } : status
      );
      return {
        ...prev,
        closed: { ...prev.closed, [tile]: newStatuses },
      };
    });
  }, [progress.action]);

  /** 
   * 打牌フェーズ：ツモフェーズへ移行する。打牌候補を手牌から捨て、捨て牌に加える。
   */
  const confirmDiscard = useCallback(() => {
    if (progress.action !== RealmPhaseAction.Discard) return;
    
    updateCurrentHistory();
    
    const newDiscarded: Record<SanmaTile, number> = { ...discardedTiles };
    SANMA_TILES.forEach((tile) => {
      newDiscarded[tile] += hand.closed[tile].filter((status) => status.isSelected).length;
    });
    
    const newClosed: Record<SanmaTile, TileStatus[]> = {} as Record<SanmaTile, TileStatus[]>;
    SANMA_TILES.forEach(tile => {
      newClosed[tile] = hand.closed[tile].filter(status => !status.isSelected);
    });
    const newHand: Hand = {
      ...hand,
      closed: newClosed,
    };
    setDiscardedTiles(newDiscarded);
    setHand(newHand);
    const newProgress = updatePhaseAction(RealmPhaseAction.Draw);
    const newSnapshot: HandSnapshot = {
      progress: newProgress,
      hand: newHand,
      discardedTiles: newDiscarded,
    };
    // 履歴に確定後のスナップショットを追加
    pushHistory(newSnapshot);
  }, [progress.action, updatePhaseAction, hand, discardedTiles, pushHistory, updateCurrentHistory]);
  

  /** undo が可能かどうか */
  const canUndo = historyIndex > 0;
  
  /** redo が可能かどうか */
  const canRedo = historyIndex < history.length - 1;

  /** 履歴を一つ前に戻す */
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const snapshot = history[newIndex];
    setSimulationProgress(snapshot.progress);
    setHand(snapshot.hand);
    setDiscardedTiles(snapshot.discardedTiles);
    setHistoryIndex(newIndex);
  }, [history, historyIndex, setSimulationProgress]);

  /** 履歴を一つ先に進める */
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const snapshot = history[newIndex];
    setSimulationProgress(snapshot.progress);
    setHand(snapshot.hand);
    setDiscardedTiles(snapshot.discardedTiles);
    setHistoryIndex(newIndex);
  }, [history, historyIndex, setSimulationProgress]);

  /** 
   * 手牌、捨て牌、フェーズをリセットする
   */
  const clearHandState = useCallback(() => {
    const clearedState = structuredClone(INITIAL_HAND);
    const clearedDiscarded = { ...SANMA_TILE_RECORD_0 };
    setHand(clearedState);
    setDiscardedTiles(clearedDiscarded);
    setHistory([{
      progress,
      hand: clearedState,
      discardedTiles: clearedDiscarded,
    }]);
    setHistoryIndex(0);
  }, [progress]);

  return {
    hand,
    discardedTiles,
    maxHand: MAX_HAND,
    totalTileCount,
    draw,
    cancelDraw,
    confirmDraw,
    toggleDiscard,
    confirmDiscard,
    canUndo,
    canRedo,
    undo,
    redo,
    clearHandState,
  };
};
