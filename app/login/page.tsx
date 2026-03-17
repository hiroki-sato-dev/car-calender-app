"use client";

import { useState } from "react";

export default function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.get("name"),
          password: formData.get("password"),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "エラーが発生しました");
        setLoading(false);
      } else {
        window.location.href = "/calendars";
      }
    } catch {
      setError("エラーが発生しました。もう一度お試しください");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f0f0f] px-4">
      <div className="w-full max-w-sm">
        {/* ロゴ */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-white tracking-tight">
            シェアカレンダー
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            {mode === "login" ? "アカウントにログイン" : "新規アカウント作成"}
          </p>
        </div>

        {/* カード */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                名前
              </label>
              <input
                name="name"
                type="text"
                required
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="例: taro"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                パスワード
              </label>
              <input
                name="password"
                type="password"
                required
                className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                placeholder="6文字以上"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed mt-2"
            >
              {loading ? "処理中..." : mode === "login" ? "ログイン" : "登録する"}
            </button>
          </form>

          <div className="border-t border-zinc-800 mt-6 pt-6">
            <p className="text-center text-sm text-zinc-500">
              {mode === "login" ? (
                <>
                  アカウントをお持ちでない方は{" "}
                  <button
                    onClick={() => { setMode("register"); setError(null); }}
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    新規登録
                  </button>
                </>
              ) : (
                <>
                  すでにアカウントをお持ちの方は{" "}
                  <button
                    onClick={() => { setMode("login"); setError(null); }}
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    ログイン
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
