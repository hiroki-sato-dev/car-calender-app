import { NextRequest, NextResponse } from "next/server";
import * as line from "@line/bot-sdk";
import { prisma } from "@/lib/prisma";

const channelSecret = process.env.LINE_CHANNEL_SECRET!;
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!line.validateSignature(body, channelSecret, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const events: line.WebhookEvent[] = JSON.parse(body).events;

  for (const event of events) {
    // Bot がグループに参加したとき → 登録コードを送るよう案内
    if (event.type === "join" && event.source.type === "group") {
      await client.replyMessage({
        replyToken: event.replyToken,
        messages: [{
          type: "text",
          text: "シェアカレンダーBotです！\nカレンダーと連携するには、アプリに表示されている登録コードをこのグループに送信してください。\n\n例）登録コード: AB1234",
        }],
      });
    }

    // 「登録コード: XXXXXX」を受信 → カレンダーに lineGroupId を保存して返信
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.source.type === "group"
    ) {
      const text = event.message.text.trim();
      const match = text.match(/登録コード[：:]\s*([A-Z0-9]{6,7})/i);
      if (match) {
        const shareCode = match[1].toUpperCase();
        const lineGroupId = event.source.groupId;
        const result = await prisma.calendar.findFirst({ where: { shareCode } });

        if (result) {
          await prisma.calendar.update({
            where: { id: result.id },
            data: { lineGroupId },
          });
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
              type: "text",
              text: `「${result.name}」と連携しました！\n予定が登録されるとこのグループに通知が届きます。`,
            }],
          });
        } else {
          await client.replyMessage({
            replyToken: event.replyToken,
            messages: [{
              type: "text",
              text: "登録コードが見つかりませんでした。コードを確認して再度送信してください。",
            }],
          });
        }
      }
    }
  }

  return NextResponse.json({ ok: true });
}
