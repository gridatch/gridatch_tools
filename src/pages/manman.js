import React from "react";
import Layout from "../components/layout"
import Seo from "../components/seo"
import styles from "./manman.module.css"
import DynamicSVGText from "../components/dynamicSVGText"
import DynamicSVGTextSequence from "../components/dynamicSVGTextSequence";
import { useWallState } from "../hooks/useWallState";
import { useHandState } from "../hooks/useHandState";

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

  // 手牌表示
  const handTilesToRender = [];
  // 順子：1セット目は 1p,2p,3p; 2セット目は 4p,5p,6p
  for (let i = 0; i < hand.sequenceCount; i++) {
    if (i === 0) {
      handTilesToRender.push({ key: `seq0_1`, tile: "1p", onClick: removeSequenceSet });
      handTilesToRender.push({ key: `seq0_2`, tile: "2p", onClick: removeSequenceSet });
      handTilesToRender.push({ key: `seq0_3`, tile: "3p", onClick: removeSequenceSet });
    } else if (i === 1) {
      handTilesToRender.push({ key: `seq1_1`, tile: "4p", onClick: removeSequenceSet });
      handTilesToRender.push({ key: `seq1_2`, tile: "5p", onClick: removeSequenceSet });
      handTilesToRender.push({ key: `seq1_3`, tile: "6p", onClick: removeSequenceSet });
    }
  }
  // 刻子：1セット目は 7p,7p,7p; 2セット目は 8p,8p,8p
  for (let i = 0; i < hand.tripletCount; i++) {
    if (i === 0) {
      handTilesToRender.push({ key: `trip0_1`, tile: "7p", onClick: removeTripletSet });
      handTilesToRender.push({ key: `trip0_2`, tile: "7p", onClick: removeTripletSet });
      handTilesToRender.push({ key: `trip0_3`, tile: "7p", onClick: removeTripletSet });
    } else if (i === 1) {
      handTilesToRender.push({ key: `trip1_1`, tile: "8p", onClick: removeTripletSet });
      handTilesToRender.push({ key: `trip1_2`, tile: "8p", onClick: removeTripletSet });
      handTilesToRender.push({ key: `trip1_3`, tile: "8p", onClick: removeTripletSet });
    }
  }
  // 対子の表示：9p,9p
  if (hand.head) {
    handTilesToRender.push({ key: `head_1`, tile: "9p", onClick: removeHeadSet });
    handTilesToRender.push({ key: `head_2`, tile: "9p", onClick: removeHeadSet });
  }
  // 単体牌の表示（1s～9sの昇順）
  Object.keys(hand.singles)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .forEach(tile => {
      const count = hand.singles[tile];
      for (let i = 0; i < count; i++) {
        handTilesToRender.push({
          key: `single_${tile}_${i}`,
          tile,
          onClick: () => removeSingle(tile)
        });
      }
    });
  while (handTilesToRender.length < maxHand) {
    handTilesToRender.push({
      key: `empty_${handTilesToRender.length}`,
      tile: "empty",
      onClick: null
    });
  }
  
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
      pool.push({ type: "set", setType: "sequence", tiles, weight: 3 });
    }
    // 刻子
    for (let i = 0; i < hand.tripletCount; i++) {
      const tiles = (i === 0) ? ["7p", "7p", "7p"] : ["8p", "8p", "8p"];
      pool.push({ type: "set", setType: "triplet", tiles, weight: 3 });
    }
    // 対子
    if (hand.head) {
      pool.push({ type: "set", setType: "head", tiles: ["9p", "9p"], weight: 2 });
    }
    // 対子が存在しない場合、刻子を対子に変換
    if (!hand.head && hand.tripletCount > 0) {
      if (hand.tripletCount === 1) {
        // 1組の場合：["7p", "7p"]
        pool.push({ type: "convertedHead", tile: "7p", weight: 2 });
      } else if (hand.tripletCount === 2) {
        // 2組の場合：["8p", "8p"]
        pool.push({ type: "convertedHead", tile: "8p", weight: 2 });
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
        pool.push({ type: "single", tile, weight: 1 });
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
      if (!availableConvertedHeads[item.tile]) return;
    }
    
    const newAvailableConvertedHeads = { ...availableConvertedHeads };
    if (item.type === "set" && item.setType === "triplet") {
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
    const digits = singles.map(item => item.tile.replace("s", ""));
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
  
  // 結果表示：表示順は【万象牌】【順子】【刻子】【対子（変換含む）】【単体牌（1s～9s昇順）】
  const renderSimulationResults = () => {
    if (simulationResults.length === 0) return null;
    return simulationResults.map((result, idx) => {
      // グループ別に分ける
      const sequenceItems = result.candidate.filter(item => item.type === "set" && item.setType === "sequence");
      const tripletItems = result.candidate.filter(item => item.type === "set" && item.setType === "triplet");
      const headItems = result.candidate.filter(item => (item.type === "set" && item.setType === "head") || item.type === "convertedHead");
      const singleItems = result.candidate.filter(item => item.type === "single");
      const renderedItems = [];
      // 順子
      sequenceItems.forEach(item => {
        item.tiles.forEach((tile, j) => {
          renderedItems.push(
            <img key={`${idx}_seq_${j}`} className={styles.hand_tile} src={`/tiles/${tile}.png`} alt={tile} />
          );
        });
      });
      // 刻子
      tripletItems.forEach(item => {
        item.tiles.forEach((tile, j) => {
          renderedItems.push(
            <img key={`${idx}_trip_${tile}_${j}`} className={styles.hand_tile} src={`/tiles/${tile}.png`} alt={tile} />
          );
        });
      });
      // 対子
      headItems.forEach(item => {
        if (item.type === "convertedHead") {
          [0, 1].forEach(j => {
            renderedItems.push(
              <img key={`${idx}_convHead_${j}`} className={styles.hand_tile} src={`/tiles/${item.tile}.png`} alt={item.tile} />
            );
          });
        } else {
          item.tiles.forEach((tile, j) => {
            renderedItems.push(
              <img key={`${idx}_head_${j}`} className={styles.hand_tile} src={`/tiles/${tile}.png`} alt={tile} />
            );
          });
        }
      });
      // 単体牌（1s～9s昇順）
      singleItems.forEach((item, i) => {
        renderedItems.push(
          <img key={`${idx}_single_${i}`} className={styles.hand_tile} src={`/tiles/${item.tile}.png`} alt={item.tile} />
        );
      });
      
      return (
        <div key={`result_${idx}`} className={styles.result}>
          <div className={styles.loss}>
            <DynamicSVGTextSequence text={["ロス", ...`${result.loss}`, "枚", ...(result.breakdown && `（${result.breakdown}）`)]} />
          </div>
          <div className={styles.hand}>
            <img className={styles.hand_tile} src={`/tiles/wild.png`} alt="万象牌" />
            {renderedItems}
          </div>
        </div>
      );
    });
  };

  return (
    <Layout>
      <div className={styles.container}>
        <DynamicSVGText text={"万万シミュレーター"} />
        <div className={styles.contents}>
          {/* 牌山エリア */}
          <section className={styles.wall_section}>
            <div>
              <div className={styles.area_title}><DynamicSVGText text={"牌山"} /></div>
              <div id="wall" className={`${styles.area} ${styles.wall}`}>
                { [...Array(maxWall).keys()].map(i => {
                    if (i < wall.length) {
                      const tile = wall[i];
                      return (
                        <img key={`wall_${i}`} className={styles.wall_tile} src={`/tiles/${tile}.png`} onClick={() => removeWall(i)} alt={tile} />
                      );
                    } else {
                      return (
                        <img key={`wall_${i}`} className={styles.wall_tile} src={`/tiles/empty.png`} alt="empty" />
                      );
                    }
                  })
                }
              </div>
            </div>
            <div>
              <div className={styles.area_title}><DynamicSVGText text={"牌選択ボタン"} /></div>
              <div id="wall_choices" className={`${styles.area} ${styles.tile_choices}`}>
                { [...Array(9).keys()].map(i => {
                    const tile = `${i+1}s`;
                    return (
                      <img key={`wall_choice_${i}`} className={styles.tile_choice} src={`/tiles/${tile}.png`} onClick={() => addWall(tile)} alt={tile} />
                    );
                  })
                }
              </div>
            </div>
          </section>
          {/* 手牌エリア */}
          <section className={styles.hand_section}>
            <div>
              <div className={styles.area_title}><DynamicSVGText text={"手牌"} /></div>
              <div id="hand" className={`${styles.area} ${styles.hand}`}>
                <img className={styles.hand_tile} src={`/tiles/wild.png`} alt="万象牌" />
                { handTilesToRender.map(item => (
                    <img key={item.key} className={styles.hand_tile} src={`/tiles/${item.tile}.png`} onClick={item.onClick ? item.onClick : undefined} alt={item.tile} />
                  ))
                }
              </div>
            </div>
            <div>
              <div className={styles.area_title}><DynamicSVGText text={"牌選択ボタン"} /></div>
              <div id="hand_choices" className={`${styles.area} ${styles.tile_choices}`}>
                { [...Array(9).keys()].map(i => {
                    const tile = `${i+1}s`;
                    return (
                      <img key={`hand_choice_${i}`} className={styles.tile_choice} src={`/tiles/${tile}.png`} onClick={() => addHandTile(tile)} alt={tile} />
                    );
                  })
                }
              </div>
              <div id="other_color_choices" className={`${styles.area} ${styles.othe_color_choices}`}>
                <div className={styles.set_choice} onClick={addSequenceSet}>
                  <img className={styles.set_choice_tile} src="/tiles/1p.png" alt="他色順子" />
                  <img className={styles.set_choice_tile} src="/tiles/2p.png" alt="他色順子" />
                  <img className={styles.set_choice_tile} src="/tiles/3p.png" alt="他色順子" />
                </div>
                <div className={styles.set_choice} onClick={addTripletSet}>
                  <img className={styles.set_choice_tile} src="/tiles/7p.png" alt="他色刻子" />
                  <img className={styles.set_choice_tile} src="/tiles/7p.png" alt="他色刻子" />
                  <img className={styles.set_choice_tile} src="/tiles/7p.png" alt="他色刻子" />
                </div>
                <div className={styles.head_choice} onClick={addHeadSet}>
                  <img className={styles.head_choice_tile} src="/tiles/9p.png" alt="他色対子" />
                  <img className={styles.head_choice_tile} src="/tiles/9p.png" alt="他色対子" />
                </div>
              </div>
            </div>
          </section>
          {/* 結果エリア */}
          <section className={styles.result_section}>
            <div>
              <div className={styles.area_title}><DynamicSVGText text={"最終形"} /><span style={{fontSize: "var(--font-sx)"}}><DynamicSVGText text={"※ロス数12枚以下の形を表示（10件以上の時は省略）"} /></span></div>
              <div id="results" className={`${styles.area} ${styles.results}`}>
                { renderSimulationResults() }
              </div>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export const Head = () => <Seo title="万万シミュレーター" />;
export default ManmanPage;
