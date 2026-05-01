"use client";

/**
 * ContextReviews — 코트/대회/플레이어 상세 페이지에 삽입되는 재사용 리뷰 섹션
 *
 * 출처: Dev/design/BDR-current/screens/ContextReviews.jsx (137줄, 시안 1:1 박제)
 *
 * 왜 이 컴포넌트가 신규 박제 대상인가:
 * - [Phase 16] 통합 Reviews 페이지 폐기 → 컨텍스트별 인라인 리뷰 (시안 결정)
 * - 코트:    "방문 후기"  — 시설·접근성·픽업 분위기 평가
 * - 대회:    "참가 후기"  — 운영·진행·수준 평가 (추후 도입)
 * - 플레이어: "매너 평가" — 함께 뛴 사람만 작성 (추후 도입)
 *
 * 디자인 룰:
 * - BDR v3 토큰만 사용 (var(--accent) / var(--ink) / var(--bg-card) 등)
 * - 옛 var(--color-card) 등 색상 토큰 사용 금지
 * - 별점 시각화는 ★ 유니코드 (lucide-react 등 외부 아이콘 ❌)
 * - radius 4 (pill 9999px ❌)
 *
 * Props 데이터 가용성:
 * - reviews 가 비어 있으면 summary 자동 0 처리 + empty 카드
 * - summary 미제공 시 reviews 로 자동 계산 (avg / total / dist)
 */

import { useMemo } from "react";

// 컨텍스트 종류 — 시안과 동일 (코트/대회/플레이어)
export type ContextReviewKind = "court" | "series" | "player";

// 단일 리뷰 카드에 들어갈 최소 데이터 — 시안 ContextReviews.jsx props 정의
export interface ContextReviewItem {
  author: string;
  authorLevel?: string;
  rating: number; // 1~5
  date: string; // 표기 문자열 (시안에서 이미 "YYYY.MM.DD" 형식)
  body: string;
  tags?: string[];
  verified?: boolean;
}

// 분포 배열 [5★ 개수, 4★, 3★, 2★, 1★] — 시안과 동일 순서
export interface ContextReviewSummary {
  avg: number | string;
  total: number;
  dist: number[];
}

export interface ContextReviewsProps {
  kind?: ContextReviewKind;
  // targetName 은 시안에서 정의되어 있으나 본문에서 직접 사용되지 않음 (호출측 문맥 표기용)
  targetName?: string;
  reviews: ContextReviewItem[];
  summary?: ContextReviewSummary;
  onWrite?: () => void;
  onViewAll?: () => void;
  maxVisible?: number;
}

// 컨텍스트별 라벨 매핑 — 시안 ContextReviews.jsx labels 객체 그대로
const LABELS: Record<
  ContextReviewKind,
  { title: string; cta: string; empty: string; authorHint: string }
> = {
  court: {
    title: "방문 후기",
    cta: "+ 방문 후기 쓰기",
    empty: "아직 등록된 후기가 없어요. 첫 후기를 남겨보세요.",
    authorHint: "실제 방문 인증",
  },
  series: {
    title: "참가 후기",
    cta: "+ 참가 후기 쓰기",
    empty: "아직 등록된 참가 후기가 없어요.",
    authorHint: "대회 참가 인증",
  },
  player: {
    title: "매너 평가",
    cta: "+ 매너 평가하기",
    empty: "아직 매너 평가가 없어요.",
    authorHint: "함께 뛴 사람만",
  },
};

