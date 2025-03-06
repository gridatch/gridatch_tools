import { useEffect, useState } from "react";
import { DoraBoss, SanmaTile } from "../types/simulation";

const MAX_DORA_INDICATORS = 10;

export interface UseDoraIndicatorsStateReturn {
  doraIndicators: SanmaTile[];
  maxDoraIndicators: number;
  addDoraIndicator: (tile: SanmaTile) => void;
  removeDoraIndicatorAtIndex: (index: number) => void;
}

export const useDoraIndicatorsState = (doraBoss: DoraBoss, initialDoraIndicators: SanmaTile[] = []): UseDoraIndicatorsStateReturn => {
  const [doraIndicators, setDoraIndicators] = useState(initialDoraIndicators);
  const maxDoraIndicators = doraBoss === "dora_indicator" ? 3 : MAX_DORA_INDICATORS;
  
  useEffect(() => {
    setDoraIndicators((prev) => prev.slice(0, maxDoraIndicators));
  }, [maxDoraIndicators]);
  
  const addDoraIndicator = (tile: SanmaTile) => {
    setDoraIndicators((prev) => (prev.length < maxDoraIndicators ? [...prev, tile] : prev));
  };
  
  const removeDoraIndicatorAtIndex = (index: number) => {
    setDoraIndicators((prev) => (prev.length === 0 ? prev : prev.toSpliced(index, 1)));
  };
  
  return { doraIndicators, maxDoraIndicators, addDoraIndicator, removeDoraIndicatorAtIndex };
};