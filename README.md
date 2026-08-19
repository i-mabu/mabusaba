# mabusaba 改良版

Discord.js v14 + SQLite (`better-sqlite3`) のコミュニティBotです。

## 主な追加機能

### モデレーション
- `/moderation history user:@user` — 処罰履歴（ページング）
- `/moderation case id:123` — Case詳細
- `/moderation search query:...` — Case検索
- `/moderation stats [user]` — 処罰統計
- `/moderation note id:123` — 管理者メモ
- `/warn`, `/mute`, `/kick`, `/ban`, `/unmute`, `/unban`
- すべての処罰にCase IDを付与
- 処罰情報を `src/data/moderation.db` に保存

### 監査ログ
Bot独自の監査ログDBに以下を保存します。
- MEMBER
- MODERATION
- MESSAGE
- CHANNEL
- ROLE
- BOT
- GAME
- SYSTEM

検索:
`/audit-log [type] [query] [user]`

ログ送信先は以下の環境変数を上から順に使用します。

```env
AUDIT_LOG_CHANNEL_ID=
MOD_LOG_CHANNEL_ID=
LOG_CHANNEL_ID=
```

### ゲーム
既存の `/game` を維持しつつ、以下を追加。

`/game-plus blackjack`
`/game-plus roulette`
`/game-plus quiz`
`/game-plus numberguess`

結果は既存のゲームポイント・ゲームログへ記録されます。

## 起動

```bash
npm install
npm run deploy
npm start
```

`.env`:

```env
DISCORD_TOKEN=YOUR_BOT_TOKEN
CLIENT_ID=YOUR_APPLICATION_ID
GUILD_ID=YOUR_TEST_GUILD_ID

AUDIT_LOG_CHANNEL_ID=YOUR_LOG_CHANNEL_ID
AUTO_ROLE_ID=YOUR_ROLE_ID
```

`deploy-commands.js` の既存設定に合わせて `CLIENT_ID` / `GUILD_ID` を設定してください。

## 注意

- SQLite DBは実行時に自動作成されます。
- `src/data/*.db` はGit管理対象外です。
- Botには必要な権限（Moderate Members / Ban Members / Kick Members / View Audit Log / Embed Links等）を付与してください。
