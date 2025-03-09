import { useState } from "react";
import { Sozu } from "../types/simulation";

export interface UseWallStateReturn {
  wall: Sozu[];
  addTileToWall: (tile: Sozu) => void;
  removeTileFromWallAtIndex: (index: number) => void;
  clearWall: () => void;
}

export const useWallState = (maxWall: number, initialWall: Sozu[] = []): UseWallStateReturn => {
  const [wall, setWall] = useState(initialWall);
  
  const addTileToWall = (tile: Sozu) => {
    setWall((prev) => (prev.length < maxWall ? [...prev, tile] : prev));
  };
  
  const removeTileFromWallAtIndex = (index: number) => {
    setWall((prev) => (prev.length === 0 ? prev : prev.toSpliced(index, 1)));
  };
  
  const clearWall = () => {
    setWall([]);
  };
  
  return { wall, addTileToWall, removeTileFromWallAtIndex, clearWall };
};