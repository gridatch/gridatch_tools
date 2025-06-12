import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";

import { RealmBoss, SANMA_TILES, SanmaTile, WallTile } from "@shared/types/simulation";

import { ProgressState } from "./useProgressState";

const MAX_WALL = 36;
const DEFAULT_INITIAL_WALL: readonly WallTile[] = Object.freeze(new Array(MAX_WALL).fill(("empty")));

export interface WallState {
  wall: WallTile[];
  maxWall: number;
  usableWallCount: number;
  canConfirmWall: boolean;
  setWall: Dispatch<SetStateAction<WallTile[]>>;
  addTileToWall: (tile: WallTile) => void;
  removeTileFromWallAtIndex: (index: number) => void;
  confirmWall: () => void;
  clearWall: () => void;
}

export const useWallState = (
  progressState: ProgressState,
  boss: RealmBoss,
  remainingTiles: Record<SanmaTile, number>,
  initialWall: WallTile[] = [...DEFAULT_INITIAL_WALL],
): WallState => {
  const [wall, setWall] = useState(initialWall);
  
  const lockCount = boss === "lock" ? 3 : 0;
  
  const usableWallCount = MAX_WALL - lockCount;
  
  const canConfirmWall = useMemo(() => {
    if (wall.some(tile => tile == "empty")) return false;
    if (SANMA_TILES.some(tile => remainingTiles[tile] < 0)) return false;
    return true;
  }, [remainingTiles, wall]);
  
  const addTileToWall = useCallback((tile: WallTile) => {
    if (tile !== "empty" && tile !== "closed" && remainingTiles[tile] === 0) return;
    setWall((prev) => {
      const firstEmptyIndex = prev.findIndex((tile) => tile === "empty");
      if (firstEmptyIndex === -1) return prev;
      
      const newWall = [...prev];
      newWall[firstEmptyIndex] = tile;
      return newWall;
    });
  }, [remainingTiles]);
  
  const removeTileFromWallAtIndex = useCallback((index: number) => {
    setWall((prev) => {
      if (index < 0 || index >= prev.length) return prev;
      
      const newWall = [...prev];
      newWall[index] = "empty";
      return newWall;
    });
  }, []);
    
  const confirmWall = useCallback(() => {
    if (progressState.editProgress.isEditing) {
      progressState.goToNextEditPhase();
    } else {
      progressState.goToNextSimulationPhase();
    }
  }, [progressState]);
    
  const clearWall = useCallback(() => {
    setWall([...DEFAULT_INITIAL_WALL]);
  }, []);
  
  return useMemo(() => ({
    wall,
    maxWall: MAX_WALL,
    usableWallCount,
    canConfirmWall,
    setWall,
    addTileToWall,
    removeTileFromWallAtIndex,
    confirmWall,
    clearWall,
  }), [
    wall,
    usableWallCount,
    canConfirmWall,
    addTileToWall,
    removeTileFromWallAtIndex,
    confirmWall,
    clearWall,
  ]);
};