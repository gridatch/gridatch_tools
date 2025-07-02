import { deepFreeze } from '@shared/utils/common';

// --- 基本型 ---
export const SANMA_MANZU_TILES = ['1m', '9m'] as const;
export const PINZU_TILES = ['1p', '2p', '3p', '4p', '5p', '6p', '7p', '8p', '9p'] as const;
export const SOZU_TILES = ['1s', '2s', '3s', '4s', '5s', '6s', '7s', '8s', '9s'] as const;
export const WIND_TILES = ['E', 'S', 'W', 'N'] as const;
export const DRAGON_TILES = ['P', 'F', 'C'] as const;
export const SANMA_TILES = [...SANMA_MANZU_TILES, ...PINZU_TILES, ...SOZU_TILES, ...WIND_TILES, ...DRAGON_TILES] as const;
export const WALL_TILES = [...SANMA_TILES, 'closed', 'empty'] as const;
export const NON_SEQUENTIAL_TILES = [...SANMA_MANZU_TILES, ...WIND_TILES, ...DRAGON_TILES] as const;

export type SanmaManzu = (typeof SANMA_MANZU_TILES)[number];
export type Pinzu = (typeof PINZU_TILES)[number];
export type Sozu = (typeof SOZU_TILES)[number];
export type Wind = (typeof WIND_TILES)[number];
export type Dragon = (typeof DRAGON_TILES)[number];
export type SanmaTile = (typeof SANMA_TILES)[number];
export type WallTile = (typeof WALL_TILES)[number];
export type NonSequentialTile = (typeof NON_SEQUENTIAL_TILES)[number];

export const isPinzuTile = (tile: string): tile is Pinzu => (PINZU_TILES as readonly string[]).includes(tile);
export const isSozuTile = (tile: string): tile is Sozu => (SOZU_TILES as readonly string[]).includes(tile);
export const isSanmaManzuTile = (tile: string): tile is SanmaManzu => (SANMA_MANZU_TILES as readonly string[]).includes(tile);
export const isWindTile = (tile: string): tile is Wind => (WIND_TILES as readonly string[]).includes(tile);
export const isDragonTile = (tile: string): tile is Dragon => (DRAGON_TILES as readonly string[]).includes(tile);
export const isSanmaTile = (tile: string): tile is SanmaTile => (SANMA_TILES as readonly string[]).includes(tile);
export const isWallTile = (tile: string): tile is WallTile => (WALL_TILES as readonly string[]).includes(tile);
export const isNonSequentialTile = (tile: string): tile is NonSequentialTile => (NON_SEQUENTIAL_TILES as readonly string[]).includes(tile);

export const TILE_FACES = ['default', 'cat_saint'] as const;
export const TILE_BACKS = [
  'orange',
  'red',
  'shuriken',
  'orientation',
  'cat_saint',
  'happy_orange',
  'small_cosmos',
  'meeting_the_butterfly',
  'tranquil_night_lights',
] as const;

export type TileFace = (typeof TILE_FACES)[number];
export type TileBack = (typeof TILE_BACKS)[number];

export const PLAIN_TILES: WallTile[] = ['P'] as const;
export const PLAIN_TILE_BACKS: TileBack[] = ['orange', 'red'] as const;

export const SANMA_RED_TILES = ['5pr', '5sr'] as const;
export type SanmaRedTile = (typeof SANMA_RED_TILES)[number];
export const isSanmaRedTile = (tile: string): tile is SanmaRedTile => (SANMA_RED_TILES as readonly string[]).includes(tile);

export const SANMA_RED_TO_BLACK: Record<SanmaRedTile, SanmaTile> = { '5pr': '5p', '5sr': '5s' };

