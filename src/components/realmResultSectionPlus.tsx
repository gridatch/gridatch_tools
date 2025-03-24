import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/realm-plus.module.css";
import { SANMA_TILES, RealmTenpaiResult, SanmaTile, SOZU_TILES } from "../types/simulation";
import DynamicSVGTextSequence from "./dynamicSVGTextSequence";

interface RealmResultSectionProps {
  results: RealmTenpaiResult[] | null;
  drawTurnsByTiles: Record<SanmaTile, number[]>;
}

const RealmResultSectionPlus: React.FC<RealmResultSectionProps> = ({ results, drawTurnsByTiles }) => {
  if (!results) return;
  return (
    <section className={styles.realm_result_section}>
      <div className={styles.area_title}>
        <span>
          <DynamicSVGText text={"最終形"} />
        </span>
      </div>
      <div className={`${styles.area} ${styles.realm_results}`}>
        {
          results.map(result => {
            let typeName = "";
            switch (result.type) {
              case "standard":
                typeName = "面子手";
                break;
              case "sevenPairs":
                typeName = "七対子";
                break;
              case "kokushi":
                typeName = "国士無双";
                break;
            }
            
            return (
              <React.Fragment key={`result_${result.type}`}>
                <span>
                  <DynamicSVGText text={typeName} />
                  {
                    result.turn === Number.POSITIVE_INFINITY
                      ? <DynamicSVGTextSequence text={"：聴牌しません"} />
                      : <DynamicSVGTextSequence text={`：${result.turn}巡目聴牌、${result.totalWins}和了`} />
                  }
                  {
                    result.totalNonRealmWins > 0 
                      && <>
                        <DynamicSVGText text={"（"} />
                          {
                            SOZU_TILES
                              .filter(tile => result.nonRealmWinsPerTiles[tile] > 0)
                              .map(tile => (
                                <React.Fragment key={`non_realm_${tile}`}>
                                  <img
                                    className={styles.result_non_realm_tile}
                                    src={`/tiles/${tile}.png`}
                                    alt={tile}
                                  />
                                  <span style={{fontSize: "var(--font-sm)"}}>
                                    <DynamicSVGTextSequence text={`×${result.nonRealmWinsPerTiles[tile]}和了`} />
                                  </span>
                                </React.Fragment>
                              ))
                          }
                        <DynamicSVGText text={"）"} />
                      </>
                  }
                </span>
                <div className={styles.realm_result_hand}>
                  {SANMA_TILES.map((tile) => (
                    Array.from({ length: result.hand[tile] }, (_, i) => {
                      return (
                        <div key={`hand_${tile}_${i}`} className={styles.result_tile_counter}>
                          <img
                            src={`/tiles/${tile}.png`}
                            alt={tile}
                          />
                          <span className={styles.result_tile_counter_text}>
                            {
                              drawTurnsByTiles[tile][i] > 0 && <>
                                <DynamicSVGTextSequence text={`${drawTurnsByTiles[tile][i]}`} className={styles.tile_counter_text_negative_margin_right} />
                                <DynamicSVGText text="巡" />
                              </>
                            }
                          </span>
                        </div>
                      )
                    })
                  ))}
                </div>
              </React.Fragment>
            );
          })
        }
      </div>
    </section>
  );
};

export default RealmResultSectionPlus;
