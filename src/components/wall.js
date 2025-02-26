import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/manman.module.css";

const Wall = ({ wall, addWall, removeWall, maxWall }) => {
  return (
    <section className={styles.wall_section}>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"牌山"} />
        </div>
        <div id="wall" className={`${styles.area} ${styles.wall}`}>
          {Array.from({ length: maxWall }, (_, i) =>
            i < wall.length ? (
              <img
                key={`wall_${i}`}
                className={styles.wall_tile}
                src={`/tiles/${wall[i]}.png`}
                onClick={() => removeWall(i)}
                alt={wall[i]}
              />
            ) : (
              <img
                key={`wall_${i}`}
                className={styles.wall_tile}
                src={`/tiles/empty.png`}
                alt="empty"
              />
            )
          )}
        </div>
      </div>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"牌選択ボタン"} />
        </div>
        <div id="wall_choices" className={`${styles.area} ${styles.tile_choices}`}>
          {Array.from({ length: 9 }, (_, i) => {
            const tile = `${i + 1}s`;
            return (
              <img
                key={`wall_choice_${i}`}
                className={styles.tile_choice}
                src={`/tiles/${tile}.png`}
                onClick={() => addWall(tile)}
                alt={tile}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Wall;
