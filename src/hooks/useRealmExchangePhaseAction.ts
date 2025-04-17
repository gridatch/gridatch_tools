import { useCallback, useMemo } from "react";
import { RealmPhaseAction, SANMA_TILES, SanmaTile, TileStatus } from "../types/simulation";
import { RealmProgressState } from "./useRealmProgressState";
import { RealmHandState } from "./useRealmHandState";

export interface ExchangePhaseActions {
  canConfirmExchangeAction: boolean;
  canConfirmExchangePhase: boolean;
  exchangeDraw: (tile: SanmaTile) => void;
  cancelExchangeDraw: (tile: SanmaTile, index: number) => void;
  confirmExchangeDraw: () => void;
  toggleExchangeDiscard: (tile: SanmaTile, index: number) => void;
  confirmExchangeDiscard: () => void;
  refreshExchangeHandAfterEditMode: () => void;
}

export const useExchangePhaseActions = (
  progressState: RealmProgressState,
  isRealmEachTile: Record<SanmaTile, boolean>,
  remainingTiles: Record<SanmaTile, number>,
  handState: RealmHandState,
): ExchangePhaseActions => {
  const {
    simulationProgress: progress,
    updatePhaseAction,
  } = progressState;

  const {
    hand,
    maxHand,
    handTileCount,
    setHand,
    discardedTiles,
    setDiscardedTiles,
    pushHistory,
    updateCurrentHistory,
  } = handState;
  
  /** 牌交換フェーズ：ツモ・打牌の決定ができるかどうか */
  const canConfirmExchangeAction: boolean = useMemo(() => {
    switch (progress.action) {
      case RealmPhaseAction.Draw:
        return handTileCount === maxHand;
      case RealmPhaseAction.Discard:
        return SANMA_TILES.some(tile => hand.closed[tile].some(status => status.isSelected));
      default:
        return false;
    }
  }, [hand.closed, handTileCount, maxHand, progress.action]);
  
  /** 牌交換フェーズ：ツモ・打牌の決定ができるかどうか */
  const canConfirmExchangePhase: boolean = useMemo(() => progress.action === RealmPhaseAction.Discard, [progress.action]);

  /** 牌交換フェーズ > ツモアクション：指定した牌をツモ牌候補として手牌に加える */
  const exchangeDraw = useCallback((tile: SanmaTile) => {
    if (progress.action !== RealmPhaseAction.Draw) return;
    if (remainingTiles[tile] <= 0) return;
    if (handTileCount >= maxHand) return;
    
    setHand(prev => ({
      ...prev,
      closed: {
        ...prev.closed,
        [tile]: [...prev.closed[tile], { isSelected: true }]
      }
    }));
  }, [maxHand, progress.action, remainingTiles, setHand, handTileCount]);

  /** 牌交換フェーズ > ツモアクション：指定したツモ牌候補を手牌から外す */
  const cancelExchangeDraw = useCallback((tile: SanmaTile, index: number) => {
    if (progress.action !== RealmPhaseAction.Draw) return;
    
    setHand(prev => {
      const statuses = prev.closed[tile];
      if (index < 0 || index >= statuses.length) return prev;
      if (!statuses[index].isSelected) return prev;
      const newStatuses = statuses.filter((_, i) => i !== index);
      return { ...prev, closed: { ...prev.closed, [tile]: newStatuses } };
    });
  }, [progress.action, setHand]);

  /** 牌交換フェーズ > ツモアクション：打牌アクションへ移行する。自動的に非領域牌を次の打牌アクションの打牌候補とする。 */
  const confirmExchangeDraw = useCallback(() => {
    if (progress.action !== RealmPhaseAction.Draw) return;
    
    updateCurrentHistory({ progress, hand, discardedTiles });
    
    const newProgress = updatePhaseAction(RealmPhaseAction.Discard);
    
    const newClosed: Record<SanmaTile, TileStatus[]> = {} as Record<SanmaTile, TileStatus[]>;
    SANMA_TILES.forEach(tile => {
      newClosed[tile] = hand.closed[tile].map(() => ({ isSelected: !isRealmEachTile[tile] }));
    });
    const newHand = { ...hand, closed: newClosed };
    setHand(newHand);
    
    pushHistory({ progress: newProgress, hand: newHand, discardedTiles });
  }, [discardedTiles, hand, isRealmEachTile, progress, pushHistory, setHand, updateCurrentHistory, updatePhaseAction]);

  /** 牌交換フェーズ > 打牌アクション：指定の牌について打牌候補かどうかの選択を切り替える。 */
  const toggleExchangeDiscard = useCallback((tile: SanmaTile, index: number) => {
    if (progress.action !== RealmPhaseAction.Discard) return;

    setHand(prev => {
      const statuses = prev.closed[tile];
      if (index < 0 || index >= statuses.length) return prev;
      const newStatuses = statuses.map((status, i) => i === index ? { isSelected: !status.isSelected } : status);
      return { ...prev, closed: { ...prev.closed, [tile]: newStatuses } };
    });
  }, [progress.action, setHand]);

  /** 牌交換フェーズ > 打牌アクション：打牌候補を手牌から捨て、捨て牌に加える。ツモアクションへ移行する。 */
  const confirmExchangeDiscard = useCallback(() => {
    if (progress.action !== RealmPhaseAction.Discard) return;
    
    updateCurrentHistory({ progress, hand, discardedTiles });

    const newClosed: Record<SanmaTile, TileStatus[]> = {} as Record<SanmaTile, TileStatus[]>;
    SANMA_TILES.forEach(tile => {
      newClosed[tile] = hand.closed[tile].filter(status => !status.isSelected);
    });
    const newHand = { ...hand, closed: newClosed };

    const newDiscarded = { ...discardedTiles };
    SANMA_TILES.forEach(tile => {
      newDiscarded[tile] += hand.closed[tile].filter(status => status.isSelected).length;
    });

    const newProgress = updatePhaseAction(RealmPhaseAction.Draw);
    setHand(newHand);
    setDiscardedTiles(newDiscarded);
    pushHistory({ progress: newProgress, hand: newHand, discardedTiles: newDiscarded });
  }, [discardedTiles, hand, progress, pushHistory, setDiscardedTiles, setHand, updateCurrentHistory, updatePhaseAction]);

  const refreshExchangeHandAfterEditMode = useCallback(() => {
    if (progress.action === RealmPhaseAction.Draw) {
      updateCurrentHistory();
      return;
    }
    
    const newClosed: Record<SanmaTile, TileStatus[]> = {} as Record<SanmaTile, TileStatus[]>;
    SANMA_TILES.forEach(tile => {
      newClosed[tile] = hand.closed[tile].map(() => ({ isSelected: !isRealmEachTile[tile] }));
    });
    const newHand = { ...hand, closed: newClosed };
    
    setHand(newHand);
    updateCurrentHistory({ hand: newHand });
  }, [hand, isRealmEachTile, progress.action, setHand, updateCurrentHistory]);

  return useMemo(() => ({
    canConfirmExchangeAction,
    canConfirmExchangePhase,
    exchangeDraw,
    cancelExchangeDraw,
    confirmExchangeDraw,
    toggleExchangeDiscard,
    confirmExchangeDiscard,
    refreshExchangeHandAfterEditMode,
  }), [
    canConfirmExchangeAction,
    canConfirmExchangePhase,
    exchangeDraw,
    cancelExchangeDraw,
    confirmExchangeDraw,
    toggleExchangeDiscard,
    confirmExchangeDiscard,
    refreshExchangeHandAfterEditMode,
  ]);
};
