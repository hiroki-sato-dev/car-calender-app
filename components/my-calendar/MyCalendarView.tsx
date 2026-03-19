"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import { EventInput } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventType } from "@/types/event";
import EventModal from "@/components/event/EventModal";
import Spinner from "@/components/ui/Spinner";

type Props = {
  calendarId: number;
  currentUserId: number;
  initialEvents: EventType[];
};

function toLocalDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

const TODAY = toLocalDate(new Date());

function fmtTime(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function MyCalendarView({ calendarId, currentUserId, initialEvents }: Props) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [selectedDate, setSelectedDate] = useState<string>(TODAY);
  const [eventModal, setEventModal] = useState<{ open: boolean; event: EventType | null }>({
    open: false,
    event: null,
  });
  const [backLoading, setBackLoading] = useState(false);

  // 日跨ぎも含め予定が存在する全日付を列挙してユニーク化
  const eventDates = [...new Set(events.flatMap((e) => {
    const dates: string[] = [];
    const cur = new Date(e.startTime);
    const end = new Date(e.endTime);
    cur.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);
    while (cur <= end) {
      dates.push(toLocalDate(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  }))];
  const fcEvents: EventInput[] = [
    // 選択日のハイライト（background表示）
    {
      id: "selected",
      start: selectedDate,
      display: "background",
      backgroundColor: "rgba(59, 130, 246, 0.3)",
    },
    // 予定ドット
    ...eventDates.map((date) => ({
      id: `dot-${date}`,
      start: date,
      backgroundColor: "transparent",
      borderColor: "transparent",
    })),
  ];

  const selectedDayEvents = events
    .filter((e) => {
      const start = new Date(e.startTime);
      const end = new Date(e.endTime);
      const sel = new Date(selectedDate);
      const selEnd = new Date(selectedDate);
      selEnd.setDate(selEnd.getDate() + 1);
      return start < selEnd && end > sel;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  const selectedDateLabel = (() => {
    const d = new Date(selectedDate + "T00:00:00");
    return d.toLocaleDateString("ja-JP", { month: "long", day: "numeric", weekday: "short" });
  })();


  function handleDateClick(arg: { dateStr: string }) {
    setSelectedDate(arg.dateStr);
  }

  function handleEventClick(arg: { event: { startStr: string } }) {
    const dateStr = arg.event.startStr.split("T")[0];
    setSelectedDate(dateStr);
  }

  return (
    <div className="h-screen bg-[#0f0f0f] text-white flex flex-col">
      {/* ヘッダー */}
      <header className="border-b border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0">
        <button
          onClick={() => { setBackLoading(true); router.push("/calendars"); }}
          disabled={backLoading}
          className="text-zinc-400 hover:text-white transition flex items-center gap-1 text-sm"
        >
          {backLoading ? <Spinner /> : "←"} 戻る
        </button>
        <span className="font-bold">マイカレンダー</span>
        <button
          onClick={() => setEventModal({ open: true, event: null })}
          className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center text-lg leading-none transition"
        >
          ＋
        </button>
      </header>

      {/* カレンダー */}
      <div className="calendar-wrapper my-calendar-wrapper shrink-0 px-2 pt-2">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ja"
          events={fcEvents}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          eventContent={(arg) => {
            if (arg.event.id === "selected") return null;
            return (
              <div className="flex justify-center w-full py-0.5">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
              </div>
            );
          }}
          headerToolbar={{ left: "prev", center: "title", right: "next" }}
          height="auto"
          dayMaxEvents={1}
          fixedWeekCount={false}
          dayCellContent={(arg) => arg.dayNumberText.replace("日", "")}
        />
      </div>

      {/* 選択日の予定リスト */}
      <div className="flex-1 overflow-y-auto px-4 pt-4 pb-8">
        <p className="text-sm text-zinc-400 mb-3">{selectedDateLabel}</p>
        {selectedDayEvents.length === 0 ? (
          <p className="text-zinc-600 text-sm text-center py-8">予定はありません</p>
        ) : (
          <ul className="space-y-2">
            {selectedDayEvents.map((ev) => (
              <li key={ev.id}>
                <button
                  onClick={() => setEventModal({ open: true, event: ev })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-left hover:border-zinc-600 active:scale-[0.98] active:opacity-75 transition flex items-center gap-3"
                >
                  <div className="w-1 h-10 rounded-full bg-blue-500 shrink-0" />
                  <div>
                    <p className="font-medium text-sm">{ev.title}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {(() => {
                        const isMultiDay = new Date(ev.startTime).toDateString() !== new Date(ev.endTime).toDateString();
                        return isMultiDay
                          ? `${fmtDateTime(ev.startTime)} 〜 ${fmtDateTime(ev.endTime)}`
                          : `${fmtTime(ev.startTime)} 〜 ${fmtTime(ev.endTime)}`;
                      })()}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* イベントモーダル */}
      {eventModal.open && (
        <EventModal
          calendarId={calendarId}
          currentUserId={currentUserId}
          selectedDate={selectedDate}
          selectedEvent={eventModal.event}
          onClose={() => setEventModal({ open: false, event: null })}
          onCreated={(ev) => setEvents((prev) => [...prev, ev])}
          onUpdated={(ev) => setEvents((prev) => prev.map((e) => (e.id === ev.id ? ev : e)))}
          onDeleted={(id) => setEvents((prev) => prev.filter((e) => e.id !== id))}
          showRegistrant={false}
        />
      )}
    </div>
  );
}
