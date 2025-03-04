export const PINZU_BLOCKS = ["sequence", "triplet", "pair"] as const;
export const SOZU_TILES = ["1s", "2s", "3s", "4s", "5s", "6s", "7s", "8s", "9s"] as const;
export const HAND_COMPONENTS = [...PINZU_BLOCKS, ...SOZU_TILES] as const;

export type PinzuBlock = (typeof PINZU_BLOCKS)[number];
export type Sozu = (typeof SOZU_TILES)[number];
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

export interface ManmanTenpaiResult {
  loss: number;
  key: string;
  breakdown: string;
  hand: Hand;
}

export interface SozuTenpaiResult {
  totalWaits: number;
  key: string;
  waits: {
    [key in Sozu]: number
  };
  hand: Hand;
}