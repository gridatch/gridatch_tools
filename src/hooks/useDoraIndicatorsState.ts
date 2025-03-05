import { useState } from "react";
import { SanmaTile } from "../types/simulation";

export interface UseDoraIndicatorsStateReturn {
  doraIndicators: SanmaTile[];
  addDoraIndicator: (tile: SanmaTile) => void;
  removeDoraIndicatorAtIndex: (index: number) => void;
}

export const useDoraIndicatorsState = (maxDoraIndicators: number, initialDoraIndicators: SanmaTile[] = []): UseDoraIndicatorsStateReturn => {
  const [doraIndicators, setDoraIndicators] = useState(initialDoraIndicators);
  
  const addDoraIndicator = (tile: SanmaTile) => {
    setDoraIndicators((prev) => (prev.length < maxDoraIndicators ? [...prev, tile] : prev));
  };
  
  const removeDoraIndicatorAtIndex = (index: number) => {
    setDoraIndicators((prev) => (prev.length === 0 ? prev : prev.toSpliced(index, 1)));
  };
  
  return { doraIndicators, addDoraIndicator, removeDoraIndicatorAtIndex };
};