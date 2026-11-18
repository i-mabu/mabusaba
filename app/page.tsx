import {
  CopyInviteButton,
  CurrentYear,
  ScrollReveal,
} from "@/components/ClientParts";

const INVITE = "https://discord.gg/GKkW4wCAVp";
const X_URL = "https://x.com/mabu_saba";

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M20.6 14.2A8.5 8.5 0 0 1 9.8 3.4a.6.6 0 0 0-.8-.8 10.5 10.5 0 1 0 12.4 12.4.6.6 0 0 0-.8-.8z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M20.32 4.37a19.8 19.8 0 0 0-4.93-1.51 13.8 13.8 0 0 0-.64 1.28 18.3 18.3 0 0 0-5.5 0 13.8 13.8 0 0 0-.64-1.28h-.05A19.7 19.7 0 0 0 3.64 4.37C.53 9.04-.32 13.58.1 18.06a19.9 19.9 0 0 0 6.04 3.03c.24-.33.47-.67.66-1.03a12.9 12.9 0 0 1-1.04-.5c.09-.07.17-.14.25-.21a14.2 14.2 0 0 0 12 0c.08.07.17.14.25.21-.34.2-.7.36-1.05.5.2.36.42.7.66 1.03a19.8 19.8 0 0 0 6.04-3.03c.5-5.18-.84-9.68-3.59-13.69ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42s.95-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42s.95-2.42 2.15-2.42c1.22 0 2.18 1.1 2.16 2.42 0 1.34-.95 2.42-2.16 2.42Z" />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <ScrollReveal />

      {/* ===== Header ===== */}
      <header className="site-header">
        <div className="wrap">
          <a className="logo" href="/">
            <MoonIcon />
            まぶ鯖
          </a>
          <nav className="main-nav" aria-label="メインナビゲーション">
            <a href="#things">できること</a>
            <a href="#media">公式メディア</a>
            <a href="#bot">mabubot</a>
            <a href="#rules">安心の取り組み</a>
            <a href="#faq">FAQ</a>
          </nav>
          <a
            className="btn btn-discord btn-small header-cta"
            href={INVITE}
            target="_blank"
            rel="noopener"
          >
            Discordに参加
          </a>
        </div>
      </header>

      <main>
        {/* ===== Hero ===== */}
        <div className="hero">
          <div className="wrap">
            <MoonIcon className="moon" />
            <h1>まぶ鯖</h1>
            <p className="tagline">
              🌙 メンバー募集中！「なんか暇だな…」と思ったそこのあなたへ
            </p>
            <p className="lead">
              ただ雑談するだけじゃない。いろんな人やコミュニティとつながりながら、
              <strong>自分のペースで楽しめる公開Discordコミュニティ</strong>
              です。
            </p>
            <div className="cta-row">
              <a
                className="btn btn-discord"
                href={INVITE}
                target="_blank"
                rel="noopener"
              >
                <DiscordIcon />
                Discordに参加する
              </a>
              <a className="btn btn-ghost" href="#media">
                公式メディアを見る
              </a>
            </div>
            <div className="hero-badges">
              <span>ROM専OK</span>
              <span>覗くだけOK</span>
              <span>初見さん歓迎</span>
              <span>自分のペースでOK</span>
            </div>
          </div>
          <figure className="hero-figure">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/images/hero-night.webp"
              alt="月夜の丘に集まって、チャットやゲームの話題で盛り上がる仲間たちのイラスト"
              width={2400}
              height={1014}
              fetchPriority="high"
            />
          </figure>
        </div>

        {/* ===== Things ===== */}
        <section id="things">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="kicker">WHAT YOU CAN DO</div>
              <h2>まぶ鯖でできること</h2>
              <p>
                話したいときに、話したい分だけ。気になる話題だけ参加しても大丈夫です。
              </p>
            </div>
            <ul className="cards reveal">
              <li>
                <div className="icon">💬</div>
                <h3>ゆるく雑談</h3>
                <p>日常のひとことから深夜のゆるトークまで。無理に盛り上げなくてOKです。</p>
              </li>
              <li>
                <div className="icon">🎮</div>
                <h3>ゲーム</h3>
                <p>一緒に遊ぶ相手探しや、好きなタイトルの情報交換に。</p>
              </li>
              <li>
                <div className="icon">🎵</div>
                <h3>音楽</h3>
                <p>おすすめ曲の共有や、作業のお供のプレイリスト交換など。</p>
              </li>
              <li>
                <div className="icon">🖼️</div>
                <h3>画像・動画</h3>
                <p>撮ったもの、作ったもの、見つけた面白いものを気軽にシェア。</p>
              </li>
              <li>
                <div className="icon">🧵</div>
                <h3>スレッドで自由に</h3>
                <p>好きな話題はスレッドを立ててどうぞ。自分の「好き」を置ける場所があります。</p>
              </li>
              <li>
                <div className="icon">🎉</div>
                <h3>イベント開催予定</h3>
                <p>みんなで集まれる企画を準備中。告知はDiscordと公式Xでお知らせします。</p>
              </li>
              <li className="wide">
                <div className="icon">🤝</div>
                <h3>他サーバーとの連携・交流</h3>
                <p>
                  コミュニティ同士のつながりも大切にしています。連携に興味のある運営者さんは、公式XのDMやDiscordで声をかけてください。
                </p>
              </li>
            </ul>
          </div>
        </section>

        {/* ===== Media ===== */}
        <section id="media">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="kicker">OFFICIAL MEDIA</div>
              <h2>公式メディア</h2>
              <p>まぶ鯖は3つの場所で運営しています。まずは眺めるだけでもどうぞ。</p>
            </div>
            <div className="media-cards reveal">
              <a className="media-card" href={INVITE} target="_blank" rel="noopener">
                <span className="role">本拠地</span>
                <h3>💬 Discord</h3>
                <p>雑談・ゲーム・イベント実施の中心地。参加は招待リンクから、いつでも自由です。</p>
                <span className="go">参加する →</span>
              </a>
              <a className="media-card" href={X_URL} target="_blank" rel="noopener">
                <span className="role">拡散・速報</span>
                <h3>𝕏 公式X</h3>
                <p>メンバー募集、イベント告知、サーバーの日常を発信しています。@mabu_saba</p>
                <span className="go">フォローする →</span>
              </a>
              <div className="media-card">
                <span className="role">蓄積・ガイド</span>
                <h3>📝 公式note</h3>
                <p>初見ガイド、ルール、イベントレポート、月刊の活動報告をまとめていく場所です。</p>
                <span className="soon">開設準備中</span>
              </div>
            </div>
          </div>
        </section>

        {/* ===== Bot ===== */}
        <section id="bot">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="kicker">ORIGINAL BOT</div>
              <h2>専用Bot「mabubot」</h2>
              <p>まぶ鯖のために作られた自家製Botが、サーバーの毎日をちょっと楽しくします。</p>
            </div>
            <div className="reveal">
              <ul className="cards">
                <li>
                  <div className="icon">⭐</div>
                  <h3>XP・レベル</h3>
                  <p>活動するとXPが貯まってレベルアップ。ランキングで競うのも楽しいです。</p>
                </li>
                <li>
                  <div className="icon">🔢</div>
                  <h3>数当てゲーム</h3>
                  <p>ヒントを頼りに数字を当てる、つい熱くなるミニゲーム。</p>
                </li>
                <li>
                  <div className="icon">🗳️</div>
                  <h3>投票・募集</h3>
                  <p>アンケートやメンバー募集を手軽に。意見集めや遊び相手探しに。</p>
                </li>
                <li>
                  <div className="icon">⏲️</div>
                  <h3>タイマー</h3>
                  <p>ゲームや作業のお供に使えるシンプルなタイマー機能。</p>
                </li>
                <li>
                  <div className="icon">👋</div>
                  <h3>ウェルカム</h3>
                  <p>新しいメンバーを温かく迎えるウェルカムメッセージ。</p>
                </li>
                <li>
                  <div className="icon">🌙</div>
                  <h3>これからも成長中</h3>
                  <p>まぶ鯖と一緒に、機能は少しずつ増えていきます。</p>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* ===== Rules ===== */}
        <section id="rules">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="kicker">SAFE &amp; WELCOMING</div>
              <h2>安心して楽しめる環境づくり</h2>
              <p>みんなが気持ちよく交流できるコミュニティを目指しています。</p>
            </div>
            <ul className="cards reveal">
              <li>
                <div className="icon">🚫</div>
                <h3>荒らし・攻撃目的は禁止</h3>
                <p>相手を傷つけるための参加はお断りしています。</p>
              </li>
              <li>
                <div className="icon">🛡️</div>
                <h3>妨害行為はNG</h3>
                <p>コミュニティの交流を妨げる行為は禁止です。</p>
              </li>
              <li>
                <div className="icon">🌱</div>
                <h3>初見さんも参加しやすく</h3>
                <p>「どこで話せばいいかわからない」人も大歓迎。まずは眺めるだけでもOKです。</p>
              </li>
            </ul>
            <ul className="ok-list reveal">
              <li>ROM専でもOK</li>
              <li>ちょっと覗くだけでもOK</li>
              <li>気になる話題に参加するだけでもOK</li>
            </ul>
          </div>
        </section>

        {/* ===== Collab ===== */}
        <section id="collab">
          <div className="wrap">
            <div className="split reveal">
              <div>
                <div
                  className="kicker"
                  style={{
                    color: "var(--accent)",
                    fontWeight: 700,
                    letterSpacing: ".14em",
                    fontSize: ".82rem",
                  }}
                >
                  COLLABORATION
                </div>
                <h2>他サーバーとの連携も！</h2>
                <p style={{ color: "var(--muted)" }}>
                  まぶ鯖では、他のDiscordサーバーとの連携・交流も歓迎しています。イベントの相互告知や、コミュニティ同士の交流に興味のある運営者さんは、お気軽に声をかけてください。
                </p>
                <ul className="feature-list">
                  <li>
                    <strong>連絡先</strong> ― 公式X{" "}
                    <a href={X_URL} target="_blank" rel="noopener">
                      @mabu_saba
                    </a>{" "}
                    のDM、またはDiscord内で
                  </li>
                  <li>
                    <strong>できること</strong> ― イベントの相互告知、交流企画の相談など
                  </li>
                </ul>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/images/collab-bridge.webp"
                alt="光の橋でつながる2つの浮島と、手を振り合う人々のイラスト"
                width={2400}
                height={1014}
                loading="lazy"
              />
            </div>
          </div>
        </section>

        {/* ===== FAQ ===== */}
        <section id="faq">
          <div className="wrap">
            <div className="section-head reveal">
              <div className="kicker">FAQ</div>
              <h2>よくある質問</h2>
            </div>
            <div className="faq reveal">
              <details>
                <summary>ROM専でも大丈夫ですか？</summary>
                <p>
                  大丈夫です。読むだけ、眺めるだけの参加も歓迎しています。話したくなったときに、話したくなった分だけどうぞ。
                </p>
              </details>
              <details>
                <summary>Discordを使うのが初めてです</summary>
                <p>
                  初見さんも参加しやすい環境を目指しています。招待リンクから参加して、まずは雰囲気を眺めてみてください。分からないことは気軽に聞いてください。
                </p>
              </details>
              <details>
                <summary>参加にお金はかかりますか？</summary>
                <p>かかりません。公開コミュニティとして、誰でも無料で参加できます。</p>
              </details>
              <details>
                <summary>他のサーバーと連携したいです</summary>
                <p>
                  歓迎しています。公式X（@mabu_saba）のDMか、Discord内で運営に声をかけてください。
                </p>
              </details>
            </div>
          </div>
        </section>

        {/* ===== Join ===== */}
        <section id="join">
          <div className="wrap">
            <div className="join-panel reveal">
              <MoonIcon className="moon-big" />
              <h2>まずは気軽に遊びに来てください</h2>
              <p>参加は招待リンクから。下のボタン、またはリンクのコピーでどうぞ。</p>
              <div className="cta-row">
                <a className="btn btn-discord" href={INVITE} target="_blank" rel="noopener">
                  Discordで参加する
                </a>
                <a className="btn btn-x" href={X_URL} target="_blank" rel="noopener">
                  公式Xを見る
                </a>
              </div>
              <CopyInviteButton />
            </div>
          </div>
        </section>
      </main>

      {/* ===== Footer ===== */}
      <footer>
        <div className="wrap">
          <div className="f-name">🌙 まぶ鯖</div>
          <p>自分のペースで楽しめる、公開Discordコミュニティ。</p>
          <nav aria-label="フッターナビゲーション">
            <a href={INVITE} target="_blank" rel="noopener">
              Discord
            </a>
            <a href={X_URL} target="_blank" rel="noopener">
              公式X @mabu_saba
            </a>
            <a href="#media">公式note（開設準備中）</a>
            <a href="#things">できること</a>
            <a href="#faq">FAQ</a>
          </nav>
          <p>
            © <CurrentYear /> まぶ鯖
          </p>
        </div>
      </footer>
    </>
  );
}
