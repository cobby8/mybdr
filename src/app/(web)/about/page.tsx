import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/db/prisma";

// SEO: About(소개) 페이지 메타데이터
// 2026-04-29 카피 통일: "서울 3x3 농구 커뮤니티" → "전국 농구 매칭 플랫폼"
//  (mybdr는 전국/5x5+3x3 모두 지원하므로 지역·종목 한정 표현 제거)
export const metadata: Metadata = {
  title: "소개 | MyBDR",
  description:
    "MyBDR은 다음카페 시절부터 20년을 이어온 전국 농구 매칭 플랫폼입니다. 흩어져 있던 픽업, 대회, 팀, 코트 정보를 한 곳에 모읍니다.",
};

/* ============================================================
 * About — BDR v2.30 IU1 시안 박제 (Phase 10B · BI1)
 *
 * 이유(왜):
 *   기존 About(304줄, 인라인 스타일)을 v2.30 IU1 시안 구조로 교체.
 *   시안 source: Dev/design/BDR-current/screens/About.jsx + info-shared.css(.ab-*)
 *   + info-shared.jsx(ABOUT_*) + 미리보기 iu1-about.html
 *   API/Prisma/서비스 0 변경 — UI(클래스)만 교체. 데이터는 시안 상수 그대로.
 *
 * 구조 (시안 7 섹션):
 *   1. Hero — eyebrow + 타이틀 + 리드 카피 (info-hero 공통 클래스 재사용)
 *   2. 통계 4셀 — cross-domain 집계(전 Phase users/teams/tournaments/courts)
 *      ★ mock 숫자 새로 지어내기 ❌. 시안 예시값 + "운영 시점 연동" 캡션(ab-note).
 *   3. "우리가 만드는 것" 가치 6 카드
 *   4. ★ 운영진 — 사용자 결정 §6 보존: 실명 ❌ → 일반 팀 라벨 + 가드 배너(ab-guard)
 *   5. 파트너 8 (예시)
 *   6. FAQ 미니 → /help (IU3) 링크
 *   7. CTA — 가입(/login) + 경기 둘러보기(/games)
 *
 * 스타일:
 *   .ab-* 클래스는 globals.css 에 시안 info-shared.css 를 운영 토큰으로 이식.
 *   하드코딩 hex 0 / Material Symbols Outlined / pill 9999px 없음(정사각 원형 50%만).
 * ============================================================ */

// ── 통계 4 — cross-domain 실데이터 집계 (PR-MOCK-TO-REAL Batch2 ③) ──
//  왜: 기존 시안 예시값(48,000+ 등 mock) → prisma.count() 실값으로 연결.
//  "20년 역사"는 DB로 셀 수 없는 정적 카피이므로 유지(사용자 결정 §6 정적 카피 보존).
//  나머지 3셀(가입 멤버/등록 팀/개최 대회)은 운영 DB count 실값.
//  court_infos(672) vs courts(0) 실측 → court_infos 사용 확정(courts 빈테이블). 단 통계4는
//  users/teams/tournaments 3셀 + 정적 역사 1셀 구성이라 코트 셀은 없음.
async function getAboutStats(): Promise<{ v: string; k: string; src: string }[]> {
  // 3개 count 병렬 조회 (read-only · 운영 영향 0)
  const [userCount, teamCount, tournamentCount] = await Promise.all([
    prisma.user.count(),
    prisma.team.count(),
    prisma.tournament.count(),
  ]);
  return [
    // "20년" = 정적 카피 (DB 미산출 · 사용자 결정 §6 보존)
    { v: "20년", k: "커뮤니티 역사", src: "since 2006" },
    // 실값 — 천단위 콤마 포맷
    { v: userCount.toLocaleString("ko-KR"), k: "가입 멤버", src: "users" },
    { v: teamCount.toLocaleString("ko-KR"), k: "등록 팀", src: "teams" },
    { v: tournamentCount.toLocaleString("ko-KR"), k: "개최 대회", src: "tournaments" },
  ];
}

// ── 가치 6 — 시안 ABOUT_VALUES 그대로 ──
const values: { icon: string; t: string; d: string }[] = [
  { icon: "🏀", t: "공정한 매치", d: "레이팅 기반 팀 매칭으로 실력에 맞는 경기를 제공합니다" },
  { icon: "📊", t: "투명한 기록", d: "모든 경기 결과와 개인 스탯이 영구적으로 기록·공개됩니다" },
  { icon: "🌆", t: "지역 연결", d: "동네 코트부터 대회까지, 가까운 농구 활동을 빠르게 찾습니다" },
  { icon: "🤝", t: "열린 커뮤니티", d: "초보부터 선출까지, 누구나 편하게 뛸 수 있는 문화를 지향합니다" },
  { icon: "⚖️", t: "공정한 운영", d: "심판 자격·경기 규정·분쟁 처리 모두 공개된 기준을 따릅니다" },
  { icon: "💡", t: "지속가능성", d: "광고 없는 커뮤니티. 운영은 멤버십과 파트너십으로 충당합니다" },
];

// ── 운영진 — ★ 사용자 결정 §6 보존: 실명 노출 절대 금지 → 일반 팀 라벨만 ──
//  시안 ABOUT_TEAM 그대로. 실명/실제 직책 박제 ❌ (개인정보 보호 가드 배너 동반).
const team: { name: string; role: string; since: string }[] = [
  { name: "기획팀", role: "전략 · 기획", since: "2022" },
  { name: "개발팀", role: "프론트엔드 · 백엔드", since: "2022" },
  { name: "운영팀", role: "콘텐츠 · 운영", since: "2023" },
  { name: "디자인팀", role: "UX · UI", since: "2023" },
  { name: "커뮤니티팀", role: "파트너십 · 소통", since: "2024" },
  { name: "사업팀", role: "비즈니스 개발", since: "2024" },
];

