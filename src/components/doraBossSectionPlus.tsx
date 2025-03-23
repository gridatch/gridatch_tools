import React, { Dispatch, SetStateAction } from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/realm-plus.module.css";
import { DORA_BOSSES, DoraBoss } from "../types/simulation";
import { DORA_BOSS_DESCRIPTIONS } from "../constants/strings";

interface DoraBossSectionProps {
  isEditing: boolean;
  doraBoss: DoraBoss;
  setDoraBoss: Dispatch<SetStateAction<DoraBoss>>;
  doraBossConfirmed: boolean;
  setDoraBossConfirmed: Dispatch<SetStateAction<boolean>>;
}

const DoraBossSection: React.FC<DoraBossSectionProps> = ({ isEditing, doraBoss, setDoraBoss, doraBossConfirmed, setDoraBossConfirmed }) => {
  if (doraBossConfirmed) return;
  const confirmButtonText = isEditing ? "修正" : "決定";
  return (
    <section className={`${styles.dora_boss_section} ${isEditing && styles.editing}`}>
      <div style={{position: "relative"}}>
        {
          isEditing && 
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
      <div style={{ display: "flex" }}>
        <button
          style={{
            marginLeft: "auto",
            visibility: doraBoss === "empty" ? "hidden" : "visible",
          }}
          onClick={() => setDoraBossConfirmed(true)}
        >
          <DynamicSVGText text={confirmButtonText} height="1.5em" />
        </button>
      </div>
    </section>
  );
};

export default DoraBossSection;
