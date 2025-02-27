import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import DynamicSVGTextSequence from "./dynamicSVGTextSequence";
import styles from "../pages/manman.module.css";

const Result = ({ optimalTenpais }) => {
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
          optimalTenpais.map((tenpai, i) => {
            return (
              <div key={`tempai_${i}`} className={styles.result}>
                <div className={styles.loss}>
                  <DynamicSVGTextSequence text={["ロス", ...`${tenpai.loss}`, "枚", ...(tenpai.breakdown && `（${tenpai.breakdown}）`)]} />
                </div>
                <div className={styles.hand}>
                  <img className={styles.hand_tile} src={`/tiles/wild.png`} alt="万象牌" />
                  {
                    tenpai.hand.flatMap((component, j) =>
                      component.tiles.map((tile, k) => (
                        <img
                          key={`tempai_${i}_comp_${j}_tile_${k}`}
                          className={styles.hand_tile}
                          src={`/tiles/${tile}.png`}
                          alt={tile}
                        />
                      ))
                    )
                  }
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
