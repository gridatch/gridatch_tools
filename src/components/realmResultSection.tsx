import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/realm.module.css";
import { PINZU_TILES, SOZU_TILES, SANMA_MANZU_TILES, WIND_TILES, DRAGON_TILES, SanmaTile, DoraBoss } from "../types/simulation";
import DynamicSVGTextSequence from "./dynamicSVGTextSequence";

interface RealmResultSectionProps {
  doraBoss: DoraBoss;
  realmTileCounter: Map<SanmaTile, number>;
}

const RealmResultSection: React.FC<RealmResultSectionProps> = ({ doraBoss, realmTileCounter }) => {
  const tileGroups: SanmaTile[][] = [
    [...PINZU_TILES],
    [...SOZU_TILES],
    [...SANMA_MANZU_TILES, ...WIND_TILES, ...DRAGON_TILES],
  ];
  const RealmTileTypeCount = realmTileCounter.size;
  const RealmTileCount = [...realmTileCounter.values()].reduce((sum, count) => sum + count, 0);
  const SozuRealmTileCount = [...realmTileCounter.entries()]
    .filter(counter => SOZU_TILES.some(tile => tile === counter[0]))
    .reduce((sum, counter) => sum + counter[1], 0);
  
  return (
    <section className={styles.realm_result_section}>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"領域牌"} />
          <DynamicSVGText text={"："} />
          <DynamicSVGTextSequence text={`${RealmTileTypeCount}種${RealmTileCount}枚`} />
        </div>
        <div className={`${styles.area} ${styles.realm_result}`}>
          <div className={styles.realm_result_warn}>
            { doraBoss === "empty"
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
                  <div key={`dora_indicator_choice_${tile}`} className={styles.realm_tile_wrapper} style={{ visibility: visibility }}>
                    <img
                      src={`/tiles/${tile}.png`}
                      alt={tile}
                    />
                    <span className={styles.realm_tile_count}>
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

export default RealmResultSection;
