"use client";

/* ============================================================
 * ConditionsSection — BDR v2 신청 조건 카드 (시안 3번 카드)
 *
 * 왜 이 컴포넌트가 필요한가:
 * 시안은 6개 체크박스(초보 환영 / 레이팅 1400 이상 / 여성 우대 /
 * 학생 우대 / 자차 가능자 / 프로필 공개 필수)로 "신청 조건"을 받음.
 * DB에는 `requirements`라는 자유 텍스트 필드 1개만 있으므로,
 * 체크된 항목을 **줄바꿈으로 JOIN**해서 requirements에 저장.
 *
 * 재진입 시 기존 문자열에 알려진 키워드가 포함돼 있으면
 * 해당 체크박스를 자동 복원.
 * 기타 조건(키워드 외 텍스트)은 하단 "기타" 입력란에 그대로 노출.
 * ============================================================ */

import { useEffect, useState } from "react";
import type { GameType } from "./game-form";

// 시안 고정 체크박스 6개 — 순서 유지 (label = requirements에 저장될 실제 문자열)
export const CONDITION_OPTIONS = [
  "초보 환영",
  "레이팅 1400 이상",
  "여성 우대",
  "학생 우대",
  "자차 가능자",
  "프로필 공개 필수",
] as const;

type ConditionOption = (typeof CONDITION_OPTIONS)[number];

interface Props {
  // requirements 문자열 전체(체크박스 + 기타)
  value: string;
  onChange: (v: string) => void;
  // [Phase 2C-5] 신청 정책(BG5) + 게스트 옵션(BG3) 박제
  gameType: GameType;
  allowGuests: boolean; // 실연결 — games.allow_guests
  onAllowGuestsChange: (v: boolean) => void;
}

/**
 * requirements 문자열 → { checked: Set<체크박스>, extra: 기타 문자열 }
 * 줄바꿈으로 split 후 CONDITION_OPTIONS에 있는 줄은 체크박스,
 * 나머지는 "기타"로 간주.
 */
function parseRequirements(raw: string): { checked: Set<ConditionOption>; extra: string } {
  const checked = new Set<ConditionOption>();
  const extras: string[] = [];
  if (!raw) return { checked, extra: "" };

  // 줄바꿈 또는 쉼표로 split (기존 저장 데이터가 쉼표로 들어있을 수 있음)
  const tokens = raw.split(/\n|,/).map((t) => t.trim()).filter(Boolean);
  for (const t of tokens) {
    if ((CONDITION_OPTIONS as readonly string[]).includes(t)) {
      checked.add(t as ConditionOption);
    } else {
      extras.push(t);
    }
  }
  return { checked, extra: extras.join("\n") };
}

/** checked + extra → requirements 문자열(줄바꿈 JOIN) */
function buildRequirements(checked: Set<ConditionOption>, extra: string): string {
  // string[]로 유지해야 extra(자유 텍스트) push 가능
  const parts: string[] = CONDITION_OPTIONS.filter((opt) => checked.has(opt));
  const extraTrim = extra.trim();
  if (extraTrim) parts.push(extraTrim);
  return parts.join("\n");
}

