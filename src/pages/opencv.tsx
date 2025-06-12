import React, { useState, useRef, useCallback, useEffect } from 'react';

import cv, { MatVector } from "@techstark/opencv-js"

import { SANMA_TILES, TILE_FACES, TILE_BACKS, TileFace, TileBack, WallTile, SANMA_RED_TILES, SANMA_RED_TO_BLACK, PLAIN_TILES, PLAIN_TILE_BACKS } from '@shared/types/simulation';

interface Template { skin: TileFace | TileBack, tile: WallTile; isRed: boolean; mat: cv.Mat; }
const faceTemplates: Record<TileFace, Template[]> = {} as Record<TileFace, Template[]>;
const backTemplates: Record<TileBack, Template> = {} as Record<TileBack, Template>;

interface MatchingResult { skin?: TileFace | TileBack, tile: WallTile; isRed: boolean; score: number }

type Line = { x1: number; y1: number; x2: number; y2: number };

interface BoundaryLines {
  topLine: Line;
  bottomLine: Line;
  leftLine: Line;
  rightLine: Line;
}

interface RectVertices {
  topLeft: cv.Point;
  topRight: cv.Point;
  bottomRight: cv.Point;
  bottomLeft: cv.Point;
}

interface RotatedBoundingBox {
  vertices: RectVertices;
  angle: number;
  width: number;
  height: number;
}

/**
 * キャンバスに画像のMatを描画する
 * @param ref キャンバスのref
 * @param mat 画像のMat
 */
function drawMatToCanvas(ref: React.RefObject<HTMLCanvasElement | null>, mat: cv.Mat) {
  if (ref.current) {
    ref.current.width = mat.cols;
    ref.current.height = mat.rows;
    cv.imshow(ref.current, mat);
  }
};

/**
 * キャンバスに画像と全ての輪郭を重ねたMatを描画する
 * @param ref キャンバスのref
 * @param origImage 元画像
 * @param contour 輪郭
 * @param thickness 描画する輪郭の太さ、負の値の場合は内側を塗りつぶす
 */
function drawMatWithAllContoursToCanvas(ref: React.RefObject<HTMLCanvasElement | null>, origImage: cv.Mat, edges: cv.Mat, thickness: number = 2) {
  const image = origImage.clone();
  
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  // RETR_EXTERNAL: 最も外側の輪郭のみを抽出する
  // CHAIN_APPROX_SIMPLE: 直線部分の中間点を削除する
  cv.findContours(edges, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
  hierarchy.delete();
  
  cv.drawContours(image, contours, -1, new cv.Scalar(255, 0, 255, 255), thickness);
  drawMatToCanvas(ref, image);
  
  contours.delete();
  image.delete();
};

/**
 * キャンバスに画像と輪郭を重ねたMatを描画する
 * @param ref キャンバスのref
 * @param origImage 元画像
 * @param contour 輪郭
 * @param thickness 描画する輪郭の太さ、負の値の場合は内側を塗りつぶす
 */
function drawMatWithContourToCanvas(ref: React.RefObject<HTMLCanvasElement | null>, origImage: cv.Mat, contour: cv.Mat, thickness: number = 2) {
  const image = origImage.clone();
  
  const vec = new cv.MatVector();
  vec.push_back(contour);
  cv.drawContours(image, vec, 0, new cv.Scalar(255, 0, 255, 255), thickness);
  drawMatToCanvas(ref, image);
  
  image.delete();
  vec.delete();
};

/**
 * キャンバスに画像と直線を重ねたMatを描画する
 * @param ref キャンバスのref
 * @param origImage 元画像
 * @param lines 直線
 */
function drawMatWithLinesToCanvas(ref: React.RefObject<HTMLCanvasElement | null>, origImage: cv.Mat, lines: cv.Mat) {
  const image = origImage.clone();
  for (let i = 0; i < lines.rows; i++) {
    const [x1, y1, x2, y2] = lines.intPtr(i, 0);
    cv.line(
      image,
      new cv.Point(x1, y1),
      new cv.Point(x2, y2),
      new cv.Scalar(0, 0, 255, 255),
      2
    );
  }

  drawMatToCanvas(ref, image);
  image.delete();
};

/**
 * キャンバスに画像と多角形を重ねたMatを描画する
 * @param ref キャンバスのref
 * @param origImage 元画像
 * @param polygon 多角形
 * @param thickness 描画する輪郭の太さ、負の値の場合は内側を塗りつぶす
 */
function drawMatWithPolygonToCanvas(ref: React.RefObject<HTMLCanvasElement | null>, origImage: cv.Mat, polygon: cv.Mat, thickness: number = 2) {
  const image = origImage.clone();

  const vec = new cv.MatVector();
  const matPoints = cv.matFromArray(4, 1, cv.CV_32SC2, [...polygon.data32F]);
  vec.push_back(matPoints);

  cv.polylines(image, vec, true, new cv.Scalar(0, 255, 0, 255), thickness);

  drawMatToCanvas(ref, image);

  matPoints.delete();
  vec.delete();
  image.delete();
}

/**
 * キャンバスに画像と直線を重ねたMatを描画する
 * @param origImage 元画像
 * @param lines 直線
 */
function drawTilesToCanvases(ref: React.RefObject<HTMLCanvasElement[]>, mat: cv.Mat) {
  const rows = 4, cols = 9;
  const cellW = Math.round(mat.cols / cols);
  const cellH = Math.round(mat.rows / rows);

  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const roi = mat.roi(new cv.Rect(j * cellW, i * cellH, cellW, cellH));
      
      const index = i * cols + j;
      const canvas = ref.current[index];
      if (canvas) {
        canvas.width = roi.cols;
        canvas.height = roi.rows;
        cv.imshow(canvas, roi);
      }
      roi.delete();
    }
  }
};

