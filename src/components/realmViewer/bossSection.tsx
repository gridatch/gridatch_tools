import React from "react";
import DynamicSVGText from "../dynamicSVGText";
import styles from "../../pages/realm.module.css";
import { REALM_BOSSES, RealmBoss } from "../../types/simulation";
import { REALM_BOSS_DESCRIPTIONS } from "../../constants/strings";

interface RealmViewerBossSectionProps {
  boss: RealmBoss;
  setBoss: (boss: RealmBoss) => void;
}

const RealmViewerBossSection: React.FC<RealmViewerBossSectionProps> = ({ boss, setBoss }) => {
  return (
    <section className={styles.dora_boss_section}>
      <div>
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
          <DynamicSVGText text={REALM_BOSS_DESCRIPTIONS[boss]} />
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
    </section>
  );
};

export default RealmViewerBossSection;
