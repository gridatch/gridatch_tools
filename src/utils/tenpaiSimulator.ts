import { HandComponent, HandState, ManmanCsvData, TenpaiResult } from "../types/simulation";

// CSVファイルに記載されているロス数の最大値
const MAX_LOSS = 12;

/**
 * 手牌と牌山から手牌パーツのプールを生成する関数
 * @param wall 牌山
 * @param hand 手牌
 * @returns プールに追加された手牌要素の配列
 */
const generateHandComponentPool = (hand: HandState, wall: string[]): HandComponent[] => {
  const pool: HandComponent[] = [];
  // 順子
  for (let i = 0; i < hand.sequenceCount; i++) {
    const tiles = i === 0 ? ["1p", "2p", "3p"] : ["4p", "5p", "6p"];
    pool.push({ type: "sequence", tiles, tileCount: 3 });
  }
  // 刻子
  for (let i = 0; i < hand.tripletCount; i++) {
    const tiles = i === 0 ? ["7p", "7p", "7p"] : ["8p", "8p", "8p"];
    pool.push({ type: "triplet", tiles, tileCount: 3 });
  }
  // 対子
  if (hand.hasPair) {
    pool.push({ type: "pair", tiles: ["9p", "9p"], tileCount: 2 });
  }
  // 単体牌（各4枚まで）
  const singlesCounter = new Map();
  // Mapを初期化（1s～9sの順）
  // ※js の Map の key は挿入順になることが保証されているため
  for (let i = 0; i < 9; i++) {
    singlesCounter.set(`${i + 1}s`, 0);
  }
  Object.keys(hand.singles).forEach(tile => {
    singlesCounter.set(tile, hand.singles[tile]);
  });
  wall.forEach(tile => {
    const current = singlesCounter.get(tile) || 0;
    if (current < 4) {
      singlesCounter.set(tile, current + 1);
    }
  });
  // Map の挿入順（1s～9s）に単体牌をプールに追加
  for (const [tile, count] of singlesCounter.entries()) {
    for (let i = 0; i < count; i++) {
      pool.push({ type: "single", tiles: [tile], tileCount: 1 });
    }
  }
  return pool;
};

/**
 * 全ての手牌を再帰的に列挙する
 * 再帰的にプールの手牌パーツを選択し、牌数が目標値になる手牌を results に追加する
 * @param pool プール
 * @param index 現在の手牌パーツのインデックス
 * @param currentHand 現在の手牌
 * @param currentTileCount 現在の牌数
 * @param targetTileCount 目標の牌数
 * @param tripletToConvert 変換対象の刻子
 * @param results 全ての手牌の配列
 */
const enumerateAllHands = (
  pool: HandComponent[],
  index: number,
  currentHand: HandComponent[],
  currentTileCount: number,
  targetTileCount: number,
  tripletToConvert: string,
  results: HandComponent[][]
): void => {
  if (currentTileCount === targetTileCount) {
    results.push([...currentHand]);
    return;
  }
  if (index >= pool.length) return;
  
  // 現在のユニットを選択しない場合
  enumerateAllHands(pool, index + 1, currentHand, currentTileCount, targetTileCount, tripletToConvert, results);
  
  const component = pool[index];
  
  if (currentTileCount + component.tileCount <= targetTileCount) {
    currentHand.push(component);
    enumerateAllHands(pool, index + 1, currentHand, currentTileCount + component.tileCount, targetTileCount, tripletToConvert, results);
    currentHand.pop();
  }
  
  // 刻子を変換した対子の追加
  if (component.type === "triplet" && component.tiles[0] === tripletToConvert) {
    const convertedPair: HandComponent = { type: "convertedPair", tiles: [tripletToConvert, tripletToConvert], tileCount: 2 };
    if (currentTileCount + convertedPair.tileCount <= targetTileCount) {
      currentHand.push(convertedPair);
      enumerateAllHands(pool, index + 1, currentHand, currentTileCount + convertedPair.tileCount, targetTileCount, tripletToConvert, results);
      currentHand.pop();
    }
  }
};

/**
 * CSVマッチング用のキーを、手牌パターンから生成する関数
 * 単体牌の数字のみを連結した文字列を返す（例: "1234567"）
 * @param hand 手牌
 * @returns キー文字列
 */
const getCsvKeyFromHand = (hand: HandComponent[]): string => {
  const singles = hand.filter(item => item.type === "single");
  return singles.map(item => item.tiles[0].replace("s", "")).join("");
};

/**
 * 手牌と牌山をもとに最適な聴牌形を計算する関数
 * @param current_hand 手牌の状態
 * @param wall 牌山の状態
 * @param maxHand 最大手牌枚数
 * @param csvData 聴牌系ごとのロスが記録されたCSVデータ
 * @returns 手牌パターンの配列
 */
export const computeOptimalTenpais = (
  current_hand: HandState,
  wall: string[],
  maxHand: number,
  csvData: ManmanCsvData
): TenpaiResult[] => {
  if (!csvData || Object.keys(csvData).length === 0) return [];
  
  const pool = generateHandComponentPool(current_hand, wall);
  let tripletToConvert = "";
  if (!current_hand.hasPair && current_hand.tripletCount > 0) {
    if (current_hand.tripletCount === 1) {
      tripletToConvert = "7p";
    } else if (current_hand.tripletCount === 2) {
      tripletToConvert = "8p";
    }
  }
  let allHands: HandComponent[][] = [];
  enumerateAllHands(pool, 0, [], 0, maxHand, tripletToConvert, allHands);
  
  // 単体牌が一致している手牌を重複排除する
  const allHandMap: { [key: string]: HandComponent[] } = {};
  allHands.forEach(hand => {
    const key = getCsvKeyFromHand(hand);
    allHandMap[key] = hand;
  });
  allHands = Object.values(allHandMap);
  
  const tenpais: TenpaiResult[] = [];
  allHands.forEach(hand => {
    const csvKey = getCsvKeyFromHand(hand);
    const count = csvKey.length;
    if (!Object.keys(csvData).includes(count.toString())) return;
    const csvRow = csvData[count.toString()] && csvData[count.toString()][csvKey];
    if (csvRow) {
      tenpais.push({
        loss: csvRow.loss,
        key: csvRow.key,
        breakdown: csvRow.breakdown,
        hand
      });
    }
  });
  if (tenpais.length === 0) return tenpais;
  
  let optimalTenpais: TenpaiResult[] = [];
  const minLoss = Math.min(...tenpais.map(r => r.loss));
  for (let loss = minLoss; loss <= MAX_LOSS; loss++) {
    const tempaisByLoss = tenpais.filter(tenpai => tenpai.loss === loss);
    optimalTenpais = optimalTenpais.concat(tempaisByLoss);
    if (optimalTenpais.length >= 10) break;
  }
  return optimalTenpais;
};
