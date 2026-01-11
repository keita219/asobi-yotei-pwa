# 遊び予定管理PWA - セットアップ手順書

このドキュメントでは、PWAの完全なセットアップ方法を説明します。

## 📋 セットアップの流れ

1. GASのデプロイ(10分)
2. GitHub Pagesの設定(10分)
3. API URLの設定(2分)
4. 動作確認(5分)

**合計所要時間: 約30分**

---

## ステップ1: GASのデプロイ

### 1-1. Apps Scriptエディタを開く

1. スプレッドシートを開く
   ```
   https://docs.google.com/spreadsheets/d/1NcPsxApFpT-YSfPYSkAxxzKVu8RxSwCPUpMVHd05kCk/edit
   ```

2. メニューから `拡張機能` > `Apps Script` をクリック

### 1-2. コードを貼り付け

1. エディタの既存コードを**すべて削除**

2. `gas/Code.gs` の内容を**すべてコピー**して貼り付け

3. `Ctrl + S` で保存

### 1-3. デプロイ

1. 右上の `デプロイ` > `新しいデプロイ` をクリック

2. 設定:
   - **種類**: `ウェブアプリ`
   - **次のユーザーとして実行**: `自分`
   - **アクセスできるユーザー**: `全員` ⚠️ 重要!

3. `デプロイ` をクリック

4. 権限の承認(初回のみ):
   - `アクセスを承認` → アカウント選択
   - `詳細` → `遊び予定管理API(安全ではないページ)に移動`
   - `許可` をクリック

5. **デプロイURL**をコピー(後で使用)
   ```
   例: https://script.google.com/macros/s/AKfycby.../exec
   ```

---

## ステップ2: GitHub Pagesの設定

### 2-1. GitHubアカウントの作成

すでにアカウントがある場合はスキップしてください。

1. https://github.com にアクセス

2. `Sign up` をクリックして登録

### 2-2. リポジトリの作成

1. GitHubにログイン

2. 右上の `+` > `New repository` をクリック

3. 設定:
   - **Repository name**: `asobi-yotei-pwa`
   - **Public** を選択
   - `Create repository` をクリック

### 2-3. コードのアップロード

#### 方法A: GitHub Webインターフェース(簡単)

1. リポジトリページで `uploading an existing file` をクリック

2. 以下のファイルをドラッグ&ドロップ:
   ```
   C:\Users\81906\.gemini\antigravity\scratch\asobi-yotei-pwa\
   ```
   - index.html
   - manifest.json
   - sw.js
   - css/style.css
   - js/app.js
   - js/schedule.js
   - js/event.js
   - js/payment.js
   - images/icon-192.png
   - images/icon-512.png

3. `Commit changes` をクリック

#### 方法B: Git CLI(上級者向け)

```bash
cd C:\Users\81906\.gemini\antigravity\scratch\asobi-yotei-pwa
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/asobi-yotei-pwa.git
git push -u origin main
```

### 2-4. GitHub Pagesの有効化

1. リポジトリページで `Settings` をクリック

2. 左メニューから `Pages` をクリック

3. **Source** で `main` ブランチを選択

4. `Save` をクリック

5. 数分待つと、URLが表示されます:
   ```
   https://YOUR_USERNAME.github.io/asobi-yotei-pwa/
   ```

---

## ステップ3: API URLの設定

### 3-1. app.jsの編集

1. GitHubリポジトリで `js/app.js` を開く

2. `Edit this file` (鉛筆アイコン)をクリック

3. 2行目の `YOUR_GAS_DEPLOY_URL_HERE` を、ステップ1-3でコピーしたデプロイURLに置き換え:

   ```javascript
   // 変更前
   const API_URL = 'YOUR_GAS_DEPLOY_URL_HERE';
   
   // 変更後
   const API_URL = 'https://script.google.com/macros/s/AKfycby.../exec';
   ```

4. `Commit changes` をクリック

---

## ステップ4: 動作確認

### 4-1. PWAを開く

1. スマートフォンまたはPCのブラウザで以下にアクセス:
   ```
   https://YOUR_USERNAME.github.io/asobi-yotei-pwa/
   ```

2. ユーザー選択画面が表示されることを確認

3. 自分の名前を選択

4. ホーム画面が表示されればOK!

### 4-2. PWAとしてインストール(スマートフォン)

#### iPhone

1. Safariでアプリを開く

2. 画面下部の共有ボタンをタップ

3. `ホーム画面に追加` をタップ

4. `追加` をタップ

#### Android

1. Chromeでアプリを開く

2. 画面右上のメニュー(⋮)をタップ

3. `ホーム画面に追加` をタップ

4. `追加` をタップ

---

## 🎉 完了!

これでPWAのセットアップは完了です!

### 次にやること

1. メンバー全員にURLを共有
   ```
   https://YOUR_USERNAME.github.io/asobi-yotei-pwa/
   ```

2. 各自がホーム画面に追加

3. 予定調整を作成して試してみる

---

## 🔧 トラブルシューティング

### Q1: ユーザー選択画面が表示されない

**原因**: GASのデプロイURLが正しく設定されていない

**解決策**:
1. `js/app.js` の `API_URL` を確認
2. GASのデプロイURLが正しいか確認
3. ブラウザのキャッシュをクリア

### Q2: 「Failed to fetch」エラーが出る

**原因**: GASのアクセス権限が「全員」になっていない

**解決策**:
1. Apps Scriptエディタを開く
2. `デプロイ` > `デプロイを管理`
3. 鉛筆アイコンをクリック
4. `アクセスできるユーザー` を `全員` に変更
5. `デプロイ` をクリック

### Q3: GitHub Pagesが表示されない

**原因**: デプロイに時間がかかっている

**解決策**:
1. 5-10分待つ
2. リポジトリの `Actions` タブで進行状況を確認
3. それでも表示されない場合は、`Settings` > `Pages` で設定を確認

---

## 📞 サポート

問題が解決しない場合は、以下を確認してください:

1. ブラウザのコンソール(F12)でエラーメッセージを確認
2. GASのログ(`表示` > `ログ`)を確認
3. スプレッドシートのデータが正しく入力されているか確認
