# 開発ロードマップ

## 実現可能性の評価

| 観点 | 評価 | コメント |
|------|------|---------|
| 技術スタック | ✅ 問題なし | Next.js + Prisma + Vercel は鉄板構成 |
| 機能スコープ | ✅ 適切 | 個人開発 1 週間規模として現実的 |
| 外部連携 | ⚠️ 要注意 | LINE Bot のみ外部依存あり（設定手順あり） |
| インフラコスト | ✅ 低コスト | Vercel 無料枠 + Supabase/Neon 無料枠で運用可能 |

---

## フェーズ構成

```
Phase 0: 環境構築        (0.5日)
Phase 1: 認証            (1日)
Phase 2: カレンダー管理  (2日)
Phase 3: 予定管理        (2日)
Phase 4: LINE 連携       (1日)
Phase 5: 仕上げ・デプロイ (0.5日)
─────────────────────────────────
合計                      約7日
```

---

## Phase 0: 環境構築（0.5日）

**目標:** 開発が始められる状態を作る

### タスク

- [ ] `create-next-app` でプロジェクト作成（TypeScript + TailwindCSS）
- [ ] 必要パッケージのインストール

```bash
npm install prisma @prisma/client
npm install jsonwebtoken bcryptjs
npm install @fullcalendar/react @fullcalendar/daygrid @fullcalendar/interaction
npm install @line/bot-sdk
npm install -D @types/jsonwebtoken @types/bcryptjs
```

- [ ] `prisma/schema.prisma` 作成・`npx prisma migrate dev` 実行
- [ ] クラウド DB（Neon または Supabase）のセットアップ
- [ ] `.env.local` に環境変数を設定

```env
DATABASE_URL=
JWT_SECRET=
LINE_CHANNEL_ACCESS_TOKEN=
LINE_CHANNEL_SECRET=
```

- [ ] ディレクトリ構成を仕様書通りに作成

### 完了基準
- `npm run dev` でトップページが表示される
- `npx prisma studio` で DB テーブルが確認できる

---

## Phase 1: 認証（1日）

**目標:** ユーザー登録・ログイン・JWT 管理ができる状態

### タスク

#### バックエンド
- [ ] `lib/auth.ts` — JWT の発行・検証ユーティリティ
- [ ] `actions/auth.ts` — `register()` / `login()` Server Actions
  - パスワード bcrypt ハッシュ化
  - name 重複チェック
  - JWT 発行・Cookie 保存

#### フロントエンド
- [ ] `app/login/page.tsx` — ログイン・登録フォーム画面
- [ ] ログイン後のリダイレクト処理（`/calendars` へ）
- [ ] 未ログイン時のリダイレクト処理（ミドルウェア）

#### ファイル
```
lib/auth.ts          # JWT 発行・検証
actions/auth.ts      # register / login
app/login/page.tsx   # UI
middleware.ts        # 認証ガード
```

### 完了基準
- ユーザー登録・ログインができる
- ログイン状態が Cookie で維持される
- 未ログインで `/calendars` にアクセスすると `/login` にリダイレクトされる

---

## Phase 2: カレンダー管理（2日）

**目標:** カレンダーの作成・参加・一覧表示ができる状態

### Day 1: バックエンド

- [ ] `actions/calendar.ts` の実装

```typescript
createCalendar(name: string)
  // shareCode をランダム生成（nanoid等）
  // DB に保存
  // 作成者を calendar_members に追加

joinCalendar(shareCode: string)
  // shareCode で Calendar を検索
  // calendar_members に追加（重複チェックあり）

getCalendars()
  // ログインユーザーが参加中のカレンダー一覧を返す
```

### Day 2: フロントエンド

- [ ] `app/calendars/page.tsx` — カレンダー一覧画面
  - カレンダー名一覧の表示
  - 「作成」モーダル（カレンダー名入力）
  - 「参加」モーダル（共有コード入力）
  - 作成後に shareCode を表示してコピーできるように

- [ ] `app/calendar/[id]/page.tsx` — 個別カレンダー画面（骨格のみ）

#### ファイル
```
actions/calendar.ts
app/calendars/page.tsx
app/calendar/[id]/page.tsx
components/calendar/CalendarView.tsx  # 骨格
```

### 完了基準
- カレンダーを作成し、共有コードが発行される
- 別ユーザーが共有コードで参加できる
- 参加中のカレンダー一覧が表示される

---

