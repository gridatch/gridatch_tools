import React from "react";
import DynamicSVGText from "./dynamicSVGText";
import styles from "../pages/manman.module.css";

const Hand = ({
  hand,
  addHandTile,
  removeSingle,
  addSequenceSet,
  addTripletSet,
  addHeadSet,
  removeSequenceSet,
  removeTripletSet,
  removeHeadSet,
  maxHand
}) => {
  const handTilesToRender = [];
  // 順子の表示：1セット目は 1p,2p,3p; 2セット目は 4p,5p,6p
  for (let i = 0; i < hand.sequenceCount; i++) {
    if (i === 0) {
      handTilesToRender.push({ key: `seq0_1`, tile: "1p", onClick: removeSequenceSet });
      handTilesToRender.push({ key: `seq0_2`, tile: "2p", onClick: removeSequenceSet });
      handTilesToRender.push({ key: `seq0_3`, tile: "3p", onClick: removeSequenceSet });
    } else if (i === 1) {
      handTilesToRender.push({ key: `seq1_1`, tile: "4p", onClick: removeSequenceSet });
      handTilesToRender.push({ key: `seq1_2`, tile: "5p", onClick: removeSequenceSet });
      handTilesToRender.push({ key: `seq1_3`, tile: "6p", onClick: removeSequenceSet });
    }
  }
  // 刻子の表示：1セット目は 7p,7p,7p; 2セット目は 8p,8p,8p
  for (let i = 0; i < hand.tripletCount; i++) {
    if (i === 0) {
      handTilesToRender.push({ key: `trip0_1`, tile: "7p", onClick: removeTripletSet });
      handTilesToRender.push({ key: `trip0_2`, tile: "7p", onClick: removeTripletSet });
      handTilesToRender.push({ key: `trip0_3`, tile: "7p", onClick: removeTripletSet });
    } else if (i === 1) {
      handTilesToRender.push({ key: `trip1_1`, tile: "8p", onClick: removeTripletSet });
      handTilesToRender.push({ key: `trip1_2`, tile: "8p", onClick: removeTripletSet });
      handTilesToRender.push({ key: `trip1_3`, tile: "8p", onClick: removeTripletSet });
    }
  }
  // 対子の表示：9p,9p
  if (hand.head) {
    handTilesToRender.push({ key: `head_1`, tile: "9p", onClick: removeHeadSet });
    handTilesToRender.push({ key: `head_2`, tile: "9p", onClick: removeHeadSet });
  }
  // 単体牌の表示（1s～9sの昇順）
  Object.keys(hand.singles)
    .sort((a, b) => parseInt(a, 10) - parseInt(b, 10))
    .forEach(tile => {
      const count = hand.singles[tile];
      for (let i = 0; i < count; i++) {
        handTilesToRender.push({
          key: `single_${tile}_${i}`,
          tile,
          onClick: () => removeSingle(tile)
        });
      }
    });
  while (handTilesToRender.length < maxHand) {
    handTilesToRender.push({
      key: `empty_${handTilesToRender.length}`,
      tile: "empty",
      onClick: null
    });
  }
  
  return (
    <section className={styles.hand_section}>
      <div>
        <div className={styles.area_title}>
          <DynamicSVGText text={"手牌"} />
        </div>
        <div id="hand" className={`${styles.area} ${styles.hand}`}>
          <img className={styles.hand_tile} src={`/tiles/wild.png`} alt="万象牌" />
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
          {Array.from({ length: 9 }, (_, i) => {
            const tile = `${i + 1}s`;
            return (
              <img key={`hand_choice_${i}`} className={styles.tile_choice} src={`/tiles/${tile}.png`} onClick={() => addHandTile(tile)} alt={tile} />
            );
          })}
        </div>
        <div id="other_color_choices" className={`${styles.area} ${styles.othe_color_choices}`}>
          <div className={styles.set_choice} onClick={addSequenceSet}>
            <img className={styles.set_choice_tile} src="/tiles/1p.png" alt="他色順子" />
            <img className={styles.set_choice_tile} src="/tiles/2p.png" alt="他色順子" />
            <img className={styles.set_choice_tile} src="/tiles/3p.png" alt="他色順子" />
          </div>
          <div className={styles.set_choice} onClick={addTripletSet}>
            <img className={styles.set_choice_tile} src="/tiles/7p.png" alt="他色刻子" />
            <img className={styles.set_choice_tile} src="/tiles/7p.png" alt="他色刻子" />
            <img className={styles.set_choice_tile} src="/tiles/7p.png" alt="他色刻子" />
          </div>
          <div className={styles.head_choice} onClick={addHeadSet}>
            <img className={styles.head_choice_tile} src="/tiles/9p.png" alt="他色対子" />
            <img className={styles.head_choice_tile} src="/tiles/9p.png" alt="他色対子" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hand;
