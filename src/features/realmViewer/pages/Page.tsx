import React, { useEffect, useState } from "react";
import Layout from "../../../components/layout/layout"
import DynamicSVGText from "../../../components/common/dynamicSVGText"
import styles from "./realm.module.css"
import { useDoraIndicatorsState } from "../hooks/useDoraIndicatorsState";
import { RealmBoss, SanmaTile } from "../../../types/simulation";
import RealmViewerBossSection from "../components/bossSection";
import RealmViewerDoraIndicatorsSection from "../components/doraIndicatorsSection";
import RealmViewerResultSection from "../components/resultSection";
import { calcRealmTiles } from "../utils/calcRealmTiles";

export const RealmViewerPage: React.FC = () => {
  const [boss, setBoss] = useState<RealmBoss>("empty");
  const { doraIndicators, maxDoraIndicators, addDoraIndicator, removeDoraIndicatorAtIndex, clearDoraIndicator } = useDoraIndicatorsState(boss);

  const clearAll = () => {
    setBoss("empty");
    clearDoraIndicator();
  }
  
  const [realmTileCounter, setRealmTileCounter] = useState<Map<SanmaTile, number>>(new Map<SanmaTile, number>());
  useEffect(() => {
    setRealmTileCounter(calcRealmTiles(boss, doraIndicators));
  }, [boss, doraIndicators]);

  return (
    <Layout>
      <div className={styles.container}>
        <DynamicSVGText text={"領域牌表示ツール"} />
        <div className={styles.contents}>
          <RealmViewerBossSection boss={boss} setBoss={setBoss} />
          <RealmViewerDoraIndicatorsSection
            doraIndicators={doraIndicators}
            maxDoraIndicators={maxDoraIndicators}
            addDoraIndicator={addDoraIndicator}
            removeDoraIndicatorAtIndex={removeDoraIndicatorAtIndex}
          />
          <RealmViewerResultSection boss={boss} realmTileCounter={realmTileCounter} clearAll={clearAll} />
        </div>
      </div>
    </Layout>
  );
};
