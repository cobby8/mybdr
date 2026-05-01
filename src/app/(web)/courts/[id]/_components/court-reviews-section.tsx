"use client";

/**
 * CourtReviewsSection — /courts/[id] 리뷰 섹션 v3 박제 래퍼
 *
 * 왜 신규 컴포넌트가 필요한가:
 * - 시안 [Phase 16] 통합 Reviews 페이지 폐기 → 컨텍스트별 인라인 리뷰
 *   ContextReviews 신규 컴포넌트 (시안 1:1 박제)를 코트 상세에 도입.
 * - 옛 court-reviews.tsx (var(--color-card) 등 옛 토큰) → BDR v3 토큰 마이그 동시 처리.
 *
 * 데이터 패칭 100% 보존 (절대 변경 금지):
 * - SWR `/api/web/courts/${courtId}/reviews` (GET)
 * - DELETE `/api/web/courts/${courtId}/reviews/${reviewId}`
 * - ReviewForm 의 POST 도 그대로 (review-form.tsx 내부 핸들러 유지)
 *
 * 기능 보존:
 * - 5항목 세부 별점 (REVIEW_CATEGORIES) 평균 막대 — 시안 ContextReviews 분포 위에 별도 섹션
 * - 본인 리뷰 삭제 버튼 (currentUserId === user_id 일 때)
 * - 작성 폼 토글 (showForm) — 로그인 + 내 리뷰 없을 때만 노출
 *
 * 시안 매핑:
 * - 헤더 / 분포 / 카드 3건 → ContextReviews kind="court" 사용
 * - 5항목 평균 막대 → ContextReviews 위에 별도 섹션 (시안에는 없으나 운영 기능 보존)
 * - 작성 폼 → onWrite 토글 → ReviewForm 인라인 expand
 * - 전체 보기 → onViewAll 미연결 (현재 /reviews 는 코트 글로벌이므로 deep-link 없음 — 추후 큐)
 */

import { useState, useCallback, useMemo } from "react";
import useSWR from "swr";
import { ContextReviews, type ContextReviewItem } from "@/components/reviews/context-reviews";
import { StarRating } from "./star-rating";
import { ReviewForm } from "./review-form";
import { REVIEW_CATEGORIES } from "@/lib/constants/court";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// API 응답 단일 리뷰 — 운영 응답 키 그대로 (snake_case)
interface ReviewData {
  id: string;
  user_id: string;
  nickname: string;
  profile_image: string | null;
  rating: number;
  facility_rating: number | null;
  accessibility_rating: number | null;
  surface_rating: number | null;
  lighting_rating: number | null;
  atmosphere_rating: number | null;
  content: string | null;
  photos: string[];
  created_at: string;
}

interface CourtReviewsSectionProps {
  courtId: string;
  // 로그인한 유저 ID — 삭제 버튼 + 중복 방지 + 작성 가능 여부 판단
  currentUserId?: string;
}

