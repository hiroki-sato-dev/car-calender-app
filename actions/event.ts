"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { sendLineNotification, buildEventMessage } from "@/lib/line";

export async function getEvents(calendarId: number) {
  const events = await prisma.event.findMany({
    where: { calendarId },
    include: { user: { select: { name: true } } },
    orderBy: { startTime: "asc" },
  });

  return events.map((e) => ({
    id: e.id,
    calendarId: e.calendarId,
    userId: e.userId,
    title: e.title,
    memo: e.memo,
    startTime: e.startTime.toISOString(),
    endTime: e.endTime.toISOString(),
    userName: e.user.name,
  }));
}

export async function createEvent(data: {
  calendarId: number;
  title: string;
  memo: string;
  startTime: string;
  endTime: string;
}) {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const start = new Date(data.startTime);
  const end = new Date(data.endTime);

  if (end <= start) return { error: "終了時間は開始時間より後にしてください" };

  const calendarInfo = await prisma.calendar.findUnique({ where: { id: data.calendarId } });
  if (!calendarInfo?.isPersonal) {
    const overlap = await prisma.event.findFirst({
      where: {
        calendarId: data.calendarId,
        startTime: { lt: end },
        endTime: { gt: start },
      },
    });
    if (overlap) return { error: "この時間帯はすでに予定が入っています" };
  }

  const event = await prisma.event.create({
    data: {
      calendarId: data.calendarId,
      userId: session.userId,
      title: data.title,
      memo: data.memo || null,
      startTime: start,
      endTime: end,
    },
    include: { user: { select: { name: true } } },
  });

  // LINE 通知（lineGroupId が設定されている場合のみ）
  const calendar = await prisma.calendar.findUnique({ where: { id: data.calendarId } });
  if (calendar?.lineGroupId) {
    const baseUrl = process.env.VERCEL_URL
      ? `https://car-calender-app.vercel.app`
      : "http://localhost:3000";
    const message = buildEventMessage({
      calendarName: calendar.name,
      calendarUrl: `${baseUrl}/calendar/${calendar.id}`,
      userName: event.user.name,
      title: event.title,
      memo: event.memo,
      startTime: event.startTime,
      endTime: event.endTime,
    });
    await sendLineNotification(calendar.lineGroupId, message).catch(() => {});
  }

  return {
    success: true,
    event: {
      id: event.id,
      calendarId: event.calendarId,
      userId: event.userId,
      title: event.title,
      memo: event.memo,
      startTime: event.startTime.toISOString(),
      endTime: event.endTime.toISOString(),
      userName: event.user.name,
    },
  };
}

export async function updateEvent(eventId: number, data: {
  title: string;
  memo: string;
  startTime: string;
  endTime: string;
}) {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { error: "予定が見つかりません" };
  if (event.userId !== session.userId) return { error: "編集できるのは自分の予定のみです" };

  const start = new Date(data.startTime);
  const end = new Date(data.endTime);
  if (end <= start) return { error: "終了時間は開始時間より後にしてください" };

  const overlap = await prisma.event.findFirst({
    where: {
      calendarId: event.calendarId,
      id: { not: eventId },
      startTime: { lt: end },
      endTime: { gt: start },
    },
  });
  if (overlap) return { error: "この時間帯はすでに予定が入っています" };

  const updated = await prisma.event.update({
    where: { id: eventId },
    data: { title: data.title, memo: data.memo || null, startTime: start, endTime: end },
    include: { user: { select: { name: true } } },
  });

  return {
    success: true,
    event: {
      id: updated.id,
      calendarId: updated.calendarId,
      userId: updated.userId,
      title: updated.title,
      memo: updated.memo,
      startTime: updated.startTime.toISOString(),
      endTime: updated.endTime.toISOString(),
      userName: updated.user.name,
    },
  };
}

export async function deleteEvent(eventId: number) {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const event = await prisma.event.findUnique({ where: { id: eventId } });
  if (!event) return { error: "予定が見つかりません" };
  if (event.userId !== session.userId) return { error: "削除できるのは自分の予定のみです" };

  await prisma.event.delete({ where: { id: eventId } });
  return { success: true };
}
