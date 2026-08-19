# mabusaba v1.2.7 — Main Bot

管理・モデレーション専用版です。ゲーム機能は `mabusaba-game` に完全分離されています。

## 起動
cp .env.example .env
npm install
npm run deploy
npm run start

Docker:
docker compose build
docker compose up -d

## DB
このBotは `src/data/moderation.db` を使用します。
旧v1.2.6の `games.db` は削除せず、Game Bot側へ移行してください。
