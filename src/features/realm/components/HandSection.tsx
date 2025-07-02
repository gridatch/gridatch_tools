import React from 'react';

import { NON_SEQUENTIAL_TILES, PINZU_TILES, SANMA_TILES, SOZU_TILES, RealmPhase, RealmPhaseAction, SanmaTile } from '@shared/types/simulation';
import DynamicSVGText from '@shared/ui/DynamicSVGText';
import DynamicSVGTextSequence from '@shared/ui/DynamicSVGTextSequence';

import { HandActions } from '../hooks/useHandActions';
import { HandState } from '../hooks/useHandState';
import { ProgressState } from '../hooks/useProgressState';
import { RemainingTilesLogic } from '../hooks/useRemainingTilesLogic';
import styles from '../pages/RealmPage.module.css';

interface HandSectionProps {
  progressState: ProgressState;
  handState: HandState;
  handAction: HandActions;
  isRealmEachTile: Record<SanmaTile, boolean>;
  remainingTilesLogic: RemainingTilesLogic;
  firstDrawTurnByTiles: Record<SanmaTile, number>;
}

const HandSection: React.FC<HandSectionProps> = ({
  progressState,
  handState,
  handAction,
  isRealmEachTile,
  remainingTilesLogic,
  firstDrawTurnByTiles,
}) => {
  const { simulationProgress, editProgress } = progressState;
  const { remainingTiles, totalRealmRemainingCount, totalRemainingCount } = remainingTilesLogic;

  if (simulationProgress.phase <= RealmPhase.Wall) return;
  if (editProgress.isEditing) return;

  const realmTileTypeCount = SANMA_TILES.filter(tile => isRealmEachTile[tile]).length;

  const tileGroups: SanmaTile[][] = [
    [...PINZU_TILES],
    [...SOZU_TILES],
    [...NON_SEQUENTIAL_TILES],
  ];

  return (
    <section className={styles.hand_section}>
      <div>
        <div className={styles.area_title} style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
          <DynamicSVGText text="手牌" />
          <DynamicSVGText text={simulationProgress.action === RealmPhaseAction.Draw ? '（ツモ牌選択中）' : '（捨て牌選択中）'} />
          <button onClick={handState.undo} disabled={!handState.canUndo}>
            <DynamicSVGText text="1手戻す" height="1.1em" />
          </button>
          <button onClick={handState.redo} disabled={!handState.canRedo}>
            <DynamicSVGText text="1手進む" height="1.1em" />
          </button>
        </div>
        <div className={`${styles.area} ${styles.hand}`}>
          {SANMA_TILES.map(tile => (
            handState.hand.closed[tile].map((status, i) => {
              const isSelected = status.isSelected;
              const isRealm = isRealmEachTile[tile];
              const isNotRealm = !isRealmEachTile[tile];
              const isInWall = firstDrawTurnByTiles[tile] !== -1;
              return (
                <div key={`hand_${tile}_${i}`} className={styles.hand_tile_counter}>
                  <img
                    className={`${isSelected && styles.hand_tile_selected} ${isNotRealm && styles.not_realm}`}
                    src={`/tiles/${tile}.png`}
                    onClick={() => simulationProgress.action === RealmPhaseAction.Draw
                      ? handAction.cancelDraw(tile, i)
                      : handAction.toggleDiscard(tile, i)}
                    alt={tile}
                  />
                  <span className={styles.hand_tile_counter_text}>
                    <span style={{
                      visibility: isRealm && isInWall ? 'visible' : 'hidden',
                      fontSize: 'var(--font-sx)',
                      display: 'flex',
                      alignItems: 'flex-end',
                    }}
                    >
                      <DynamicSVGTextSequence text={`${firstDrawTurnByTiles[tile]}`} className={styles.tile_counter_text_negative_margin_right} />
                      <DynamicSVGText text="巡" style={{ fontSize: 'var(--font-xxs)' }} />
                    </span>
                    <span style={{ visibility: isRealm ? 'visible' : 'hidden', display: 'flex' }}>
                      <DynamicSVGText text="×" />
                      <DynamicSVGText text={`${remainingTiles[tile]}`} />
                    </span>
                  </span>
                  {
                    isSelected && (
                      <div className={styles.hand_tile_selected_icon_wrapper}>
                        {
                          simulationProgress.action === RealmPhaseAction.Draw
                            ? <DynamicSVGText text="+" className={`${styles.hand_tile_selected_icon} ${styles.hand_tile_selected_icon_draw}`} />
                            : <DynamicSVGText text="-" className={`${styles.hand_tile_selected_icon} ${styles.hand_tile_selected_icon_discard}`} />
                        }
                      </div>
                    )
                  }
                </div>
              );
            })
          ))}
          {Array.from({ length: handState.maxHand - handState.handTileCount }).map((_, i) => (
            <div key={`hand_empty_${i}`} className={styles.hand_tile_counter}>
              <img
                src="/tiles/empty.png"
                alt="empty"
              />
            </div>
          ))}
          {
            (() => {
              if (simulationProgress.phase < RealmPhase.Main) return;
              // メインフェーズのツモ牌
              const tile = handState.hand.drawn.tile;
              const isSelected = handState.hand.drawn.isSelected;
              const isRealm = tile !== 'empty' && tile !== 'closed' && isRealmEachTile[tile];
              const isNotRealm = tile !== 'empty' && tile !== 'closed' && !isRealmEachTile[tile];
              const isInWall = tile !== 'empty' && tile !== 'closed' && firstDrawTurnByTiles[tile] !== -1;
              return (
                <div className={styles.hand_tile_counter} style={{ marginLeft: '2%' }}>
                  <img
                    className={`${isSelected && styles.hand_tile_selected} ${isNotRealm && styles.not_realm}`}
                    src={`/tiles/${tile}.png`}
                    onClick={() => tile !== 'empty' && tile !== 'closed'
                      && (simulationProgress.action === RealmPhaseAction.Draw
                        ? handAction.cancelDraw(tile, -1)
                        : handAction.toggleDiscard(tile, -1))}
                    alt={tile}
                  />
                  <span className={styles.hand_tile_counter_text}>
                    <span style={{
                      visibility: isRealm && isInWall ? 'visible' : 'hidden',
                      fontSize: 'var(--font-sx)',
                      display: 'flex',
                      alignItems: 'flex-end',
                    }}
                    >
                      <DynamicSVGTextSequence
                        text={`${isInWall ? firstDrawTurnByTiles[tile] : ''}`}
                        className={styles.tile_counter_text_negative_margin_right}
                      />
                      <DynamicSVGText text="巡" style={{ fontSize: 'var(--font-xxs)' }} />
                    </span>
                    <span style={{
                      visibility: isRealm ? 'visible' : 'hidden',
                    }}
                    >
                      <DynamicSVGText text="×" />
                      <DynamicSVGText text={`${(tile !== 'empty' && tile !== 'closed') ? remainingTiles[tile] : ''}`} />
                    </span>
                  </span>
                  {
                    isSelected && (
                      <div className={styles.hand_tile_selected_icon_wrapper}>
                        {
                          simulationProgress.action === RealmPhaseAction.Draw
                            ? <DynamicSVGText text="+" className={`${styles.hand_tile_selected_icon} ${styles.hand_tile_selected_icon_draw}`} />
                            : <DynamicSVGText text="-" className={`${styles.hand_tile_selected_icon} ${styles.hand_tile_selected_icon_discard}`} />
                        }
                      </div>
                    )
                  }
                </div>
              );
            })()
          }
        </div>
        <div className={styles.under_hand_line} />
        <span className={styles.result_tile_counter_text_spacing}>
          <span style={{ marginBottom: '-0.5em', display: 'flex', fontSize: 'var(--font-sx)' }}>
            <DynamicSVGText text="×" />
          </span>
          <span>
            <DynamicSVGText text="×" />
          </span>
        </span>
      </div>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={simulationProgress.action === RealmPhaseAction.Draw ? 'ツモ牌選択' : '領域牌表示'} />
          <DynamicSVGTextSequence text={`（ ${realmTileTypeCount}種 ${totalRealmRemainingCount}枚 ／ ${totalRemainingCount}枚 ）`} />
        </div>
        <div className={`${styles.area} ${styles.draw_choices}`}>
          {tileGroups.map((group, groupIndex) => (
            <React.Fragment key={`group_${groupIndex}`}>
              {group.map(tile => {
                const isRealm = isRealmEachTile[tile];
                const isNotRealm = !isRealmEachTile[tile];
                const soldOut = remainingTiles[tile] <= 0;
                return (
                  <div key={`hand_choice_${tile}`} className={`${styles.tile_counter} ${isRealm && styles.tile_counter_realm}`}>
                    <img
                      className={`${styles.tile_counter_image} ${isNotRealm && styles.not_realm} ${soldOut && styles.sold_out}`}
                      src={`/tiles/${tile}.png`}
                      onClick={() => handAction.draw(tile)}
                      alt={tile}
                    />
                    <span className={`${styles.tile_counter_text} ${soldOut && styles.sold_out_text}`}>
                      <DynamicSVGText text="×" />
                      <DynamicSVGText text={`${remainingTiles[tile]}`} />
                    </span>
                  </div>
                );
              })}
              {groupIndex < tileGroups.length - 1 && <div style={{ width: '100%' }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className={styles.toggle_phase_button_wrapper_landscape}>
        <button
          style={{
            marginLeft: 'auto',
            visibility: handAction.canConfirmExchangePhase ? 'visible' : 'hidden',
          }}
          onClick={handAction.confirmExchangePhase}
        >
          <DynamicSVGText text="入替終了" height="1.2em" />
        </button>
        <button
          style={{
            marginLeft: 'auto',
            visibility: handAction.canConfirmAction ? 'visible' : 'hidden',
          }}
          onClick={simulationProgress.action === RealmPhaseAction.Draw
            ? handAction.confirmDraw
            : handAction.confirmDiscard}
        >
          <DynamicSVGText text={simulationProgress.action === RealmPhaseAction.Draw ? 'ツモ牌決定' : '捨て牌決定'} height="1.2em" />
        </button>
      </div>
      <div className={styles.toggle_phase_button_wrapper_portrait_relative}>
        <div className={styles.toggle_phase_button_wrapper_portrait_absolute}>
          <div className={styles.toggle_phase_button_portrait_background}>
            <button
              style={{
                marginLeft: 'auto',
                visibility: handAction.canConfirmExchangePhase ? 'visible' : 'hidden',
              }}
              onClick={handAction.confirmExchangePhase}
            >
              <DynamicSVGText text="入替終了" height="1.2em" />
            </button>
            <button
              style={{
                marginLeft: 'auto',
                visibility: handAction.canConfirmAction ? 'visible' : 'hidden',
              }}
              onClick={simulationProgress.action === RealmPhaseAction.Draw
                ? handAction.confirmDraw
                : handAction.confirmDiscard}
            >
              <DynamicSVGText text={simulationProgress.action === RealmPhaseAction.Draw ? 'ツモ牌決定' : '捨て牌決定'} height="1.2em" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HandSection;
