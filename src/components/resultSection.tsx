import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import DynamicSVGTextSequence from "./dynamicSVGTextSequence";
import styles from "../pages/manman.module.css";
import { TenpaiResult } from "../types/simulation";

interface ResultProps {
  tenpaiResults: TenpaiResult[];
}

const ResultSection: React.FC<ResultProps> = ({ tenpaiResults }) => {
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
          tenpaiResults.map((tenpai, i) => {
            return (
              <div key={`tempai_${i}`} className={styles.result}>
                <div>
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

export default ResultSection;
