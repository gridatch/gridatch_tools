import React from "react";
import DynamicSVGText from "../dynamicSVGText";
import styles from "../../pages/realm-plus.module.css";
import { RealmBoss, RealmEditPhase, RealmPhase, SanmaTile, WallTile } from "../../types/simulation";
import ClearButton from "../clearButton";
import EditButton from "../editButton";
import { RealmProgressState } from "../../hooks/realm/useRealmProgressState";

interface RealmConfirmedSectionProps {
  progressState: RealmProgressState;
  boss: RealmBoss;
  doraIndicators: SanmaTile[];
  isRealmEachTile: Record<SanmaTile, boolean>;
  wall: WallTile[];
  clearAll: () => void;
}

const RealmConfirmedSection: React.FC<RealmConfirmedSectionProps> = ({
  progressState,
  boss,
  doraIndicators,
  isRealmEachTile,
  wall,
  clearAll,
}) => {
  const { simulationProgress, editProgress } = progressState;
  
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
          {
            isWallConfirmed && wall.map((tile, i) => {
              const isNotRealm = wall[i] !== "empty" && wall[i] !== "closed" && !isRealmEachTile[wall[i]];
              const visible = i > simulationProgress.turn - 1;
              return (
                <React.Fragment key={`wall_${i}`}>
                  {
                    wall[i] !== "empty" && (
                      <img
                        className={`${styles.confirmed_wall_tile} ${isNotRealm && styles.not_realm}`}
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

export default RealmConfirmedSection;
