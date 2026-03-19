# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 基本方針

- 返答は必ず日本語で行う

## UI 方針

- 絵文字は使用しない
- ダークテーマ固定（背景: `#0f0f0f`、カード: `zinc-900`）

## Commands

```bash
npm run dev       # Start development server
npm run build     # Build for production
npm run lint      # Run ESLint
npx prisma migrate dev --name <name>  # Create and apply a new migration
npx prisma studio                     # Open Prisma Studio (DB browser)
npx prisma generate                   # Regenerate Prisma client after schema changes
```

## ドキュメント

詳細な仕様・開発計画は `doc/` を参照:

- [doc/specifications.md](doc/specifications.md) — 技術仕様書（DB設計・API・UI・インフラ構成）
- [doc/roadmap.md](doc/roadmap.md) — フェーズ別開発ロードマップ（実装順序・完了基準）

### 機能追加ドキュメント

新規機能は `doc/feature/<機能名>/` に以下の3ファイルで管理する:
- `requirements.md` — 要件・やりたいこと
- `technical-spec.md` — DB・API・コンポーネント等の技術仕様
- `design-policy.md` — 設計方針・実装順序・未決定事項

実装前に必ず該当フォルダを参照すること。

| 機能 | フォルダ |
|------|---------|
| マイカレンダー | [doc/feature/myCalendar/](doc/feature/myCalendar/) |

## Architecture

### Overview
家族・グループで車を共有するカレンダーアプリ。Next.js App Router + Server Actions + Prisma + PostgreSQL (Neon) 構成。LINE Messaging API で予定登録通知を送信する。

### Auth Flow
- JWT を `httpOnly` Cookie (`token`) に保存
- `middleware.ts` がすべてのページリクエストを保護し、未認証なら `/login` にリダイレクト
- `/api/*` は middleware の matcher から除外されているため保護対象外
- `lib/auth.ts` に `signToken` / `verifyToken` / `getSession` を集約
- Server Actions 内では `getSession()` でログインユーザーを取得する

### Server Actions パターン
- `actions/` 配下に機能単位でまとめる（`auth.ts` / `calendar.ts` / `event.ts`）
- 戻り値は成功時は `redirect()`、エラー時は `{ error: string }` を返す
- `"use server"` ディレクティブをファイル先頭に記述

### データ層
- `lib/prisma.ts` がシングルトンの `PrismaClient` を export — 必ずここから import する
- DB は Neon (PostgreSQL)、接続文字列は `.env` の `DATABASE_URL`
- スキーマ変更後は必ず `npx prisma migrate dev` を実行してから `npx prisma generate`

### 主要なデータモデルの関係
- `User` → `CalendarMember` (多) ← `Calendar`（多対多の中間テーブル）
- `Event` は `calendarId` と `userId` の両方を持つ
- 予定重複チェック: `startTime < newEnd AND endTime > newStart` で同一カレンダー内を検索

### LINE 連携
- `app/api/line/webhook/route.ts` で Webhook を受信し、Bot がグループ追加された際に `lineGroupId` を `Calendar` に保存
- `lib/line.ts` に通知送信ロジックを集約
- Webhook の署名検証は必須（`@line/bot-sdk` の `validateSignature` を使用）

### 環境変数
`.env` に以下が必要:
- `DATABASE_URL` — Neon の接続文字列
- `JWT_SECRET` — JWT 署名用シークレット
- `LINE_CHANNEL_ACCESS_TOKEN` — LINE Bot トークン
- `LINE_CHANNEL_SECRET` — LINE Webhook 署名検証用
