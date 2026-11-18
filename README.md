# まぶ鯖 公式サイト

Discordコミュニティ「まぶ鯖」の公式サイトです。Next.js で構築し、Cloudflare Pages で公開します。

- 公式サイト: [mabusaba.pages.dev](https://mabusaba.pages.dev/)
- Discord招待: [discord.gg/GKkW4wCAVp](https://discord.gg/GKkW4wCAVp)（短縮: [mabusaba.pages.dev/discord](https://mabusaba.pages.dev/discord)）
- 公式X: [@mabu_saba](https://x.com/mabu_saba)（短縮: [mabusaba.pages.dev/x](https://mabusaba.pages.dev/x)）
- 公式note: [note.com/mabu_saba](https://note.com/mabu_saba)（短縮: [mabusaba.pages.dev/note](https://mabusaba.pages.dev/note)、開設後に有効）

## 構成

```
app/layout.tsx          メタデータ / フォント / 共通レイアウト
app/page.tsx            トップページ（全セクション）
app/not-found.tsx       404ページ
app/globals.css         スタイル（ダーク基調 / ライトは端末設定に追従）
components/ClientParts.tsx  招待リンクコピー / スクロール表示 / 年表示
public/assets/images/   ヒーロー・連携セクションのイラスト（WebP）
public/favicon.svg      三日月ファビコン
public/_headers         セキュリティヘッダー + アセットのキャッシュ
public/_redirects       /discord /x /note の短縮リンク
public/robots.txt / public/sitemap.xml
wrangler.toml           Pages設定（name = mabusaba, 出力は out）
next.config.mjs         静的書き出し（output: "export"）
```

セクション: ヒーロー / できること / 公式メディア（Discord・X・note）/ mabubot紹介 / 安心の取り組み / 他サーバー連携 / FAQ / 参加

## 公開（Cloudflare Pages）

### 初回セットアップ（Cloudflareダッシュボード）

1. Cloudflare → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. リポジトリ `i-mabu/mabusaba` を選択
3. ビルド設定:
   - Project name: `mabusaba`
   - Production branch: `main`
   - Framework preset: **Next.js (Static HTML Export)**
   - Build command: `npm run build`
   - Build output directory: `out`
4. **Save and Deploy** → [mabusaba.pages.dev](https://mabusaba.pages.dev/) で公開される

独自ドメインは当面使いません。将来使う場合は、プロジェクトの **Custom domains** から追加し、`app/layout.tsx` の SITE_URL と `public/sitemap.xml`、`public/robots.txt` のURLもドメイン側へ差し替えてください。

### 通常の更新

`main` へ push すると Cloudflare Pages が自動で再デプロイします。

## ローカル確認

```bash
npm install
npm run dev
# http://localhost:3000 を開く
```
