import { useState } from "react";
import { HandState, INITIAL_HAND_STATE, SANMA_TILE_RECORD_0, SANMA_TILES, SanmaTile, TileStatus, WallTile } from "../types/simulation";

const MAX_HAND = 13;

/** 
 * 手牌とその操作関数をまとめたオブジェクト
 */
export interface UseRealmHandStateReturn {
  /** 牌交換中のツモステップか打牌ステップか */
  isExchangeDrawStep: boolean;
  /** 手牌 */
  handState: HandState;
  /** 捨て牌 */
  discardedTiles: Record<SanmaTile, number>;
  /** 手牌の最大枚数 */
  maxHand: number;
  /** 牌交換フェーズのツモステップ：指定の牌のうち、index 番目の牌のツモ牌候補を取り消す。 */
  cancelExchangeDraw: (tile: SanmaTile, index: number) => void;
  /** 牌交換フェーズのツモステップ：打牌ステップへ移行する。ツモ牌候補のうち、領域牌は手牌として確定し、非領域牌は自動的に打牌候補とする。 */
  confirmExchangeDraw: () => void;
  /** 牌交換フェーズの打牌ステップ：ツモステップへ移行する。打牌候補を手牌から捨て、捨て牌に加える。 */
  /** 牌交換フェーズが完了したか */
  exchangesConfirmed: boolean;
  /** 牌交換フェーズの打牌ステップからメインフェーズへ移行する。手牌を確定し、牌山の先頭を選択する。 */
  confirmExchanges: () => void;
  /** メインフェーズのツモ牌を指す牌山のインデックス */
  currentWallIndex: number;
  draw: (tile: SanmaTile) => void;
  discard: (tile: SanmaTile, index: number) => void;
  confirmDiscard: () => void;
  /** undo が可能かどうか */
  canUndo: boolean;
  /** redo が可能かどうか */
  canRedo: boolean;
  /** 履歴を一つ前に戻す */
  undo: () => void;
  /** 履歴を一つ先に進める */
  redo: () => void;
  /** 手牌、捨て牌、フェーズをリセットする */
  clearHandState: () => void;
}

