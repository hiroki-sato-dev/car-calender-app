import * as line from "@line/bot-sdk";

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export async function sendLineNotification(
  lineGroupId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  message: any
): Promise<void> {
  await client.pushMessage({
    to: lineGroupId,
    messages: [message],
  });
}

export function buildEventMessage(params: {
  calendarName: string;
  calendarUrl: string;
  userName: string;
  title: string;
  memo: string | null;
  startTime: Date;
  endTime: Date;
}) {
  const fmt = (d: Date) =>
    d.toLocaleString("ja-JP", {
      timeZone: "Asia/Tokyo",
      month: "numeric",
      day: "numeric",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const bodyContents = [
    {
      type: "text",
      text: `${params.calendarName}の予定が登録されました`,
      weight: "bold",
      size: "md",
      wrap: true,
    },
    {
      type: "separator",
      margin: "md",
    },
    {
      type: "box",
      layout: "vertical",
      margin: "md",
      spacing: "sm",
      contents: [
        { type: "text", text: `登録者: ${params.userName}`, size: "sm", color: "#555555", wrap: true },
        { type: "text", text: `日時: ${fmt(params.startTime)} 〜 ${fmt(params.endTime)}`, size: "sm", color: "#555555", wrap: true },
        { type: "text", text: `タイトル: ${params.title}`, size: "sm", color: "#555555", wrap: true },
        ...(params.memo
          ? [{ type: "text" as const, text: `メモ: ${params.memo}`, size: "sm" as const, color: "#555555", wrap: true }]
          : []),
      ],
    },
  ];

  return {
    type: "flex",
    altText: `${params.calendarName}の予定が登録されました`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        contents: bodyContents,
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "カレンダーを開く",
              uri: params.calendarUrl,
            },
            style: "primary",
            color: "#2563eb",
          },
        ],
      },
    },
  };
}
