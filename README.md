# ポケスリ育成コンパス Ver.1.0

ポケモンスリープの育成・厳選・島選択を整理するためのPWAです。

アプリが最適解を決めるのではなく、ユーザー自身が判断できるように、登録個体、図鑑設定、種族候補、目標、Progress、ToDo、ホーム、島、役割画面、未設定一覧をつなげて表示します。

## 同梱内容

- `index.html`: アプリ本体の入口
- `src/`: 画面、Service、Store、Mapper
- `public/master.json`: Excelから生成した正式マスターデータ
- `public/icon3.png`: PWAアイコン
- `public/manifest.json`: PWA manifest
- `sw.js`: Service Worker
- `scripts/serve.ps1`: ローカル確認用サーバー
- `scripts/build-master-json.ps1`: Excelからmaster.jsonを生成するスクリプト
- `docs/master-json-generation.md`: master.json生成メモ

## ローカル起動手順

PowerShellでこのフォルダを開き、以下を実行します。

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts\serve.ps1 -Port 4173
```

ブラウザで以下を開きます。

```text
http://127.0.0.1:4173/
```

PWAとService Workerの確認は、ローカルファイルを直接開くのではなく、必ずローカルサーバー経由で確認してください。

## GitHub Pagesで公開する手順

1. GitHubで新しいリポジトリを作成します。
2. このZIP内のファイルをリポジトリ直下にアップロードします。
3. GitHubのリポジトリ画面で `Settings` を開きます。
4. `Pages` を開きます。
5. `Build and deployment` の `Source` を `Deploy from a branch` にします。
6. `Branch` を `main`、フォルダを `/root` にして保存します。
7. 数分後に表示されるGitHub PagesのURLを開きます。

## GitHubへアップロードするファイル

以下をリポジトリ直下に置いてください。

- `index.html`
- `sw.js`
- `README.md`
- `public/`
- `src/`
- `scripts/`
- `docs/`

`work/` や `outputs/` は公開用には不要です。

## スマホで確認する手順

1. GitHub PagesのURLをスマホで開きます。
2. ホーム、個体、図鑑、島、メニューの5タブが表示されることを確認します。
3. iPhoneの場合は共有メニューから「ホーム画面に追加」を選びます。
4. ホーム画面に `icon3.png` のアイコンが表示されることを確認します。
5. ホーム画面のアイコンから起動し、通常のブラウザ表示ではなくPWAとして開くことを確認します。
6. 一度表示したあと、通信を切った状態で既存データを閲覧できるか確認します。

## 初回確認ポイント

- `Master 2026.07.06` が表示される
- 図鑑にポケモンが表示される
- 個体登録ができる
- 図鑑詳細で厳選設定と候補設定ができる
- 役割画面できのみ・食材・スキルの目標を編集できる
- ホームにToDoが島×睡眠タイプで表示される
- 島画面でToDoと現在戦力が見える
- メニューから未設定一覧を開ける
- メニューからJSONバックアップを書き出せる
- JSON復元とユーザーデータ初期化では確認ダイアログが出る

## 注意

- `public/master.json` はExcelから生成したマスターデータです。ユーザーデータのバックアップには含まれません。
- ユーザーデータはブラウザのIndexedDBに保存されます。
- master.jsonを更新した場合は、Service Workerのキャッシュが残ることがあります。ブラウザの更新、PWAの再起動、またはサイトデータ削除で確認してください。
