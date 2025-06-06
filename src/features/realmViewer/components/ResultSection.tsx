import React from "react";
import DynamicSVGText from "../../../shared/ui/DynamicSVGText";
import styles from "../pages/RealmViewerPage.module.css";
import { PINZU_TILES, SOZU_TILES, NON_SEQUENTIAL_TILES, SanmaTile, RealmBoss } from "../../../shared/types/simulation";
import DynamicSVGTextSequence from "../../../shared/ui/DynamicSVGTextSequence";
import ClearButton from "../../../shared/ui/ClearButton";

interface ResultSectionProps {
  boss: RealmBoss;
  realmTileCounter: Map<SanmaTile, number>;
  clearAll: () => void;
}

const ResultSection: React.FC<ResultSectionProps> = ({ boss, realmTileCounter, clearAll }) => {
  const tileGroups: SanmaTile[][] = [
    [...PINZU_TILES],
    [...SOZU_TILES],
    [...NON_SEQUENTIAL_TILES],
  ];
  const RealmTileTypeCount = realmTileCounter.size;
  const RealmTileCount = [...realmTileCounter.values()].reduce((sum, count) => sum + count, 0);
  const SozuRealmTileCount = [...realmTileCounter.entries()]
    .filter(counter => SOZU_TILES.some(tile => tile === counter[0]))
    .reduce((sum, counter) => sum + counter[1], 0);
  
  return (
    <section className={styles.realm_result_section}>
      <div>
        <div className={styles.area_title} style={{position: "relative"}}>
          <span>
            <DynamicSVGText text={"領域牌"} />
            <DynamicSVGText text={"："} />
            <DynamicSVGTextSequence text={`${RealmTileTypeCount}種${RealmTileCount}枚`} />
          </span>
          <ClearButton onClick={clearAll} height="1.5em" style={{ marginTop: "-5px" }} />
        </div>
        <div className={`${styles.area} ${styles.realm_result}`}>
          <div className={styles.realm_result_warn}>
            { boss === "empty"
            ? <>
                <DynamicSVGText text={"ステージ効果を設定してください。"} />
                <DynamicSVGText text={"※ドラ無効の事故防止で必須にしています。"} />
              </>
            : SozuRealmTileCount === 0 &&
              <>
                <DynamicSVGText text={"※索子の領域牌がありません！"} />
                <DynamicSVGText text={"※索子の育成は索子多面張で！"} />
              </>
            }
          </div>
          {tileGroups.map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              {group.map(tile => {
                const is_realm = realmTileCounter.has(tile);
                const visibility = is_realm ? "visible" : "hidden";
                const tileCount = is_realm ? realmTileCounter.get(tile) : "";
                return (
                  <div key={`dora_indicator_choice_${tile}`} className={styles.tile_counter} style={{ visibility: visibility }}>
                    <img
                      src={`/tiles/${tile}.png`}
                      alt={tile}
                    />
                    <span className={styles.tile_counter_text}>
                      <DynamicSVGText text={"×"} />
                      <DynamicSVGText text={`${tileCount}`} />
                    </span>
                  </div>
                );
              })}
              {groupIndex < tileGroups.length - 1 && <div style={{ width: "100%" }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ResultSection;
