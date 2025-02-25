import React from 'react';
import DynamicSVGText from './dynamicSVGText';

const DynamicSVGTextSequence = ({ text, className = '', height = '1em' }) => {
  let items;

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
    <span>
      {items.map((item, index) => (
        <DynamicSVGText key={index} text={item} className={className} height={height} />
      ))}
    </span>
  );
};

export default DynamicSVGTextSequence;
