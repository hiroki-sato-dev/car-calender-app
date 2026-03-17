"use client";

import { EventType } from "@/types/event";

type Props = {
  date: string;
  events: EventType[];
  userColors: Record<number, string>;
  onClose: () => void;
  onCreateClick: () => void;
  onEventClick: (event: EventType) => void;
};

export default function DayModal({
  date,
  events,
  userColors,
  onClose,
  onCreateClick,
  onEventClick,
}: Props) {
  const d = new Date(date + "T00:00:00");
  const label = d.toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  const fmt = (iso: string) => {
    const d = new Date(iso);
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg text-white">{label}</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">
            ×
          </button>
        </div>

        {/* 予定リスト */}
        {events.length === 0 ? (
          <p className="text-zinc-500 text-sm text-center py-6">予定はありません</p>
        ) : (
          <ul className="space-y-2 mb-4">
            {events.map((e) => (
              <li key={e.id}>
                <button
                  onClick={() => onEventClick(e)}
                  className="w-full text-left flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 rounded-xl px-4 py-3 transition"
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: userColors[e.userId] ?? "#3b82f6" }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{e.title}</p>
                    <p className="text-zinc-400 text-xs mt-0.5">
                      {fmt(e.startTime)} 〜 {fmt(e.endTime)}　{e.userName}
                    </p>
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}

        {/* 追加ボタン */}
        <button
          onClick={onCreateClick}
          className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition"
        >
          + この日に予定を追加
        </button>
      </div>
    </div>
  );
}
