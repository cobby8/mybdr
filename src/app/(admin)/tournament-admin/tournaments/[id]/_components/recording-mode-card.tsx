"use client";

/**
 * 2026-05-11 — Phase 1 tournament-admin "기록 모드 설정" 카드.
 *
 * 사용자 결재:
 *   §1 위치 = tournament-admin 대시보드 카드
 *   §2 정책 = (c) 하이브리드 (대회 default + 매치별 override)
 *   §3 라디오 3개 = all / new_only / exclude_in_progress
 *
 * 동작:
 *   1. 모드 토글 (Flutter / 종이) — 현재 default 강조 표시
 *   2. scope 라디오 3개 (영향 매치 범위)
 *   3. 사유 textarea (5자 이상 — server-side zod 와 동일)
 *   4. 적용 버튼 → confirm modal (영향 매치 수 미리보기) → POST /bulk
 *   5. 응답 후 toast + 페이지 새로고침 (router.refresh)
 *
 * 디자인 룰:
 *   - var(--color-*) 토큰만 (CLAUDE.md §디자인 핵심)
 *   - Material Symbols Outlined (lucide-react ❌)
 *   - 모바일/PC 동일 — Card 컴포넌트 + 토글 + 라디오
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";

type Mode = "flutter" | "paper";
type Scope = "all" | "new_only" | "exclude_in_progress";

interface Props {
  tournamentId: string;
  defaultMode: Mode;
  matchStats: {
    total: number;
    paper: number;
    flutter: number;
    inProgress: number;
  };
}

// 라디오 옵션 메타 — 사용자에게 노출할 카피 + scope 키
const SCOPE_OPTIONS: Array<{ value: Scope; label: string; desc: string }> = [
  {
    value: "all",
    label: "모든 매치 일괄 적용",
    desc: "모든 매치의 기록 모드를 선택한 값으로 변경합니다.",
  },
  {
    value: "new_only",
    label: "신규(미설정) 매치만 적용",
    desc: "운영자가 한번도 모드를 지정하지 않은 매치만 변경합니다.",
  },
  {
    value: "exclude_in_progress",
    label: "진행 중(in_progress) 매치 제외",
    desc: "라이브 진행 중 매치를 제외한 나머지 매치만 변경합니다.",
  },
];

// 모드 라벨 매핑 — Flutter 기록앱 / 종이 기록지(웹)
const MODE_LABEL: Record<Mode, string> = {
  flutter: "Flutter 기록앱",
  paper: "종이 기록지(웹)",
};

const MODE_ICON: Record<Mode, string> = {
  flutter: "videogame_asset",
  paper: "description",
};

export function RecordingModeCard({
  tournamentId,
  defaultMode,
  matchStats,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  // 사용자가 변경하려는 신규 모드 — 처음에는 현재 default 와 동일 표시
  const [selectedMode, setSelectedMode] = useState<Mode>(defaultMode);
  // 영향 범위 라디오 — 기본 "exclude_in_progress" (가장 안전)
  const [scope, setScope] = useState<Scope>("exclude_in_progress");
  // 사유 — 5자 이상 (server-side zod 동일 룰)
  const [reason, setReason] = useState("");
  // confirm modal 노출 여부
  const [confirmOpen, setConfirmOpen] = useState(false);
  // 결과/에러 메시지 (inline 표시 — toast 라이브러리 없이)
  const [resultMsg, setResultMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // 적용 버튼 클릭 — 사유 검증 후 confirm modal 열기
  const handleApplyClick = () => {
    setResultMsg(null);
    if (reason.trim().length < 5) {
      setResultMsg({
        type: "error",
        text: "변경 사유를 5자 이상 입력해주세요.",
      });
      return;
    }
    setConfirmOpen(true);
  };

  // confirm modal "변경 적용" 클릭 — 실제 POST 호출
  const handleConfirm = () => {
    setConfirmOpen(false);
    setResultMsg(null);
    startTransition(async () => {
      try {
        const res = await fetch(
          `/api/web/admin/tournaments/${tournamentId}/recording-mode/bulk`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              mode: selectedMode,
              scope,
              reason: reason.trim(),
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) {
          // 서버 에러 — error 키 (apiError 컨벤션 — string 또는 zod 첫 메시지)
          setResultMsg({
            type: "error",
            text:
              typeof data.error === "string"
                ? data.error
                : "모드 변경에 실패했습니다.",
          });
          return;
        }
        // 성공 — affected_count + mode 표시 (snake_case — apiSuccess 변환)
        setResultMsg({
          type: "success",
          text: `${data.affected_count}건 매치 모드 변경 완료 (${MODE_LABEL[data.mode as Mode]})`,
        });
        // 사유 초기화 (다음 변경 위해)
        setReason("");
        // 페이지 새로고침 — server-side stats 재계산
        router.refresh();
      } catch (err) {
        console.error("[RecordingModeCard] fetch failed:", err);
        setResultMsg({
          type: "error",
          text: "네트워크 오류로 모드 변경에 실패했습니다.",
        });
      }
    });
  };

  return (
    <Card className="mb-6">
      {/* 헤더 — 아이콘 + 타이틀 */}
      <div className="mb-3 flex items-center gap-2">
        <span
          className="material-symbols-outlined"
          style={{ color: "var(--color-primary)", fontSize: 22 }}
        >
          tune
        </span>
        <h3 className="font-bold text-base">기록 모드 설정</h3>
      </div>

      {/* 현재 상태 요약 — 대회 default + 매치별 통계 */}
      <div
        className="mb-4 rounded-[var(--radius-card)] border p-3 text-sm"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-elevated)",
        }}
      >
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span style={{ color: "var(--color-text-secondary)" }}>대회 기본:</span>
          <span className="font-semibold">{MODE_LABEL[defaultMode]}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          <span>총 {matchStats.total}건</span>
          <span>Flutter {matchStats.flutter}건</span>
          <span>종이 {matchStats.paper}건</span>
          {matchStats.inProgress > 0 && (
            <span style={{ color: "var(--color-primary)" }}>
              진행중 {matchStats.inProgress}건
            </span>
          )}
        </div>
      </div>

      {/* 모드 토글 — Flutter / 종이 2개 버튼 */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
          새 모드 선택
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(["flutter", "paper"] as Mode[]).map((m) => {
            const active = selectedMode === m;
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelectedMode(m)}
                className="flex items-center justify-center gap-2 rounded-[4px] border px-3 py-2 text-sm font-semibold transition-colors"
                style={{
                  borderColor: active ? "var(--color-primary)" : "var(--color-border)",
                  backgroundColor: active
                    ? "color-mix(in srgb, var(--color-primary) 12%, transparent)"
                    : "var(--color-card)",
                  color: active ? "var(--color-primary)" : "var(--color-text-primary)",
                }}
                aria-pressed={active}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  {MODE_ICON[m]}
                </span>
                {MODE_LABEL[m]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 영향 범위 라디오 — 3개 옵션 */}
      <div className="mb-4">
        <div className="mb-2 text-xs font-semibold" style={{ color: "var(--color-text-secondary)" }}>
          ⚠️ 적용 범위
        </div>
        <div className="space-y-2">
          {SCOPE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex cursor-pointer items-start gap-2 rounded-[4px] border p-2 text-sm transition-colors"
              style={{
                borderColor:
                  scope === opt.value
                    ? "var(--color-primary)"
                    : "var(--color-border)",
                backgroundColor:
                  scope === opt.value
                    ? "color-mix(in srgb, var(--color-primary) 6%, transparent)"
                    : "transparent",
              }}
            >
              <input
                type="radio"
                name="recording-mode-scope"
                value={opt.value}
                checked={scope === opt.value}
                onChange={() => setScope(opt.value)}
                className="mt-1"
              />
              <div>
                <div className="font-semibold">{opt.label}</div>
                <div className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                  {opt.desc}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* 사유 textarea — 5자 이상 (server-side zod) */}
      <div className="mb-4">
        <label
          className="mb-2 block text-xs font-semibold"
          style={{ color: "var(--color-text-secondary)" }}
          htmlFor="recording-mode-reason"
        >
          변경 사유 <span style={{ color: "var(--color-primary)" }}>*</span>
        </label>
        <textarea
          id="recording-mode-reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={2}
          maxLength={500}
          placeholder="예: 결승 매치 종이 기록지 운영 결정"
          className="w-full rounded-[4px] border p-2 text-sm"
          style={{
            borderColor: "var(--color-border)",
            backgroundColor: "var(--color-card)",
            color: "var(--color-text-primary)",
          }}
        />
        <div className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
          {reason.length} / 500자 (최소 5자)
        </div>
      </div>

      {/* 결과 메시지 (inline) */}
      {resultMsg && (
        <div
          className="mb-3 rounded-[4px] border p-2 text-sm"
          style={{
            borderColor:
              resultMsg.type === "success"
                ? "var(--color-success)"
                : "var(--color-primary)",
            backgroundColor:
              resultMsg.type === "success"
                ? "color-mix(in srgb, var(--color-success) 10%, transparent)"
                : "color-mix(in srgb, var(--color-primary) 10%, transparent)",
            color:
              resultMsg.type === "success"
                ? "var(--color-success)"
                : "var(--color-primary)",
          }}
        >
          {resultMsg.text}
        </div>
      )}

      {/* 적용 버튼 */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleApplyClick}
          disabled={pending}
          className="rounded-[4px] px-4 py-2 text-sm font-semibold transition-opacity"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#fff",
            opacity: pending ? 0.6 : 1,
          }}
        >
          {pending ? "처리 중..." : "모드 변경 적용"}
        </button>
      </div>

      {/* Confirm modal — 영향 매치 수 미리보기 */}
      {confirmOpen && (
        <ConfirmModal
          onCancel={() => setConfirmOpen(false)}
          onConfirm={handleConfirm}
          selectedMode={selectedMode}
          scope={scope}
          matchStats={matchStats}
        />
      )}
    </Card>
  );
}

