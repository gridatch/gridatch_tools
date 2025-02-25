const opentype = require('opentype.js');
const fs = require('fs-extra');
const path = require('path');
const sanitize = require('sanitize-filename');

// 設定
const FONT_PATH = path.join(__dirname, '../fonts/JumpyonMaru-Regular.otf');
const OUTPUT_DIR = path.join(__dirname, '../static/generated_svgs');
const FONT_SIZE = 24;
// 行単位でSVG生成する用のファイル
const SVG_TEXTS_FILE = path.join(__dirname, './config/svg-texts.txt');
// 1文字ずつ分割してSVG生成する用のファイル
const SVG_CHARACTERS_FILE = path.join(__dirname, './config/svg-characters.txt');

async function generateSVG(text, font) {
  const fontSize = FONT_SIZE;
  // 内部単位と実際のサイズの比率
  const scale = fontSize / font.unitsPerEm;
  const baseline = font.ascender * scale;
  // パスを生成
  const pathObj = font.getPath(text, 0, baseline, fontSize);
  // 文字全体の advance width（サイドベアリング含む）を取得
  const advanceWidth = font.getAdvanceWidth(text, fontSize);

  const viewBoxX = 0;
  const viewBoxY = 0;
  const viewBoxWidth = advanceWidth;
  const viewBoxHeight = scale * (font.ascender - font.descender);

  const translateX = 0;
  const translateY = 0;

  const pathData = pathObj.toPathData();

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}">
      <path d="${pathData}" transform="translate(${translateX}, ${translateY})" />
    </svg>
  `;

  const sanitizedText = sanitize(text.trim());
  const filename = `${sanitizedText}.svg`;
  // 既存ファイルがあれば上書き
  await fs.outputFile(path.join(OUTPUT_DIR, filename), svgContent);
  console.log(`✅ ${filename} を生成しました。`);
}

(async () => {
  try {
    const font = await opentype.load(FONT_PATH);
    await fs.ensureDir(OUTPUT_DIR);

    // 行単位のSVG生成
    const textsContent = await fs.readFile(SVG_TEXTS_FILE, 'utf-8');
    const texts = textsContent
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    for (const text of texts) {
      await generateSVG(text, font);
    }

    // 1文字ずつ分割してのSVG生成
    const charsContent = await fs.readFile(SVG_CHARACTERS_FILE, 'utf-8');
    const characters = Array.from(charsContent.replace(/\s+/g, ""));
    for (const char of characters) {
      if (!sanitize(char)) continue;
      await generateSVG(char, font);
    }

    console.log(`🎉 SVG変換が完了しました: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ エラー発生:', error);
  }
})();
