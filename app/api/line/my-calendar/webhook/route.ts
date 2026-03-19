import { NextRequest, NextResponse } from "next/server";
import * as line from "@line/bot-sdk";
import { prisma } from "@/lib/prisma";
import { parseJaDatetime } from "@/lib/datetime-parser";

const channelSecret = process.env.MY_CALENDAR_LINE_CHANNEL_SECRET!;
const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.MY_CALENDAR_LINE_CHANNEL_ACCESS_TOKEN!,
});

const PARSE_ERROR_MSG = `日時を認識できませんでした。
以下の形式で送ってください。

例：
・明日10時〜11時
・3/20 9:00-10:00
・来週月曜 午後3時から1時間`;

const USAGE_MSG = `📅 マイカレンダーBotの使い方

【予定を登録する】
「予定登録」と送ると登録フローが始まります。

【LINE連携する】
アプリのカレンダー一覧画面に表示されている連携コードを送ってください。
例）LINE連携: XXXXXXX`;

const APP_BASE_URL = "https://car-calender-app.vercel.app";

const UNLINKED_MSG = `マイカレンダーと連携されていません。

以下のURLからアプリを開き、連携コードを確認してこちらに送ってください。
${APP_BASE_URL}/calendars

例）LINE連携: XXXXXXX`;

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-line-signature") ?? "";

  if (!line.validateSignature(body, channelSecret, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 403 });
  }

  const events: line.WebhookEvent[] = JSON.parse(body).events;

  for (const event of events) {
    if (event.type !== "message" || event.message.type !== "text") continue;
    if (event.source.type !== "user") continue;

    const lineUserId = event.source.userId;
    const text = event.message.text.trim();
    const replyToken = event.replyToken;

    // LINE連携コードの処理
    const linkMatch = text.match(/LINE連携[：:]?\s*([A-Z0-9]{6,8})/i);
    if (linkMatch) {
      const code = linkMatch[1].toUpperCase();
      const user = await prisma.user.findUnique({ where: { lineLinkCode: code } });

      if (!user) {
        await client.replyMessage({
          replyToken,
          messages: [{ type: "text", text: "連携コードが見つかりませんでした。アプリで連携コードを確認してください。" }],
        });
        continue;
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { lineUserId },
      });

      await client.replyMessage({
        replyToken,
        messages: [{ type: "text", text: `連携しました！\nマイカレンダーBotから予定を登録できます。\n\n「予定登録」と送ると登録フローが始まります。` }],
      });
      continue;
    }

    // 連携済みユーザーを取得
    const user = await prisma.user.findUnique({ where: { lineUserId } });

    // 使い方
    if (text === "使い方") {
      await client.replyMessage({ replyToken, messages: [{ type: "text", text: USAGE_MSG }] });
      continue;
    }

    // 未連携ユーザー
    if (!user) {
      await client.replyMessage({ replyToken, messages: [{ type: "text", text: UNLINKED_MSG }] });
      continue;
    }

    // 会話状態を取得
    const convState = await prisma.lineConversationState.findUnique({ where: { userId: user.id } });
    const state = convState?.state ?? "idle";

    // 予定登録開始
    if (text === "予定登録") {
      await prisma.lineConversationState.upsert({
        where: { userId: user.id },
        create: { userId: user.id, state: "waiting_title" },
        update: { state: "waiting_title", title: null },
      });
      await client.replyMessage({
        replyToken,
        messages: [{ type: "text", text: "タイトルを教えてください" }],
      });
      continue;
    }

    // タイトル待ち
    if (state === "waiting_title") {
      await prisma.lineConversationState.update({
        where: { userId: user.id },
        data: { state: "waiting_datetime", title: text },
      });
      await client.replyMessage({
        replyToken,
        messages: [{
          type: "text",
          text: `「${text}」ですね！\n日時を教えてください\n\n例：\n・明日10時〜11時\n・3/20 9:00-10:00`,
        }],
      });
      continue;
    }

    // 日時待ち
    if (state === "waiting_datetime") {
      const parsed = parseJaDatetime(text);

      if (!parsed) {
        await client.replyMessage({ replyToken, messages: [{ type: "text", text: PARSE_ERROR_MSG }] });
        continue;
      }

      const title = convState?.title ?? "予定";

      // マイカレンダーを取得
      const member = await prisma.calendarMember.findFirst({
        where: { userId: user.id, calendar: { isPersonal: true } },
        include: { calendar: true },
      });

      if (!member) {
        await prisma.lineConversationState.update({ where: { userId: user.id }, data: { state: "idle" } });
        await client.replyMessage({
          replyToken,
          messages: [{ type: "text", text: "マイカレンダーが見つかりません。アプリからマイカレンダーを作成してください。" }],
        });
        continue;
      }

      // 重複チェック
      const overlap = await prisma.event.findFirst({
        where: {
          calendarId: member.calendarId,
          startTime: { lt: parsed.end },
          endTime: { gt: parsed.start },
        },
      });

      if (overlap) {
        await client.replyMessage({
          replyToken,
          messages: [{ type: "text", text: `この時間帯はすでに予定「${overlap.title}」が入っています。\n別の日時を教えてください。` }],
        });
        continue;
      }

      await prisma.event.create({
        data: {
          calendarId: member.calendarId,
          userId: user.id,
          title,
          startTime: parsed.start,
          endTime: parsed.end,
        },
      });

      await prisma.lineConversationState.update({ where: { userId: user.id }, data: { state: "idle", title: null } });

      const fmt = (d: Date) =>
        d.toLocaleString("ja-JP", {
          timeZone: "Asia/Tokyo",
          month: "numeric",
          day: "numeric",
          weekday: "short",
          hour: "2-digit",
          minute: "2-digit",
        });

      await client.replyMessage({
        replyToken,
        messages: [{
          type: "text",
          text: `「${title}」を登録しました！\n${fmt(parsed.start)} 〜 ${fmt(parsed.end)}`,
        }],
      });
      continue;
    }

    // それ以外
    await client.replyMessage({ replyToken, messages: [{ type: "text", text: UNLINKED_MSG.replace("マイカレンダーと連携されていません。\n\n", "") + "\n\n「予定登録」と送ると予定を登録できます。" }] });
  }

  return NextResponse.json({ ok: true });
}
