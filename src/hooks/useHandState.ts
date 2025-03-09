import { useState } from "react";
import { INITIAL_HAND, Hand, HAND_COMPONENTS, HAND_COMPONENTS_TILE_COUNT, HandComponent, PINZU_BLOCKS, SOZU_TILES } from "../types/simulation";

export interface UseHandStateReturn {
  handState: Hand;
  addComponentToHand: (component: HandComponent) => void;
  removeComponentFromHand: (component: HandComponent) => void;
  clearHand: () => void;
}

export const useHandState = (maxHand: number, initialHand: Hand = INITIAL_HAND): UseHandStateReturn => {
  const [handState, setHandState] = useState(initialHand);
  
  const getTotalHandCount = (hand: Hand) => {
    return HAND_COMPONENTS.reduce((sum, component) => sum + HAND_COMPONENTS_TILE_COUNT[component] * hand[component], 0);
  };
  
  const addComponentToHand = (component: HandComponent) => {
    const tileCount = HAND_COMPONENTS_TILE_COUNT[component];
    setHandState((prev) => {
      if (getTotalHandCount(prev) + tileCount > maxHand) return prev;
      
      if (PINZU_BLOCKS.some(block => block === component)) {
        if (handState.sequence + handState.triplet + handState.pair >= 2) return prev;
        if (component === "pair" && handState.pair >= 1) return prev;
      }
      
      if (SOZU_TILES.some(tile => tile === component) && prev[component] >= 4)  return prev;
      return { ...prev, [component]: prev[component] + 1 };
    });
  };
  
  const removeComponentFromHand = (component: HandComponent) => {
    setHandState((prev) => {
      if (prev[component] === 0) return prev;
      return { ...prev, [component]: prev[component] - 1 };
    });
  };
  
  const clearHand = () => {
    setHandState(INITIAL_HAND);
  };
  
  return { handState, addComponentToHand, removeComponentFromHand, clearHand };
};
