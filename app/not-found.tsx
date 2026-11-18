import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ページが見つかりません | まぶ鯖",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="wrap notfound">
      <svg
        viewBox="0 0 24 24"
        fill="currentColor"
        aria-hidden="true"
        style={{
          width: "44px",
          height: "44px",
          color: "var(--accent)",
          margin: "0 auto",
        }}
      >
        <path d="M20.6 14.2A8.5 8.5 0 0 1 9.8 3.4a.6.6 0 0 0-.8-.8 10.5 10.5 0 1 0 12.4 12.4.6.6 0 0 0-.8-.8z" />
      </svg>
      <h1>404 - ページが見つかりません</h1>
      <p style={{ color: "var(--muted)" }}>
        お探しのページは、夜空のどこかへ行ってしまったようです。
      </p>
      <div className="cta-row">
        <a className="btn btn-discord" href="/">
          トップへ戻る
        </a>
        <a
          className="btn btn-ghost"
          href="https://discord.gg/GKkW4wCAVp"
          target="_blank"
          rel="noopener"
        >
          Discordに参加する
        </a>
      </div>
    </main>
  );
}
