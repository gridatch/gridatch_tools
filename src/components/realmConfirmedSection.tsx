import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/realm-plus.module.css";
import { DoraBoss, SanmaTile, WallTile } from "../types/simulation";
import ClearButton from "./clearButton";
import EditButton from "./editButton";

interface RealmConfirmedSectionProps {
  doraBoss: DoraBoss;
  doraBossConfirmed: boolean;
  doraIndicators: SanmaTile[];
  doraIndicatorsConfirmed: boolean;
  isRealmEachTile: Record<SanmaTile, boolean>;
  wall: WallTile[];
  wallConfirmed: boolean;
  editField: () => void;
  clearAll: () => void;
}

const RealmConfirmedSection: React.FC<RealmConfirmedSectionProps> = ({
  doraBoss,
  doraBossConfirmed,
  doraIndicators,
  doraIndicatorsConfirmed,
  isRealmEachTile,
  wall,
  wallConfirmed,
  editField,
  clearAll,
}) => {
  if (!doraBossConfirmed) return;
  
  return (
    <section className={styles.confirmed_section}>
      <div style={{position: "relative"}}>
        <ClearButton onClick={clearAll} />
        {
          wallConfirmed && <EditButton onClick={editField} />
        }
        <div className={styles.area_title}>
          <span style={{position: "absolute"}}>
            <DynamicSVGText text={"場"} />
          </span>
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
