import React from 'react';
import DynamicSVGText from './dynamicSVGText';

interface DynamicSVGTextSequenceProps {
  text: string | string[];
  className?: string;
  height?: string;
}

const DynamicSVGTextSequence: React.FC<DynamicSVGTextSequenceProps> = ({ text, className = '', height = '1.2em' }) => {
  let items: string[];

  if (typeof text === 'string') {
    // 文字列の場合は1文字ずつに分解
    items = Array.from(text);
  } else if (Array.isArray(text)) {
    // 文字列の配列の場合はそのまま使用
    items = text;
  } else {
    console.error('DynamicSVGTextSequence には文字列または文字列の配列を渡してにゃ。');
    items = [];
  }

  return (
    <>
      {items.map((item, index) => (
        <DynamicSVGText key={index} text={item} className={className} height={height} />
      ))}
    </>
  );
};

export default DynamicSVGTextSequence;