/**
 * テンプレートを読み込む
 */
async function loadTemplates() {
  await Promise.all([
    ...TILE_FACES.map(async face => {
      faceTemplates[face] = await Promise.all([
        ...SANMA_TILES.map(async tile => {
          const img = new Image();
          img.src = `/templates/tile_faces/${face}/${tile}.png`;
          await img.decode();
          const mat = cv.imread(img); cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
          return { skin: face, tile, isRed: false, mat };
        }),
        ...SANMA_RED_TILES.map(async redTile => {
          const img = new Image();
          img.src = `/templates/tile_faces/${face}/${redTile}.png`;
          await img.decode();
          const mat = cv.imread(img); cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
          const tile = SANMA_RED_TO_BLACK[redTile];
          return { skin: face, tile, isRed: true, mat };
        }),
      ]);
    }),
    ...TILE_BACKS.map(async back => {
      const img = new Image();
      img.src = `/templates/tile_backs/${back}.png`;
      await img.decode();
      const mat = cv.imread(img); cv.cvtColor(mat, mat, cv.COLOR_RGBA2GRAY);
      backTemplates[back] = { skin: back, tile: 'closed', isRed: false, mat };
    })
  ]);
}

/**
 * モアレ低減のため50%にリサイズする。画素数が一定以下の画像はリサイズしない。
 * @param mat 対象の画像
 * @param threshold リサイズする画像の画素数の閾値（デフォルトは1920x1080）
 */
function resizeToReduceMoire(mat: cv.Mat, threshold: number = 1920 * 1080) {
  if (mat.cols * mat.rows <= threshold) return mat.clone();
  
  const w0 = Math.round(mat.cols * 0.5);
  const h0 = Math.round(mat.rows * 0.5);
  cv.resize(mat, mat, new cv.Size(w0, h0), 0, 0, cv.INTER_AREA);
};

/**
 * エッジを検出する
 * @param src 元画像
 * @param threshold1 Canny法において、強エッジと隣接した弱エッジを検出する勾配強度の閾値
 * @param threshold2 Canny法において、強エッジを検出する勾配強度の閾値
 * @returns エッジのMat
 */
function detectEdges(src: cv.Mat, threshold1 = 100, threshold2 = 150) {
  const gray = new cv.Mat();
  cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
  const blur = new cv.Mat();
  cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0);
  const edges = new cv.Mat();
  cv.Canny(blur, edges, threshold1, threshold2);

  gray.delete();
  blur.delete();
  return edges;
};

/**
 * モルフォロジーのクロージング処理
 * @param src 対象の画像
 * @param size カーネルサイズ
 */
function morphologyClose(src: cv.Mat, size = new cv.Size(20, 10)) {
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, size);
  cv.morphologyEx(src, src, cv.MORPH_CLOSE, kernel);
  kernel.delete();
};

/**
 * 回転外接矩形の面積に対する輪郭が占める面積の比を計算する
 * @param contour 輪郭
 * @returns Extent
 */
function calcContourExtent(contour: cv.Mat) {
  const area = cv.contourArea(contour);
  const { width, height } = cv.minAreaRect(contour).size;
  const rectArea = width * height;
  const extent = area / rectArea;
  return extent;
};

/**
 * 輪郭線と外接長方形の頂点が何点近い位置にあるかをカウントする関数
 * @param contour 輪郭
 * @param tolerance 許容誤差（ピクセル単位）
 * @returns 一致している頂点の数（0〜4）
 */
