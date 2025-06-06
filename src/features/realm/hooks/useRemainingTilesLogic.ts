import { Dispatch, SetStateAction, useEffect, useMemo } from "react";
import { Hand, SANMA_TILE_RECORD_4, SANMA_TILES, SanmaTile, WallTile } from "../../../shared/types/simulation";


export interface RemainingTilesLogic {
  remainingTiles: Record<SanmaTile, number>,
  totalRealmRemainingCount: number,
  totalNonRealmRemainingCount: number,
  totalRemainingCount: number,
}

export const useRemainingTilesLogic = (
  turn: number,
  doraIndicators: SanmaTile[],
  isRealmEachTile: Record<SanmaTile, boolean>,
  wall: WallTile[],
  hand: Hand,
  discardedTiles: Record<SanmaTile, number>,
  remainingTiles: Record<SanmaTile, number>,
  setRemainingTiles: Dispatch<SetStateAction<Record<SanmaTile, number>>>,
): RemainingTilesLogic => {
    
  // 残り牌の計算
  useEffect(() => {
    const newRemainingTiles = { ...SANMA_TILE_RECORD_4 };
  
    doraIndicators.forEach((tile) => {
      --newRemainingTiles[tile];
    });
  
    wall.forEach((tile, i) => {
      if (tile === "closed" || tile === "empty") return;
      if (i <= turn - 1) return;
      --newRemainingTiles[tile];
    });
  
    if (hand.drawn.tile !== "empty" && hand.drawn.tile !== "closed") {
      --newRemainingTiles[hand.drawn.tile];
    }
    SANMA_TILES.forEach((tile) => {
      newRemainingTiles[tile] -= hand.closed[tile].length;
      newRemainingTiles[tile] -= discardedTiles[tile];
    });

    setRemainingTiles(prev => {
      const hasChanged = SANMA_TILES.some(tile => prev[tile] !== newRemainingTiles[tile]);
      return hasChanged ? newRemainingTiles : prev;
    });
  }, [turn, doraIndicators, wall, hand, discardedTiles, setRemainingTiles]);

  const totalRealmRemainingCount = useMemo(() => (
    SANMA_TILES.filter(tile => isRealmEachTile[tile]).reduce((sum, tile) => sum + remainingTiles[tile], 0)
  ), [isRealmEachTile, remainingTiles]);

  const totalNonRealmRemainingCount = useMemo(() => (
    SANMA_TILES.filter(tile => !isRealmEachTile[tile]).reduce((sum, tile) => sum + remainingTiles[tile], 0)
  ), [isRealmEachTile, remainingTiles]);

  const totalRemainingCount = useMemo(() => (
    SANMA_TILES.reduce((sum, tile) => sum + remainingTiles[tile], 0)
  ), [remainingTiles]);
  
  return useMemo(() => ({
    remainingTiles,
    totalRealmRemainingCount,
    totalNonRealmRemainingCount,
    totalRemainingCount,
  }), [
    remainingTiles,
    totalRealmRemainingCount,
    totalNonRealmRemainingCount,
    totalRemainingCount,
  ]);
};