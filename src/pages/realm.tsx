import React, { useEffect, useState } from "react";
import Layout from "../components/layout"
import Seo from "../components/seo"
import styles from "./realm.module.css"
import DynamicSVGText from "../components/dynamicSVGText"
import { useDoraIndicatorsState } from "../hooks/useDoraIndicatorsState";
import { PageProps } from "gatsby";
import { RealmBoss, SanmaTile } from "../types/simulation";
import { calcRealmTiles } from "../utils/realmSimulator";
import RealmViewerBossSection from "../components/realmViewer/bossSection";
import RealmViewerDoraIndicatorsSection from "../components/realmViewer/doraIndicatorsSection";
import RealmViewerResultSection from "../components/realmViewer/resultSection";

const RealmPage: React.FC<PageProps> = () => {
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

export const Head: React.FC = () => <Seo title="領域牌表示ツール" />;
export default RealmPage;
