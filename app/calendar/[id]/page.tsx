import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getEvents } from "@/actions/event";
import CalendarView from "@/components/calendar/CalendarView";

type Props = { params: Promise<{ id: string }> };

export default async function CalendarPage({ params }: Props) {
  const { id } = await params;
  const calendarId = parseInt(id);
  const session = await getSession();

  const calendar = await prisma.calendar.findUnique({ where: { id: calendarId } });
  if (!calendar) notFound();

  const member = await prisma.calendarMember.findFirst({
    where: { calendarId, userId: session!.userId },
  });
  if (!member) notFound();

  const USER_COLORS = ["#3b82f6", "#22c55e", "#f97316", "#a855f7", "#ec4899", "#14b8a6"];

  const members = await prisma.calendarMember.findMany({
    where: { calendarId },
    include: { user: { select: { name: true } } },
    orderBy: { id: "asc" },
  });
  const userColors: Record<number, string> = {};
  const memberList: { userId: number; name: string; color: string }[] = [];
  members.forEach((m, i) => {
    const color = USER_COLORS[i % USER_COLORS.length];
    userColors[m.userId] = color;
    memberList.push({ userId: m.userId, name: m.user.name, color });
  });

  const events = await getEvents(calendarId);

  return (
    <CalendarView
      calendarId={calendarId}
      calendarName={calendar.name}
      initialEvents={events}
      currentUserId={session!.userId}
      userColors={userColors}
      memberList={memberList}
    />
  );
}
