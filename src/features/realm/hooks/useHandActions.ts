import { useCallback, useEffect, useMemo, useRef } from "react";
import { RealmBoss, RealmPhase, RealmPhaseAction, RealmTenpaiResult, SANMA_TILES, SanmaTile, WallTile } from "../../../shared/types/simulation";
import { ProgressState } from "./useProgressState";
import { useExchangePhaseActions } from "./useExchangePhaseActions";
import { useMainPhaseActions } from "./useMainPhaseActions";
import { HandState } from "./useHandState";
import { produce } from "immer";
import { WinsLogic } from "./useWinsLogic";

export interface HandActions {
  canConfirmAction: boolean;
  canConfirmExchangePhase: boolean;
  draw: (tile: SanmaTile) => void;
  cancelDraw: (tile: SanmaTile, index: number) => void;
  confirmDraw: () => void;
  toggleDiscard: (tile: SanmaTile, index: number) => void;
  confirmDiscard: () => void;
  refreshHandBeforeEditMode: () => void;
  refreshHandAfterEditMode: () => void;
  confirmExchangePhase: () => void;
}

/**
 * 領域の手牌操作のカスタムフック
 * @param progressState 進行状況管理
 * @param isRealmEachTile 各牌が領域牌かどうか
 * @param remainingTiles 各牌の残り枚数
 * @param wall 牌山
 * @param handState 手牌のフック
 * @param winsLogic 和了回数計算ロジック
 * @returns 手牌の操作関数をまとめたオブジェクト
 */
