import { SozuHand, ManmanCsvData, Sozu, ManmanTenpaiResult, HAND_COMPONENTS, HAND_COMPONENTS_TILE_COUNT, SOZU_TILES, SozuCsvData, SozuTenpaiResult, HandComponent, HAND_COMPONENT_RECORD_0 } from '@shared/types/simulation';

// CSVファイルに記載されているロス数の最大値
const MAX_LOSS = 12;

/**
 * 手牌と牌山を混ぜて（手牌パーツの数を合計して）手牌パーツのプールを生成する関数
 * @param hand 手牌
 * @param wall 牌山
 * @returns プール
 */
const generateHandComponentPool = (hand: SozuHand, wall: Sozu[]): Record<HandComponent, number> => {
  const pool: Record<HandComponent, number> = { ...hand.closed };
  if (hand.drawn !== 'empty') ++pool[hand.drawn];

  wall.forEach(tile => {
    if (pool[tile] < 4) ++pool[tile];
  });
  return pool;
};

/**
 * 全ての手牌を再帰的に列挙する
 * 再帰的にプールの手牌パーツを選択し、牌数が目標値になる手牌を results に追加する
 * @param pool プール
 * @param componentIndex 現在の手牌パーツのインデックス
 * @param currentHand 現在の手牌
 * @param currentTileCount 現在の牌数
 * @param targetTileCount 目標の牌数
 * @param results 結果を格納する配列
 */
const enumerateAllHands = (
  pool: Record<HandComponent, number>,
  componentIndex: number,
  currentHand: Record<HandComponent, number>,
  currentTileCount: number,
  targetTileCount: number,
  results: Record<HandComponent, number>[],
): void => {
  if (currentTileCount === targetTileCount) {
    results.push({ ...currentHand });
    return;
  }
  if (componentIndex >= HAND_COMPONENTS.length) return;

  const component = HAND_COMPONENTS[componentIndex];

  // 現在の手牌パーツを選択する
  for (let componentCount = pool[component]; componentCount >= 0; --componentCount) {
    if (currentTileCount + HAND_COMPONENTS_TILE_COUNT[component] * componentCount <= targetTileCount) {
      currentHand[component] += componentCount;
      enumerateAllHands(pool, componentIndex + 1, currentHand, currentTileCount + HAND_COMPONENTS_TILE_COUNT[component] * componentCount, targetTileCount, results);
      currentHand[component] -= componentCount;
    }
  }

  // 刻子を変換した対子の追加
  // プールに対子が存在せず、選択していない刻子が余っている場合のみ
  if (component === 'pair' && pool.pair === 0 && pool.triplet - currentHand.triplet >= 1) {
    const componentCount = 1;
    if (currentTileCount + HAND_COMPONENTS_TILE_COUNT[component] * componentCount <= targetTileCount) {
      currentHand[component] += componentCount;
      enumerateAllHands(pool, componentIndex + 1, currentHand, currentTileCount + HAND_COMPONENTS_TILE_COUNT[component] * componentCount, targetTileCount, results);
      currentHand[component] -= componentCount;
    }
  }

  // 現在の手牌パーツを選択しない
  enumerateAllHands(pool, componentIndex + 1, currentHand, currentTileCount, targetTileCount, results);
};

/**
 * CSVマッチング用のキーを、手牌から生成する関数
 * 索子の数字のみを連結した文字列を返す（例: "1234567"）
 * @param hand 手牌
 * @returns キー文字列
 */
const getCsvKeyFromHand = (hand: Record<HandComponent, number>): string => {
  let csvKey = '';
  SOZU_TILES.forEach(tile => {
    const digitStr = tile.replace('s', '');
    for (let i = 0; i < hand[tile]; ++i) {
      csvKey += digitStr;
    }
  });
  return csvKey;
};

/**
 * 手牌と牌山をもとに最適な聴牌形を計算する関数
 * @param handState 手牌の状態
 * @param wall 牌山の状態
 * @param maxHand 最大手牌枚数
 * @param csvData 聴牌系ごとのロスが記録されたCSVデータ
 * @returns 手牌パターンの配列
 */
