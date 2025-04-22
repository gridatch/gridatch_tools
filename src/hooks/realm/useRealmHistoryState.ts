import { useCallback, useState } from "react";
import { RealmSimulationProgress, SanmaTile, Hand } from "../../types/simulation";

export interface RealmSnapshot {
  progress: RealmSimulationProgress;
  hand: Hand;
  discardedTiles: Record<SanmaTile, number>;
}

export interface RealmHistoryState {
  pushHistory: (snapshotDiff: Partial<RealmSnapshot>) => void;
  updateCurrentHistory: (snapshotDiff?: Partial<RealmSnapshot>) => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

export const useRealmHistoryState = (
  initialSnapshot: RealmSnapshot,
  getSnapshot: () => RealmSnapshot,
  applySnapshot: (snapshot: RealmSnapshot) => void,
) => {
  const [history, setHistory] = useState<RealmSnapshot[]>([initialSnapshot]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);

  /**
   * 履歴にスナップショットを追加する
   * 現在のスナップショットより新しいものは破棄する
   */
  const pushHistory = useCallback((snapshotDiff: Partial<RealmSnapshot>) => {
    const newSnapshot: RealmSnapshot = { ...getSnapshot(), ...snapshotDiff };
    setHistory((prev) => prev.slice(0, historyIndex + 1).concat(newSnapshot));
    setHistoryIndex((prev) => prev + 1);
  }, [getSnapshot, historyIndex]);
  
  /**
   * 現在のスナップショットを更新する
   * 現在のスナップショットより新しいものは破棄する
   */
  const updateCurrentHistory = useCallback((snapshotDiff: Partial<RealmSnapshot> = {}) => {
    const newSnapshot: RealmSnapshot = { ...getSnapshot(), ...snapshotDiff };
    setHistory((prev) => prev.slice(0, historyIndex).concat(newSnapshot));
  }, [getSnapshot, historyIndex]);

  /** 履歴を一つ前に戻す */
  const undo = useCallback(() => {
    if (historyIndex <= 0) return;
    const newIndex = historyIndex - 1;
    setHistoryIndex(newIndex);
    applySnapshot(history[newIndex]);
  }, [history, historyIndex, applySnapshot]);

  /** 履歴を一つ先に進める */
  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;
    const newIndex = historyIndex + 1;
    setHistoryIndex(newIndex);
    applySnapshot(history[newIndex]);
  }, [history, historyIndex, applySnapshot]);
  
  /**
   * 手牌履歴をリセットする
   */
  const clearHistory = useCallback(() => {
    setHistory([initialSnapshot]);
    setHistoryIndex(0);
  }, [initialSnapshot]);

  return {
    pushHistory,
    updateCurrentHistory,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < history.length - 1,
    undo,
    redo,
    clearHistory,
  };
};