export const useHandActions = (
  progressState: ProgressState,
  boss: RealmBoss,
  isRealmEachTile: Record<SanmaTile, boolean>,
  remainingTiles: Record<SanmaTile, number>,
  wall: WallTile[],
  usableWallCount: number,
  handState: HandState,
  results: readonly RealmTenpaiResult[] | null,
  winsLogic: WinsLogic,
): HandActions => {
  const {
    simulationProgress: progress,
    editProgress
  } = progressState;

  const exchangePhaseAction = useExchangePhaseActions(
    progressState,
    boss,
    isRealmEachTile,
    remainingTiles,
    handState,
  );

  const mainPhaseAction = useMainPhaseActions(
    progressState,
    isRealmEachTile,
    remainingTiles,
    wall,
    usableWallCount,
    handState,
    results,
    winsLogic,
  );
  
  const canConfirmAction = useMemo(() => {
    switch (progress.phase) {
      case RealmPhase.Exchange:
        return exchangePhaseAction.canConfirmExchangeAction;
      case RealmPhase.Main:
        return mainPhaseAction.canConfirmMainAction;
      default:
        return false;
    }
  }, [exchangePhaseAction.canConfirmExchangeAction, mainPhaseAction.canConfirmMainAction, progress.phase]);
  
  const canConfirmExchangePhase = useMemo(() => {
    switch (progress.phase) {
      case RealmPhase.Exchange:
        return exchangePhaseAction.canConfirmExchangePhase;
      default:
        return false;
    }
  }, [exchangePhaseAction.canConfirmExchangePhase, progress.phase]);
  
  /** ツモ牌を選択するラッパー */
  const draw = useCallback((tile: SanmaTile) => {
    switch (progress.phase) {
      case RealmPhase.Exchange:
        exchangePhaseAction.exchangeDraw(tile);
        break;
      case RealmPhase.Main:
        mainPhaseAction.drawClosedTile(tile);
        break;
      default:
        console.error("[draw] Unexpected phase", progress.phase);
        break;
    }
  }, [progress.phase, exchangePhaseAction, mainPhaseAction]);

  /** ツモ牌選択を取り消すラッパー */
  const cancelDraw = useCallback((tile: SanmaTile, index: number) => {
    switch (progress.phase) {
      case RealmPhase.Exchange:
        exchangePhaseAction.cancelExchangeDraw(tile, index);
        break;
      case RealmPhase.Main:
        if (index !== -1) break;
        mainPhaseAction.cancelDrawClosedTile();
        break;
      default:
        console.error("[cancelDraw] Unexpected phase", progress.phase);
        break;
    }
  }, [progress.phase, exchangePhaseAction, mainPhaseAction]);

  /** 選択されている牌を打牌するラッパー */
  const confirmDraw = useCallback(() => {
    switch (progress.phase) {
      case RealmPhase.Exchange:
        exchangePhaseAction.confirmExchangeDraw();
        break;
      case RealmPhase.Main:
        mainPhaseAction.confirmDrawClosedTile();
        break;
      default:
        console.error("[confirmDraw] Unexpected phase", progress.phase);
        break;
    }
  }, [progress.phase, exchangePhaseAction, mainPhaseAction]);

  /**
   * 捨て牌選択を切り替えるラッパー
   * 
   * @param tile 対象牌
   * @param index 対象牌の中のindex、ツモ牌の場合は -1
   */
  const toggleDiscard = useCallback((tile: SanmaTile, index: number) => {
    switch (progress.phase) {
      case RealmPhase.Exchange:
        exchangePhaseAction.toggleExchangeDiscard(tile, index);
        break;
      case RealmPhase.Main:
        mainPhaseAction.mainToggleDiscard(tile, index);
        break;
      default:
        console.error("[toggleDiscard] Unexpected phase", progress.phase);
        break;
    }
  }, [progress.phase, exchangePhaseAction, mainPhaseAction]);

  /** 選択されている牌を打牌するラッパー */
  const confirmDiscard = useCallback(() => {
    switch (progress.phase) {
      case RealmPhase.Exchange:
        exchangePhaseAction.confirmExchangeDiscard();
        break;
      case RealmPhase.Main:
        mainPhaseAction.confirmMainDiscard();
        break;
      default:
        console.error("[confirmDiscard] Unexpected phase", progress.phase);
        break;
    }
  }, [progress.phase, exchangePhaseAction, mainPhaseAction]);

  /** 編集モード前に打牌アクションの場合、全ての牌の選択状態を解除する */
  const refreshHandBeforeEditMode = useCallback(() => {
    if (progress.phase < RealmPhase.Exchange) return;
    if (progress.action === RealmPhaseAction.Draw) return;
    
    handState.setHand(prev =>
      produce(prev, draft => {
        SANMA_TILES.forEach(tile => {
          draft.closed[tile].forEach(status => {
            status.isSelected = false;
          });
        });
        draft.drawn.isSelected = false;
      })
    );
  }, [handState, progress.action, progress.phase]);

  /** 編集モード後に打牌アクションの場合、打牌候補を選択する */
  const refreshHandAfterEditMode = useCallback(() => {
    switch (progress.phase) {
      case RealmPhase.Exchange:
        exchangePhaseAction.refreshExchangeHandAfterEditMode();
        break;
      case RealmPhase.Main:
        mainPhaseAction.refreshMainHandAfterEditMode();
        break;
      default:
        console.error("[refreshHandAfterEditMode] Unexpected phase", progress.phase);
        break;
    }
  }, [exchangePhaseAction, mainPhaseAction, progress.phase]);
  
  const prevIsEditing = useRef(editProgress.isEditing);

  useEffect(() => {
    if (prevIsEditing.current !== editProgress.isEditing) {
      if (editProgress.isEditing) {
        refreshHandBeforeEditMode();
      } else {
        refreshHandAfterEditMode();
      }
    }
    prevIsEditing.current = editProgress.isEditing;
  }, [
    editProgress.isEditing,
    refreshHandBeforeEditMode,
    refreshHandAfterEditMode,
  ]);

  /**
   * 牌交換フェーズを完了する
   */
  const confirmExchangePhase = useCallback(() => {
    if (progress.phase !== RealmPhase.Exchange) {
      console.error("[confirmExchangePhase] Unexpected phase", progress.phase);
    }
    mainPhaseAction.enterMainPhase();
  }, [progress.phase, mainPhaseAction]);

  return useMemo(() => ({
    canConfirmAction,
    canConfirmExchangePhase,
    draw,
    cancelDraw,
    confirmDraw,
    toggleDiscard,
    confirmDiscard,
    refreshHandBeforeEditMode,
    refreshHandAfterEditMode,
    confirmExchangePhase,
  }), [
    canConfirmAction,
    canConfirmExchangePhase,
    draw,
    cancelDraw,
    confirmDraw,
    toggleDiscard,
    confirmDiscard,
    refreshHandBeforeEditMode,
    refreshHandAfterEditMode,
    confirmExchangePhase,
  ]);
};
