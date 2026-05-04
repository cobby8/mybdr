"use client";

/**
 * Admin 신고 검토 큐 페이지 (Phase 10-1 B-9)
 *
 * 왜:
 * - 경기 종료 후 사용자가 동행자에게 매긴 평가 중 신고 플래그(no_show/late/poor_manner/foul/verbal/cheat)가
 *   달린 항목을 super_admin이 한 곳에서 검토하기 위한 큐.
 *
 * 어떻게:
 * - GET /api/web/admin/game-reports 에서 신고 누적된 리포트만 조회
 * - 카드 형태로 게임 정보 + 신고자 + 피신고자 + 플래그 + 코멘트 노출
 * - status 필터 (submitted/reviewed/dismissed/all) 탭 제공
 * - 검토/기각 액션은 후속 작업 (현 페이지는 조회만)
 *
 * 보안:
 * - layout.tsx에서 admin 그룹 가드 적용
 * - API 라우트에서 super_admin 재검증 (세션 변조 대비)
 */

import { useCallback, useEffect, useState } from "react";
import { AdminPageHeader } from "@/components/admin/admin-page-header";

// 신고 플래그 라벨 — DB에 저장된 코드 → 한국어 표시
const FLAG_LABELS: Record<string, string> = {
  no_show: "노쇼",
  late: "지각",
  poor_manner: "매너 불량",
  foul: "거친 플레이",
  verbal: "폭언",
  cheat: "심판/규칙 무시",
};

// 응답 타입 — API와 동일하게 snake_case 변환된 응답 키 (apiSuccess 통과 후)
// 주의: apiSuccess는 응답 키를 자동 snake_case로 변환함 → 프론트는 snake_case 접근
interface RatingItem {
  id: string;
  rated_user: { id: string; nickname: string };
  rating: number;
  flags: string[];
  is_noshow: boolean;
}

interface ReportItem {
  id: string;
  status: string;
  overall_rating: number;
  comment: string | null;
  created_at: string;
  game: { id: string; title: string; scheduled_at: string | null };
  reporter: { id: string; nickname: string };
  ratings: RatingItem[];
}

// 상태별 뱃지 색상 (organizations 페이지 패턴 참조)
function statusBadge(status: string): { bg: string; label: string } {
  const map: Record<string, { bg: string; label: string }> = {
    submitted: { bg: "var(--color-warning)", label: "검토 대기" },
    reviewed: { bg: "var(--color-success)", label: "검토 완료" },
    dismissed: { bg: "var(--color-text-muted)", label: "기각" },
  };
  return map[status] || map.submitted;
}

