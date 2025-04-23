import React, { useEffect, useState } from "react";
import Layout from "../components/layout"
import Seo from "../components/seo"
import styles from "./manman.module.css"
import DynamicSVGText from "../components/dynamicSVGText"
import { useWallState } from "../hooks/useWallState";
import { useHandState } from "../hooks/useHandState";
import SozuWallSection from "../components/sozu/wallSection";
import SozuHandSection from "../components/sozu/handSection";
import { loadSozuCsvData } from "../utils/csvLoader";
import { computeOptimalSozuTenpais } from "../utils/tenpaiSimulator";
import { PageProps } from "gatsby";
import { SozuCsvData, SozuTenpaiResult } from "../types/simulation";
import SozuResultSection from "../components/sozu/sozuResultSection";

// CSVファイル名に対応する索子牌の枚数
const ALLOWED_SINGLE_COUNTS = [7, 8, 10, 11, 13];
const MAX_WALL = 10;
const MAX_HAND = 13;

const SozuPage: React.FC<PageProps> = () => {
  const { wall, addTileToWall, removeTileFromWallAtIndex, clearWall } = useWallState(MAX_WALL);
  const { hand, addComponentToHand, removeComponentFromHand, draw, clearHand } = useHandState(MAX_HAND, wall, removeTileFromWallAtIndex);

  const clearAll = () => {
    clearWall();
    clearHand();
  }
  
  // CSV読み込み
  // csvData の形式は { "[手牌の枚数]": { "[手牌]": { "loss": [待ち牌数], "hand": [手牌], "breakdown": [待ち内訳] } } }
  const [csvData, setCsvData] = useState<SozuCsvData>({});
  useEffect(() => {
    (async() => {
      const csvData = await loadSozuCsvData(ALLOWED_SINGLE_COUNTS);
      setCsvData(csvData);
    })()
  }, []);  
  
  const [tenpaiResults, setTenpaiResults] = useState<SozuTenpaiResult[]>([]);
  useEffect(() => {
    setTenpaiResults(computeOptimalSozuTenpais(hand, wall, MAX_HAND, csvData));
  }, [hand, wall, csvData]);

  return (
    <Layout>
      <div className={styles.container}>
        <DynamicSVGText text={"索子多面張シミュレーター"} />
        <div className={styles.contents}>
          <SozuWallSection wall={wall} maxWall={MAX_WALL} addTileToWall={addTileToWall} removeTileFromWallAtIndex={removeTileFromWallAtIndex} />
          <SozuHandSection 
            hand={hand}
            maxHand={MAX_HAND}
            addComponentToHand={addComponentToHand}
            removeComponentFromHand={removeComponentFromHand}
            draw={draw}
          />
          <SozuResultSection hand={hand} tenpaiResults={tenpaiResults} clearAll={clearAll} />
        </div>
      </div>
    </Layout>
  );
};

export const Head: React.FC = () => <Seo title="索子多面張シミュレーター" />;
export default SozuPage;
