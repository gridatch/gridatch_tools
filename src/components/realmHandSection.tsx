import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/realm-plus.module.css";
import { PINZU_TILES, SOZU_TILES, NON_SEQUENTIAL_TILES, SanmaTile, HandState, SANMA_TILES } from "../types/simulation";
import DynamicSVGTextSequence from "./dynamicSVGTextSequence";

interface RealmHandSectionProps {
  wallConfirmed: boolean;
  isRealmEachTile: Record<SanmaTile, boolean>;
  remainingTiles: Record<SanmaTile, number>;
  isDrawPhase: boolean;
  handState: HandState;
  maxHand: number;
  firstDrawTurnByTiles: Record<SanmaTile, number>;
  draw: (tile: SanmaTile) => void;
  cancelDraw: (tile: SanmaTile, index: number) => void;
  confirmDraw: () => void;
  toggleDiscard: (tile: SanmaTile, index: number) => void;
  confirmDiscard: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
}

const RealmHandSection: React.FC<RealmHandSectionProps> = ({
  wallConfirmed,
  isRealmEachTile,
  remainingTiles,
  isDrawPhase,
  handState,
  maxHand,
  firstDrawTurnByTiles,
  draw,
  cancelDraw,
  confirmDraw,
  toggleDiscard,
  confirmDiscard,
  canUndo,
  canRedo,
  undo,
  redo,
}) => {
  if (!wallConfirmed) return;
  const handTileCount = Object.values(handState).reduce((acc, arr) => acc + arr.length, 0);
  
  const realmTileTypeCount = SANMA_TILES.filter(tile => isRealmEachTile[tile]).length;
  const remainingRealmTileCount = SANMA_TILES.filter(tile => isRealmEachTile[tile]).reduce((sum, tile) => sum + remainingTiles[tile], 0);
  const remainingTileCount = SANMA_TILES.reduce((sum, tile) => sum + remainingTiles[tile], 0);
  
  const tileGroups: SanmaTile[][] = [
    [...PINZU_TILES],
    [...SOZU_TILES],
    [...NON_SEQUENTIAL_TILES],
  ];
  const confirmButtonVisible = isDrawPhase
    ? handTileCount === maxHand
    : SANMA_TILES.some(tile => handState[tile].includes("pending"));
  
  return (
    <section className={styles.hand_section}>
      <div>
        <div className={styles.area_title} style={{ display: "flex", flexDirection: "row", alignItems: "center" }}>
          <DynamicSVGText text={"手牌"} />
          <DynamicSVGText text={isDrawPhase ? "（ツモ牌選択中）" : "（捨て牌選択中）"} />
          <button onClick={undo} disabled={!canUndo} >
            <DynamicSVGText text="1手戻す" height="1.1em" />
          </button>
          <button onClick={redo} disabled={!canRedo} >
            <DynamicSVGText text="1手進む" height="1.1em" />
          </button>
        </div>
        <div className={`${styles.area} ${styles.hand}`}>
          {SANMA_TILES.map((tile) => (
            handState[tile].map((tileExchengeStatus, i) => {
              const isPending = tileExchengeStatus === "pending";
              const isNotRealm = !isRealmEachTile[tile];
              const isInWall = firstDrawTurnByTiles[tile] !== -1;
              return (
                <div key={`hand_${tile}_${i}`} className={styles.hand_tile_counter}>
                  <img
                    className={`${isPending && styles.hand_tile_pending} ${isNotRealm && styles.not_realm}`}
                    src={`/tiles/${tile}.png`}
                    onClick={() => isDrawPhase ? cancelDraw(tile, i) : toggleDiscard(tile, i)}
                    alt={tile}
                  />
                  <span className={styles.hand_tile_counter_text}>
                    <span style={{ visibility: isInWall ? "visible" : "hidden", marginBottom: "-0.5em", fontSize: "var(--font-sx)" }}>
                      <DynamicSVGTextSequence text={`${firstDrawTurnByTiles[tile]}`} className={styles.tile_counter_text_negative_margin_right} />
                      <DynamicSVGText text="巡" />
                    </span>
                    <span>
                      <DynamicSVGText text={"×"} />
                      <DynamicSVGText text={`${remainingTiles[tile]}`} />
                    </span>
                  </span>
                  {
                    isPending && <div className={styles.hand_tile_pending_icon_wrapper}>
                      {
                        isDrawPhase
                          ? <DynamicSVGText text="+" className={`${styles.hand_tile_pending_icon} ${styles.hand_tile_pending_icon_draw}`} />
                          : <DynamicSVGText text="-" className={`${styles.hand_tile_pending_icon} ${styles.hand_tile_pending_icon_discard}`} />
                      }
                    </div>
                  }
                </div>
              )
            })
          ))}
          {Array.from({ length: maxHand - handTileCount }).map((_, i) => (
            <div key={`hand_empty_${i}`} className={styles.hand_tile_counter}>
              <img
                src={`/tiles/empty.png`}
                alt="empty"
              />
            </div>
          ))}
        </div>
        <div className={styles.under_hand_line} />
        <span className={styles.result_tile_counter_text_spacing} >
          <span style={{ marginBottom: "-0.5em", display: "flex", fontSize: "var(--font-sx)" }}>
            <DynamicSVGText text="×" />
          </span>
          <span >
            <DynamicSVGText text="×" />
          </span>
        </span>
      </div>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={isDrawPhase ? "ツモ牌選択" : "領域牌表示"} />
          <DynamicSVGTextSequence text={`（ ${realmTileTypeCount}種 ${remainingRealmTileCount}枚 ／ ${remainingTileCount}枚 ）`} />
        </div>
        <div className={`${styles.area} ${styles.draw_choices}`}>
          {tileGroups.map((group, groupIndex) => (
            <React.Fragment key={`group_${groupIndex}`}>
              {group.map(tile => {
                const isRealm = isRealmEachTile[tile];
                const isNotRealm = !isRealmEachTile[tile];
                const soldOut = remainingTiles[tile] === 0;
                return (
                  <div key={`hand_choice_${tile}`} className={`${styles.tile_counter} ${isRealm && styles.tile_counter_realm}`}>
                    <img
                      className={`${styles.tile_counter_image} ${isNotRealm && styles.not_realm} ${soldOut && styles.sold_out}`}
                      src={`/tiles/${tile}.png`}
                      onClick={() => draw(tile)}
                      alt={tile}
                    />
                    <span className={`${styles.tile_counter_text} ${soldOut && styles.sold_out_text}`}>
                      <DynamicSVGText text={"×"} />
                      <DynamicSVGText text={`${remainingTiles[tile]}`} />
                    </span>
                  </div>
                )
              })}
              {groupIndex < tileGroups.length - 1 && <div style={{ width: "100%" }} />}
            </React.Fragment>
          ))}
        </div>
      </div>
      <div className={styles.toggle_phase_button_wrapper_landscape}>
        <button
          style={{
            marginLeft: "auto",
            visibility: confirmButtonVisible ? "visible" : "hidden",
          }}
          onClick={isDrawPhase ? confirmDraw : confirmDiscard}
        >
          <DynamicSVGText text={isDrawPhase ? "ツモ牌決定" : "捨て牌決定"} height="1.2em" />
        </button>
      </div>
      <div className={styles.toggle_phase_button_wrapper_portrait_relative}>
        <div className={styles.toggle_phase_button_wrapper_portrait_absolute}>
          <div className={styles.toggle_phase_button_portrait_background} >
            <button
              style={{
                marginLeft: "auto",
                visibility: confirmButtonVisible ? "visible" : "hidden",
              }}
              onClick={isDrawPhase ? confirmDraw : confirmDiscard}
            >
              <DynamicSVGText text={isDrawPhase ? "ツモ牌決定" : "捨て牌決定"} height="1.2em" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RealmHandSection;
