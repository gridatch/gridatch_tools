import { DRAGON_TILES, isDragonTile, isPinzuTile, isSanmaManzuTile, isSozuTile, isWindTile, PINZU_TILES, RealmBoss, SANMA_MANZU_TILES, SANMA_TILES, SanmaTile, SOZU_TILES, WIND_TILES } from "../../../shared/types/simulation";

/**
 * 領域牌の枚数を計算する
 * @param boss ボス（ステージ効果）
 * @param doraIndicators ドラ表示牌
 * @returns 各領域牌の枚数
 */
export const calcRealmTiles = (boss: RealmBoss, doraIndicators: SanmaTile[]): Map<SanmaTile, number> => {
  const realmTileCounter = new Map<SanmaTile, number>();
  if (boss === "empty") return realmTileCounter;
  
  const isRealm: { [key in SanmaTile]: boolean } = Object.fromEntries(SANMA_TILES.map(tile => [tile, false])) as { [key in SanmaTile]: boolean };
  const tileCounter: { [key in SanmaTile]: number } = Object.fromEntries(SANMA_TILES.map(tile => [tile, 4])) as { [key in SanmaTile]: number };
  
  const markRealmTileForGroup = <T extends SanmaTile>(
    doraIndicator: SanmaTile,
    predicate: (tile: SanmaTile) => tile is T,
    tiles: readonly T[],
    tBoss?: RealmBoss
  ) => {
    if (!predicate(doraIndicator)) return;
    if (tBoss && boss === tBoss) return;
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
