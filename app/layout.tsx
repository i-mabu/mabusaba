import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const SITE_URL = "https://mabusaba.pages.dev";
const DESCRIPTION =
  "まぶ鯖は、自分のペースで楽しめる公開Discordコミュニティです。雑談・ゲーム・音楽・画像動画・スレッド自由。ROM専・覗くだけ・初見さん大歓迎。公式X @mabu_saba / 公式noteでも発信しています。";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "まぶ鯖 | ゆるく集まれる公開Discordコミュニティ",
  description: DESCRIPTION,
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    siteName: "まぶ鯖",
    title: "まぶ鯖 | ゆるく集まれる公開Discordコミュニティ",
    description:
      "「なんか暇だな…」と思ったそこのあなたへ。自分のペースで楽しめる公開Discordコミュニティです。",
    url: "/",
    images: ["/assets/images/hero-night.webp"],
  },
  twitter: {
    card: "summary_large_image",
    site: "@mabu_saba",
  },
  icons: {
    icon: "/favicon.svg",
  },
  other: {
    "theme-color": "#0d1026",
  },
};

const JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "まぶ鯖",
  url: `${SITE_URL}/`,
  sameAs: [
    "https://x.com/mabu_saba",
    "https://note.com/mabu_saba",
    "https://discord.gg/GKkW4wCAVp",
  ],
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ja">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Zen+Maru+Gothic:wght@500;700;900&family=Zen+Kaku+Gothic+New:wght@400;500;700;900&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
