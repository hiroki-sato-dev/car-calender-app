import { getCalendars } from "@/actions/calendar";
import { getSession } from "@/lib/auth";
import CalendarsClient from "./CalendarsClient";

export default async function CalendarsPage() {
  const session = await getSession();
  const calendars = await getCalendars();

  return <CalendarsClient calendars={calendars} userName={session?.name ?? ""} />;
}
