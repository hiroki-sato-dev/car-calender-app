---
title: シェアカレンダー 使い方ガイド
pdf_options:
  format: A4
  margin: 20mm 18mm
  printBackground: true
  displayHeaderFooter: true
  headerTemplate: '<div style="font-size:9px;color:#aaa;width:100%;text-align:center;">シェアカレンダー 使い方ガイド</div>'
  footerTemplate: '<div style="font-size:9px;color:#aaa;width:100%;text-align:center;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
---

<style>
  body { font-family: "Hiragino Sans", "Hiragino Kaku Gothic ProN", "Noto Sans JP", sans-serif; color: #1a1a1a; line-height: 1.8; }
  h1 { color: #2563eb; border-bottom: 3px solid #2563eb; padding-bottom: 8px; margin-top: 0; }
  h2 { color: #1d4ed8; border-left: 5px solid #2563eb; padding-left: 12px; margin-top: 40px; }
  h3 { color: #1e40af; margin-top: 28px; }
  .step { background: #f0f7ff; border-left: 4px solid #2563eb; padding: 12px 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
  .tip { background: #f0fdf4; border-left: 4px solid #16a34a; padding: 12px 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
  .note { background: #fffbeb; border-left: 4px solid #d97706; padding: 12px 16px; margin: 12px 0; border-radius: 0 8px 8px 0; }
  table { border-collapse: collapse; width: 100%; margin: 16px 0; }
  th { background: #2563eb; color: white; padding: 10px 14px; text-align: left; }
  td { padding: 9px 14px; border-bottom: 1px solid #e2e8f0; }
  tr:nth-child(even) td { background: #f8fafc; }
  code { background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
</style>

# シェアカレンダー 使い方ガイド

家族やグループで共有している車の使用予定を管理するアプリです。
予定を登録すると LINE グループに通知が届きます。

---

## 1. はじめる前に

### アカウントを作る

<div class="step">

1. アプリを開き、「新規登録」タブを選択
2. ユーザー名・パスワードを入力して「登録」をタップ
3. 登録が完了するとカレンダー一覧画面に移動します

</div>

<div class="tip">

**ヒント:** ユーザー名は家族が見てもわかる名前にしておくと便利です（例: 田中太郎、お父さん など）

</div>

---

## 2. カレンダーを作る・参加する

### カレンダーを新しく作る

<div class="step">

1. カレンダー一覧画面の「＋ 作成」をタップ
2. カレンダー名を入力（例: 田中家の車）して「作成」をタップ
3. 作成後に **共有コード**（6桁）が表示されます
4. このコードを家族に共有してください

</div>

### 家族のカレンダーに参加する

<div class="step">

1. カレンダー一覧画面の「参加」をタップ
2. 家族から受け取った共有コードを入力して「参加」をタップ

</div>

<div class="note">

**注意:** 共有コードは大文字・小文字どちらで入力しても構いません。

</div>

---

## 3. 予定を登録する

<div class="step">

1. カレンダーをタップして開く
2. 予定を入れたい日付をタップ
3. 「+ この日に予定を追加」をタップ
4. タイトル・開始日時・終了日時（・メモ）を入力
5. 「登録」をタップ

</div>

### 入力項目

| 項目 | 必須 | 説明 |
|------|:---:|------|
| タイトル | 必須 | 予定の名前（例: 買い物、病院など） |
| 開始日 / 時刻 | 必須 | 使用開始の日時 |
| 終了日 / 時刻 | 必須 | 使用終了の日時 |
| メモ | 任意 | 行き先など補足情報 |

<div class="tip">

**ヒント:** 日をまたぐ予定（例: 翌日の朝まで使用）も登録できます。カレンダー上では横バーで表示されます。

</div>

<div class="note">

**注意:** 同じカレンダー内で時間が重複する予定は登録できません。

</div>

---

## 4. 予定を見る

### カレンダー上の表示

| 表示 | 意味 |
|------|------|
| 色つきの丸ドット | その日に予定あり（1日内） |
| 色つきの横バー | 日をまたぐ予定 |

- ドット・バーの色はメンバーごとに異なります
- 画面上部の凡例でだれの色かを確認できます

### 予定の詳細を見る

<div class="step">

1. 日付をタップ → その日の予定一覧が表示されます
2. 見たい予定をタップ → 詳細（登録者・日時・メモ）が表示されます

</div>

---

## 5. 予定を編集・削除する

<div class="step">

1. 予定の詳細画面を開く
2. **自分が登録した予定のみ**「編集」「削除」ボタンが表示されます
3. 「編集」→ 内容を変更して「保存」
4. 「削除」→ 確認後に削除されます

</div>

<div class="note">

**注意:** 他のメンバーが登録した予定は編集・削除できません。

</div>

---

## 6. LINE 通知を設定する

予定が登録されたとき、LINE グループに通知を送る機能です。

<div class="step">

1. カレンダー画面上部の「LINE Bot を追加」ボタンをタップ
2. LINE グループに Bot を追加する
3. Bot から「登録コードを送信してください」とメッセージが届きます
4. グループのトーク画面で以下を送信:

</div>

```
登録コード: XXXXXX
```

（XXXXXX はカレンダーの共有コード）

<div class="tip">

**ヒント:** 登録コードはカレンダー画面の案内に表示されています。「コピー」ボタンでコピーしてそのまま送信できます。

</div>

連携が完了すると Bot から「〇〇と連携しました！」と返信が届き、以降は予定登録のたびにグループへ通知が送られます。

### 通知メッセージの例

```
車の予定が登録されました

登録者: 田中太郎
日時: 4月10日(木) 13:00 〜 17:00
タイトル: 買い物
メモ: スーパーへ
```

---

## 7. ホーム画面に追加する（アプリ風に使う）

スマートフォンのホーム画面に追加すると、アプリアイコンから起動できます。

### iPhone（Safari）

<div class="step">

1. Safari でアプリを開く
2. 画面下部の共有ボタン（四角に上矢印）をタップ
3. 「ホーム画面に追加」をタップ
4. 「追加」をタップ

</div>

### Android（Chrome）

<div class="step">

1. Chrome でアプリを開く
2. 右上のメニュー（点3つ）をタップ
3. 「ホーム画面に追加」をタップ

</div>

<div class="tip">

**ヒント:** ホーム画面から起動するとアドレスバーが消え、アプリのような見た目で使えます。

</div>

---

## 8. カレンダーを削除する

カレンダーから抜けたい場合は以下の手順で操作します。

<div class="step">

1. カレンダー画面右上の「カレンダーを削除」をタップ
2. 確認メッセージを読んで「削除する」をタップ

</div>

<div class="note">

**注意:** カレンダーを削除しても他のメンバーのカレンダーには影響しません。全員が削除するとカレンダー自体が完全に削除されます。

</div>

---

## 9. ログアウト

<div class="step">

1. カレンダー一覧画面の右上にあるユーザー名をタップ
2. 「ログアウト」をタップ

</div>
