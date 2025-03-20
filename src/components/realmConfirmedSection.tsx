import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/realm-plus.module.css";
import { DoraBoss, SanmaTile, WallTile } from "../types/simulation";

interface RealmConfirmedSectionProps {
  doraBoss: DoraBoss;
  doraBossConfirmed: boolean;
  doraIndicators: SanmaTile[];
  doraIndicatorsConfirmed: boolean;
  isRealmEachTile: Record<SanmaTile, boolean>;
  wall: WallTile[];
  wallConfirmed: boolean;
}

const RealmConfirmedSection: React.FC<RealmConfirmedSectionProps> = ({
  doraBoss,
  doraBossConfirmed,
  doraIndicators,
  doraIndicatorsConfirmed,
  isRealmEachTile,
  wall,
  wallConfirmed,
}) => {
  if (!doraBossConfirmed) return;
  return (
    <section className={styles.confirmed_section}>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"場の状態"} />
        </div>
        <div className={`${styles.area} ${styles.confirmed_dora}`}>
          <img
            className={styles.dora_boss_image}
            src={`/boss/${doraBoss}.png`}
            alt={doraBoss}
          />
          <div className={styles.confirmed_dora_indicators}>
            {
              doraIndicatorsConfirmed && doraIndicators.map((tile, i) => (
                <img
                  key={`dora_indicator_${i}`}
                  className={styles.confirmed_dora_indicator}
                  src={`/tiles/${tile}.png`}
                  alt={doraIndicators[i]}
                />
              ))
            }
          </div>
        </div>
        <div className={`${styles.area} ${styles.confirmed_wall}`}>
          {wallConfirmed && wall.map((tile, i) => {
            const isNotRealm = wall[i] !== "empty" && wall[i] !== "closed" && !isRealmEachTile[wall[i]];
            return (
              <React.Fragment key={`wall_${i}`}>
                {
                  i % 10 === 0 && i !== 0 && <div style={{ width: "100%" }}></div>
                }
                {
                  wall[i] !== "empty" && (
                    <img
                      className={`${styles.confirmed_wall_tile} ${isNotRealm && styles.not_realm}`}
                      src={`/tiles/${tile}.png`}
                      alt={tile}
                    />
                  )
                }
              </React.Fragment>
            )
          })}
        </div>
      </div>
    </section>
  );
};

export default RealmConfirmedSection;
