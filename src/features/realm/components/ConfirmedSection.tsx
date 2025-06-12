import React from "react";

import { RealmBoss, RealmEditPhase, RealmPhase, SanmaTile } from "@shared/types/simulation";
import ClearButton from "@shared/ui/ClearButton";
import DynamicSVGText from "@shared/ui/DynamicSVGText";
import EditButton from "@shared/ui/EditButton";

import { ProgressState } from "../hooks/useProgressState";
import { WallState } from "../hooks/useWallState";
import styles from "../pages/RealmPage.module.css";

interface ConfirmedSectionProps {
  progressState: ProgressState;
  boss: RealmBoss;
  doraIndicators: SanmaTile[];
  isRealmEachTile: Record<SanmaTile, boolean>;
  wallState: WallState;
  clearAll: () => void;
}

const ConfirmedSection: React.FC<ConfirmedSectionProps> = ({
  progressState,
  boss,
  doraIndicators,
  isRealmEachTile,
  wallState,
  clearAll,
}) => {
  const { simulationProgress, editProgress } = progressState;
  const { wall, usableWallCount } = wallState;
  
  const isBossConfirmed = (!editProgress.isEditing && simulationProgress.phase > RealmPhase.Boss)
    || (editProgress.isEditing && editProgress.phase > RealmEditPhase.Boss);
  const isDoraIndicatorsConfirmed = (!editProgress.isEditing && simulationProgress.phase > RealmPhase.DoraIndicators)
    || (editProgress.isEditing && editProgress.phase > RealmEditPhase.DoraIndicators);
  const isWallConfirmed = !editProgress.isEditing && simulationProgress.phase > RealmPhase.Wall;
  
  if (!isBossConfirmed) return;
  
  return (
    <section className={styles.confirmed_section}>
      <div style={{position: "relative"}}>
        <ClearButton onClick={clearAll} style={{ marginTop: "-5px" }} />
        {
          isWallConfirmed && <EditButton onClick={progressState.enterEditMode} />
        }
        <div className={styles.area_title}>
          <span style={{position: "absolute"}}>
            <DynamicSVGText text={"場"} />
          </span>
        </div>
        <div className={`${styles.area} ${styles.confirmed_dora}`}>
          <img
            className={styles.dora_boss_image}
            src={`/boss/${boss}.png`}
            alt={boss}
          />
          <div className={styles.confirmed_dora_indicators}>
            {
              isDoraIndicatorsConfirmed && doraIndicators.map((tile, i) => (
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
          <div className={styles.lock_container}>
            {
              isWallConfirmed && Array.from({ length: 4 }).map((_, i) => {
                const rowUsableCount = Math.min(9, usableWallCount - 9 * i);
                const rowUsablePercentage = rowUsableCount / 9 * 100;
                const visibility = rowUsableCount < 9 ? "visible" : "hidden";
                return (
                  <img
                    key={`lock_${i}`}
                    className={styles.lock_effect}
                    style={{ visibility, clipPath: `inset(0 0 0 ${rowUsablePercentage}%)` }}
                    src="/effects/lock.png"
                    alt="lock"
                  />
                );
              })
            }
            
          </div>
          {
            isWallConfirmed && wall.map((tile, i) => {
              const isNotRealm = wall[i] !== "empty" && wall[i] !== "closed" && !isRealmEachTile[wall[i]];
              const visible = i > simulationProgress.turn - 1;
              const isLocked = i >= usableWallCount;
              return (
                <React.Fragment key={`wall_${i}`}>
                  {
                    wall[i] !== "empty" && (
                      <img
                        className={`${styles.confirmed_wall_tile} ${isNotRealm && styles.not_realm} ${isLocked && styles.locked}`}
                        style={{ visibility: visible ? "visible" : "hidden" }}
                        src={`/tiles/${tile}.png`}
                        alt={tile}
                      />
                    )
                  }
                </React.Fragment>
              )
            })
          }
        </div>
      </div>
    </section>
  );
};

export default ConfirmedSection;
