/**
 * マイカレンダーBot リッチメニューセットアップスクリプト
 *
 * 実行方法:
 *   MY_CALENDAR_LINE_CHANNEL_ACCESS_TOKEN=xxx npx ts-node -r tsconfig-paths/register scripts/setup-rich-menu.ts
 */

import fs from "fs";
import path from "path";
import sharp from "sharp";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ACCESS_TOKEN = process.env.MY_CALENDAR_LINE_CHANNEL_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error("MY_CALENDAR_LINE_CHANNEL_ACCESS_TOKEN が設定されていません");
  process.exit(1);
}

const APP_URL = "https://car-calender-app.vercel.app";
const IMAGE_PATH = path.join(__dirname, "../public/rich-menu.png");

const W = 2500;
const H = 843;
const btnW = Math.floor(W / 3);

// sharpに渡すSVG（テキスト描画をsharpのSVGレンダラーで処理）
function buildSvg(): Buffer {
  const buttons = [
    { label: "予定登録", icon: "+", x: 0 },
    { label: "使い方",   icon: "?", x: btnW },
    { label: "カレンダー", icon: "Cal", x: btnW * 2 },
  ];

  const dividers = [btnW, btnW * 2]
    .map((x) => `<line x1="${x}" y1="40" x2="${x}" y2="${H - 40}" stroke="#555" stroke-width="3"/>`)
    .join("");

  const items = buttons.map((b) => {
    const cx = b.x + btnW / 2;
    return `
      <text x="${cx}" y="${H / 2 - 60}" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-size="140" font-weight="bold" fill="#aaaaaa">${b.icon}</text>
      <text x="${cx}" y="${H / 2 + 110}" text-anchor="middle" dominant-baseline="middle"
        font-family="Arial, sans-serif" font-size="110" font-weight="600" fill="#ffffff">${b.label}</text>
    `;
  }).join("");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#1e1e1e"/>
  ${dividers}
  ${items}
</svg>`;
  return Buffer.from(svg);
}

async function main() {
  // 1. PNG生成（sharpでSVG→PNG）
  console.log("リッチメニュー画像を生成中...");
  await sharp(buildSvg()).png().toFile(IMAGE_PATH);
  const stat = fs.statSync(IMAGE_PATH);
  console.log(`✓ 画像生成: ${IMAGE_PATH} (${Math.round(stat.size / 1024)}KB)`);

  // 2. 既存リッチメニューを削除
  console.log("既存のリッチメニューを確認中...");
  const listRes = await fetch("https://api.line.me/v2/bot/richmenu/list", {
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  const listData = await listRes.json() as { richmenus: { richMenuId: string }[] };
  for (const menu of listData.richmenus ?? []) {
    await fetch(`https://api.line.me/v2/bot/richmenu/${menu.richMenuId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
    });
    console.log(`✓ 削除: ${menu.richMenuId}`);
  }

  // 3. リッチメニュー作成
  console.log("リッチメニューを作成中...");
  const createRes = await fetch("https://api.line.me/v2/bot/richmenu", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      size: { width: 2500, height: 843 },
      selected: true,
      name: "マイカレンダーBot メニュー",
      chatBarText: "メニュー",
      areas: [
        {
          bounds: { x: 0, y: 0, width: btnW, height: 843 },
          action: { type: "message", label: "予定登録", text: "予定登録" },
        },
        {
          bounds: { x: btnW, y: 0, width: btnW, height: 843 },
          action: { type: "message", label: "使い方", text: "使い方" },
        },
        {
          bounds: { x: btnW * 2, y: 0, width: 2500 - btnW * 2, height: 843 },
          action: { type: "uri", label: "カレンダー", uri: `${APP_URL}/my-calendar` },
        },
      ],
    }),
  });
  const createData = await createRes.json() as { richMenuId: string };
  const richMenuId = createData.richMenuId;
  console.log(`✓ 作成: ${richMenuId}`);

  // 4. 画像アップロード
  console.log("画像をアップロード中...");
  const imageBuffer = fs.readFileSync(IMAGE_PATH);
  const uploadRes = await fetch(`https://api-data.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "image/png",
    },
    body: imageBuffer,
  });
  if (!uploadRes.ok) {
    console.error("画像アップロード失敗 status:", uploadRes.status, uploadRes.statusText);
    console.error("レスポンス:", await uploadRes.text());
    process.exit(1);
  }
  console.log("✓ 画像アップロード完了");

  // 5. デフォルトリッチメニューに設定
  console.log("デフォルトに設定中...");
  await fetch(`https://api.line.me/v2/bot/user/all/richmenu/${richMenuId}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${ACCESS_TOKEN}` },
  });
  console.log("✓ デフォルトリッチメニューに設定完了");
  console.log("\nリッチメニューのセットアップが完了しました！");
}

main().catch(console.error);
