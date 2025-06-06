import React, { useState, useMemo, useCallback } from "react";
import Layout from "../../../shared/layout/Layout";
import DynamicSVGText from "../../../shared/ui/DynamicSVGText";
import styles from "./RealmPage.module.css";
import { useDoraIndicatorsState } from "../hooks/useDoraIndicatorsState";
import { 
  RealmEditPhase,
  RealmPhase,
  SANMA_TILE_RECORD_4, 
  SANMA_TILE_RECORD_NUMBER_ARRAY,
  SanmaTile, 
} from "../../../shared/types/simulation";
import {
  calcDrawTurnsByTiles, 
  calcIsRealmEachTile, 
  calcRealmTenpai, 
  calcFirstDrawTurnByTilesByTurns
} from "../utils/realmSimulator";
import BossSection from "../components/BossSection";
import DoraIndicatorsSection from "../components/DoraIndicatorsSection";
import ConfirmedSection from "../components/ConfirmedSection";
import { useWallState } from "../hooks/useWallState";
import WallSection from "../components/WallSection";
import { useHandState } from "../hooks/useHandState";
import HandSection from "../components/HandSection";
import ResultSection from "../components/ResultSection";
import { useProgressState } from "../hooks/useProgressState";
import { useBossState } from "../hooks/useBossState";
import { useHandActions } from "../hooks/useHandActions";
import { useWinsLogic } from "../hooks/useWinsLogic";
import { useRemainingTilesLogic } from "../hooks/useRemainingTilesLogic";

export const RealmPage: React.FC = () => {
  /** 進行状況管理のフック */
  const progressState = useProgressState();
  
  // ステージ効果関連のフック
  const bossState = useBossState(progressState);

  // 残り牌（牌山の裏牌か交換牌）
  const [remainingTiles, setRemainingTiles] = useState({ ...SANMA_TILE_RECORD_4 });

  // ドラ表示牌関連のフック
  const doraIndicatorsState = useDoraIndicatorsState(progressState, bossState.boss, remainingTiles);

  // 牌山関連のフック
  const wallState = useWallState(progressState, bossState.boss, remainingTiles);

  /** 各牌が領域牌かどうか */
  const isRealmEachTile = useMemo(
    () => calcIsRealmEachTile(bossState.boss, doraIndicatorsState.doraIndicators),
    [bossState.boss, doraIndicatorsState.doraIndicators]
  );

  // 手牌関連のフック
  const handState = useHandState(progressState);

  // 残り牌の計算
  const remainingTilesLogic = useRemainingTilesLogic(
    progressState.simulationProgress.turn,
    doraIndicatorsState.doraIndicators,
    isRealmEachTile,
    wallState.wall,
    handState.hand, 
    handState.discardedTiles,
    remainingTiles,
    setRemainingTiles,
  );

  const winsLogic = useWinsLogic(progressState, isRealmEachTile, wallState, remainingTilesLogic);

  // 結果の計算（聴牌形シミュレーション）と、各牌のツモ巡目の補助値
  const results = useMemo(() => {
    if (progressState.simulationProgress.phase <= RealmPhase.Wall) return null;
    if (progressState.editProgress.isEditing) {
      if (progressState.editProgress.phase !== RealmEditPhase.Wall) return null;
      if (wallState.wall.some(tile => tile === "empty")) return null;
    }
    return calcRealmTenpai(
      progressState.simulationProgress,
      isRealmEachTile,
      handState.hand,
      wallState.wall,
      wallState.usableWallCount,
      winsLogic,
    );
  }, [progressState.simulationProgress, progressState.editProgress.isEditing, progressState.editProgress.phase, isRealmEachTile, handState.hand, wallState.wall, wallState.usableWallCount, winsLogic]);

  // 巡目ごとの牌山から各牌を最初に引く巡目
  const firstDrawTurnByTilesByTurns: Record<SanmaTile, number>[] = useMemo(() => {
    if (progressState.simulationProgress.phase <= RealmPhase.Wall) return [];
    if (progressState.editProgress.isEditing) return [];
    return calcFirstDrawTurnByTilesByTurns(wallState.wall, wallState.maxWall, wallState.usableWallCount);
  }, [progressState.simulationProgress.phase, progressState.editProgress.isEditing, wallState]);

  // 各牌を引く巡目（手牌にある牌は0巡目）
  const drawTurnsByTiles = useMemo(() => {
    if (progressState.simulationProgress.phase <= RealmPhase.Wall) return structuredClone(SANMA_TILE_RECORD_NUMBER_ARRAY);
    if (progressState.editProgress.isEditing) return structuredClone(SANMA_TILE_RECORD_NUMBER_ARRAY);
    return calcDrawTurnsByTiles(progressState.simulationProgress, handState.hand, wallState.wall, wallState.usableWallCount);
  }, [progressState.simulationProgress, progressState.editProgress.isEditing, handState.hand, wallState.wall, wallState.usableWallCount]);

  const handAction = useHandActions(progressState, bossState.boss, isRealmEachTile, remainingTiles, wallState.wall, wallState.usableWallCount, handState, results, winsLogic);

  /** 初期化 */
  const clearAll = useCallback(() => {
    progressState.clearRealmProgress();
    bossState.clearBoss();
    doraIndicatorsState.clearDoraIndicators();
    wallState.clearWall();
    handState.clearHandState();
  }, [progressState, bossState, doraIndicatorsState, wallState, handState]);

  return (
    <Layout>
      <div className={styles.container}>
        <DynamicSVGText text={"領域和了シミュレーター"} />
        <div className={styles.contents}>
          <ConfirmedSection
            progressState={progressState}
            boss={bossState.boss}
            doraIndicators={doraIndicatorsState.doraIndicators}
            isRealmEachTile={isRealmEachTile}
            wallState={wallState}
            clearAll={clearAll}
          />
          <BossSection
            progressState={progressState}
            bossState={bossState}
          />
          <DoraIndicatorsSection
            progressState={progressState}
            doraIndicatorsState={doraIndicatorsState}
            remainingTiles={remainingTiles}
          />
          <WallSection
            progressState={progressState}
            wallState={wallState}
            isRealmEachTile={isRealmEachTile}
            remainingTilesLogic={remainingTilesLogic}
          />
          <HandSection
            progressState={progressState}
            handState={handState}
            handAction={handAction}
            isRealmEachTile={isRealmEachTile}
            remainingTilesLogic={remainingTilesLogic}
            firstDrawTurnByTiles={firstDrawTurnByTilesByTurns[progressState.simulationProgress.turn]}
          />
          <ResultSection
            isEditing={progressState.editProgress.isEditing}
            results={results}
            drawTurnsByTiles={drawTurnsByTiles}
          />
        </div>
      </div>
    </Layout>
  );
};
