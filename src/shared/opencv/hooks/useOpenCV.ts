import { useState, useEffect } from 'react';

import cv from '@techstark/opencv-js';

export function useOpenCV(): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    cv.onRuntimeInitialized = () => {
      setReady(true);
      console.log('[useOpenCV] OpenCV is ready.');
    };
  }, []);

  return ready;
}
