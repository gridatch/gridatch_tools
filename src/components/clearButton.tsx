import React, { useState, useEffect, ButtonHTMLAttributes } from "react";
import parse from "html-react-parser";

interface ClearButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  width?: string;
  height?: string;
}

const ClearButton: React.FC<ClearButtonProps> = ({ width = "2em", height = "2em", style, ...props }) => {
  const [baseSvg, setBaseSvg] = useState<string | null>(null);
  const [svgContent, setSvgContent] = useState<React.ReactNode | null>(null);
  const SVG_COLOR = "var(--color-text)";

  useEffect(() => {
    const fetchSvg = async () => {
      const src = "/ui_icons/clear.svg";
      try {
        const response = await fetch(src);
        const data = await response.text();
        setBaseSvg(data);
      } catch (error) {
        console.error(`Failed to load SVG: ${src}`, error);
      }
    };

    fetchSvg();
  }, []);

  useEffect(() => {
    if (baseSvg) {
      const parser = new DOMParser();
      const svgDoc = parser.parseFromString(baseSvg, "image/svg+xml");
      const svgElement = svgDoc.documentElement;
      if (svgElement) {
        svgElement.setAttribute("fill", SVG_COLOR);
        svgElement.setAttribute("height", height);
        svgElement.setAttribute("width", width);
        setSvgContent(parse(svgElement.outerHTML));
      }
    }
  }, [baseSvg, width, height]);

  return (
    <button
      {...props}
      style={
        {
          ...{
            position: "absolute",
            top: 0,
            right: 0,
            display: "inline-flex",
            justifyContent: "center",
            alignItems: "center",
            padding: 0,
            border: "2px solid var(--color-text)",
            borderRadius: "3px",
            backgroundColor: "var(--color-button-bg)",
            cursor: "pointer",
            fontSize: "inherit",
          },
          ...style,
        }
      }
    >
      {svgContent}
    </button>
  );
};

export default ClearButton;
