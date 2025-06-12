import React, { useEffect, useState } from "react";

import Layout from "@shared/layout/Layout"
import { RealmBoss, SanmaTile } from "@shared/types/simulation";
import DynamicSVGText from "@shared/ui/DynamicSVGText"

import BossSection from "../components/BossSection";
import DoraIndicatorsSection from "../components/DoraIndicatorsSection";
import ResultSection from "../components/ResultSection";
import { useDoraIndicatorsState } from "../hooks/useDoraIndicatorsState";
import { calcRealmTiles } from "../utils/calcRealmTiles";

import styles from "./RealmViewerPage.module.css"

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
          <BossSection boss={boss} setBoss={setBoss} />
          <DoraIndicatorsSection
            doraIndicators={doraIndicators}
            maxDoraIndicators={maxDoraIndicators}
            addDoraIndicator={addDoraIndicator}
            removeDoraIndicatorAtIndex={removeDoraIndicatorAtIndex}
          />
          <ResultSection boss={boss} realmTileCounter={realmTileCounter} clearAll={clearAll} />
        </div>
      </div>
    </Layout>
  );
};
