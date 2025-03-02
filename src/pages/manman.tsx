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
import { loadCsvData } from "../utils/csvLoader";
import { computeOptimalTenpais } from "../utils/tenpaiSimulator";
import { PageProps } from "gatsby";
import { ManmanCsvData, TenpaiResult } from "../types/simulation";

// CSVファイル名に対応する索子牌の枚数
const ALLOWED_SINGLE_COUNTS = [6, 7, 9, 10, 12];

const ManmanPage: React.FC<PageProps> = () => {
  // 牌山の管理
  const { wall, maxWall, addTileToWall, removeTileFromWallAtIndex } = useWallState();
  const { handState, maxHand, addComponentToHand, removeComponentFromHand } = useHandState();
  
  // CSV読み込み
  // csvData の形式は { "[手牌の枚数]": { "[手牌]": { "loss": [ロス数], "hand": [手牌], "breakdown": [ロス内訳] } } }
  const [csvData, setCsvData] = useState<ManmanCsvData>({});
  useEffect(() => {
    (async() => {
      const csvData = await loadCsvData(ALLOWED_SINGLE_COUNTS);
      setCsvData(csvData);
    })()
  }, []);  
  
  const [tenpaiResults, setTenpaiResults] = useState<TenpaiResult[]>([]);
  useEffect(() => {
    setTenpaiResults(computeOptimalTenpais(handState, wall, maxHand, csvData));
  }, [handState, wall, maxHand, csvData]);

  return (
    <Layout>
      <div className={styles.container}>
        <DynamicSVGText text={"万万シミュレーター"} />
        <div className={styles.contents}>
          <WallSection wall={wall} maxWall={maxWall} addTileToWall={addTileToWall} removeTileFromWallAtIndex={removeTileFromWallAtIndex} />
          <HandSection 
            hand={handState}
            maxHand={maxHand}
            addComponentToHand={addComponentToHand}
            removeComponentFromHand={removeComponentFromHand}
          />
          <ResultSection handState={handState} tenpaiResults={tenpaiResults} />
        </div>
      </div>
    </Layout>
  );
};

export const Head: React.FC = () => <Seo title="万万シミュレーター" />;
export default ManmanPage;
