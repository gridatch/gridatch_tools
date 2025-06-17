import React, { useEffect, useState } from 'react';

import Layout from '@shared/layout/Layout';
import { SozuCsvData, SozuTenpaiResult } from '@shared/types/simulation';
import DynamicSVGText from '@shared/ui/DynamicSVGText';

import SozuHandSection from '@features/wait/common/components/HandSection';
import SozuWallSection from '@features/wait/common/components/WallSection';
import { useHandState } from '@features/wait/common/hooks/useHandState';
import { useWallState } from '@features/wait/common/hooks/useWallState';
import styles from '@features/wait/common/styles/wait.module.css';
import { loadSozuCsvData } from '@features/wait/common/utils/csvLoader';
import { computeOptimalSozuTenpais } from '@features/wait/common/utils/tenpaiSimulator';

import ResultSection from '../components/ResultSection';

// CSVファイル名に対応する索子牌の枚数
const ALLOWED_SINGLE_COUNTS = [7, 8, 10, 11, 13];
const MAX_WALL = 10;
const MAX_HAND = 13;

export const SozuPage: React.FC = () => {
  const { wall, addTileToWall, removeTileFromWallAtIndex, clearWall } = useWallState(MAX_WALL);
  const { hand, addComponentToHand, removeComponentFromHand, draw, clearHand } = useHandState(MAX_HAND, wall, removeTileFromWallAtIndex);

  const clearAll = () => {
    clearWall();
    clearHand();
  };

  // CSV読み込み
  // csvData の形式は { "[手牌の枚数]": { "[手牌]": { "loss": [待ち牌数], "hand": [手牌], "breakdown": [待ち内訳] } } }
  const [csvData, setCsvData] = useState<SozuCsvData>({});
  useEffect(() => {
    (async () => {
      const csvData = await loadSozuCsvData(ALLOWED_SINGLE_COUNTS);
      setCsvData(csvData);
    })();
  }, []);

  const [tenpaiResults, setTenpaiResults] = useState<SozuTenpaiResult[]>([]);
  useEffect(() => {
    setTenpaiResults(computeOptimalSozuTenpais(hand, wall, MAX_HAND, csvData));
  }, [hand, wall, csvData]);

  return (
    <Layout>
      <div className={styles.container}>
        <DynamicSVGText text="索子多面張シミュレーター" />
        <div className={styles.contents}>
          <SozuWallSection wall={wall} maxWall={MAX_WALL} addTileToWall={addTileToWall} removeTileFromWallAtIndex={removeTileFromWallAtIndex} />
          <SozuHandSection
            hand={hand}
            maxHand={MAX_HAND}
            addComponentToHand={addComponentToHand}
            removeComponentFromHand={removeComponentFromHand}
            draw={draw}
          />
          <ResultSection hand={hand} tenpaiResults={tenpaiResults} clearAll={clearAll} />
        </div>
      </div>
    </Layout>
  );
};
