import Link from "next/link";
import type { Metadata } from "next";
import RefereeInfoFaq from "./_faq-client";

/* ============================================================
 * RefereeInfo — /referee-info (BDR v2.2 P3-1 신규 라우트)
 *
 * 이유(왜):
 *   사이트의 `/referee` 는 심판 플랫폼(심판 활동 화면)을 점유 중 →
 *   심판 제도 안내(D등급 F→A) 페이지를 별도 라우트 `/referee-info`로 신설.
 *   비로그인 열람 가능한 공개 SEO 페이지 (getWebSession 가드 X) — 검색
 *   엔진 인덱스 친화 + 외부 마케팅 진입점 활성.
 * Pattern: 마케팅 랜딩 톤, full-bleed hero + 4 step + tier 표 + FAQ + CTA
 *
 * 시안 출처:
 *   Dev/design/BDR v2.2/screens/RefereeInfo.jsx (D등급 F→A)
 *
 * 진입: 더보기 메뉴 "심판 센터 안내" / SEO 검색 인덱스 / Help 링크
 * 복귀: AppNav 뒤로 → / (홈) / 비로그인 → /signup / 로그인 사용자는 활동 중인 심판 보기 → /referee
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지 | 시안 v2.2          | 진입점        | 모바일
 *   Hero + 한 줄      | -        | ✅ full-bleed       | SEO/더보기    | 1열
 *   4 step process    | -        | ✅ 그리드           | -            | 1열
 *   자격·보수 표      | -        | ✅ 3열 카드         | -            | 1열
 *   FAQ 5개           | -        | ✅ accordion        | -            | OK
 *   CTA               | -        | ✅ 비/로그인 분기   | -            | 하단 sticky
 * ============================================================ */

// SEO: 심판 제도 안내 메타데이터 (Open Graph 포함)
export const metadata: Metadata = {
  title: "심판 센터 안내 | MyBDR",
  description:
    "BDR 인증 심판은 픽업부터 공식 토너먼트까지, 매주 50건 이상의 경기에 배정됩니다. 온라인 교육 후 첫 콜까지 평균 7일.",
  openGraph: {
    title: "심판 센터 안내 | MyBDR",
    description:
      "경기를 만드는 또 하나의 길, 심판이 되어보세요. BRONZE/SILVER/GOLD 3등급 보수 체계와 신청 → 교육 → 평가 → 인증 4단계 안내.",
    type: "website",
  },
};

// 4 step process — 시안 그대로
const steps: { n: string; title: string; body: string }[] = [
  { n: "01", title: "온라인 신청", body: "프로필·자격 정보를 등록 (5분)" },
  { n: "02", title: "온라인 교육", body: "규칙 영상 강의 + 퀴즈 (2시간)" },
  { n: "03", title: "실기 평가", body: "실제 픽업 경기 1회 배정 평가" },
  { n: "04", title: "심판 인증", body: "활동 시작 — 등급별 콜 접수" },
];

// 등급/보수 — 시안 그대로
const tiers: { tier: string; fee: string; desc: string; req: string }[] = [
  {
    tier: "BRONZE",
    fee: "₩30,000 / 경기",
    desc: "픽업·게스트 경기",
    req: "기본 교육 수료",
  },
  {
    tier: "SILVER",
    fee: "₩50,000 / 경기",
    desc: "동호회 정기 리그",
    req: "30 경기 이상 + 평점 4.0",
  },
  {
    tier: "GOLD",
    fee: "₩80,000 / 경기",
    desc: "BDR 공식 토너먼트",
    req: "KBA 자격증 + 평점 4.5",
  },
];

// 통계 strip — 시안 가데이터 (실수치 확정 후 동적 카운트로 교체 큐)
const heroStats: { k: string; v: string }[] = [
  { k: "활동 심판", v: "127명" },
  { k: "주간 경기", v: "52건" },
  { k: "평균 평점", v: "4.6 / 5.0" },
];

