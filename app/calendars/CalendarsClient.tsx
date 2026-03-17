"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createCalendar, joinCalendar } from "@/actions/calendar";

type Calendar = {
  id: number;
  name: string;
  shareCode: string;
};

type Props = {
  calendars: Calendar[];
  userName: string;
};

export default function CalendarsClient({ calendars: initial, userName }: Props) {
  const router = useRouter();
  const [calendars, setCalendars] = useState(initial);
  const [modal, setModal] = useState<"create" | "join" | "code" | null>(null);
  const [inputName, setInputName] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [newShareCode, setNewShareCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    if (!inputName.trim()) return;
    setLoading(true);
    setError(null);
    const result = await createCalendar(inputName.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.calendar) {
      setCalendars((prev) => [...prev, result.calendar!]);
      setNewShareCode(result.calendar.shareCode);
      setInputName("");
      setModal("code");
    }
  }

  async function handleJoin() {
    if (!inputCode.trim()) return;
    setLoading(true);
    setError(null);
    const result = await joinCalendar(inputCode.trim().toUpperCase());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else if (result.calendar) {
      setCalendars((prev) => [...prev, result.calendar!]);
      setInputCode("");
      setModal(null);
    }
  }

  function closeModal() {
    setModal(null);
    setInputName("");
    setInputCode("");
    setError(null);
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* ヘッダー */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg">シェアカレンダー</span>
        <span className="text-zinc-400 text-sm">{userName}</span>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">カレンダー一覧</h1>
          <div className="flex gap-2">
            <button
              onClick={() => { setModal("join"); setError(null); }}
              className="text-sm px-4 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition"
            >
              参加
            </button>
            <button
              onClick={() => { setModal("create"); setError(null); }}
              className="text-sm px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition"
            >
              ＋ 作成
            </button>
          </div>
        </div>

        {/* カレンダーリスト */}
        {calendars.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <p>カレンダーがありません</p>
            <p className="text-sm mt-1">作成または共有コードで参加してください</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {calendars.map((cal) => (
              <li key={cal.id}>
                <button
                  onClick={() => router.push(`/calendar/${cal.id}`)}
                  className="w-full text-left bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-4 hover:border-zinc-600 transition"
                >
                  <p className="font-semibold">{cal.name}</p>
                  <p className="text-zinc-500 text-xs mt-1">コード: {cal.shareCode}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </main>

      {/* モーダル背景 */}
      {modal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center px-4 z-50"
          onClick={closeModal}
        >
          <div
            className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* 作成モーダル */}
            {modal === "create" && (
              <>
                <h2 className="font-bold text-lg mb-4">カレンダーを作成</h2>
                <input
                  type="text"
                  placeholder="カレンダー名（例: 田中家の車）"
                  value={inputName}
                  onChange={(e) => setInputName(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition text-sm">
                    キャンセル
                  </button>
                  <button onClick={handleCreate} disabled={loading} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-sm disabled:opacity-40">
                    {loading ? "作成中..." : "作成"}
                  </button>
                </div>
              </>
            )}

            {/* 参加モーダル */}
            {modal === "join" && (
              <>
                <h2 className="font-bold text-lg mb-4">カレンダーに参加</h2>
                <input
                  type="text"
                  placeholder="共有コード（例: AB1234）"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                />
                {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
                <div className="flex gap-2">
                  <button onClick={closeModal} className="flex-1 py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition text-sm">
                    キャンセル
                  </button>
                  <button onClick={handleJoin} disabled={loading} className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-sm disabled:opacity-40">
                    {loading ? "参加中..." : "参加"}
                  </button>
                </div>
              </>
            )}

            {/* 共有コード表示モーダル */}
            {modal === "code" && (
              <>
                <h2 className="font-bold text-lg mb-2">カレンダーを作成しました</h2>
                <p className="text-zinc-400 text-sm mb-4">このコードを家族に共有してください</p>
                <div className="bg-zinc-800 rounded-xl py-4 text-center mb-4">
                  <p className="text-3xl font-bold tracking-widest text-blue-400">{newShareCode}</p>
                </div>
                <button
                  onClick={() => { navigator.clipboard.writeText(newShareCode); }}
                  className="w-full py-2 rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition text-sm mb-2"
                >
                  コードをコピー
                </button>
                <button onClick={closeModal} className="w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition text-sm">
                  閉じる
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
