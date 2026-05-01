import Link from "next/link";
import type { Metadata } from "next";

/* ============================================================
 * RefereeInfo — /referee-info (BDR v2.4 SEO 안내 페이지)
 *
 * 이유(왜):
 *   사이트의 `/referee` 는 심판 플랫폼(심판 활동 화면)을 점유 중 →
 *   심판 제도 안내 페이지를 별도 라우트 `/referee-info` 로 운영.
 *   비로그인 열람 가능한 공개 SEO 페이지 (getWebSession 가드 X) — 검색
 *   엔진 인덱스 친화 + 외부 마케팅 진입점 활성.
 *
 * Pattern (v2.4):
 *   정적 SEO 카드 (단일 컬럼, 카드 3종 — 등록·교육·배정 + CTA)
 *   v2.2 의 마케팅 hero / 4 step / tier 표 / FAQ 는 v2.4 에서 단순화.
 *
 * 시안 출처:
 *   Dev/design/BDR v2.4/screens/RefereeInfo.jsx (v2.2 → v2.4 215줄 변경, A 등급)
 *
 * v2.4 변경 요약 (vs v2.2):
 *   - 마케팅 랜딩 톤 → 정적 SEO 카드 톤
 *   - hero(다크 그라디언트) → 중앙 정렬 텍스트 hero
 *   - 4-step / tier 표 / FAQ accordion 제거
 *   - 카드 3종 (등록·교육·배정 — borderLeft accent 강조)
 *   - CTA: 가입/로그인 분기 → 운영팀 문의 단일 버튼 (/help)
 *
 * 진입: 더보기 메뉴 "심판 센터 안내" / SEO 검색 인덱스
 * 복귀: AppNav 뒤로 → /
 * ============================================================ */

// SEO: 심판 제도 안내 메타데이터 (Open Graph 포함)
export const metadata: Metadata = {
  title: "심판 센터 안내 | MyBDR",
  description:
    "BDR 공식 대회의 모든 경기는 인증된 심판이 운영합니다. 심판 등록·교육·배정 시스템에 대해 안내드립니다.",
  openGraph: {
    title: "심판 센터 안내 | MyBDR",
    description:
      "BDR 공식 대회의 모든 경기는 인증된 심판이 운영합니다. 심판 등록·교육·배정 시스템 안내.",
    type: "website",
  },
};

// 시안 v2.4 카드 3종 — 등록·교육·배정
const cards: { kicker: string; title: string; body: string }[] = [
  {
    kicker: "01 · 등록",
    title: "심판 자격 신청",
    body: "농구 경력·심판 경험을 토대로 신청하세요. 운영팀 심사 후 승인됩니다.",
  },
  {
    kicker: "02 · 교육",
    title: "룰북 + 정기 워크숍",
    body: "공식 룰북 학습 + 분기별 워크숍으로 판정 일관성 유지.",
  },
  {
    kicker: "03 · 배정",
    title: "대회별 자동 배정",
    body: "대회 일정·경력·평점 기반 자동 배정. 출석·페이도 시스템 관리.",
  },
];

export default function RefereeInfoPage() {
  // 공개 SEO 페이지 정책: getWebSession 가드 미사용 — 비로그인 열람 가능.
  return (
    <div className="page">
      {/* 시안 v2.4: 단일 컬럼 720px (max-width). page--wide 미사용. */}
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        {/* ===== 히어로 — 중앙 정렬 텍스트 (시안 L18~L29) ===== */}
        <div style={{ textAlign: "center", padding: "40px 0 32px" }}>
          <div
            className="eyebrow"
            style={{ justifyContent: "center" }}
          >
            심판 센터 · REFEREE
          </div>
          <h1
            style={{
              margin: "10px 0 14px",
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: "-0.025em",
            }}
          >
            BDR 공식 심판 센터
          </h1>
          <p
            style={{
              fontSize: 15,
              color: "var(--ink-soft)",
              maxWidth: 540,
              margin: "0 auto",
              lineHeight: 1.7,
            }}
          >
            BDR 공식 대회의 모든 경기는 인증된 심판이 운영합니다.
            심판 등록·교육·배정 시스템에 대해 안내드립니다.
          </p>
        </div>

        {/* ===== 카드 3종 — 등록·교육·배정 (시안 L31~L46) =====
            모바일 자동 1열: auto-fit + minmax (시안 3-col 데스크톱 의도 유지)
            룰 13: 인라인 grid 사용 시 720px 분기 — auto-fit 으로 자동 분기 처리 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
            gap: 12,
            marginBottom: 32,
          }}
        >
          {cards.map((c) => (
            <div
              key={c.kicker}
              className="card"
              // 시안 v2.4: borderLeft accent 강조 (좌측 빨간 라인)
              style={{
                padding: "20px 22px",
                borderLeft: "3px solid var(--accent)",
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  fontWeight: 700,
                  letterSpacing: ".12em",
                  textTransform: "uppercase",
                  marginBottom: 8,
                }}
              >
                {c.kicker}
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                {c.title}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: "var(--ink-mute)",
                  lineHeight: 1.6,
                }}
              >
                {c.body}
              </div>
            </div>
          ))}
        </div>

        {/* ===== CTA — 운영팀 문의 (시안 L49~L57) =====
            본 시안에서는 외부 안내 링크만 (실 신청은 사이트 /referee 영역) */}
        <div
          className="card"
          style={{
            padding: "20px 22px",
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          <h2 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 700 }}>
            심판 신청을 원하시나요?
          </h2>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-mute)",
              margin: "0 0 14px",
            }}
          >
            BDR 운영팀이 심사 후 승인합니다. 평균 3–5일 소요.
          </p>
          {/* 시안 setRoute('help') → 운영의 /help 라우트로 매핑 */}
          <Link
            href="/help"
            className="btn btn--primary"
            style={{ textDecoration: "none" }}
          >
            운영팀 문의 →
          </Link>
        </div>
      </div>
    </div>
  );
}
