"use client";

// 2026-05-02: 프린트 옵션 다이얼로그 — 옛 page.tsx L1443~1644 풀 복원
// 이유: v2 의 단순 "박스스코어 프린트" 버튼 → 옛 풍부한 다이얼로그 (팀별 enabled + 누적/Q1~Q4/OT 체크) 복원.
// 사용자 요청: "기존에 구현했었던 기록 UI와 순서 그대로 복구. 프린트 기능 아직 안 보임".
//
// 동작:
// - 양 팀 enabled + 누적만 기본 체크
// - 사용자 선택 → onConfirm(opts) 호출 → 부모(game-result.tsx) 가 printOptions state 세팅
// - useEffect 가 setIsPrinting(true) → DOM 리렌더 → window.print()
// - afterprint 으로 다이얼로그 닫기 + state 초기화

import { useState } from "react";

// 옛 page.tsx L26-34 의 PrintOptions 타입 그대로 카피
export interface TeamPrintOption {
  enabled: boolean; // 이 팀을 프린트할지 여부
  total: boolean; // 누적 기록 페이지 포함 여부
  quarters: Record<string, boolean>; // "1"~"5" 키별 on/off
}
export interface PrintOptions {
  home: TeamPrintOption;
  away: TeamPrintOption;
}

export function PrintOptionsDialog({
  open,
  onClose,
  onConfirm,
  homeTeamName,
  awayTeamName,
  hasOT,
  hasQuarterEventDetail,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (opts: PrintOptions) => void;
  homeTeamName: string;
  awayTeamName: string;
  hasOT: boolean;
  hasQuarterEventDetail: boolean;
}) {
  // 옵션 state — 기본값은 양 팀 + 누적만 체크
  const [opts, setOpts] = useState<PrintOptions>(() => ({
    home: { enabled: true, total: true, quarters: {} },
    away: { enabled: true, total: true, quarters: {} },
  }));

  if (!open) return null;

  // 프린트 버튼 비활성 조건: 양 팀 모두 enabled=false (출력할 팀 없음)
  const nothingSelected = !opts.home.enabled && !opts.away.enabled;

  return (
    <div
      // 오버레이 클릭 시 닫힘 (stopPropagation 적용된 내부 모달은 제외)
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="rounded-lg shadow-xl max-w-md w-full mx-4 p-6"
        style={{
          backgroundColor: "var(--color-background)",
          border: "1px solid var(--color-border)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3
          className="text-lg font-semibold mb-4"
          style={{ color: "var(--color-text-primary)" }}
        >
          박스스코어 프린트 옵션
        </h3>

        {/* 홈팀 섹션 */}
        <TeamSection
          label={homeTeamName}
          opt={opts.home}
          onChange={(next) => setOpts({ ...opts, home: next })}
          hasOT={hasOT}
        />

        <div className="h-3" />

        {/* 원정팀 섹션 */}
        <TeamSection
          label={awayTeamName}
          opt={opts.away}
          onChange={(next) => setOpts({ ...opts, away: next })}
          hasOT={hasOT}
        />

        {/* 이벤트 없는 경기에서 쿼터 선택 시 주의 안내 */}
        {!hasQuarterEventDetail && (
          <p className="mt-3 text-xs" style={{ color: "var(--color-text-muted)" }}>
            이 경기는 실시간 이벤트 기록이 없어 쿼터별 세부 스탯이 &quot;-&quot;로 표시됩니다.
          </p>
        )}

        {/* 프린트 방향 안내 — Hancom PDF 등 가상 프린터는 @page CSS 무시 */}
        <div
          className="mt-3 p-2 rounded text-xs flex items-start gap-2"
          style={{
            backgroundColor: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text-secondary)",
          }}
        >
          <span
            className="material-symbols-outlined shrink-0"
            style={{ fontSize: "16px", color: "var(--color-primary)" }}
          >
            warning
          </span>
          <div className="space-y-1">
            <p
              className="font-semibold"
              style={{ color: "var(--color-text-primary)" }}
            >
              PDF 저장이 세로로 나올 때
            </p>
            <p>
              권장: 프린터를 <strong>&quot;PDF로 저장&quot;</strong>(Chrome 기본)으로
              선택하세요. Hancom PDF 등 외부 PDF 드라이버는 가로 설정을 무시합니다.
            </p>
            <p>
              또는 프린트 대화상자에서 <strong>인쇄 방향 → 가로</strong>로 직접 변경하세요.
            </p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded text-sm"
            style={{
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
              border: "1px solid var(--color-border)",
            }}
          >
            취소
          </button>
          <button
            onClick={() => onConfirm(opts)}
            disabled={nothingSelected}
            className="px-4 py-2 rounded text-sm font-semibold disabled:opacity-50"
            style={{
              backgroundColor: "var(--color-primary)",
              color: "#ffffff",
            }}
          >
            프린트
          </button>
        </div>
      </div>
    </div>
  );
}

/** 팀별 옵션 섹션: enabled 체크 + 누적/쿼터 체크박스 */
function TeamSection({
  label,
  opt,
  onChange,
  hasOT,
}: {
  label: string;
  opt: TeamPrintOption;
  onChange: (next: TeamPrintOption) => void;
  hasOT: boolean;
}) {
  // 쿼터 토글 — 현재 상태 반전
  const toggleQuarter = (q: string) => {
    const next = { ...opt.quarters, [q]: !opt.quarters[q] };
    onChange({ ...opt, quarters: next });
  };

  // 쿼터 버튼 목록 — OT 는 hasOT 일 때만 노출
  const quarterKeys = ["1", "2", "3", "4", ...(hasOT ? ["5"] : [])];

  return (
    <div className="rounded border p-3" style={{ borderColor: "var(--color-border)" }}>
      {/* 팀 enabled 체크 */}
      <label
        className="flex items-center gap-2 font-medium"
        style={{ color: "var(--color-text-primary)" }}
      >
        <input
          type="checkbox"
          checked={opt.enabled}
          onChange={(e) => onChange({ ...opt, enabled: e.target.checked })}
        />
        {label}
      </label>
      {/* enabled 일 때만 하위 옵션 노출 */}
      {opt.enabled && (
        <div className="mt-2 ml-5 flex flex-wrap gap-x-4 gap-y-1">
          <label
            className="flex items-center gap-1 text-sm"
            style={{ color: "var(--color-text-secondary)" }}
          >
            <input
              type="checkbox"
              checked={opt.total}
              onChange={(e) => onChange({ ...opt, total: e.target.checked })}
            />
            누적 기록
          </label>
          {quarterKeys.map((q) => (
            <label
              key={q}
              className="flex items-center gap-1 text-sm"
              style={{ color: "var(--color-text-secondary)" }}
            >
              <input
                type="checkbox"
                checked={!!opt.quarters[q]}
                onChange={() => toggleQuarter(q)}
              />
              {q === "5" ? "OT" : `${q}Q`}
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
