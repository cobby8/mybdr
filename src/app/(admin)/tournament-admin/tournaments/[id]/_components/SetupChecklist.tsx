/**
 * 2026-05-13 UI-1 — 대회 셋업 체크리스트 hub (server component).
 *
 * 이유(왜):
 *   - dashboard 의 8 메뉴 카드는 "어디서 뭘 해야하는지" 만 안내했지 "지금 어디까지 왔는지" 못 보여줌.
 *   - 체크리스트 카드 8개 + 상단 progress bar 로 "진행도 + 잠금 단계 + 진입 링크" 를 한 화면에 통합.
 *
 * 구성:
 *   1. 상단 progress bar (`completed / total` + %)
 *   2. 8 카드 (Link wrapper / status 별 색상 / 잠금 시 cursor-not-allowed)
 *   3. 공개 버튼 (allRequiredComplete=false 면 disabled + 사유 표시) — 별도 PublishGuard 클라이언트 X,
 *      현재는 단순 표시만 (실제 공개 토글은 /site 페이지에서 처리).
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-*) 토큰만 / Material Symbols Outlined / 4px border-radius / 44px+ 터치
 *   - 색상: ✅ accent / 🔄 warning / ⚪ text-muted / 🔒 muted + opacity 0.6
 */

import Link from "next/link";
import type { SetupProgress, ChecklistItem, ChecklistStatus } from "@/lib/tournaments/setup-status";

// ─────────────────────────────────────────────────────────────────────────
// status → 색상/아이콘 매핑 (단일 진실의 원천 — UI 룰 변경 시 한 곳만 수정)
// ─────────────────────────────────────────────────────────────────────────

// 카드 좌측 상태 아이콘 (Material Symbols 이름)
const STATUS_ICON: Record<ChecklistStatus, string> = {
  complete: "check_circle",
  in_progress: "pending",
  empty: "radio_button_unchecked",
  locked: "lock",
};

// 카드 좌측 아이콘 색상 (CSS 변수)
const STATUS_COLOR: Record<ChecklistStatus, string> = {
  complete: "var(--color-accent)",
  in_progress: "var(--color-warning)",
  empty: "var(--color-text-muted)",
  locked: "var(--color-text-muted)",
};

// 카드 좌측 상태 라벨 (한국어 — 시각 안내)
const STATUS_LABEL: Record<ChecklistStatus, string> = {
  complete: "완료",
  in_progress: "진행 중",
  empty: "미설정",
  locked: "잠금",
};

// ─────────────────────────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────────────────────────

type Props = {
  progress: SetupProgress;
};

export function SetupChecklist({ progress }: Props) {
  // 진행도 % (소수 1자리, 8개 기준이라 정수 가능 시 정수로 노출)
  const percent = Math.round((progress.completed / progress.total) * 100);

  return (
    <section className="mb-6">
      {/* 상단 진행도 바 */}
      <div
        className="mb-4 rounded-[var(--radius-card)] border p-4"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
      >
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--color-text-primary)]">
            대회 셋업 진행도
          </span>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {progress.completed} / {progress.total}{" "}
            <span className="text-[var(--color-text-muted)]">({percent}%)</span>
          </span>
        </div>
        {/* 이유: progress bar = elevated track + accent fill. 높이 8px / 라운드 4px (디자인 룰). */}
        <div
          className="h-2 w-full overflow-hidden rounded-[4px]"
          style={{ backgroundColor: "var(--color-elevated)" }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percent}%`,
              backgroundColor: "var(--color-accent)",
            }}
          />
        </div>
      </div>

      {/* 체크리스트 8 카드 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {progress.items.map((item) => (
          <ChecklistCard key={item.key} item={item} />
        ))}
      </div>

      {/* 공개 가드 안내 (필수 항목 미충족 시) */}
      {!progress.allRequiredComplete && progress.missingRequiredTitles.length > 0 && (
        <div
          className="mt-4 rounded-[var(--radius-card)] border p-3 text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-elevated)",
            color: "var(--color-text-muted)",
          }}
        >
          <span className="material-symbols-outlined align-middle text-[16px]">info</span>{" "}
          공개를 위해 남은 항목:{" "}
          <span className="font-medium text-[var(--color-text-primary)]">
            {progress.missingRequiredTitles.join(", ")}
          </span>
        </div>
      )}
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 개별 카드
// ─────────────────────────────────────────────────────────────────────────

function ChecklistCard({ item }: { item: ChecklistItem }) {
  const isLocked = item.status === "locked";

  // 이유: 잠금 카드는 클릭 비활성 (Link 미사용). non-locked 만 Link wrapper.
  const inner = (
    <div
      className="rounded-[var(--radius-card)] border p-4 transition-colors"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
        opacity: isLocked ? 0.6 : 1,
        cursor: isLocked ? "not-allowed" : "pointer",
        minHeight: 96, // 44px+ 터치 (디자인 룰)
      }}
    >
      <div className="flex items-start gap-3">
        {/* 좌측 상태 아이콘 */}
        <div
          className="flex-shrink-0"
          style={{ color: STATUS_COLOR[item.status] }}
          aria-label={STATUS_LABEL[item.status]}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 28 }}
          >
            {STATUS_ICON[item.status]}
          </span>
        </div>

        {/* 본문 */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">
              {item.step}단계
            </span>
            {!item.required && (
              <span className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: "var(--color-elevated)",
                  color: "var(--color-text-muted)",
                }}
              >
                선택
              </span>
            )}
          </div>
          <h3 className="mb-1 font-semibold text-[var(--color-text-primary)]">
            {item.title}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">{item.summary}</p>
          {/* 잠금 사유 (locked 시만) */}
          {isLocked && item.lockedReason && (
            <p
              className="mt-2 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span className="material-symbols-outlined align-middle text-[14px]">
                lock
              </span>{" "}
              {item.lockedReason}
            </p>
          )}
        </div>

        {/* 우측 화살표 (non-locked 만) */}
        {!isLocked && (
          <div
            className="flex-shrink-0 self-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        )}
      </div>
    </div>
  );

  // 잠금 = 정적 div / 그 외 = Link
  if (isLocked) {
    return <div>{inner}</div>;
  }
  return (
    <Link href={item.link} className="block">
      {inner}
    </Link>
  );
}
