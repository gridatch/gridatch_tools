const opentype = require('opentype.js');
const fs = require('fs-extra');
const path = require('path');
const sanitize = require('sanitize-filename');

// 設定
const FONT_PATH = path.join(__dirname, '../fonts/JumpyonMaru-Regular.otf');          // 使用するフォントファイルのパス
const OUTPUT_DIR = path.join(__dirname, '../static/generated_svgs');                 // SVG出力先
const FONT_SIZE = 24;                                                                // 使用するフォントサイズ
const SVG_TEXTS_FILE = path.join(__dirname, './config/svg-texts.txt');              // 各行単位でSVG生成する用のファイル
const SVG_CHARACTERS_FILE = path.join(__dirname, './config/svg-characters.txt');      // 1文字ずつ分割してSVG生成する用のファイル

async function generateSVG(text, font) {
  const fontSize = FONT_SIZE;
  // 内部単位から実際のサイズへの変換率
  const scale = fontSize / font.unitsPerEm;
  // 基準となるベースライン（ascender を基準）
  const baseline = font.ascender * scale;
  // テキストに対するパスを生成
  const pathObj = font.getPath(text, 0, baseline, fontSize);
  // 文字全体の advance width（サイドベアリング含む）を取得
  const advanceWidth = font.getAdvanceWidth(text, fontSize);

  // viewBox をフォントメトリクスに基づいて設定
  const viewBoxX = 0;
  const viewBoxY = 0;
  const viewBoxWidth = advanceWidth;
  const viewBoxHeight = scale * (font.ascender - font.descender);

  // 必要に応じて位置調整（今回は 0,0）
  const translateX = 0;
  const translateY = 0;

  const pathData = pathObj.toPathData();

  const svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}">
      <path d="${pathData}" transform="translate(${translateX}, ${translateY})" />
    </svg>
  `;

  const sanitizedText = sanitize(text);
  const filename = `${sanitizedText}.svg`;
  // fs.outputFile は既存ファイルがあれば上書きします
  await fs.outputFile(path.join(OUTPUT_DIR, filename), svgContent);
  console.log(`✅ ${filename} を生成しました。`);
}

(async () => {
  try {
    const font = await opentype.load(FONT_PATH);
    await fs.ensureDir(OUTPUT_DIR);

    // ■ 各行単位でのSVG生成（SVG_TEXTS_FILE）
    const textsContent = await fs.readFile(SVG_TEXTS_FILE, 'utf-8');
    const texts = textsContent
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.length > 0);

    for (const text of texts) {
      await generateSVG(text, font);
    }

    // ■ 1文字ずつ分割してのSVG生成（SVG_CHARACTERS_FILE）
    const charsContent = await fs.readFile(SVG_CHARACTERS_FILE, 'utf-8');
    // 余計な空白を除去した上で、1文字ずつに分解（必要に応じて空白も除外）
    const characters = Array.from(charsContent.trim());
    for (const char of characters) {
      await generateSVG(char, font);
    }

    console.log(`🎉 SVG変換が完了しました: ${OUTPUT_DIR}`);
  } catch (error) {
    console.error('❌ エラー発生:', error);
  }
})();
