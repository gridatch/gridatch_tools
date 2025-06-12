import React, { useCallback, useEffect, useState } from "react";

import { useDropzone } from "react-dropzone";
import Modal from "react-responsive-modal";

import { useWallDetection } from "@shared/opencv/hooks/useWallDetection";
import { PINZU_TILES, SOZU_TILES, NON_SEQUENTIAL_TILES, WallTile, SanmaTile, SANMA_TILES, RealmPhase, RealmEditPhase } from "@shared/types/simulation";
import DynamicSVGText from "@shared/ui/DynamicSVGText";
import DynamicSVGTextSequence from "@shared/ui/DynamicSVGTextSequence";

import { ProgressState } from "../hooks/useProgressState";
import { RemainingTilesLogic } from "../hooks/useRemainingTilesLogic";
import { WallState } from "../hooks/useWallState";
import styles from "../pages/RealmPage.module.css";




interface WallSectionProps {
  progressState: ProgressState;
  wallState: WallState;
  isRealmEachTile: Record<SanmaTile, boolean>;
  remainingTilesLogic: RemainingTilesLogic;
}

const WallSection: React.FC<WallSectionProps> = ({
  progressState,
  wallState,
  isRealmEachTile,
  remainingTilesLogic,
}) => {
  const wallDetection = useWallDetection(wallState.setWall);
  const [isFailModalOpen, setIsFailModalOpen] = useState(false);
  
  // ドロップ or 選択された画像を処理する共通ハンドラ
  const handleImage = useCallback(async (file: File) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await img.decode();
    const success = wallDetection.detectWall(img);
    if (!success) {
      setIsFailModalOpen(true);
      setTimeout(() => setIsFailModalOpen(false), 3000);
    }
  }, [wallDetection]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      handleImage(acceptedFiles[0]);
    }
  }, [handleImage]);

  // react-dropzone の設定
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [] },
    multiple: false,
    maxFiles: 1,
  });

  // paste イベントで画像を貼り付け
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      for (const item of Array.from(e.clipboardData.items)) {
        if (item.kind === "file" && item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            handleImage(blob);
            e.preventDefault();
            break;
          }
        }
      }
    };
    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [handleImage]);
  
  const { simulationProgress, editProgress } = progressState;
  const { remainingTiles, totalRealmRemainingCount, totalRemainingCount } = remainingTilesLogic;
  
  const showWallSection = (!editProgress.isEditing && simulationProgress.phase === RealmPhase.Wall)
    || (editProgress.isEditing && editProgress.phase === RealmEditPhase.Wall);
  if (!showWallSection) return;
  
  const isWallEmpty = wallState.wall.every(tile => tile === "empty");
  
  const realmTileTypeCount = SANMA_TILES.filter(tile => isRealmEachTile[tile]).length;
  
  const tileGroups: WallTile[][] = [
    [...PINZU_TILES],
    [...SOZU_TILES],
    [...NON_SEQUENTIAL_TILES],
    ["closed"],
  ];
  return (
    <section className={`${styles.wall_section} ${editProgress.isEditing && styles.editing}`}>
      <Modal
        open={isFailModalOpen}
        onClose={() => setIsFailModalOpen(false)}
        center
        showCloseIcon={false}
        styles={{ modal: { padding: "2em", textAlign: "center" } }}
      >
        <p><DynamicSVGTextSequence text="牌山の検出に失敗しました。牌山が中央に映った別の画像をお使いください。" /></p>
      </Modal>
      <div style={{position: "relative"}}>
        {
          editProgress.isEditing && 
          <div className={styles.editingTextWrapper}>
            <DynamicSVGText text={"修正中"} />  
          </div>
        }
        <div className={styles.area_title}>
          <DynamicSVGText text={"牌山"} />
        </div>
        <div className={`${styles.area} ${styles.realm_wall}`} style={{ position: "relative" }}>
          <div
            {...getRootProps()}
            className={styles.wall_dropzone}
            style={{
              backgroundColor: isDragActive ? "rgba(255,255,255,0.3)" : "transparent",
              display: isWallEmpty ? "revert" : "none",
            }}
          >
            <div className={styles.wall_dropzone_description} >
              <div className={styles.wall_dropzone_description_row} >
                <img src="/ui_icons/click.svg" width="20%" />
                <DynamicSVGText text="タッチでファイル選択" />
              </div>
              <div className={styles.wall_dropzone_description_row} >
                <img src="/ui_icons/drag-drop.svg" width="20%" />
                <DynamicSVGText text="ドラッグ & ドロップ" />
              </div>
              <div className={styles.wall_dropzone_description_row} >
                <img src="/ui_icons/keyboard.svg" width="20%" style={{ paddingInline: "2%" }} />
                <DynamicSVGText text="Ctrl + V で貼り付け" />
              </div>
            </div>
            <input {...getInputProps()} />
          </div>
          {wallState.wall.map((tile, i) => {
            const isNotRealm = tile !== "empty" && tile !== "closed" && !isRealmEachTile[tile];
            const isDrawn = i <= simulationProgress.turn - 1;
            return (
              <React.Fragment key={`wall_${i}`}>
                {
                  tile === "empty" ? (
                    <img
                      className={styles.realm_wall_tile}
                      style={{ visibility: !isDrawn ? "visible" : "hidden" }}
                      src={`/tiles/empty.png`}
                      alt={"empty"}
                    />
                  ) : (
                    <img
                      className={`${styles.realm_wall_tile} ${isNotRealm && styles.not_realm}`}
                      style={{ visibility: !isDrawn ? "visible" : "hidden" }}
                      src={`/tiles/${tile}.png`}
                      onClick={() => wallState.removeTileFromWallAtIndex(i)}
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
          <DynamicSVGTextSequence text={`（ ${realmTileTypeCount}種 ${totalRealmRemainingCount}枚 ／ ${totalRemainingCount}枚 ）`} />
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
                const soldOut = tile !== "empty" && tile !== "closed" && remainingTiles[tile] <= 0;
                return (
                  <div key={`wall_choice_${tile}`} className={`${styles.tile_counter} ${isRealm && styles.tile_counter_realm}`}>
                    <img
                      className={`${isNotRealm && styles.not_realm} ${soldOut && styles.sold_out}`}
                      src={`/tiles/${tile}.png`}
                      onClick={() => wallState.addTileToWall(tile)}
                      alt={tile}
                    />
                    { tile !== "empty" && tile !== "closed" &&
                      <span className={`${styles.tile_counter_text} ${soldOut && styles.sold_out_text}`}>
                        <DynamicSVGText text={"×"} />
                        <DynamicSVGTextSequence text={`${remainingTiles[tile]}`} />
                      </span>
                    }
                  </div>
                )
              })}
              {groupIndex < tileGroups.length - 1 && <div style={{ width: "100%" }} />}
            </React.Fragment>
          ))}
          <button
            onClick={wallState.clearWall}
          >
            <DynamicSVGText text="クリア" height="1.2em" />
          </button>
          <button
            style={{ visibility: wallState.canConfirmWall ? "visible" : "hidden" }}
            onClick={wallState.confirmWall}
          >
            <DynamicSVGText text="決定" height="1.2em" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default WallSection;
