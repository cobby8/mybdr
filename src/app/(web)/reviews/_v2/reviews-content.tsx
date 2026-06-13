"use client";

/* ============================================================
 * ReviewsContent — /reviews IU4 v2.30 박제 (코트 단일 탭)
 *
 * 왜 IU4 재박제:
 * - 시안 Dev/design/BDR-current/screens/Reviews.jsx (BDR v2.30 · IU4 · Phase 10B) 톤 박제.
 * - 평균 평점 hero + 평점 분포 chart(별 5→1) + BG2 flag 종류 + 필터 chip 4종 + 리뷰 카드 세로 스택.
 *
 * 데이터/Props 무변경:
 * - page.tsx 서버 데이터(court_reviews 쿼리)·CourtReviewItem 인터페이스 그대로 사용.
 *   schema/api/데이터 패칭 0 변경. UI 렌더링만 교체.
 *
 * ★ Phase 2 BG2 답습 (절대 준수):
 * - 리뷰에서 "자주 언급되는 항목 종류"만 정적 라벨로 표시 (바닥/조명/접근성/청결/주차/혼잡).
 * - 개별 건수 계산·노출 금지. flags 는 mock 데이터가 아니라 평가 카테고리 라벨(정적 배열).
 *   facility/accessibility/surface/lighting/atmosphere 세부 5컬럼은 일절 집계하지 않는다.
 *
 * 미지원 항목 (UI만 / 동작 미구현):
 * - helpful_count 컬럼 없음 → likes(=likes_count)로 표기.
 * - 리뷰 태그 / User 레벨 / 작성 통합 폼 / 신고 — 시안 carry, 동작 X.
 * ============================================================ */

import { useMemo, useState } from "react";
import Link from "next/link";

// ---- 서버 → 클라 데이터 타입 (page.tsx 와 일치 — 변경 금지) ----
export interface CourtReviewItem {
  id: string;
  courtId: string;
  target: string; // 코트 이름
  targetSub: string; // 시 + 구 또는 주소
  rating: number; // 1~5
  title: string;
  body: string;
  likes: number;
  helpful: number;
  photos: number;
  verified: boolean;
  author: string;
  authorLevel: string; // 현재 "L.—" 폴백
  createdAt: string; // ISO
}

// 필터 chip 4종 (시안 filters 배열) — all/top/photo/verified
type FilterId = "all" | "top" | "photo" | "verified";

const FILTERS: { key: FilterId; label: string; ico: string }[] = [
  { key: "all", label: "전체", ico: "list" },
  { key: "top", label: "평점 높은순", ico: "trending_up" },
  { key: "photo", label: "사진 리뷰", ico: "photo_camera" },
  { key: "verified", label: "인증 방문", ico: "verified" },
];

/* ★ BG2 답습 — 평가 "항목 종류"만 노출 (정적 배열 = mock 아님 · 개별 건수 ❌)
 * 운영 court_reviews 세부 컬럼(facility/accessibility/surface/lighting/atmosphere)에서
 * 건수를 계산하지 않는다. 아래는 평가 카테고리 라벨일 뿐. */
const REVIEW_FLAGS: { type: "ok" | "warn"; label: string; ico: string }[] = [
  { type: "ok", label: "바닥 상태 좋음", ico: "check_circle" },
  { type: "ok", label: "조명 밝음", ico: "check_circle" },
  { type: "ok", label: "접근성 좋음", ico: "check_circle" },
  { type: "ok", label: "청결", ico: "check_circle" },
  { type: "warn", label: "주차 협소", ico: "error" },
  { type: "warn", label: "주말 혼잡", ico: "error" },
];

