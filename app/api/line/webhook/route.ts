import { NextRequest, NextResponse } from "next/server";
import * as line from "@line/bot-sdk";
import { prisma } from "@/lib/prisma";

const channelSecret = process.env.LINE_CHANNEL_SECRET!;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  // 署名検証
  if (!line.validateSignature(body, channelSecret, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const events: line.WebhookEvent[] = JSON.parse(body).events;

  for (const event of events) {
    // Bot がグループに参加したとき → lineGroupId を Calendar に保存
    if (
      event.type === "join" &&
      event.source.type === "group"
    ) {
      const lineGroupId = event.source.groupId;

      // グループ ID に紐付いていないカレンダーのうち最新のものに保存
      // ※ Bot 追加時のグループ特定は URL パラメータ or メッセージで行う想定
      // ここでは暫定的に lineGroupId が未設定のカレンダーの最新1件に紐付け
      const calendar = await prisma.calendar.findFirst({
        where: { lineGroupId: null },
        orderBy: { id: "desc" },
      });

      if (calendar) {
        await prisma.calendar.update({
          where: { id: calendar.id },
          data: { lineGroupId },
        });
      }
    }

    // グループでメッセージを受信したとき「登録コード: XXXXXX」→ カレンダーを特定して lineGroupId を保存
    if (
      event.type === "message" &&
      event.message.type === "text" &&
      event.source.type === "group"
    ) {
      const text = event.message.text.trim();
      const match = text.match(/登録コード[：:]\s*([A-Z0-9]{6})/i);
      if (match) {
        const shareCode = match[1].toUpperCase();
        const lineGroupId = event.source.groupId;
        await prisma.calendar.updateMany({
          where: { shareCode },
          data: { lineGroupId },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
