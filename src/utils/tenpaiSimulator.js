// CSVファイルに記載されているロス数の最大値
const MAX_LOSS = 12;

/**
 * 手牌と牌山から手牌パーツのプールを生成する関数
 * @param {string[]} wall 牌山（牌の文字列の配列）
 * @param {object} hand 手牌（sequenceCount, tripletCount, hasPair, singles）
 * @returns {Array} プールに追加された手牌要素の配列
 */
const generateHandComponentPool = (hand, wall) => {
  const pool = [];
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
 * @param {Array} pool プール
 * @param {number} index 現在の手牌パーツのインデックス
 * @param {Array} currentHand 現在の手牌
 * @param {number} currentTileCount 現在の牌数
 * @param {number} targetTileCount 目標の牌数
 * @param {string} tripletToConvert 変換対象の刻子
 * @param {Array} results 全ての手牌の配列
 */
const enumerateAllHands = (pool, index, currentHand, currentTileCount, targetTileCount, tripletToConvert, results) => {
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
    const convertedPair = { type: "convertedPair", tiles: [tripletToConvert, tripletToConvert], tileCount: 2 };
    if (currentTileCount + convertedPair.tileCount <= targetTileCount) {
      currentHand.push(convertedPair);
      enumerateAllHands(pool, index + 1, currentHand, currentTileCount + convertedPair.tileCount, targetTileCount, tripletToConvert, results);
      currentHand.pop();
    }
  }
};

/**
 * CSVマッチングで使用するキーとして、手牌に含まれる単体牌の数字のみを連結した文字列を返す
 * @param {Array} hand 手牌
 * @returns {string} 単体牌の数字のみを連結した文字列（例: "1234567"）
 */
const getCsvKeyFromHand = (hand) => {
  const singles = hand.filter(item => item.type === "single");
  return singles.map(item => item.tiles[0].replace("s", "")).join("");
};

/**
 * 手牌パターンを生成し、重複排除して返す
 * @param {object} hand 手牌の状態
 * @param {Array} wall 牌山の状態
 * @param {number} maxHand 最大手牌枚数
 * @param {Object} csvData 聴牌系ごとのロスが記録されたCSVデータ
 * @returns {Array} 手牌パターンの配列
 */
export const computeOptimalTenpais = (hand, wall, maxHand, csvData) => {
  if (!csvData || Object.keys(csvData).length === 0) return [];
  
  const pool = generateHandComponentPool(hand, wall);
  let tripletToConvert = "";
  if (!hand.hasPair && hand.tripletCount > 0) {
    if (hand.tripletCount === 1) {
      tripletToConvert = "7p";
    } else if (hand.tripletCount === 2) {
      tripletToConvert = "8p";
    }
  }
  let allHands = [];
  enumerateAllHands(pool, 0, [], 0, maxHand, tripletToConvert, allHands);
  
  // 単体牌が一致している手牌を重複排除する
  const handPatternMap = {};
  allHands.forEach(handPattern => {
    const key = getCsvKeyFromHand(handPattern);
    handPatternMap[key] = handPattern;
  });
  allHands = Object.values(handPatternMap);
  
  const tenpais = [];
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
  
  let optimalTenpais = [];
  const minLoss = Math.min(...tenpais.map(r => r.loss));
  for (let loss = minLoss; loss <= MAX_LOSS; loss++) {
    const tempaisByLoss = tenpais.filter(tenpai => tenpai.loss === loss);
    optimalTenpais = optimalTenpais.concat(tempaisByLoss);
    if (optimalTenpais.length >= 10) break;
  }
  return optimalTenpais;
};
