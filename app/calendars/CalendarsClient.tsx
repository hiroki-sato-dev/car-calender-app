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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  }

  function copyCode(id: number, code: string) {
    navigator.clipboard.writeText(code);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

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
    <div className="min-h-screen bg-[#0f0f0f] text-white" onClick={() => setUserMenuOpen(false)}>
      {/* ヘッダー */}
      <header className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between">
        <span className="font-bold text-lg">シェアカレンダー</span>
        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setUserMenuOpen((v) => !v)}
            className="text-sm text-zinc-300 hover:text-white transition px-2 py-1 rounded-lg hover:bg-zinc-800"
          >
            {userName}
          </button>
          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-1 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50 min-w-32">
              <button
                onClick={handleLogout}
                className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-zinc-700 transition"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-lg mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold">登録済みカレンダー</h1>
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
              <li key={cal.id} className="bg-zinc-900 border border-zinc-800 rounded-xl hover:border-zinc-600 active:scale-[0.98] active:opacity-75 transition cursor-pointer">
                <button
                  onClick={() => router.push(`/calendar/${cal.id}`)}
                  className="w-full text-left px-5 pt-4 pb-3"
                >
                  <p className="font-semibold">{cal.name}</p>
                </button>
                <div className="flex items-center justify-between px-5 pb-3">
                  <p className="text-zinc-500 text-xs">コード: {cal.shareCode}</p>
                  <button
                    onClick={() => copyCode(cal.id, cal.shareCode)}
                    className="text-xs text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-md px-2 py-1 transition"
                  >
                    {copied === cal.id ? "コピーしました" : "コピー"}
                  </button>
                </div>
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