function countApproximateCornerMatches(contour: cv.Mat, tolerance: number = 5): number {
  // 外接長方形の4つの角
  const rect = cv.boundingRect(contour);
  const rectCorners: [number, number][] = [
    [rect.x, rect.y],
    [rect.x + rect.width, rect.y],
    [rect.x, rect.y + rect.height],
    [rect.x + rect.width, rect.y + rect.height],
  ];

  // 輪郭の点を配列化
  const contourPoints: [number, number][] = [];
  for (let i = 0; i < contour.rows; ++i) {
    const pt = contour.intPtr(i, 0);
    contourPoints.push([pt[0], pt[1]]);
  }

  // 指定された角がいずれかの輪郭点とtolerance以内にあれば一致とみなす
  let matched = 0;
  for (const [rx, ry] of rectCorners) {
    if (
      contourPoints.some(([cx, cy]) => {
        const dx = rx - cx;
        const dy = ry - cy;
        return dx * dx + dy * dy <= tolerance * tolerance;
      })
    ) {
      ++matched;
    }
  }

  return matched;
}

/**
 * 画像中央の点を含む最大の輪郭を検出する
 * @param src バイナリ画像
 * @param point 中心点。省略した場合は画像の中央
 * @returns 画像中央の点を含む最大の輪郭
 */
function findBestContour(src: cv.Mat, point?: cv.Point) {
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  // RETR_LIST: すべての輪郭を同じ階層として取得
  // CHAIN_APPROX_SIMPLE: 直線部分の中間点を削除する
  cv.findContours(src, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);
  hierarchy.delete();
  
  const cx = point ? point.x : src.cols / 2;
  // スクリーンショットを入力画像としたときに中央よりやや下に牌山がある場合があるため上から55%
  const cy = point ? point.y : src.rows / 2;
  
  let bestContour: cv.Mat | null = null;
  let maxArea = 0;
  for (let i = 0; i < contours.size(); i++) {
    const contour = contours.get(i);
    
    if (cv.pointPolygonTest(contour, new cv.Point(cx, cy), false) < 0) {
      // 中心点を含まない
      contour.delete();
      continue;
    }

    const area = cv.contourArea(contour);
    if (area <= maxArea) {
      // 面積が最大値以下
      contour.delete();
      continue;
    }
    
    const extent = calcContourExtent(contour);
    if (extent >= 0.9) {
      // 外接矩形に占める充填率が90%以上の輪郭はウィンドウ枠とみなし除外
      contour.delete();
      continue;
    }

    const cornerMatchCount = countApproximateCornerMatches(contour);
    if (cornerMatchCount >= 3) {
      // 外接矩形の頂点と輪郭が3点以上一致する輪郭はウィンドウ枠とみなし除外
      contour.delete();
      continue;
    }
    
    console.log("cornerMatchCount", cornerMatchCount);
    bestContour?.delete();
    bestContour = contour;
    maxArea = area;
  }
  contours.delete();
  return bestContour;
};

/**
 * 輪郭を描画した二値のMatを作成する
 * @param size 作成するMatのサイズ
 * @param contour 輪郭
 * @param thickness 描画する輪郭の太さ、負の値の場合は内側を塗りつぶす
 * @returns 輪郭を描画した二値のMat
 */
function createBinaryContourMat(size: cv.Size, contour: cv.Mat, thickness: number = 2) {
  const mat = cv.Mat.zeros(size.height, size.width, cv.CV_8UC1);
  
  const vec = new cv.MatVector();
  vec.push_back(contour);
  cv.drawContours(mat, vec, 0, new cv.Scalar(255), thickness);
  
  vec.delete();
  return mat;
};

/**
 * 回転矩形の4頂点を左上、右上、右下、左下にソートしたものを返す
 * @param points 回転矩形の4頂点
 * @returns ソートされた頂点
 */
function sortRotatedRectVertices(points: cv.Point[]): RectVertices {
  // 最上部の頂点
  const topPoint1 = points.reduce((acc, cur) => cur.y < acc.y ? cur : acc, points[0]);
  // 最上部の頂点とのなす角が最も水平に近い頂点
  const topPoint2 = points.filter(
    point => point !== topPoint1
  ).map(point => ({
    point,
    absRotationRad: Math.atan2(Math.abs(point.y - topPoint1.y), Math.abs(point.x - topPoint1.x))
  })).reduce((prev, curr) => 
    curr.absRotationRad < prev.absRotationRad ? curr : prev
  ).point;
  const [topLeft, topRight] = [topPoint1, topPoint2].sort((a, b) => a.x - b.x);
  const bottomPoints = points.filter(p => p !== topPoint1 && p !== topPoint2);
  const [bottomLeft, bottomRight] = bottomPoints.sort((a, b) => a.x - b.x);

  return { topLeft, topRight, bottomLeft, bottomRight };
};

/**
 * 輪郭の回転外接矩形を計算する。
 * @param contour 輪郭
 * @returns 回転外接矩形
 */
