import React from "react";
import Layout from "../components/layout"
import Seo from "../components/seo"
import styles from "./manman.module.css"
import DynamicSVGText from "../components/dynamicSVGText"
import DynamicSVGTextSequence from "../components/dynamicSVGTextSequence";
import { useWallState } from "../hooks/useWallState";
import { useHandState } from "../hooks/useHandState";
import Wall from "../components/wall";
import Hand from "../components/hand";
import Result from "../components/result";

// CSVファイル名に対応する索子牌の枚数
const ALLOWED_SINGLE_COUNTS = [6, 7, 9, 10, 12];

const ManmanPage = () => {
  // 牌山の管理
  const { wall, addWall, removeWall, maxWall } = useWallState();
  const {
    hand,
    addHandTile,
    removeSingle,
    addSequenceSet,
    addTripletSet,
    addHeadSet,
    removeSequenceSet,
    removeTripletSet,
    removeHeadSet,
    maxHand
  } = useHandState();
  
  // CSV読み込み
  // csvData の形式は { "[手牌の枚数]": { "[手牌]": { [ロス数], [手牌], [内訳] } } }
  const [csvData, setCsvData] = React.useState({});
  React.useEffect(() => {
    const fileNames = ["6", "7", "9", "10", "12"];
    Promise.all(
      fileNames.map(name =>
        fetch(`/csv/${name}.csv`)
          .then(res => {
            if (!res.ok) throw new Error(`Failed to load ${name}.csv`);
            return res.text();
          })
          .then(text => {
            const lines = text.split("\n").map(line => line.trim()).filter(line => line);
            const data = {};
            if (lines.length > 1) {
              // ヘッダー行を無視
              lines.slice(1).forEach(line => {
                const parts = line.split(",");
                const handStr = parts[1];
                data[handStr] = {
                  loss: parseInt(parts[0], 10),
                  hand: handStr,
                  breakdown: parts[2] || ""
                };
              });
            }
            return { key: name, data };
          })
          .catch(error => {
            console.error(error);
            return { key: name, data: {} };
          })
      )
    ).then(results => {
      const csvMap = {};
      results.forEach(({ key, data }) => {
        csvMap[key] = data;
      });
      setCsvData(csvMap);
    });
  }, []);  
  
  // シミュレーション
  // プール作成：手牌のセットと単体牌、牌山の牌をまとめる
  const createPool = () => {
    const pool = [];
    
    // 順子
    for (let i = 0; i < hand.sequenceCount; i++) {
      const tiles = (i === 0) ? ["1p", "2p", "3p"] : ["4p", "5p", "6p"];
      pool.push({ type: "sequence", tiles, weight: 3 });
    }
    // 刻子
    for (let i = 0; i < hand.tripletCount; i++) {
      const tiles = (i === 0) ? ["7p", "7p", "7p"] : ["8p", "8p", "8p"];
      pool.push({ type: "triplet", tiles, weight: 3 });
    }
    // 対子
    if (hand.head) {
      pool.push({ type: "head", tiles: ["9p", "9p"], weight: 2 });
    }
    // 対子が存在しない場合、刻子を対子に変換
    if (!hand.head && hand.tripletCount > 0) {
      if (hand.tripletCount === 1) {
        // 1組の場合：["7p", "7p"]
        pool.push({ type: "convertedHead", tiles: ["7p", "7p"], weight: 2 });
      } else if (hand.tripletCount === 2) {
        // 2組の場合：["8p", "8p"]
        pool.push({ type: "convertedHead", tiles: ["8p", "8p"], weight: 2 });
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
        pool.push({ type: "single", tiles: [tile], weight: 1 });
      }
    }
    return pool;
  };  
  
  // pool の組み合わせを再帰的列挙
  // availableConvertedHeads: ヘッドに変換可能か（{ "7p": true } または { "7p": false, "8p": true } の形式）
  const enumerateCombinations = (items, index, currentCombo, currentWeight, target, availableConvertedHeads, results) => {
    if (currentWeight === target) {
      results.push([...currentCombo]);
      return;
    }
    if (index >= items.length) return;
    enumerateCombinations(items, index + 1, currentCombo, currentWeight, target, availableConvertedHeads, results);
    
    const item = items[index];
    if (item.type === "convertedHead") {
      if (!availableConvertedHeads[item.tiles[0]]) return;
    }
    
    const newAvailableConvertedHeads = { ...availableConvertedHeads };
    if (item.type === "triplet") {
      // 刻子を使用すると、その刻子をヘッドに変換出来なくなる
      newAvailableConvertedHeads[item.tiles[0]] = false;
    }
    
    if (currentWeight + item.weight <= target) {
      currentCombo.push(item);
      enumerateCombinations(items, index + 1, currentCombo, currentWeight + item.weight, target, newAvailableConvertedHeads, results);
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
    let initialAvailableConvertedHeads = {};
    // 対子が存在しない場合、刻子の変換可否の初期値を設定
    if (!hand.head && hand.tripletCount > 0) {
      if (hand.tripletCount === 1) {
        initialAvailableConvertedHeads["7p"] = true;
      } else if (hand.tripletCount >= 2) {
        initialAvailableConvertedHeads["7p"] = false;
        initialAvailableConvertedHeads["8p"] = true;
      }
    }
    const memoResults = [];
    enumerateCombinations(pool, 0, [], 0, maxHand, initialAvailableConvertedHeads, memoResults);
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
          <Wall wall={wall} addWall={addWall} removeWall={removeWall} maxWall={maxWall} />
          <Hand 
            hand={hand}
            addHandTile={addHandTile}
            removeSingle={removeSingle}
            addSequenceSet={addSequenceSet}
            addTripletSet={addTripletSet}
            addHeadSet={addHeadSet}
            removeSequenceSet={removeSequenceSet}
            removeTripletSet={removeTripletSet}
            removeHeadSet={removeHeadSet}
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
