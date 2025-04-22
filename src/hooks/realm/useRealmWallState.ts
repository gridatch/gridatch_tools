import { useCallback, useMemo, useState } from "react";
import { SanmaTile, WallTile } from "../../types/simulation";
import { RealmProgressState } from "./useRealmProgressState";

const MAX_WALL = 36;
const DEFAULT_INITIAL_WALL: readonly WallTile[] = Object.freeze(new Array(MAX_WALL).fill(("empty")));

export interface RealmWallState {
  wall: WallTile[];
  maxWall: number;
  addTileToWall: (tile: WallTile) => void;
  removeTileFromWallAtIndex: (index: number) => void;
  confirmWall: () => void;
  clearWall: () => void;
}

export const useRealmWallState = (
  progressState: RealmProgressState,
  remainingTiles: Record<SanmaTile, number>,
  initialWall: WallTile[] = [...DEFAULT_INITIAL_WALL],
): RealmWallState => {
  const [wall, setWall] = useState(initialWall);
  
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
    addTileToWall,
    removeTileFromWallAtIndex,
    confirmWall,
    clearWall,
  }), [
    wall,
    addTileToWall,
    removeTileFromWallAtIndex,
    confirmWall,
    clearWall,
  ]);
};