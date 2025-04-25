import { RealmBoss } from "../types/simulation";

export const REALM_BOSS_DESCRIPTIONS: Record<RealmBoss, string> = {
  dora_indicator: "ドラ表示牌が最大3枚。",
  dora_manzu: "「萬子」のドラ・魂牌が無効化。",
  dora_pinzu: "「筒子」のドラ・魂牌が無効化。",
  dora_sozu: "「索子」のドラ・魂牌が無効化。",
  exchange_amount: "入替で選べる牌が最大3枚。",
  lock: "3枚の牌をロックする。",
  others: "その他の効果。",
  empty: "ステージ効果を設定してください。"
} as const;
