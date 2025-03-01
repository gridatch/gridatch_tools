import React, { useEffect, useState } from "react";
import Layout from "../components/layout"
import Seo from "../components/seo"
import styles from "./manman.module.css"
import DynamicSVGText from "../components/dynamicSVGText"
import { useWallState } from "../hooks/useWallState";
import { useHandState } from "../hooks/useHandState";
import Wall from "../components/wall";
import Hand from "../components/hand";
import Result from "../components/result";
import { loadCsvData } from "../utils/csvLoader";
import { computeOptimalTenpais } from "../utils/tenpaiSimulator";
import { PageProps } from "gatsby";
import { ManmanCsvData, TenpaiResult } from "../types/simulation";

// CSVファイル名に対応する索子牌の枚数
const ALLOWED_SINGLE_COUNTS = [6, 7, 9, 10, 12];

const ManmanPage: React.FC<PageProps> = () => {
  // 牌山の管理
  const { wall, addTileToWall, removeTileFromWallAtIndex, maxWall } = useWallState();
  const {
    hand,
    addTileToHand,
    addSequenceToHand,
    addTripletToHand,
    addPairToHand,
    removeTileFromHand,
    removeSequenceFromHand,
    removeTripletFromHand,
    removePairFromHand,
    maxHand
  } = useHandState();
  
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
    setTenpaiResults(computeOptimalTenpais(hand, wall, maxHand, csvData));
  }, [hand, wall, maxHand, csvData]);

  return (
    <Layout>
      <div className={styles.container}>
        <DynamicSVGText text={"万万シミュレーター"} />
        <div className={styles.contents}>
          <Wall wall={wall} addTileToWall={addTileToWall} removeTileFromWallAtIndex={removeTileFromWallAtIndex} maxWall={maxWall} />
          <Hand 
            hand={hand}
            addTileToHand={addTileToHand}
            removeTileFromHand={removeTileFromHand}
            addSequenceToHand={addSequenceToHand}
            addTripletToHand={addTripletToHand}
            addPairToHand={addPairToHand}
            removeSequenceFromHand={removeSequenceFromHand}
            removeTripletFromHand={removeTripletFromHand}
            removePairFromHand={removePairFromHand}
            maxHand={maxHand}
          />
          <Result tenpaiResults={tenpaiResults} />
        </div>
      </div>
    </Layout>
  );
};

export const Head: React.FC = () => <Seo title="万万シミュレーター" />;
export default ManmanPage;
