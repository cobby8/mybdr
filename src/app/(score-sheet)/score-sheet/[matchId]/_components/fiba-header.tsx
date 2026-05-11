/**
 * FIBA SCORESHEET 상단 헤더 컴포넌트 (1/5 영역).
 *
 * 2026-05-11 — Phase 1 신규 (planner-architect §작업 3 / FIBA 양식 PDF 정합).
 *
 * 왜 (이유):
 *   FIBA 표준 양식 상단 = 대회/매치 메타 (자동) + 심판 3명 (입력). 본 컴포넌트는
 *   양식 1 페이지 A4 세로 의 상단 1/5 영역 박제. 운영자/기록원이 직관적으로
 *   "FIBA 양식 그대로" 인지하도록 ALL CAPS 라벨 + underscore (border-bottom)
 *   FIBA 양식 정합 디자인 적용.
 *
 * 방법 (어떻게):
 *   - 자동 fill (DB SELECT 결과 prop):
 *       Team A·B name / Competition (tournament.name) / Date·Time (match.scheduledAt)
 *       Game No (match.match_code) / Place (match.court_number)
 *   - 입력 (settings.officials JSON 박제 — Phase 5 BFF 확장 시 활용):
 *       Referee / Umpire 1 / Umpire 2
 *   - 로고: BDR 자체 로고 (`/images/logo.png`) 사용 — FIBA 로고 라이선스 회피
 *     + Material Symbols `sports_basketball` 보조 아이콘 표기
 *   - 디자인 토큰: var(--color-text-primary) / var(--color-border) / var(--color-surface)
 *
 * 절대 룰:
 *   - lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ — 강조는 var(--color-accent) 또는 var(--color-text-primary)
 *   - 입력 = border-bottom only (FIBA 양식 underscore 정합 — radius/background ❌)
 */

"use client";

import Image from "next/image";
import type { ChangeEvent } from "react";

export interface FibaHeaderInputs {
  referee: string;
  umpire1: string;
  umpire2: string;
}

interface FibaHeaderProps {
  // 자동 fill (server prop)
  teamAName: string;
  teamBName: string;
  competitionName: string;
  scheduledAtLabel: string | null; // "2026-05-11 14:00" 류
  gameNo: string | null; // match.match_code 또는 fallback match.id
  placeLabel: string | null; // court_number 또는 venue name
  // 입력 상태
  values: FibaHeaderInputs;
  onChange: (next: FibaHeaderInputs) => void;
  disabled?: boolean;
}

export function FibaHeader({
  teamAName,
  teamBName,
  competitionName,
  scheduledAtLabel,
  gameNo,
  placeLabel,
  values,
  onChange,
  disabled,
}: FibaHeaderProps) {
  // 단일 update 패턴 — values 전체 spread + key 갱신
  const update =
    (key: keyof FibaHeaderInputs) => (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...values, [key]: e.target.value });
    };

  // 날짜/시각 분리 표시 — "2026-05-11 14:00" → date "2026-05-11" / time "14:00"
  const { dateLabel, timeLabel } = splitDateTime(scheduledAtLabel);

  return (
    <section
      className="w-full px-4 py-3"
      style={{
        backgroundColor: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
      }}
    >
      {/* 로고 + 타이틀 박스 — FIBA 양식 정합 (상단 중앙) */}
      <div className="mb-3 flex items-center justify-center gap-3">
        <Image
          src="/images/logo.png"
          alt="BDR"
          width={40}
          height={20}
          className="h-5 w-auto"
        />
        <div className="text-center">
          <p
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Basketball Daily Routine
          </p>
          <h1
            className="text-base font-bold uppercase tracking-widest"
            style={{ color: "var(--color-text-primary)" }}
          >
            Scoresheet
          </h1>
        </div>
        <span
          className="material-symbols-outlined"
          style={{ fontSize: 28, color: "var(--color-text-muted)" }}
        >
          sports_basketball
        </span>
      </div>

      {/* Team A·B 명 — 양식 좌우 분할 (자동 fill / read-only) */}
      <div className="mb-3 grid grid-cols-2 gap-3">
        <FieldDisplay label="Team A" value={teamAName} />
        <FieldDisplay label="Team B" value={teamBName} />
      </div>

      {/* 대회 / 일자 / 시간 / Game No / Place — 자동 fill */}
      <div className="mb-3 grid grid-cols-2 gap-3 sm:grid-cols-5">
        <FieldDisplay label="Competition" value={competitionName} />
        <FieldDisplay label="Date" value={dateLabel ?? "—"} />
        <FieldDisplay label="Time" value={timeLabel ?? "—"} />
        <FieldDisplay label="Game No" value={gameNo ?? "—"} />
        <FieldDisplay label="Place" value={placeLabel ?? "—"} />
      </div>

      {/* 심판 3명 입력 — settings.officials JSON 박제 예정 (Phase 5) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <FieldInput
          label="Referee"
          value={values.referee}
          onChange={update("referee")}
          disabled={disabled}
        />
        <FieldInput
          label="Umpire 1"
          value={values.umpire1}
          onChange={update("umpire1")}
          disabled={disabled}
        />
        <FieldInput
          label="Umpire 2"
          value={values.umpire2}
          onChange={update("umpire2")}
          disabled={disabled}
        />
      </div>
    </section>
  );
}

/**
 * 자동 fill 표시 필드 — read-only.
 * FIBA 양식 underscore 정합 = label 작게 + value 밑 border-bottom.
 */
function FieldDisplay({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div
        className="text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </div>
      <div
        className="pb-0.5 pt-1 text-sm font-medium"
        style={{
          color: "var(--color-text-primary)",
          borderBottom: "1px solid var(--color-border)",
        }}
      >
        {value || "—"}
      </div>
    </div>
  );
}

/**
 * 입력 필드 — FIBA 양식 underscore (border-bottom only).
 */
function FieldInput({
  label,
  value,
  onChange,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}) {
  return (
    <label className="block">
      <span
        className="block text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
      <input
        type="text"
        value={value}
        onChange={onChange}
        disabled={disabled}
        maxLength={40}
        className="w-full bg-transparent pb-0.5 pt-1 text-sm focus:outline-none disabled:opacity-50"
        style={{
          color: "var(--color-text-primary)",
          borderBottom: "1px solid var(--color-border)",
        }}
        placeholder=""
      />
    </label>
  );
}

/**
 * "2026-05-11 14:00" → { dateLabel: "2026-05-11", timeLabel: "14:00" }.
 * 단순 split — 입력은 page.tsx 에서 toLocaleString 처리 후 전달됨.
 * 빈 입력 / "—" 등은 null 반환.
 */
export function splitDateTime(
  label: string | null
): { dateLabel: string | null; timeLabel: string | null } {
  if (!label || label === "—") {
    return { dateLabel: null, timeLabel: null };
  }
  // "2026. 05. 11. 14:00" 또는 "2026-05-11 14:00" 형식 — 마지막 공백 split
  const lastSpace = label.lastIndexOf(" ");
  if (lastSpace < 0) {
    return { dateLabel: label, timeLabel: null };
  }
  return {
    dateLabel: label.slice(0, lastSpace).trim(),
    timeLabel: label.slice(lastSpace + 1).trim(),
  };
}
