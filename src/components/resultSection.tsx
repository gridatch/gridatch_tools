import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import DynamicSVGTextSequence from "./dynamicSVGTextSequence";
import styles from "../pages/manman.module.css";
import { SozuHand, SOZU_TILES, ManmanTenpaiResult } from "../types/simulation";
import ClearButton from "./clearButton";

interface ResultSectionProps {
  handState: SozuHand;
  tenpaiResults: ManmanTenpaiResult[];
  clearAll: () => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({ handState, tenpaiResults, clearAll }) => {
  return (
    <section className={styles.result_section}>
      <div className={styles.area_title} style={{position: "relative"}}>
        <DynamicSVGText text={"最終形"} />
        <span style={{ fontSize: "var(--font-sx)" }}>
          <DynamicSVGText text={"※ロス数12枚以下の形を表示"} />
        </span>
        <ClearButton onClick={clearAll} style={{ marginTop: "-5px" }} />
      </div>
      <div id="results" className={`${styles.area} ${styles.results}`}>
        {
          tenpaiResults.map((tenpai, i) => {
            const resultTilesToRender: string[] = [];
            
            // 順子の表示：1セット目は 1p,2p,3p; 2セット目は 4p,5p,6p
            if (tenpai.hand.sequence >= 1) {
              resultTilesToRender.push(...["1p", "2p", "3p"]);
            }
            if (tenpai.hand.sequence >= 2) {
              resultTilesToRender.push(...["4p", "5p", "6p"]);
            }
            
            // 刻子の表示：1セット目は 7p,7p,7p; 2セット目は 8p,8p,8p
            if (tenpai.hand.triplet >= 1) {
              resultTilesToRender.push(...["7p", "7p", "7p"]);
            }
            if (tenpai.hand.triplet >= 2) {
              resultTilesToRender.push(...["8p", "8p", "8p"]);
            }
            
            // 対子の表示：9p,9p
            if (tenpai.hand.pair >= 1) {
              if (handState.pair) {
                resultTilesToRender.push(...["9p", "9p"]);
              } else {
                if (handState.triplet === 2) {
                  resultTilesToRender.push(...["8p", "8p"]);
                } else {
                  resultTilesToRender.push(...["7p", "7p"]);
                }
              }
            }
            
            // 索子の表示（1s～9sの昇順）
            SOZU_TILES.forEach(tile => {
              for (let i = 0; i < tenpai.hand[tile]; ++i) {
                resultTilesToRender.push(tile);
              }
            });
            
            return (
              <div key={`tempai_${i}`} className={styles.result}>
                <div>
                  <DynamicSVGTextSequence text={["ロス", ...`${tenpai.loss}`, "枚", ...(tenpai.breakdown && `（${tenpai.breakdown}）`)]} />
                </div>
                <div className={styles.hand}>
                  <img className={styles.hand_tile} src={`/tiles/wild.png`} alt="万象牌" />
                  {
                    resultTilesToRender.map((tile, j) => (
                      <img
                        key={`tempai_${i}_${j}`}
                        className={styles.hand_tile}
                        src={`/tiles/${tile}.png`}
                        alt={tile}
                      />
                    ))
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
