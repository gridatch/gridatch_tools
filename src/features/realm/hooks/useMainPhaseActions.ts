import { useCallback, useMemo } from "react";
import { Hand, isSanmaTile, isSozuTile, PINZU_TILES, RealmPhase, RealmPhaseAction, RealmSimulationProgress, RealmTenpaiResult, SANMA_TILE_RECORD_0, SANMA_TILES, SanmaTile, SOZU_TILES, WallTile } from "../../../shared/types/simulation";
import { ProgressState } from "./useProgressState";
import { HandState } from "./useHandState";
import { createDraft, Draft, finishDraft, isDraft, produce } from "immer";
import { calcRealmWinsAverageByDiscard } from "../utils/realmSimulator";
import { WinsLogic } from "./useWinsLogic";
import { useProcessingContext } from "../../../shared/processing/context/ProcessingContext";

export interface MainPhaseActions {
  canConfirmMainAction: boolean;
  enterMainPhase: () => void;
  drawClosedTile: (tile: SanmaTile) => void;
  cancelDrawClosedTile: () => void;
  confirmDrawClosedTile: () => void;
  mainToggleDiscard: (tile: SanmaTile, index: number) => void;
  confirmMainDiscard: () => void;
  refreshMainHandAfterEditMode: () => void;
}

export const useMainPhaseActions = (
  progressState: ProgressState,
  isRealmEachTile: Record<SanmaTile, boolean>,
  remainingTiles: Record<SanmaTile, number>,
  wall: WallTile[],
  usableWallCount: number,
  handState: HandState,
  results: readonly RealmTenpaiResult[] | null,
  winsLogic: WinsLogic,
) : MainPhaseActions => {
  const {
    simulationProgress: progress,
    goToNextSimulationPhase,
    updatePhaseAction,
    goToNextTurn,
  } = progressState;

  const {
    hand,
    setHand,
    discardedTiles,
    setDiscardedTiles,
    pushHistory,
    updateCurrentHistory,
  } = handState;

  const processingState = useProcessingContext();
  
  /**
   * 領域牌を以下の 3 グループに分類する
   * 1. 3連続以上の領域牌 (sequentialRealmTiles)
   * 2. 連続していない索子の領域牌 (nonSequentialSozuRealmTiles)
   * 3. 連続していないその他の領域牌 (nonSequentialOtherRealmTiles)
   */
  const categorizeRealmTiles = useCallback(() => {
    const sequentialSet = new Set<SanmaTile>();

    [PINZU_TILES, SOZU_TILES].forEach((tiles) => {
      let run = 0;
      for (let i = 0; i < tiles.length; i++) {
        if (isRealmEachTile[tiles[i]]) {
          run++;
          if (run === 3) {
            sequentialSet.add(tiles[i - 2]);
            sequentialSet.add(tiles[i - 1]);
            sequentialSet.add(tiles[i]);
          } else if (run > 3) {
            sequentialSet.add(tiles[i]);
          }
        } else {
          run = 0;
        }
      }
    });

    const sequentialRealmTiles: SanmaTile[] = [];
    const nonSequentialSozuRealmTiles: SanmaTile[] = [];
    const nonSequentialOtherRealmTiles: SanmaTile[] = [];

    SANMA_TILES.forEach((tile) => {
      if (!isRealmEachTile[tile]) return;
      if (sequentialSet.has(tile)) {
        sequentialRealmTiles.push(tile);
      } else if (isSozuTile(tile)) {
        nonSequentialSozuRealmTiles.push(tile);
      } else {
        nonSequentialOtherRealmTiles.push(tile);
      }
    });

    return { sequentialRealmTiles, nonSequentialSozuRealmTiles, nonSequentialOtherRealmTiles };
  }, [isRealmEachTile]);

  const selectBestDiscardInDraft = useCallback(async (
    draft: Draft<Hand>,
    newProgress: RealmSimulationProgress,
  ): Promise<void> => {
    if (!isDraft(draft)) {
      console.error("[selectBestDiscardInDraft] Expected a draft from Immer, but got a plain Hand.");
      return;
    }
    if (!isSanmaTile(draft.drawn.tile)) {
      console.error("[selectBestDiscardInDraft] Unexpected drawn tile.", draft.drawn.tile);
      return;
    }
    const drawnTile = draft.drawn.tile;

    const selectTile = (tile: SanmaTile) => {
      if (drawnTile === tile) {
        draft.drawn.isSelected = true;
      } else {
        if (draft.closed[tile].length > 0) {
          draft.closed[tile][0].isSelected = true;
        }
      }
    };
    
    // 非領域のツモ牌
    if (!isRealmEachTile[drawnTile]) {
      selectTile(drawnTile);
      return;
    }

    // 非領域の手牌
    const nonRealmClosedTile = SANMA_TILES.find(tile => !isRealmEachTile[tile] && draft.closed[tile].length > 0);
    if (nonRealmClosedTile) {
      selectTile(nonRealmClosedTile);
      return;
    }

    if (!results) return;

    const diffs: Record<SanmaTile, number>[] = [];
    results.forEach((result) => {
      const diff = { ...SANMA_TILE_RECORD_0 };
      SANMA_TILES.forEach(tile => {
        diff[tile] = result.hand[tile] - draft.closed[tile].length;
      })
      --diff[drawnTile];
      diffs.push(diff);
    })
    
    const { sequentialRealmTiles, nonSequentialSozuRealmTiles, nonSequentialOtherRealmTiles } = categorizeRealmTiles();
    
    let tileToSelect: SanmaTile | null = null;
    let tileToSelectRemaining = Number.POSITIVE_INFINITY;

    const tenpaiTurn = results[0].turn;

    let closedCount = 0;
    for (let turn = newProgress.turn + 1; turn < Math.min(tenpaiTurn, usableWallCount); ++turn) {
      if (wall[turn - 1] === "closed") ++closedCount;
    }

    if (closedCount === 0) {
      // 最善手の聴牌までに裏牌なしの場合は、最善手に真っすぐ
      for (const group of [
        nonSequentialOtherRealmTiles,
        nonSequentialSozuRealmTiles,
        sequentialRealmTiles,
      ]) {
        for (const tile of group) {
          if (diffs[0][tile] >= 0) continue;
          if (remainingTiles[tile] >= tileToSelectRemaining) continue;
          tileToSelect = tile;
          tileToSelectRemaining = remainingTiles[tile];
        }
        if (tileToSelect) {
          selectTile(tileToSelect);
          return;
        }
      }
    }
    
    const winsAverageByDiscard = await calcRealmWinsAverageByDiscard(
      newProgress,
      processingState,
      isRealmEachTile, remainingTiles,
      draft,
      wall,
      usableWallCount,
      winsLogic,
    );
    if (!winsAverageByDiscard) return;
    
    if (SANMA_TILES.some(tile => winsAverageByDiscard[tile] > 0)) {
      tileToSelect = [
        ...nonSequentialOtherRealmTiles,
        ...nonSequentialSozuRealmTiles,
        ...sequentialRealmTiles,
      ].reduce((acc, cur) => winsAverageByDiscard[acc] >= winsAverageByDiscard[cur] ? acc : cur);
    }
    
    if (tileToSelect) {
      selectTile(tileToSelect);
      return;
    }
  }, [categorizeRealmTiles, isRealmEachTile, processingState, remainingTiles, results, wall, usableWallCount, winsLogic]);
  
  /** メインフェーズ：ツモ・打牌の決定ができるかどうか */
  const canConfirmMainAction: boolean = useMemo(() => {
    switch (progress.action) {
      case RealmPhaseAction.Draw: {
        return hand.drawn.isClosed && hand.drawn.tile !== "closed" && hand.drawn.tile !== "empty";
      }
      case RealmPhaseAction.Discard: {
        if (hand.drawn.tile === "closed" || hand.drawn.tile === "empty") return false;
        let selectedTileCount = 0;
        selectedTileCount += SANMA_TILES.reduce((sum, tile) => sum + hand.closed[tile].filter(status => status.isSelected).length, 0);
        selectedTileCount += hand.drawn.isSelected ? 1 : 0;
        return selectedTileCount === 1;
      }
      default: {
        return false;
      }
    }
  }, [hand.closed, hand.drawn.isClosed, hand.drawn.isSelected, hand.drawn.tile, progress.action]);

  /** 牌交換フェーズ > 打牌アクション：メインフェーズへ移行する。手牌を確定し、牌山の先頭を選択する。 */
  const enterMainPhase = useCallback(async () => {
    if (progress.action !== RealmPhaseAction.Discard) return;

    const newProgress = goToNextSimulationPhase(wall);
    
    const nextDrawnTile = wall[newProgress.turn - 1];

    const handDraft = createDraft(hand);
    SANMA_TILES.forEach(tile => {
      handDraft.closed[tile].forEach(status => {
        status.isSelected = false;
      });
    });

    // 次のツモ牌設定
    handDraft.drawn = {
      tile: nextDrawnTile,
      isClosed: nextDrawnTile === "closed",
      isSelected: false,
    };
      
    if (nextDrawnTile !== "closed") await selectBestDiscardInDraft(handDraft, newProgress);
    const newHand = finishDraft(handDraft);
    
    setHand(newHand);
    pushHistory({ progress: newProgress, hand: newHand, discardedTiles });
  }, [progress.action, goToNextSimulationPhase, wall, hand, setHand, pushHistory, discardedTiles, selectBestDiscardInDraft]);

  /** メインフェーズ > ツモアクション：ツモ牌の裏牌の種類を選択する。 */
  const drawClosedTile = useCallback((tile: SanmaTile) => {
    if (progress.action !== RealmPhaseAction.Draw) return;
    if (remainingTiles[tile] <= 0) return;
    
    setHand(prev => {
      if (!prev.drawn.isClosed) {
        console.error("[drawClosedTile] Drawn tile is not closed.");
        return prev;
      }
      return { ...prev, drawn: { ...prev.drawn, tile, isSelected: true } };
    });
  }, [progress.action, remainingTiles, setHand]);

  /** メインフェーズ > ツモアクション：選択されたツモ牌の裏牌の種類を取り消す */
  const cancelDrawClosedTile = useCallback(() => {
    if (progress.action !== RealmPhaseAction.Draw) return;
    
    setHand(prev => {
      if (!prev.drawn.isClosed) {
        console.error("[cancelDrawClosedTile] Drawn tile is not closed.");
        return prev;
      }
      return { ...prev, drawn: { ...prev.drawn, tile: "closed", isSelected: false } };
    });
  }, [progress.action, setHand]);

  /** メインフェーズ > ツモアクション：ツモ牌を決定し、打牌アクションへ移行する。 */
  const confirmDrawClosedTile = useCallback(async () => {
    if (progress.action !== RealmPhaseAction.Draw) return;
    if (!isSanmaTile(hand.drawn.tile)) return;
    
    updateCurrentHistory({ progress, hand, discardedTiles });
    
    const newProgress = updatePhaseAction(RealmPhaseAction.Discard);
    
    const handDraft = createDraft(hand);
    handDraft.drawn.isSelected = false;
    await selectBestDiscardInDraft(handDraft, newProgress);
    const newHand = finishDraft(handDraft);
    
    setHand(newHand);
    
    pushHistory({ progress: newProgress, hand: newHand });
  }, [discardedTiles, hand, progress, pushHistory, selectBestDiscardInDraft, setHand, updateCurrentHistory, updatePhaseAction]);

  /**
   * メインフェーズ > 打牌アクション：指定の牌について打牌候補かどうかの選択を切り替える。
   * 打牌候補が最大1枚になるように、指定の牌以外の選択を解除する。
   * @param tile 指定の牌の種類
   * @param index 指定の牌の種類の中のindex、ツモ牌の場合は -1
   */
  const mainToggleDiscard = useCallback(async (tile: SanmaTile, index: number) => {
    if (progress.phase !== RealmPhase.Main) return;
    if (progress.action !== RealmPhaseAction.Discard) return;
    
    setHand(prev => {
      const newHand = structuredClone(prev);
  
      // 手牌の全ての牌の選択を解除する
      SANMA_TILES.forEach(t => {
        newHand.closed[t].forEach(status => (status.isSelected = false));
      });
      newHand.drawn.isSelected = false;
      
      if (
        (index === -1 && prev.drawn.isSelected)
        || (index !== -1 && prev.closed[tile][index].isSelected)
      ) {
        // 指定の牌が選択されていた場合は、全解除した手牌をそのまま返す
        return newHand;
      }
    
      if (index === -1) {
        // ツモ牌を選択する
        newHand.drawn.isSelected = true;
      } else {
        // 手牌の指定の牌を選択
        newHand.closed[tile][index].isSelected = true;
      }
      return newHand;
    });
  }, [progress, setHand]);

  /** メインフェーズ > 打牌アクション：手牌とツモ牌の中から選択されている牌を1枚打牌する。 */
  const confirmMainDiscard = useCallback(async () => {
    if (progress.phase !== RealmPhase.Main) return;
    
    const drawnTile = hand.drawn.tile;
    if (drawnTile === "closed" || drawnTile === "empty") {
      console.error("[confirmMainDiscard] Unexpected drawn tile.", drawnTile);
      return;
    }

    // 選択されている牌が1枚であることの確認
    const selectedClosedTiles: { tile: SanmaTile; index: number }[] = [];
    SANMA_TILES.forEach(tile => {
      hand.closed[tile].forEach((status, index) => {
        if (status.isSelected) selectedClosedTiles.push({ tile, index });
      });
    });
    const drawnSelected = hand.drawn.isSelected;
    const totalSelected = (drawnSelected ? 1 : 0) + selectedClosedTiles.length;
    if (totalSelected !== 1) {
      console.error("[confirmMainDiscard] Unexpected total selected.", totalSelected);
      return;
    }
    
    if (progress.turn >= usableWallCount) {
      // TODO: 結果表示など
      return;
    }
    
    updateCurrentHistory({ progress, hand, discardedTiles });
    
    const newProgress = goToNextTurn(wall, usableWallCount);
    const nextDrawnTile = wall[newProgress.turn - 1];
    
    const handDraft = createDraft(hand);
    if (!drawnSelected) {
      // 手出し
      const { tile, index } = selectedClosedTiles[0];
      handDraft.closed[tile].splice(index, 1);
      handDraft.closed[drawnTile].push({ isSelected: false });
    }

    // 次のツモ牌設定
    handDraft.drawn = {
      tile: nextDrawnTile,
      isClosed: nextDrawnTile === "closed",
      isSelected: false,
    };
    
    if (nextDrawnTile !== "closed") await selectBestDiscardInDraft(handDraft, newProgress);
    const newHand = finishDraft(handDraft);
    
    const newDiscarded = produce(discardedTiles, draft => {
      if (drawnSelected) {
        // ツモ切り
        draft[drawnTile] += 1;
      } else {
        // 手出し
        const { tile } = selectedClosedTiles[0];
        draft[tile] += 1;
      }
    });
    
    setHand(newHand);
    setDiscardedTiles(newDiscarded);
    pushHistory({ progress: newProgress, hand: newHand, discardedTiles: newDiscarded });
  }, [discardedTiles, goToNextTurn, hand, progress, pushHistory, selectBestDiscardInDraft, setDiscardedTiles, setHand, updateCurrentHistory, usableWallCount, wall]);

  const refreshMainHandAfterEditMode = useCallback(async () => {
    if (progress.action === RealmPhaseAction.Draw) {
      updateCurrentHistory();
      return;
    }
    
    const handDraft = createDraft(hand);
    await selectBestDiscardInDraft(handDraft, progress);
    const newHand = finishDraft(handDraft);

    setHand(newHand);
    updateCurrentHistory({ hand: newHand });
  }, [hand, progress, selectBestDiscardInDraft, setHand, updateCurrentHistory]);

  return useMemo(() => ({
    canConfirmMainAction,
    enterMainPhase,
    drawClosedTile,
    cancelDrawClosedTile,
    confirmDrawClosedTile,
    mainToggleDiscard,
    confirmMainDiscard,
    refreshMainHandAfterEditMode,
  }), [
    canConfirmMainAction,
    enterMainPhase,
    drawClosedTile,
    cancelDrawClosedTile,
    confirmDrawClosedTile,
    mainToggleDiscard,
    confirmMainDiscard,
    refreshMainHandAfterEditMode,
  ]);
};