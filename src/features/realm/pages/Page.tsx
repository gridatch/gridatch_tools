import React, { useState, useMemo, useCallback } from "react";
import Layout from "../../../components/layout/layout";
import DynamicSVGText from "../../../components/common/dynamicSVGText";
import styles from "./realm-plus.module.css";
import { useDoraIndicatorsState } from "../hooks/useRealmDoraIndicatorsState";
import { 
  RealmEditPhase,
  RealmPhase,
  SANMA_TILE_RECORD_4, 
  SANMA_TILE_RECORD_NUMBER_ARRAY,
  SanmaTile, 
} from "../../../types/simulation";
import {
  calcDrawTurnsByTiles, 
  calcIsRealmEachTile, 
  calcRealmTenpai, 
  calcFirstDrawTurnByTilesByTurns
} from "../utils/realmSimulator";
import DoraBossSectionPlus from "../components/realmBossSection";
import RealmDoraIndicatorsSection from "../components/realmDoraIndicatorsSection";
import RealmConfirmedSection from "../components/realmConfirmedSection";
import { useRealmWallState } from "../hooks/useRealmWallState";
import RealmWallSection from "../components/realmWallSection";
import { useRealmHandState } from "../hooks/useRealmHandState";
import RealmHandSection from "../components/realmHandSection";
import RealmResultSection from "../components/realmResultSection";
import { useRealmProgressState } from "../hooks/useRealmProgressState";
import { useRealmBossState } from "../hooks/useRealmBossState";
import { useRealmHandAction } from "../hooks/useRealmHandAction";
import { useRealmWinsLogic } from "../hooks/useRealmWinsLogic";
import { useRealmRemainingTilesLogic } from "../hooks/useRealmRemainingTilesLogic";

export const RealmPage: React.FC = () => {
  /** 進行状況管理のフック */
  const progressState = useRealmProgressState();
  
  // ステージ効果関連のフック
  const bossState = useRealmBossState(progressState);

  // 残り牌（牌山の裏牌か交換牌）
  const [remainingTiles, setRemainingTiles] = useState({ ...SANMA_TILE_RECORD_4 });

  // ドラ表示牌関連のフック
  const doraIndicatorsState = useDoraIndicatorsState(progressState, bossState.boss, remainingTiles);

  // 牌山関連のフック
  const wallState = useRealmWallState(progressState, bossState.boss, remainingTiles);

  /** 各牌が領域牌かどうか */
  const isRealmEachTile = useMemo(
    () => calcIsRealmEachTile(bossState.boss, doraIndicatorsState.doraIndicators),
    [bossState.boss, doraIndicatorsState.doraIndicators]
  );

  // 手牌関連のフック
  const handState = useRealmHandState(progressState);

  // 残り牌の計算
  const remainingTilesLogic = useRealmRemainingTilesLogic(
    progressState.simulationProgress.turn,
    doraIndicatorsState.doraIndicators,
    isRealmEachTile,
    wallState.wall,
    handState.hand, 
    handState.discardedTiles,
    remainingTiles,
    setRemainingTiles,
  );

  const winsLogic = useRealmWinsLogic(progressState, isRealmEachTile, wallState, remainingTilesLogic);

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

  const handAction = useRealmHandAction(progressState, bossState.boss, isRealmEachTile, remainingTiles, wallState.wall, wallState.usableWallCount, handState, results, winsLogic);

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
          <RealmConfirmedSection
            progressState={progressState}
            boss={bossState.boss}
            doraIndicators={doraIndicatorsState.doraIndicators}
            isRealmEachTile={isRealmEachTile}
            wallState={wallState}
            clearAll={clearAll}
          />
          <DoraBossSectionPlus
            progressState={progressState}
            bossState={bossState}
          />
          <RealmDoraIndicatorsSection
            progressState={progressState}
            doraIndicatorsState={doraIndicatorsState}
            remainingTiles={remainingTiles}
          />
          <RealmWallSection
            progressState={progressState}
            wallState={wallState}
            isRealmEachTile={isRealmEachTile}
            remainingTilesLogic={remainingTilesLogic}
          />
          <RealmHandSection
            progressState={progressState}
            handState={handState}
            handAction={handAction}
            isRealmEachTile={isRealmEachTile}
            remainingTilesLogic={remainingTilesLogic}
            firstDrawTurnByTiles={firstDrawTurnByTilesByTurns[progressState.simulationProgress.turn]}
          />
          <RealmResultSection
            isEditing={progressState.editProgress.isEditing}
            results={results}
            drawTurnsByTiles={drawTurnsByTiles}
          />
        </div>
      </div>
    </Layout>
  );
};
