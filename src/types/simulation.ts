// --- 基本型 ---
export const SANMA_MANZU_TILES = ["1m", "9m"] as const;
export const PINZU_TILES = ["1p", "2p", "3p", "4p", "5p", "6p", "7p", "8p", "9p"] as const;
export const SOZU_TILES = ["1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s"] as const;
export const WIND_TILES = ["E", "S", "W", "N"] as const;
export const DRAGON_TILES = ["P", "F", "C"] as const;
export const SANMA_TILES = [...SANMA_MANZU_TILES, ...PINZU_TILES, ...SOZU_TILES, ...WIND_TILES, ...DRAGON_TILES] as const;

export type SanmaManzu = (typeof SANMA_MANZU_TILES)[number];
export type Pinzu = (typeof PINZU_TILES)[number];
export type Sozu = (typeof SOZU_TILES)[number];
export type Wind = (typeof WIND_TILES)[number];
export type Dragon = (typeof DRAGON_TILES)[number];
export type SanmaTile = (typeof SANMA_TILES)[number];

export const isPinzuTile = (tile: string): tile is Pinzu => (PINZU_TILES as readonly string[]).includes(tile);
export const isSozuTile = (tile: string): tile is Sozu => (SOZU_TILES as readonly string[]).includes(tile);
export const isSanmaManzuTile = (tile: string): tile is SanmaManzu => (SANMA_MANZU_TILES as readonly string[]).includes(tile);
export const isWindTile = (tile: string): tile is Wind => (WIND_TILES as readonly string[]).includes(tile);
export const isDragonTile = (tile: string): tile is Dragon => (DRAGON_TILES as readonly string[]).includes(tile);
export const isSanmaTile = (tile: string): tile is SanmaTile => (SANMA_TILES as readonly string[]).includes(tile);

// --- 待ち牌シミュレーター（万万、索子） ---
export const PINZU_BLOCKS = ["sequence", "triplet", "pair"] as const;
export const HAND_COMPONENTS = [...PINZU_BLOCKS, ...SOZU_TILES] as const;
export type PinzuBlock = (typeof PINZU_BLOCKS)[number];
export type HandComponent = (typeof HAND_COMPONENTS)[number];

export type Hand = {
  [key in HandComponent]: number
};

export const INITIAL_HAND: Hand = Object.fromEntries(HAND_COMPONENTS.map(component => [component, 0])) as Hand;
export const HAND_COMPONENTS_TILE_COUNT: Hand = Object.fromEntries(HAND_COMPONENTS.map(component => { 
  if (component === "sequence" || component === "triplet") return [component, 3];
  if (component === "pair") return [component, 2];
  return [component, 1];
})) as Hand;

export interface ManmanCsvRow {
  loss: number;
  key: string;
  breakdown: string;
}

export interface ManmanCsvData {
  [tileCount: string]: {
    [key: string]: ManmanCsvRow;
  };
}

export interface ManmanTenpaiResult {
  loss: number;
  key: string;
  breakdown: string;
  hand: Hand;
}

export interface SozuCsvRow {
  totalWaits: number;
  key: string;
  waits: {
    [key in Sozu]: number
  };
};

export interface SozuCsvData {
  [tileCount: string]: {
    [key: string]: SozuCsvRow;
  };
}

export interface SozuTenpaiResult {
  totalWaits: number;
  key: string;
  waits: {
    [key in Sozu]: number
  };
  hand: Hand;
}

// --- 領域 ---
export const DORA_BOSSES = ["dora_indicator", "dora_manzu", "dora_pinzu", "dora_sozu", "others", "empty"] as const;
export type DoraBoss = (typeof DORA_BOSSES)[number];
