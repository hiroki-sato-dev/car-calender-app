"use client";

import { useState } from "react";
import { EventType } from "@/types/event";
import { createEvent, updateEvent, deleteEvent } from "@/actions/event";
import Spinner from "@/components/ui/Spinner";

type Props = {
  calendarId: number;
  currentUserId: number;
  selectedDate: string | null;
  selectedEvent: EventType | null;
  onClose: () => void;
  onCreated: (event: EventType) => void;
  onUpdated: (event: EventType) => void;
  onDeleted: (eventId: number) => void;
};

export default function EventModal({
  calendarId,
  currentUserId,
  selectedDate,
  selectedEvent,
  onClose,
  onCreated,
  onUpdated,
  onDeleted,
}: Props) {
  const toDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  const toTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  const [title, setTitle] = useState(selectedEvent?.title ?? "");
  const [memo, setMemo] = useState(selectedEvent?.memo ?? "");
  const [startDate, setStartDate] = useState(selectedEvent ? toDate(selectedEvent.startTime) : (selectedDate ?? ""));
  const [startTime, setStartTime] = useState(selectedEvent ? toTime(selectedEvent.startTime) : "09:00");
  const [endDate, setEndDate] = useState(selectedEvent ? toDate(selectedEvent.endTime) : (selectedDate ?? ""));
  const [endTime, setEndTime] = useState(selectedEvent ? toTime(selectedEvent.endTime) : "10:00");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const isOwner = selectedEvent ? selectedEvent.userId === currentUserId : true;
  const [mode, setMode] = useState<"view" | "edit" | "create">(
    selectedEvent ? "view" : "create"
  );

  async function handleCreate() {
    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    if (!startDate || !endDate) { setError("日付を入力してください"); return; }
    setLoading(true);
    setError(null);

    const result = await createEvent({
      calendarId,
      title,
      memo,
      startTime: `${startDate}T${startTime}`,
      endTime: `${endDate}T${endTime}`,
    });
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.event) {
      onCreated(result.event);
      onClose();
    }
  }

  async function handleUpdate() {
    if (!selectedEvent) return;
    if (!title.trim()) { setError("タイトルを入力してください"); return; }
    setLoading(true);
    setError(null);
    const result = await updateEvent(selectedEvent.id, {
      title,
      memo,
      startTime: `${startDate}T${startTime}`,
      endTime: `${endDate}T${endTime}`,
    });
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.event) {
      onUpdated(result.event);
      onClose();
    }
  }

  async function handleDelete() {
    if (!selectedEvent) return;
    setLoading(true);
    const result = await deleteEvent(selectedEvent.id);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      onDeleted(selectedEvent.id);
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 flex items-end sm:items-center justify-center z-50 px-0 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-700 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-bold text-lg text-white">
            {mode === "view" ? "予定の詳細" : mode === "edit" ? "予定を編集" : "予定を作成"}
          </h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white text-xl">×</button>
        </div>

        {mode === "view" && selectedEvent ? (
          /* 詳細表示 */
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-zinc-500 text-xs mb-1">タイトル</p>
              <p className="text-white font-medium">{selectedEvent.title}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">登録者</p>
              <p className="text-white">{selectedEvent.userName}</p>
            </div>
            <div>
              <p className="text-zinc-500 text-xs mb-1">日時</p>
              <p className="text-white">
                {(() => {
                  const s = new Date(selectedEvent.startTime);
                  const e = new Date(selectedEvent.endTime);
                  const isMultiDay = s.toDateString() !== e.toDateString();
                  const startStr = s.toLocaleString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" });
                  const endStr = isMultiDay
                    ? e.toLocaleString("ja-JP", { month: "numeric", day: "numeric", weekday: "short", hour: "2-digit", minute: "2-digit" })
                    : e.toLocaleString("ja-JP", { hour: "2-digit", minute: "2-digit" });
                  return <>{startStr} 〜 {endStr}</>;
                })()}
              </p>
            </div>
            {selectedEvent.memo && (
              <div>
                <p className="text-zinc-500 text-xs mb-1">メモ</p>
                <p className="text-white">{selectedEvent.memo}</p>
              </div>
            )}
            {error && <p className="text-red-400 text-sm">{error}</p>}
            {isOwner && (
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setMode("edit")}
                  className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition text-sm"
                >
                  編集
                </button>
                <button
                  onClick={handleDelete}
                  disabled={loading}
                  className="flex-1 py-2.5 rounded-lg bg-red-600/20 border border-red-600/40 text-red-400 hover:bg-red-600/30 transition text-sm disabled:opacity-40 flex items-center justify-center gap-2"
                >
                  {loading && <Spinner />}
                  {loading ? "削除中..." : "削除"}
                </button>
              </div>
            )}
          </div>
        ) : (
          /* 作成・編集フォーム */
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-zinc-400 mb-1">タイトル</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="例: 買い物"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-zinc-400 mb-1">開始</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-28 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs text-zinc-400 mb-1">終了</label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-28 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
            <div>
              <label className="block text-xs text-zinc-400 mb-1">メモ（任意）</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="例: スーパーへ"
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={() => mode === "edit" ? setMode("view") : onClose()}
                className="flex-1 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={mode === "edit" ? handleUpdate : handleCreate}
                disabled={loading}
                className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-sm disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading && <Spinner />}
                {loading ? "処理中..." : mode === "edit" ? "保存" : "登録"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