// confirm modal — server-side 정확한 영향 매치 수는 모르지만 (settings JSON 분기 필요),
// scope 라디오 룰에 따라 client-side 미리보기 산출 (대략값 — 실제 affected_count 는 응답에서 확인)
function ConfirmModal({
  onCancel,
  onConfirm,
  selectedMode,
  scope,
  matchStats,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  selectedMode: Mode;
  scope: Scope;
  matchStats: Props["matchStats"];
}) {
  // 미리보기 산출 — scope 별 대략 영향 매치 수
  // (현재 mode 와 다른 매치만 변경 — 정확한 수는 server-side audit 박제 시 확정)
  const previewCount = (() => {
    if (scope === "all") return matchStats.total;
    if (scope === "exclude_in_progress") return matchStats.total - matchStats.inProgress;
    // new_only — 정확한 수는 server-side (settings 에 recording_mode 키 없는 매치만)
    // client-side 추산 = total - (이미 명시된 매치) — 보수적으로 total 표시
    return matchStats.total;
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-sm rounded-[var(--radius-card)] border p-5"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center gap-2">
          <span
            className="material-symbols-outlined"
            style={{ color: "var(--color-primary)", fontSize: 22 }}
          >
            warning
          </span>
          <h4 className="font-bold">모드 변경 확인</h4>
        </div>
        <p className="mb-4 text-sm" style={{ color: "var(--color-text-secondary)" }}>
          최대 <strong style={{ color: "var(--color-primary)" }}>{previewCount}건</strong>의 매치가{" "}
          <strong>{MODE_LABEL[selectedMode]}</strong> 모드로 변경됩니다.
          <br />
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            (이미 동일 모드 매치는 자동 skip — 실제 영향 매치 수는 응답에서 확인)
          </span>
        </p>
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-[4px] border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-primary)",
              backgroundColor: "var(--color-card)",
            }}
          >
            취소
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-[4px] px-3 py-2 text-sm font-semibold"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#fff",
            }}
          >
            변경 적용
          </button>
        </div>
      </div>
    </div>
  );
}
