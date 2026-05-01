/* ============================================================
 * MyPageHubQuickCard — 하단 4 quick 카드용 작은 카드
 *
 * 왜:
 * - 의뢰서 §3-3 Tier 2 (예약/주간/알림/배지) 4 카드는 모두 동일한
 *   구조(아이콘 + 라벨 + 옵션 코너 뱃지). 1 컴포넌트로 추출하면
 *   page.tsx 의 JSX 가 짧아지고 시각 일관성 ↑.
 * - 큰 카드(Tier 1, 4종)는 본문 모양이 카드별로 달라(폼/스탯/그래프 등)
 *   추출 효과가 작음 → page.tsx 에서 직접 렌더.
 *
 * 어떻게:
 * - HubQuickLink 데이터를 props 로 받아 .card 클래스 + Link 로 렌더.
 * - cornerBadge 가 있으면 우측 상단에 뱃지 (NEW = accent / alert = accent 동일).
 * - 모든 색상은 var(--*) 토큰만 (하드코딩 hex 0).
 * - 아이콘은 Material Symbols Outlined.
 * ============================================================ */

import Link from "next/link";

import type { HubQuickLink } from "./mypage-hub-data";

export interface MyPageHubQuickCardProps {
  /** 카드 데이터 (mypage-hub-data.ts) */
  link: HubQuickLink;
}

export function MyPageHubQuickCard({ link }: MyPageHubQuickCardProps) {
  return (
    <Link
      href={link.href}
      className="card"
      style={{
        // 시안 패딩 — 작은 카드 (의뢰서 §3-5 .mypage-hub__card--md 96px min-height 참조)
        padding: 16,
        position: "relative",
        // 카드 호버 효과는 .card 클래스가 처리
        textDecoration: "none",
        // 본문 정렬
        display: "flex",
        flexDirection: "column",
        gap: 6,
        minHeight: 96,
      }}
    >
      {/* 우측 상단 코너 뱃지 (NEW / 알림 N건) — 있을 때만 */}
      {link.cornerBadge && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            background: "var(--accent)",
            color: "#fff",
            // 카드 4px 표준 (룰 12) — 작은 박스도 4px
            borderRadius: 4,
            padding: "2px 6px",
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: 0.3,
          }}
        >
          {link.cornerBadge.text}
        </span>
      )}

      {/* Material Symbols 아이콘 — 시안 룰 11 */}
      <span
        className="material-symbols-outlined"
        style={{
          fontSize: 28,
          color: "var(--accent)",
          lineHeight: 1,
        }}
      >
        {link.icon}
      </span>

      {/* 라벨 */}
      <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)", marginTop: 4 }}>
        {link.label}
      </div>

      {/* 마이크로 화살표 (전체 보기 → 의 축약) */}
      <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>→</div>
    </Link>
  );
}
