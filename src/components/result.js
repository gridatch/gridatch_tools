import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import DynamicSVGTextSequence from "./dynamicSVGTextSequence";
import styles from "../pages/manman.module.css";

const Result = ({ simulationResults }) => {
  return (
    <section className={styles.result_section}>
      <div className={styles.area_title}>
        <DynamicSVGText text={"最終形"} />
        <span style={{ fontSize: "var(--font-sx)" }}>
          <DynamicSVGText text={"※ロス数12枚以下の形を表示（10件以上の時は省略）"} />
        </span>
      </div>
      <div id="results" className={`${styles.area} ${styles.results}`}>
        {
          simulationResults.map((result, idx) => {
            const resultTilesToRender = result.candidate.flatMap((item, j) =>
              item.tiles.map((tile, k) => (
                <img
                  key={`${idx}_${j}_${k}`}
                  className={styles.hand_tile}
                  src={`/tiles/${tile}.png`}
                  alt={tile}
                />
              ))
            );
            
            return (
              <div key={`result_${idx}`} className={styles.result}>
                <div className={styles.loss}>
                  <DynamicSVGTextSequence text={["ロス", ...`${result.loss}`, "枚", ...(result.breakdown && `（${result.breakdown}）`)]} />
                </div>
                <div className={styles.hand}>
                  <img className={styles.hand_tile} src={`/tiles/wild.png`} alt="万象牌" />
                  {resultTilesToRender}
                </div>
              </div>
            );
          })
        }
      </div>
    </section>
  );
};

export default Result;
