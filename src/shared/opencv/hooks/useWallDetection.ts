import { useCallback, useMemo, useRef } from 'react';

import { WallTile } from '@shared/types/simulation';

import { processWallImage } from '../utils/wallDetectionUtils';

import { useTileTemplates } from './useTileTemplates';

/**
 * 牌山画像の牌検出処理を行うカスタムフック
 * @param setWall 牌山をセットする関数
 */
export function useWallDetection(
  setWall: React.Dispatch<React.SetStateAction<WallTile[]>>,
) {
  const templatesLoaded = useTileTemplates();
  const isProcessingRef = useRef(false);

  const detectWall = useCallback((img: HTMLImageElement | HTMLCanvasElement) => {
    if (!templatesLoaded) {
      console.error('[detectWall] Templates have not been loaded.');
      return;
    }
    if (isProcessingRef.current) {
      console.error('[detectWall] Processing...');
      return;
    }

    isProcessingRef.current = true;
    try {
      const wall = processWallImage(img);
      if (wall) {
        setWall(wall);
        return true;
      } else {
        return false;
      }
    } catch {
      console.error('[detectWall] Failed to detect wall.');
    } finally {
      isProcessingRef.current = false;
    }
  }, [templatesLoaded, setWall]);

  return useMemo(() => ({ detectWall }), [detectWall]);
}