## Phase 3: 予定管理（2日）

**目標:** カレンダーに予定を登録・表示・削除できる状態

### Day 1: バックエンド

- [ ] `actions/event.ts` の実装

```typescript
getEvents(calendarId: number)
  // カレンダーIDに紐づくイベント一覧を返す

createEvent(data: EventInput)
  // 重複チェック（SQL: start_time < new_end AND end_time > new_start）
  // 重複あり → エラーを返す
  // DB 保存
  // LINE 通知送信（後のフェーズで接続）

updateEvent(id: number, data: Partial<EventInput>)
deleteEvent(id: number)
```

- [ ] `types/event.ts` / `types/calendar.ts` — 型定義

### Day 2: フロントエンド

- [ ] `components/calendar/CalendarView.tsx` — FullCalendar の実装
  - 月表示（`dayGridMonth`）
  - イベントの表示（`13:00-17:00 / 兄 / ドライブ` 形式）
  - 日付クリックでモーダルを開く

- [ ] `components/event/EventModal.tsx` — 予定作成・編集モーダル
  - 入力項目: 開始時間 / 終了時間 / タイトル / メモ
  - 重複エラーのメッセージ表示
  - 予定のクリックで削除ボタンを表示

#### ファイル
```
actions/event.ts
types/event.ts
types/calendar.ts
components/calendar/CalendarView.tsx
components/event/EventModal.tsx
```

### 完了基準
- カレンダーに予定を登録・表示できる
- 時間が重複する予定はエラーになる
- 予定を削除できる

---

## Phase 4: LINE 連携（1日）

**目標:** 予定登録時に LINE グループへ通知が届く

### 前提作業（開発前に必要）
- LINE Developers でチャンネル作成
- Messaging API チャンネルのアクセストークン取得

### タスク

- [ ] `app/api/line/webhook/route.ts` — Webhook エンドポイント
  - Bot がグループに追加された際に `groupId` を取得
  - 対象カレンダーの `lineGroupId` に保存

- [ ] `lib/line.ts` — LINE 通知ユーティリティ

```typescript
sendLineNotification(groupId: string, event: Event, user: User)
// メッセージ例:
// 🚗 車の予定
// 兄
// 4/10 13:00〜17:00
// 用途: ドライブ
```

- [ ] `createEvent()` に LINE 通知を接続
- [ ] カレンダー設定画面に LINE グループ連携の説明を追加

#### ファイル
```
app/api/line/webhook/route.ts
lib/line.ts
```

### 完了基準
- Bot をグループに追加すると `lineGroupId` が保存される
- 予定登録時に LINE グループへ通知が届く

---

## Phase 5: 仕上げ・デプロイ（0.5日）

**目標:** 本番環境で動作する

### タスク

- [ ] スマートフォン向けレスポンシブ調整（TailwindCSS）
- [ ] エラーハンドリングの確認・改善
- [ ] Vercel にデプロイ
  - 環境変数を Vercel ダッシュボードに設定
  - `DATABASE_URL` / `JWT_SECRET` / LINE 関連トークン
- [ ] 本番 DB への migrate 実行
- [ ] LINE Webhook URL を本番 URL に更新
- [ ] 動作確認（登録〜通知の一連フロー）

### 完了基準
- スマートフォンブラウザで全機能が動作する
- LINE 通知が本番環境で届く

---

## 技術的な注意点

### JWT の保存場所
Cookie（`httpOnly`）への保存を推奨。`localStorage` はXSS に弱い。

### LINE Webhook の署名検証
`@line/bot-sdk` の `validateSignature()` を必ず実装すること。

### Server Actions のエラーハンドリング
`try/catch` で包み、クライアントへは `{ success: false, error: string }` 形式で返すと UI 側が扱いやすい。

### DB の選定
| サービス | 無料枠 | 備考 |
|---------|--------|------|
| **Neon** | 0.5GB | Vercel との相性が良い（推奨） |
| Supabase | 500MB | ダッシュボードが使いやすい |
| Railway | $5/月 | 無料枠なし（有料） |

---

## 開発順序の根拠

```
環境構築 → 認証 → カレンダー管理 → 予定管理 → LINE → デプロイ
```

- 認証を最初に作ることで、以降の全機能でログインユーザーを前提にできる
- カレンダー管理が完成してから予定管理に入ることで、外部キー制約を正しく扱える
- LINE は独立した機能なので最後に接続するのが最も安全
