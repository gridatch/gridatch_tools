import { useEffect, useState } from 'react';
import sanitize from 'sanitize-filename';
import parse from 'html-react-parser';
import styles from './dynamicSVGText.module.css';

const StaticSVGText = ({ text, className = '', height = '1.2em' }) => {
  const [svgText, setSvgText] = useState(null);

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

        // SVG テキストをパースして DOM オブジェクトに変換
        const domParser = new DOMParser();
        const svgDoc = domParser.parseFromString(rawSVGText, 'image/svg+xml');
        const svgElement = svgDoc.documentElement;

        // svg 要素に直接 height やその他の属性を設定
        svgElement.setAttribute('height', height);
        svgElement.setAttribute('fill', 'currentColor');
        svgElement.setAttribute('fill', 'currentColor');
        svgElement.classList.add(styles.staticSVGText);
        if (className) svgElement.classList.add(className);

        // 修正済みの svg 要素を文字列に変換して保存
        setSvgText(parse(svgElement.outerHTML));
      } catch (error) {
        console.error(`Failed to load SVG: ${src}`, error);
      }
    };

    fetchSVG();
  }, [text, height, className]);

  return svgText ? svgText : null;
};

export default StaticSVGText;