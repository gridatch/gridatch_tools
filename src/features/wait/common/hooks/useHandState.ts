import { useState } from "react";

import { produce } from "immer";

import { INITIAL_SOZU_HAND, SozuHand, HAND_COMPONENTS, HAND_COMPONENTS_TILE_COUNT, HandComponent, PINZU_BLOCKS, isSozuTile, Sozu } from "@shared/types/simulation";

export interface UseHandStateReturn {
  hand: SozuHand;
  addComponentToHand: (component: HandComponent) => void;
  removeComponentFromHand: (component: HandComponent) => void;
  draw: () => void;
  clearHand: () => void;
}

export const useHandState = (
  maxHand: number,
  wall: Sozu[],
  removeTileFromWallAtIndex: (index: number) => void,
  initialHand: SozuHand = INITIAL_SOZU_HAND,
): UseHandStateReturn => {
  const [hand, setHand] = useState(initialHand);
  
  const getClosedHandCount = (hand: SozuHand) => {
    return HAND_COMPONENTS.reduce((sum, component) => sum + HAND_COMPONENTS_TILE_COUNT[component] * hand.closed[component], 0);

  };
  
  const addComponentToHand = (component: HandComponent) => {
    const tileCount = HAND_COMPONENTS_TILE_COUNT[component];
    setHand((prev) => (
      produce(prev, draft => {
        const closedCount = getClosedHandCount(prev);
        if (PINZU_BLOCKS.some(block => block === component)) {
          if (closedCount + tileCount > maxHand) return;
          if (draft.closed.sequence + draft.closed.triplet + draft.closed.pair >= 2) return;
          if (component === "pair" && draft.closed.pair >= 1) return;
          ++draft.closed[component];
        }
        if (isSozuTile(component)) {
          if (draft.closed[component] >= 4) return;
          if (draft.drawn !== "empty") return;
          if (closedCount === maxHand) {
            draft.drawn = component;
          } else {
            ++draft.closed[component];
          }
        }
      })
    ));
  };
  
  const removeComponentFromHand = (component: HandComponent) => {
    setHand((prev) => (
      produce(prev, draft => {
        if (draft.drawn === component) {
          draft.drawn = "empty";
          return;
        } 
        if (draft.closed[component] === 0) return;
        --draft.closed[component];
        if (draft.drawn !== "empty") {
          ++draft.closed[draft.drawn];
          draft.drawn = "empty";
        }
      })
    ));
  };

  const draw = () => {
    if (wall.length === 0) return;
    if (hand.drawn !== "empty") return;
    addComponentToHand(wall[0]);
    removeTileFromWallAtIndex(0);
  };
  
  const clearHand = () => {
    setHand(INITIAL_SOZU_HAND);
  };
  
  return { hand, addComponentToHand, removeComponentFromHand, draw, clearHand };
};
