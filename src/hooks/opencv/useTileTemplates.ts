import { useEffect, useRef, useState } from 'react';
import { useOpenCV } from './useOpenCV';
import { loadTileTemplates } from '../../utils/tileTemplates';

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
      })
      .catch((err: unknown) => {
        console.error('[useTileTemplates] Template load failed.', err);
        isLoadingRef.current = false;
      });
  }, [cvReady]);

  return loaded;
}