function calcRotatedBoundingBox(contour: cv.Mat): RotatedBoundingBox {
  const rotatedWallRect = cv.minAreaRect(contour);
  rotatedWallRect.size.height += 10;
  rotatedWallRect.size.width += 10;
  // @ts-expect-error: @techstark/opencv-js の型定義の誤りのため発生するエラーを無視
  const vertices = sortRotatedRectVertices(cv.RotatedRect.points(rotatedWallRect));

  const width = Math.hypot(vertices.topRight.x - vertices.topLeft.x, vertices.topRight.y - vertices.topLeft.y);
  const height = Math.hypot(vertices.bottomLeft.x - vertices.topLeft.x, vertices.bottomLeft.y - vertices.topLeft.y);
  
  const angle = Math.atan2(vertices.topRight.y - vertices.topLeft.y, vertices.topRight.x - vertices.topLeft.x) * 180 / Math.PI;

  return { vertices, width, height, angle };
};

/**
 * 回転外接矩形の右側を切り落とした新しい回転外接矩形を返す
 * @param rotatedBoundingBox 回転外接矩形
 * @param maxRatio トリミングする縦横比の閾値
 * @returns トリミングされた回転外接矩形
 */
function trimBoundingBoxRight(
  rotatedBoundingBox: RotatedBoundingBox,
  maxRatio: number
): RotatedBoundingBox {
  const { vertices, angle, width, height } = rotatedBoundingBox;
  const ratio = width / height;
  if (ratio <= maxRatio) return rotatedBoundingBox;

  const newWidth = height * maxRatio;

  // 水平方向単位ベクトル
  const ux = (vertices.topRight.x - vertices.topLeft.x) / width;
  const uy = (vertices.topRight.y - vertices.topLeft.y) / width;

  const topLeft = vertices.topLeft;
  const bottomLeft = vertices.bottomLeft;

  const topRight = new cv.Point(
    topLeft.x + ux * newWidth,
    topLeft.y + uy * newWidth,
  );
  const bottomRight = new cv.Point(
    bottomLeft.x + ux * newWidth,
    bottomLeft.y + uy * newWidth,
  );

  return {
    vertices: { topLeft, topRight, bottomRight, bottomLeft },
    angle,
    width: newWidth,
    height,
  };
}

/**
 * 回転外接矩形の外側をマスクする
 * @param binaryMat CV_8UC1 の二値マット
 * @param rotatedBoundingBox 回転外接矩形
 */
function maskOutsideRotatedBoundingBox(
  binaryMat: cv.Mat,
  rotatedBoundingBox: RotatedBoundingBox,
): void {
  const { vertices } = rotatedBoundingBox;
  const quad = cv.matFromArray(1, 4, cv.CV_32SC2, [
    vertices.topLeft.x, vertices.topLeft.y,
    vertices.topRight.x, vertices.topRight.y,
    vertices.bottomRight.x, vertices.bottomRight.y,
    vertices.bottomLeft.x, vertices.bottomLeft.y
  ]);

  const innerMask = cv.Mat.zeros(binaryMat.rows, binaryMat.cols, cv.CV_8UC1);
  const vec = new MatVector();
  vec.push_back(quad);
  cv.fillPoly(innerMask, vec, new cv.Scalar(255));

  cv.bitwise_and(binaryMat, innerMask, binaryMat);

  quad.delete();
  vec.delete();
  innerMask.delete();
}

/**
 * 2直線がなす角度のうち、鋭角のものを返す
 * @param angle1 直線の角度
 * @param angle2 直線の角度
 * @returns 鋭角
 */
function calcAcuteAngleBetweenLines(angle1: number, angle2: number) {
  let diff = Math.abs(angle1 - angle2) % 180;
  diff = diff > 90 ? 180 - diff : diff;
  return diff;
}

/**
 * 指定された方向への正射影ベクトルのスカラー値を返す
 * @param vec ベクトル
 * @param angle 正射影の基準方向
 * @returns 正射影ベクトルのスカラー値
 */
function getScalarProjectionByAngle(vec: cv.Point, angle: number): number {
  const rad = (angle * Math.PI) / 180;
  const unitVec = { x: Math.cos(rad), y: Math.sin(rad) };
  return vec.x * unitVec.x + vec.y * unitVec.y;
}

/**
 * スカラーの閾値で単純にクラスタリングする
 * @param items 任意の値とスカラー値の配列
 * @param threshold 隣接するスカラー値との差の閾値
 * @returns クラスターの配列
 */
function clusterByScalar<T>(
  items: { value: T; scalar: number }[],
  threshold: number
): T[][] {
  if (items.length === 0) return [];
  items.sort((a, b) => a.scalar - b.scalar);

  const clusters: T[][] = [];
  let currentCluster: T[] = [items[0].value];
  let prevScalar = items[0].scalar;

  for (let i = 1; i < items.length; i++) {
    const { value, scalar } = items[i];
    if (scalar - prevScalar <= threshold) {
      currentCluster.push(value);
    } else {
      clusters.push(currentCluster);
      currentCluster = [value];
    }
    prevScalar = scalar;
  }
  clusters.push(currentCluster);
  return clusters;
}

