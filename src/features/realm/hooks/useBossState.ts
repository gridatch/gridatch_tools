import { Dispatch, SetStateAction, useCallback, useMemo, useState } from 'react';

import { RealmBoss } from '@shared/types/simulation';

import { ProgressState } from './useProgressState';

export interface BossState {
  boss: RealmBoss;
  setBoss: Dispatch<SetStateAction<RealmBoss>>;
  confirmBoss: () => void;
  clearBoss: () => void;
}

export const useBossState = (progressState: ProgressState): BossState => {
  const initialBoss: RealmBoss = 'empty';
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
