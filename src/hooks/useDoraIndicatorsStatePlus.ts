import { Dispatch, SetStateAction, useEffect, useState } from "react";
import { DoraBoss, SanmaTile } from "../types/simulation";

const MAX_DORA_INDICATORS = 10;

export interface UseDoraIndicatorsStateReturn {
  doraIndicators: SanmaTile[];
  maxDoraIndicators: number;
  addDoraIndicator: (tile: SanmaTile) => void;
  removeDoraIndicatorAtIndex: (index: number) => void;
  clearDoraIndicator: () => void;
  doraIndicatorsConfirmed: boolean;
  setDoraIndicatorsConfirmed: Dispatch<SetStateAction<boolean>>;
}

export const useDoraIndicatorsState = (
  doraBoss: DoraBoss,
  remainingTiles: Record<SanmaTile, number>,
  initialDoraIndicators: SanmaTile[] = []
): UseDoraIndicatorsStateReturn => {
  const [doraIndicators, setDoraIndicators] = useState(initialDoraIndicators);
  const maxDoraIndicators = doraBoss === "dora_indicator" ? 3 : MAX_DORA_INDICATORS;
  const [doraIndicatorsConfirmed, setDoraIndicatorsConfirmed] = useState(false);
  
  useEffect(() => {
    setDoraIndicators((prev) => prev.slice(0, maxDoraIndicators));
  }, [maxDoraIndicators]);
  
  const addDoraIndicator = (tile: SanmaTile) => {
    if (remainingTiles[tile] === 0) return;
    // setRemainingTiles((prev) => ({ ...prev, [tile]: prev[tile] - 1 }));
    setDoraIndicators((prev) => (prev.length < maxDoraIndicators ? [...prev, tile] : prev));
  };
  
  const removeDoraIndicatorAtIndex = (index: number) => {
    // setRemainingTiles((prev) => ({ ...prev, [doraIndicators[index]]: prev[doraIndicators[index]] + 1 }));
    setDoraIndicators((prev) => (prev.length === 0 ? prev : prev.toSpliced(index, 1)));
  };
    
  const clearDoraIndicator = () => {
    setDoraIndicators([]);
  };
  
  return {
    doraIndicators,
    maxDoraIndicators,
    addDoraIndicator,
    removeDoraIndicatorAtIndex,
    clearDoraIndicator,
    doraIndicatorsConfirmed,
    setDoraIndicatorsConfirmed
  };
};