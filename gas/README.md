# GASセットアップ手順書

このドキュメントでは、Google Apps Script(GAS)のセットアップ方法を説明します。

## 📋 前提条件

- Googleスプレッドシートが作成済み
- 5つのシート(Members, Schedules, ScheduleResponses, Events, Payments)が作成済み

## 🔧 セットアップ手順

### ステップ1: Apps Scriptエディタを開く

1. スプレッドシートを開く
   ```
   https://docs.google.com/spreadsheets/d/1NcPsxApFpT-YSfPYSkAxxzKVu8RxSwCPUpMVHd05kCk/edit
   ```

2. メニューから `拡張機能` > `Apps Script` をクリック

3. 新しいタブでApps Scriptエディタが開きます

### ステップ2: コードを貼り付け

1. エディタに表示されている既存のコード(function myFunction()...)を**すべて削除**

2. `Code.gs` ファイルの内容を**すべてコピー**
   - ファイルパス: `C:\Users\81906\.gemini\antigravity\scratch\asobi-yotei-pwa\gas\Code.gs`

3. Apps Scriptエディタに**貼り付け**

4. `Ctrl + S` で保存(またはメニューから保存)

### ステップ3: デプロイ

1. 右上の `デプロイ` ボタンをクリック

2. `新しいデプロイ` を選択

3. 設定画面で以下を入力:
   - **種類**: `ウェブアプリ` を選択
   - **説明**: `遊び予定管理API` (任意)
   - **次のユーザーとして実行**: `自分` を選択
   - **アクセスできるユーザー**: `全員` を選択 ⚠️ 重要!

4. `デプロイ` ボタンをクリック

5. 初回のみ、権限の承認が必要です:
   - `アクセスを承認` をクリック
   - Googleアカウントを選択
   - `詳細` をクリック
   - `遊び予定管理API(安全ではないページ)に移動` をクリック
   - `許可` をクリック

### ステップ4: デプロイURLをコピー

1. デプロイが完了すると、**ウェブアプリのURL**が表示されます

2. このURLを**コピー**してください
   ```
   例: https://script.google.com/macros/s/AKfycby.../exec
   ```

3. このURLは後でPWAの設定で使用します

4. `完了` をクリック

## ✅ 動作確認

デプロイが成功したか確認します。

1. コピーしたURLをブラウザで開く

2. 以下のパラメータを追加してアクセス:
   ```
   https://script.google.com/macros/s/AKfycby.../exec?action=getMembers
   ```

3. 以下のようなJSON形式のレスポンスが表示されればOK:
   ```json
   {
     "success": true,
     "members": [
       {
         "id": 1,
         "name": "けーたろー",
         "bankName": "三菱UFJ銀行",
         ...
       },
       ...
     ]
   }
   ```

## 🔄 コードを更新する場合

コードを修正した場合は、再デプロイが必要です。

1. Apps Scriptエディタでコードを修正

2. `Ctrl + S` で保存

3. `デプロイ` > `デプロイを管理` をクリック

4. 既存のデプロイの右側にある鉛筆アイコン(編集)をクリック

5. 右上の `バージョン` で `新バージョン` を選択

6. `デプロイ` をクリック

7. URLは変わりません(同じURLで最新版が使用されます)

## 📝 次のステップ

GASのセットアップが完了したら、次はPWAの実装に進みます。

デプロイURLを控えておいてください!
