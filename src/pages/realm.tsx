import React, { useEffect, useState } from "react";
import Layout from "../components/layout"
import Seo from "../components/seo"
import styles from "./realm.module.css"
import DynamicSVGText from "../components/dynamicSVGText"
import { useDoraIndicatorsState } from "../hooks/useDoraIndicatorsState";
import { PageProps } from "gatsby";
import { DoraBoss, SanmaTile } from "../types/simulation";
import { calcRealmTiles } from "../utils/realmSimulator";
import DoraBossSection from "../components/doraBossSection";
import DoraIndicatorsSection from "../components/doraIndicatorsSection";
import RealmResultSection from "../components/realmResultSection";

const RealmPage: React.FC<PageProps> = () => {
  const [doraBoss, setDoraBoss] = useState<DoraBoss>("empty");
  const { doraIndicators, maxDoraIndicators, addDoraIndicator, removeDoraIndicatorAtIndex } = useDoraIndicatorsState(doraBoss);
  
  const [realmTileCounter, setRealmTileCounter] = useState<Map<SanmaTile, number>>(new Map<SanmaTile, number>());
  useEffect(() => {
    setRealmTileCounter(calcRealmTiles(doraBoss, doraIndicators));
  }, [doraBoss, doraIndicators]);

  return (
    <Layout>
      <div className={styles.container}>
        <DynamicSVGText text={"領域牌シミュレーター"} />
        <div className={styles.contents}>
          <DoraBossSection doraBoss={doraBoss} setDoraBoss={setDoraBoss} />
          <DoraIndicatorsSection
            doraIndicators={doraIndicators}
            maxDoraIndicators={maxDoraIndicators}
            addDoraIndicator={addDoraIndicator}
            removeDoraIndicatorAtIndex={removeDoraIndicatorAtIndex}
          />
          <RealmResultSection doraBoss={doraBoss} realmTileCounter={realmTileCounter} />
        </div>
      </div>
    </Layout>
  );
};

export const Head: React.FC = () => <Seo title="領域牌シミュレーター" />;
export default RealmPage;