// ── 파트너 8 — 시안 ABOUT_PARTNERS 그대로 (예시) ──
const partners: string[] = [
  "NIKE",
  "ADIDAS",
  "MOLTEN",
  "SPALDING",
  "UNDER ARMOUR",
  "BODY FRIEND",
  "11번가",
  "BDR STUDIO",
];

export default async function AboutPage() {
  // 통계4 실데이터 — server에서 prisma.count() 직접 조회 (read-only)
  const stats = await getAboutStats();
  return (
    <div className="page">
      <div className="ab-wrap">
        {/* ===== 1. Hero (info-hero 공통 클래스 재사용) ===== */}
        <header className="info-hero">
          <div className="eyebrow">소개 · ABOUT</div>
          {/* 시안 타이틀 42px — info-hero__title(34px) 위에 inline 오버라이드 */}
          <h1 className="info-hero__title" style={{ fontSize: 42 }}>
            농구를 더 가깝게
          </h1>
          <p className="info-hero__lead">
            MyBDR은 다음카페 시절부터 20년을 이어온{" "}
            <strong style={{ color: "var(--ink)" }}>전국 농구 매칭 플랫폼</strong>입니다.
            흩어져 있던 픽업, 대회, 팀, 코트 정보를 한 곳에 모아 누구나 쉽게 뛸 수 있는 환경을
            만듭니다.
          </p>
        </header>

        {/* ===== 2. 통계 4셀 — cross-domain 집계 (운영 시점 연동 예시) ===== */}
        <div className="ab-stats">
          {stats.map((s) => (
            <div key={s.k} className="ab-stat">
              <div className="ab-stat__v t-display">{s.v}</div>
              <div className="ab-stat__k">{s.k}</div>
              <div className="ab-stat__src">{s.src}</div>
            </div>
          ))}
        </div>
        {/* ★ 실값 반영 — users/teams/tournaments 는 운영 DB count 실데이터 */}
        <div className="ab-note">
          <span className="ico material-symbols-outlined">database</span>
          가입 멤버·등록 팀·개최 대회는 운영 데이터 기준 실시간 집계입니다.
        </div>

        {/* ===== 3. 우리가 만드는 것 (가치 6) ===== */}
        <section className="ab-section">
          <h2 className="ab-section__h">우리가 만드는 것</h2>
          <div className="ab-make">
            {values.map((v) => (
              <div key={v.t} className="ab-make-card">
                <div className="ab-make-card__icon">{v.icon}</div>
                <div className="ab-make-card__t">{v.t}</div>
                <div className="ab-make-card__d">{v.d}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ===== 4. 운영진 — ★ §6 실명 ❌ (일반 팀 라벨 + 가드 배너) ===== */}
        <section className="ab-section">
          <h2 className="ab-section__h">운영진</h2>
          <div className="ab-team">
            {team.map((m) => (
              <div key={m.name} className="ab-team-card">
                {/* 이니셜 아바타 — 사진 미준비, 팀 라벨 첫 글자 (실명 0) */}
                <div className="ab-team-card__avatar">{m.name[0]}</div>
                <div className="ab-team-card__name">{m.name}</div>
                <div className="ab-team-card__role">{m.role}</div>
                <div className="ab-team-card__since">since {m.since}</div>
              </div>
            ))}
          </div>
          {/* ★ §6 가드 배너 — 실명 비공개 정책 명시 */}
          <div className="ab-guard">
            <span className="ico material-symbols-outlined">verified_user</span>
            운영진은 개인정보 보호를 위해 일반 팀 라벨로 표기합니다 (실명 비공개 · 사용자
            결정 §6 보존).
          </div>
        </section>

        {/* ===== 5. 파트너 8 (예시) ===== */}
        <div className="ab-partners-wrap">
          <h2 className="ab-section__h" style={{ marginBottom: 4 }}>
            함께하는 파트너
          </h2>
          <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 16 }}>
            MyBDR의 대회·활동을 지원하는 브랜드들 (예시)
          </div>
          <div className="ab-partners">
            {partners.map((p) => (
              <div key={p} className="ab-partner">
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* ===== 6. FAQ 미니 → /help (IU3) ===== */}
        <div className="ab-faq">
          <div>
            <h3 className="ab-faq__t">궁금한 점이 있으신가요?</h3>
            <p className="ab-faq__d">
              자주 묻는 질문·용어 사전·정책을 도움말에서 한 번에 확인하세요.
            </p>
          </div>
          {/* 시안 iu3-help.html → 운영 라우트 /help */}
          <Link className="btn btn--primary" href="/help">
            <span className="ico material-symbols-outlined">help</span>도움말 보기
          </Link>
        </div>

        {/* ===== 7. CTA — 가입/로그인 모두 /login, 경기 둘러보기 /games ===== */}
        <div className="ab-cta">
          <h2 className="ab-cta__h">오늘, 농구할 수 있어요</h2>
          <div className="ab-cta__d">가까운 코트에서 당신을 기다리는 사람들이 있습니다</div>
          <div className="ab-cta__btns">
            {/* 시안 au1-login-signup.html → 운영 /login (시안 btn--accent) */}
            <Link href="/login" className="btn btn--accent btn--xl">
              지금 가입하기
            </Link>
            <Link href="/games" className="btn btn--xl">
              경기 둘러보기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