// --- 待ち牌シミュレーター（万万、索子） ---
export const PINZU_BLOCKS = ['sequence', 'triplet', 'pair'] as const;
export const HAND_COMPONENTS = [...PINZU_BLOCKS, ...SOZU_TILES] as const;
export type PinzuBlock = (typeof PINZU_BLOCKS)[number];
export type HandComponent = (typeof HAND_COMPONENTS)[number];
export const HAND_COMPONENT_RECORD_0 = Object.freeze(Object.fromEntries(HAND_COMPONENTS.map(c => [c, 0])) as Record<HandComponent, number>);

export type SozuHand = {
  closed: Record<HandComponent, number>;
  drawn: Sozu | 'empty';
};

export const INITIAL_SOZU_HAND: SozuHand = Object.freeze({ closed: { ...HAND_COMPONENT_RECORD_0 }, drawn: 'empty' });
export const HAND_COMPONENTS_TILE_COUNT = Object.fromEntries(HAND_COMPONENTS.map(component => {
  if (component === 'sequence' || component === 'triplet') return [component, 3];
  if (component === 'pair') return [component, 2];
  return [component, 1];
})) as Record<HandComponent, number>;

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
  hand: Record<HandComponent, number>;
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
  hand: Record<HandComponent, number>;
}

// --- 領域 ---
// フェーズ
export enum RealmPhase {
  Boss = 0,
  DoraIndicators = 1,
  Wall = 2,
  Exchange = 3,
  Main = 4,
}

// フェーズ内で行うアクション
export enum RealmPhaseAction {
  Draw = 'draw',
  Discard = 'discard',
}

// シミュレーションの進行状況
export type RealmSimulationProgress = (
  | {
    phase: RealmPhase.Boss | RealmPhase.DoraIndicators | RealmPhase.Wall;
    action?: never;
  }
  | {
    phase: RealmPhase.Exchange | RealmPhase.Main;
    action: RealmPhaseAction;
  }
) & {
  turn: number;
};

// 編集モードのフェーズ
export enum RealmEditPhase {
  Boss = 0,
  DoraIndicators = 1,
  Wall = 2,
}

// 編集モードの進行状況
export type RealmEditProgress = {
  isEditing: true;
  phase: RealmEditPhase.Boss | RealmEditPhase.DoraIndicators | RealmEditPhase.Wall;
} | {
  isEditing: false;
  phase?: never;
};

export const REALM_BOSSES = ['dora_indicator', 'dora_manzu', 'dora_pinzu', 'dora_sozu', 'exchange_amount', 'lock', 'others', 'empty'] as const;
export type RealmBoss = (typeof REALM_BOSSES)[number];

export const SANMA_TILE_RECORD_FALSE: Record<SanmaTile, boolean> = Object.freeze(
  Object.fromEntries(SANMA_TILES.map(tile => [tile, false])) as Record<SanmaTile, boolean>,
);
export const SANMA_TILE_RECORD_TRUE: Record<SanmaTile, boolean> = Object.freeze(
  Object.fromEntries(SANMA_TILES.map(tile => [tile, true])) as Record<SanmaTile, boolean>,
);
export const SANMA_TILE_RECORD_MINUS_1: Record<SanmaTile, number> = Object.freeze(
  Object.fromEntries(SANMA_TILES.map(tile => [tile, -1])) as Record<SanmaTile, number>,
);
export const SANMA_TILE_RECORD_0: Record<SanmaTile, number> = Object.freeze(
  Object.fromEntries(SANMA_TILES.map(tile => [tile, 0])) as Record<SanmaTile, number>,
);
export const SANMA_TILE_RECORD_4: Record<SanmaTile, number> = Object.freeze(
  Object.fromEntries(SANMA_TILES.map(tile => [tile, 4])) as Record<SanmaTile, number>,
);
export const SANMA_TILE_RECORD_NUMBER_ARRAY: Record<SanmaTile, number[]> = deepFreeze(
  Object.fromEntries(SANMA_TILES.map(tile => [tile, [] as number[]])) as Record<SanmaTile, number[]>,
);

