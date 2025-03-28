import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/realm.module.css";
import { DORA_BOSSES, DoraBoss } from "../types/simulation";
import { DORA_BOSS_DESCRIPTIONS } from "../constants/strings";

interface DoraBossSectionProps {
  doraBoss: DoraBoss;
  setDoraBoss: (doraBoss: DoraBoss) => void;
}

const DoraBossSection: React.FC<DoraBossSectionProps> = ({ doraBoss, setDoraBoss }) => {
  return (
    <section className={styles.dora_boss_section}>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"ステージ効果"} />
        </div>
        <div className={`${styles.area} ${styles.dora_boss}`}>
          <img
            className={styles.dora_boss_image}
            src={`/boss/${doraBoss}.png`}
            onClick={() => setDoraBoss("empty")}
            alt={doraBoss}
          />
          <DynamicSVGText text={DORA_BOSS_DESCRIPTIONS[doraBoss]} />
        </div>
      </div>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"ステージ効果選択"} />
        </div>
        <div className={`${styles.area} ${styles.dora_boss_choices}`}>
          {DORA_BOSSES.map(boss => (
            boss === "empty" ? null
            : <img
              key={`boss_choice_${boss}`}
              className={styles.dora_boss_image}
              src={`/boss/${boss}.png`}
              onClick={() => setDoraBoss(boss)}
              alt={boss}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default DoraBossSection;
