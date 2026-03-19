/**
 * マイカレンダーBot リッチメニューセットアップスクリプト
 *
 * 実行方法:
 *   MY_CALENDAR_LINE_CHANNEL_ACCESS_TOKEN=xxx npx ts-node -r tsconfig-paths/register scripts/setup-rich-menu.ts
 *
 * 必要なもの:
 *   - MY_CALENDAR_LINE_CHANNEL_ACCESS_TOKEN 環境変数
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const ACCESS_TOKEN = process.env.MY_CALENDAR_LINE_CHANNEL_ACCESS_TOKEN;
if (!ACCESS_TOKEN) {
  console.error("MY_CALENDAR_LINE_CHANNEL_ACCESS_TOKEN が設定されていません");
  process.exit(1);
}

const APP_URL = "https://car-calender-app.vercel.app";
const IMAGE_PATH = path.join(__dirname, "../public/rich-menu.png");

// SVG生成（2500x843px、グレー系モダンデザイン、3ボタン）
function generateSvg(): string {
  const W = 2500;
  const H = 843;
  const btnW = Math.floor(W / 3);

  const buttons = [
    { label: "予定登録", icon: "＋", x: 0 },
    { label: "使い方", icon: "？", x: btnW },
    { label: "カレンダー", icon: "📅", x: btnW * 2 },
  ];

  const btnDividers = buttons
    .slice(1)
    .map((b) => `<line x1="${b.x}" y1="60" x2="${b.x}" y2="${H - 60}" stroke="#555555" stroke-width="2"/>`)
    .join("\n");

  const btnElements = buttons
    .map(
      (b) => `
    <g transform="translate(${b.x + btnW / 2}, ${H / 2})">
      <text text-anchor="middle" dominant-baseline="middle" dy="-70"
        font-family="sans-serif" font-size="160" fill="#ffffff">${b.icon}</text>
      <text text-anchor="middle" dominant-baseline="middle" dy="100"
        font-family="sans-serif" font-size="110" font-weight="600" fill="#ffffff">${b.label}</text>
    </g>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <rect width="${W}" height="${H}" fill="#2d2d2d"/>
  ${btnDividers}
  ${btnElements}
</svg>`;
}

async function main() {
  // 1. SVG → PNG生成
  console.log("リッチメニュー画像を生成中...");
  const svgPath = path.join(__dirname, "../public/rich-menu.svg");
  fs.writeFileSync(svgPath, generateSvg());
  execSync(`magick "${svgPath}" -resize 2500x843 "${IMAGE_PATH}"`);
  console.log(`✓ 画像生成: ${IMAGE_PATH}`);

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
  const btnW = Math.floor(2500 / 3);
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
          action: {
            type: "uri",
            label: "カレンダー",
            uri: `${APP_URL}/my-calendar`,
          },
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
  const uploadRes = await fetch(`https://api.line.me/v2/bot/richmenu/${richMenuId}/content`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      "Content-Type": "image/png",
    },
    body: imageBuffer,
  });
  if (!uploadRes.ok) {
    console.error("画像アップロード失敗:", await uploadRes.text());
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

  console.log("\n🎉 リッチメニューのセットアップが完了しました！");
}

main().catch(console.error);