export const SOZU_RECORD_0: Record<Sozu, number> = Object.freeze(Object.fromEntries(SOZU_TILES.map(tile => [tile, 0])) as Record<Sozu, number>);
export const SOZU_RECORD_4: Record<Sozu, number> = Object.freeze(Object.fromEntries(SOZU_TILES.map(tile => [tile, 4])) as Record<Sozu, number>);

export interface TileStatus {
  isSelected: boolean;
}

export interface DrawnTile {
  tile: WallTile;
  isClosed: boolean;
  isSelected: boolean;
}

export interface Hand {
  closed: Record<SanmaTile, TileStatus[]>;
  drawn: DrawnTile;
}

export const INITIAL_HAND: Hand = deepFreeze({
  closed: Object.fromEntries(SANMA_TILES.map(tile => [tile, [] as TileStatus[]])) as Record<SanmaTile, TileStatus[]>,
  drawn: { tile: 'empty', isClosed: false, isSelected: false },
});

// --- 手牌のブロック分解 ---
export const MENTSU_TYPES = ['shuntsu', 'kotsu'] as const;
export const TOITSU_TYPES = ['toitsu'] as const;
export const TAATSU_TYPES = ['ryanmen', 'kanchan', 'penchan'] as const;
export const BLOCK_TYPES = [...MENTSU_TYPES, ...TOITSU_TYPES, ...TAATSU_TYPES] as const;

export type MentsuType = (typeof MENTSU_TYPES)[number];
export type ToitsuType = (typeof TOITSU_TYPES)[number];
export type TaatsuType = (typeof TAATSU_TYPES)[number];
export type BlockType = (typeof BLOCK_TYPES)[number];

export interface Block<T extends string> {
  type: BlockType;
  tiles: T[];
}

export interface DecomposedResult<T extends string> {
  count: number;
  blocks: Block<T>[];
  remaining: Record<T, number>;
  nonRealmWinsEachTiles: Record<Sozu, number>;
}

export interface RealmTenpai {
  hand: Record<SanmaTile, number>;
  totalNonRealmWins: number;
  nonRealmWinsEachTiles: Record<Sozu, number>;
}
export const EMPTY_REALM_TENPAI: RealmTenpai = deepFreeze({
  hand: { ...SANMA_TILE_RECORD_0 },
  totalNonRealmWins: Number.NEGATIVE_INFINITY,
  nonRealmWinsEachTiles: { ...SOZU_RECORD_0 },
});

export type WinningHandType = 'standard' | 'sevenPairs' | 'kokushi';
export interface RealmTenpaiResult {
  type: WinningHandType;
  turn: number;
  hand: Record<SanmaTile, number>;
  totalWins: number;
  totalNonRealmWins: number;
  nonRealmWinsEachTiles: Record<Sozu, number>;
}
export const DECOMPOSER_TILE_SET_IDS = {
  nonSequential: 1,
  pinzu: 2,
  sozu: 3,
} as const;
export type DecomposerTileSetId = (typeof DECOMPOSER_TILE_SET_IDS)[keyof typeof DECOMPOSER_TILE_SET_IDS];

export const SANMA_TILES_OR_NON_REALM = [...SANMA_TILES, 'nonRealm'] as const;
export type SanmaTileOrNonRealm = (typeof SANMA_TILES_OR_NON_REALM)[number];
export const isSanmaTileOrNonRealm = (tile: string): tile is SanmaTileOrNonRealm => (SANMA_TILES_OR_NON_REALM as readonly string[]).includes(tile);
export const SANMA_TILES_OR_NON_REALM_RECORD_0: Record<SanmaTileOrNonRealm, number> = Object.freeze(
  Object.fromEntries(SANMA_TILES_OR_NON_REALM.map(tile => [tile, 0])) as Record<SanmaTileOrNonRealm, number>,
);

export interface MultisetPermutation<T> {
  tiles: T[];
  probability: number;
}
