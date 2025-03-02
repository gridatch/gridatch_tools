import { useState } from "react";
import { Sozu } from "../types/simulation";

export interface UseWallStateReturn {
  wall: Sozu[];
  maxWall: number;
  addTileToWall: (tile: Sozu) => void;
  removeTileFromWallAtIndex: (index: number) => void;
}

export const useWallState = (initialWall: Sozu[] = []): UseWallStateReturn => {
  const [wall, setWall] = useState(initialWall);
  const MAX_WALL = 10;
  
  const addTileToWall = (tile: Sozu) => {
    setWall((prev) => (prev.length < MAX_WALL ? [...prev, tile] : prev));
  };
  
  const removeTileFromWallAtIndex = (index: number) => {
    setWall((prev) => (prev.length === 0 ? prev : prev.toSpliced(index, 1)));
  };
  
  return { wall, maxWall: MAX_WALL, addTileToWall, removeTileFromWallAtIndex };
};