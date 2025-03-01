import { useState } from "react";

export interface UseWallStateReturn {
  wall: string[];
  maxWall: number;
  addTileToWall: (tile: string) => void;
  removeTileFromWallAtIndex: (index: number) => void;
}

export const useWallState = (initialWall: string[] = []): UseWallStateReturn => {
  const [wall, setWall] = useState(initialWall);
  const MAX_WALL = 10;
  
  const addTileToWall = (tile: string) => {
    setWall((prev) => (prev.length < MAX_WALL ? [...prev, tile] : prev));
  };
  
  const removeTileFromWallAtIndex = (index: number) => {
    setWall((prev) => (prev.length === 0 ? prev : prev.toSpliced(index, 1)));
  };
  
  return { wall, maxWall: MAX_WALL, addTileToWall, removeTileFromWallAtIndex };
};