export const computeOptimalManmanTenpais = (
  handState: SozuHand,
  wall: Sozu[],
  maxHand: number,
  csvData: ManmanCsvData,
): ManmanTenpaiResult[] => {
  if (!csvData || Object.keys(csvData).length === 0) return [];

  const pool = generateHandComponentPool(handState, wall);

  let allHands: Record<HandComponent, number>[] = [];
  enumerateAllHands(pool, 0, { ...HAND_COMPONENT_RECORD_0 }, 0, maxHand, allHands);

  // 単体牌が一致している手牌を重複排除する
  const allHandMap: { [key: string]: Record<HandComponent, number> } = {};
  allHands.forEach(hand => {
    const key = getCsvKeyFromHand(hand);
    allHandMap[key] = hand;
  });
  allHands = Object.values(allHandMap);

  const tenpais: ManmanTenpaiResult[] = [];
  allHands.forEach(hand => {
    const csvKey = getCsvKeyFromHand(hand);
    const sozuCountStr = csvKey.length.toString();
    if (!(sozuCountStr in csvData)) return;
    const csvRow = csvData[sozuCountStr] && csvData[sozuCountStr][csvKey];
    if (csvRow) {
      tenpais.push({
        loss: csvRow.loss,
        key: csvRow.key,
        breakdown: csvRow.breakdown,
        hand,
      });
    }
  });
  if (tenpais.length === 0) return tenpais;

  let optimalTenpais: ManmanTenpaiResult[] = [];
  const minLoss = Math.min(...tenpais.map(r => r.loss));
  for (let loss = minLoss; loss <= MAX_LOSS; loss++) {
    const tempaisByLoss = tenpais.filter(tenpai => tenpai.loss === loss);
    optimalTenpais = optimalTenpais.concat(tempaisByLoss);
    if (optimalTenpais.length >= 10) break;
  }
  return optimalTenpais;
};

/**
 * 手牌と牌山をもとに最適な聴牌形を計算する関数
 * @param handState 手牌の状態
 * @param wall 牌山の状態
 * @param maxHand 最大手牌枚数
 * @param csvData 聴牌系ごとの待ちが記録されたCSVデータ
 * @returns 手牌パターンの配列
 */
export const computeOptimalSozuTenpais = (
  handState: SozuHand,
  wall: Sozu[],
  maxHand: number,
  csvData: SozuCsvData,
): SozuTenpaiResult[] => {
  if (!csvData || Object.keys(csvData).length === 0) return [];

  const pool = generateHandComponentPool(handState, wall);

  let allHands: Record<HandComponent, number>[] = [];
  enumerateAllHands(pool, 0, { ...HAND_COMPONENT_RECORD_0 }, 0, maxHand, allHands);

  // 単体牌が一致している手牌を重複排除する
  const allHandMap: { [key: string]: Record<HandComponent, number> } = {};
  allHands.forEach(hand => {
    const key = getCsvKeyFromHand(hand);
    allHandMap[key] = hand;
  });
  allHands = Object.values(allHandMap);

  const tenpais: SozuTenpaiResult[] = [];
  allHands.forEach(hand => {
    const csvKey = getCsvKeyFromHand(hand);
    const sozuCountStr = csvKey.length.toString();
    if (!(sozuCountStr in csvData)) return;
    const csvRow = csvData[sozuCountStr] && csvData[sozuCountStr][csvKey];
    if (csvRow) {
      tenpais.push({
        totalWaits: csvRow.totalWaits,
        key: csvRow.key,
        waits: csvRow.waits,
        hand,
      });
    }
  });
  if (tenpais.length === 0) return tenpais;

  let optimalTenpais: SozuTenpaiResult[] = [];
  const maxWaits = Math.max(...tenpais.map(r => r.totalWaits));
  for (let waitCount = maxWaits; waitCount >= 1; --waitCount) {
    const tempaisByWaitCount = tenpais.filter(tenpai => tenpai.totalWaits === waitCount);
    optimalTenpais = optimalTenpais.concat(tempaisByWaitCount);
    if (optimalTenpais.length >= 10) break;
  }
  return optimalTenpais;
};
