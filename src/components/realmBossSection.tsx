import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/realm-plus.module.css";
import { REALM_BOSSES, RealmEditPhase, RealmPhase } from "../types/simulation";
import { DORA_BOSS_DESCRIPTIONS } from "../constants/strings";
import { RealmProgressState } from "../hooks/useRealmProgressState";
import { RealmBossState } from "../hooks/useRealmBossState";

interface RealmBossSectionProps {
  progressState: RealmProgressState;
  bossState: RealmBossState;
}

const RealmBossSection: React.FC<RealmBossSectionProps> = ({ progressState, bossState }) => {
  const { simulationProgress, editProgress } = progressState;
  
  const showBossSection = (!editProgress.isEditing && simulationProgress.phase === RealmPhase.Boss)
    || (editProgress.isEditing && editProgress.phase === RealmEditPhase.Boss);
  if (!showBossSection) return;
  
  const { boss, setBoss, confirmBoss } = bossState;
  
  const confirmButtonText = editProgress.isEditing ? "修正" : "決定";
  return (
    <section className={`${styles.dora_boss_section} ${editProgress.isEditing && styles.editing}`}>
      <div style={{position: "relative"}}>
        {
          editProgress.isEditing && 
          <div className={styles.editingTextWrapper}>
            <DynamicSVGText text={"修正中"} />  
          </div>
        }
        <div className={styles.area_title}>
          <DynamicSVGText text={"ステージ効果"} />
        </div>
        <div className={`${styles.area} ${styles.dora_boss}`}>
          <img
            className={styles.dora_boss_image}
            src={`/boss/${boss}.png`}
            onClick={() => setBoss("empty")}
            alt={boss}
          />
          <DynamicSVGText text={DORA_BOSS_DESCRIPTIONS[boss]} />
        </div>
      </div>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"ステージ効果選択"} />
        </div>
        <div className={`${styles.area} ${styles.dora_boss_choices}`}>
          {REALM_BOSSES.map(boss => (
            boss === "empty" ? null
            : <img
              key={`boss_choice_${boss}`}
              className={styles.dora_boss_image}
              src={`/boss/${boss}.png`}
              onClick={() => setBoss(boss)}
              alt={boss}
            />
          ))}
        </div>
      </div>
      <div style={{ display: "flex" }}>
        <button
          style={{
            marginLeft: "auto",
            visibility: boss === "empty" ? "hidden" : "visible",
          }}
          onClick={confirmBoss}
        >
          <DynamicSVGText text={confirmButtonText} height="1.2em" />
        </button>
      </div>
    </section>
  );
};

export default RealmBossSection;
