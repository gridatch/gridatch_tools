import { Dispatch, SetStateAction, useCallback, useMemo, useState } from "react";
import { RealmPhase, RealmPhaseAction, RealmEditProgress, RealmSimulationProgress, RealmEditPhase, WallTile } from "../types/simulation";

export interface ProcessingState {
  percent: number;
  setPercent: Dispatch<SetStateAction<number>>;
  isBusy: boolean;
  setIsBusy: Dispatch<SetStateAction<boolean>>;
}

export interface RealmProgressState {
  simulationProgress: RealmSimulationProgress;
  editProgress: RealmEditProgress;
  setSimulationProgress: Dispatch<SetStateAction<RealmSimulationProgress>>
  enterEditMode: () => void;
  goToNextEditPhase: () => void;
  goToNextSimulationPhase: (wall?: WallTile[]) => RealmSimulationProgress;
  updatePhaseAction: (action: RealmPhaseAction) => RealmSimulationProgress;
  goToNextTurn: (wall: WallTile[]) => RealmSimulationProgress;
  clearRealmProgress: () => void;
  processingState: ProcessingState;
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
  
  const [percent, setPercent] = useState(0);
  const [isBusy, setIsBusy] = useState(false);
  const processingState = useMemo(() => (
    { percent, setPercent, isBusy, setIsBusy }
  ), [isBusy, percent]);
  
  /**
   * 編集モードに入る
   */
  const enterEditMode = useCallback(() => {
    setEditProgress(prev => {
      if (prev.isEditing) {
        console.error("[goToNextEditPhase] Already in edit mode.");
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
        console.error("[goToNextEditPhase] Not in edit mode.");
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
          console.error("[goToNextEditPhase] Invalid phase.");
          return prev;
      }
    })
  }, []);

  /**
   * 次のシミュレーションフェーズへ移行する
   * メインフェーズへ移行する場合、最初のツモ牌が表牌の場合は打牌アクション、裏牌の場合はツモアクションに設定する
   */
  const goToNextSimulationPhase = useCallback((wall?: WallTile[]): RealmSimulationProgress => {
    if (editProgress.isEditing) {
      console.error("[goToNextSimulationPhase] In edit mode.");
      return simulationProgress;
    }
    
    let newState: RealmSimulationProgress;
    switch (simulationProgress.phase) {
      case RealmPhase.Boss: {
        if (wall) console.warn("[goToNextSimulationPhase] Unnecessary wall specified.");
        newState = { phase: RealmPhase.DoraIndicators, turn: 0 };
        break;
      }
      case RealmPhase.DoraIndicators: {
        if (wall) console.warn("[goToNextSimulationPhase] Unnecessary wall specified.");
        newState = { phase: RealmPhase.Wall, turn: 0 };
        break;
      }
      case RealmPhase.Wall: {
        if (wall) console.warn("[goToNextSimulationPhase] Unnecessary wall specified.");
        newState = { phase: RealmPhase.Exchange, action: RealmPhaseAction.Draw, turn: 0 };
        break;
      }
      case RealmPhase.Exchange: {
        if (!wall) {
          console.error("[goToNextSimulationPhase] Wall required.");
          newState = simulationProgress;
          break;
        }
        const newTurn = 1;
        const newAction = (wall[newTurn - 1] === "closed") ? RealmPhaseAction.Draw : RealmPhaseAction.Discard;
        newState = { phase: RealmPhase.Main, action: newAction, turn: newTurn };
        break;
      }
      default: {
        console.error("[goToNextSimulationPhase] Unexpected phase.", simulationProgress.phase);
        newState = simulationProgress;
        break;
      }
    }
    setSimulationProgress(newState);
    return newState;
  }, [editProgress.isEditing, simulationProgress]);

  /**
   * 牌交換フェーズかメインフェーズのアクションを更新する
   */
  const updatePhaseAction = useCallback((action: RealmPhaseAction): RealmSimulationProgress => {
    if (simulationProgress.phase !== RealmPhase.Exchange && simulationProgress.phase !== RealmPhase.Main) {
      console.error("[updatePhaseAction] Unexpected phase.", simulationProgress.phase);
      return simulationProgress;
    }
    const newState: RealmSimulationProgress = { ...simulationProgress, action };
    setSimulationProgress(newState);
    return newState;
  }, [simulationProgress]);

  /**
   * メインフェーズで次の巡目に進み、ツモ牌が表牌の場合は打牌アクション、裏牌の場合はツモアクションに設定する
   */
  const goToNextTurn = useCallback((wall: WallTile[]): RealmSimulationProgress => {
    if (simulationProgress.phase !== RealmPhase.Main) {
      console.error("[goToNextTurn] Unexpected phase.", simulationProgress.phase);
      return simulationProgress;
    }
    if (!wall) {
      console.error("[goToNextTurn] Wall required.");
      return simulationProgress;
    }
    const newTurn = simulationProgress.turn + 1;
    if (newTurn - 1 >= wall.length) {
      console.error("[goToNextTurn] No wall tiles left.");
      return simulationProgress;
    }
    const newAction = (wall[newTurn - 1] === "closed") ? RealmPhaseAction.Draw : RealmPhaseAction.Discard;
    const newState: RealmSimulationProgress = { ...simulationProgress, action: newAction, turn: newTurn };
    setSimulationProgress(newState);
    return newState;
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
    processingState,
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
    processingState,
  ]);
};
