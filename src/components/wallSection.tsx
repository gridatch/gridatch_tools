import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/manman.module.css";

interface WallProps {
  wall: string[];
  addTileToWall: (tile: string) => void;
  removeTileFromWallAtIndex: (index: number) => void;
  maxWall: number;
}

const WallSection: React.FC<WallProps> = ({ wall, addTileToWall, removeTileFromWallAtIndex, maxWall }) => {
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
                onClick={() => removeTileFromWallAtIndex(i)}
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
                onClick={() => addTileToWall(tile)}
                alt={tile}
              />
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default WallSection;
