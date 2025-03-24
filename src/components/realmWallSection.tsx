import React, { Dispatch, SetStateAction } from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/realm-plus.module.css";
import { PINZU_TILES, SOZU_TILES, NON_SEQUENTIAL_TILES, WallTile, SanmaTile, SANMA_TILES } from "../types/simulation";
import DynamicSVGTextSequence from "./dynamicSVGTextSequence";

interface RealmWallSectionProps {
  isEditing: boolean;
  setIsEditing: Dispatch<SetStateAction<boolean>>;
  wall: WallTile[];
  isRealmEachTile: Record<SanmaTile, boolean>;
  remainingTiles: Record<SanmaTile, number>;
  addTileToWall: (tile: WallTile) => void;
  removeTileFromWallAtIndex: (index: number) => void;
  doraIndicatorsConfirmed: boolean;
  wallConfirmed: boolean;
  setWallConfirmed: Dispatch<SetStateAction<boolean>>;
}

const RealmWallSection: React.FC<RealmWallSectionProps> = ({
  isEditing,
  setIsEditing,
  wall,
  isRealmEachTile,
  remainingTiles,
  addTileToWall,
  removeTileFromWallAtIndex,
  doraIndicatorsConfirmed,
  wallConfirmed,
  setWallConfirmed,
}) => {
  if (!doraIndicatorsConfirmed) return;
  if (wallConfirmed) return;
  
  const realmTileTypeCount = SANMA_TILES.filter(tile => isRealmEachTile[tile]).length;
  const remainingRealmTileCount = SANMA_TILES.filter(tile => isRealmEachTile[tile]).reduce((sum, tile) => sum + remainingTiles[tile], 0);
  const remainingTileCount = SANMA_TILES.reduce((sum, tile) => sum + remainingTiles[tile], 0);
  
  const tileGroups: WallTile[][] = [
    [...PINZU_TILES],
    [...SOZU_TILES],
    [...NON_SEQUENTIAL_TILES],
    ["closed"],
  ];
  const confirmButtonText = isEditing ? "修正" : "決定";
  return (
    <section className={`${styles.wall_section} ${isEditing && styles.editing}`}>
      <div style={{position: "relative"}}>
        {
          isEditing && 
          <div className={styles.editingTextWrapper}>
            <DynamicSVGText text={"修正中"} />  
          </div>
        }
        <div className={styles.area_title}>
          <DynamicSVGText text={"牌山"} />
        </div>
        <div className={`${styles.area} ${styles.realm_wall}`}>
          {wall.map((tile, i) => {
            const isNotRealm = tile !== "empty" && tile !== "closed" && !isRealmEachTile[tile];
            return (
              <React.Fragment key={`wall_${i}`}>
                {
                  tile === "empty" ? (
                    <img
                      className={styles.realm_wall_tile}
                      src={`/tiles/empty.png`}
                      alt={"empty"}
                    />
                  ) : (
                    <img
                      className={`${styles.realm_wall_tile} ${isNotRealm && styles.not_realm}`}
                      src={`/tiles/${tile}.png`}
                      onClick={() => removeTileFromWallAtIndex(i)}
                      alt={tile}
                    />
                  )
                }
              </React.Fragment>
            )
          })}
        </div>
      </div>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"牌山選択"} />
          <DynamicSVGTextSequence text={`（ ${realmTileTypeCount}種 ${remainingRealmTileCount}枚 ／ ${remainingTileCount}枚 ）`} />
        </div>
        <div className={`${styles.area} ${styles.realm_wall_tile_choices} ${styles.realm_warn_wrapper}`}>
          { !SOZU_TILES.some(tile => isRealmEachTile[tile]) &&
            <div className={styles.realm_warn}>
              <DynamicSVGText text={"※索子の領域牌がありません！"} />
              <DynamicSVGText text={"※索子の育成は索子多面張で！"} />
            </div>
          }
          {tileGroups.map((group, groupIndex) => (
            <React.Fragment key={`group-${groupIndex}`}>
              {group.map(tile => {
                const isRealm = tile !== "empty" && tile !== "closed" && isRealmEachTile[tile];
                const isNotRealm = tile !== "empty" && tile !== "closed" && !isRealmEachTile[tile];
                const soldOut = tile !== "empty" && tile !== "closed" && remainingTiles[tile] === 0;
                return (
                  <div key={`wall_choice_${tile}`} className={`${styles.tile_counter} ${isRealm && styles.tile_counter_realm}`}>
                    <img
                      className={`${isNotRealm && styles.not_realm} ${soldOut && styles.sold_out}`}
                      src={`/tiles/${tile}.png`}
                      onClick={() => addTileToWall(tile)}
                      alt={tile}
                    />
                    { tile !== "empty" && tile !== "closed" &&
                      <span className={`${styles.tile_counter_text} ${soldOut && styles.sold_out_text}`}>
                        <DynamicSVGText text={"×"} />
                        <DynamicSVGText text={`${remainingTiles[tile]}`} />
                      </span>
                    }
                  </div>
                )
              })}
              {groupIndex < tileGroups.length - 1 && <div style={{ width: "100%" }} />}
            </React.Fragment>
          ))}
          <div style={{ display: "flex" }}>
            <button
              style={{
                marginLeft: "auto",
                visibility: wall.some(tile => tile == "empty") ? "hidden" : "visible",
              }}
              onClick={() => {
                setWallConfirmed(true);
                setIsEditing(false);
              }}
            >
              <DynamicSVGText text={confirmButtonText} height="1.2em" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default RealmWallSection;