// FAQ 5개 — 시안 그대로
const faqs: { q: string; a: string }[] = [
  {
    q: "농구 경험이 없어도 신청할 수 있나요?",
    a: "규칙을 정확히 이해하고 있다면 가능합니다. 다만 실기 평가에서 경기 흐름을 읽는 능력이 평가되어, 일정 수준의 경기 관전 경험을 권장합니다.",
  },
  {
    q: "교육과 평가 비용은 얼마인가요?",
    a: "BRONZE 등급까지는 무료입니다. SILVER 이상 승급 시 KBA 자격증 취득 비용이 별도 발생합니다.",
  },
  {
    q: "정산은 언제 받나요?",
    a: "경기 완료 후 양 팀 모두의 평점 등록을 마치면, 매주 화요일 등록된 계좌로 일괄 입금됩니다.",
  },
  {
    q: "활동 지역을 선택할 수 있나요?",
    a: "활동 가능한 행정구를 최대 5곳까지 등록할 수 있으며, 등록한 지역의 경기만 알림으로 받습니다.",
  },
  {
    q: "분쟁이 발생하면 어떻게 처리되나요?",
    a: "경기 중 분쟁은 심판이 1차 판정합니다. 사후 이의제기는 BDR 운영팀이 영상 검토 후 최종 판정합니다.",
  },
];

