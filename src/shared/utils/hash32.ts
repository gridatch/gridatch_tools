import xxhash from 'xxhash-wasm';

// トップレベル await で一度だけ初期化
const { h32 } = await xxhash();

export function hash32(text: string): string {
  return h32(text).toString(16);
}
