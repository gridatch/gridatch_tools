import { useState } from "react";
import { SanmaTile, WallTile } from "../types/simulation";

const MAX_WALL = 30;

export interface useRealmWallStateReturn {
  wall: WallTile[];
  maxWall: number;
  addTileToWall: (tile: WallTile) => void;
  removeTileFromWallAtIndex: (index: number) => void;
  clearWall: () => void;
  wallConfirmed: boolean;
  setWallConfirmed: (wallConfirmed: boolean) => void;
}

export const useRealmWallState = (
  remainingTiles: Record<SanmaTile, number>,
  initialWall: WallTile[] = new Array(MAX_WALL).fill("empty"),
): useRealmWallStateReturn => {
  const [wall, setWall] = useState(initialWall);
  const [wallConfirmed, setWallConfirmed] = useState(false);
  
  const addTileToWall = (tile: WallTile) => {
    if (tile !== "empty" && tile !== "closed" && remainingTiles[tile] === 0) return;
    const emptyIndex = wall.findIndex((tile) => tile === "empty");
    if (emptyIndex === -1) return;
    setWall((prevWall) => {
      const newWall = [...prevWall];
      newWall[emptyIndex] = tile;
      return newWall;
    });
  };
  
  const removeTileFromWallAtIndex = (index: number) => {
    setWall((prevWall) => {
      if (index < 0 || index >= prevWall.length) {
        return prevWall;
      }
      const newWall = [...prevWall];
      newWall[index] = "empty";
      return newWall;
    });
  };
    
  const clearWall = () => {
    setWall(initialWall);
  };
  
  return {
    wall,
    maxWall: MAX_WALL,
    addTileToWall,
    removeTileFromWallAtIndex,
    clearWall,
    wallConfirmed,
    setWallConfirmed,
  };
};