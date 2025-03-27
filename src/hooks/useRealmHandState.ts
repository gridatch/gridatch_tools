import { useState } from "react";
import { HandState, INITIAL_HAND_STATE, SANMA_TILE_RECORD_0, SANMA_TILES, SanmaTile, TileStatus } from "../types/simulation";

const MAX_HAND = 13;

/** 
 * 手牌とその操作関数をまとめたオブジェクト
 */
export interface UseRealmHandStateReturn {
  /** ツモフェーズ or 打牌フェーズ */
  isDrawPhase: boolean;
  /** 手牌 */
  handState: HandState;
  /** 捨て牌 */
  discardedTiles: Record<SanmaTile, number>;
  /** 手牌の最大枚数 */
  maxHand: number;
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
interface HandStateSnapshot {
  handState: HandState;
  discardedTiles: Record<SanmaTile, number>;
  isDrawPhase: boolean;
}

/**
 * 領域の手牌のカスタムフック
 * @param {Record<SanmaTile, boolean>} isRealmEachTile 各牌が領域牌かどうか
 * @param {Record<SanmaTile, number>} remainingTiles 各牌の残り枚数
 * @param {HandState} [initialHandState] 初期手牌
 * @returns {UseRealmHandStateReturn} 手牌とその操作関数をまとめたオブジェクト
 */
export const useRealmHandState = (
  isRealmEachTile: Record<SanmaTile, boolean>,
  remainingTiles: Record<SanmaTile, number>,
  initialHandState?: HandState
): UseRealmHandStateReturn => {
  const initialState: HandState = initialHandState ? initialHandState : structuredClone(INITIAL_HAND_STATE);

  const [handState, setHandState] = useState<HandState>(initialState);
  const [discardedTiles, setDiscardedTiles] = useState<Record<SanmaTile, number>>({ ...SANMA_TILE_RECORD_0 });
  const [isDrawPhase, setIsDrawPhase] = useState<boolean>(true);

  // 履歴の初期化
  const initialSnapshot: HandStateSnapshot = {
    handState: initialState,
    discardedTiles: { ...SANMA_TILE_RECORD_0 },
    isDrawPhase: true,
  };
  const [history, setHistory] = useState<HandStateSnapshot[]>([initialSnapshot]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  /**
   * 履歴にスナップショットを追加する
   * 現在のスナップショットより新しいものは破棄する
   */
  const pushHistory = (snapshot: HandStateSnapshot) => {
    setHistory((prev) => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, snapshot];
    });
    setHistoryIndex((prev) => prev + 1);
  };
  
  /**
   * 現在のスナップショット以降のスナップショットを破棄する
   */
  const popHistory = () => {
    setHistory((prev) => prev.slice(0, historyIndex));
    setHistoryIndex((prev) => (prev >= 0 ? prev - 1 : -1));
  };

  const getTotalTileCount = (): number =>
    Object.values(handState.closed).reduce((acc, arr) => acc + arr.length, 0);

  /** 
   * ツモフェーズ：指定した牌をツモ牌候補に加える。
   */
  const draw = (tile: SanmaTile) => {
    if (!isDrawPhase) return;
    if (remainingTiles[tile] <= 0) return;
    if (getTotalTileCount() >= MAX_HAND) return;
    setHandState(prev => ({
      ...prev,
      closed: {
        ...prev.closed,
        [tile]: [...prev.closed[tile], { isSelected: true }]
      },
    }));
  };

  /** 
   * ツモフェーズ：指定の牌のうち、index 番目の牌のツモ牌候補を取り消す。
   */
  const cancelDraw = (tile: SanmaTile, index: number) => {
    if (!isDrawPhase) return;
    setHandState(prev => {
      const statuses = prev.closed[tile];
      if (index < 0 || index >= statuses.length) return prev;
      if (!statuses[index].isSelected) return prev;
      const newStatuses = statuses.filter((_, i) => i !== index);
      return {
        ...prev,
        closed: { ...prev.closed, [tile]: newStatuses },
      };
    });
  };

