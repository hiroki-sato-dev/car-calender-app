# 車共有カレンダーアプリ 技術仕様書

## 目次

1. [概要](#1-概要)
2. [技術スタック](#2-技術スタック)
3. [リポジトリ構成](#3-リポジトリ構成)
4. [データベース設計](#4-データベース設計)
5. [Prisma スキーマ](#5-prisma-スキーマ)
6. [認証仕様](#6-認証仕様)
7. [Server Actions](#7-server-actions)
8. [カレンダー UI](#8-カレンダー-ui)
9. [イベント管理](#9-イベント管理)
10. [重複チェック](#10-重複チェック)
11. [LINE 通知](#11-line-通知)
12. [UI 画面](#12-ui-画面)
13. [非機能要件](#13-非機能要件)
14. [開発スケジュール](#14-開発スケジュール)
15. [インフラ構成](#15-インフラ構成)

---

## 0. UI 方針

- 絵文字は使用しない（アイコンが必要な場合は SVG アイコンを使用する）
- 黒基調のダークテーマ（背景: `#0f0f0f`、カード: `zinc-900`）
- モバイルファースト（スマートフォンブラウザを主対象とする）
- viewport メタタグを設定し、スマートフォンの画面幅に合わせて表示する
- タップ可能な要素（`button`, `a`, カレンダーセル）はすべてタップフィードバックを付与する

---

## 1. 概要

家族やグループで 1 台の車を共有する際の利用予定を管理するカレンダーアプリ。

- ユーザーはカレンダーに参加し、車の使用予定を登録できる
- 予定登録時には LINE グループに通知が送信される
- 対象デバイス: スマートフォンブラウザ

---

## 2. 技術スタック

| 区分 | 技術 |
|------|------|
| フロントエンド | Next.js (App Router), TypeScript, FullCalendar, TailwindCSS |
| バックエンド | Next.js Server Actions, API Routes |
| ORM / DB | Prisma, PostgreSQL (Neon) |
| 認証 | JWT (jsonwebtoken), bcrypt |
| 外部サービス | LINE Messaging API (`@line/bot-sdk`) |
| デプロイ | Vercel |

---

## 3. リポジトリ構成

```
car-calendar-app/
├── app/
│   ├── layout.tsx             # viewport 設定・メタデータ
│   ├── page.tsx               # / → /calendars にリダイレクト
│   ├── login/
│   │   └── page.tsx           # ログイン・登録画面（クライアントコンポーネント）
│   ├── calendars/
│   │   ├── page.tsx           # サーバーコンポーネント（セッション取得・一覧取得）
│   │   └── CalendarsClient.tsx # クライアントコンポーネント（UI・モーダル管理）
│   ├── calendar/
│   │   └── [id]/
│   │       └── page.tsx       # サーバーコンポーネント（メンバー・イベント・lineGroupId 取得）
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts
│       │   ├── register/route.ts
│       │   └── logout/route.ts
│       └── line/
│           └── webhook/
│               └── route.ts
├── components/
│   ├── calendar/
│   │   ├── CalendarView.tsx   # FullCalendar ラッパー・モーダル制御・LINE設定案内
│   │   └── DayModal.tsx       # 日付クリック時の予定一覧モーダル
│   └── event/
│       └── EventModal.tsx     # 予定の作成・閲覧・編集モーダル
├── actions/
│   ├── calendar.ts            # createCalendar / joinCalendar / getCalendars
│   └── event.ts               # createEvent / updateEvent / deleteEvent / getEvents
├── lib/
│   ├── prisma.ts              # PrismaClient シングルトン
│   ├── auth.ts                # signToken / verifyToken / getSession
│   └── line.ts                # sendLineNotification / buildEventMessage
├── types/
│   └── event.ts               # EventType 型定義
├── middleware.ts               # ルート保護（Cookie 存在チェック）
└── prisma/
    └── schema.prisma
```

---

## 4. データベース設計

### users

| カラム名 | 型 | 説明 |
|----------|----|------|
| `id` | serial, PK | ユーザー ID |
| `name` | text, UNIQUE | ユーザー名 |
| `password_hash` | text | bcrypt ハッシュ化パスワード |
| `created_at` | timestamp | 作成日時 |

### calendars

| カラム名 | 型 | 説明 |
|----------|----|------|
| `id` | serial, PK | カレンダー ID |
| `name` | text | カレンダー名 |
| `share_code` | text, UNIQUE | 参加用 6 桁コード |
| `line_group_id` | text, nullable | LINE グループ ID |
| `created_by` | int | 作成者ユーザー ID |
| `created_at` | timestamp | 作成日時 |

### calendar_members

| カラム名 | 型 | 説明 |
|----------|----|------|
| `id` | serial, PK | ID |
| `calendar_id` | int, FK | calendars.id |
| `user_id` | int, FK | users.id |

### events

| カラム名 | 型 | 説明 |
|----------|----|------|
| `id` | serial, PK | イベント ID |
| `calendar_id` | int, FK | calendars.id |
| `user_id` | int, FK | users.id |
| `title` | text | 予定タイトル |
| `memo` | text, nullable | メモ |
| `start_time` | timestamp | 開始時間 |
| `end_time` | timestamp | 終了時間 |
| `created_at` | timestamp | 作成日時 |

---

## 5. Prisma スキーマ

```prisma
model User {
  id           Int              @id @default(autoincrement())
  name         String           @unique
  passwordHash String
  createdAt    DateTime         @default(now())
  calendars    CalendarMember[]
  events       Event[]
}

model Calendar {
  id          Int              @id @default(autoincrement())
  name        String
  shareCode   String           @unique
  lineGroupId String?
  createdBy   Int
  createdAt   DateTime         @default(now())
  members     CalendarMember[]
  events      Event[]
}

model CalendarMember {
  id         Int      @id @default(autoincrement())
  calendarId Int
  userId     Int
  calendar   Calendar @relation(fields: [calendarId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
}

model Event {
  id         Int      @id @default(autoincrement())
  calendarId Int
  userId     Int
  title      String
  memo       String?
  startTime  DateTime
  endTime    DateTime
  createdAt  DateTime @default(now())
  calendar   Calendar @relation(fields: [calendarId], references: [id])
  user       User     @relation(fields: [userId], references: [id])
}
```

---

## 6. 認証仕様

- JWT 認証（`jsonwebtoken` ライブラリ）
- パスワードは bcrypt でハッシュ化
- JWT は httpOnly Cookie (`token`) に保存（`sameSite: "lax"`, `secure: true` in production）
- **認証は API Routes で実装**（Server Actions 非使用）
  - 理由: Server Actions 内で `redirect()` を使用するとクライアント側の try/catch に捕捉されて処理が止まるため

### Register

```
POST /api/auth/register
Body: { name: string, password: string }
```

処理フロー:
1. `name` 重複チェック
2. bcrypt でパスワードをハッシュ化
3. DB に保存
4. JWT 発行・httpOnly Cookie にセット
5. `{ success: true }` を返す

### Login

```
POST /api/auth/login
Body: { name: string, password: string }
```

処理フロー:
1. ユーザー検索
2. bcrypt でパスワード照合
3. JWT 発行・httpOnly Cookie にセット
4. `{ success: true }` を返す

### Logout

```
POST /api/auth/logout
```

Cookie の `maxAge` を 0 に設定してトークンを削除。

### Middleware

- `middleware.ts` がすべてのページリクエストを保護
- Cookie に `token` が存在しない場合のみ `/login` にリダイレクト
- JWT の中身の検証は行わない（`jsonwebtoken` が Edge Runtime 非対応のため）
- `/api/*` は matcher から除外（保護対象外）

### セッション取得

Server Actions・API Routes 内では `getSession()` を使用:

```typescript
// lib/auth.ts
export async function getSession(): Promise<{ userId: number } | null>
```

---

## 7. Server Actions

認証は API Routes に移行済み。Server Actions はカレンダー・イベント操作に使用する。

### `actions/calendar.ts`

| 関数 | 引数 | 戻り値 | 説明 |
|------|------|--------|------|
| `createCalendar(name)` | `string` | `{ calendar } \| { error }` | カレンダー作成・共有コード生成 |
| `joinCalendar(shareCode)` | `string` | `{ calendar } \| { error }` | 共有コードでカレンダー参加 |
| `getCalendars()` | - | `Calendar[]` | 参加中カレンダー一覧取得 |

### `actions/event.ts`

| 関数 | 引数 | 戻り値 | 説明 |
|------|------|--------|------|
| `getEvents(calendarId)` | `number` | `EventType[]` | 予定一覧取得（userName 含む） |
| `createEvent(data)` | `{ calendarId, title, memo, startTime, endTime }` | `{ event } \| { error }` | 予定作成（重複チェック・LINE通知あり） |
| `updateEvent(eventId, data)` | `number, { title, memo, startTime, endTime }` | `{ event } \| { error }` | 予定更新（オーナーのみ） |
| `deleteEvent(eventId)` | `number` | `{ success } \| { error }` | 予定削除（オーナーのみ） |

---

## 8. カレンダー UI

### FullCalendar 設定

- プラグイン: `dayGridPlugin`, `interactionPlugin`
- 表示: `dayGridMonth`（月表示固定）
- ロケール: `ja`
- 日付セル: 数字のみ表示（"日" サフィックスを除去）
- `dayMaxEvents: false`（CSS で高さ制限、+more リンク非表示）

### ユーザーカラー

参加順に以下の 6 色を割り当て（循環）:

```
#3b82f6（青）、#22c55e（緑）、#f97316（オレンジ）
#a855f7（紫）、#ec4899（ピンク）、#14b8a6（ティール）
```

カレンダーヘッダーにメンバー名とカラードットを表示。

### イベント表示

| 種別 | 表示方法 | 実装 |
|------|----------|------|
| 1日内の予定 | ユーザーカラーの丸ドット | timed event + `eventContent` でドット描画 |
| 日跨ぎの予定 | ユーザーカラーの横バー（セル上部） | `allDay: true` スパニングイベント + CSS スタイリング |

#### 日跨ぎイベントのバー表示の詳細

- `allDay: true` で開始日〜終了日（exclusive end）を設定したスパニングイベントを生成
- `classNames: ["fc-event-bar-item"]` でドットと区別
- `order: 0`（ドットは `order: 1`）でバーをセル上部に配置
- CSS `.fc-event.fc-event-bar-item` に `height: 6px; border-radius: 3px` を適用
- `.fc-event-main { display: none }` でデフォルトのタイトルテキストを非表示
- セルフレームの CSS を `overflow-x: visible; overflow-y: clip` とすることでバーが隣接セルにまたがって表示される

#### セル高さの均一化

```css
.calendar-wrapper .fc .fc-daygrid-day-frame {
  height: 64px !important;
  overflow-x: visible !important;
  overflow-y: clip !important;
}
```

`overflow-y: clip` を使用することで、縦方向のオーバーフローを切り取りつつ、スパニングイベントが横方向に隣接セルへはみ出すことを許容する。

### クリック動作

- 日付セルクリック → DayModal を開く
- イベント（ドット・バー）クリック → クリックした日付の DayModal を開く
- DayModal 内の予定をクリック → EventModal（閲覧モード）を開く
- DayModal の「この日に予定を追加」→ EventModal（作成モード）を開く

---

## 9. イベント管理

### 入力項目

| 項目 | 必須 | 説明 |
|------|------|------|
| タイトル | 必須 | 予定名 |
| 開始日 | 必須 | date 入力（カレンダー選択） |
| 開始時刻 | 必須 | time 入力 |
| 終了日 | 必須 | date 入力 |
| 終了時刻 | 必須 | time 入力 |
| メモ | 任意 | 補足情報 |

- 日付と時刻は別々の input に分割（モバイル UX 向上のため `datetime-local` は使用しない）
- 時刻の表示は端末のローカルタイムを使用（UTC 変換しない）

### EventModal のモード

| モード | 表示内容 | 遷移 |
|--------|----------|------|
| `view` | 予定の詳細（タイトル・登録者・日時・メモ） | 編集・削除ボタン（オーナーのみ） |
| `edit` | 編集フォーム（既存値を初期値に設定） | 保存・キャンセル |
| `create` | 空フォーム（選択日付を初期値に設定） | 登録・キャンセル |

### 処理フロー（作成）

1. バリデーション（タイトル必須、終了 > 開始）
2. 重複チェック
3. DB 保存
4. LINE 通知送信（`lineGroupId` が設定されている場合のみ）
5. クライアント側 state に反映（画面リロードなし）

---

## 10. 重複チェック

同一カレンダー内で時間帯が重複する予定が存在しないかチェックする。

```sql
SELECT * FROM events
WHERE calendar_id = :calendarId
  AND start_time < :newEnd
  AND end_time   > :newStart;
```

重複が存在する場合はエラー `"この時間帯はすでに予定が入っています"` を返し、登録を中止する。
更新時は自分自身のイベントを除外してチェックする。

---

## 11. LINE 通知

### 設定手順

1. LINE Developers で Messaging API チャンネルを作成
2. LINE Official Account Manager で応答モードを「Bot」・Webhook を「オン」に設定
3. Webhook URL を `https://{app}.vercel.app/api/line/webhook` に設定して検証
4. LINE Bot をグループに追加
5. グループ内で `登録コード: XXXXXX` と送信（XXXXXX はアプリの共有コード）
6. Webhook が受信し `lineGroupId` を DB に保存 → 以降、予定登録時に通知が届く

### LINE設定案内 UI

`lineGroupId` が未設定のカレンダーでは、カレンダー画面のヘッダーに設定案内を表示する:

- LINE Bot を追加するリンクボタン（`https://line.me/R/ti/p/@{basicId}`）
- 共有コードのコピーボタン付き表示

`lineGroupId` が設定済みの場合はこの案内を非表示にする。

### Webhook エンドポイント

```
POST /api/line/webhook
```

- 署名検証必須（`@line/bot-sdk` の `validateSignature` を使用）
- `join` イベント: Bot がグループに参加した際、未設定カレンダーの最新1件に `lineGroupId` を保存（暫定）
- `message` イベント: テキストが `登録コード: XXXXXX` 形式の場合、該当 `shareCode` のカレンダーに `lineGroupId` を保存

### 通知メッセージ例

```
車の予定が登録されました

登録者: 田中太郎
4/10 13:00 〜 17:00
タイトル: 買い物
メモ: スーパーへ
```

---

## 12. UI 画面

### ログイン画面 (`/login`)

- ユーザー名・パスワード入力
- ログイン / 新規登録 をタブで切り替え
- 成功時: `window.location.href = "/calendars"` でリダイレクト

### カレンダー一覧画面 (`/calendars`)

- ヘッダー: アプリ名 + ユーザー名（タップ → ログアウトドロップダウン）
- カレンダーリスト: 名前 + 共有コード + コピーボタン（2 秒後に元の表示に戻る）
- ボタン: 「参加」「+ 作成」
- モーダル:
  - **作成モーダル**: カレンダー名入力 → 作成後に共有コード表示モーダルへ遷移
  - **参加モーダル**: 共有コード入力（大文字変換して照合）
  - **コード表示モーダル**: 生成された共有コードを大きく表示・コピーボタン

### カレンダー画面 (`/calendar/[id]`)

- ヘッダー: 戻るボタン + カレンダー名 + メンバー一覧（カラードット + 名前）
- LINE 未連携時: LINE設定案内（Bot追加リンク・登録コードコピー）を表示
- FullCalendar 月表示
- 日付クリック → DayModal

#### CalendarView Props

| Prop | 型 | 説明 |
|------|-----|------|
| `calendarId` | number | カレンダー ID |
| `calendarName` | string | カレンダー名 |
| `initialEvents` | EventType[] | 初期イベント一覧 |
| `currentUserId` | number | ログイン中ユーザー ID |
| `userColors` | Record<number, string> | ユーザーID → カラー |
| `memberList` | Member[] | メンバー一覧（名前・カラー） |
| `hasLineGroup` | boolean | LINE グループ連携済みか |
| `shareCode` | string | カレンダー共有コード |

### DayModal

- 選択日付のタイトル（例: 4月10日（木））
- 当日の予定リスト（カラードット + タイトル + 時間帯 + 登録者）
- 日跨ぎ予定も当該日に表示（日付範囲オーバーラップで判定）
- 「+ この日に予定を追加」ボタン

### EventModal

- 閲覧モード: タイトル・登録者・日時・メモを表示。オーナーのみ編集・削除ボタンを表示
- 編集モード: フォームに既存値をセット。保存時に `updateEvent` を呼び出し
- 作成モード: 日付を DayModal から引き継いで初期値にセット

---

## 13. 非機能要件

| 項目 | 内容 |
|------|------|
| 同時利用ユーザー数 | 5〜20 ユーザー |
| 想定カレンダー数 | 100 以下 |
| 対象デバイス | スマートフォン（ブラウザ） |
| 画面更新 | Server Actions 後はクライアント state を直接更新（リロードなし） |
| レスポンシブ | viewport メタタグで端末幅に合わせて表示 |
| タップフィードバック | `button:active`, `a:active` に `opacity: 0.65; transform: scale(0.96)` を `!important` で適用。カレンダーセルは `.fc-daygrid-day:active { opacity: 0.7 }` で対応 |

---

## 14. 開発スケジュール

| フェーズ | 内容 | 状態 |
|----------|------|------|
| Phase 0 | ドキュメント・リポジトリ・プロジェクト初期化 | 完了 |
| Phase 1 | 認証（登録・ログイン・ログアウト・Middleware） | 完了 |
| Phase 2 | カレンダー管理（作成・参加・一覧） | 完了 |
| Phase 3 | 予定管理（作成・表示・編集・削除・重複チェック） | 完了 |
| Phase 4 | LINE 連携（Webhook・通知送信・設定案内UI） | 完了 |
| Phase 5 | デプロイ（Vercel・環境変数設定） | 完了 |

---

## 15. インフラ構成

### アーキテクチャ図

```
ユーザー（スマホブラウザ）
        │
        ▼
  Vercel (Next.js App Router)
        │
        ├── API Routes (/api/auth/*)  ← 認証
        ├── API Routes (/api/line/webhook) ← LINE Webhook 受信
        ├── Server Actions            ← カレンダー・イベント操作
        │
        ▼
   PostgreSQL (Neon) ── Prisma ORM
        │
        ▼
   LINE Messaging API（予定登録時に Push 通知）
```

### 各コンポーネント詳細

#### フロントエンド / バックエンド

- Vercel デプロイ（GitHub main ブランチへの push で自動デプロイ）
- HTTPS 自動付与
- ビルド時に `prisma generate` を実行（`package.json` の `build` スクリプト）

#### データベース

- PostgreSQL クラウド DB（Neon）
- Prisma で型安全操作
- バックアップ対応

#### LINE Bot / Webhook

- Webhook URL: `https://car-calender-app-hiroki-sato-devs-projects.vercel.app/api/line/webhook`
- LINE Official Account Manager で応答モード「Bot」・Webhook「オン」が必須
- Vercel Authentication（Deployment Protection）は無効にする必要あり

#### セキュリティ

| 対策 | 内容 |
|------|------|
| 通信暗号化 | HTTPS（Vercel） |
| 認証 | JWT (httpOnly Cookie) + bcrypt ハッシュ化 |
| 機密情報管理 | DB 接続・JWT シークレット・LINE トークンは環境変数で管理 |
| アクセス制御 | カレンダーメンバー以外はカレンダー画面にアクセス不可 |
| 予定操作 | 編集・削除は自分の予定のみ可能 |
| LINE Webhook | `validateSignature` で署名検証必須 |

### 環境変数

| 変数名 | 説明 | 設定場所 |
|--------|------|----------|
| `DATABASE_URL` | Neon の PostgreSQL 接続文字列 | `.env` + Vercel |
| `JWT_SECRET` | JWT 署名用シークレット | `.env` + Vercel |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE Bot チャンネルアクセストークン | `.env` + Vercel |
| `LINE_CHANNEL_SECRET` | LINE Webhook 署名検証用シークレット | `.env` + Vercel |
