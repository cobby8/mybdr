/**
 * 2026-05-16 PR-Admin-1 — 단계간 CTA (admin 흐름 §6.5 우선 1).
 *
 * 이유(왜):
 *   - admin-flow-audit-2026-05-16 §3 단계 4·7 단절 ("divisions → teams" / "bracket → matches"
 *     이동 시 SetupChecklist hub 로 다시 돌아가야 다음 단계 진입 가능 — §4 #18 영향도 H).
 *   - 페이지 footer 단일 카드 CTA 박제로 자연스러운 흐름 회복.
 *   - matches → null = PR-Admin-2 단일 순위전 trigger 로 흡수 (별 CTA 없음).
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-info) Navy 톤 / rounded-[4px] / material-symbols-outlined "arrow_forward"
 *   - 모바일 full-width / PC 우측 정렬 / 44px+ 터치 영역
 *
 * 사용:
 *   <NextStepCTA tournamentId={id} currentStep="divisions" />
 *
 * disabled 옵션 (선택):
 *   - 선행 단계 미완성 시 회색 톤 + 안내 메시지 노출
 */

"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";

// ─────────────────────────────────────────────────────────────────────────
// 단계 매핑 — 컴포넌트 내부 single source (admin-flow-audit §3 자연 흐름)
// ─────────────────────────────────────────────────────────────────────────

type Step = "divisions" | "teams" | "bracket" | "matches";

// next = 다음 단계 라우트 segment / label = CTA 라벨
// matches → null = PR-Admin-2 흡수 (단일 순위전 trigger 별도 박제)
const NEXT_STEP_MAP: Record<Step, { next: string; label: string } | null> = {
  divisions: { next: "teams", label: "다음: 팀 등록" },
  teams: { next: "bracket", label: "다음: 대진표 생성" },
  bracket: { next: "matches", label: "다음: 경기 관리" },
  matches: null,
};

type Props = {
  tournamentId: string;
  currentStep: Step;
  // 선행 단계 미완성 시 비활성화 (선택). 기본 = 활성.
  disabled?: boolean;
  // disabled 일 때 노출 (사유 안내 — 선택)
  disabledReason?: string;
};

export function NextStepCTA({
  tournamentId,
  currentStep,
  disabled = false,
  disabledReason,
}: Props) {
  // matches 단계 = 다음 CTA 없음 (PR-Admin-2 단일 trigger 로 흡수)
  const next = NEXT_STEP_MAP[currentStep];
  if (!next) return null;

  const href = `/tournament-admin/tournaments/${tournamentId}/${next.next}`;

  // 비활성 (선행 단계 미완성) — 회색 톤 + 안내 메시지
  if (disabled) {
    return (
      <Card className="mt-6 bg-[var(--color-elevated)]">
        <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
          <button
            type="button"
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center gap-1 rounded-[4px] px-4 py-3 text-sm font-semibold opacity-60"
            style={{
              backgroundColor: "var(--color-elevated)",
              color: "var(--color-text-muted)",
              minHeight: 44,
            }}
          >
            <span className="material-symbols-outlined align-middle text-[18px]">lock</span>
            {next.label}
          </button>
          {disabledReason && (
            <p className="text-xs text-[var(--color-text-muted)] sm:ml-2">
              {disabledReason}
            </p>
          )}
        </div>
      </Card>
    );
  }

  // 활성 — BDR Navy (var(--color-info)) 톤 / arrow_forward 아이콘
  return (
    <Card className="mt-6">
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Link
          href={href}
          className="inline-flex w-full items-center justify-center gap-1 rounded-[4px] px-4 py-3 text-sm font-semibold transition-colors sm:w-auto"
          style={{
            backgroundColor: "var(--color-info)",
            color: "#ffffff",
            minHeight: 44,
          }}
        >
          {next.label}
          <span className="material-symbols-outlined align-middle text-[18px]">arrow_forward</span>
        </Link>
      </div>
    </Card>
  );
}