/** 手牌履歴のスナップショット */
interface HandStateSnapshot {
  handState: HandState;
  discardedTiles: Record<SanmaTile, number>;
  isExchangeDrawStep: boolean;
  exchangesConfirmed: boolean;
  currentWallIndex: number;
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
  wall: WallTile[],
  initialHandState?: HandState
): UseRealmHandStateReturn => {
  const initialState: HandState = initialHandState ? initialHandState : structuredClone(INITIAL_HAND_STATE);

  const [handState, setHandState] = useState<HandState>(initialState);
  const [discardedTiles, setDiscardedTiles] = useState<Record<SanmaTile, number>>({ ...SANMA_TILE_RECORD_0 });
  const [isExchangeDrawStep, setIsDrawPhase] = useState<boolean>(true);

  // 履歴の初期化
  const initialSnapshot: HandStateSnapshot = {
    handState: initialState,
    discardedTiles: { ...SANMA_TILE_RECORD_0 },
    isExchangeDrawStep: true,
    exchangesConfirmed: false,
    currentWallIndex: -1,
  };
  const [history, setHistory] = useState<HandStateSnapshot[]>([initialSnapshot]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [exchangesConfirmed, setExchangesConfirmed] = useState(false);

  // メインフェーズ
  // ツモ牌を指す牌山のインデックス（UI側で牌山からの牌を逐次設定するための目安）
  const [currentWallIndex, setCurrentWallIndex] = useState<number>(-1);
  
  /**
   * 現在の状態に変更があった項目のみを上書きし、
   * 変更のなかった項目は現在の state の値をそのまま使う createSnapshot 関数
   */
  const createSnapshot = (changes: Partial<HandStateSnapshot> = {}): HandStateSnapshot => ({
    handState: changes.handState ?? handState,
    discardedTiles: changes.discardedTiles ?? { ...discardedTiles },
    isExchangeDrawStep: changes.isExchangeDrawStep ?? isExchangeDrawStep,
    exchangesConfirmed: changes.exchangesConfirmed ?? exchangesConfirmed,
    currentWallIndex: changes.currentWallIndex ?? currentWallIndex,
  });

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
    SANMA_TILES.reduce((acc, tile) => acc + handState.closed[tile].length, 0);

  /** 牌交換フェーズのツモステップ：指定した牌をツモ牌候補に加える。 */
  const exchangeDraw = (tile: SanmaTile) => {
    if (!isExchangeDrawStep) return;
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

  /** 牌交換フェーズのツモステップ：指定の牌のうち、index 番目の牌のツモ牌候補を取り消す。 */
  const cancelExchangeDraw = (tile: SanmaTile, index: number) => {
    if (!isExchangeDrawStep) return;
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

  /** 牌交換フェーズのツモステップ：打牌ステップへ移行する。ツモ牌候補のうち、領域牌は手牌として確定し、非領域牌は自動的に打牌候補とする。 */
  const confirmExchangeDraw = () => {
    if (!isExchangeDrawStep) return;
    // 履歴から現在のindexのスナップショットを削除
    popHistory();

    // 履歴に確定前のスナップショットを追加
    pushHistory(createSnapshot());

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
    // 履歴に確定後のスナップショットを追加
    pushHistory(createSnapshot({ handState: newHandState, isExchangeDrawStep: false }));
  };

  /** 牌交換フェーズの打牌ステップ：指定の牌のうち、index 番目の牌について打牌候補かどうかを切り替える。 */
  const toggleExchangeDiscard = (tile: SanmaTile, index: number) => {
    if (isExchangeDrawStep) return;
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

  /** 牌交換フェーズの打牌ステップ：ツモステップへ移行する。打牌候補を手牌から捨て、捨て牌に加える。 */
  const confirmExchangeDiscard = () => {
    if (isExchangeDrawStep) return;
    // 履歴から現在のindexのスナップショットを削除
    popHistory();

    // 履歴に確定前のスナップショットを追加
    pushHistory(createSnapshot());

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
    // 履歴に確定後のスナップショットを追加
    pushHistory(createSnapshot({
      handState: newHandState,
      discardedTiles: newDiscarded,
      isExchangeDrawStep: true,
    }));
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
    console.dir(history);
    setHandState(snapshot.handState);
    setDiscardedTiles(snapshot.discardedTiles);
    setIsDrawPhase(snapshot.isExchangeDrawStep);
    setExchangesConfirmed(snapshot.exchangesConfirmed);
    setCurrentWallIndex(snapshot.currentWallIndex);
    setHistoryIndex(newIndex);
  };

  /** 履歴を一つ先に進める */
  const redo = () => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    const snapshot = history[newIndex];
    setHandState(snapshot.handState);
    setDiscardedTiles(snapshot.discardedTiles);
    setIsDrawPhase(snapshot.isExchangeDrawStep);
    setExchangesConfirmed(snapshot.exchangesConfirmed);
    setCurrentWallIndex(snapshot.currentWallIndex);
    setHistoryIndex(newIndex);
  };

  /** 牌交換フェーズの打牌ステップからメインフェーズへ移行する。手牌を確定し、牌山の先頭を選択する。 */
  const confirmExchanges = () => {
    if (isExchangeDrawStep) return;
    const newClosed: Record<SanmaTile, TileStatus[]> = {} as Record<SanmaTile, TileStatus[]>;
    SANMA_TILES.forEach(tile => {
      newClosed[tile] = handState.closed[tile].map(() => ({ isSelected: false }));
    });
    const newCurrentWallIndex = 0;
    const newDrawnTile = wall[newCurrentWallIndex];
    const newHandState: HandState = {
      closed: newClosed,
      drawn: {
        tile: newDrawnTile,
        isClosed: newDrawnTile === "closed",
        isSelected: false,
      }
    };
    setHandState(newHandState);
    setExchangesConfirmed(true);
    setCurrentWallIndex(newCurrentWallIndex);
    
    pushHistory(createSnapshot({
      handState: newHandState,
      exchangesConfirmed: true,
      currentWallIndex: newCurrentWallIndex,
    }));
  };

  /** メインフェーズでツモ牌の裏牌の種類を選択する。 */
  const selectClosedTile = (tile: SanmaTile) => {
    if (!exchangesConfirmed) return;
    // 現在の交換対象牌が "closed" である場合のみ反映
    if (!handState.drawn.isClosed) return;

    setHandState(prev => ({
      ...prev,
      drawn: { ...prev.drawn, tile }
    }));
  };

  /**
   * メインフェーズで手牌とツモ牌の中から打牌候補を1枚選択し、他の牌の選択を解除する。
   * @param tile 対象の牌の種類
   * @param index 対象の牌の中のindex、ツモ牌の場合は -1
   * @returns 
   */
  const mainDiscard = (tile: SanmaTile, index: number) => {
    if (!exchangesConfirmed) return;

    const newHandState = structuredClone(handState);
    // 手牌の全ての牌の選択を解除する
    SANMA_TILES.forEach(t => {
      newHandState.closed[t].forEach(status => status.isSelected = false);
    });
    newHandState.drawn.isSelected = false;
  
    if (index === -1) {
      // ツモ牌を選択
      newHandState.drawn.isSelected = true;
    } else {
      // 指定された手牌を選択
      newHandState.closed[tile][index].isSelected = true;
    }
  
    setHandState(newHandState);
  };

  /** メインフェーズで手牌とツモ牌の中から選択されている牌を1枚打牌する。 */
  const confirmMainDiscard = () => {
    if (!exchangesConfirmed) return;

    const drawnTile = handState.drawn.tile;
    if (drawnTile === "closed" || drawnTile === "empty") {
      console.error(`confirmMainDiscard: ツモ牌が"${drawnTile}"です。`);
      return;
    }

    const selectedClosedTiles: { tile: SanmaTile; index: number }[] = [];
    SANMA_TILES.forEach(tile => {
      handState.closed[tile].forEach((status, index) => {
        if (status.isSelected) {
          selectedClosedTiles.push({ tile, index });
        }
      });
    });
    const drawnSelected = handState.drawn.isSelected;
    const totalSelected = (drawnSelected ? 1 : 0) + selectedClosedTiles.length;
    if (totalSelected > 1) {
      console.error("confirmMainDiscard: 複数の牌が選択されています。");
      return;
    }

    // 現在のindexのスナップショットを更新
    popHistory();
    pushHistory(createSnapshot());

    const newDiscarded = { ...discardedTiles };
    const newCurrentWallIndex = currentWallIndex + 1;
    const newDrawnTile = wall[newCurrentWallIndex];
    const newHandState = {
      ...handState,
      drawn: { tile: newDrawnTile, isClosed: newDrawnTile === "closed", isSelected: false },
    };
  
    if (drawnSelected) {
      // ツモ切りの場合
      newDiscarded[drawnTile] += 1;
    } else if (selectedClosedTiles.length === 1) {
      // 手出しの場合
      const { tile, index } = selectedClosedTiles[0];
      newDiscarded[tile] += 1;
      const newClosed = { ...handState.closed };
      newClosed[tile] = newClosed[tile].filter((_, i) => i !== index);
      newClosed[drawnTile] = [
        ...newClosed[drawnTile],
        { isSelected: false }
      ];
      newHandState.closed = newClosed;
    }
  
    setDiscardedTiles(newDiscarded);
    setHandState(newHandState);
    setCurrentWallIndex(newCurrentWallIndex);
    pushHistory(createSnapshot({
      handState: newHandState,
      discardedTiles: newDiscarded,
      currentWallIndex: newCurrentWallIndex,
    }));
  };

  /** ツモ牌選択のラッパー。交換フェーズではツモ牌候補を選択、メインフェーズでは裏牌のツモ牌を選択 */
  const draw = (tile: SanmaTile) => {
    if (!exchangesConfirmed) {
      exchangeDraw(tile);
    } else {
      if (handState.drawn.isClosed) selectClosedTile(tile);
    }
  };

  /**
   * 捨て牌選択のラッパー。交換フェーズでは捨て牌候補を選択、メインフェーズでは捨て牌を選択
   * 
   * @param tile 対象牌
   * @param index 対象牌の中のindex、ツモ切りの場合は -1
   */
  const discard = (tile: SanmaTile, index: number) => {
    if (!exchangesConfirmed) {
      toggleExchangeDiscard(tile, index);
    } else {
      mainDiscard(tile, index);
    }
  };

  /**
   * 選択されている牌を打牌するラッパー
   */
  const confirmDiscard = () => {
    if (!exchangesConfirmed) {
      confirmExchangeDiscard();
    } else {
      confirmMainDiscard();
    }
  };
  

  /** 手牌、捨て牌、フェーズをリセットする */
  const clearHandState = () => {
    const clearedState = structuredClone(INITIAL_HAND_STATE);
    const clearedDiscarded = { ...SANMA_TILE_RECORD_0 };
    setHandState(clearedState);
    setDiscardedTiles(clearedDiscarded);
    setIsDrawPhase(true);
    setExchangesConfirmed(false);
    setCurrentWallIndex(-1);
    const initialSnapshot: HandStateSnapshot = {
      handState: clearedState,
      discardedTiles: clearedDiscarded,
      isExchangeDrawStep: true,
      exchangesConfirmed: false,
      currentWallIndex: -1,
    };
    setHistory([initialSnapshot]);
    setHistoryIndex(0);
  };

  return {
    isExchangeDrawStep,
    handState,
    discardedTiles,
    maxHand: MAX_HAND,
    cancelExchangeDraw,
    confirmExchangeDraw,
    confirmDiscard,
    exchangesConfirmed,
    confirmExchanges,
    currentWallIndex,
    draw,
    discard,
    canUndo,
    canRedo,
    undo,
    redo,
    clearHandState,
  };
};
