import { DoraBoss, SanmaTile, SANMA_TILES, SANMA_MANZU_TILES, PINZU_TILES, SOZU_TILES, isSanmaManzuTile, isPinzuTile, isSozuTile, isWindTile, WIND_TILES, isDragonTile, DRAGON_TILES } from "../types/simulation";

/**
 * 領域牌の枚数を計算する
 * @param doraBoss ドラ関連のボス（ステージ効果）
 * @param doraIndicators ドラ表示牌
 * @returns 各領域牌の枚数
 */
export const calcRealmTiles = (doraBoss: DoraBoss, doraIndicators: SanmaTile[]): Map<SanmaTile, number> => {
  const realmTileCounter = new Map<SanmaTile, number>();
  if (doraBoss === "empty") return realmTileCounter;
  
  const isRealm: { [key in SanmaTile]: boolean } = Object.fromEntries(SANMA_TILES.map(tile => [tile, false])) as { [key in SanmaTile]: boolean };
  const tileCounter: { [key in SanmaTile]: number } = Object.fromEntries(SANMA_TILES.map(tile => [tile, 4])) as { [key in SanmaTile]: number };
  
  const markRealmTileForGroup = <T extends SanmaTile>(
    doraIndicator: SanmaTile,
    predicate: (tile: SanmaTile) => tile is T,
    tiles: readonly T[],
    tBoss?: DoraBoss
  ) => {
    if (!predicate(doraIndicator)) return;
    if (tBoss && doraBoss === tBoss) return;
    isRealm[doraIndicator] = true;
    const tile = doraIndicator as T;
    const index = tiles.indexOf(tile);
    const nextIndex = (index + 1) % tiles.length;
    isRealm[tiles[nextIndex]] = true;
  };

  doraIndicators.forEach((doraIndicator) => {
    --tileCounter[doraIndicator];
    markRealmTileForGroup(doraIndicator, isSanmaManzuTile, SANMA_MANZU_TILES, "dora_manzu");
    markRealmTileForGroup(doraIndicator, isPinzuTile, PINZU_TILES, "dora_pinzu");
    markRealmTileForGroup(doraIndicator, isSozuTile, SOZU_TILES, "dora_sozu");
    markRealmTileForGroup(doraIndicator, isWindTile, WIND_TILES);
    markRealmTileForGroup(doraIndicator, isDragonTile, DRAGON_TILES);
  });
  
  SANMA_TILES.forEach(tile => {
    if (isRealm[tile]) realmTileCounter.set(tile, tileCounter[tile]);
  });
  return realmTileCounter;
};