// "YYYY-MM-DD" → "YYYY.MM.DD" mono 표기 (시안 ContextReviews 카드 date 형식)
function fmtDate(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}.${m}.${day}`;
}

export function CourtReviewsSection({ courtId, currentUserId }: CourtReviewsSectionProps) {
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // SWR 패칭 — 옛 court-reviews.tsx 패턴 그대로 (revalidateOnFocus 끔)
  const { data, mutate } = useSWR<{ reviews: ReviewData[]; total: number }>(
    `/api/web/courts/${courtId}/reviews`,
    fetcher,
    { revalidateOnFocus: false }
  );

  const reviews = useMemo<ReviewData[]>(() => data?.reviews ?? [], [data]);

  // 내가 이미 리뷰를 작성했는지 (중복 방지 UI)
  const hasMyReview = currentUserId
    ? reviews.some((r) => r.user_id === currentUserId)
    : false;

  // 5항목 세부 별점 평균 (REVIEW_CATEGORIES 5항목 — 시안에는 없으나 운영 기능 보존)
  const categoryAverages = useMemo(
    () =>
      REVIEW_CATEGORIES.map((cat) => {
        const ratingValues = reviews
          .map((r) => r[cat.key as keyof ReviewData] as number | null)
          .filter((v): v is number => v != null);
        const avg =
          ratingValues.length > 0
            ? ratingValues.reduce((sum, v) => sum + v, 0) / ratingValues.length
            : 0;
        return { ...cat, avg: Math.round(avg * 10) / 10 };
      }),
    [reviews]
  );

  // ContextReviews 가 받는 형태로 변환 (author/rating/date/body)
  const contextReviews = useMemo<ContextReviewItem[]>(
    () =>
      reviews.map((r) => ({
        author: r.nickname,
        rating: r.rating,
        date: fmtDate(r.created_at),
        body: r.content ?? "",
      })),
    [reviews]
  );

  // 삭제 핸들러 — 옛 패턴 그대로 (confirm 후 DELETE → mutate)
  const handleDelete = useCallback(
    async (reviewId: string) => {
      if (!confirm("리뷰를 삭제하시겠습니까?")) return;
      setDeletingId(reviewId);
      try {
        const res = await fetch(`/api/web/courts/${courtId}/reviews/${reviewId}`, {
          method: "DELETE",
        });
        if (res.ok) {
          mutate();
        } else {
          const json = await res.json();
          alert(json.error || "삭제에 실패했습니다");
        }
      } catch {
        alert("네트워크 오류가 발생했습니다");
      } finally {
        setDeletingId(null);
      }
    },
    [courtId, mutate]
  );

  // 작성 가능 여부 — 로그인 + 내 리뷰 없을 때만 onWrite 노출
  const canWrite = !!currentUserId && !hasMyReview;

  // 본인 리뷰 (삭제 버튼용 — ContextReviews 외부에 별도 노출)
  const myReview = currentUserId
    ? reviews.find((r) => r.user_id === currentUserId) ?? null
    : null;

  return (
    <div style={{ marginBottom: 16, display: "flex", flexDirection: "column", gap: 12 }}>
      {/* 5항목 세부 별점 평균 — 시안 ContextReviews 위 별도 섹션 (운영 기능 보존) */}
      {reviews.length > 0 && (
        <section
          className="card"
          style={{
            padding: "18px 22px",
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              letterSpacing: "-0.01em",
              color: "var(--ink)",
              marginBottom: 12,
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{
                fontSize: 16,
                verticalAlign: "middle",
                marginRight: 4,
                color: "var(--accent)",
              }}
            >
              tune
            </span>
            세부 항목 평균
          </h3>
          <div className="space-y-1.5">
            {categoryAverages.map((cat) => (
              <div key={cat.key} className="flex items-center gap-2 text-xs">
                <span
                  className="w-12 text-right"
                  // BDR v3 — ink-mute
                  style={{ color: "var(--ink-mute)" }}
                >
                  {cat.label}
                </span>
                {/* 막대 배경 */}
                <div
                  className="flex-1 h-2 rounded-full overflow-hidden"
                  style={{ backgroundColor: "var(--bg-alt)" }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(cat.avg / 5) * 100}%`,
                      backgroundColor: "var(--accent)",
                    }}
                  />
                </div>
                <span
                  className="w-6 text-right"
                  style={{ color: "var(--ink-soft)" }}
                >
                  {cat.avg > 0 ? cat.avg.toFixed(1) : "-"}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 시안 ContextReviews 본체 — 헤더 + 분포 + 카드 3건 + 작성/전체보기 액션 */}
      <ContextReviews
        kind="court"
        reviews={contextReviews}
        onWrite={canWrite ? () => setShowForm(true) : undefined}
        // 전체 보기는 현재 미연결 — /reviews 가 글로벌 모음이라 코트 단위 deep-link 없음
        // 추후 /reviews?courtId=... 도입 시 활성화 (추후 큐)
      />

      {/* 작성 폼 — onWrite 클릭 시 인라인 expand. ReviewForm 5항목 별점 + photos POST 100% 보존 */}
      {showForm && canWrite && (
        <ReviewForm
          courtId={courtId}
          onSubmitted={() => {
            setShowForm(false);
            mutate(); // 작성 완료 후 SWR 재패칭
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* 본인 리뷰 — ContextReviews 카드 노출 외 별도 액션 (삭제 버튼 + 사진 + 전체 별점 표시) */}
      {myReview && (
        <section
          className="card"
          style={{
            padding: "14px 18px",
          }}
        >
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
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <strong style={{ fontSize: 13, color: "var(--ink)" }}>내 리뷰</strong>
              <StarRating value={myReview.rating} size={14} />
            </div>
            <button
              type="button"
              onClick={() => handleDelete(myReview.id)}
              disabled={deletingId === myReview.id}
              className="text-xs transition-colors"
              // BDR v3 — ink-dim
              style={{ color: "var(--ink-dim)" }}
            >
              {deletingId === myReview.id ? "삭제 중..." : "삭제"}
            </button>
          </div>
          {myReview.content && (
            <p
              style={{
                margin: 0,
                fontSize: 13,
                lineHeight: 1.6,
                color: "var(--ink-soft)",
              }}
            >
              {myReview.content}
            </p>
          )}
          {/* 첨부 사진 — 옛 court-reviews.tsx 패턴 그대로 */}
          {Array.isArray(myReview.photos) && myReview.photos.length > 0 && (
            <div className="flex gap-1.5 mt-2">
              {myReview.photos.map((url, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={url}
                  alt={`내 리뷰 사진 ${i + 1}`}
                  className="w-16 h-16 rounded-lg object-cover"
                  style={{ border: "1px solid var(--border-subtle)" }}
                />
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
