import React, { useEffect, useState } from "react";
import Layout from "../components/layout"
import Seo from "../components/seo"
import styles from "./realm-plus.module.css"
import DynamicSVGText from "../components/dynamicSVGText"
import { useDoraIndicatorsState } from "../hooks/useDoraIndicatorsStatePlus";
import { PageProps } from "gatsby";
import { DoraBoss, RealmTenpaiResult, SANMA_TILE_RECORD_4, SANMA_TILE_RECORD_NUMBER_ARRAY, SANMA_TILES, SanmaTile, Sozu } from "../types/simulation";
import { calcDrawTurnsByTiles, calcIsRealmEachTile, calcRealmTenpai, calcRemainingTiles, calcRealmWinsByTenpaiTurns, calcNonRealmWinsByTenpaiTurnsPerSozu } from "../utils/realmSimulator";
import DoraBossSectionPlus from "../components/doraBossSectionPlus";
import DoraIndicatorsSectionPlus from "../components/doraIndicatorsSectionPlus";
import RealmConfirmedSection from "../components/realmConfirmedSection";
import { useRealmWallState } from "../hooks/useRealmWallState";
import RealmWallSection from "../components/realmWallSection";
import { useRealmHandState } from "../hooks/useRealmHandState";
import RealmHandSection from "../components/realmHandSection";
import RealmResultSectionPlus from "../components/realmResultSectionPlus";

const RealmPage: React.FC<PageProps> = () => {
  const [remainingTiles, setRemainingTiles] = useState<Record<SanmaTile, number>>({ ...SANMA_TILE_RECORD_4 });
  const [doraBoss, setDoraBoss] = useState<DoraBoss>("empty");
  const [doraBossConfirmed, setDoraBossConfirmed] = useState<boolean>(false);
  const [isRealmEachTile, setIsRealmEachTile] = useState<Record<SanmaTile, boolean>>(Object.fromEntries(SANMA_TILES.map(tile => [tile, false])) as Record<SanmaTile, boolean>);
  const {
    doraIndicators,
    maxDoraIndicators,
    addDoraIndicator,
    removeDoraIndicatorAtIndex,
    clearDoraIndicator,
    doraIndicatorsConfirmed,
    setDoraIndicatorsConfirmed,
  } = useDoraIndicatorsState(doraBoss, remainingTiles);
  
  const {
    wall,
    maxWall,
    addTileToWall,
    removeTileFromWallAtIndex,
    clearWall,
    wallConfirmed,
    setWallConfirmed,
  } = useRealmWallState(remainingTiles);
  
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

  const clearAll = () => {
    setDoraBoss("empty");
    setDoraBossConfirmed(false);
    clearDoraIndicator();
    clearWall();
    clearHandState();
  }
  
  useEffect(() => {
    setIsRealmEachTile(calcIsRealmEachTile(doraBoss, doraIndicators));
  }, [doraBoss, doraIndicators]);
  
  useEffect(() => {
    setRemainingTiles(calcRemainingTiles(doraIndicators, wall, handState, discardedTiles));
  }, [doraIndicators, wall, handState, discardedTiles]);
  
  const [realmWinsByTenpaiTurns, setRealmWinsByTenpaiTurns] = useState<number[]>([]);
  const [nonRealmWinsByTenpaiTurnsPerSozu, setNonRealmWinsByTenpaiTurnsPerSozu] = useState<Record<Sozu, number>[]>([]);
  useEffect(() => {
    if (!wallConfirmed) {
      setRealmWinsByTenpaiTurns([]);
      setNonRealmWinsByTenpaiTurnsPerSozu([]);
      return;
    }
    setRealmWinsByTenpaiTurns(calcRealmWinsByTenpaiTurns(wall, maxWall, isRealmEachTile));
    setNonRealmWinsByTenpaiTurnsPerSozu(calcNonRealmWinsByTenpaiTurnsPerSozu(wall, maxWall, isRealmEachTile));
  }, [isRealmEachTile, maxWall, wall, wallConfirmed])
  
  const [result, setResult] = useState<RealmTenpaiResult[] | null>(null);
  const [drawTurnsByTile, setDrawTurnsByTile] = useState<Record<SanmaTile, number[]>>(structuredClone(SANMA_TILE_RECORD_NUMBER_ARRAY));
  useEffect(() => {
    if (!wallConfirmed || realmWinsByTenpaiTurns.length === 0 || nonRealmWinsByTenpaiTurnsPerSozu.length === 0) {
      setResult(null);
      setDrawTurnsByTile(structuredClone(SANMA_TILE_RECORD_NUMBER_ARRAY));
      return;
    }
    setResult(calcRealmTenpai(isDrawPhase, isRealmEachTile, handState, wall, realmWinsByTenpaiTurns, nonRealmWinsByTenpaiTurnsPerSozu));
    setDrawTurnsByTile(calcDrawTurnsByTiles(handState, wall));
  }, [isRealmEachTile, wall, wallConfirmed, nonRealmWinsByTenpaiTurnsPerSozu, realmWinsByTenpaiTurns, isDrawPhase, handState])

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
          <DoraBossSectionPlus doraBoss={doraBoss} setDoraBoss={setDoraBoss} doraBossConfirmed={doraBossConfirmed} setDoraBossConfirmed={setDoraBossConfirmed} />
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
