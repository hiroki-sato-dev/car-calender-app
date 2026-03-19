# マイカレンダー機能 技術仕様書

## DBスキーマ変更

### Userモデルに追加

```prisma
model User {
  // 既存フィールド...
  lineUserId   String? @unique  // マイカレンダーBot連携済みLINEユーザーID
  lineLinkCode String? @unique  // LINE連携コード（有効期限なし）
}
```

### Calendarモデルに追加

```prisma
model Calendar {
  // 既存フィールド...
  isPersonal Boolean @default(false)  // マイカレンダーフラグ
}
```

### 新規テーブル：LineConversationState

```prisma
model LineConversationState {
  id         Int      @id @default(autoincrement())
  lineUserId String   @unique
  state      String   // "idle" | "waiting_title" | "waiting_datetime"
  title      String?  // 会話中に収集したタイトル（一時保存）
  updatedAt  DateTime @updatedAt
}
```

---

## 環境変数（新規追加）

```env
MY_CALENDAR_LINE_CHANNEL_SECRET=xxx
MY_CALENDAR_LINE_CHANNEL_ACCESS_TOKEN=xxx
```

---

## APIエンドポイント

### 新規

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/line/my-calendar/webhook` | マイカレンダーBot Webhook |

### 既存（変更なし）

| メソッド | パス | 説明 |
|---------|------|------|
| POST | `/api/line/webhook` | 共有カレンダーBot Webhook |

---

## Server Actions

### actions/calendar.ts に追加

```typescript
// マイカレンダー作成
createMyCalendar(): Promise<{ error?: string; calendar?: Calendar }>

// マイカレンダー取得
getMyCalendar(): Promise<Calendar | null>
```

### actions/auth.ts に追加

```typescript
// LINE連携コード生成・取得
getLineLinkCode(): Promise<{ code: string }>

// LINE連携解除
unlinkLine(): Promise<{ success: boolean }>
```

---

## フロントエンド

### 新規ページ

- `app/my-calendar/page.tsx` - マイカレンダー詳細ページ（Server Component）
- `components/my-calendar/MyCalendarView.tsx` - メインUIコンポーネント

### 変更ファイル

- `app/calendars/CalendarsClient.tsx` - マイカレンダーセクション追加
- `components/ui/UserMenu.tsx`（または既存のユーザーメニュー部分） - LINE連携解除追加

---

## LINEリッチメニュー

### 画像仕様

- サイズ：2500 × 843px（ハーフサイズ）
- 形式：PNG
- 3列レイアウト（各列約833px幅）
- デザイン：グレー系モダン

### セットアップスクリプト

`scripts/setup-rich-menu.ts` を作成し以下を一括実行：

1. SVGからリッチメニュー画像を生成
2. LINE APIへ画像をアップロード
3. リッチメニューを作成（ボタンエリア定義）
4. デフォルトリッチメニューとして設定

### ボタンエリア定義

```json
[
  {
    "bounds": { "x": 0, "y": 0, "width": 833, "height": 843 },
    "action": { "type": "message", "text": "予定登録" }
  },
  {
    "bounds": { "x": 833, "y": 0, "width": 834, "height": 843 },
    "action": { "type": "message", "text": "使い方" }
  },
  {
    "bounds": { "x": 1667, "y": 0, "width": 833, "height": 843 },
    "action": { "type": "uri", "uri": "https://car-calender-app.vercel.app/my-calendar" }
  }
]
```

---

## 日時パース仕様

正規表現ベースで以下のパターンに対応：

### 日付

| 入力例 | パース結果 |
|--------|-----------|
| 今日 | 当日 |
| 明日 | 翌日 |
| 明後日 | 翌々日 |
| 月曜・月曜日 | 直近の月曜日 |
| 来週月曜 | 翌週の月曜日 |
| 3/20・3月20日 | 3月20日 |

### 時刻

| 入力例 | パース結果 |
|--------|-----------|
| 9時 | 09:00 |
| 午前9時 | 09:00 |
| 午後3時 | 15:00 |
| 9:00・09:00 | 09:00 |

### 時間範囲

| 入力例 | パース結果 |
|--------|-----------|
| 9時〜10時 | 09:00〜10:00 |
| 9時-10時 | 09:00〜10:00 |
| 9時から10時 | 09:00〜10:00 |
| 9時から1時間 | 09:00〜10:00 |

### パース失敗時

以下のメッセージを返す：
```
日時を認識できませんでした。
以下の形式で送ってください。

例：
・明日10時〜11時
・3/20 9:00-10:00
・来週月曜 午後3時から1時間
```
