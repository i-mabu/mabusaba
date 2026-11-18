"use client";

import { useEffect, useState } from "react";

const INVITE_URL = "https://discord.gg/GKkW4wCAVp";

// ===== 1. 招待リンクのコピーボタン =====
export function CopyInviteButton() {
  const [feedback, setFeedback] = useState("");

  useEffect(() => {
    if (!feedback) return;
    const t = window.setTimeout(() => setFeedback(""), 3200);
    return () => window.clearTimeout(t);
  }, [feedback]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(INVITE_URL);
      setFeedback("招待リンクをコピーしました");
    } catch {
      const ta = document.createElement("textarea");
      ta.value = INVITE_URL;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand("copy");
        setFeedback("招待リンクをコピーしました");
      } catch {
        setFeedback(
          "コピーできませんでした。リンクを長押し／右クリックでコピーしてください",
        );
      }
      document.body.removeChild(ta);
    }
  }

  return (
    <>
      <div className="invite-box">
        <span className="invite-url">discord.gg/GKkW4wCAVp</span>
        <button className="btn btn-copy" type="button" onClick={copy}>
          招待リンクをコピー
        </button>
      </div>
      <p className="copy-feedback" role="status" aria-live="polite">
        {feedback}
      </p>
    </>
  );
}

// ===== 2. スクロールでセクションを表示 =====
export function ScrollReveal() {
  useEffect(() => {
    const targets = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window) || !targets.length) {
      targets.forEach((el) => el.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    targets.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return null;
}

// ===== 3. フッターの年表示 =====
export function CurrentYear() {
  const [year, setYear] = useState(2026);
  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);
  return <span>{year}</span>;
}
