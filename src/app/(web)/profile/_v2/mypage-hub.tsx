/* ============================================================
 * MyPageHub — "내 활동을 한곳에서" 섹션
 *
 * 왜:
 * - 의뢰서 §3-2 (마이페이지 허브 섹션) — eyebrow + h2 + 서브 카피 +
 *   Tier 1 큰 카드 4종 + Tier 2 작은 quick 카드 4종.
 * - /profile 본문 (좌측 1fr) 에 단일 컴포넌트로 배치 → page.tsx 가독성 ↑.
 * - Tier 1 카드 본문은 카드별 모양이 달라 props 로 children slot 받음.
 *
 * 어떻게:
 * - 헤더 영역: eyebrow + h2 ("내 활동을 한곳에서") + 서브 카피.
 * - Tier 1 그리드: `repeat(2, 1fr)` 데스크톱 / 720px 1열 분기.
 *   각 카드는 children 슬롯 + 공통 헤더(아이콘+라벨) + 푸터(ctaLabel).
 * - Tier 2 그리드: `repeat(4, 1fr)` 데스크톱 / 720px `repeat(2, 1fr)` 분기.
 *   MyPageHubQuickCard 4개 렌더.
 *
 * 박제 룰:
 * - 모든 색상 var(--*) 토큰 (룰 10).
 * - Material Symbols (룰 11).
 * - 카드 라운딩 .card 클래스(8px) + 코너 뱃지 4px (룰 12).
 * - 720px 분기 인라인 grid 옆에 .mypage-hub-grid / .mypage-quick-grid 클래스 추가
 *   (globals.css 미디어 룰이 이 클래스를 매칭).
 * ============================================================ */

import Link from "next/link";
import type { ReactNode } from "react";

import { MyPageHubQuickCard } from "./mypage-hub-card";
import { HUB_CARDS_TIER1, HUB_QUICK_BASE, type HubQuickLink } from "./mypage-hub-data";

/** Tier 1 카드 1장의 본문 슬롯 — 카드별로 page.tsx 에서 채움 */
export interface HubTier1Slot {
  /** "profile" | "basketball" | "growth" | "activity" — HUB_CARDS_TIER1 의 id 매칭 */
  id: "profile" | "basketball" | "growth" | "activity";
  /** 카드 본문 JSX (헤더와 푸터 사이) */
  body: ReactNode;
}

export interface MyPageHubProps {
  /** Tier 1 4 카드의 본문 JSX (id 별 매핑) */
  tier1Slots: HubTier1Slot[];
  /** 알림 미확인 수 — Tier 2 의 알림 카드 코너 뱃지로 표시 */
  unreadCount: number;
}

export function MyPageHub({ tier1Slots, unreadCount }: MyPageHubProps) {
  // id → body 룩업 맵 (의뢰서 카드 순서 보장)
  const slotById = new Map(tier1Slots.map((s) => [s.id, s.body]));

  // Tier 2: 알림 카드의 unreadCount 동적 주입 — 0 이면 코너 뱃지 미표시
  const quickLinks: HubQuickLink[] = HUB_QUICK_BASE.map((link) => {
    if (link.id === "notifications" && unreadCount > 0) {
      return {
        ...link,
        cornerBadge: { text: String(unreadCount), tone: "alert" },
      };
    }
    return link;
  });

  return (
    <section style={{ marginBottom: 16 }}>
      {/* 헤더: eyebrow + h2 + 서브 카피 (의뢰서 §3-2) */}
      <div style={{ marginBottom: 14 }}>
        <div className="eyebrow" style={{ marginBottom: 4 }}>
          MY PAGE · 마이페이지
        </div>
        <h2
          style={{
            fontSize: 20,
            fontWeight: 800,
            margin: "0 0 4px",
            letterSpacing: "-0.01em",
            color: "var(--ink)",
          }}
        >
          내 활동을 한곳에서
        </h2>
        <p style={{ fontSize: 13, color: "var(--ink-mute)", margin: 0 }}>
          프로필·농구·활동·설정·결제를 한곳에서 빠르게 관리하세요.
        </p>
      </div>

      {/* Tier 1 — 큰 카드 4종 (2x2 grid, 720px 1열) */}
      <div
        className="mypage-hub-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {HUB_CARDS_TIER1.map((card) => {
          const body = slotById.get(card.id);
          return (
            <Link
              key={card.id}
              href={card.href}
              className="card"
              style={{
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                textDecoration: "none",
                minHeight: 180,
              }}
            >
              {/* 카드 헤더: 아이콘 + 라벨 — 시안 캡처 29: 카드별 다른 색상 (보라/검정/빨강/노랑) */}
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 20, color: card.iconColor }}
                >
                  {card.icon}
                </span>
                <span style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                  {card.label}
                </span>
              </div>

              {/* 본문 슬롯 — page.tsx 에서 카드별로 다른 JSX 주입 */}
              <div style={{ flex: 1 }}>{body ?? null}</div>

              {/* 푸터 CTA */}
              <div style={{ fontSize: 12, color: "var(--accent)", fontWeight: 700 }}>
                {card.ctaLabel}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Tier 2 — 작은 quick 카드 4종 (4 col grid, 720px 2x2) */}
      <div
        className="mypage-quick-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
        }}
      >
        {quickLinks.map((link) => (
          <MyPageHubQuickCard key={link.id} link={link} />
        ))}
      </div>
    </section>
  );
}