/**
 * 直線を水平線と垂直線にクラスタリングする
 * @param lines 直線
 * @param rotatedBoundingBox 回転外接矩形
 * @returns 水平線のクラスターと垂直線のクラスター
 */
function clusterLines(lines: cv.Mat, rotatedBoundingBox: RotatedBoundingBox) {
  const hAngle = rotatedBoundingBox.angle;
  const vAngle = rotatedBoundingBox.angle + 90;
  const hLines: Line[] = [];
  const vLines: Line[] = [];
  
  for (let i = 0; i < lines.rows; i++) {
    const [x1, y1, x2, y2] = lines.intPtr(i, 0) as number[];
    const dx = x2 - x1, dy = y2 - y1;
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    const len = Math.hypot(dx,dy);

    const hAngleDiff = calcAcuteAngleBetweenLines(hAngle, angle);
    if (hAngleDiff < 10 && len >= rotatedBoundingBox.width * 0.4) {
      hLines.push({ x1, y1, x2, y2 });
      continue;
    }

    const vAngleDiff = calcAcuteAngleBetweenLines(vAngle, angle);
    if (vAngleDiff < 15 && len >= rotatedBoundingBox.height * 0.4) {
      vLines.push({ x1, y1, x2, y2 });
      continue;
    }
  }

  // 法線方向への正射影ベクトルのスカラー値でクラスタリングする
  // 水平線のクラスタリング
  const hItems = hLines.map(line => {
    const mid = { x: (line.x1 + line.x2) / 2, y: (line.y1 + line.y2) / 2 };
    // 垂直方向への正射影のスカラー値
    const scalar = getScalarProjectionByAngle(mid, vAngle);
    return { value: line, scalar };
  });
  const hThreshold = rotatedBoundingBox.height * 0.1;
  const hClusters = clusterByScalar(hItems, hThreshold);

  // 垂直線のクラスタリング
  const vItems = vLines.map(line => {
    const mid = { x: (line.x1 + line.x2) / 2, y: (line.y1 + line.y2) / 2 };
    // 水平方向への正射影のスカラー値
    const scalar = getScalarProjectionByAngle(mid, hAngle);
    return { value: line, scalar };
  });
  const vThreshold = rotatedBoundingBox.width * 0.1;
  const vClusters = clusterByScalar(vItems, vThreshold);

  return { hClusters, vClusters };
}

/**
 * 上下左右の端のクラスタからそれぞれ最長直線を選択する
 * @param hClusters 水平線クラスタ
 * @param vClusters 垂直線クラスタ
 * @returns 上下左右の端の最長直線
 */
function pickBoundaryLines(
  hClusters: Line[][],
  vClusters: Line[][],
): BoundaryLines {
  const lengthOf = (line: Line): number => (
    Math.hypot(line.x2 - line.x1, line.y2 - line.y1)
  );

  const getLongest = (lines: Line[]): Line => (
    lines.reduce((longest, line) => lengthOf(line) > lengthOf(longest) ? line : longest, lines[0])
  );

  const topLine = getLongest(hClusters[0]);
  const bottomLine = getLongest(hClusters[hClusters.length - 1]);
  const leftLine = getLongest(vClusters[0]);
  const rightLine = getLongest(vClusters[vClusters.length - 1]);

  return { topLine, bottomLine, leftLine, rightLine };
}

/**
 * 2つの直線（l1, l2）を延長した交点を計算する
 * @param l1 直線1
 * @param l2 直線2
 * @returns 交点
 */
function calcIntersection(l1: Line, l2: Line): cv.Point | null {
  const { x1, y1, x2, y2 } = l1;
  const { x1: x3, y1: y3, x2: x4, y2: y4 } = l2;
  // 直線の一般形 ax + by = c
  const a1 = y2 - y1;
  const b1 = x1 - x2;
  const c1 = a1 * x1 + b1 * y1;
  const a2 = y4 - y3;
  const b2 = x3 - x4;
  const c2 = a2 * x3 + b2 * y3;
  const det = a1 * b2 - a2 * b1;
  // 平行またはほぼ平行
  if (Math.abs(det) < 1e-10) return null;
  return {
    x: (b2 * c1 - b1 * c2) / det,
    y: (a1 * c2 - a2 * c1) / det,
  };
}

/**
 * 四角形の四辺から四角形のMatを作成する
 * @param boundaryLines 四角形の四辺
 * @returns 四角形のMat
 */
function createQuadMatFromBoundaryLines(boundaryLines: BoundaryLines): cv.Mat {
  const { topLine, bottomLine, leftLine, rightLine } = boundaryLines;
  const topLeftPoint = calcIntersection(topLine, leftLine);
  const topRightPoint = calcIntersection(topLine, rightLine);
  const bottomRightPoint = calcIntersection(bottomLine, rightLine);
  const bottomLeftPoint = calcIntersection(leftLine, bottomLine);
  
  if (!topLeftPoint || !topRightPoint || !bottomRightPoint || !bottomLeftPoint) {
    // 水平・垂直に分けてクラスタリングしているので通らないはず
    throw new Error("Intersection point could not be determined.");
  }

  const quad = cv.matFromArray(4, 1, cv.CV_32FC2, [
    topLeftPoint.x, topLeftPoint.y,
    topRightPoint.x, topRightPoint.y,
    bottomRightPoint.x, bottomRightPoint.y,
    bottomLeftPoint.x, bottomLeftPoint.y
  ]);

  return quad;
}

