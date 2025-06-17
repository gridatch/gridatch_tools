import { useEffect, useRef, useState } from 'react';

import { loadTileTemplates } from '../utils/tileTemplates';

import { useOpenCV } from './useOpenCV';

export function useTileTemplates(): boolean {
  const cvReady = useOpenCV();
  const [loaded, setLoaded] = useState(false);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    if (!cvReady) return;
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    loadTileTemplates()
      .then(() => {
        setLoaded(true);
        console.log('[useTileTemplates] Tile templates are ready.');
      })
      .catch((err: unknown) => {
        console.error('[useTileTemplates] Template load failed.', err);
        isLoadingRef.current = false;
      });
  }, [cvReady]);

  return loaded;
}
