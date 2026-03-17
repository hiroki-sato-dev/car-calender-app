import * as line from "@line/bot-sdk";

const client = new line.messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN!,
});

export async function sendLineNotification(
  lineGroupId: string,
  message: string
): Promise<void> {
  await client.pushMessage({
    to: lineGroupId,
    messages: [{ type: "text", text: message }],
  });
}

export function buildEventMessage(params: {
  userName: string;
  title: string;
  memo: string | null;
  startTime: Date;
  endTime: Date;
}): string {
  const fmt = (d: Date) =>
    d.toLocaleString("ja-JP", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const lines = [
    "車の予定が登録されました",
    "",
    `登録者: ${params.userName}`,
    `日時: ${fmt(params.startTime)} 〜 ${fmt(params.endTime)}`,
    `タイトル: ${params.title}`,
  ];
  if (params.memo) lines.push(`メモ: ${params.memo}`);

  return lines.join("\n");
}
