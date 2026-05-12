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
  // Phase 8 — frameless 모드. 단일 외곽 박스 안에 들어갈 때 자체 border 제거 (parent frame 가 시각적 외곽).
  frameless?: boolean;
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
  frameless,
}: FibaHeaderProps) {
  // 단일 update 패턴 — values 전체 spread + key 갱신
  const update =
    (key: keyof FibaHeaderInputs) => (e: ChangeEvent<HTMLInputElement>) => {
      onChange({ ...values, [key]: e.target.value });
    };

  // 날짜/시각 분리 표시 — "2026-05-11 14:00" → date "2026-05-11" / time "14:00"
  const { dateLabel, timeLabel } = splitDateTime(scheduledAtLabel);

  // Phase 8 — frameless 모드: 단일 외곽 박스(score-sheet-fiba-frame) 안에서 자체 border 제거.
  //   바깥 박스가 전체 frame 을 그리고, 본 헤더는 박스 내부 상단 영역으로만 동작.
  const sectionStyle: React.CSSProperties = frameless
    ? { backgroundColor: "transparent" }
    : {
        backgroundColor: "var(--color-surface)",
        border: "1px solid var(--color-border)",
      };
  // Phase 11 — 헤더 영역 ~8.5% (목표 ~95px) 압축. px-2 py-0.5 컴팩트 (Phase 9 py-1 → py-0.5).
  //   이유: Players 16행 (Phase 11) + 풋터 세로 4줄 (Phase 11) 흡수 위해 헤더도 추가 압축.
  const sectionClass = frameless
    ? "fiba-frameless w-full px-2 py-0.5"
    : "w-full px-4 py-3";

  return (
    // Phase 8 — FIBA PDF 1:1 정합 컴팩트 헤더:
    //   1줄: 로고 + Scoresheet 타이틀 (작게)
    //   2줄: Team A 라벨 + 팀명 line  /  Team B 라벨 + 팀명 line
    //   3줄: Competition  /  Date  /  Time  /  Referee  (4 라벨 한 줄)
    //   4줄: Game No  /  Place  /  Umpire 1  /  Umpire 2  (4 라벨 한 줄)
    //   → FIBA PDF 동일 레이아웃 (4 줄 컴팩트)
    <section className={sectionClass} style={sectionStyle}>
      {/* 1줄 — FIBA 로고 + SCORESHEET 타이틀 (FIBA PDF 정합 = 좌상 로고 + 우측 타이틀).
          Phase 11 §5-2 (2026-05-12) — 로고 24×12 → 30×15 / SCORESHEET 13px → 16px (FIBA 정합 / reviewer Minor).
          이유: FIBA 종이기록지 로고/타이틀이 더 큼 — 시인성 ↑. */}
      <div className="mb-0.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <Image
            src="/images/logo.png"
            alt="BDR"
            width={30}
            height={15}
            className="h-4 w-auto"
          />
          <span
            className="text-[8px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Basketball Daily Routine
          </span>
        </div>
        <h1
          className="text-[16px] font-bold uppercase tracking-widest"
          style={{ color: "var(--color-text-primary)" }}
        >
          SCORESHEET
        </h1>
      </div>

      {/* 2줄 — Team A 라벨 + 팀명 (한 줄)  /  Team B 라벨 + 팀명 (한 줄).
          FIBA PDF 정합 = 좌우 횡 배치 (각 50% 폭). */}
      <div className="grid grid-cols-2 gap-2">
        <InlineFieldDisplay label="Team A" value={teamAName} bold />
        <InlineFieldDisplay label="Team B" value={teamBName} bold />
      </div>

      {/* 3줄 — Competition / Date / Time / Referee 한 줄 (FIBA PDF 정합).
          Phase 9 — 모바일 = 2x2 / sm 이상 = 4 컬럼 인라인. gap-y 0 (압축) */}
      <div className="mt-0.5 grid grid-cols-2 gap-x-2 gap-y-0 sm:grid-cols-4">
        <InlineFieldDisplay label="Competition" value={competitionName} />
        <InlineFieldDisplay label="Date" value={dateLabel ?? "—"} />
        <InlineFieldDisplay label="Time" value={timeLabel ?? "—"} />
        <InlineFieldInput
          label="Referee"
          value={values.referee}
          onChange={update("referee")}
          disabled={disabled}
        />
      </div>

      {/* 4줄 — Game No / Place / Umpire 1 / Umpire 2 한 줄 (FIBA PDF 정합) */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-0 sm:grid-cols-4">
        <InlineFieldDisplay label="Game No" value={gameNo ?? "—"} />
        <InlineFieldDisplay label="Place" value={placeLabel ?? "—"} />
        <InlineFieldInput
          label="Umpire 1"
          value={values.umpire1}
          onChange={update("umpire1")}
          disabled={disabled}
        />
        <InlineFieldInput
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
 * Phase 8 — 한 줄 컴팩트 필드 (라벨 + underscore + 값).
 *
 * 이유: FIBA PDF 정합 = "Competition: ___slow___" 같이 라벨과 값이 한 줄에 인라인 표시.
 *   라벨 = 작은 글자 / 값 밑 border-bottom underscore.
 */
function InlineFieldDisplay({
  label,
  value,
  bold,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-baseline gap-1.5 overflow-hidden">
      <span
        className="shrink-0 text-[10px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
      <span
        className={`min-w-0 flex-1 truncate pb-0 ${bold ? "text-sm font-semibold" : "text-xs"}`}
        style={{
          color: "var(--color-text-primary)",
          borderBottom: "1px solid var(--color-text-primary)",
        }}
        title={value || "—"}
      >
        {value || "—"}
      </span>
    </div>
  );
}

/**
 * Phase 8 — 한 줄 컴팩트 입력 (라벨 + underscore input).
 *
 * FIBA PDF 정합 = "Referee: _____input_____" 같이 라벨과 입력 인라인.
 */
function InlineFieldInput({
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
    <label className="flex items-baseline gap-1.5 overflow-hidden">
      <span
        className="shrink-0 text-[10px] font-semibold uppercase tracking-wider"
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
        className="min-w-0 flex-1 bg-transparent pb-0 text-xs focus:outline-none disabled:opacity-50"
        style={{
          color: "var(--color-text-primary)",
          borderBottom: "1px solid var(--color-text-primary)",
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
