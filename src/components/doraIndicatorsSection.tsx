import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/realm.module.css";
import { SanmaTile, PINZU_TILES, SOZU_TILES, SANMA_MANZU_TILES, WIND_TILES, DRAGON_TILES } from "../types/simulation";

interface DoraIndicatorsSectionProps {
  doraIndicators: SanmaTile[];
  maxDoraIndicators: number;
  addDoraIndicator: (tile: SanmaTile) => void;
  removeDoraIndicatorAtIndex: (index: number) => void;
}

const DoraIndicatorsSection: React.FC<DoraIndicatorsSectionProps> = ({ doraIndicators, maxDoraIndicators, addDoraIndicator, removeDoraIndicatorAtIndex }) => {
  const tileGroups: SanmaTile[][] = [
    [...PINZU_TILES],
    [...SOZU_TILES],
    [...SANMA_MANZU_TILES, ...WIND_TILES, ...DRAGON_TILES],
  ];
  return (
    <section className={styles.dora_indicators_section}>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"ドラ表示牌"} />
        </div>
        <div className={`${styles.area} ${styles.dora_indicators}`}>
          {Array.from({ length: maxDoraIndicators }, (_, i) =>
            i < doraIndicators.length ? (
              <img
                key={`dora_indicator_${i}`}
                className={styles.dora_indicator}
                src={`/tiles/${doraIndicators[i]}.png`}
                onClick={() => removeDoraIndicatorAtIndex(i)}
                alt={doraIndicators[i]}
              />
            ) : (
              <img
                key={`dora_indicator_${i}`}
                className={styles.dora_indicator}
                src={`/tiles/empty.png`}
                alt={"empty"}
              />
            )
          )}
        </div>
      </div>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"ドラ表示牌選択"} />
        </div>
        <div className={`${styles.area} ${styles.dora_indicator_choices}`}>
          {tileGroups.map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              {group.map(tile => (
                <img
                  key={`dora_indicator_choice_${tile}`}
                  className={styles.dora_indicator}
                  src={`/tiles/${tile}.png`}
                  onClick={() => addDoraIndicator(tile)}
                  alt={tile}
                />
              ))}
              {groupIndex < tileGroups.length - 1 && <div style={{ width: "100%" }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DoraIndicatorsSection;
