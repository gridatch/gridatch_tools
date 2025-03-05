import React, { useEffect, useState } from "react";
import Layout from "../components/layout"
import Seo from "../components/seo"
import styles from "./manman.module.css"
import DynamicSVGText from "../components/dynamicSVGText"
import { useDoraIndicatorsState } from "../hooks/useDoraIndicatorsState";
import WallSection from "../components/wallSection";
import HandSection from "../components/handSection";
import ResultSection from "../components/resultSection";
import { computeOptimalManmanTenpais } from "../utils/tenpaiSimulator";
import { PageProps } from "gatsby";
import { DoraBoss, INITIAL_REALM_TILES, RealmTiles } from "../types/simulation";

const MAX_INDICATORS = 10;

const RealmPage: React.FC<PageProps> = () => {
  const [doraBoss, setDoraBoss] = useState<DoraBoss | "empty">("empty");
  const { doraIndicators, addDoraIndicator, removeDoraIndicatorAtIndex } = useDoraIndicatorsState(MAX_INDICATORS);
  
  const [realmTiles, setRealmTiles] = useState<RealmTiles>({});
  useEffect(() => {
    setRealmTiles(computeOptimalManmanTenpais(doraBoss, doraIndicators));
  }, [doraBoss, doraIndicators]);

  return (
    <Layout>
      <div className={styles.container}>
        <DynamicSVGText text={"万万シミュレーター"} />
        <div className={styles.contents}>
          <WallSection wall={wall} maxWall={MAX_WALL} addTileToWall={addTileToWall} removeTileFromWallAtIndex={removeTileFromWallAtIndex} />
          <HandSection 
            hand={handState}
            maxHand={MAX_HAND}
            addComponentToHand={addComponentToHand}
            removeComponentFromHand={removeComponentFromHand}
          />
          <ResultSection handState={handState} tenpaiResults={tenpaiResults} />
        </div>
      </div>
    </Layout>
  );
};

export const Head: React.FC = () => <Seo title="領域牌シミュレーター" />;
export default RealmPage;
