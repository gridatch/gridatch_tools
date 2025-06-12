import React, { SVGAttributes } from 'react';

import DynamicSVGText from './DynamicSVGText';

interface DynamicSVGTextSequenceProps extends SVGAttributes<SVGElement> {
  text: string | string[];
  height?: string;
}

const DynamicSVGTextSequence: React.FC<DynamicSVGTextSequenceProps> = ({ text, height = '1.2em', className = '', style }) => {
  let items: string[];

  if (typeof text === 'string') {
    // 文字列の場合は1文字ずつに分解
    items = Array.from(text);
  } else if (Array.isArray(text)) {
    // 文字列の配列の場合はそのまま使用
    items = text;
  } else {
    console.error('[DynamicSVGTextSequence] Unexpected text format.');
    items = [];
  }

  return (
    <>
      {items.map((item, index) => (
        <DynamicSVGText key={index} text={item} height={height} className={className} style={style} />
      ))}
    </>
  );
};

export default DynamicSVGTextSequence;