export function ConditionsSection({
  value,
  onChange,
  gameType,
  allowGuests,
  onAllowGuestsChange,
}: Props) {
  // 최초 1회 value 파싱 → 로컬 상태로 분리 관리
  const [checked, setChecked] = useState<Set<ConditionOption>>(() => parseRequirements(value).checked);
  const [extra, setExtra] = useState<string>(() => parseRequirements(value).extra);

  // 체크박스 or 기타 텍스트 변경 시 상위 onChange 호출 (requirements 재합성)
  useEffect(() => {
    onChange(buildRequirements(checked, extra));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checked, extra]);

  // 외부에서 value가 바뀔 수 있음(예: 지난 경기 복사) — 재동기화
  useEffect(() => {
    const parsed = parseRequirements(value);
    setChecked(parsed.checked);
    setExtra(parsed.extra);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const toggle = (opt: ConditionOption) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  return (
    <section className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
      <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
        3. 신청 조건
      </h2>

      {/* 2열 체크박스 그리드 — 시안과 동일 */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: 10,
        }}
      >
        {CONDITION_OPTIONS.map((opt) => {
          const isChecked = checked.has(opt);
          return (
            <label
              key={opt}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 14px",
                background: "var(--bg-alt)",
                borderRadius: 6,
                cursor: "pointer",
                border: isChecked ? "1px solid var(--cafe-blue)" : "1px solid transparent",
              }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggle(opt)}
                style={{ cursor: "pointer" }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{opt}</span>
            </label>
          );
        })}
      </div>

      {/* 기타 조건 — 시안에 없지만 기존 자유 텍스트 입력 보존 */}
      <div style={{ marginTop: 14 }}>
        <label className="label">
          기타 조건 <span style={{ color: "var(--ink-dim)", fontWeight: 400 }}>(선택)</span>
        </label>
        <textarea
          className="textarea"
          rows={2}
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="예: 3점슈터 우대, 20~30대 선호"
          style={{ minHeight: 64, resize: "vertical" }}
        />
      </div>

      {/* ============================================================
       * [Phase 2C-5] 신청 정책(BG5) + 게스트 옵션(BG3) — 시안 CreateGame 3번 카드
       *
       * 데이터 처리 원칙(mock 금지):
       *  - BG3 게스트 허용 토글 = 실연결 (games.allow_guests 컬럼 존재)
       *  - BG5 자동 승인 토글 = DB 컬럼 없음 → disabled 시각 박제 (schema 변경 금지)
       *  - BG3 보조(최소 경력/약관) = 경기 생성 시점 저장 컬럼 없음 → disabled 시각 박제
       * ============================================================ */}
      <div
        style={{
          marginTop: 22,
          paddingTop: 18,
          borderTop: "1px solid var(--border)",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px",
            fontSize: 14,
            fontWeight: 700,
            color: "var(--ink)",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--ink-mute)" }}>
            tune
          </span>
          신청 정책 · 게스트 옵션
        </h3>

        {/* --- BG5: 자동 승인 토글 (disabled — DB 컬럼 없음) --- */}
        {/* 자동승인 정책 저장 컬럼이 games 모델에 없어 비활성 시각 박제.
         * 현재 운영은 별도 승인 단계 없이 신청을 처리하므로 'ON 고정'으로 표시. */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            background: "var(--bg-alt)",
            borderRadius: 6,
            marginBottom: 10,
            opacity: 0.6, // disabled 시각 신호
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
              자동 승인
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: "2px 7px",
                  borderRadius: 4,
                  background: "color-mix(in oklab, var(--ink-dim) 18%, transparent)",
                  color: "var(--ink-mute)",
                }}
              >
                준비 중
              </span>
            </p>
            <p style={{ fontSize: 11, color: "var(--ink-mute)", margin: "2px 0 0" }}>
              신청 즉시 참가 확정 — 호스트 수동 승인은 추후 지원 예정
            </p>
          </div>
          {/* 비활성 토글: aria-disabled + disabled 버튼. 클릭 동작 없음(no-op). */}
          <button
            type="button"
            role="switch"
            aria-checked={true}
            aria-disabled={true}
            disabled
            title="자동 승인 정책 설정은 추후 지원 예정입니다"
            style={{
              position: "relative",
              height: 24,
              width: 44,
              flexShrink: 0,
              borderRadius: 12,
              border: "none",
              cursor: "not-allowed",
              background: "var(--cafe-blue)", // ON 고정 표시
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 4,
                left: 24,
                height: 16,
                width: 16,
                borderRadius: "50%",
                background: "var(--bg-elev)",
              }}
            />
          </button>
        </div>

        {/* --- BG3: 게스트 신청 허용 토글 (실연결 — games.allow_guests) --- */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 14px",
            background: "var(--bg-alt)",
            borderRadius: 6,
            border: allowGuests ? "1px solid var(--cafe-blue)" : "1px solid transparent",
          }}
        >
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)", margin: 0 }}>게스트 신청 허용</p>
            <p style={{ fontSize: 11, color: "var(--ink-mute)", margin: "2px 0 0" }}>
              {gameType === "2"
                ? "팀 외부 게스트가 신청 가능"
                : "팀에 소속되지 않은 외부 게스트가 신청 가능"}
            </p>
          </div>
          {/* 실연결 토글 — allowGuests state ↔ allow_guests 컬럼 */}
          <button
            type="button"
            role="switch"
            aria-checked={allowGuests}
            onClick={() => onAllowGuestsChange(!allowGuests)}
            style={{
              position: "relative",
              height: 24,
              width: 44,
              flexShrink: 0,
              borderRadius: 12,
              border: "none",
              cursor: "pointer",
              background: allowGuests ? "var(--cafe-blue)" : "var(--ink-dim)",
              transition: "background .2s",
            }}
          >
            <span
              style={{
                position: "absolute",
                top: 4,
                left: allowGuests ? 24 : 4,
                height: 16,
                width: 16,
                borderRadius: "50%",
                background: "var(--bg-elev)",
                transition: "left .2s",
              }}
            />
          </button>
        </div>

        {/* --- BG3 보조: 게스트 ON 시 최소 경력 / 약관 (disabled — 생성 시점 저장 컬럼 없음) --- */}
        {/* game_applications.experience_years/accepted_terms 는 '신청자'가 신청 시점에 입력하는 값.
         * 경기 생성 시점에 '최소 경력 기준'을 저장할 컬럼이 없어 비활성 시각 박제. */}
        {allowGuests && (
          <div
            style={{
              marginTop: 10,
              padding: "12px 14px",
              borderRadius: 6,
              border: "1px dashed var(--border)",
              opacity: 0.6, // disabled 시각 신호
            }}
          >
            <p style={{ fontSize: 11.5, fontWeight: 700, color: "var(--ink-mute)", margin: "0 0 8px", display: "flex", alignItems: "center", gap: 6 }}>
              게스트 세부 조건
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  padding: "1px 6px",
                  borderRadius: 4,
                  background: "color-mix(in oklab, var(--ink-dim) 18%, transparent)",
                  color: "var(--ink-mute)",
                }}
              >
                준비 중
              </span>
            </p>
            {/* 최소 경력 chip — disabled */}
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              {["1년 이상", "2년 이상", "3년 이상", "무제한"].map((label, i) => (
                <button
                  key={label}
                  type="button"
                  disabled
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    padding: "5px 12px",
                    borderRadius: 4,
                    cursor: "not-allowed",
                    border: i === 1 ? "1px solid var(--cafe-blue)" : "1px solid var(--border)",
                    background: i === 1 ? "color-mix(in oklab, var(--cafe-blue) 12%, transparent)" : "var(--bg-alt)",
                    color: "var(--ink-mute)",
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11.5, color: "var(--ink-mute)", cursor: "not-allowed" }}>
              <input type="checkbox" defaultChecked disabled style={{ cursor: "not-allowed" }} />
              <span>약관 동의 필수 — 게스트 신청 시 약관 동의 체크 표시</span>
            </label>
            <p style={{ fontSize: 11, color: "var(--ink-dim)", margin: "8px 0 0" }}>
              최소 경력·약관 설정은 추후 지원 예정입니다.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
