/**
 * RecentActivityCard — admin 마이페이지 최근 admin 활동 카드.
 *
 * 2026-05-11 — Phase 2 (관리 토너먼트 / 본인인증 / 최근 활동).
 *
 * 데이터 소스: `admin_logs WHERE admin_id = self ORDER BY created_at DESC LIMIT 10`
 *   - page.tsx 에서 SELECT 후 prop 으로 전달.
 *   - bigint id 는 string 으로 직렬화 (마이페이지 표시용 — DB 접근 없음).
 *
 * 표시:
 *   - 각 행 = action (또는 description) + severity 색 + 상대시간
 *   - 0건 = "최근 활동 기록이 없습니다"
 *
 * 디자인 토큰만 — var(--*) / Material Symbols Outlined / 4px rounded.
 * server component (interactivity 0 — 상대시간은 SSR 시 계산).
 */

export interface RecentActivityCardProps {
  logs: AdminLogRow[];
}

// admin_logs 직렬화 형식 (page.tsx 에서 변환)
export interface AdminLogRow {
  id: string; // bigint → string
  action: string;
  resourceType: string;
  description: string | null;
  severity: string | null; // "info" / "warning" / "error" 등
  createdAt: Date;
}

// 상대시간 포맷 — "방금 전" / "3분 전" / "2시간 전" / "어제" / "5월 9일"
// 이유: 사용자 친화 표기. 24h 이내 = 분/시 / 1~7일 = "N일 전" / 7일+ = 절대 날짜.
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

// severity → 색상 토큰 매핑
function severityColor(severity: string | null): string {
  switch (severity) {
    case "error":
      return "var(--color-primary)"; // BDR Red — 디자인 토큰 (코랄 ❌)
    case "warning":
      return "var(--color-warning, var(--color-primary))";
    case "info":
    default:
      return "var(--color-text-secondary)";
  }
}

// severity → 아이콘
function severityIcon(severity: string | null): string {
  switch (severity) {
    case "error":
      return "error";
    case "warning":
      return "warning";
    case "info":
    default:
      return "info";
  }
}

// action 한글 간단 매트릭스 — 자주 등장하는 action 은 한글 보조
// 이유: action 영문 그대로면 사용자 이해도 ↓. description 이 한글이면 그대로 사용, 없으면 action.
const ACTION_LABEL_MAP: Record<string, string> = {
  create: "생성",
  update: "수정",
  delete: "삭제",
  publish: "공개",
  unpublish: "비공개",
  approve: "승인",
  reject: "거부",
  ban: "차단",
  unban: "차단 해제",
};

function actionLabel(action: string): string {
  return ACTION_LABEL_MAP[action] ?? action;
}

function ActivityRow({ log }: { log: AdminLogRow }) {
  // 표시 텍스트 — description 있으면 우선, 없으면 "{resourceType} {action}"
  const text =
    log.description?.trim() ||
    `${log.resourceType} ${actionLabel(log.action)}`;

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
        style={{ fontSize: 16, color: severityColor(log.severity) }}
      >
        {severityIcon(log.severity)}
      </span>
      <div className="flex-1 min-w-0">
        <div
          className="truncate"
          style={{ color: "var(--color-text-primary)" }}
        >
          {text}
        </div>
        <div
          className="mt-0.5 text-[11px]"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {formatRelativeTime(log.createdAt)}
        </div>
      </div>
    </li>
  );
}

export function RecentActivityCard({ logs }: RecentActivityCardProps) {
  return (
    <section
      className="rounded-lg border p-6"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-surface)",
      }}
    >
      <header className="mb-3">
        <h2
          className="text-lg font-bold"
          style={{ color: "var(--color-text-primary)" }}
        >
          최근 admin 활동
        </h2>
        <p
          className="mt-1 text-xs"
          style={{ color: "var(--color-text-secondary)" }}
        >
          최근 10건의 관리자 활동 기록입니다.
        </p>
      </header>

      {logs.length === 0 ? (
        <div
          className="rounded-md border p-4 text-sm text-center"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-elevated)",
            color: "var(--color-text-secondary)",
          }}
        >
          최근 활동 기록이 없습니다.
        </div>
      ) : (
        <ul className="space-y-1.5">
          {logs.map((log) => (
            <ActivityRow key={log.id} log={log} />
          ))}
        </ul>
      )}
    </section>
  );
}

// 상대시간 함수 export — 테스트에서 직접 호출용
export { formatRelativeTime };
