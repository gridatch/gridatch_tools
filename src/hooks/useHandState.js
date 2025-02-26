import { useState } from "react";

export const useHandState = (initialHand = { 
  sequenceCount: 0, 
  tripletCount: 0, 
  head: false, 
  singles: {} 
}) => {
  // 手牌は順子、刻子、ヘッド、単体牌（索子）に分類
  // 単体牌: { [tile]: count }（例："1s": 2）
  const [hand, setHand] = useState(initialHand);
  const MAX_HAND = 12;
  
  const getTotalHandCount = () => {
    const seqCount = hand.sequenceCount * 3;
    const tripCount = hand.tripletCount * 3;
    const headCount = hand.head ? 2 : 0;
    const singlesCount = Object.values(hand.singles).reduce((sum, c) => sum + c, 0);
    return seqCount + tripCount + headCount + singlesCount;
  };
  
  const addHandTile = (tile) => {
    if (getTotalHandCount() + 1 > MAX_HAND) return;
    setHand((prev) => {
      const count = prev.singles[tile] || 0;
      if (count >= 4) return prev;
      return { ...prev, singles: { ...prev.singles, [tile]: count + 1 } };
    });
  };
  
  const removeSingle = (tile) => {
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
  
  const currentSetCount = hand.sequenceCount + hand.tripletCount + (hand.head ? 1 : 0);
  
  const addSequenceSet = () => {
    if (getTotalHandCount() + 3 > MAX_HAND) return;
    if (currentSetCount >= 2) return;
    setHand((prev) => ({ ...prev, sequenceCount: prev.sequenceCount + 1 }));
  };
  
  const addTripletSet = () => {
    if (getTotalHandCount() + 3 > MAX_HAND) return;
    if (currentSetCount >= 2) return;
    setHand((prev) => ({ ...prev, tripletCount: prev.tripletCount + 1 }));
  };
  
  const addHeadSet = () => {
    if (getTotalHandCount() + 2 > MAX_HAND) return;
    if (currentSetCount >= 2) return;
    if (hand.head) return;
    setHand((prev) => ({ ...prev, head: true }));
  };
  
  const removeSequenceSet = () => {
    if (hand.sequenceCount > 0) {
      setHand((prev) => ({ ...prev, sequenceCount: prev.sequenceCount - 1 }));
    }
  };
  
  const removeTripletSet = () => {
    if (hand.tripletCount > 0) {
      setHand((prev) => ({ ...prev, tripletCount: prev.tripletCount - 1 }));
    }
  };
  
  const removeHeadSet = () => {
    if (hand.head) {
      setHand((prev) => ({ ...prev, head: false }));
    }
  };
  
  return { 
    hand, 
    maxHand: MAX_HAND, 
    addHandTile, 
    removeSingle, 
    addSequenceSet, 
    addTripletSet, 
    addHeadSet, 
    removeSequenceSet, 
    removeTripletSet, 
    removeHeadSet 
  };
};
