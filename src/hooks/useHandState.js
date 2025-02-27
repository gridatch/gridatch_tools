import { useState } from "react";

export const useHandState = (initialHand = { 
  sequenceCount: 0, 
  tripletCount: 0, 
  hasPair: false,
  singles: {} 
}) => {
  // 手牌は順子、刻子、ヘッド、単体牌（索子）に分類
  // 単体牌: { [tile]: count }（例："1s": 2）
  const [hand, setHand] = useState(initialHand);
  const MAX_HAND = 12;
  
  const getTotalHandCount = () => {
    const seqTileCount = hand.sequenceCount * 3;
    const tripTileCount = hand.tripletCount * 3;
    const pairTileCount = hand.hasPair ? 2 : 0;
    const singlesTileCount = Object.values(hand.singles).reduce((sum, c) => sum + c, 0);
    return seqTileCount + tripTileCount + pairTileCount + singlesTileCount;
  };
  
  const addTileToHand = (tile) => {
    if (getTotalHandCount() + 1 > MAX_HAND) return;
    setHand((prev) => {
      const count = prev.singles[tile] || 0;
      if (count >= 4) return prev;
      return { ...prev, singles: { ...prev.singles, [tile]: count + 1 } };
    });
  };
  
  const addSequenceToHand = () => {
    if (getTotalHandCount() + 3 > MAX_HAND) return;
    if (hand.sequenceCount + hand.tripletCount + (hand.hasPair ? 1 : 0) >= 2) return;
    setHand((prev) => ({ ...prev, sequenceCount: prev.sequenceCount + 1 }));
  };
  
  const addTripletToHand = () => {
    if (getTotalHandCount() + 3 > MAX_HAND) return;
    if (hand.sequenceCount + hand.tripletCount + (hand.hasPair ? 1 : 0) >= 2) return;
    setHand((prev) => ({ ...prev, tripletCount: prev.tripletCount + 1 }));
  };
  
  const addPairToHand = () => {
    if (getTotalHandCount() + 2 > MAX_HAND) return;
    if (hand.sequenceCount + hand.tripletCount + (hand.hasPair ? 1 : 0) >= 2) return;
    if (hand.hasPair) return;
    setHand((prev) => ({ ...prev, hasPair: true }));
  };
  
  const removeTileFromHand = (tile) => {
    setHand((prev) => {
      const count = prev.singles[tile] || 0;
      if (count <= 1) {
        const newSingles = { ...prev.singles };
        delete newSingles[tile];
        return { ...prev, singles: newSingles };
      } else {
        return { ...prev, singles: { ...prev.singles, [tile]: count - 1 } };
      }
    });
  };
  
  const removeSequenceFromHand = () => {
    if (hand.sequenceCount > 0) {
      setHand((prev) => ({ ...prev, sequenceCount: prev.sequenceCount - 1 }));
    }
  };
  
  const removeTripletFromHand = () => {
    if (hand.tripletCount > 0) {
      setHand((prev) => ({ ...prev, tripletCount: prev.tripletCount - 1 }));
    }
  };
  
  const removePairFromHand = () => {
    if (hand.hasPair) {
      setHand((prev) => ({ ...prev, hasPair: false }));
    }
  };
  
  return { 
    hand,
    maxHand: MAX_HAND,
    addTileToHand,
    addSequenceToHand,
    addTripletToHand,
    addPairToHand,
    removeTileFromHand,
    removeSequenceFromHand,
    removeTripletFromHand,
    removePairFromHand
  };
};
