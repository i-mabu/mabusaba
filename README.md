# mabusaba Main Bot

`mabusaba` の**モデレーション／サーバー管理専用ボット**です。ゲーム機能は `mabusaba-game` に分離されており、両ボットは別々の Discord Application、Bot Token、Client ID を使用します。同じ Discord サーバーへ両方を導入することは可能です。

## 対応範囲

| 区分 | 内容 |
| --- | --- |
| コマンド | `/moderation`、`/warn`、`/mute`、`/ban`、`/kick`、`/unmute`、`/unban`、`/clear`、`/welcome`、`/fixed-message`、`/audit-log` など |
| 永続化 | `moderation.db` にモデレーション Case、監査ログ、Welcome／固定メッセージ設定を保存 |
| Node.js | `>=20 <27` |
| データ保護 | 起動前の整合性確認、WAL チェックポイントを考慮したバックアップ、加算型スキーマ移行 |

> **ゲームデータは本プロジェクトでは変更しません。** 既存の `games.db` はゲームボット側へコピーして利用してください。

## セットアップ

Node.js 20 以上を用意し、依存関係をロックファイルどおりに導入したうえで、環境変数を設定します。`DISCORD_TOKEN`、`CLIENT_ID`、`GUILD_ID` は Main Bot 用の値を使用してください。

```bash
cp .env.example .env
npm ci
npm run deploy
npm start
```

```env
DISCORD_TOKEN=YOUR_MAIN_BOT_TOKEN
CLIENT_ID=YOUR_MAIN_APPLICATION_ID
GUILD_ID=YOUR_GUILD_ID
WELCOME_CHANNEL_ID=
AUDIT_LOG_CHANNEL_ID=
AUTO_ROLE_ID=
DB_BACKUP_ON_START=true
DB_BACKUP_RETENTION=10
```

Discord Developer Portal では、本ボットが必要とする **Server Members Intent**、**Message Content Intent** を有効化してください。また、運用する機能に応じて Moderate Members、Ban Members、Kick Members、Manage Messages、View Audit Log、Embed Links などの権限を付与してください。

## データベース分離と移行

v1.2.7 修正版では、Main Bot は `src/data/moderation.db` のみを運用DBとして扱います。旧構成で `games.db` に保存されていた `fixed_messages` と `welcome_messages` は、初回起動時に `moderation.db` へ**追加のみ**で取り込みます。すでに新DBに存在するサーバー設定は上書きされず、元の `games.db` は削除・変更されません。

| データ | 保存先 | Main Bot の扱い |
| --- | --- | --- |
| モデレーション Case・監査ログ | `src/data/moderation.db` | 読み書きする |
| Welcome・固定メッセージ設定 | `src/data/moderation.db` | 読み書きする |
| ポイント・ゲーム履歴 | `src/data/games.db` | 変更しない。Game Bot へ移行する |

バックアップは標準で `src/data/backups/<timestamp>/` に保存されます。保持世代数は `DB_BACKUP_RETENTION` で変更できます。実データに触れず検証したい場合だけ、`MABUSABA_DATA_DIR` に別ディレクトリを指定できます。

## 品質確認

以下のコマンドは外部サービスへ接続せずに実行できます。`npm test` は一時ディレクトリで、旧設定の安全な移行、DBの分離、再実行時の冪等性を確認します。

```bash
npm run check
npm test
npm run db:check
npm run db:backup
```

## コンテナ実行

`.env` を設定済みであれば、次のコマンドで起動できます。ホスト側の `src/data` がコンテナ内へマウントされるため、SQLite データはコンテナ再作成後も保持されます。

```bash
docker compose build
docker compose up -d
```

## 運用上の注意

本ボットと Game Bot は**必ず別トークン**で運用してください。既存ゲームデータを引き継ぐ場合は、Main Bot の `src/data/games.db` を Game Bot プロジェクトの `src/data/games.db` へコピーしてから Game Bot を起動してください。移行前に両ボットを停止し、元のDBファイルを別の場所へバックアップしておくことを推奨します。
