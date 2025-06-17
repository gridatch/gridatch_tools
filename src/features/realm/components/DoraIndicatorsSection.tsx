import React from 'react';

import { SanmaTile, PINZU_TILES, SOZU_TILES, NON_SEQUENTIAL_TILES, RealmPhase, RealmEditPhase } from '@shared/types/simulation';
import DynamicSVGText from '@shared/ui/DynamicSVGText';

import { DoraIndicatorsState } from '../hooks/useDoraIndicatorsState';
import { ProgressState } from '../hooks/useProgressState';
import styles from '../pages/RealmPage.module.css';

interface DoraIndicatorsSectionProps {
  progressState: ProgressState;
  doraIndicatorsState: DoraIndicatorsState;
  remainingTiles: Record<SanmaTile, number>;
}

const DoraIndicatorsSection: React.FC<DoraIndicatorsSectionProps> = ({
  progressState,
  doraIndicatorsState,
  remainingTiles,
}) => {
  const { simulationProgress, editProgress } = progressState;

  const showDoraIndicatorsSection = (!editProgress.isEditing && simulationProgress.phase === RealmPhase.DoraIndicators)
    || (editProgress.isEditing && editProgress.phase === RealmEditPhase.DoraIndicators);
  if (!showDoraIndicatorsSection) return;

  const {
    doraIndicators,
    maxDoraIndicators,
    addDoraIndicator,
    removeDoraIndicatorAtIndex,
    confirmDoraIndicators,
  } = doraIndicatorsState;

  const tileGroups: SanmaTile[][] = [
    [...PINZU_TILES],
    [...SOZU_TILES],
    [...NON_SEQUENTIAL_TILES],
  ];
  return (
    <section className={`${styles.dora_indicators_section} ${editProgress.isEditing && styles.editing}`}>
      <div style={{ position: 'relative' }}>
        {
          editProgress.isEditing
          && (
            <div className={styles.editingTextWrapper}>
              <DynamicSVGText text="修正中" />
            </div>
          )
        }
        <div className={styles.area_title}>
          <DynamicSVGText text="ドラ表示牌" />
        </div>
        <div className={`${styles.area} ${styles.dora_indicators}`}>
          {Array.from({ length: maxDoraIndicators }, (_, i) =>
            i < doraIndicators.length
              ? (
                  <img
                    key={`dora_indicator_${i}`}
                    className={styles.dora_indicator}
                    src={`/tiles/${doraIndicators[i]}.png`}
                    onClick={() => removeDoraIndicatorAtIndex(i)}
                    alt={doraIndicators[i]}
                  />
                )
              : (
                  <img
                    key={`dora_indicator_${i}`}
                    className={styles.dora_indicator}
                    src="/tiles/empty.png"
                    alt="empty"
                  />
                ),
          )}
        </div>
      </div>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text="ドラ表示牌選択" />
        </div>
        <div className={`${styles.area} ${styles.dora_indicator_choices}`}>
          {tileGroups.map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              {group.map(tile => (
                <div key={`dora_indicator_choice_${tile}`} className={styles.tile_counter}>
                  <img
                    className={styles.tile_counter_image}
                    src={`/tiles/${tile}.png`}
                    onClick={() => addDoraIndicator(tile)}
                    alt={tile}
                  />
                  <span className={styles.tile_counter_text}>
                    <DynamicSVGText text="×" />
                    <DynamicSVGText text={`${remainingTiles[tile]}`} />
                  </span>
                </div>
              ))}
              {groupIndex < tileGroups.length - 1 && <div style={{ width: '100%' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex' }}>
        <button
          style={{
            marginLeft: 'auto',
            visibility: doraIndicators.length === maxDoraIndicators ? 'visible' : 'hidden',
          }}
          onClick={confirmDoraIndicators}
        >
          <DynamicSVGText text="決定" height="1.2em" />
        </button>
      </div>
    </section>
  );
};

export default DoraIndicatorsSection;
