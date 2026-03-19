import { getCalendars, getMyCalendar } from "@/actions/calendar";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import CalendarsClient from "./CalendarsClient";

export default async function CalendarsPage() {
  const session = await getSession();
  const [calendars, myCalendar] = await Promise.all([getCalendars(), getMyCalendar()]);

  const user = session ? await prisma.user.findUnique({ where: { id: session.userId } }) : null;

  return (
    <CalendarsClient
      calendars={calendars}
      userName={session?.name ?? ""}
      myCalendar={myCalendar}
      lineLinkCode={user?.lineLinkCode ?? null}
      lineLinked={!!user?.lineUserId}
    />
  );
}
