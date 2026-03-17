"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import FullCalendar from "@fullcalendar/react";
import { EventInput, EventClickArg } from "@fullcalendar/core";
import dayGridPlugin from "@fullcalendar/daygrid";
import interactionPlugin from "@fullcalendar/interaction";
import { EventType } from "@/types/event";
import EventModal from "@/components/event/EventModal";
import DayModal from "@/components/calendar/DayModal";

type Member = { userId: number; name: string; color: string };

type Props = {
  calendarId: number;
  calendarName: string;
  initialEvents: EventType[];
  currentUserId: number;
  userColors: Record<number, string>;
  memberList: Member[];
  hasLineGroup: boolean;
  shareCode: string;
};

export default function CalendarView({
  calendarId,
  calendarName,
  initialEvents,
  currentUserId,
  userColors,
  memberList,
  hasLineGroup,
  shareCode,
}: Props) {
  const router = useRouter();
  const [events, setEvents] = useState(initialEvents);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [dayModalOpen, setDayModalOpen] = useState(false);
  const [eventModalOpen, setEventModalOpen] = useState(false);

  const fcEvents: EventInput[] = events.flatMap((e): EventInput[] => {
    const startD = new Date(e.startTime);
    const endD = new Date(e.endTime);
    const isMultiDay = startD.toDateString() !== endD.toDateString();
    const color = userColors[e.userId] ?? "#3b82f6";
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    if (isMultiDay) {
      const exclusiveEnd = new Date(endD.getFullYear(), endD.getMonth(), endD.getDate() + 1);
      return [{
        id: String(e.id),
        title: "",
        start: fmt(startD),
        end: fmt(exclusiveEnd),
        allDay: true,
        backgroundColor: color,
        borderColor: "transparent",
        classNames: ["fc-event-bar-item"],
        order: 0,
        extendedProps: { event: e, isMultiDay: true },
      }];
    }

    return [{
      id: String(e.id),
      title: `${e.userName} ${e.title}`,
      start: e.startTime,
      end: e.endTime,
      backgroundColor: color,
      borderColor: color,
      classNames: ["fc-event-dot-item"],
      order: 1,
      extendedProps: { event: e, isMultiDay: false },
    }];
  });

  function handleDateClick(info: { dateStr: string }) {
    setSelectedDate(info.dateStr);
    setSelectedEvent(null);
    setDayModalOpen(true);
  }

  function handleEventClick(info: EventClickArg) {
    const date = (info.event.extendedProps.event as EventType).startTime.slice(0, 10);
    setSelectedDate(date);
    setSelectedEvent(null);
    setDayModalOpen(true);
  }

  function handleDayEventClick(event: EventType) {
    setSelectedEvent(event);
    setDayModalOpen(false);
    setEventModalOpen(true);
  }

  function handleCreateFromDay() {
    setSelectedEvent(null);
    setDayModalOpen(false);
    setEventModalOpen(true);
  }

  function handleCreated(event: EventType) {
    setEvents((prev) => [...prev, event]);
  }

  function handleUpdated(event: EventType) {
    setEvents((prev) => prev.map((e) => e.id === event.id ? event : e));
  }

  function handleDeleted(eventId: number) {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* ヘッダー */}
      <header className="border-b border-zinc-800 px-4 py-3">
        <div className="flex items-center gap-3 mb-2">
          <button
            onClick={() => router.push("/calendars")}
            className="text-zinc-400 hover:text-white transition text-sm"
          >
            ← 戻る
          </button>
          <h1 className="font-bold text-lg">{calendarName}</h1>
        </div>
        <div className="flex flex-wrap gap-3">
          {memberList.map(({ userId, name, color }) => (
            <div key={userId} className="flex items-center gap-1.5 text-xs text-zinc-400">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              {name}
            </div>
          ))}
        </div>
        {!hasLineGroup && (
          <div className="mt-3 p-3 rounded-lg bg-zinc-900 border border-zinc-700 text-xs text-zinc-300 space-y-2">
            <p className="font-semibold text-white">LINE通知を設定する</p>
            <p>① LINEグループにBotを追加</p>
            <a
              href="https://line.me/R/ti/p/@937alenh"
              target="_blank"
              rel="noreferrer"
              className="inline-block px-3 py-1.5 rounded bg-[#06C755] text-white font-semibold text-xs"
            >
              LINE Bot を追加
            </a>
            <p>② グループで以下のコードを送信</p>
            <div className="flex items-center gap-2">
              <code className="bg-zinc-800 px-2 py-1 rounded text-zinc-100">
                登録コード: {shareCode}
              </code>
              <button
                onClick={() => navigator.clipboard.writeText(`登録コード: ${shareCode}`)}
                className="text-zinc-400 hover:text-white text-xs underline"
              >
                コピー
              </button>
            </div>
          </div>
        )}
      </header>

      {/* カレンダー */}
      <div className="p-2 calendar-wrapper">
        <FullCalendar
          plugins={[dayGridPlugin, interactionPlugin]}
          initialView="dayGridMonth"
          locale="ja"
          dayCellContent={(e) => e.dayNumberText.replace("日", "")}
          events={fcEvents}
          eventOrder={["order", "start"]}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          headerToolbar={{
            left: "prev",
            center: "title",
            right: "next",
          }}
          height="auto"
          dayMaxEvents={false}
          dayCellClassNames="cursor-pointer"
          eventContent={(arg) => {
            const color = arg.event.backgroundColor ?? "#3b82f6";
            if (arg.event.classNames.includes("fc-event-bar-item")) {
              return (
                <div
                  style={{
                    height: "5px",
                    backgroundColor: color,
                    borderRadius: "3px",
                    width: "100%",
                    position: "relative",
                    zIndex: 4,
                  }}
                />
              );
            }
            return (
              <span
                style={{ backgroundColor: color }}
                className="fc-dot-event"
              />
            );
          }}
        />
      </div>

      {/* 日付モーダル */}
      {dayModalOpen && selectedDate && (
        <DayModal
          date={selectedDate}
          events={events.filter((e) => {
            const dayStart = new Date(selectedDate + "T00:00:00");
            const dayEnd = new Date(selectedDate + "T23:59:59");
            return new Date(e.startTime) <= dayEnd && new Date(e.endTime) >= dayStart;
          })}
          userColors={userColors}
          onClose={() => setDayModalOpen(false)}
          onCreateClick={handleCreateFromDay}
          onEventClick={handleDayEventClick}
        />
      )}

      {/* 予定作成・詳細モーダル */}
      {eventModalOpen && (
        <EventModal
          calendarId={calendarId}
          currentUserId={currentUserId}
          selectedDate={selectedDate}
          selectedEvent={selectedEvent}
          onClose={() => setEventModalOpen(false)}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      )}
    </div>
  );
}
