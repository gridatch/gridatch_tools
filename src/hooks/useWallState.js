import { useState } from "react";

export const useWallState = (initialWall = []) => {
  const [wall, setWall] = useState(initialWall);
  const MAX_WALL = 10;
  
  const addWall = (tile) => {
    setWall((prev) => (prev.length < MAX_WALL ? [...prev, tile] : prev));
  };
  
  const removeWall = (index) => {
    setWall((prev) => (prev.length === 0 ? prev : prev.toSpliced(index, 1)));
  };
  
  return { wall, maxWall: MAX_WALL, addWall, removeWall };
};