export function ContextReviews({
  kind = "court",
  reviews = [],
  summary,
  onWrite,
  onViewAll,
  maxVisible = 3,
}: ContextReviewsProps) {
  const L = LABELS[kind] ?? LABELS.court;

  // summary 자동 계산 — 시안과 동일 로직 (reviews 미제공 + summary 미제공이면 0)
  const computed = useMemo(() => {
    const total = summary?.total ?? reviews.length;
    const avgRaw =
      summary?.avg ??
      (reviews.length
        ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
        : "0.0");
    const avgNum = typeof avgRaw === "number" ? avgRaw : Number(avgRaw);
    const dist =
      summary?.dist ??
      [5, 4, 3, 2, 1].map((n) => reviews.filter((r) => r.rating === n).length);
    return { total, avgRaw, avgNum, dist };
  }, [reviews, summary]);

  // 노출 리뷰 = maxVisible 까지만
  const visible = reviews.slice(0, maxVisible);

  return (
    <section
      className="card"
      style={{
        padding: "18px 22px",
      }}
    >
      {/* 헤더: 타이틀 + 카운트 + 작성/전체보기 액션 */}
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 8,
          marginBottom: 14,
        }}
      >
        <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
          <h2
            style={{
              margin: 0,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
            }}
          >
            {L.title}
          </h2>
          <span
            style={{
              fontFamily: "var(--ff-mono)",
              fontSize: 12,
              color: "var(--ink-mute)",
            }}
          >
            {computed.total}건
          </span>
          <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>· {L.authorHint}</span>
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {onViewAll && computed.total > maxVisible && (
            <button
              type="button"
              onClick={onViewAll}
              style={{
                fontSize: 12,
                color: "var(--info)",
                cursor: "pointer",
                background: "transparent",
                border: 0,
                padding: "4px 8px",
              }}
            >
              전체 보기 →
            </button>
          )}
          {onWrite && (
            <button
              type="button"
              className="btn btn--accent btn--sm"
              onClick={onWrite}
              style={{ minHeight: 36 }}
            >
              {L.cta}
            </button>
          )}
        </div>
      </div>

      {/* 평균 + 분포 — 시안과 동일 (총 0건이면 미표시) */}
      {computed.total > 0 && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(120px, 160px) 1fr",
            gap: 18,
            padding: "14px 0 16px",
            borderTop: "1px solid var(--border)",
            borderBottom: "1px solid var(--border)",
            marginBottom: 14,
          }}
        >
          {/* 평균 별점 박스 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              textAlign: "center",
              borderRight: "1px solid var(--border)",
              paddingRight: 14,
            }}
          >
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                fontFamily: "var(--ff-mono)",
                letterSpacing: "-0.02em",
                lineHeight: 1,
                color: "var(--ink)",
              }}
            >
              {computed.avgRaw}
            </div>
            <div style={{ color: "var(--accent)", fontSize: 14, marginTop: 6 }}>
              {"★".repeat(Math.round(computed.avgNum))}
              <span style={{ color: "var(--border)" }}>
                {"★".repeat(5 - Math.round(computed.avgNum))}
              </span>
            </div>
            <div
              style={{
                fontSize: 10,
                color: "var(--ink-dim)",
                marginTop: 4,
                fontFamily: "var(--ff-mono)",
              }}
            >
              {computed.total} REVIEWS
            </div>
          </div>
          {/* 분포 막대 — accent 단색 (시안 룰 §10 통일) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 4,
              justifyContent: "center",
            }}
          >
            {[5, 4, 3, 2, 1].map((n, i) => {
              const c = computed.dist[i] || 0;
              const pct = computed.total ? Math.round((c / computed.total) * 100) : 0;
              return (
                <div
                  key={n}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    fontSize: 11,
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  <span style={{ width: 18, color: "var(--ink-mute)" }}>{n}★</span>
                  <div
                    style={{
                      flex: 1,
                      height: 6,
                      background: "var(--bg-alt)",
                      borderRadius: 3,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: "var(--accent)",
                      }}
                    />
                  </div>
                  <span
                    style={{
                      width: 28,
                      textAlign: "right",
                      color: "var(--ink-mute)",
                    }}
                  >
                    {c}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 리뷰 카드 리스트 — 0건이면 empty, 아니면 maxVisible 까지 */}
      {computed.total === 0 ? (
        <div
          style={{
            padding: "24px 0",
            textAlign: "center",
            fontSize: 13,
            color: "var(--ink-mute)",
          }}
        >
          {L.empty}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {visible.map((r, i) => (
            <article
              key={i}
              style={{
                padding: "12px 14px",
                background: "var(--bg-alt)",
                borderRadius: 4,
                border: "1px solid var(--border)",
              }}
            >
              {/* 카드 헤더: 작성자 + 별점 + 날짜 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 6,
                  gap: 8,
                  flexWrap: "wrap",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12 }}>
                  <strong style={{ color: "var(--ink)" }}>{r.author}</strong>
                  {r.authorLevel && (
                    <span
                      style={{
                        color: "var(--ink-dim)",
                        fontFamily: "var(--ff-mono)",
                        fontSize: 11,
                      }}
                    >
                      {r.authorLevel}
                    </span>
                  )}
                  {r.verified && (
                    <span style={{ fontSize: 10, color: "var(--ok)", fontWeight: 700 }}>
                      ✓ 인증
                    </span>
                  )}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: "var(--accent)", fontSize: 12 }}>
                    {"★".repeat(r.rating)}
                    <span style={{ color: "var(--border)" }}>
                      {"★".repeat(5 - r.rating)}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      color: "var(--ink-dim)",
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    {r.date}
                  </span>
                </div>
              </div>
              {/* 본문 */}
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.6,
                  color: "var(--ink-soft)",
                }}
              >
                {r.body}
              </p>
              {/* 태그 (옵션) */}
              {r.tags && r.tags.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    gap: 4,
                    marginTop: 8,
                    flexWrap: "wrap",
                  }}
                >
                  {r.tags.map((t, j) => (
                    <span
                      key={j}
                      style={{
                        fontSize: 10,
                        padding: "2px 6px",
                        background: "var(--bg-card)",
                        borderRadius: 3,
                        color: "var(--ink-mute)",
                        fontFamily: "var(--ff-mono)",
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