  /** 
   * ツモフェーズ：打牌フェーズへ移行する。ツモ牌候補のうち、領域牌は手牌として確定し、非領域牌は自動的に打牌候補とする。
   */
  const confirmDraw = () => {
    if (!isDrawPhase) return;
    // 履歴から現在のindexのスナップショットを削除
    popHistory();

    // 履歴に確定前のスナップショットを追加
    const pendingSnapshot: HandStateSnapshot = {
      handState: handState,
      discardedTiles: { ...discardedTiles },
      isDrawPhase: true,
    };
    pushHistory(pendingSnapshot);

    const newClosed = {} as Record<SanmaTile, TileStatus[]>;
    SANMA_TILES.forEach(tile => {
      newClosed[tile] = handState.closed[tile].map(() => {
        return { isSelected: !isRealmEachTile[tile] }
      });
    });
    const newHandState: HandState = {
      ...handState,
      closed: newClosed,
    };
    setHandState(newHandState);
    setIsDrawPhase(false);
    const confirmedSnapshot: HandStateSnapshot = {
      handState: newHandState,
      discardedTiles: { ...discardedTiles },
      isDrawPhase: false,
    };
    // 履歴に確定後のスナップショットを追加
    pushHistory(confirmedSnapshot);
  };

  /** 
   * 打牌フェーズ：指定の牌のうち、index 番目の牌について打牌候補かどうかを切り替える。
   */
  const toggleDiscard = (tile: SanmaTile, index: number) => {
    if (isDrawPhase) return;
    setHandState(prev => {
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
  };

  /** 
   * 打牌フェーズ：ツモフェーズへ移行する。打牌候補を手牌から捨て、捨て牌に加える。
   */
  const confirmDiscard = () => {
    if (isDrawPhase) return;
    // 履歴から現在のindexのスナップショットを削除
    popHistory();

    // 履歴に確定前のスナップショットを追加
    const pendingSnapshot: HandStateSnapshot = {
      handState: handState,
      discardedTiles: { ...discardedTiles },
      isDrawPhase: false,
    };
    pushHistory(pendingSnapshot);

    const selectedCounts: Record<SanmaTile, number> = {} as Record<SanmaTile, number>;
    SANMA_TILES.forEach((tile) => {
      selectedCounts[tile] = handState.closed[tile].filter((status) => status.isSelected).length;
    });
    const newDiscarded: Record<SanmaTile, number> = { ...discardedTiles };
    SANMA_TILES.forEach((tile) => {
      newDiscarded[tile] = (newDiscarded[tile] || 0) + selectedCounts[tile];
    });
    const newClosed: Record<SanmaTile, TileStatus[]> = {} as Record<SanmaTile, TileStatus[]>;
    SANMA_TILES.forEach(tile => {
      newClosed[tile] = handState.closed[tile].filter(status => !status.isSelected);
    });
    const newHandState: HandState = {
      ...handState,
      closed: newClosed,
    };
    setDiscardedTiles(newDiscarded);
    setHandState(newHandState);
    setIsDrawPhase(true);
    const confirmedSnapshot: HandStateSnapshot = {
      handState: newHandState,
      discardedTiles: newDiscarded,
      isDrawPhase: true,
    };
    // 履歴に確定後のスナップショットを追加
    pushHistory(confirmedSnapshot);
  };
  

  /** undo が可能かどうか */
  const canUndo = historyIndex > 0;
  
  /** redo が可能かどうか */
  const canRedo = historyIndex < history.length - 1;

  /** 履歴を一つ前に戻す */
  const undo = () => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    const snapshot = history[newIndex];
    setHandState(snapshot.handState);
    setDiscardedTiles(snapshot.discardedTiles);
    setIsDrawPhase(snapshot.isDrawPhase);
    setHistoryIndex(newIndex);
  };

  /** 履歴を一つ先に進める */
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const snapshot = history[newIndex];
    setHandState(snapshot.handState);
    setDiscardedTiles(snapshot.discardedTiles);
    setIsDrawPhase(snapshot.isDrawPhase);
    setHistoryIndex(newIndex);
  };

  /** 
   * 手牌、捨て牌、フェーズをリセットする
   */
  const clearHandState = () => {
    const clearedState = structuredClone(INITIAL_HAND_STATE);
    const clearedDiscarded = { ...SANMA_TILE_RECORD_0 };
    setHandState(clearedState);
    setDiscardedTiles(clearedDiscarded);
    setIsDrawPhase(true);
    const initialSnapshot: HandStateSnapshot = {
      handState: clearedState,
      discardedTiles: clearedDiscarded,
      isDrawPhase: true,
    };
    setHistory([initialSnapshot]);
    setHistoryIndex(0);
  };

  return {
    isDrawPhase,
    handState,
    discardedTiles,
    maxHand: MAX_HAND,
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
