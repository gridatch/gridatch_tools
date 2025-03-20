import { useState } from "react";
import { HandState, SANMA_TILE_RECORD_0, SANMA_TILES, SanmaTile } from "../types/simulation";

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
  const defaultInitialHandState: HandState = {} as HandState;
  SANMA_TILES.forEach(tile => {
    defaultInitialHandState[tile] = [];
  });
  const initialState: HandState = initialHandState ? initialHandState : defaultInitialHandState;

  const [handState, setHandState] = useState<HandState>(initialState);
  const [discardedTiles, setDiscardedTiles] = useState<Record<SanmaTile, number>>({ ...SANMA_TILE_RECORD_0 });
  const [isDrawPhase, setIsDrawPhase] = useState<boolean>(true);

  const getTotalTileCount = (): number =>
    Object.values(handState).reduce((acc, arr) => acc + arr.length, 0);

  /** 
   * ツモフェーズ：指定した牌をツモ牌候補に加える。
   */
  const draw = (tile: SanmaTile) => {
    if (!isDrawPhase) return;
    if (remainingTiles[tile] <= 0) return;
    if (getTotalTileCount() >= MAX_HAND) return;
    setHandState(prev => ({
      ...prev,
      [tile]: [...prev[tile], "pending"]
    }));
  };

  /** 
   * ツモフェーズ：指定の牌のうち、index 番目の牌のツモ牌候補を取り消す。
   */
  const cancelDraw = (tile: SanmaTile, index: number) => {
    if (!isDrawPhase) return;
    setHandState(prev => {
      const tileStatuses = prev[tile];
      if (index < 0 || index >= tileStatuses.length) return prev;
      if (tileStatuses[index] !== "pending") return prev;
      const newStatuses = tileStatuses.filter((_, i) => i !== index);
      return { ...prev, [tile]: newStatuses };
    });
  };

  /** 
   * ツモフェーズ：打牌フェーズへ移行する。ツモ牌候補のうち、領域牌は手牌として確定し、非領域牌は自動的に打牌候補とする。
   */
  const confirmDraw = () => {
    if (!isDrawPhase) return;
    setHandState(prev => {
      const newState: HandState = { ...prev };
      SANMA_TILES.forEach(tile => {
        newState[tile] = newState[tile].map(() =>
          isRealmEachTile[tile] ? "confirmed" : "pending"
        );
      });
      return newState;
    });
    setIsDrawPhase(false);
  };

  /** 
   * 打牌フェーズ：指定の牌のうち、index 番目の牌について打牌候補かどうかを切り替える。
   */
  const toggleDiscard = (tile: SanmaTile, index: number) => {
    if (isDrawPhase) return;
    setHandState(prev => {
      const tileStatuses = prev[tile];
      if (index < 0 || index >= tileStatuses.length) return prev;
      const newStatuses = [...tileStatuses];
      newStatuses[index] = newStatuses[index] === "confirmed" ? "pending" : "confirmed";
      return { ...prev, [tile]: newStatuses };
    });
  };

  /** 
   * 打牌フェーズ：ツモフェーズへ移行する。打牌候補を手牌から捨て、捨て牌に加える。
   */
  const confirmDiscard = () => {
    if (isDrawPhase) return;
    const pendingCounts: Record<SanmaTile, number> = {} as Record<SanmaTile, number>;
    SANMA_TILES.forEach(tile => {
      pendingCounts[tile] = handState[tile].filter(status => status === "pending").length;
    });
    setDiscardedTiles(prev => {
      const updated = { ...prev };
      SANMA_TILES.forEach(tile => {
        updated[tile] = (updated[tile] || 0) + pendingCounts[tile];
      });
      return updated;
    });
    setHandState(prev => {
      const newState: HandState = { ...prev };
      SANMA_TILES.forEach(tile => {
        newState[tile] = newState[tile].filter(status => status === "confirmed");
      });
      return newState;
    });
    setIsDrawPhase(true);
  };

  /** 
   * 手牌、捨て牌、フェーズをリセットする
   */
  const clearHandState = () => {
    setHandState({ ...defaultInitialHandState });
    setDiscardedTiles({ ...SANMA_TILE_RECORD_0 });
    setIsDrawPhase(true);
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
    clearHandState,
  };
};
