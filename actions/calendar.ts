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

export async function getCalendars() {
  const session = await getSession();
  if (!session) return [];

  const members = await prisma.calendarMember.findMany({
    where: { userId: session.userId },
    include: { calendar: true },
  });

  return members.map((m) => m.calendar);
}
