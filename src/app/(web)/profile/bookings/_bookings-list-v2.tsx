"use client";

/* ============================================================
 * BookingsListV2 — 시안 1:1 박제 클라이언트 컴포넌트
 *
 * 시안 출처: Dev/design/BDR v2.2/screens/ProfileBookings.jsx (D등급 P1-7)
 *
 * 시안 매핑:
 *   - 카테고리 탭 4종 (시안 L27-32) → tabs 배열 그대로
 *   - 상태 칩 4종 (시안 L33-38) → statuses 배열 그대로
 *   - 카드 리스트 (시안 L100-114) → 좌측 컬러 바 + 우측 chevron_right
 *
 * 박제 룰:
 *   - var(--*) 토큰만, 하드코딩 색상 0
 *   - Material Symbols Outlined 1종 (chevron_right)
 *   - radius 4px (border-radius:3 → 시안 그대로 두 군데, 칩은 var(--radius-chip))
 *   - alert 신규 X (취소 액션은 시안에 없으므로 제거)
 *   - 모바일 분기: 인라인 grid 대신 flex-wrap, hscroll
 *
 * 변경: 시안의 onClick(setRoute(...)) → Next.js Link href
 * 보존: 시안 인라인 스타일 1:1 그대로 (className 추가 없이 인라인 우선)
 * ============================================================ */

import { useState } from "react";
import Link from "next/link";

export interface BookingItemV2 {
  id: string;
  kind: "court" | "tournament" | "guest";
  title: string;
  sub: string;
  status: "upcoming" | "done" | "cancelled";
  meta: string;
  href: string;
  sortAt: number; // 정렬 보조용 (서버에서 사용, 클라에서는 무시)
}

// 시안 L39-42 — 종류/상태 라벨/톤 매핑 그대로
const KIND_LABEL: Record<BookingItemV2["kind"], string> = {
  court: "코트",
  tournament: "토너",
  guest: "게스트",
};
const KIND_TONE: Record<BookingItemV2["kind"], string> = {
  // 시안: cafe-blue / accent / #10B981 — 사이트 토큰 매핑
  court: "var(--cafe-blue)",
  tournament: "var(--color-primary)", // 시안 var(--accent) → 사이트는 --color-primary
  guest: "#10B981", // 시안에서도 하드코딩 — 그대로 (성공 그린)
};
const STATUS_LABEL: Record<BookingItemV2["status"], string> = {
  upcoming: "예약중",
  done: "완료",
  cancelled: "취소",
};
const STATUS_TONE: Record<BookingItemV2["status"], string> = {
  upcoming: "var(--ok)",
  done: "var(--ink-dim)",
  cancelled: "var(--bdr-red)",
};

