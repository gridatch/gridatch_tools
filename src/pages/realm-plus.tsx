import React, { useEffect, useState, useMemo, useCallback } from "react";
import Layout from "../components/layout";
import Seo from "../components/seo";
import styles from "./realm-plus.module.css";
import DynamicSVGText from "../components/dynamicSVGText";
import { useDoraIndicatorsState } from "../hooks/useDoraIndicatorsStatePlus";
import { PageProps } from "gatsby";
import { 
  DoraBoss, 
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
import DoraBossSectionPlus from "../components/doraBossSectionPlus";
import DoraIndicatorsSectionPlus from "../components/doraIndicatorsSectionPlus";
import RealmConfirmedSection from "../components/realmConfirmedSection";
import { useRealmWallState } from "../hooks/useRealmWallState";
import RealmWallSection from "../components/realmWallSection";
import { useRealmHandState } from "../hooks/useRealmHandState";
import RealmHandSection from "../components/realmHandSection";
import RealmResultSectionPlus from "../components/realmResultSectionPlus";
import "./realm-plus-variables.css"

const RealmPage: React.FC<PageProps> = () => {
  // 修正中かどうか
  const [isEditing, setIsEditing] = useState(false);
  
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
    canUndo,
    canRedo,
    undo,
    redo,
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

  // 牌山から各牌を最初に引く巡目
  const firstDrawTurnByTiles = useMemo(() => {
    if (!wallConfirmed) {
      return { ...SANMA_TILE_RECORD_0 };
    }
    return calcFirstDrawTurnByTiles(wall);
  }, [wallConfirmed, wall]);

  // 各牌を引く巡目（手牌にある牌は0巡目）
  const drawTurnsByTiles = useMemo(() => {
    if (!wallConfirmed) {
      return structuredClone(SANMA_TILE_RECORD_NUMBER_ARRAY);
    }
    return calcDrawTurnsByTiles(handState, wall);
  }, [wallConfirmed, wall, handState]);

  /** 場の編集 */
  const editField = useCallback(() => {
    setIsEditing(true);
    setDoraBossConfirmed(false);
    setDoraIndicatorsConfirmed(false);
    setWallConfirmed(false);
  }, [setDoraBossConfirmed, setDoraIndicatorsConfirmed, setWallConfirmed]);

  /** 初期化 */
  const clearAll = useCallback(() => {
    setIsEditing(false);
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
            editField={editField}
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
            isEditing={isEditing}
            doraBoss={doraBoss}
            setDoraBoss={setDoraBoss}
            doraBossConfirmed={doraBossConfirmed}
            setDoraBossConfirmed={setDoraBossConfirmed}
          />
          <DoraIndicatorsSectionPlus
            isEditing={isEditing}
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
            isEditing={isEditing}
            setIsEditing={setIsEditing}
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
            firstDrawTurnByTiles={firstDrawTurnByTiles}
            draw={draw}
            cancelDraw={cancelDraw}
            confirmDraw={confirmDraw}
            toggleDiscard={toggleDiscard}
            confirmDiscard={confirmDiscard}
            canUndo={canUndo}
            canRedo={canRedo}
            undo={undo}
            redo={redo}
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
