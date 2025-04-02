import React, { useEffect, useState, useMemo, useCallback } from "react";
import Layout from "../components/layout";
import Seo from "../components/seo";
import styles from "./realm-plus.module.css";
import DynamicSVGText from "../components/dynamicSVGText";
import { useDoraIndicatorsState } from "../hooks/useRealmDoraIndicatorsState";
import { PageProps } from "gatsby";
import { 
  RealmPhase,
  SANMA_TILE_RECORD_0, 
  SANMA_TILE_RECORD_4, 
  SANMA_TILE_RECORD_NUMBER_ARRAY, 
} from "../types/simulation";
import { 
  calcDrawTurnsByTiles, 
  calcIsRealmEachTile, 
  calcRealmTenpai, 
  calcRemainingTiles, 
  calcRealmWinsByTenpaiTurns, 
  calcNonRealmWinsByTenpaiTurnsPerSozu, 
  calcFirstDrawTurnByTiles
} from "../utils/realmSimulator";
import DoraBossSectionPlus from "../components/realmBossSection";
import RealmDoraIndicatorsSection from "../components/realmDoraIndicatorsSection";
import RealmConfirmedSection from "../components/realmConfirmedSection";
import { useRealmWallState } from "../hooks/useRealmWallState";
import RealmWallSection from "../components/realmWallSection";
import { useRealmHandState } from "../hooks/useRealmHandState";
import RealmHandSection from "../components/realmHandSection";
import RealmResultSectionPlus from "../components/realmResultSectionPlus";
import "./realm-plus-variables.css"
import { useRealmProgressState } from "../hooks/useRealmProgressState";
import { useRealmBossState } from "../hooks/useRealmBossState";

const RealmPage: React.FC<PageProps> = () => {
  /** 進行状況管理のフック */
  const progressState = useRealmProgressState();
  
  // ステージ効果関連のフック
  const bossState = useRealmBossState(progressState);

  // 残り牌（牌山の裏牌か交換牌）
  const [remainingTiles, setRemainingTiles] = useState({ ...SANMA_TILE_RECORD_4 });

  // ドラ表示牌関連のフック
  const doraIndicatorsState = useDoraIndicatorsState(progressState, bossState.boss, remainingTiles);

  // 牌山関連のフック
  const wallState = useRealmWallState(progressState, remainingTiles);

  /** 各牌が領域牌かどうか */
  const isRealmEachTile = useMemo(
    () => calcIsRealmEachTile(bossState.boss, doraIndicatorsState.doraIndicators),
    [bossState.boss, doraIndicatorsState.doraIndicators]
  );

  // 手牌関連のフック
  const handState = useRealmHandState(progressState, isRealmEachTile, remainingTiles);

  // 残り牌の計算
  useEffect(() => {
    setRemainingTiles(calcRemainingTiles(doraIndicatorsState.doraIndicators, wallState.wall, handState.hand, handState.discardedTiles));
  }, [doraIndicatorsState.doraIndicators, wallState.wall, handState.hand, handState.discardedTiles]);

  /** 聴牌巡目ごとの領域の和了回数 */
  const realmWinsByTenpaiTurns = useMemo(() => {
    if (progressState.simulationProgress.phase <= RealmPhase.Wall) return [];
    if (progressState.editProgress.isEditing) return [];
    return calcRealmWinsByTenpaiTurns(wallState.wall, wallState.maxWall, isRealmEachTile);
  }, [progressState, wallState.wall, wallState.maxWall, isRealmEachTile]);

  /** 聴牌巡目ごとの各索子牌による非領域の和了回数 */
  const nonRealmWinsByTenpaiTurnsPerSozu = useMemo(() => {
    if (progressState.simulationProgress.phase <= RealmPhase.Wall) return [];
    if (progressState.editProgress.isEditing) return [];
    return calcNonRealmWinsByTenpaiTurnsPerSozu(wallState.wall, wallState.maxWall, isRealmEachTile);
  }, [progressState, wallState.wall, wallState.maxWall, isRealmEachTile]);

  // 結果の計算（聴牌形シミュレーション）と、各牌のツモ巡目の補助値
  const result = useMemo(() => {
    if (progressState.simulationProgress.phase <= RealmPhase.Wall) return null;
    if (progressState.editProgress.isEditing) return null;
    return calcRealmTenpai(progressState.simulationProgress, isRealmEachTile, handState.hand, wallState.wall, realmWinsByTenpaiTurns, nonRealmWinsByTenpaiTurnsPerSozu);
  }, [progressState, isRealmEachTile, handState.hand, wallState.wall, realmWinsByTenpaiTurns, nonRealmWinsByTenpaiTurnsPerSozu]);

  // 牌山から各牌を最初に引く巡目
  const firstDrawTurnByTiles = useMemo(() => {
    if (progressState.simulationProgress.phase <= RealmPhase.Wall) return { ...SANMA_TILE_RECORD_0 };
    if (progressState.editProgress.isEditing) return { ...SANMA_TILE_RECORD_0 };
    return calcFirstDrawTurnByTiles(wallState.wall);
  }, [progressState.simulationProgress, progressState.editProgress, wallState.wall]);

  // 各牌を引く巡目（手牌にある牌は0巡目）
  const drawTurnsByTiles = useMemo(() => {
    if (progressState.simulationProgress.phase <= RealmPhase.Wall) return structuredClone(SANMA_TILE_RECORD_NUMBER_ARRAY);
    if (progressState.editProgress.isEditing) return structuredClone(SANMA_TILE_RECORD_NUMBER_ARRAY);
    return calcDrawTurnsByTiles(handState.hand, wallState.wall);
  }, [progressState.simulationProgress, progressState.editProgress, wallState.wall, handState.hand]);

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
            wall={wallState.wall}
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
            remainingTiles={remainingTiles}
          />
          <RealmHandSection
            progressState={progressState}
            handState={handState}
            isRealmEachTile={isRealmEachTile}
            remainingTiles={remainingTiles}
            firstDrawTurnByTiles={firstDrawTurnByTiles}
          />
          <RealmResultSectionPlus
            results={result}
            drawTurnsByTiles={drawTurnsByTiles}
          />
        </div>
      </div>
    </Layout>
  );
};

export const Head: React.FC = () => <Seo title="領域和了シミュレーター" />;
export default RealmPage;
