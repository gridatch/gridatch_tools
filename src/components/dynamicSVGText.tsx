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
  const [svgText, setSvgText] = useState<React.ReactNode | null>(null);

  useEffect(() => {
    const sanitizedText = sanitize(text);
    const src = `/generated_svgs/${sanitizedText}.svg`;
    
    const fetchSVG = async () => {
      try {
        if (!text.trim()) {
          setSvgText(text);
          return;
        }
        const response = await fetch(src);
        if (!response.ok) return;
        const rawSVGText = await response.text();

        // SVG テキストを DOM オブジェクトに変換
        const domParser = new DOMParser();
        const svgDoc = domParser.parseFromString(rawSVGText, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        // svg 要素に直接 height, fill, class を設定
        svgElement.setAttribute('height', height);
        svgElement.setAttribute('fill', 'currentColor');
        svgElement.classList.add(styles.staticSVGText);
        if (className) svgElement.classList.add(className);

        // svg 要素をReact element に変換
        setSvgText(parse(svgElement.outerHTML));
      } catch (error) {
        console.error(`Failed to load SVG: ${src}`, error);
      }
    };

    fetchSVG();
  }, [text, height, className]);

  return svgText || null;
};

export default DynamicSVGText;