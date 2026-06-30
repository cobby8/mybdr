# MyBDR Design System (v4)

> **MyBDR (Basketball Daily Routine)** — 전국 농구 매칭 플랫폼.
> A nationwide Korean basketball platform: pickup games, guest recruiting, scrimmages, tournaments, team management, court booking, rankings, and a companion scoring app — unified. Live at **[mybdr.kr](https://mybdr.kr)**.

This project is the reusable design system: dual-mode tokens with a **single point color per mode** (light = Toss blue, dark = BDR red), reusable React components, foundation specimens, and an interactive UI-kit recreation.

---

## 1. The headline: two modes, one point color each

The color system is deliberately restrained — **one accent (point) color per mode**, switched by a single attribute on `<html>`:

- **`data-mode="light"`** — clean admin (Toss-style) chrome. Point color = **Toss blue `#3182F6`**.
- **`data-mode="dark"`** — sporty mode. Point color = **BDR red `#E31B23`**.

Brand red `#E31B23` is a fixed token (`--red`) for LIVE / record / brand moments; in dark mode it is also the accent. Semantics (`--ok`, `--warn`, `--danger`, `--info`) are fixed. The signature slots (`--sig*`) collapse onto the single accent, so nothing renders as a second decorative hue — avatars, progress bars, eyebrow ticks all use the one point color.

The switch is driven by **`assets/bdr-theme.js`** (`window.BDRTheme`): `setMode()`, `toggleMode()`, persisted to `localStorage` and synced across tabs.

```html
<html data-mode="light">
<script src="assets/bdr-theme.js"></script>
<script>BDRTheme.toggleMode();</script>
```

> Earlier drafts shipped a 4-accent (electric/volt/hardwood/courtvision) switcher; it read too busy, so the system was rolled back to this single-accent-per-mode model.

### Sources (stored for whoever maintains this — you may not have access)
- **Uploaded v4 system:** `uploads/BDR Design System v4 (1)/` — `assets/bdr-tokens.css`, `assets/bdr-theme.js`, `컴포넌트 카탈로그.html`, `색상 테마 설정.html`, `홈 대시보드.html`.
- **GitHub:** [`cobby8/mybdr`](https://github.com/cobby8/mybdr) — the production Next.js codebase (explore for higher-fidelity work).
- **Codebase (mounted):** `mybdr/` — `src/app/globals.css` / `Dev/design/` describe an older direction; this system supersedes it.

---

## 2. Content fundamentals (voice & copy)

**Language.** Korean-first. UI labels, buttons, and body copy are Korean; English appears only in display headings/wordmarks (Archivo) and as mono labels/route names (IBM Plex Mono). Numbers and scores are everywhere.

**Tone.** Friendly-direct and practical, like a club captain — short imperatives, action-first.
- Buttons: `경기 기록 시작`, `대회 만들기`, `지금 신청하기`, `전체 보기 →`.
- Status: `접수중`, `마감 임박`, `종료`, `본인인증 완료`, `승인 대기중`.
- Helper text is concrete: `8자리 남음`, `호스트 승인을 기다려주세요`, `D-1`, `설정에서 저장 · 전 페이지 공유`.

**Person.** Addresses the user as a player ("내 기록", "내 신청 현황"). Polite-informal register — `~하실 분`, `~해요`, `~세요` (not stiff `~하십시오`). Warm greetings: `좋은 아침이에요, 수빈님 🏀`.

**Casing.** English display text is often UPPERCASE for eyebrows/labels (`GAMES · 곧 시작`, `MYBDR`, `LIVE`). Mono labels are uppercase with wide letter-spacing.

**Emoji.** Sparingly — a basketball 🏀 in greetings, the occasional section marker. Material Symbols is the primary icon system; emoji is secondary and never decorates generic chrome.

**Numbers.** Tabular mono (`tnum`) for all stats, scores, fees, counts, route labels, timestamps.

---

## 3. Visual foundations

**Two modes, two moods.**
- **LIGHT = clean admin (Toss-style).** Page bg `#F2F4F6`, white cards, soft borders, layered soft-blur shadows. Calm, trustworthy, management chrome. `--primary` = Toss blue `#3182F6`.
- **DARK = sporty.** Deep ink `#0A0C10`/`#161B22` surfaces, deeper shadows. `--primary` = BDR red `#E31B23` — the brand goes accent-forward.

**Soft, rounded geometry (Toss-like).** Radii are generous: chips `7px`, inputs `9px`, **buttons `11px`**, surfaces `13px`, **cards `16px`**. No hard brutalist corners; no 9999px pills on rectangles (squares→circles use `50%`).

**Color slots.** One point color per mode fills these slots so components stay monochromatic: `--primary` / `--primary-deep` / `--primary-on` (the CTA color), `--soft-fill` / `--soft-ink` (tinted chips/active states), and `--sig*` (signature — collapses onto `--primary`, used for eyebrow ticks, avatars, progress fills). Brand `--red` and semantics (`--ok #15B66E`, `--warn #FF9500`, `--danger #F04452`, `--info #3182F6`) are fixed.

**Type.** Display = **Archivo** (athletic, weight 800, tight tracking, big tabular numbers). Body = **Pretendard** (Korean-first, 400–700). Mono = **IBM Plex Mono** (stats, scores, route labels, eyebrows — sturdy tabular numerals that stay legible when small). The eyebrow — a short signature-color tick + uppercase mono kicker — is the recurring rhythm element.

**Backgrounds.** Mostly flat token surfaces. The dashboard hero uses a `--primary-deep → --primary` gradient with a soft `--glow` radial. No photographic full-bleeds in chrome, no noise, no decorative SVG illustration; the "imagery" is typographic (big Archivo numbers, the BDR wordmark, the circular ball mark).

**Cards.** `--card` bg, 1px `--border`, soft 16px corners, layered shadow (`0 1px 2px` + `0 10px 30px -12px var(--shadow)`). Titled cards add a header bar with a primary-colored icon. Hover lifts (`translateY(-2px)`).

**Game kinds.** Game types are shown as **neutral label chips** (one calm chip for all of 픽업 / 게스트 / 스크림 / 대회) — distinguished by text, not color — and game cards carry no decorative left-border color. Only functional state colors remain (LIVE red, 접수중 green).

**Animation.** Restrained. Mode/accent transitions cross-fade `.35s`. The signature motion is the **LIVE pulse** (red dot expanding ring) and a thin indeterminate progress sweep. `[data-motion="off"]` disables all of it. No bounces, reduced-motion safe.

**States.** Hover = subtle `--alt` lift / border darken. Primary buttons darken to `--primary-deep`; pressed shrinks slightly. Focus = `2px solid var(--primary)` ring. Disabled = `.45` opacity.

**Layout.** Sidebar + topbar app shell (248px rail). Content max-width ~1100–1200px. 720px mobile breakpoint, 44–48px touch/pen targets.

---

## 4. Iconography

- **Primary: Material Symbols Outlined** (Google Fonts CDN, loaded in `tokens/fonts.css`). All UI glyphs — `search`, `notifications`, `palette`, `sports_basketball`, `emoji_events`, `location_on`, `schedule`, `verified`, `bolt`, `check_circle`, etc. Render with `<span class="material-symbols-outlined">name</span>`. Sizes 18–24px; bottom-nav fills (`FILL 1`) when active.
- **Banned:** `lucide-react`, `react-icons`, Heroicons, or any other icon package — Material Symbols only.
- **Emoji** is a secondary, validated accent (🏀 in greetings). No new emoji in chrome.
- **No hand-drawn SVG icons.**
- **Brand mark:** `assets/bdr-logo.png` — the italic BDR wordmark (navy/red). The app lockup pairs a circular red ball mark (`sports_basketball` glyph) with **My BDR** (red "BDR").

---

## 5. Index / manifest

**Foundations**
- `styles.css` — entry point (`@import` manifest only).
- `tokens/fonts.css` — Archivo + Pretendard + IBM Plex Mono + Material Symbols (CDN).
- `tokens/colors.css` — fixed brand/semantic, light/dark neutrals, **single point color per mode** (Toss blue / BDR red).
- `tokens/typography.css` — families, scale, helper classes (`.eyebrow`, `.t-display`).
- `tokens/spacing.css` — soft radii (7–16px), spacing, grid.

**Theme engine** — `assets/bdr-theme.js` (`window.BDRTheme`): mode (light/dark/system) control + persistence.

**Components** (`window.MyBDRDesignSystem_248b35.*`)
- Core: `Button`, `IconButton`, `Badge`, `KindBadge`, `Card`, `Avatar`, `Chip`, `Tag`, `Stat`, `Eyebrow` — `components/core/`. `Chip` is a filter *toggle*; `Tag` is a selected/removable token (pass `onRemove` for the ×).
- Forms: `Field`, `Input`, `Textarea`, `Select`, `PasswordInput`, `PhoneInput`, `BirthDateInput`, `Checkbox`, `Radio`/`RadioGroup`, `Toggle`, `StarRating` — `components/forms/`. Soft 9px-radius controls, themed focus ring; compose with `Field` (label + helper/error). `PhoneInput`/`BirthDateInput` auto-format and never use raw `type="tel"`/`type="date"`; `PasswordInput` always carries the visibility toggle.
- Feedback: `Skeleton`, `Spinner`, `ProgressBar`, `EmptyState`, `AlertCard`, `Toast`/`ToastViewport` — `components/feedback/`. Reduced-motion safe; `ProgressBar` auto-switches to `--ok` on complete. `AlertCard` is a persistent tone-tinted inline notice; `Toast` is the transient floating variant (stack with `ToastViewport`).
- Basketball: `GameCard`, `ApplyStep`, `PlayerMatchCard`, `NewsCard`, `AdCard`, `ReviewBlock`, `RefereePickCard`, `FollowButton`, `LiveChipRow`, `PlayerLink`, `TeamLink` — `components/basketball/`. Domain composites: `PlayerMatchCard` (result card, winner marked), `LiveChipRow` (sticky pulsing live strip), `AdCard` (feed/sidebar/list, always 광고-labelled), `FollowButton` (optimistic toggle), `PlayerLink`/`TeamLink` (degrade to text when id missing).
- List: `ListItem`, `BoardRow`, `HotPostRow`, `TournamentRow`, `DataTable`, `LoadMoreButton` — `components/list/`. `DataTable` reflows to mobile cards (≤720px) via `data-label`; `BoardRow` collapses to a stacked card with a meta line; `LoadMoreButton` shows the remaining count.
- Nav: `AppNav`, `BottomNav`, `PageHeader`, `BackButton`, `NavBadge`, `Footer` — `components/nav/`. `AppNav` = utility row + wordmark + tabs + actions; `BottomNav` = fixed mobile tab bar (active-fill icons); `NavBadge` = dot/count/new/live(pulse).
- Structure: `SectionHeader`, `CardPanel`, `StatsStrip`, `Accordion`, `Pagination` — `components/structure/`. `SectionHeader` = big title + “전체 보기 ›”; `CardPanel` = titled card with a header action bar; `StatsStrip` = responsive auto-fit metric grid; `Accordion` single-open by default; `Pagination` takes `totalPages` or `totalItems`+`pageSize`.
- Overlay: `Tooltip`, `Modal`, `Dropdown` — `components/overlay/`. `Tooltip` = hover/focus label bubble (4 sides). `Modal` = controlled centered dialog (ESC / backdrop close, scroll lock, focus). `Dropdown` = click menu from a trigger with outside-click/ESC close; items take `icon`/`href`/`onClick`/`tone:"danger"`/`divider`.

**Guidelines** — foundation specimen cards in `guidelines/` (Colors / Type / Spacing / Brand), incl. the **Theme — Light / Dark** switcher card.

**UI Kit** — `ui_kits/mybdr-web/` — dashboard → games → detail + **색상 테마** settings, with the live theme switcher. See its `README.md`.

**Templates** — `templates/mybdr-games/` — a copy-ready 경기 목록 page DC (filter chips + GameCard grid + mode switch).

**Assets** — `assets/bdr-logo.png`, `assets/logo.png`, `assets/icon-*.png`, `assets/bdr-theme.js`.

**Skill** — `SKILL.md` (Agent-Skills compatible).

---

## 6. Substitutions & caveats
- **Pretendard (body) is self-hosted** — `assets/fonts/PretendardVariable.woff2`, a variable `@font-face` in `tokens/fonts.css`. Archivo / IBM Plex Mono / Material Symbols still load from the Google Fonts CDN; drop in their `.woff2` for a fully offline bundle.
- An older **v2** dual-theme (red/navy/café-blue, brutalist dark) exists in the mounted codebase (`mybdr/Dev/design`, `globals.css`). **v4 supersedes it** — this system follows the uploaded `BDR Design System v4`.
