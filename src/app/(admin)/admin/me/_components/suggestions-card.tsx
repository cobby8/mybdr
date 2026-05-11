/**
 * SuggestionsCard — admin 마이페이지 본인 배정 건의사항 카드.
 *
 * 2026-05-11 — Phase 3 (알림 + 건의사항 + 비번 변경 진입점).
 *
 * 데이터 소스:
 *   - `suggestions WHERE assigned_to_id = self AND status = "pending"` (본인 배정 미처리만)
 *   - 처리 대기 카운트 = "pending" 상태 (schema 박제: 1971 line — status @default("pending"))
 *   - 최근 5건 = `ORDER BY created_at DESC LIMIT 5`
 *   - page.tsx 에서 SELECT 후 prop 으로 전달 (BigInt id → string 직렬화).
 *
 * 표시 (사용자 결재 — 건의사항 카드 = 본인 배정 미처리 카운트 + 최근 5건 + 전체보기):
 *   - 헤더 = "건의사항 (N건 처리 대기)" — N=0 이면 "건의사항"
 *   - 본문 = 최근 5건 (제목 + status 뱃지 + 상대시간)
 *   - 하단 우측 = "전체 보기 →" Link `/admin/suggestions`
 *   - 0건 = "처리 대기 건의사항이 없습니다"
 *
 * 디자인 토큰만 — var(--*) / Material Symbols Outlined / 4px rounded.
 * server component (interactivity 0).
 */

import Link from "next/link";

// suggestions row 직렬화 형식 (page.tsx 에서 변환 후 전달)
export interface SuggestionRow {
  id: string; // bigint → string
  title: string;
  category: string; // "general" / "bug" / "feature" 등
  status: string; // "pending" / "open" / "in_progress" / "resolved" / "rejected"
  priority: number | null; // 0~ (높을수록 우선)
  createdAt: Date;
}

export interface SuggestionsCardProps {
  pendingCount: number; // 본인 배정 + status="pending" 카운트
  suggestions: SuggestionRow[]; // 최근 5건
}

// 상대시간 포맷 — RecentActivityCard / NotificationsCard 와 동일 룰 박제
function formatRelativeTime(date: Date, now: Date = new Date()): string {
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return "방금 전";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return "어제";
  if (diffDay < 7) return `${diffDay}일 전`;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// status → 한글 라벨 (suggestions/admin-suggestions-content.tsx L78~ 박제 일치)
const STATUS_LABEL_MAP: Record<string, string> = {
  pending: "대기",
  open: "접수됨",
  in_progress: "처리중",
  resolved: "해결",
  rejected: "반려",
};

function statusLabel(status: string): string {
  return STATUS_LABEL_MAP[status] ?? status;
}

// category → 한글 라벨 (간단 — 미매칭은 raw 표시)
const CATEGORY_LABEL_MAP: Record<string, string> = {
  general: "일반",
  bug: "버그",
  feature: "기능",
  improvement: "개선",
  question: "질문",
};

function categoryLabel(category: string): string {
  return CATEGORY_LABEL_MAP[category] ?? category;
}

// status 뱃지 색 매핑 — 디자인 토큰만 (핑크/살몬/코랄 ❌)
function statusBadgeStyle(status: string): {
  bg: string;
  color: string;
} {
  switch (status) {
    case "pending":
      // 대기 = 강조 (BDR Red 톤)
      return { bg: "var(--color-primary)", color: "white" };
    case "in_progress":
      // 처리중 = 진행 (서브 톤)
      return {
        bg: "var(--color-elevated)",
        color: "var(--color-text-primary)",
      };
    case "resolved":
      // 해결 = 약간 어두운 톤
      return {
        bg: "var(--color-surface)",
        color: "var(--color-text-secondary)",
      };
    default:
      return {
        bg: "var(--color-surface)",
        color: "var(--color-text-secondary)",
      };
  }
}

// 단일 건의사항 row
function SuggestionItem({ s }: { s: SuggestionRow }) {
  const badgeStyle = statusBadgeStyle(s.status);

  // 처리 대기 = 강조. 그 외는 기본.
  const isPending = s.status === "pending";

  return (
    <li
      className="flex items-start gap-2 rounded border px-3 py-2 text-xs"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
        borderRadius: "4px",
      }}
    >
      <span
        className="material-symbols-outlined mt-0.5"
        style={{
          fontSize: 16,
          color: isPending
            ? "var(--color-primary)"
            : "var(--color-text-secondary)",
        }}
      >
        {isPending ? "feedback" : "task_alt"}
      </span>
      <div className="flex-1 min-w-0">
        {/* category + 제목 */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-[11px] shrink-0"
            style={{ color: "var(--color-text-secondary)" }}
          >
            [{categoryLabel(s.category)}]
          </span>
          <span
            className="truncate"
            style={{
              color: "var(--color-text-primary)",
              fontWeight: isPending ? 600 : 400,
            }}
          >
            {s.title}
          </span>
        </div>
        {/* 하단 = status 뱃지 + 상대시간 */}
        <div className="mt-1 flex items-center gap-2">
          <span
            className="px-1.5 py-0.5 text-[10px] font-medium"
            style={{
              backgroundColor: badgeStyle.bg,
              color: badgeStyle.color,
              borderRadius: "4px",
            }}
          >
            {statusLabel(s.status)}
          </span>
          <span
            className="text-[11px]"
            style={{ color: "var(--color-text-secondary)" }}
          >
            {formatRelativeTime(s.createdAt)}
          </span>
        </div>
      </div>
    </li>
  );
}

export function SuggestionsCard({
  pendingCount,
  suggestions,
}: SuggestionsCardProps) {
  // 헤더 라벨 — 처리 대기 N건 표시 (0 이면 카운트 생략)
  const headerLabel =
    pendingCount > 0 ? `건의사항 (${pendingCount}건 처리 대기)` : "건의사항";

  return (
    <section
      className="rounded-lg border p-6"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      {/* 섹션 헤더 */}
      <header className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2
            className="text-lg font-bold"
            style={{ color: "var(--color-text-primary)" }}
          >
            {headerLabel}
          </h2>
          <p
            className="mt-1 text-xs"
            style={{ color: "var(--color-text-secondary)" }}
          >
            나에게 배정된 최근 5건의 건의사항입니다.
          </p>
        </div>
      </header>

      {/* 본문 — 0건 안내 또는 최근 5건 리스트 */}
      {suggestions.length === 0 ? (
        <div
          className="rounded-md border p-4 text-sm text-center"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-elevated)",
            color: "var(--color-text-secondary)",
            borderRadius: "4px",
          }}
        >
          처리 대기 건의사항이 없습니다.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {suggestions.map((s) => (
            <SuggestionItem key={s.id} s={s} />
          ))}
        </ul>
      )}

      {/* 하단 우측 — 전체 보기 링크 */}
      <div className="mt-3 flex justify-end">
        <Link
          href="/admin/suggestions"
          className="text-xs font-medium hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          전체 보기 →
        </Link>
      </div>
    </section>
  );
}

// 헬퍼 함수 export — 테스트용
export { formatRelativeTime, statusLabel, categoryLabel };
