"use client";

/* ============================================================
 * ReviewsContent — /reviews v3 박제 (코트 단일 탭)
 *
 * 왜 4탭 → 1탭 축소:
 * - 시안 [Phase 16] 4탭 통합 페이지 폐기 → 컨텍스트별 인라인 ContextReviews 도입.
 * - /reviews 페이지는 디렉토리 가치만 유지 (코트 리뷰 글로벌 모음 + 별점 분포).
 * - 대회/팀/심판 탭 UI 코드 모두 제거 (Q1-A: 비노출 결정 — 주석 X / git log 복구 가능).
 *
 * 데이터 가용성: court 만 (court_reviews 실데이터)
 *
 * 디자인:
 *   - 시안 Dev/design/BDR-current/screens/Reviews.jsx 톤 박제
 *   - 헤더 좌측 타이틀 + 우측 요약 카드 (총 / 평균 / 별점 분포)
 *   - 컨트롤 바: 정렬 select + "+ 리뷰 쓰기"(disabled — 코트 상세에서 작성)
 *   - 카드: 180px(코트명+위치) | 1fr(별점+제목+본문+태그+작성자) | auto(도움됨/신고/♥)
 * ============================================================ */

import { useMemo, useState } from "react";
import Link from "next/link";

// ---- 서버 → 클라 데이터 타입 (page.tsx 와 일치) ----
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

// 정렬 모드 (시안 select 3종)
type SortId = "recent" | "rating" | "helpful";

// ISO → "YYYY.MM.DD" mono 표기 (시안 카드 date 형식)
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

// 별점 시각화 — 시안 ★ ★ ★ ★ ☆ 패턴 (CSS color로 채움/빈칸 구분)
function StarRow({ rating, size = 14 }: { rating: number; size?: number }) {
  const filled = Math.max(0, Math.min(5, Math.round(rating)));
  return (
    <span style={{ color: "var(--accent)", fontSize: size, lineHeight: 1 }}>
      {"★".repeat(filled)}
      <span style={{ color: "var(--border)" }}>{"★".repeat(5 - filled)}</span>
    </span>
  );
}

export interface ReviewsContentProps {
  courts: CourtReviewItem[];
}

