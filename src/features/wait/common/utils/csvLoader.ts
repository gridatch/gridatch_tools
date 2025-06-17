import { ManmanCsvData, ManmanCsvRow, Sozu, SOZU_TILES, SozuCsvData, SozuCsvRow } from '@shared/types/simulation';

/**
 * CSVファイルの内容を読み込み、各行の「手牌」文字列をキーにしたオブジェクトを返す。
 * csvData の形式は { "[手牌の枚数]": { "[手牌]": { "loss": [ロス数], "hand": [手牌], "breakdown": [ロス内訳] } } }
 */
export const loadManmanCsvData = async (fileNames: string[] | number[]): Promise<ManmanCsvData> => {
  const results = await Promise.all(
    fileNames.map(async name => {
      try {
        const res = await fetch(`/csv/manman/${name}.csv`);
        if (!res.ok) {
          throw new Error(`Failed to load ${name}.csv`);
        }
        const text = await res.text();
        const lines = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line);
        const data: { [key: string]: ManmanCsvRow } = {};
        if (lines.length > 1) {
          // ヘッダー行を無視して各行を処理
          lines.slice(1).forEach(line => {
            const parts = line.split(',');
            const loss = parseInt(parts[0], 10);
            const key = parts[1];
            const breakdown = parts[2] || '';
            data[key] = { loss, key, breakdown };
          });
        }
        return { name, data };
      } catch (error) {
        console.error(error);
        return { name, data: {} };
      }
    }),
  );
  const csvData: ManmanCsvData = {};
  results.forEach(({ name, data }) => {
    csvData[name] = data;
  });
  return csvData;
};

/**
 * CSVファイルの内容を読み込み、各行の「手牌」文字列をキーにしたオブジェクトを返す。
 * csvData の形式は { "[手牌の枚数]": { "[手牌]": { "loss": [ロス数], "hand": [手牌], "breakdown": [ロス内訳] } } }
 */
export const loadSozuCsvData = async (fileNames: string[] | number[]): Promise<SozuCsvData> => {
  const results = await Promise.all(
    fileNames.map(async name => {
      try {
        const res = await fetch(`/csv/sozu/${name}.csv`);
        if (!res.ok) {
          throw new Error(`Failed to load ${name}.csv`);
        }
        const text = await res.text();
        const lines = text
          .split('\n')
          .map(line => line.trim())
          .filter(line => line);
        const data: { [key: string]: SozuCsvRow } = {};
        if (lines.length > 1) {
          // ヘッダー行を無視して各行を処理
          lines.slice(1).forEach(line => {
            const parts = line.split(',');
            const totalWaits = parseInt(parts[0], 10);
            const key = parts[1];
            const waits: { [key in Sozu]: number } = Object.fromEntries(SOZU_TILES.map((tile, i) => [tile, parseInt(parts[2 + i], 10)])) as { [key in Sozu]: number };
            data[key] = { totalWaits, key, waits };
          });
        }
        return { name, data };
      } catch (error) {
        console.error(error);
        return { name, data: {} };
      }
    }),
  );
  const csvData: SozuCsvData = {};
  results.forEach(({ name, data }) => {
    csvData[name] = data;
  });
  return csvData;
};
