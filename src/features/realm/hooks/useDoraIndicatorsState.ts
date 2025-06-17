import { useCallback, useEffect, useMemo, useState } from 'react';

import { RealmBoss, SanmaTile } from '@shared/types/simulation';

import { ProgressState } from './useProgressState';

const MAX_DORA_INDICATORS = 10;

export interface DoraIndicatorsState {
  doraIndicators: SanmaTile[];
  maxDoraIndicators: number;
  addDoraIndicator: (tile: SanmaTile) => void;
  removeDoraIndicatorAtIndex: (index: number) => void;
  confirmDoraIndicators: () => void;
  clearDoraIndicators: () => void;
}

export const useDoraIndicatorsState = (
  progressState: ProgressState,
  boss: RealmBoss,
  remainingTiles: Record<SanmaTile, number>,
  initialDoraIndicators: SanmaTile[] = [],
): DoraIndicatorsState => {
  const [doraIndicators, setDoraIndicators] = useState(initialDoraIndicators);
  const maxDoraIndicators = boss === 'dora_indicator' ? 3 : MAX_DORA_INDICATORS;

  useEffect(() => {
    setDoraIndicators(prev => prev.slice(0, maxDoraIndicators));
  }, [maxDoraIndicators]);

  const addDoraIndicator = useCallback((tile: SanmaTile) => {
    if (remainingTiles[tile] === 0) return;
    setDoraIndicators(prev => (prev.length < maxDoraIndicators ? [...prev, tile] : prev));
  }, [remainingTiles, maxDoraIndicators]);

  const removeDoraIndicatorAtIndex = useCallback((index: number) => {
    setDoraIndicators(prev => (prev.length === 0 ? prev : prev.toSpliced(index, 1)));
  }, []);

  const confirmDoraIndicators = useCallback(() => {
    if (progressState.editProgress.isEditing) {
      progressState.goToNextEditPhase();
    } else {
      progressState.goToNextSimulationPhase();
    }
  }, [progressState]);

  const clearDoraIndicators = useCallback(() => {
    setDoraIndicators([]);
  }, []);

  return useMemo(() => ({
    doraIndicators,
    maxDoraIndicators,
    addDoraIndicator,
    removeDoraIndicatorAtIndex,
    confirmDoraIndicators,
    clearDoraIndicators,
  }), [
    doraIndicators,
    maxDoraIndicators,
    addDoraIndicator,
    removeDoraIndicatorAtIndex,
    confirmDoraIndicators,
    clearDoraIndicators,
  ]);
};
