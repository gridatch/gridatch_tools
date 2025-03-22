import React, { useEffect, useState, useMemo, useCallback } from "react";
import Layout from "../components/layout";
import Seo from "../components/seo";
import styles from "./realm-plus.module.css";
import DynamicSVGText from "../components/dynamicSVGText";
import { useDoraIndicatorsState } from "../hooks/useDoraIndicatorsStatePlus";
import { PageProps } from "gatsby";
import { 
  DoraBoss, 
  SANMA_TILE_RECORD_4, 
  SANMA_TILE_RECORD_NUMBER_ARRAY, 
} from "../types/simulation";
import { 
  calcDrawTurnsByTiles, 
  calcIsRealmEachTile, 
  calcRealmTenpai, 
  calcRemainingTiles, 
  calcRealmWinsByTenpaiTurns, 
  calcNonRealmWinsByTenpaiTurnsPerSozu 
} from "../utils/realmSimulator";
import DoraBossSectionPlus from "../components/doraBossSectionPlus";
import DoraIndicatorsSectionPlus from "../components/doraIndicatorsSectionPlus";
import RealmConfirmedSection from "../components/realmConfirmedSection";
import { useRealmWallState } from "../hooks/useRealmWallState";
import RealmWallSection from "../components/realmWallSection";
import { useRealmHandState } from "../hooks/useRealmHandState";
import RealmHandSection from "../components/realmHandSection";
import RealmResultSectionPlus from "../components/realmResultSectionPlus";

const RealmPage: React.FC<PageProps> = () => {
  // ステージ効果関連の state
  const [doraBoss, setDoraBoss] = useState<DoraBoss>("empty");
  const [doraBossConfirmed, setDoraBossConfirmed] = useState(false);

  // 残り牌（牌山の裏牌か交換牌）
  const [remainingTiles, setRemainingTiles] = useState({ ...SANMA_TILE_RECORD_4 });

  // ドラ表示牌関連のフック
  const {
    doraIndicators,
    maxDoraIndicators,
    addDoraIndicator,
    removeDoraIndicatorAtIndex,
    clearDoraIndicator,
    doraIndicatorsConfirmed,
    setDoraIndicatorsConfirmed,
  } = useDoraIndicatorsState(doraBoss, remainingTiles);

  // 牌山関連のフック
  const {
    wall,
    maxWall,
    addTileToWall,
    removeTileFromWallAtIndex,
    clearWall,
    wallConfirmed,
    setWallConfirmed,
  } = useRealmWallState(remainingTiles);

  /** 各牌が領域牌かどうか */
  const isRealmEachTile = useMemo(
    () => calcIsRealmEachTile(doraBoss, doraIndicators),
    [doraBoss, doraIndicators]
  );

  // 手牌関連のフック
  const {
    isDrawPhase,
    handState,
    discardedTiles,
    maxHand,
    draw,
    cancelDraw,
    confirmDraw,
    toggleDiscard,
    confirmDiscard,
    clearHandState,
  } = useRealmHandState(isRealmEachTile, remainingTiles);

  // 残り牌の計算
  useEffect(() => {
    setRemainingTiles(calcRemainingTiles(doraIndicators, wall, handState, discardedTiles));
  }, [doraIndicators, wall, handState, discardedTiles]);

  /** 聴牌巡目ごとの領域の和了回数 */
  const realmWinsByTenpaiTurns = useMemo(() => {
    if (!wallConfirmed) return [];
    return calcRealmWinsByTenpaiTurns(wall, maxWall, isRealmEachTile);
  }, [wallConfirmed, wall, maxWall, isRealmEachTile]);

  /** 聴牌巡目ごとの各索子牌による非領域の和了回数 */
  const nonRealmWinsByTenpaiTurnsPerSozu = useMemo(() => {
    if (!wallConfirmed) return [];
    return calcNonRealmWinsByTenpaiTurnsPerSozu(wall, maxWall, isRealmEachTile);
  }, [wallConfirmed, wall, maxWall, isRealmEachTile]);

  // 結果の計算（聴牌形シミュレーション）と、各牌のツモ巡目の補助値
  const result = useMemo(() => {
    if (!wallConfirmed) return null;
    return calcRealmTenpai(isDrawPhase, isRealmEachTile, handState, wall, realmWinsByTenpaiTurns, nonRealmWinsByTenpaiTurnsPerSozu);
  }, [wallConfirmed, isDrawPhase, isRealmEachTile, handState, wall, realmWinsByTenpaiTurns, nonRealmWinsByTenpaiTurnsPerSozu]);

  // 各牌を引く巡目（手牌にある牌は0巡目）
  const drawTurnsByTile = useMemo(() => {
    if (!wallConfirmed) {
      return structuredClone(SANMA_TILE_RECORD_NUMBER_ARRAY);
    }
    return calcDrawTurnsByTiles(handState, wall);
  }, [wallConfirmed, wall, handState]);

  /** 初期化 */
  const clearAll = useCallback(() => {
    setDoraBoss("empty");
    setDoraBossConfirmed(false);
    clearDoraIndicator();
    clearWall();
    clearHandState();
  }, [clearDoraIndicator, clearWall, clearHandState]);

  return (
    <Layout>
      <div className={styles.container}>
        <DynamicSVGText text={"領域和了シミュレーター"} />
        <div className={styles.contents}>
          <RealmConfirmedSection
            doraBoss={doraBoss}
            doraBossConfirmed={doraBossConfirmed}
            doraIndicators={doraIndicators}
            doraIndicatorsConfirmed={doraIndicatorsConfirmed}
            isRealmEachTile={isRealmEachTile}
            wall={wall}
            wallConfirmed={wallConfirmed}
            clearAll={clearAll}
          />
          <DoraBossSectionPlus
            doraBoss={doraBoss}
            setDoraBoss={setDoraBoss}
            doraBossConfirmed={doraBossConfirmed}
            setDoraBossConfirmed={setDoraBossConfirmed}
          />
          <DoraIndicatorsSectionPlus
            doraIndicators={doraIndicators}
            remainingTiles={remainingTiles}
            maxDoraIndicators={maxDoraIndicators}
            addDoraIndicator={addDoraIndicator}
            removeDoraIndicatorAtIndex={removeDoraIndicatorAtIndex}
            doraBossConfirmed={doraBossConfirmed}
            doraIndicatorsConfirmed={doraIndicatorsConfirmed}
            setDoraIndicatorsConfirmed={setDoraIndicatorsConfirmed}
          />
          <RealmWallSection
            wall={wall}
            isRealmEachTile={isRealmEachTile}
            remainingTiles={remainingTiles}
            addTileToWall={addTileToWall}
            removeTileFromWallAtIndex={removeTileFromWallAtIndex}
            doraIndicatorsConfirmed={doraIndicatorsConfirmed}
            wallConfirmed={wallConfirmed}
            setWallConfirmed={setWallConfirmed}
          />
          <RealmHandSection
            wallConfirmed={wallConfirmed}
            isRealmEachTile={isRealmEachTile}
            remainingTiles={remainingTiles}
            isDrawPhase={isDrawPhase}
            handState={handState}
            maxHand={maxHand}
            draw={draw}
            cancelDraw={cancelDraw}
            confirmDraw={confirmDraw}
            toggleDiscard={toggleDiscard}
            confirmDiscard={confirmDiscard}
          />
          <RealmResultSectionPlus
            results={result}
            drawTurnsByTile={drawTurnsByTile}
          />
        </div>
      </div>
    </Layout>
  );
};

export const Head: React.FC = () => <Seo title="領域和了シミュレーター" />;
export default RealmPage;
