import { redirect } from "next/navigation";
import { getMyCalendar } from "@/actions/calendar";
import { getSession } from "@/lib/auth";
import { getEvents } from "@/actions/event";
import MyCalendarView from "@/components/my-calendar/MyCalendarView";

export default async function MyCalendarPage() {
  const session = await getSession();
  const calendar = await getMyCalendar();

  if (!calendar) redirect("/calendars");

  const events = await getEvents(calendar.id);

  return (
    <MyCalendarView
      calendarId={calendar.id}
      currentUserId={session!.userId}
      initialEvents={events}
    />
  );
}
