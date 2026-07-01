/* ============================================================
 * GuestCtaCard — 비로그인 방문자 가입/로그인 유도 카드 (PR-HOME-1)
 *
 * 왜 이 파일이 필요한가:
 *   홈 상단 요약 영역은 로그인 시 MySummaryHeroCard(3열 요약)를 노출하지만,
 *   비로그인 방문자에게는 개인 데이터가 없다. 이 자리에 "가입하면 이런 걸 할 수 있어요"
 *   가치 제안 + 로그인/회원가입 CTA 카드를 노출해 전환 동선을 만든다.
 *
 *   기존 ProfileCtaCard(로그인 + 프로필 미완성)와 역할이 다르다 —
 *   ProfileCtaCard 는 비로그인 시 null 을 반환하므로, 비로그인 전용 카드가 필요.
 *
 * 서버 컴포넌트 — 세션 분기는 page.tsx 에서(session 없을 때만 렌더). 자체 상태/패칭 0.
 *
 * 13룰: var(--*) 토큰만 / Material Symbols / pill 회피 / accent 배경 위 흰글자=ink-on-brand.
 * ============================================================ */

import Link from "next/link";

// 가치 제안 3종 (아이콘 + 라벨) — DB 미지원 없이 실제 존재 기능만
const PERKS = [
  { icon: "sports_basketball", label: "픽업·매칭 참여" },
  { icon: "groups", label: "팀 · 대회 활동" },
  { icon: "leaderboard", label: "내 기록 · 랭킹" },
] as const;

export function GuestCtaCard() {
  return (
    <div
      className="guest-cta card"
      style={{
        marginBottom: 20,
        padding: "20px 22px",
        display: "flex",
        alignItems: "center",
        gap: 20,
        flexWrap: "wrap",
        // accent 계열 은은한 배경 (ProfileCtaCard 와 톤 통일)
        background: "var(--accent-soft)",
        border: "1px solid var(--border)",
      }}
    >
      {/* 좌 — 아이콘 + 카피 */}
      <div style={{ flex: 1, minWidth: 220, display: "flex", alignItems: "center", gap: 16 }}>
        {/* 아이콘 배지 — 정사각형 W=H 원형(50%, pill 9999px 회피) */}
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: "50%",
            background: "var(--accent)",
            display: "grid",
            placeItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 28, color: "var(--ink-on-brand)" }}
          >
            waving_hand
          </span>
        </div>
        <div style={{ minWidth: 0 }}>
          <div
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: "var(--ink)",
              marginBottom: 4,
              letterSpacing: "-0.01em",
            }}
          >
            MyBDR에서 코트 메이트를 찾아보세요
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)", lineHeight: 1.5 }}>
            가입하면 픽업 경기 참여·팀 활동·내 기록 관리를 한 곳에서 할 수 있어요
          </div>
          {/* 가치 제안 칩 3종 */}
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 8 }}>
            {PERKS.map((p) => (
              <span
                key={p.label}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  fontSize: 12,
                  color: "var(--ink-soft)",
                  fontWeight: 600,
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, color: "var(--cafe-blue)" }}
                >
                  {p.icon}
                </span>
                {p.label}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* 우 — CTA 버튼 2종 (회원가입 primary / 로그인 ghost) */}
      <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
        <Link
          href="/signup"
          className="btn btn--primary"
          style={{ fontSize: 13, fontWeight: 700, padding: "8px 18px" }}
        >
          회원가입
        </Link>
        <Link
          href="/login"
          className="btn"
          style={{ fontSize: 13, fontWeight: 700, padding: "8px 18px" }}
        >
          로그인
        </Link>
      </div>
    </div>
  );
}
