import cv from '@techstark/opencv-js';

import { SANMA_RED_TILES, SANMA_RED_TO_BLACK, SANMA_TILES, TILE_BACKS, TILE_FACES, TileBack, TileFace, WallTile } from '@shared/types/simulation';

// グローバルキャッシュ先
export const faceTemplates: Record<string, { skin: TileFace; tile: WallTile; isRed: boolean; mat: cv.Mat }[]> = {};
export const backTemplates: Record<string, { skin: TileBack; tile: WallTile; isRed: boolean; mat: cv.Mat }> = {};

/** テンプレートを読み込む */
export async function loadTileTemplates(): Promise<void> {
  await Promise.all([
    // 表牌の読み込み
    ...TILE_FACES.map(async face => {
      faceTemplates[face] = await Promise.all([
        ...SANMA_TILES.map(async tile => {
          const img = new Image();
          img.src = `/templates/tile_faces/${face}/${tile}.png`;
          await img.decode();
          const mat = cv.imread(img);
          cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
          return { skin: face, tile, isRed: false, mat };
        }),
        ...SANMA_RED_TILES.map(async redTile => {
          const img = new Image();
          img.src = `/templates/tile_faces/${face}/${redTile}.png`;
          await img.decode();
          const mat = cv.imread(img);
          cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
          const tile = SANMA_RED_TO_BLACK[redTile];
          return { skin: face, tile, isRed: true, mat };
        }),
      ]);
    }),
    // 裏牌の読み込み
    ...TILE_BACKS.map(async back => {
      const img = new Image();
      img.src = `/templates/tile_backs/${back}.png`;
      await img.decode();
      const mat = cv.imread(img);
      cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
      backTemplates[back] = { skin: back, tile: 'closed', isRed: false, mat };
    }),
  ]);
}
