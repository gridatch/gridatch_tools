import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/manman.module.css";
import { Hand, HandComponent, SOZU_TILES } from "../types/simulation";

interface HandSectionProps {
  hand: Hand;
  maxHand: number;
  addComponentToHand: (component: HandComponent) => void;
  removeComponentFromHand: (component: HandComponent) => void;
}

interface TileToRender {
  key: string;
  tile: string;
  onClick: (() => void) | null;
}

const HandSection: React.FC<HandSectionProps> = ({
  hand,
  maxHand,
  addComponentToHand,
  removeComponentFromHand,
}) => {
  const handTilesToRender: TileToRender[] = [];
  
  // 順子の表示：1セット目は 1p,2p,3p; 2セット目は 4p,5p,6p
  if (hand.sequence >= 1) {
      handTilesToRender.push({ key: `seq0_1`, tile: "1p", onClick: () => removeComponentFromHand("sequence") });
      handTilesToRender.push({ key: `seq0_2`, tile: "2p", onClick: () => removeComponentFromHand("sequence") });
      handTilesToRender.push({ key: `seq0_3`, tile: "3p", onClick: () => removeComponentFromHand("sequence") });
  }
  if (hand.sequence >= 2) {
    handTilesToRender.push({ key: `seq1_1`, tile: "4p", onClick: () => removeComponentFromHand("sequence") });
    handTilesToRender.push({ key: `seq1_2`, tile: "5p", onClick: () => removeComponentFromHand("sequence") });
    handTilesToRender.push({ key: `seq1_3`, tile: "6p", onClick: () => removeComponentFromHand("sequence") });
  }
  
  // 刻子の表示：1セット目は 7p,7p,7p; 2セット目は 8p,8p,8p
  if (hand.triplet >= 1) {
    handTilesToRender.push({ key: `trip0_1`, tile: "7p", onClick: () => removeComponentFromHand("triplet") });
    handTilesToRender.push({ key: `trip0_2`, tile: "7p", onClick: () => removeComponentFromHand("triplet") });
    handTilesToRender.push({ key: `trip0_3`, tile: "7p", onClick: () => removeComponentFromHand("triplet") });
  }
  if (hand.triplet >= 2) {
    handTilesToRender.push({ key: `trip1_1`, tile: "8p", onClick: () => removeComponentFromHand("triplet") });
    handTilesToRender.push({ key: `trip1_2`, tile: "8p", onClick: () => removeComponentFromHand("triplet") });
    handTilesToRender.push({ key: `trip1_3`, tile: "8p", onClick: () => removeComponentFromHand("triplet") });
  }
  
  // 対子の表示：9p,9p
  if (hand.pair >= 1) {
    handTilesToRender.push({ key: `pair_1`, tile: "9p", onClick: () => removeComponentFromHand("pair") });
    handTilesToRender.push({ key: `pair_2`, tile: "9p", onClick: () => removeComponentFromHand("pair") });
  }
  
  // 索子の表示（1s～9sの昇順）
  SOZU_TILES.forEach(tile => {
    for (let i = 0; i < hand[tile]; ++i) {
      handTilesToRender.push({ key: `sozu_${tile}_${i}`, tile, onClick: () => removeComponentFromHand(tile) });
    }
  });
  
  // 空の表示
  while (handTilesToRender.length < maxHand) {
    handTilesToRender.push({ key: `empty_${handTilesToRender.length}`, tile: "empty", onClick: null });
  }
  
  return (
    <section className={styles.hand_section}>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"手牌"} />
        </div>
        <div id="hand" className={`${styles.area} ${styles.hand}`}>
          {
            maxHand === 12 &&
            <img className={styles.hand_tile} src={`/tiles/wild.png`} alt="万象牌" />
          }
          {handTilesToRender.map(item => (
            <img key={item.key} className={styles.hand_tile} src={`/tiles/${item.tile}.png`} onClick={item.onClick ? item.onClick : undefined} alt={item.tile} />
          ))}
        </div>
      </div>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"牌選択ボタン"} />
        </div>
        <div id="hand_choices" className={`${styles.area} ${styles.tile_choices}`}>
          {SOZU_TILES.map(tile => (
            <img key={`hand_choice_${tile}`} className={styles.tile_choice} src={`/tiles/${tile}.png`} onClick={() => addComponentToHand(tile)} alt={tile} />
          ))}
        </div>
        <div id="other_color_choices" className={`${styles.area} ${styles.other_color_choices}`}>
          <div className={styles.set_choice} onClick={() => addComponentToHand("sequence")}>
            <img className={styles.set_choice_tile} src="/tiles/1p.png" alt="他色順子" />
            <img className={styles.set_choice_tile} src="/tiles/2p.png" alt="他色順子" />
            <img className={styles.set_choice_tile} src="/tiles/3p.png" alt="他色順子" />
          </div>
          <div className={styles.set_choice} onClick={() => addComponentToHand("triplet")}>
            <img className={styles.set_choice_tile} src="/tiles/7p.png" alt="他色刻子" />
            <img className={styles.set_choice_tile} src="/tiles/7p.png" alt="他色刻子" />
            <img className={styles.set_choice_tile} src="/tiles/7p.png" alt="他色刻子" />
          </div>
          <div className={styles.pair_choice} onClick={() => addComponentToHand("pair")}>
            <img className={styles.pair_choice_tile} src="/tiles/9p.png" alt="他色対子" />
            <img className={styles.pair_choice_tile} src="/tiles/9p.png" alt="他色対子" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HandSection;
