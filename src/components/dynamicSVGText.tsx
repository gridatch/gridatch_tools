import React, { SVGAttributes, useEffect, useState } from 'react';
import sanitize from 'sanitize-filename';
import parse from 'html-react-parser';
import styles from './dynamicSVGText.module.css';

interface DynamicSVGTextProps extends SVGAttributes<SVGElement> {
  text: string;
  className?: string;
  height?: string;
}

const svgRawCache = new Map<string, string>();
const svgParsedCache = new Map<string, React.ReactNode>();

const serializeStyle = (style?: React.CSSProperties) => {
  if (!style) return '';
  return Object.entries(style)
    .filter(([, value]) => value != null)
    .map(([key, value]) => {
      const cssProp = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${cssProp}:${value}`;
    })
    .join(';');
};

const DynamicSVGText: React.FC<DynamicSVGTextProps> = ({ text, className = '', height = '1.2em', style }) => {
  const [svgContent, setSvgContent] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    let aborted = false;
    
    const sanitizedText = sanitize(text);
    const src = `/generated_svgs/${sanitizedText}.svg`;

    if (!text.trim()) {
      setSvgContent(text);
      return;
    }

    const fetchAndCacheSVG = async () => {
      try {
        const styleStr = serializeStyle(style);
        const cacheKey = `${text}|h=${height}|c=${className}|s=${styleStr}`;

        // パース済みSVGのキャッシュ
        if (svgParsedCache.has(cacheKey)) {
          setSvgContent(svgParsedCache.get(cacheKey)!);
          return;
        }

        // rawSVGのキャッシュ
        let rawSVG: string | undefined = svgRawCache.get(sanitizedText);
        if (!rawSVG) {
          const response = await fetch(src);
          if (!response.ok) return;
          rawSVG = await response.text();
          svgRawCache.set(sanitizedText, rawSVG);
        }

        const domParser = new DOMParser();
        const svgDoc = domParser.parseFromString(rawSVG, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        svgElement.setAttribute('height', height || '1.2em');
        svgElement.setAttribute('fill', 'currentColor');
        svgElement.classList.add(styles.dynamicSVGText);
        if (className) {
          const classes = className.split(/\s+/).filter(Boolean);
          classes.forEach(c => svgElement.classList.add(c));
        }
        if (style) {
          Object.entries(style).forEach(([jsProp, value]) => {
            if (value == null) return;
            const cssProp = jsProp.replace(/([A-Z])/g, '-$1').toLowerCase();
            svgElement.style.setProperty(cssProp, String(value));
          });
        }

        const parsed = parse(svgElement.outerHTML);
        svgParsedCache.set(cacheKey, parsed);
        if (!aborted) setSvgContent(parsed);

      } catch (error) {
        console.error(`Failed to load or process SVG: ${src}`, error);
      }
    };

    fetchAndCacheSVG();
    return () => { aborted = true; };
  }, [text, className, height, style]);

  return <>{svgContent}</>;
};

export default React.memo(DynamicSVGText, (prev, next) =>
  prev.text === next.text &&
  prev.className === next.className &&
  prev.height === next.height &&
  serializeStyle(prev.style) === serializeStyle(next.style)
);