export default function AdminGameReportsPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("submitted");
  const [hasMore, setHasMore] = useState(false);

  // 신고 큐 조회
  const fetchReports = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams({ status: filter, limit: "20" });
    const res = await fetch(`/api/web/admin/game-reports?${qs.toString()}`);
    if (res.ok) {
      const data = await res.json();
      // apiSuccess는 wrapping 없이 데이터를 그대로 snake_case 변환해서 반환
      // → 응답 형태: { reports: [...], has_more: bool, next_cursor: string|null }
      // 일부 기존 admin 페이지가 data.data 패턴을 쓰지만, 본 API는 wrapping 안 하므로 직접 접근
      setReports(data.reports || data.data?.reports || []);
      setHasMore(!!(data.has_more ?? data.data?.has_more));
    } else {
      setReports([]);
      setHasMore(false);
    }
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  return (
    <div>
      <AdminPageHeader
        title="신고 검토 큐"
        subtitle="경기 평가에 누적된 신고 플래그를 검토합니다."
      />

      {/* 상태 필터 탭 — (web) .btn 패턴 (활성 .btn--primary) */}
      <div className="mb-4 flex gap-2">
        {[
          { value: "submitted", label: "검토 대기" },
          { value: "reviewed", label: "검토 완료" },
          { value: "dismissed", label: "기각" },
          { value: "all", label: "전체" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => setFilter(tab.value)}
            className={`btn btn--sm ${filter === tab.value ? "btn--primary" : ""}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 본문 */}
      {loading ? (
        <p className="py-8 text-center text-[var(--color-text-muted)]">
          불러오는 중...
        </p>
      ) : reports.length === 0 ? (
        <p className="py-8 text-center text-[var(--color-text-muted)]">
          {filter === "submitted"
            ? "검토 대기 중인 신고가 없습니다."
            : "해당 상태의 신고가 없습니다."}
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((r) => {
            const badge = statusBadge(r.status);
            return (
              <article
                key={r.id}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
              >
                {/* 헤더: 게임 + 상태 뱃지 + 작성일 */}
                <header className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="text-xs text-[var(--color-text-muted)]">
                      게임 #{r.game.id}
                      {r.game.scheduled_at &&
                        ` · ${new Date(r.game.scheduled_at).toLocaleString("ko-KR")}`}
                    </div>
                    <h3 className="mt-0.5 text-base font-semibold text-[var(--color-text-primary)]">
                      {r.game.title || "(제목 없음)"}
                    </h3>
                  </div>
                  <span
                    className="inline-block shrink-0 rounded px-2 py-0.5 text-xs font-semibold text-white"
                    style={{ backgroundColor: badge.bg }}
                  >
                    {badge.label}
                  </span>
                </header>

                {/* 신고자 + 종합 평점 */}
                <div className="mb-3 flex items-center gap-4 text-sm text-[var(--color-text-secondary)]">
                  <div>
                    <span className="text-[var(--color-text-muted)]">
                      신고자:
                    </span>{" "}
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {r.reporter.nickname}
                    </span>
                  </div>
                  <div>
                    <span className="text-[var(--color-text-muted)]">
                      종합 평점:
                    </span>{" "}
                    <span className="font-medium text-[var(--color-text-primary)]">
                      {r.overall_rating}/5
                    </span>
                  </div>
                  <div className="ml-auto text-xs text-[var(--color-text-muted)]">
                    {new Date(r.created_at).toLocaleString("ko-KR")}
                  </div>
                </div>

                {/* 신고된 선수 + 플래그 목록 */}
                <div className="rounded border border-[var(--color-border)] bg-[var(--color-surface-bright)] p-3">
                  <div className="mb-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                    신고된 선수 ({r.ratings.length}명)
                  </div>
                  <ul className="flex flex-col gap-2">
                    {r.ratings.map((rt) => (
                      <li
                        key={rt.id}
                        className="flex flex-wrap items-center gap-2 text-sm"
                      >
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {rt.rated_user.nickname}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          ({rt.rating}/5)
                        </span>
                        {/* 플래그 칩 */}
                        <div className="flex flex-wrap gap-1">
                          {rt.flags.map((f) => (
                            <span
                              key={f}
                              className="rounded bg-[var(--color-error)] px-2 py-0.5 text-xs font-semibold text-white"
                            >
                              {FLAG_LABELS[f] || f}
                            </span>
                          ))}
                          {rt.is_noshow && !rt.flags.includes("no_show") && (
                            <span className="rounded bg-[var(--color-error)] px-2 py-0.5 text-xs font-semibold text-white">
                              노쇼
                            </span>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 코멘트 (있을 때만) */}
                {r.comment && (
                  <div className="mt-3 rounded border-l-2 border-[var(--color-primary)] bg-[var(--color-surface-bright)] p-3 text-sm text-[var(--color-text-secondary)]">
                    <div className="mb-1 text-xs font-semibold text-[var(--color-text-muted)]">
                      코멘트
                    </div>
                    <p className="whitespace-pre-wrap">{r.comment}</p>
                  </div>
                )}

                {/* 액션 영역 — 향후 검토/기각 PATCH 추가 위치 */}
                {r.status === "submitted" && (
                  <div className="mt-3 text-right text-xs text-[var(--color-text-muted)]">
                    검토/기각 액션은 추후 추가 예정
                  </div>
                )}
              </article>
            );
          })}

          {/* 다음 페이지 안내 (페이지네이션 UI는 후속) */}
          {hasMore && (
            <p className="py-4 text-center text-xs text-[var(--color-text-muted)]">
              더 많은 신고가 있습니다 (현재 최근 20건만 표시)
            </p>
          )}
        </div>
      )}
    </div>
  );
}
