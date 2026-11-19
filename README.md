# まぶ鯖 公式サイト

Discordコミュニティ「まぶ鯖」の公式サイトです。Next.js で構築し、Vercel で公開します。

- 公式サイト: [mabusaba.vercel.app](https://mabusaba.vercel.app/)
- Discord招待: [discord.gg/GKkW4wCAVp](https://discord.gg/GKkW4wCAVp)（短縮: [mabusaba.vercel.app/discord](https://mabusaba.vercel.app/discord)）
- 公式X: [@mabu_saba](https://x.com/mabu_saba)（短縮: [mabusaba.vercel.app/x](https://mabusaba.vercel.app/x)）
- 公式note: [note.com/mabu_saba](https://note.com/mabu_saba)（短縮: [mabusaba.vercel.app/note](https://mabusaba.vercel.app/note)、開設後に有効）

## 構成

```
app/layout.tsx          メタデータ / フォント / 共通レイアウト
app/page.tsx            トップページ（全セクション）
app/not-found.tsx       404ページ
app/globals.css         スタイル（ダーク基調 / ライトは端末設定に追従）
components/ClientParts.tsx  招待リンクコピー / スクロール表示 / 年表示
public/assets/images/   ヒーロー・連携セクションのイラスト（WebP）
public/favicon.svg      三日月ファビコン
public/robots.txt / public/sitemap.xml
vercel.json             短縮リンク（/discord /x /note）+ セキュリティヘッダー + キャッシュ
next.config.mjs         静的書き出し（output: "export"）
```

セクション: ヒーロー / できること / 公式メディア（Discord・X・note）/ mabubot紹介 / 安心の取り組み / 他サーバー連携 / FAQ / 参加

## 公開（Vercel）

- プロジェクト: Vercel（個人アカウント i-mabu、Hobby プラン）の `mabusaba`
- 本番 URL: [mabusaba.vercel.app](https://mabusaba.vercel.app/)
- GitHub リポジトリ `i-mabu/mabusaba` と連携済みです

### 通常の更新

`main` へ push すると Vercel が自動で再デプロイします。

独自ドメインは当面使いません。将来使う場合は、Vercel プロジェクトの **Domains** から追加し、`app/layout.tsx` の SITE_URL と `public/sitemap.xml`、`public/robots.txt` の URL もドメイン側へ差し替えてください。

## ローカル確認

```bash
npm install
npm run dev
# http://localhost:3000 を開く
```
