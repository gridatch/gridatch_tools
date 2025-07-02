import React from 'react';

import { SOZU_TILES, Sozu } from '@shared/types/simulation';
import DynamicSVGText from '@shared/ui/DynamicSVGText';

import styles from '../styles/wait.module.css';

interface SozuWallSectionProps {
  wall: string[];
  maxWall: number;
  addTileToWall: (tile: Sozu) => void;
  removeTileFromWallAtIndex: (index: number) => void;
}

const SozuWallSection: React.FC<SozuWallSectionProps> = ({
  wall,
  maxWall,
  addTileToWall,
  removeTileFromWallAtIndex,
}) => {
  return (
    <section className={styles.wall_section}>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text="牌山" />
        </div>
        <div id="wall" className={`${styles.area} ${styles.wall}`}>
          {Array.from({ length: maxWall }, (_, i) =>
            i < wall.length
              ? (
                  <img
                    key={`wall_${i}`}
                    className={styles.wall_tile}
                    src={`/tiles/${wall[i]}.png`}
                    onClick={() => removeTileFromWallAtIndex(i)}
                    alt={wall[i]}
                  />
                )
              : (
                  <img
                    key={`wall_${i}`}
                    className={styles.wall_tile}
                    src="/tiles/empty.png"
                    alt="empty"
                  />
                ))}
        </div>
      </div>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text="牌選択ボタン" />
        </div>
        <div id="wall_choices" className={`${styles.area} ${styles.tile_choices}`}>
          {SOZU_TILES.map(tile => (
            <img
              key={`wall_choice_${tile}`}
              className={styles.tile_choice}
              src={`/tiles/${tile}.png`}
              onClick={() => addTileToWall(tile)}
              alt={tile}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default SozuWallSection;
