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
9. [イベント作成](#9-イベント作成)
10. [重複チェック](#10-重複チェック)
11. [LINE 通知](#11-line-通知)
12. [UI 画面](#12-ui-画面)
13. [非機能要件](#13-非機能要件)
14. [開発スケジュール](#14-開発スケジュール)
15. [インフラ構成](#15-インフラ構成)

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
| バックエンド | Next.js Server Actions, Node.js |
| ORM / DB | Prisma, PostgreSQL |
| 外部サービス | LINE Messaging API |
| デプロイ | Vercel |

---

## 3. リポジトリ構成

```
car-calendar-app/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── login/
│   │   └── page.tsx
│   ├── calendars/
│   │   └── page.tsx
│   ├── calendar/
│   │   └── [id]/
│   │       └── page.tsx
│   └── api/
│       └── line/
│           └── webhook/
│               └── route.ts
├── components/
│   ├── calendar/
│   │   └── CalendarView.tsx
│   ├── event/
│   │   └── EventModal.tsx
│   └── ui/
├── actions/
│   ├── auth.ts
│   ├── calendar.ts
│   └── event.ts
├── lib/
│   ├── prisma.ts
│   ├── auth.ts
│   └── line.ts
├── types/
│   ├── event.ts
│   └── calendar.ts
├── prisma/
│   └── schema.prisma
└── public/
```

---

## 4. データベース設計

### users

| カラム名 | 型 | 説明 |
|----------|----|------|
| `id` | serial, PK | ユーザー ID |
| `name` | text | ユーザー名 |
| `password_hash` | text | ハッシュ化パスワード |
| `created_at` | timestamp | 作成日時 |

### calendars

| カラム名 | 型 | 説明 |
|----------|----|------|
| `id` | serial, PK | カレンダー ID |
| `name` | text | カレンダー名 |
| `share_code` | text | 参加用コード |
| `line_group_id` | text | LINE グループ ID |
| `created_by` | int | 作成者ユーザー ID |
| `created_at` | timestamp | 作成日時 |

### calendar_members

| カラム名 | 型 | 説明 |
|----------|----|------|
| `id` | serial, PK | ID |
| `calendar_id` | int | calendars.id |
| `user_id` | int | users.id |

### events

| カラム名 | 型 | 説明 |
|----------|----|------|
| `id` | serial, PK | イベント ID |
| `calendar_id` | int | calendars.id |
| `user_id` | int | users.id |
| `title` | text | 予定タイトル |
| `memo` | text | メモ |
| `start_time` | timestamp | 開始時間 |
| `end_time` | timestamp | 終了時間 |
| `created_at` | timestamp | 作成日時 |

---

## 5. Prisma スキーマ

```prisma
model User {
  id           Int      @id @default(autoincrement())
  name         String   @unique
  passwordHash String
  createdAt    DateTime @default(now())
  calendars    CalendarMember[]
  events       Event[]
}

model Calendar {
  id          Int      @id @default(autoincrement())
  name        String
  shareCode   String   @unique
  lineGroupId String?
  createdBy   Int
  createdAt   DateTime @default(now())
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

- JWT 認証
- パスワードは bcrypt でハッシュ化

### Register

```
POST /api/auth/register
```

**Request:**

```json
{
  "name": "taro",
  "password": "password123"
}
```

**処理フロー:**

1. `name` 重複チェック
2. パスワードをハッシュ化
3. DB に保存

### Login

```
POST /api/auth/login
```

**Request:**

```json
{
  "name": "taro",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token"
}
```

---

## 7. Server Actions

### `actions/auth.ts`

| 関数 | 説明 |
|------|------|
| `register()` | ユーザー登録 |
| `login()` | ログイン・JWT 発行 |

### `actions/calendar.ts`

| 関数 | 説明 |
|------|------|
| `createCalendar()` | カレンダー作成 |
| `joinCalendar()` | 共有コードでカレンダー参加 |
| `getCalendars()` | 参加中カレンダー一覧取得 |

### `actions/event.ts`

| 関数 | 説明 |
|------|------|
| `createEvent()` | 予定作成 |
| `updateEvent()` | 予定更新 |
| `deleteEvent()` | 予定削除 |
| `getEvents()` | 予定一覧取得 |

---

## 8. カレンダー UI

- FullCalendar 使用
- 月表示

**イベント表示例:**

```
13:00–17:00
兄
ドライブ
```

---

## 9. イベント作成

**入力項目:**

- 開始時間 (start time)
- 終了時間 (end time)
- タイトル (title)
- メモ (memo)

**処理フロー:**

1. 重複チェック
2. DB 保存
3. LINE 通知送信

---

## 10. 重複チェック

同一カレンダー内で時間帯が重複する予定が存在しないかチェックする。

```sql
SELECT *
FROM events
WHERE calendar_id = ?
  AND start_time < :new_end
  AND end_time   > :new_start;
```

重複が存在する場合はエラーを返し、予定登録を中止する。

---

## 11. LINE 通知

### 設定手順

1. LINE Bot をグループに追加
2. Webhook でグループ ID を取得・DB に保存
3. 予定登録時に通知を送信

### 通知メッセージ例

```
🚗 車の予定
兄
4/10 13:00〜17:00
用途: ドライブ
```

---

## 12. UI 画面

### ログイン画面

- ユーザー名 (name)
- パスワード (password)

### カレンダー一覧画面

- 参加中カレンダー名の一覧表示
- ボタン: **作成** / **参加**

### カレンダー画面

- 月表示のカレンダー
- 日付クリック → 予定作成モーダルを表示

---

## 13. 非機能要件

| 項目 | 内容 |
|------|------|
| 同時利用ユーザー数 | 5〜20 ユーザー |
| 想定カレンダー数 | 100 以下 |
| 対象デバイス | スマートフォン（ブラウザ） |

---

## 14. 開発スケジュール

| 機能 | 工数 |
|------|------|
| 認証 | 1 日 |
| カレンダー管理 | 2 日 |
| 予定管理 | 2 日 |
| LINE 連携 | 1 日 |
| **合計** | **6〜7 日** |

---

## 15. インフラ構成

### アーキテクチャ図

```
ユーザー（スマホブラウザ）
        │
        ▼
  Vercel (Next.js App Router)
        │
        ▼
  Server Actions / API Routes
        │
        ▼
   PostgreSQL (クラウドDB) ── Prisma ORM
        │
        ▼
   LINE Messaging API
```

### 各コンポーネント詳細

#### フロントエンド / バックエンド

- Vercel デプロイ
- HTTPS 自動付与
- 自動スケーリング（個人〜小規模利用向け）

#### データベース

- PostgreSQL クラウド DB（Supabase / Railway / Neon 等）
- Prisma で型安全操作
- バックアップ対応

#### LINE Bot / Webhook

- Webhook URL: `https://{your-app}.vercel.app/api/line/webhook`
- 予定登録時に通知送信

#### デプロイ / CI

- GitHub 連携で `push` → 自動デプロイ
- GitHub Actions で簡易テスト可能

#### セキュリティ

| 対策 | 内容 |
|------|------|
| 通信暗号化 | HTTPS（Vercel） |
| 認証 | JWT 認証 + bcrypt ハッシュ化 |
| 機密情報管理 | DB 接続・LINE トークンは環境変数で管理 |
