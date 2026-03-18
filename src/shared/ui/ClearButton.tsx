import React, { ButtonHTMLAttributes, useEffect, useMemo, useState } from 'react';

import parse from 'html-react-parser';

interface ClearButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  width?: string;
  height?: string;
}

const SVG_COLOR = 'var(--color-text)';

const ClearButton: React.FC<ClearButtonProps> = ({
  width = '10%',
  height = '10%',
  style,
  ...props
}) => {
  const [baseSvg, setBaseSvg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSvg = async () => {
      const src = '/ui_icons/clear.svg';

      try {
        const response = await fetch(src);
        const data = await response.text();

        if (isMounted) {
          setBaseSvg(data);
        }
      } catch (error) {
        console.error(`Failed to load SVG: ${src}`, error);
      }
    };

    void fetchSvg();

    return () => {
      isMounted = false;
    };
  }, []);

  const svgContent = useMemo(() => {
    if (baseSvg == null) return null;

    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(baseSvg, 'image/svg+xml');
    const svgElement = svgDoc.documentElement;

    if (svgElement == null) return null;

    svgElement.setAttribute('fill', SVG_COLOR);
    svgElement.setAttribute('height', '100%');
    svgElement.setAttribute('width', '100%');

    return parse(svgElement.outerHTML);
  }, [baseSvg]);

  return (
    <div
      style={{
        padding: `calc(${height} / 2) calc(${width} / 2)`,
        position: 'absolute',
        top: 0,
        right: 0,
      }}
    >
      <button
        {...props}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          padding: 0,
          fontSize: 'inherit',
          ...style,
        }}
      >
        {svgContent}
      </button>
    </div>
  );
};

export default ClearButton;
