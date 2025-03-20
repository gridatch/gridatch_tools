import React, { useEffect, useState } from 'react';
import sanitize from 'sanitize-filename';
import parse from 'html-react-parser';
import styles from './dynamicSVGText.module.css';

interface DynamicSVGTextProps {
  text: string;
  className?: string;
  height?: string;
}

const DynamicSVGText: React.FC<DynamicSVGTextProps> = ({ text, className = '', height = '1.2em' }) => {
  const [rawSVGText, setRawSVGText] = useState<string | null>(null);
  const [svgText, setSvgText] = useState<React.ReactNode | null>(null);
  
  useEffect(() => {
    const sanitizedText = sanitize(text);
    const src = `/generated_svgs/${sanitizedText}.svg`;

    const fetchSVG = async () => {
      try {
        if (!text.trim()) {
          setSvgText(text);
          setRawSVGText(null);
          return;
        }
        const response = await fetch(src);
        if (!response.ok) return;
        const fetchedRawSVGText = await response.text();
        setRawSVGText(fetchedRawSVGText);
      } catch (error) {
        console.error(`Failed to load SVG: ${src}`, error);
      }
    };

    fetchSVG();
  }, [text]);
  

  useEffect(() => {
    if (rawSVGText) {
      try {
        const domParser = new DOMParser();
        const svgDoc = domParser.parseFromString(rawSVGText, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        svgElement.setAttribute('height', height);
        svgElement.setAttribute('fill', 'currentColor');
        svgElement.classList.add(styles.staticSVGText);
        if (className) {
          // 空白区切りのクラスを個別に追加
          const classes = className.split(/\s+/).filter(Boolean);
          classes.forEach(c => svgElement.classList.add(c));
        }

        setSvgText(parse(svgElement.outerHTML));
      } catch (error) {
        console.error(`Error processing SVG`, error);
      }
    }
  }, [rawSVGText, height, className]);

  return <>{svgText}</>;
};

export default DynamicSVGText;