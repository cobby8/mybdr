/**
 * NotificationsCard — admin 마이페이지 본인 알림 카드.
 *
 * 2026-05-11 — Phase 3 (알림 + 건의사항 + 비번 변경 진입점).
 *
 * 데이터 소스:
 *   - `notifications WHERE user_id = self` (본인 알림만 — IDOR 0)
 *   - 미확인 카운트 = `status = "unread"` (schema 박제: 1764 line 박제)
 *   - 최근 5건 = `ORDER BY created_at DESC LIMIT 5`
 *   - page.tsx 에서 SELECT 후 prop 으로 전달 (BigInt id → string 직렬화).
 *
 * 표시 (사용자 결재 — 알림 카드 = 미확인 카운트 + 최근 5건 + 전체보기 링크):
 *   - 헤더 = "알림 (N건 미확인)" — N=0 이면 "알림"
 *   - 본문 = 최근 5건 (type + title + 상대시간)
 *   - 하단 우측 = "전체 보기 →" Link `/admin/notifications`
 *   - 0건 = "새 알림이 없습니다"
 *
 * 디자인 토큰만 — var(--*) / Material Symbols Outlined / 4px rounded.
 * server component (interactivity 0 — 상대시간은 SSR 시 계산).
 */

import Link from "next/link";

// notifications row 직렬화 형식 (page.tsx 에서 변환 후 전달)
// 이유: bigint id 그대로면 Next.js client prop serialization 에러 → string 변환
export interface NotificationRow {
  id: string; // bigint → string
  notificationType: string; // notification_type 컬럼 (snake_case → camelCase)
  status: string; // "unread" / "read" 등
  title: string;
  createdAt: Date;
  readAt: Date | null;
}

export interface NotificationsCardProps {
  unreadCount: number; // status="unread" 본인 알림 총 개수
  notifications: NotificationRow[]; // 최근 5건
}

// 상대시간 포맷 — RecentActivityCard 와 동일 룰 박제 (재사용 안 하는 이유: 카드 간 독립성)
// "방금 전" / "3분 전" / "2시간 전" / "어제" / "5월 9일"
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
  // 7일+ = 절대 날짜 "5월 9일"
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

// notification_type → 한글 라벨 간단 매트릭스
// 이유: type 영문 그대로면 사용자 이해도 ↓. 미매칭 type 은 raw 표시.
const TYPE_LABEL_MAP: Record<string, string> = {
  tournament_application: "대회 신청",
  tournament_approved: "대회 승인",
  tournament_rejected: "대회 거절",
  match_result: "경기 결과",
  match_schedule: "경기 일정",
  team_invite: "팀 초대",
  payment: "결제",
  system: "시스템",
  announcement: "공지",
};

function typeLabel(type: string): string {
  return TYPE_LABEL_MAP[type] ?? type;
}

// 단일 알림 row — 미확인 (unread) 강조 색상 적용
function NotificationItem({ n }: { n: NotificationRow }) {
  // 미확인 = primary 색 좌측 마커 강조. 읽음 = 기본.
  const isUnread = n.status === "unread";

  return (
    <li
      className="flex items-start gap-2 rounded border px-3 py-2 text-xs"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
        borderRadius: "4px",
      }}
    >
      {/* 아이콘 — 미확인이면 BDR Red, 읽음이면 회색 */}
      <span
        className="material-symbols-outlined mt-0.5"
        style={{
          fontSize: 16,
          color: isUnread
            ? "var(--color-primary)"
            : "var(--color-text-secondary)",
        }}
      >
        {isUnread ? "notifications_active" : "notifications"}
      </span>
      <div className="flex-1 min-w-0">
        {/* type 라벨 + 제목 */}
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            className="text-[11px] shrink-0"
            style={{ color: "var(--color-text-secondary)" }}
          >
            [{typeLabel(n.notificationType)}]
          </span>
          <span
            className="truncate"
            style={{
              color: "var(--color-text-primary)",
              // 미확인은 굵게 (강조)
              fontWeight: isUnread ? 600 : 400,
            }}
          >
            {n.title}
          </span>
        </div>
        <div
          className="mt-0.5 text-[11px]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {formatRelativeTime(n.createdAt)}
        </div>
      </div>
    </li>
  );
}

export function NotificationsCard({
  unreadCount,
  notifications,
}: NotificationsCardProps) {
  // 헤더 라벨 — 미확인 N건 표시 (0 이면 카운트 생략)
  const headerLabel =
    unreadCount > 0 ? `알림 (${unreadCount}건 미확인)` : "알림";

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
            최근 5건의 알림입니다.
          </p>
        </div>
      </header>

      {/* 본문 — 0건 안내 또는 최근 5건 리스트 */}
      {notifications.length === 0 ? (
        <div
          className="rounded-md border p-4 text-sm text-center"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-elevated)",
            color: "var(--color-text-secondary)",
            borderRadius: "4px",
          }}
        >
          새 알림이 없습니다.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {notifications.map((n) => (
            <NotificationItem key={n.id} n={n} />
          ))}
        </ul>
      )}

      {/* 하단 우측 — 전체 보기 링크 (notifications 페이지로 진입) */}
      {/* 이유: 마이페이지는 요약만, 상세는 기존 /admin/notifications 박제 */}
      <div className="mt-3 flex justify-end">
        <Link
          href="/admin/notifications"
          className="text-xs font-medium hover:underline"
          style={{ color: "var(--color-primary)" }}
        >
          전체 보기 →
        </Link>
      </div>
    </section>
  );
}

// 상대시간 함수 export — 테스트에서 직접 호출용
export { formatRelativeTime };
