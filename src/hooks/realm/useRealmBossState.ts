import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { RealmBoss } from "../../types/simulation";
import { RealmProgressState } from "./useRealmProgressState";


export interface RealmBossState {
  boss: RealmBoss;
  setBoss: Dispatch<SetStateAction<RealmBoss>>;
  confirmBoss: () => void;
  clearBoss: () => void;
}

export const useRealmBossState = (progressState: RealmProgressState): RealmBossState => {
  const initialBoss: RealmBoss = "empty";
  const [boss, setBoss] = useState<RealmBoss>(initialBoss);
    
  const confirmBoss = useCallback(() => {
    if (progressState.editProgress.isEditing) {
      progressState.goToNextEditPhase();
    } else {
      progressState.goToNextSimulationPhase();
    }
  }, [progressState]);
    
  const clearBoss = useCallback(() => {
    setBoss(initialBoss);
  }, []);
  
  return useMemo(() => ({ boss, setBoss, confirmBoss, clearBoss }), [boss, confirmBoss, clearBoss]);
};