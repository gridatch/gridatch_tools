import React, { ButtonHTMLAttributes, useEffect, useMemo, useState } from 'react';

import parse from 'html-react-parser';

interface EditButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  width?: string;
  height?: string;
}

const SVG_COLOR = 'var(--color-text)';

const EditButton: React.FC<EditButtonProps> = ({
  width = '10%',
  height = '10%',
  style,
  ...props
}) => {
  const [baseSvg, setBaseSvg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSvg = async () => {
      const src = '/ui_icons/edit.svg';

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
    svgElement.setAttribute('height', '80%');
    svgElement.setAttribute('width', '80%');
    svgElement.style.margin = '10%';

    return parse(svgElement.outerHTML);
  }, [baseSvg]);

  return (
    <div
      style={{
        padding: `calc(${height} / 2) calc(${width} / 2)`,
        position: 'absolute',
        bottom: 0,
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

export default EditButton;
