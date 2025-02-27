import React from "react";
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

// CSVファイル名に対応する索子牌の枚数
const ALLOWED_SINGLE_COUNTS = [6, 7, 9, 10, 12];

const ManmanPage = () => {
  // 牌山の管理
  const { wall, addTileToWall, removeTileFromWallAtIndex, maxWall } = useWallState();
  const {
    hand,
    addTileToHand: addTileToHand,
    addSequenceToHand: addSequenceToHand,
    addTripletToHand: addTripletToHand,
    addPairToHand: addPairToHand,
    removeTileFromHand: removeTileFromHand,
    removeSequenceFromHand: removeSequenceFromHand,
    removeTripletFromHand: removeTripletFromHand,
    removePairFromHand: removePairFromHand,
    maxHand
  } = useHandState();
  
  // CSV読み込み
  // csvData の形式は { "[手牌の枚数]": { "[手牌]": { "loss": [ロス数], "hand": [手牌], "breakdown": [ロス内訳] } } }
  const [csvData, setCsvData] = React.useState({});
  React.useEffect(() => {
    (async() => {
      const csvData = await loadCsvData(ALLOWED_SINGLE_COUNTS);
      setCsvData(csvData);
    })()
  }, []);  
  
  // シミュレーション
  // プール作成：手牌のセットと単体牌、牌山の牌をまとめる
  const createPool = () => {
    const pool = [];
    
    // 順子
    for (let i = 0; i < hand.sequenceCount; i++) {
      const tiles = (i === 0) ? ["1p", "2p", "3p"] : ["4p", "5p", "6p"];
      pool.push({ type: "sequence", tiles, tileCount: 3 });
    }
    // 刻子
    for (let i = 0; i < hand.tripletCount; i++) {
      const tiles = (i === 0) ? ["7p", "7p", "7p"] : ["8p", "8p", "8p"];
      pool.push({ type: "triplet", tiles, tileCount: 3 });
    }
    // 対子
    if (hand.hasPair) {
      pool.push({ type: "pair", tiles: ["9p", "9p"], tileCount: 2 });
    }
    // 対子が存在しない場合、刻子を対子に変換
    if (!hand.hasPair && hand.tripletCount > 0) {
      if (hand.tripletCount === 1) {
        // 1組の場合：["7p", "7p"]
        pool.push({ type: "convertedPair", tiles: ["7p", "7p"], tileCount: 2 });
      } else if (hand.tripletCount === 2) {
        // 2組の場合：["8p", "8p"]
        pool.push({ type: "convertedPair", tiles: ["8p", "8p"], tileCount: 2 });
      }
    }
    // 単体牌（各4枚まで）
    const singleCounts = new Map();
    // ソートを省略するため Map の初期化
    // （js の Map の key は挿入順になることが保証されているため）
    for (let i = 0; i < 9; i++) {
      singleCounts.set(`${i+1}s`, 0);
    }
    Object.keys(hand.singles).forEach(tile => {
      const count = hand.singles[tile];
      singleCounts.set(tile, count);
    });
    // 牌山（各4枚まで）
    wall.forEach(tile => {
      const current = singleCounts.get(tile) || 0;
      if (current < 4) {
        singleCounts.set(tile, current + 1);
      }
    });
    // 単体牌を Map の挿入順（1s～9s）に pool に追加
    for (const [tile, count] of singleCounts.entries()) {
      for (let i = 0; i < count; i++) {
        pool.push({ type: "single", tiles: [tile], tileCount: 1 });
      }
    }
    return pool;
  };  
  
  // pool の組み合わせを再帰的列挙
  // availableconvertedPairs: ヘッドに変換可能か（{ "7p": true } または { "7p": false, "8p": true } の形式）
  const enumerateCombinations = (items, index, currentCombo, currentTileCount, target, availableconvertedPairs, results) => {
    if (currentTileCount === target) {
      results.push([...currentCombo]);
      return;
    }
    if (index >= items.length) return;
    enumerateCombinations(items, index + 1, currentCombo, currentTileCount, target, availableconvertedPairs, results);
    
    const item = items[index];
    if (item.type === "convertedPair") {
      if (!availableconvertedPairs[item.tiles[0]]) return;
    }
    
    const newAvailableconvertedPairs = { ...availableconvertedPairs };
    if (item.type === "triplet") {
      // 刻子を使用すると、その刻子をヘッドに変換出来なくなる
      newAvailableconvertedPairs[item.tiles[0]] = false;
    }
    
    if (currentTileCount + item.tileCount <= target) {
      currentCombo.push(item);
      enumerateCombinations(items, index + 1, currentCombo, currentTileCount + item.tileCount, target, newAvailableconvertedPairs, results);
      currentCombo.pop();
    }
  };
  
  // 候補の一意なキーの作成
  const getCandidateKey = (candidate) => {
    return getSinglesStringFromCandidate(candidate);
  };
  
  // 単体牌の数字を連結した文字列を作成
  const getSinglesStringFromCandidate = (candidate) => {
    const singles = candidate.filter(item => item.type === "single");
    const digits = singles.map(item => item.tiles[0].replace("s", ""));
    return digits.sort((a, b) => parseInt(a, 10) - parseInt(b, 10)).join("");
  };
  
  // 組み合わせ列挙
  const simulateCandidates = () => {
    const pool = createPool();
    let initialAvailableconvertedPairs = {};
    // 対子が存在しない場合、刻子の変換可否の初期値を設定
    if (!hand.hasPair && hand.tripletCount > 0) {
      if (hand.tripletCount === 1) {
        initialAvailableconvertedPairs["7p"] = true;
      } else if (hand.tripletCount >= 2) {
        initialAvailableconvertedPairs["7p"] = false;
        initialAvailableconvertedPairs["8p"] = true;
      }
    }
    const memoResults = [];
    enumerateCombinations(pool, 0, [], 0, maxHand, initialAvailableconvertedPairs, memoResults);
    let allCandidates = [...memoResults];
    // 各候補の重複排除
    const candidateMap = {};
    allCandidates.forEach(candidate => {
      const key = getCandidateKey(candidate);
      candidateMap[key] = candidate;
    });
    return Object.values(candidateMap);
  };
  
  // CSVマッチング：単体牌の数字を連結した文字列でマッチング
  const [simulationResults, setSimulationResults] = React.useState([]);
  React.useEffect(() => {
    if (!csvData || Object.keys(csvData).length === 0) {
      setSimulationResults([]);
      return;
    }
    const candidates = simulateCandidates();
    const candidateResults = [];
    candidates.forEach(candidate => {
      const singlesStr = getSinglesStringFromCandidate(candidate);
      const count = singlesStr.length;
      if (!ALLOWED_SINGLE_COUNTS.includes(count)) return;
      const csvRow = csvData[count.toString()] && csvData[count.toString()][singlesStr];
      if (csvRow) {
        candidateResults.push({
          loss: csvRow.loss,
          handStr: csvRow.hand,
          breakdown: csvRow.breakdown,
          candidate
        });
      }
    });
    if (candidateResults.length === 0) {
      setSimulationResults([]);
      return;
    }
    
    const minLoss = Math.min(...candidateResults.map(r => r.loss));
    let finalCandidates = [];
    for (let loss = minLoss; loss <= 12; loss++) {
      const group = candidateResults.filter(r => r.loss === loss);
      finalCandidates = finalCandidates.concat(group);
      if (finalCandidates.length >= 10) break;
    }
    setSimulationResults(finalCandidates);
  }, [hand, wall, csvData]);

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
          <Result simulationResults={simulationResults} />
        </div>
      </div>
    </Layout>
  );
};

export const Head = () => <Seo title="万万シミュレーター" />;
export default ManmanPage;