export function BookingsListV2({ items }: { items: BookingItemV2[] }) {
  // 시안 L15-16 — 두 개의 독립 필터 state
  const [tab, setTab] = useState<"all" | BookingItemV2["kind"]>("all");
  const [status, setStatus] = useState<"all" | BookingItemV2["status"]>("all");

  // 시안 L27-32 — 탭 카운트는 전체 items 기준 (필터 적용 전 — 시안 그대로)
  const tabs: Array<{ id: "all" | BookingItemV2["kind"]; label: string; n: number }> = [
    { id: "all", label: "전체", n: items.length },
    { id: "court", label: "코트 예약", n: items.filter((i) => i.kind === "court").length },
    { id: "tournament", label: "토너먼트", n: items.filter((i) => i.kind === "tournament").length },
    { id: "guest", label: "게스트", n: items.filter((i) => i.kind === "guest").length },
  ];

  const statuses: Array<{ id: "all" | BookingItemV2["status"]; label: string }> = [
    { id: "all", label: "전체" },
    { id: "upcoming", label: "예약중" },
    { id: "done", label: "완료" },
    { id: "cancelled", label: "취소" },
  ];

  // 시안 L44 — AND 필터 (탭 ∩ 상태)
  const filtered = items.filter(
    (i) => (tab === "all" || i.kind === tab) && (status === "all" || i.status === status),
  );

  return (
    <div className="page">
      {/* 빵부스러기 — 시안 L48-52 그대로 (Link로 변경) */}
      <div
        style={{
          display: "flex",
          gap: 6,
          fontSize: 12,
          color: "var(--ink-mute)",
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={{ color: "var(--ink-mute)", textDecoration: "none" }}>
          홈
        </Link>
        <span>›</span>
        <Link href="/profile" style={{ color: "var(--ink-mute)", textDecoration: "none" }}>
          내 프로필
        </Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>예약 내역</span>
      </div>

      {/* 헤더 — 시안 L54-58 그대로 */}
      <div style={{ marginBottom: 20 }}>
        <div className="eyebrow">BOOKINGS · MY RESERVATIONS</div>
        <h1
          style={{
            margin: "6px 0 4px",
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: "-0.015em",
          }}
        >
          예약 내역
        </h1>
        <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
          코트·토너먼트·게스트 신청을 한곳에서 관리하세요
        </div>
      </div>

      {/* 카테고리 탭 — 시안 L60-71 그대로. hscroll 클래스로 모바일 가로 스크롤 */}
      <div
        className="hscroll"
        style={{
          display: "flex",
          gap: 6,
          borderBottom: "1px solid var(--border)",
          marginBottom: 14,
          overflowX: "auto",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 16px",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 600,
              color: tab === t.id ? "var(--ink)" : "var(--ink-mute)",
              borderBottom:
                tab === t.id ? "3px solid var(--color-primary)" : "3px solid transparent",
              flexShrink: 0,
            }}
          >
            {t.label}{" "}
            <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>{t.n}</span>
          </button>
        ))}
      </div>

      {/* 상태 칩 — 시안 L73-84 그대로. flex-wrap으로 모바일 줄바꿈 */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 18,
          flexWrap: "wrap",
        }}
      >
        {statuses.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setStatus(s.id)}
            style={{
              padding: "6px 14px",
              borderRadius: "var(--radius-chip)",
              background: status === s.id ? "var(--ink)" : "var(--bg-alt)",
              color: status === s.id ? "var(--bg)" : "var(--ink)",
              border: "1px solid var(--border)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* 빈 상태 또는 리스트 — 시안 L87-115 그대로 */}
      {filtered.length === 0 ? (
        <div
          className="card"
          style={{
            padding: "48px 24px",
            textAlign: "center",
          }}
        >
          {/* 시안의 이모지 그대로. 아이콘 라이브러리는 Material Symbols만 허용이지만
              이모지는 별개 자유 — 시안 L89에 있는 이모지 그대로 박제 */}
          <div style={{ fontSize: 42, marginBottom: 10 }}>📅</div>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 6 }}>
            해당 조건의 예약이 없습니다
          </div>
          <div style={{ fontSize: 12, color: "var(--ink-mute)", marginBottom: 18 }}>
            새 예약을 시작해 보세요
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/courts" className="btn">
              코트 찾기
            </Link>
            <Link href="/tournaments" className="btn">
              대회 보기
            </Link>
            <Link href="/games" className="btn btn--primary">
              경기 찾기
            </Link>
          </div>
        </div>
      ) : (
        <div style={{ display: "grid", gap: 10, marginBottom: 40 }}>
          {filtered.map((it) => (
            <Link
              key={it.id}
              href={it.href}
              className="card"
              // 시안 L101 — div가 아닌 Link로 교체 (시맨틱 + 키보드 접근성)
              style={{
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 14,
                cursor: "pointer",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {/* 좌측 컬러 바 — 시안 L102 */}
              <div
                style={{
                  width: 8,
                  height: 48,
                  background: KIND_TONE[it.kind],
                  borderRadius: 2,
                  flexShrink: 0,
                }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* 종류 배지 + 상태 점 — 시안 L104-107 */}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 4,
                    flexWrap: "wrap",
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      letterSpacing: ".1em",
                      color: KIND_TONE[it.kind],
                      background: `color-mix(in oklab, ${KIND_TONE[it.kind]} 12%, transparent)`,
                      padding: "2px 8px",
                      borderRadius: 3,
                    }}
                  >
                    {KIND_LABEL[it.kind]}
                  </span>
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: STATUS_TONE[it.status],
                    }}
                  >
                    ● {STATUS_LABEL[it.status]}
                  </span>
                </div>
                {/* 제목 — 시안 L108 */}
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 2,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {it.title}
                </div>
                {/* 서브 (날짜/시간) — 시안 L109 */}
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--ink-mute)",
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  {it.sub}
                </div>
                {/* 메타 (결제/상태) — 시안 L110 */}
                <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 4 }}>
                  {it.meta}
                </div>
              </div>
              {/* 시안 L112 — chevron_right (Material Symbols 1종만) */}
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20, color: "var(--ink-dim)" }}
              >
                chevron_right
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
