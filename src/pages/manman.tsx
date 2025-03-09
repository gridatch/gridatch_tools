import React, { useEffect, useState } from "react";
import Layout from "../components/layout"
import Seo from "../components/seo"
import styles from "./manman.module.css"
import DynamicSVGText from "../components/dynamicSVGText"
import { useWallState } from "../hooks/useWallState";
import { useHandState } from "../hooks/useHandState";
import WallSection from "../components/wallSection";
import HandSection from "../components/handSection";
import ResultSection from "../components/resultSection";
import { loadManmanCsvData } from "../utils/csvLoader";
import { computeOptimalManmanTenpais } from "../utils/tenpaiSimulator";
import { PageProps } from "gatsby";
import { ManmanCsvData, ManmanTenpaiResult } from "../types/simulation";

// CSVファイル名に対応する索子牌の枚数
const ALLOWED_SINGLE_COUNTS = [6, 7, 9, 10, 12];
const MAX_WALL = 10;
const MAX_HAND = 12;

const ManmanPage: React.FC<PageProps> = () => {
  const { wall, addTileToWall, removeTileFromWallAtIndex, clearWall } = useWallState(MAX_WALL);
  const { handState, addComponentToHand, removeComponentFromHand, clearHand } = useHandState(MAX_HAND);

  const clearAll = () => {
    clearWall();
    clearHand();
  }
  
  // CSV読み込み
  // csvData の形式は { "[手牌の枚数]": { "[手牌]": { "loss": [ロス数], "hand": [手牌], "breakdown": [ロス内訳] } } }
  const [csvData, setCsvData] = useState<ManmanCsvData>({});
  useEffect(() => {
    (async() => {
      const csvData = await loadManmanCsvData(ALLOWED_SINGLE_COUNTS);
      setCsvData(csvData);
    })()
  }, []);  
  
  const [tenpaiResults, setTenpaiResults] = useState<ManmanTenpaiResult[]>([]);
  useEffect(() => {
    setTenpaiResults(computeOptimalManmanTenpais(handState, wall, MAX_HAND, csvData));
  }, [handState, wall, csvData]);

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
          <ResultSection handState={handState} tenpaiResults={tenpaiResults} clearAll={clearAll} />
        </div>
      </div>
    </Layout>
  );
};

export const Head: React.FC = () => <Seo title="万万シミュレーター" />;
export default ManmanPage;