/**
 * 画像の四角形の領域を長方形に射影変換したMatを作成する。
 * バイラテラルフィルタ後に長方形に変換し、モアレを低減する方法でリサイズする
 * @param src 元画像
 * @param srcQuad 射影変換前の四角形
 * @param dstSize 射影変換後の矩形のサイズ
 * @returns 射影変換後の画像
 */
function warpQuadToRect(src: cv.Mat, srcQuad: cv.Mat, dstSize: cv.Size): cv.Mat {
  const srcW = src.cols;
  const srcH = src.rows;
  const dstW = dstSize.width;
  const dstH = dstSize.height;

  const scale = Math.min(srcW / dstW, srcH / dstH);
  const intermediateW = Math.round(dstW * scale);
  const intermediateH = Math.round(dstH * scale);

  const intermediateQuad = cv.matFromArray(4, 1, cv.CV_32FC2, [
    0, 0,
    intermediateW, 0,
    intermediateW, intermediateH,
    0, intermediateH,
  ]);

  const M = cv.getPerspectiveTransform(srcQuad, intermediateQuad);
  
  const blur = new cv.Mat();
  cv.cvtColor(src, blur, cv.COLOR_RGBA2RGB);
  const bilateral = new cv.Mat();
  cv.bilateralFilter(blur, bilateral, 9, 50, 75, cv.BORDER_DEFAULT);

  const intermediate = new cv.Mat();
  cv.warpPerspective(bilateral, intermediate, M, new cv.Size(intermediateW, intermediateH),);

  const dst = new cv.Mat();
  cv.resize(intermediate, dst, dstSize, 0, 0, cv.INTER_AREA);

  blur.delete();
  bilateral.delete();
  intermediateQuad.delete();
  M.delete();
  intermediate.delete();

  return dst;
}

function calcVarianceOfMat(mat: cv.Mat) {
  const mean = new cv.Mat();
  const stddev = new cv.Mat();
  cv.meanStdDev(mat, mean, stddev);
  const sigma = stddev.data64F[0];
  const variance = sigma * sigma;
  mean.delete();
  stddev.delete();
  
  return variance;
}

/**
 * 分散の少ない画像から牌の種類を検出する
 * @param mat 牌の画像
 * @returns 牌の種類
 */
function detectTileFromPlainMat(mat: cv.Mat): WallTile {
  const hsv = new cv.Mat();
  cv.cvtColor(mat, hsv, cv.COLOR_RGB2HSV_FULL);
  const [h, s, v] = cv.mean(hsv);
  hsv.delete();
  console.log(h, s, v);
  // 非魂牌：彩度小、明度大
  if (s < 50 && v > 200) return "P";
  // 魂牌：彩度やや小、暖色系
  if (s < 100 && h < 60) return "P";
  return "closed";
}

/**
 * 画像の牌の種類をテンプレートマッチングで特定する
 * @param mat 牌の画像
 * @returns 最良のマッチング結果
 */
function matchTileFromMat(mat: cv.Mat) {
  const best: MatchingResult = { tile: "empty", isRed: false, score: -1 }
  // 表牌
  TILE_FACES.forEach(tileFace => {
    for (const template of faceTemplates[tileFace]) {
      if (PLAIN_TILES.includes(template.tile)) continue;
      const result = new cv.Mat();
      cv.matchTemplate(mat, template.mat, result, cv.TM_CCOEFF_NORMED);
      // @ts-expect-error: @techstark/opencv-js の型定義の誤りのため発生するエラーを無視
      const { maxVal } = cv.minMaxLoc(result);
      if (maxVal > best.score) { best.skin = template.skin; best.tile = template.tile; best.isRed = template.isRed; best.score = maxVal; }
      result.delete();
    }
  });
  // 裏牌
  TILE_BACKS.forEach(tileBack => {
    if (PLAIN_TILE_BACKS.includes(tileBack)) return;
    const template = backTemplates[tileBack];
    const result = new cv.Mat();
    cv.matchTemplate(mat, template.mat, result, cv.TM_CCOEFF_NORMED);
    // @ts-expect-error: @techstark/opencv-js の型定義の誤りのため発生するエラーを無視
    const { maxVal } = cv.minMaxLoc(result);
    if (maxVal > best.score) { best.skin = template.skin; best.tile = template.tile; best.isRed = template.isRed; best.score = maxVal; }
    result.delete();
  });
  return best;
}

