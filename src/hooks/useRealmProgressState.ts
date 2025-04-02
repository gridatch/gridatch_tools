import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { RealmPhase, RealmPhaseAction, RealmEditProgress, RealmSimulationProgress, RealmEditPhase } from "../types/simulation";

export interface RealmProgressState {
  simulationProgress: RealmSimulationProgress;
  editProgress: RealmEditProgress;
  setSimulationProgress: Dispatch<SetStateAction<RealmSimulationProgress>>
  enterEditMode: () => void;
  goToNextEditPhase: () => void;
  goToNextSimulationPhase: (action?: RealmPhaseAction) => RealmSimulationProgress;
  updatePhaseAction: (action: RealmPhaseAction) => RealmSimulationProgress;
  goToNextTurn: (action: RealmPhaseAction) => RealmSimulationProgress;
  clearRealmProgress: () => void;
}

export const useRealmProgressState = (): RealmProgressState => {
  const initialSimulationProgress: RealmSimulationProgress = Object.freeze({
    phase: RealmPhase.Boss,
    turn: 0,
  });
  const initialSimulationEditProgress: RealmEditProgress = Object.freeze({
    isEditing: false,
  });

  const [simulationProgress, setSimulationProgress] = useState<RealmSimulationProgress>({ ...initialSimulationProgress });
  const [editProgress, setEditProgress] = useState<RealmEditProgress>({ ...initialSimulationEditProgress });
  
  const enterEditMode = useCallback(() => {
    setEditProgress(prev => {
      if (prev.isEditing) {
        console.warn("Already in edit mode");
        return prev
      }
      return { isEditing: true, phase: RealmEditPhase.Boss }
    })
  }, []);

  /**
   * 次の編集フェーズへ移行する
   */
  const goToNextEditPhase = useCallback(() => {
    setEditProgress(prev => {
      if (!prev.isEditing) {
        console.warn("Not in edit mode");
        return prev;
      }
      switch (prev.phase) {
        case RealmEditPhase.Boss:
          return { isEditing: true, phase: RealmEditPhase.DoraIndicators };
        case RealmEditPhase.DoraIndicators:
          return { isEditing: true, phase: RealmEditPhase.Wall };
        case RealmEditPhase.Wall:
          return { isEditing: false };
        default:
          console.error("Failed to go to next edit phase");
          return prev;
      }
    })
  }, []);

  /**
   * 次のシミュレーションフェーズへ移行する
   */
  const goToNextSimulationPhase = useCallback((action?: RealmPhaseAction): RealmSimulationProgress => {
    if (editProgress.isEditing) {
      console.warn("In edit mode");
      return simulationProgress;
    }
    
    let newState: RealmSimulationProgress;
    switch (simulationProgress.phase) {
      case RealmPhase.Boss:
        if (action) console.warn("Unnecessary action specified");
        newState = { phase: RealmPhase.DoraIndicators, turn: simulationProgress.turn };
        break;
      case RealmPhase.DoraIndicators:
        if (action) console.warn("Unnecessary action specified");
        newState = { phase: RealmPhase.Wall, turn: simulationProgress.turn };
        break;
      case RealmPhase.Wall:
        if (action) console.warn("Unnecessary action specified");
        newState = { phase: RealmPhase.Exchange, action: RealmPhaseAction.Draw, turn: simulationProgress.turn };
        break;
      case RealmPhase.Exchange:
        if (!action) {
          console.error("Action required");
          newState = simulationProgress;
          break;
        }
        newState = { phase: RealmPhase.Main, action, turn: simulationProgress.turn };
        break;
      default:
        console.error("Failed to go to next phase");
        newState = simulationProgress;
        break;
    }
    setSimulationProgress(newState);
    return newState;
  }, [editProgress.isEditing, simulationProgress]);

  /**
   * フェーズが Exchange または Main の場合に、action を更新する
   */
  const updatePhaseAction = useCallback((action: RealmPhaseAction): RealmSimulationProgress => {
    if (simulationProgress.phase !== RealmPhase.Exchange && simulationProgress.phase !== RealmPhase.Main) {
      console.warn("Invalid setPhaseAction");
      return simulationProgress;
    }
    const newState: RealmSimulationProgress = { ...simulationProgress, action };
    setSimulationProgress(newState);
    return newState;
  }, [simulationProgress]);

  /**
   * 次の巡目に進める（turn を 1 増やす）
   */
  const goToNextTurn = useCallback((action: RealmPhaseAction): RealmSimulationProgress => {
    if (simulationProgress.phase !== RealmPhase.Main) {
      console.warn("Invalid goToNextTurn");
      return simulationProgress;
    }
    const newState: RealmSimulationProgress = { ...simulationProgress, action, turn: simulationProgress.turn + 1 };
    setSimulationProgress(newState);
    return newState
  }, [simulationProgress]);

  /**
   * 進行状況を初期状態にリセットする
   */
  const clearRealmProgress = useCallback(() => {
    setSimulationProgress({ ...initialSimulationProgress });
    setEditProgress({ ...initialSimulationEditProgress })
  }, [initialSimulationProgress, initialSimulationEditProgress]);

  return useMemo(() => ({
    simulationProgress,
    editProgress,
    setSimulationProgress,
    enterEditMode,
    goToNextEditPhase,
    goToNextSimulationPhase,
    updatePhaseAction,
    goToNextTurn,
    clearRealmProgress,
  }), [
    simulationProgress,
    editProgress,
    setSimulationProgress,
    enterEditMode,
    goToNextEditPhase,
    goToNextSimulationPhase,
    updatePhaseAction,
    goToNextTurn,
    clearRealmProgress,
  ]);
};
