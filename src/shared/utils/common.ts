

// https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function deepFreeze(object: any) {
  // オブジェクトで定義されたプロパティ名を取得
  const propNames = Reflect.ownKeys(object);

  // 自分自身を凍結する前にプロパティを凍結
  for (const name of propNames) {
    const value = object[name];

    if ((value && typeof value === "object") || typeof value === "function") {
      deepFreeze(value);
    }
  }

  return Object.freeze(object);
}