/**
 * 牌山の画像を各牌に分割し、テンプレートマッチングで牌の種類を検出した結果の配列を返す
 * @param wallMat 牌山の画像
 * @returns マッチング結果の配列
 */
function splitWallAndMatch(wallMat: cv.Mat): MatchingResult[] {
  const rows = 4, cols = 9;
  const cellW = Math.round(wallMat.cols / cols);
  const cellH = Math.round(wallMat.rows / rows);
  const result: MatchingResult[] = [];

  const gray = new cv.Mat(); cv.cvtColor(wallMat, gray, cv.COLOR_RGBA2GRAY);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const colorRoi = wallMat.roi(new cv.Rect(col * cellW, row * cellH, cellW, cellH));
      const grayRoi = gray.roi(new cv.Rect(col * cellW, row * cellH, cellW, cellH));
      
      // 中心部分の分散を調べる
      const roiCenterHeight = row * cols + col < (36 - 3) ? grayRoi.rows * 0.8 : grayRoi.rows * 0.4;
      const colorRoiCenter = colorRoi.roi(new cv.Rect(colorRoi.cols * 0.1, colorRoi.rows * 0.1, colorRoi.cols * 0.8, roiCenterHeight));
      const grayRoiCenter = grayRoi.roi(new cv.Rect(grayRoi.cols * 0.1, grayRoi.rows * 0.1, grayRoi.cols * 0.8, roiCenterHeight));
      colorRoi.delete();
      
      const variance = calcVarianceOfMat(grayRoiCenter);
      grayRoiCenter.delete();
      console.log(variance);
      
      if (variance < 100) {
        // 分散が少ない牌は単色牌
        const tile = detectTileFromPlainMat(colorRoiCenter);
        result.push({ tile, isRed: false, score: 1 });
        colorRoiCenter.delete();
        grayRoi.delete();
        continue;
      }
      
      const best = matchTileFromMat(grayRoi);
      
      if (variance < 1000 && best.score < 0.5) {
        // 分散がそこそこ少なく、テンプレートとのマッチ度が低い場合も単色牌とみなす
        const tile = detectTileFromPlainMat(colorRoiCenter);
        result.push({ tile, isRed: false, score: 1 });
        colorRoiCenter.delete();
        grayRoi.delete();
        continue;
      }
      result.push(best);
      
      colorRoiCenter.delete();
      grayRoi.delete();
    }
  }
  gray.delete();
  return result;
}

