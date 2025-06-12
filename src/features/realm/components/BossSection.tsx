import React from "react";

import { REALM_BOSS_DESCRIPTIONS } from "@shared/constants/strings";
import { REALM_BOSSES, RealmEditPhase, RealmPhase } from "@shared/types/simulation";
import DynamicSVGText from "@shared/ui/DynamicSVGText";

import { BossState } from "../hooks/useBossState";
import { ProgressState } from "../hooks/useProgressState";
import styles from "../pages/RealmPage.module.css";


interface BossSectionProps {
  progressState: ProgressState;
  bossState: BossState;
}

const BossSection: React.FC<BossSectionProps> = ({ progressState, bossState }) => {
  const { simulationProgress, editProgress } = progressState;
  
  const showBossSection = (!editProgress.isEditing && simulationProgress.phase === RealmPhase.Boss)
    || (editProgress.isEditing && editProgress.phase === RealmEditPhase.Boss);
  if (!showBossSection) return;
  
  const { boss, setBoss, confirmBoss } = bossState;
  
  return (
    <section className={`${styles.dora_boss_section} ${editProgress.isEditing && styles.editing}`}>
      <div style={{ position: "relative", display: "flex", flexDirection: "column" }}>
        {
          editProgress.isEditing && 
          <div className={styles.editingTextWrapper}>
            <DynamicSVGText text={"修正中"} />  
          </div>
        }
        <div className={styles.area_title}>
          <DynamicSVGText text={"ステージ効果"} />
        </div>
        <div className={`${styles.area} ${styles.dora_boss}`} onClick={() => setBoss("empty")}>
          <img
            className={styles.dora_boss_image}
            src={`/boss/${boss}.png`}
            alt={boss}
          />
          <DynamicSVGText text={REALM_BOSS_DESCRIPTIONS[boss]} />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div className={styles.area_title}>
          <DynamicSVGText text={"ステージ効果選択"} />
        </div>
        <div className={`${styles.area} ${styles.dora_boss_choices}`}>
          {REALM_BOSSES.map(boss => (
            boss !== "empty" && <div key={`boss_choice_${boss}`} className={styles.dora_boss} onClick={() => setBoss(boss)}>
              <img
                className={styles.dora_boss_image}
                src={`/boss/${boss}.png`}
                alt={boss}
              />
              <DynamicSVGText text={REALM_BOSS_DESCRIPTIONS[boss]} />
            </div>
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
          <DynamicSVGText text="決定" height="1.2em" />
        </button>
      </div>
    </section>
  );
};

export default BossSection;