export default function RefereeInfoPage() {
  // 공개 SEO 페이지 정책: getWebSession 가드 미사용 — 비로그인 열람 가능.
  // CTA는 항상 가입/로그인 동선 노출 (서버 컴포넌트라 클라이언트 isLoggedIn 분기 X,
  // 시안의 `isLoggedIn` 분기는 로그인 사용자 동선이 /referee로 이동하면 그쪽에서 CTA 처리).
  return (
    <div className="page page--wide" style={{ paddingBottom: 120 }}>
      {/* ===== Hero ===== */}
      <div
        className="card"
        style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}
      >
        <div
          style={{
            padding: "56px 48px",
            // 다크 hero — 시안 그대로 (var 토큰 정의 X 영역, 시안 의도 유지)
            background: "linear-gradient(135deg, #1a1a1a, #000)",
            color: "#fff",
            position: "relative",
          }}
        >
          <div style={{ maxWidth: 600 }}>
            {/* eyebrow */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: ".14em",
                color: "var(--accent)",
                marginBottom: 14,
              }}
            >
              BDR REFEREE PROGRAM
            </div>
            <h1
              style={{
                margin: "0 0 14px",
                fontSize: 42,
                fontWeight: 900,
                lineHeight: 1.1,
                letterSpacing: "-0.025em",
                fontFamily: "var(--ff-display)",
              }}
            >
              경기를 만드는 또 하나의 길,
              <br />
              <span style={{ color: "var(--accent)" }}>심판</span>이 되어보세요
            </h1>
            <p
              style={{
                margin: "0 0 24px",
                fontSize: 15,
                color: "rgba(255,255,255,.78)",
                lineHeight: 1.6,
                maxWidth: 520,
              }}
            >
              BDR 인증 심판은 픽업부터 공식 토너먼트까지, 매주 50건 이상의 경기에 배정됩니다.
              온라인 교육 후 첫 콜까지 평균 7일.
            </p>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {/* 비로그인 우선 동선: 가입 → 가입 후 심판 신청 / 활동 중인 심판 보기 = /referee */}
              <Link
                href="/signup"
                className="btn btn--primary btn--xl"
                style={{ textDecoration: "none" }}
              >
                가입하고 신청 →
              </Link>
              <Link
                href="/referee"
                className="btn btn--xl"
                style={{
                  background: "rgba(255,255,255,.08)",
                  borderColor: "rgba(255,255,255,.2)",
                  color: "#fff",
                  textDecoration: "none",
                }}
              >
                활동 중인 심판 보기
              </Link>
            </div>
          </div>

          {/* 통계 strip — 가데이터(실수치 확정 후 동적 카운트로 교체 큐) */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(min(160px, 100%), 1fr))",
              gap: 30,
              marginTop: 48,
              paddingTop: 30,
              borderTop: "1px solid rgba(255,255,255,.12)",
              maxWidth: 600,
            }}
          >
            {heroStats.map((s) => (
              <div key={s.k}>
                <div
                  style={{
                    fontSize: 24,
                    fontWeight: 900,
                    fontFamily: "var(--ff-display)",
                    color: "#fff",
                  }}
                >
                  {s.v}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "rgba(255,255,255,.5)",
                    fontWeight: 700,
                    letterSpacing: ".1em",
                    textTransform: "uppercase",
                  }}
                >
                  {s.k}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ===== Process 4 step ===== */}
      <section style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          HOW · 4 STEPS
        </div>
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.015em",
          }}
        >
          심판이 되는 과정
        </h2>
        {/* 모바일 자동 1열: auto-fit + minmax (시안 4-col 데스크톱 의도 유지) */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))",
            gap: 10,
          }}
        >
          {steps.map((s) => (
            <div key={s.n} className="card" style={{ padding: "20px 18px" }}>
              <div
                style={{
                  fontFamily: "var(--ff-display)",
                  fontSize: 34,
                  fontWeight: 900,
                  color: "var(--accent)",
                  lineHeight: 1,
                  marginBottom: 10,
                }}
              >
                {s.n}
              </div>
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
                {s.title}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "var(--ink-mute)",
                  lineHeight: 1.5,
                }}
              >
                {s.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Tiers 3등급 ===== */}
      <section style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          TIERS · 보수 체계
        </div>
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.015em",
          }}
        >
          등급과 활동 범위
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
            gap: 10,
          }}
        >
          {tiers.map((t) => (
            <div key={t.tier} className="card" style={{ padding: "22px 22px" }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: ".16em",
                  color: "var(--accent)",
                  marginBottom: 10,
                }}
              >
                {t.tier}
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 900,
                  fontFamily: "var(--ff-display)",
                  marginBottom: 6,
                }}
              >
                {t.fee}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-soft)",
                  marginBottom: 14,
                  lineHeight: 1.5,
                }}
              >
                {t.desc}
              </div>
              <div
                style={{
                  paddingTop: 14,
                  borderTop: "1px solid var(--border)",
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: "var(--ink-dim)",
                    letterSpacing: ".1em",
                    marginBottom: 4,
                  }}
                >
                  승급 요건
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-soft)" }}>
                  {t.req}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== FAQ accordion (클라이언트 컴포넌트로 분리 — useState 필요) ===== */}
      <section style={{ marginBottom: 32 }}>
        <div className="eyebrow" style={{ marginBottom: 6 }}>
          FAQ
        </div>
        <h2
          style={{
            margin: "0 0 20px",
            fontSize: 24,
            fontWeight: 800,
            letterSpacing: "-0.015em",
          }}
        >
          자주 묻는 질문
        </h2>
        <RefereeInfoFaq faqs={faqs} />
      </section>

      {/* ===== Bottom CTA — 비로그인 동선 우선 (서버 컴포넌트) ===== */}
      <div
        className="card"
        style={{
          padding: "30px 32px",
          textAlign: "center",
          background:
            "linear-gradient(135deg, color-mix(in oklab, var(--accent) 8%, transparent), transparent)",
        }}
      >
        <h3
          style={{
            margin: "0 0 8px",
            fontSize: 20,
            fontWeight: 800,
            letterSpacing: "-0.015em",
          }}
        >
          이번 주, 심판 신청 받고 있어요
        </h3>
        <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--ink-mute)" }}>
          신청 → 교육 → 첫 경기 배정까지 평균 7일.
        </p>
        <div
          style={{
            display: "flex",
            gap: 8,
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {/* 공개 SEO 페이지: 로그인/가입 양쪽 동선 모두 노출 */}
          <Link
            href="/login"
            className="btn btn--lg"
            style={{ textDecoration: "none" }}
          >
            로그인
          </Link>
          <Link
            href="/signup"
            className="btn btn--primary btn--lg"
            style={{ textDecoration: "none" }}
          >
            가입하고 신청 →
          </Link>
        </div>
      </div>
    </div>
  );
}