const MahjongRecognizer: React.FC = () => {
  const [cvReady, setCvReady] = useState(false);
  const isTemplateLoadedRef = useRef(false);

  useEffect(() => {
    cv.onRuntimeInitialized = () => {
      console.log("initialized");
      setCvReady(true);
    }
  }, []);
  
  const canvasRefs = {
    _1resized: useRef<HTMLCanvasElement>(null),
    _2edges: useRef<HTMLCanvasElement>(null),
    _3morphology: useRef<HTMLCanvasElement>(null),
    _4allContour: useRef<HTMLCanvasElement>(null),
    _5contour: useRef<HTMLCanvasElement>(null),
    _6croppedContour: useRef<HTMLCanvasElement>(null),
    _7hough: useRef<HTMLCanvasElement>(null),
    _8cluster: useRef<HTMLCanvasElement>(null),
    _9warped: useRef<HTMLCanvasElement>(null),
    _10tiles: useRef<HTMLCanvasElement[]>([]),
  };
  const tileRefs = useRef<HTMLSpanElement[]>([]);
  
  // 初期レンダリング時に空配列をセット
  useEffect(() => {
    canvasRefs._10tiles.current = Array(36).fill(null);
    tileRefs.current = Array(36).fill(null);
  }, [canvasRefs._10tiles]);

  // 起動時にテンプレート読み込み
  React.useEffect(() => {
    if (!cvReady) return;
    if (isTemplateLoadedRef.current) return;
    
    isTemplateLoadedRef.current = true;
    
    loadTemplates();
  }, [cvReady]);

  const processWallImage = useCallback((img: HTMLImageElement) => {
    if (!cvReady) return;
    if (!isTemplateLoadedRef.current) return;

    const colorMat = cv.imread(img);
    resizeToReduceMoire(colorMat);
    drawMatToCanvas(canvasRefs._1resized, colorMat);

    const edgeMat = detectEdges(colorMat);
    drawMatToCanvas(canvasRefs._2edges, edgeMat);
    
    morphologyClose(edgeMat);
    drawMatToCanvas(canvasRefs._3morphology, edgeMat);
    
    drawMatWithAllContoursToCanvas(canvasRefs._4allContour, colorMat, edgeMat);

    const contourMat = findBestContour(edgeMat, new cv.Point(edgeMat.cols / 2, edgeMat.rows * 0.55));
    edgeMat.delete();
    if (!contourMat) {
      console.warn('No contour detected.');
      colorMat.delete();
      return;
    }
    drawMatWithContourToCanvas(canvasRefs._5contour, colorMat, contourMat);

    const binaryContourMat = createBinaryContourMat(new cv.Size(colorMat.cols, colorMat.rows), contourMat);
    const boundingBox = calcRotatedBoundingBox(contourMat);
    contourMat.delete();
    const croppedBoundingBox = trimBoundingBoxRight(boundingBox, 2);
    maskOutsideRotatedBoundingBox(binaryContourMat, croppedBoundingBox);
    
    drawMatToCanvas(canvasRefs._6croppedContour, binaryContourMat);

    const lines = new cv.Mat();
    cv.HoughLinesP(binaryContourMat, lines, 1, Math.PI/720, 100, croppedBoundingBox.height * 0.4, croppedBoundingBox.height * 0.25);
    binaryContourMat.delete();

    drawMatWithLinesToCanvas(canvasRefs._7hough, colorMat, lines);

    const { hClusters, vClusters } = clusterLines(lines, croppedBoundingBox);
    lines.delete();

    if (hClusters.length < 2) {
      console.warn("[pre]Not enough horizontal clusters were detected.");
      colorMat.delete();
      return;
    }
    if (vClusters.length < 2) {
      console.warn("[pre]Not enough vertical clusters were detected.");
      colorMat.delete();
      return;
    }
    
    const boundaryLines = pickBoundaryLines(hClusters, vClusters);
    const quad = createQuadMatFromBoundaryLines(boundaryLines);
    
    drawMatWithPolygonToCanvas(canvasRefs._8cluster, colorMat, quad);
    
    const warped = warpQuadToRect(colorMat, quad, new cv.Size(441, 283));
    colorMat.delete();
    quad.delete();
    
    const wallMat = warped.roi(new cv.Rect(0, 0, 441, 264));
    warped.delete();

    drawMatToCanvas(canvasRefs._9warped, wallMat);

    drawTilesToCanvases(canvasRefs._10tiles, wallMat)

    const results = splitWallAndMatch(wallMat);
    results.forEach((result, i) => tileRefs.current[i].innerText = result.tile);
    console.log(results);
    wallMat.delete();
  }, [canvasRefs._10tiles, canvasRefs._1resized, canvasRefs._2edges, canvasRefs._3morphology, canvasRefs._4allContour, canvasRefs._5contour, canvasRefs._6croppedContour, canvasRefs._7hough, canvasRefs._8cluster, canvasRefs._9warped, cvReady]);
  
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const img = new Image(); img.src = URL.createObjectURL(file);
    await img.decode();
    processWallImage(img);
  }, [processWallImage]);

  return (
    <div>
      <h2>Mahjong Recognizer</h2>
      <input type="file" accept="image/*" onChange={handleFileChange} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16, marginTop: 16 }}>
        <div><p>1. Resized</p><canvas ref={canvasRefs._1resized} style={{ maxWidth: '100%', border: '1px solid #ccc' }} /></div>
        <div><p>2. Edges</p><canvas ref={canvasRefs._2edges} style={{ maxWidth: '100%', border: '1px solid #ccc' }} /></div>
        <div><p>3. Morphology</p><canvas ref={canvasRefs._3morphology} style={{ maxWidth: '100%', border: '1px solid #ccc' }} /></div>
        <div><p>4. All Contour</p><canvas ref={canvasRefs._4allContour} style={{ maxWidth: '100%', border: '1px solid #ccc' }} /></div>
        <div><p>5. Contour</p><canvas ref={canvasRefs._5contour} style={{ maxWidth: '100%', border: '1px solid #ccc' }} /></div>
        <div><p>6. Cropped contour</p><canvas ref={canvasRefs._6croppedContour} style={{ maxWidth: '100%', border: '1px solid #ccc' }} /></div>
        <div><p>7. Hough</p><canvas ref={canvasRefs._7hough} style={{ maxWidth: '100%', border: '1px solid #ccc' }} /></div>
        <div><p>8. Cluster</p><canvas ref={canvasRefs._8cluster} style={{ maxWidth: '100%', border: '1px solid #ccc' }} /></div>
        <div><p>9. Warped</p><canvas ref={canvasRefs._9warped} style={{ maxWidth: '100%', border: '1px solid #ccc' }} /></div>
        <div>
          <p>10. Tiles</p>
          <div style={{ display: 'inline-grid', gridTemplateColumns: 'repeat(9, 1fr)', gap: 8, marginTop: 16 }}>
            {Array.from({ length: 36 }).map((_, idx) => (
              <div key={`roi-${idx}`}>
                <canvas
                  ref={el => { if (el) canvasRefs._10tiles.current[idx] = el }}
                  style={{ border: '1px solid #666', width: '100%', height: 'auto' }}
                />
                <span ref={el => { if (el) tileRefs.current[idx] = el }}></span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MahjongRecognizer;
