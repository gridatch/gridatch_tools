import { useState } from "react";

export const useWallState = (initialWall = []) => {
  const [wall, setWall] = useState(initialWall);
  const MAX_WALL = 10;
  
  const addTileToWall = (tile) => {
    setWall((prev) => (prev.length < MAX_WALL ? [...prev, tile] : prev));
  };
  
  const removeTileFromWallAtIndex = (index) => {
    setWall((prev) => (prev.length === 0 ? prev : prev.toSpliced(index, 1)));
  };
  
  return { wall, maxWall: MAX_WALL, addTileToWall, removeTileFromWallAtIndex };
};