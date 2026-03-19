"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

function generateShareCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export async function createCalendar(name: string) {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const shareCode = generateShareCode();

  const calendar = await prisma.calendar.create({
    data: {
      name,
      shareCode,
      createdBy: session.userId,
      members: {
        create: { userId: session.userId },
      },
    },
  });

  return { success: true, calendar };
}

export async function joinCalendar(shareCode: string) {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const calendar = await prisma.calendar.findUnique({ where: { shareCode } });
  if (!calendar) return { error: "カレンダーが見つかりません" };

  const existing = await prisma.calendarMember.findFirst({
    where: { calendarId: calendar.id, userId: session.userId },
  });
  if (existing) return { error: "すでに参加しています" };

  await prisma.calendarMember.create({
    data: { calendarId: calendar.id, userId: session.userId },
  });

  return { success: true, calendar };
}

export async function leaveCalendar(calendarId: number) {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const member = await prisma.calendarMember.findFirst({
    where: { calendarId, userId: session.userId },
  });
  if (!member) return { error: "参加していません" };

  await prisma.calendarMember.delete({ where: { id: member.id } });

  const remaining = await prisma.calendarMember.count({ where: { calendarId } });
  if (remaining === 0) {
    await prisma.event.deleteMany({ where: { calendarId } });
    await prisma.calendar.delete({ where: { id: calendarId } });
  }

  return { success: true };
}

export async function getCalendars() {
  const session = await getSession();
  if (!session) return [];

  const members = await prisma.calendarMember.findMany({
    where: { userId: session.userId, calendar: { isPersonal: false } },
    include: { calendar: true },
  });

  return members.map((m) => m.calendar);
}

export async function getMyCalendar() {
  const session = await getSession();
  if (!session) return null;

  const member = await prisma.calendarMember.findFirst({
    where: { userId: session.userId, calendar: { isPersonal: true } },
    include: { calendar: true },
  });

  return member?.calendar ?? null;
}

export async function createMyCalendar() {
  const session = await getSession();
  if (!session) return { error: "ログインが必要です" };

  const existing = await prisma.calendarMember.findFirst({
    where: { userId: session.userId, calendar: { isPersonal: true } },
  });
  if (existing) return { error: "すでにマイカレンダーが存在します" };

  const shareCode = Math.random().toString(36).substring(2, 8).toUpperCase();

  const currentUser = await prisma.user.findUnique({ where: { id: session.userId } });
  const lineLinkCode = currentUser?.lineLinkCode ?? Math.random().toString(36).substring(2, 9).toUpperCase();

  if (!currentUser?.lineLinkCode) {
    await prisma.user.update({
      where: { id: session.userId },
      data: { lineLinkCode },
    });
  }

  const calendar = await prisma.calendar.create({
    data: {
      name: "マイカレンダー",
      shareCode,
      isPersonal: true,
      createdBy: session.userId,
      members: { create: { userId: session.userId } },
    },
  });

  return { success: true, calendar, lineLinkCode };
}
