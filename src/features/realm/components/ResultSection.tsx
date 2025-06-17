import React from 'react';

import { SANMA_TILES, RealmTenpaiResult, SanmaTile, SOZU_TILES } from '@shared/types/simulation';
import DynamicSVGText from '@shared/ui/DynamicSVGText';
import DynamicSVGTextSequence from '@shared/ui/DynamicSVGTextSequence';

import styles from '../pages/RealmPage.module.css';

interface ResultSectionProps {
  isEditing: boolean;
  results: RealmTenpaiResult[] | null;
  drawTurnsByTiles: Record<SanmaTile, number[]>;
}

const ResultSection: React.FC<ResultSectionProps> = ({ isEditing, results, drawTurnsByTiles }) => {
  if (isEditing) return;
  if (!results) return;
  return (
    <section className={styles.realm_result_section}>
      <div className={styles.area_title}>
        <span>
          <DynamicSVGText text="最終形" />
        </span>
      </div>
      <div className={`${styles.area} ${styles.realm_results}`}>
        {
          results.map(result => {
            let typeName = '';
            switch (result.type) {
              case 'standard':
                typeName = '面子手';
                break;
              case 'sevenPairs':
                typeName = '七対子';
                break;
              case 'kokushi':
                typeName = '国士無双';
                break;
            }

            return (
              <React.Fragment key={`result_${result.type}`}>
                <span className={styles.realm_result_text}>
                  <DynamicSVGText text={typeName} />
                  {
                    result.turn === Number.POSITIVE_INFINITY
                      ? <DynamicSVGTextSequence text="：聴牌しません" />
                      : (
                          <>
                            <DynamicSVGTextSequence text={`：${result.turn}`} />
                            <DynamicSVGTextSequence text={`巡目聴牌 `} style={{ fontSize: 'var(--font-sx)' }} />
                            <DynamicSVGTextSequence text={`${result.totalWins.toFixed(1)}`} />
                            <DynamicSVGTextSequence text="和了" style={{ fontSize: 'var(--font-sx)' }} />
                          </>
                        )
                  }
                  {
                    result.totalNonRealmWins > 0
                    && (
                      <>
                        <DynamicSVGText text="（" />
                        {
                          SOZU_TILES
                            .filter(tile => result.nonRealmWinsEachTiles[tile] > 0)
                            .map((tile, i) => (
                              <React.Fragment key={`non_realm_${tile}`}>
                                { i !== 0 && <DynamicSVGText text=" " /> }
                                <img
                                  className={styles.result_non_realm_tile}
                                  src={`/tiles/${tile}.png`}
                                  alt={tile}
                                />
                                <DynamicSVGTextSequence text={`×${result.nonRealmWinsEachTiles[tile].toFixed(1)}`} style={{ fontSize: 'var(--font-sm)' }} />
                              </React.Fragment>
                            ))
                        }
                        <DynamicSVGText text="）" />
                      </>
                    )
                  }
                </span>
                <div className={styles.realm_result_hand}>
                  {
                    SANMA_TILES.map(tile => (
                      Array.from({ length: result.hand[tile] }, (_, i) => {
                        return (
                          <div key={`hand_${tile}_${i}`} className={styles.result_tile_counter}>
                            <img
                              src={`/tiles/${tile}.png`}
                              alt={tile}
                            />
                            <span className={styles.result_tile_counter_text}>
                              {
                                drawTurnsByTiles[tile][i] > 0 && (
                                  <>
                                    <DynamicSVGTextSequence text={`${drawTurnsByTiles[tile][i]}`} className={styles.tile_counter_text_negative_margin_right} />
                                    <DynamicSVGText text="巡" style={{ fontSize: 'var(--font-xxs)' }} />
                                  </>
                                )
                              }
                            </span>
                          </div>
                        );
                      })
                    ))
                  }
                </div>
              </React.Fragment>
            );
          })
        }
      </div>
    </section>
  );
};

export default ResultSection;