// ISO → "YYYY.MM.DD" mono 표기 (시안 카드 date 형식)
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// 별점 — 소수 평점 → 5칸 (반칸 포함). 시안 RatingStars 박제 (Material Symbols).
function RatingStars({ value, size = 15 }: { value: number; size?: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    // value 가 i 이상이면 꽉찬 별, 0.5 이상이면 반별, 그 외 빈별
    let icon = "star_outline";
    if (value >= i) icon = "star";
    else if (value >= i - 0.5) icon = "star_half";
    stars.push(
      <span
        key={i}
        className="ico material-symbols-outlined"
        style={{
          fontSize: size,
          // 채워진/반쯤 채워진 별은 warn(앰버), 빈 별은 dim
          color: value >= i - 0.5 ? "var(--warn)" : "var(--ink-dim)",
        }}
      >
        {icon}
      </span>,
    );
  }
  return <span style={{ display: "inline-flex", lineHeight: 1 }}>{stars}</span>;
}

export interface ReviewsContentProps {
  courts: CourtReviewItem[];
}

export function ReviewsContent({ courts }: ReviewsContentProps) {
  const [filter, setFilter] = useState<FilterId>("all");

  // ---- 평균 + 분포 (시안 avg / dist) ----
  const { avg, total, dist } = useMemo(() => {
    const total = courts.length;
    if (total === 0) {
      return {
        avg: 0,
        total: 0,
        dist: [5, 4, 3, 2, 1].map((star) => ({ star, n: 0, pct: 0 })),
      };
    }
    const avg = courts.reduce((s, r) => s + r.rating, 0) / total;
    // 분포: 별 5→1, 0.5 단위는 반올림해 정수 칸에 집계 (시안과 동일)
    const dist = [5, 4, 3, 2, 1].map((star) => {
      const n = courts.filter((r) => Math.round(r.rating) === star).length;
      return { star, n, pct: Math.round((n / total) * 100) };
    });
    return { avg, total, dist };
  }, [courts]);

  // ---- 필터 적용 (시안 rows 로직) ----
  const rows = useMemo<CourtReviewItem[]>(() => {
    let arr = [...courts];
    if (filter === "top") {
      // 평점 높은순 (동점은 최신순)
      arr.sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt));
    } else if (filter === "photo") {
      arr = arr.filter((r) => r.photos > 0);
    } else if (filter === "verified") {
      arr = arr.filter((r) => r.verified);
    }
    // all: 서버 정렬(최신순) 유지
    return arr;
  }, [courts, filter]);

  return (
    <div className="page">
      <div className="page__inner" style={{ maxWidth: 820 }}>
        {/* breadcrumb */}
        <div
          style={{
            display: "flex",
            gap: 6,
            fontSize: 12,
            color: "var(--ink-mute)",
            marginBottom: 12,
          }}
        >
          <Link href="/" style={{ color: "var(--ink-mute)" }}>
            홈
          </Link>
          <span>›</span>
          <span style={{ color: "var(--ink)" }}>리뷰</span>
        </div>

        {/* Hero */}
        <header className="info-hero">
          <div className="eyebrow">리뷰 · REVIEWS</div>
          <h1 className="info-hero__title">코트 리뷰</h1>
          <p className="info-hero__lead">
            BDR 멤버들이 직접 뛰어보고 남긴 코트 후기입니다. 인증 방문·사진 리뷰를 한눈에
            비교하세요.
          </p>
        </header>

        {/* ====== 요약 — 평균 + 분포 + BG2 flag 종류 ====== */}
        <section className="card rv-summary">
          <div className="rv-summary__score">
            <div className="rv-summary__avg">{avg.toFixed(1)}</div>
            <div className="rv-summary__stars">
              <RatingStars value={avg} size={18} />
            </div>
            <div className="rv-summary__count">
              리뷰 {total}건 · 코트 {total}곳
            </div>
          </div>
          <div className="rv-summary__dist">
            {dist.map((d) => (
              <div key={d.star} className="rv-dist__row">
                <span className="rv-dist__lbl">
                  {d.star}
                  <span className="ico material-symbols-outlined">star</span>
                </span>
                <span className="rv-dist__bar">
                  <span className="rv-dist__fill" style={{ width: d.pct + "%" }} />
                </span>
                <span className="rv-dist__pct">{d.pct}%</span>
              </div>
            ))}
          </div>
          {/* ★ Phase 2 BG2 답습 — 항목 종류만 (개별 건수 ❌ · 정적 라벨) */}
          <div className="rv-flags">
            <span className="rv-flags__lbl">자주 언급</span>
            {REVIEW_FLAGS.map((f, i) => (
              <span key={i} className={"rv-flag rv-flag--" + f.type}>
                <span className="ico material-symbols-outlined">{f.ico}</span>
                {f.label}
              </span>
            ))}
            <span className="rv-flags__note">
              <span className="ico material-symbols-outlined">info</span>
              항목 종류만 표시 · 개별 건수 비공개
            </span>
          </div>
        </section>

        {/* ====== 필터 chip ====== */}
        <div className="rv-filter">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              className={"rv-chip" + (filter === f.key ? " is-on" : "")}
              onClick={() => setFilter(f.key)}
            >
              <span className="ico material-symbols-outlined">{f.ico}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* ====== 리뷰 카드 list ====== */}
        {rows.length > 0 ? (
          <div className="rv-list">
            {rows.map((r) => (
              <article key={r.id} className="rv-card">
                <div className="rv-card__top">
                  <div className="rv-card__court">
                    {/* 코트명 → 코트 상세로 링크 (시안 north_east 아이콘) */}
                    <Link
                      href={`/courts/${r.courtId}`}
                      className="rv-card__court-name"
                      style={{ textDecoration: "none" }}
                    >
                      {r.target}
                      <span className="ico material-symbols-outlined">north_east</span>
                    </Link>
                    {r.targetSub && (
                      <div className="rv-card__court-sub">
                        <span className="ico material-symbols-outlined">location_on</span>
                        {r.targetSub}
                      </div>
                    )}
                  </div>
                  <div className="rv-card__rating">
                    <span className="rv-card__rating-num">{r.rating.toFixed(1)}</span>
                    <RatingStars value={r.rating} size={13} />
                  </div>
                </div>

                {/* 인증 / 사진 badge (둘 다 없으면 행 자체 생략) */}
                {(r.verified || r.photos > 0) && (
                  <div className="rv-card__badges">
                    {r.verified && (
                      <span className="rv-badge rv-badge--verified">
                        <span className="ico material-symbols-outlined">verified</span>
                        인증 방문
                      </span>
                    )}
                    {r.photos > 0 && (
                      <span className="rv-badge rv-badge--photo">
                        <span className="ico material-symbols-outlined">photo_camera</span>
                        사진 {r.photos}장
                      </span>
                    )}
                  </div>
                )}

                <div>
                  <div className="rv-card__title">{r.title}</div>
                  {r.body && (
                    <p className="rv-card__body" style={{ margin: "6px 0 0" }}>
                      {r.body}
                    </p>
                  )}
                </div>

                <div className="rv-card__foot">
                  <div className="rv-card__author">
                    {/* 아바타: 작성자 첫 글자 이니셜 (이미지 없음 → 시안 carry) */}
                    <span className="rv-card__avatar">{r.author.charAt(0)}</span>
                    <div>
                      <div className="rv-card__author-name">{r.author}</div>
                      <div className="rv-card__author-meta">{r.authorLevel}</div>
                    </div>
                  </div>
                  {/* helpful 컬럼 없음 → likes(=likes_count) 표기 */}
                  <span className="rv-card__helpful">
                    <span className="ico material-symbols-outlined">thumb_up</span>
                    {r.likes}
                  </span>
                  <span className="rv-card__date">{fmtDate(r.createdAt)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          // 0건 빈상태 (전체 0건 또는 필터 결과 0건)
          <div className="card" style={{ padding: 60, textAlign: "center" }}>
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 48,
                color: "var(--ink-dim)",
                marginBottom: 12,
                display: "block",
              }}
            >
              rate_review
            </span>
            <div
              style={{
                fontWeight: 700,
                fontSize: 16,
                marginBottom: 6,
                color: "var(--ink)",
              }}
            >
              {total === 0
                ? "아직 등록된 코트 리뷰가 없습니다"
                : "조건에 맞는 리뷰가 없습니다"}
            </div>
            <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
              {total === 0
                ? "첫 리뷰를 작성하려면 코트 상세 페이지에서 별점을 남겨주세요."
                : "필터를 바꿔보세요."}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