export function ReviewsContent({ courts }: ReviewsContentProps) {
  const [sort, setSort] = useState<SortId>("recent");

  // ---- 요약 통계 (시안 우상단 카드) ----
  const summary = useMemo(() => {
    const total = courts.length;
    if (total === 0) {
      return {
        total: 0,
        avg: "0.0",
        dist: [0, 0, 0, 0, 0],
        verified: 0,
      };
    }
    const sum = courts.reduce((acc, r) => acc + r.rating, 0);
    const avg = (sum / total).toFixed(1);
    // dist[0]=5★ 개수, dist[4]=1★ 개수 (시안과 동일 [5,4,3,2,1] 순서)
    const dist = [5, 4, 3, 2, 1].map((n) => courts.filter((r) => r.rating === n).length);
    const verified = courts.filter((r) => r.verified).length;
    return { total, avg, dist, verified };
  }, [courts]);

  // ---- 정렬 ----
  const sortedCourts = useMemo<CourtReviewItem[]>(() => {
    const arr = [...courts];
    if (sort === "rating") {
      // 별점 내림차순 → 동점은 최신순
      arr.sort((a, b) => b.rating - a.rating || b.createdAt.localeCompare(a.createdAt));
    } else if (sort === "helpful") {
      // 도움됨 내림차순 → 동점은 최신순
      arr.sort((a, b) => b.helpful - a.helpful || b.createdAt.localeCompare(a.createdAt));
    } else {
      // recent: ISO 비교 = 시각 내림차순
      arr.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    }
    return arr;
  }, [courts, sort]);

  return (
    <div className="page">
      {/* breadcrumb — 시안 그대로 */}
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

      {/* ====== 헤더 — 좌측 타이틀 + 우측 요약 카드 (시안 2열 그리드) ======
       * 모바일은 1열, sm+ 부터 2열로 분기 (시안 인라인 grid 모바일 분기 룰 §6-5)
       */}
      <div className="grid grid-cols-1 sm:grid-cols-[minmax(0,1fr)_360px] gap-4 mb-[18px]">
        <div>
          <div className="eyebrow">커뮤니티 리뷰 · REVIEWS</div>
          <h1
            style={{
              margin: "4px 0 8px",
              fontSize: 32,
              fontWeight: 800,
              letterSpacing: "-0.02em",
              color: "var(--ink)",
            }}
          >
            다녀온 사람들의 진짜 후기
          </h1>
          <p
            style={{
              margin: 0,
              color: "var(--ink-mute)",
              fontSize: 14,
              maxWidth: 560,
              lineHeight: 1.6,
            }}
          >
            실제 방문 인증된 코트 리뷰만 모았습니다. 별점·사진으로 빠르게 훑어보고,
            코트 상세 페이지에서 직접 후기를 남겨보세요.
          </p>
        </div>

        {/* 요약 카드 — 평균별점 + 분포바 (시안 통일 — accent 단색 막대) */}
        <div className="card" style={{ padding: "18px 20px" }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 10 }}>
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 44,
                fontWeight: 900,
                letterSpacing: "-0.03em",
                color: "var(--ink)",
              }}
            >
              {summary.avg}
            </div>
            <div>
              <StarRow rating={Number(summary.avg)} size={16} />
              <div
                style={{
                  fontSize: 11,
                  color: "var(--ink-mute)",
                  fontFamily: "var(--ff-mono)",
                }}
              >
                {summary.total}개 리뷰 · 인증 {summary.verified}
              </div>
            </div>
          </div>

          {/* 별점 분포 바 5행 (5★ → 1★) — 시안 ContextReviews 와 통일 (accent 단색) */}
          {[5, 4, 3, 2, 1].map((n, i) => {
            const cnt = summary.dist[i];
            const pct = summary.total > 0 ? (cnt / summary.total) * 100 : 0;
            return (
              <div
                key={n}
                style={{
                  display: "grid",
                  gridTemplateColumns: "20px 1fr 32px",
                  gap: 8,
                  alignItems: "center",
                  fontSize: 11,
                  marginBottom: 3,
                }}
              >
                <span style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-dim)" }}>
                  {n}★
                </span>
                <div
                  style={{
                    height: 6,
                    background: "var(--bg-alt)",
                    borderRadius: 3,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{ width: `${pct}%`, height: "100%", background: "var(--accent)" }}
                  />
                </div>
                <span
                  style={{
                    fontFamily: "var(--ff-mono)",
                    color: "var(--ink-dim)",
                    textAlign: "right",
                  }}
                >
                  {cnt}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ====== 컨트롤 바 — 정렬 + 리뷰쓰기 (4탭 제거 — 시안 결정) ====== */}
      <div
        className="card"
        style={{
          padding: "12px 14px",
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* 좌측: 코트 리뷰 카운트 (시안 컨트롤 바 좌측 영역 채움 — 단일 탭이라 필터 X) */}
        <div style={{ fontSize: 13, color: "var(--ink-soft)", display: "flex", gap: 8 }}>
          <span style={{ fontWeight: 700, color: "var(--ink)" }}>코트 리뷰</span>
          <span style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-mute)" }}>
            {summary.total}건
          </span>
        </div>

        {/* 우측: 정렬 + 리뷰쓰기 안내 */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", fontSize: 12 }}>
          <span style={{ color: "var(--ink-mute)" }}>정렬</span>
          <select
            className="input"
            style={{ padding: "4px 8px", fontSize: 12 }}
            value={sort}
            onChange={(e) => setSort(e.target.value as SortId)}
          >
            <option value="recent">최신순</option>
            <option value="rating">별점순</option>
            <option value="helpful">도움순</option>
          </select>
          {/* 리뷰 쓰기 — 통합 폼 미구현. 코트 상세 페이지의 작성 폼으로 유도 */}
          <button
            type="button"
            className="btn btn--accent btn--sm"
            disabled
            title="코트 상세 페이지에서 리뷰를 작성할 수 있습니다"
            style={{ marginLeft: 8, cursor: "not-allowed", opacity: 0.5 }}
          >
            + 리뷰 쓰기
          </button>
        </div>
      </div>

      {/* ====== 리스트 (코트 리뷰 단일) ====== */}
      {sortedCourts.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {sortedCourts.map((r) => (
            <article
              key={r.id}
              className="card"
              style={{
                padding: "18px 22px",
                display: "grid",
                gridTemplateColumns: "180px 1fr auto",
                gap: 18,
              }}
            >
              {/* 좌: 코트명 + 위치 (코트 상세로 링크) — 단일 카테고리이므로 타입 라벨 단순화 */}
              <Link
                href={`/courts/${r.courtId}`}
                style={{
                  textDecoration: "none",
                  color: "inherit",
                  display: "block",
                }}
              >
                <span
                  style={{
                    display: "inline-block",
                    background: "var(--cafe-blue)",
                    color: "var(--on-accent)",
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: ".06em",
                    padding: "3px 8px",
                    borderRadius: 4,
                    textTransform: "uppercase",
                  }}
                >
                  코트
                </span>
                <div
                  style={{
                    fontWeight: 700,
                    fontSize: 14,
                    marginTop: 6,
                    color: "var(--ink)",
                  }}
                >
                  {r.target}
                </div>
                {r.targetSub && (
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--ink-mute)",
                      fontFamily: "var(--ff-mono)",
                    }}
                  >
                    {r.targetSub}
                  </div>
                )}
              </Link>

              {/* 중앙: 별점 + 제목 + 본문 + (사진수) + 작성자/날짜 */}
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 5,
                    flexWrap: "wrap",
                  }}
                >
                  <StarRow rating={r.rating} />
                  <b style={{ fontSize: 15, color: "var(--ink)" }}>{r.title}</b>
                  {r.verified && (
                    <span className="badge badge--ok" style={{ fontSize: 9 }}>
                      ✓ 인증
                    </span>
                  )}
                </div>
                {r.body && (
                  <p
                    style={{
                      margin: "0 0 8px",
                      fontSize: 13.5,
                      color: "var(--ink-soft)",
                      lineHeight: 1.6,
                      // 본문은 5줄까지만 노출 (긴 리뷰 카드 균형)
                      display: "-webkit-box",
                      WebkitLineClamp: 5,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {r.body}
                  </p>
                )}
                <div
                  style={{
                    display: "flex",
                    gap: 8,
                    flexWrap: "wrap",
                    alignItems: "center",
                  }}
                >
                  {/* 태그는 시안에는 있으나 DB 미지원 → 생략 (추후 컬럼 추가 시 노출) */}
                  {r.photos > 0 && (
                    <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                      📷 사진 {r.photos}장
                    </span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--ink-dim)",
                    fontFamily: "var(--ff-mono)",
                    marginTop: 8,
                  }}
                >
                  <b style={{ color: "var(--ink-soft)", fontFamily: "inherit" }}>
                    {r.author}
                  </b>{" "}
                  <span
                    className="badge badge--soft"
                    style={{ fontSize: 9, marginLeft: 2 }}
                    title="레벨 시스템은 준비 중"
                  >
                    {r.authorLevel}
                  </span>{" "}
                  · {fmtDate(r.createdAt)}
                </div>
              </div>

              {/* 우: 도움됨 / 신고 / 좋아요 (모두 disabled — 토글 동작은 추후 구현) */}
              <div
                style={{
                  textAlign: "right",
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  alignItems: "flex-end",
                }}
              >
                <button
                  type="button"
                  className="btn btn--sm"
                  disabled
                  title="도움됨 토글은 준비 중"
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    cursor: "not-allowed",
                    opacity: 0.6,
                  }}
                >
                  👍 도움됨 {r.helpful}
                </button>
                <button
                  type="button"
                  disabled
                  title="신고 기능은 준비 중"
                  style={{
                    fontSize: 11,
                    padding: "4px 10px",
                    background: "transparent",
                    border: 0,
                    color: "var(--ink-dim)",
                    cursor: "not-allowed",
                    opacity: 0.6,
                  }}
                >
                  🚩 신고
                </button>
                <div style={{ fontSize: 11, color: "var(--ink-dim)" }}>♥ {r.likes}</div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        // 0건 빈상태
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
            아직 등록된 코트 리뷰가 없습니다
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            첫 리뷰를 작성하려면 코트 상세 페이지에서 별점을 남겨주세요.
          </div>
        </div>
      )}
    </div>
  );
}
