"use client";

import { useState, useEffect } from "react";

// 경기시간 프리셋 빌더
// "7분 4쿼터 논스탑" 같은 문자열을 pill 버튼 조합으로 생성

// pill 버튼 스타일 (선택/미선택)
const pillCls = (active: boolean) =>
  `rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
    active
      ? "bg-[var(--color-accent)] text-[var(--color-on-accent)]"
      : "bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-active)]"
  }`;

// 쿼터 방식 옵션
const PERIOD_OPTIONS = [
  { value: "4Q", label: "4쿼터" },
  { value: "2H", label: "전후반" },
];

// 시간(분) 옵션 — 2026-05-15 사용자 요청: 6분 추가 (5/6/7/8/10/12)
export const TIME_OPTIONS = [5, 6, 7, 8, 10, 12] as const;
// 분 직접 입력 시 허용 범위 (방어 — 0/음수/60+ 차단)
export const MIN_GAME_MINUTES = 1;
export const MAX_GAME_MINUTES = 60;

// 데드타임 옵션
const DEAD_OPTIONS = [
  { value: "nonstop", label: "논스탑" },
  { value: "alldead", label: "올데드" },
];

// 외부에서 받은 value 문자열을 pill state 로 역파싱
// 형식: "<숫자>분 (4쿼터|전후반) (논스탑|올데드)"
// 매칭 실패 시 null 반환 → 호출부에서 직접입력(isCustom) 모드로 전환
// (이유: 사용자가 옛 데이터 / 수동 입력값을 가졌을 때 강제 프리셋 덮어쓰기 차단)
export function parseGameTime(
  value: string,
): { period: string; minutes: number; dead: string } | null {
  const m = value.match(/^(\d+)분\s+(4쿼터|전후반)\s+(논스탑|올데드)$/);
  if (!m) return null;
  return {
    minutes: Number(m[1]),
    period: m[2] === "4쿼터" ? "4Q" : "2H",
    dead: m[3] === "논스탑" ? "nonstop" : "alldead",
  };
}

interface Props {
  value: string;
  onChange: (v: string) => void;
}

export function GameTimeInput({ value, onChange }: Props) {
  // 마운트 시 value 를 역파싱 — 저장된 값이 있으면 그 값으로 state 초기화
  // (이유: 기존 코드는 무조건 "7분 4쿼터 논스탑" 으로 덮어써서 사용자 DB 값을 파괴 — P0 fix)
  const parsed = parseGameTime(value);

  // 커스텀 입력 모드 — value 가 정규식 매칭 안 되면 자동 진입 (옛 데이터 보호)
  const [isCustom, setIsCustom] = useState(value !== "" && !parsed);
  // pill 선택 상태 — parsed 가 있으면 그 값, 없으면 기본값(4Q/7분/논스탑)
  const [period, setPeriod] = useState(parsed?.period ?? "4Q");
  const [minutes, setMinutes] = useState(parsed?.minutes ?? 7);
  const [dead, setDead] = useState(parsed?.dead ?? "nonstop");

  // pill 조합으로 결과 문자열 생성
  useEffect(() => {
    if (isCustom) return; // 커스텀 모드면 pill 변경 무시
    const periodLabel = period === "4Q" ? "4쿼터" : "전후반";
    const deadLabel = dead === "nonstop" ? "논스탑" : "올데드";
    const next = `${minutes}분 ${periodLabel} ${deadLabel}`;
    // 동일한 값이면 onChange 호출 회피 — 마운트 직후 부모 state 덮어쓰기 차단 (P0 핵심)
    if (next === value) return;
    onChange(next);
  }, [period, minutes, dead, isCustom, onChange, value]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--color-text-secondary)]">
          <span className="material-symbols-outlined align-middle text-base mr-1">timer</span>
          경기시간
        </label>
        {/* 커스텀 입력 토글 */}
        <button
          type="button"
          onClick={() => setIsCustom(!isCustom)}
          className="text-xs text-[var(--color-accent)] hover:underline"
        >
          {isCustom ? "프리셋 선택" : "직접 입력"}
        </button>
      </div>

      {isCustom ? (
        // 직접 입력 모드
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="예: 10분 4쿼터 올데드"
          className="w-full rounded-[16px] border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50"
        />
      ) : (
        <div className="space-y-2">
          {/* 쿼터 방식 선택 */}
          <div className="flex gap-2">
            {PERIOD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPeriod(opt.value)}
                className={pillCls(period === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 시간(분) 선택 — 프리셋 6종 + 직접 입력 (2026-05-15 사용자 요청) */}
          <div className="flex flex-wrap items-center gap-2">
            {TIME_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setMinutes(t)}
                className={pillCls(minutes === t)}
              >
                {t}분
              </button>
            ))}
            {/* 분 직접 입력 — TIME_OPTIONS 외 값 (예: 9분, 11분, 15분) 자유 입력 */}
            <div
              className={`flex items-center gap-1 rounded-[4px] border px-2 py-1 ${
                !TIME_OPTIONS.includes(minutes as typeof TIME_OPTIONS[number])
                  ? "border-[var(--color-accent)] bg-[color-mix(in_srgb,var(--color-accent)_10%,transparent)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)]"
              }`}
            >
              <input
                type="number"
                min={MIN_GAME_MINUTES}
                max={MAX_GAME_MINUTES}
                value={minutes}
                onChange={(e) => {
                  // 빈 칸/NaN 방어 — 사용자가 지우는 중간 단계는 임시 통과 (blur 시 clamp)
                  const raw = e.target.value;
                  if (raw === "") return; // 빈 칸은 onChange 무시 (input 자체는 빈 상태 표시)
                  const num = Number(raw);
                  if (Number.isNaN(num)) return;
                  // 범위 clamp — 음수/0/60 초과 차단
                  const clamped = Math.max(MIN_GAME_MINUTES, Math.min(MAX_GAME_MINUTES, Math.floor(num)));
                  setMinutes(clamped);
                }}
                className="w-12 bg-transparent text-center text-sm font-medium text-[var(--color-text-primary)] focus:outline-none"
                aria-label="분 직접 입력"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">분</span>
            </div>
          </div>

          {/* 데드타임 선택 */}
          <div className="flex gap-2">
            {DEAD_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setDead(opt.value)}
                className={pillCls(dead === opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 현재 결과 표시 */}
          <p className="text-xs text-[var(--color-text-muted)]">
            결과: <span className="font-medium text-[var(--color-text-primary)]">{value || "미설정"}</span>
          </p>
        </div>
      )}
    </div>
  );
}
