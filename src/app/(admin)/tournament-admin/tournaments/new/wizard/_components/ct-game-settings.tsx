"use client";

// =====================================================================
// ct-game-settings.tsx — 경기 설정 카드 (기록앱 정합 · Phase 4 B-3)
//   박제 source: _deliver_CreateTournament/ct-game-settings.jsx
//
//   ⚠ 왜 이렇게 짰나:
//   - controlled component: 부모(메인 폼)가 GameRules 객체를 소유하고
//     value/onChange 로만 주고받는다. 자체 state 0 (UniformModal 의 임시 hex 만 로컬).
//   - GAME_SETTINGS_DEFAULTS 정본을 "이 파일에서 export" — 통합 시 메인 폼이 import.
//   - shotClock = boolean (시안·B-2·B-1 game_rules jsonb 1:1 정합. PM 승인).
//   - 유니폼 hex 는 도메인 데이터(저지색) → DS 토큰 예외(하드코딩 허용 · 기록앱 동일 규칙).
//   - 그 외 색/여백은 inline var(--*) 토큰. toss-admin.css 편집 0 (재사용 .ct-* 만 참조).
// =====================================================================

import React from "react";
import { Icon, Btn, Badge, Modal } from "@/components/admin-toss";
import {
  GAME_RULE_DEFAULTS,
  GAME_RULE_PRESETS,
  applyGameRuleClockMode,
  applyGameRulePreset,
  type GameRulePreset,
  type TournamentGameRules,
} from "@/lib/tournaments/game-rules";

// ── GameRules 계약 (camelCase · B-1 game_rules jsonb 1:1) ────────────────
export type GameRules = TournamentGameRules;

// ── 경기 설정 기본값 (정본 export) — 통합 시 메인 폼이 import 해 일원화 ───
//   값 출처: game_rules.dart GameRules.defaults (유니폼만 의뢰 디폴트).
export const GAME_SETTINGS_DEFAULTS: GameRules = GAME_RULE_DEFAULTS;

const LIGHT_UNIFORM_COLOR = "#FFFFFF";
const DARK_UNIFORM_COLOR = "#1A1E27";

// ── 유니폼 16색 팔레트 (기록앱 showUniformPalette 큐레이션과 동일) ───────
//   [이름, hex]. 도메인 저지색 → hex 직접 사용 = 기록앱 승인 예외.
const UNIFORM_PALETTE: [string, string][] = [
  ["화이트", "#FFFFFF"], ["레드", "#E31B23"], ["블루", "#0F5FCC"], ["네이비", "#1B2A4A"],
  ["블랙", "#1A1E27"], ["그린", "#1CA05E"], ["옐로", "#E8A33B"], ["오렌지", "#E8821B"],
  ["퍼플", "#6D3AD1"], ["스카이", "#3DA9E0"], ["민트", "#19C3A6"], ["핑크", "#E85FA0"],
  ["그레이", "#8A93A0"], ["마룬", "#7A1620"], ["틸", "#0E7C86"], ["골드", "#C9A227"],
];

// 경기 시간 프리셋. 논스톱/올데드는 별도 운영 방식 축에서 조합한다.
const GAME_PRESETS = GAME_RULE_PRESETS;

// ── 휘도 유틸 (기록앱 1:1) ───────────────────────────────────────────────
function lum(hex: string): number {
  const s = (hex || "#000").replace("#", "");
  const n = s.length === 3 ? s.split("").map((c) => c + c).join("") : s;
  const r = parseInt(n.slice(0, 2), 16) || 0;
  const g = parseInt(n.slice(2, 4), 16) || 0;
  const b = parseInt(n.slice(4, 6), 16) || 0;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}
// 휘도 기반 대비 잉크 (밝으면 어두운 잉크, 어두우면 흰 잉크)
const jerseyInk = (hex: string) => (lum(hex) > 165 ? "var(--ink)" : "#fff");
const toneOf = (hex: string) => (lum(hex) > 165 ? "밝은색" : "어두운색");
function hexName(hex: string): string {
  const up = (hex || "").toUpperCase();
  const f = UNIFORM_PALETTE.find((e) => e[1].toUpperCase() === up);
  return f ? f[0] : "사용자 지정";
}

// ── 공통 소품 ────────────────────────────────────────────────────────────
function CardHead({ icon, title, action }: { icon: string; title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
      <span className="ct-headicon">
        <Icon name={icon} size={18} color="var(--primary)" />
      </span>
      <span style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)", letterSpacing: "-0.02em" }}>{title}</span>
      {action && <span style={{ marginLeft: "auto" }}>{action}</span>}
    </div>
  );
}

// 소제목 (유니폼 / 경기 방식 / 파울·타임아웃 구분)
function Subhead({ icon, label, hint }: { icon: string; label: string; hint?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 7, margin: "12px 0 8px", fontSize: 12.5, fontWeight: 800, color: "var(--ink-soft)" }}>
      <Icon name={icon} size={15} color="var(--ink-mute)" />
      <span>{label}</span>
      {hint && <span style={{ marginLeft: "auto", fontSize: 11.5, fontWeight: 600, color: "var(--ink-dim)" }}>{hint}</span>}
    </div>
  );
}

// 스텝퍼 (숫자 증감) — 재사용 .ct-stepper 클래스
function Stepper({ value, unit, min, max, step = 1, onChange }: { value: number; unit: string; min: number; max: number; step?: number; onChange: (v: number) => void }) {
  return (
    <div className="ct-stepper">
      <button type="button" disabled={value <= min} onClick={() => onChange(Math.max(min, value - step))} aria-label="감소">
        <Icon name="minus" size={17} />
      </button>
      <span className="ct-stepper__val">
        {value}
        <span className="u">{unit}</span>
      </span>
      <button type="button" disabled={value >= max} onClick={() => onChange(Math.min(max, value + step))} aria-label="증가">
        <Icon name="plus" size={17} />
      </button>
    </div>
  );
}

// 작은 세그먼트 토글 — 재사용 .ct-segsm 클래스
function SegSm({ options, index, onSelect }: { options: string[]; index: number; onSelect: (i: number) => void }) {
  return (
    <div className="ct-segsm">
      {options.map((o, i) => (
        <button key={o} type="button" data-active={i === index ? "true" : "false"} onClick={() => onSelect(i)}>
          {o}
        </button>
      ))}
    </div>
  );
}

// 설정 행 (좌: 이름·힌트 / 우: 컨트롤) — inline 스타일(우측 전용)
function SetRow({ name, hint, control }: { name: string; hint?: string; control: React.ReactNode }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{name}</div>
        {hint && <div style={{ fontSize: 11.5, color: "var(--ink-mute)", marginTop: 2 }}>{hint}</div>}
      </div>
      {control}
    </div>
  );
}

function RuleDetails({
  icon,
  title,
  summary,
  children,
}: {
  icon: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <details className="ct-rule-details">
      <summary>
        <span className="ct-rule-details__title">
          <Icon name={icon} size={15} color="var(--ink-mute)" />
          {title}
        </span>
        <span className="ct-rule-details__summary">{summary}</span>
      </summary>
      {children}
    </details>
  );
}

// ── 유니폼 16색 선택 모달 (기록앱 showUniformPalette) ────────────────────
function UniformModal({ open, side, current, onClose, onPick }: { open: boolean; side: string; current: string; onClose: () => void; onPick: (hex: string) => void }) {
  const [hex, setHex] = React.useState(current || "#FFFFFF");
  React.useEffect(() => {
    if (open) setHex(current || "#FFFFFF");
  }, [open, current]);
  const valid = /^#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(hex.trim());
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`${side} 유니폼 색상`}
      sub="대회·팀 세팅 기본값입니다. 16색에서 고르거나 직접 입력하세요."
      foot={
        <>
          <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>
            취소
          </Btn>
          <Btn disabled={!valid} icon="check" style={{ flex: 2, opacity: valid ? 1 : 0.5 }} onClick={() => valid && onPick(hex.trim().toUpperCase())}>
            이 색으로 적용
          </Btn>
        </>
      }
    >
      {/* 16색 스와치 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 8 }}>
        {UNIFORM_PALETTE.map(([nm, hx]) => (
          <button
            key={hx}
            type="button"
            title={`${nm} ${hx}`}
            onClick={() => setHex(hx)}
            style={{
              aspectRatio: "1/1",
              borderRadius: 10,
              background: hx,
              border: hex.toUpperCase() === hx.toUpperCase() ? "2px solid var(--primary)" : "1px solid var(--border-strong)",
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
            }}
          >
            {hex.toUpperCase() === hx.toUpperCase() && <Icon name="check" size={18} color={jerseyInk(hx)} />}
          </button>
        ))}
      </div>
      {/* 직접 입력 (HEX) */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16 }}>
        <span style={{ width: 42, height: 42, borderRadius: 10, background: valid ? hex : "var(--grey-100)", border: "2px solid var(--border-strong)", flex: "0 0 auto" }} />
        <div style={{ flex: 1 }}>
          <div className="ts-field__label" style={{ marginBottom: 4 }}>
            직접 입력
          </div>
          <input
            className="ts-input"
            value={hex}
            onChange={(e) => setHex(e.target.value)}
            placeholder="#1B3C87"
            spellCheck={false}
            style={!valid && hex ? { boxShadow: "0 0 0 2px var(--danger)" } : undefined}
            onKeyDown={(e) => {
              // 한글 IME 가드 (hex 입력엔 한글 없지만 일관성 — 룰)
              if (e.nativeEvent.isComposing) return;
              if (e.key === "Enter") {
                e.preventDefault();
                if (valid) onPick(hex.trim().toUpperCase());
              }
            }}
          />
        </div>
        <div style={{ textAlign: "right", minWidth: 78 }}>
          <div style={{ fontSize: 13, fontWeight: 800, color: "var(--ink)" }}>{hexName(hex)}</div>
          <div style={{ fontSize: 11, fontFamily: "var(--ff-mono)", color: "var(--ink-mute)" }}>{(hex || "").toUpperCase()}</div>
        </div>
      </div>
    </Modal>
  );
}

// ── 유니폼 셀 (홈/원정) ─────────────────────────────────────────────────
function UniformCell({ team, hex, label, onClick }: { team: string; hex: string; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 12px",
        background: "var(--grey-50)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        cursor: "pointer",
        textAlign: "left",
        fontFamily: "var(--ff)",
      }}
    >
      {/* 색 미리보기 칩 */}
      <span style={{ width: 30, height: 30, borderRadius: 9, background: hex, border: "2px solid var(--border-strong)", flex: "0 0 auto" }} />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--ink-mute)" }}>{label}</span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{team}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-dim)" }}>{toneOf(hex)}</span>
      </span>
    </button>
  );
}

function UniformRuleCell({ label, tone, hex }: { label: string; tone: "밝은색" | "어두운색"; hex: string }) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "12px",
        background: "var(--grey-50)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        fontFamily: "var(--ff)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          width: 30,
          height: 30,
          borderRadius: 9,
          background: hex,
          border: "2px solid var(--border-strong)",
          flex: "0 0 auto",
        }}
      />
      <span style={{ flex: 1, minWidth: 0 }}>
        <span style={{ display: "block", fontSize: 11.5, fontWeight: 700, color: "var(--ink-mute)" }}>{label}</span>
        <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>{tone}</span>
        <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-dim)" }}>유니폼 규칙</span>
      </span>
    </div>
  );
}

// =====================================================================
// 본체 (controlled) — props: { value: GameRules; onChange }
// =====================================================================
export function CtGameSettings({
  value,
  onChange,
  homeName = "홈팀",
  awayName = "원정팀",
}: {
  value: GameRules;
  onChange: (next: GameRules) => void;
  homeName?: string;
  awayName?: string;
}) {
  const d = value;
  // 단일 키 수정
  const set = <K extends keyof GameRules>(k: K, v: GameRules[K]) => onChange({ ...d, [k]: v });
  // 여러 키 동시 수정 (프리셋·색 교체)
  const setMany = (patch: Partial<GameRules>) => onChange({ ...d, ...patch });

  // 어느 유니폼 셀을 편집 중인지 ("home" | "away" | null)
  const activePreset = (p: GameRulePreset) =>
    d.quarterType === p.quarterType &&
    d.quarterMinutes === p.quarterMinutes;

  const homeColor = (d.homeColor || "").toUpperCase();
  const awayColor = (d.awayColor || "").toUpperCase();
  const isCanonicalUniform =
    (homeColor === LIGHT_UNIFORM_COLOR && awayColor === DARK_UNIFORM_COLOR) ||
    (homeColor === DARK_UNIFORM_COLOR && awayColor === LIGHT_UNIFORM_COLOR);
  const isSwappedUniform = homeColor === DARK_UNIFORM_COLOR && awayColor === LIGHT_UNIFORM_COLOR;
  const homeTone = isSwappedUniform ? "어두운색" : "밝은색";
  const awayTone = isSwappedUniform ? "밝은색" : "어두운색";

  React.useEffect(() => {
    if (!isCanonicalUniform) {
      setMany({ homeColor: LIGHT_UNIFORM_COLOR, awayColor: DARK_UNIFORM_COLOR });
    }
  }, [isCanonicalUniform]);

  const swapUniformRule = () => {
    setMany(
      isSwappedUniform
        ? { homeColor: LIGHT_UNIFORM_COLOR, awayColor: DARK_UNIFORM_COLOR }
        : { homeColor: DARK_UNIFORM_COLOR, awayColor: LIGHT_UNIFORM_COLOR },
    );
  };

  return (
    <section className="ts-card ct-game-rules-card">
      <CardHead icon="sliders-horizontal" title="경기 설정" action={<Badge tone="primary">기록앱 정합</Badge>} />

      <div className="ct-rule-topgrid">
        <div>
          {/* ── 유니폼 규칙 ── */}
          <Subhead icon="shirt" label="유니폼 규칙" hint="홈 밝은색 · 원정 어두운색" />
          <div style={{ display: "flex", gap: 10 }}>
            <UniformRuleCell label="홈" tone={homeTone} hex={isSwappedUniform ? DARK_UNIFORM_COLOR : LIGHT_UNIFORM_COLOR} />
            <UniformRuleCell label="원정" tone={awayTone} hex={isSwappedUniform ? LIGHT_UNIFORM_COLOR : DARK_UNIFORM_COLOR} />
          </div>
          {/* 홈·원정 색 교체 */}
          <button
            type="button"
            onClick={swapUniformRule}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              marginTop: 8,
              padding: "7px 11px",
              background: "var(--grey-100)",
              border: 0,
              borderRadius: 10,
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--ink-soft)",
              fontFamily: "var(--ff)",
              cursor: "pointer",
            }}
          >
            <Icon name="arrow-left-right" size={16} />홈 · 원정 색 교체
          </button>
          {/* 조끼 제공 체크 */}
          <label style={{ display: "flex", alignItems: "flex-start", gap: 10, marginTop: 9, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={d.vestProvided}
              onChange={(e) => set("vestProvided", e.target.checked)}
              style={{ marginTop: 2, width: 18, height: 18, accentColor: "var(--primary)", cursor: "pointer", flex: "0 0 auto" }}
            />
            <span>
              <span style={{ display: "block", fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>팀 조끼(번호 조끼) 제공</span>
              <span style={{ display: "block", fontSize: 11.5, color: "var(--ink-mute)", marginTop: 1 }}>주최 측이 조끼를 지급하는 경우 선택</span>
            </span>
          </label>
        </div>

        <div>
          {/* ── 경기 방식 ── */}
          <Subhead icon="clock" label="경기 구성" hint="시간 · 쿼터" />
          {/* 프리셋 칩 */}
          <div className="ct-preset-grid">
            {GAME_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                className="ts-chip"
                data-active={activePreset(p) ? "true" : "false"}
                onClick={() => onChange(applyGameRulePreset(d, p))}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="ct-rulegrid">
        <SetRow
          name="운영 방식"
          hint="논스톱=계속 진행 · 올데드=시계 정지"
          control={
            <SegSm
              options={["논스톱", "올데드"]}
              index={d.clockMode === "nonstop" ? 0 : 1}
              onSelect={(i) =>
                onChange(applyGameRuleClockMode(d, i === 0 ? "nonstop" : "dead"))
              }
            />
          }
        />
        <SetRow
          name="쿼터 수"
          hint="정규 쿼터 구성"
          control={
            <SegSm
              options={["4쿼터", "전후반"]}
              index={d.quarterType === "HALF" ? 1 : 0}
              onSelect={(i) =>
                onChange(
                  applyGameRulePreset(d, {
                    label: "",
                    quarterType: i === 1 ? "HALF" : "4Q",
                    quarterMinutes: d.quarterMinutes,
                    firstHalfTimeouts: d.firstHalfTimeouts,
                    secondHalfTimeouts: d.secondHalfTimeouts,
                  }),
                )
              }
            />
          }
        />
        <SetRow
          name="쿼터 시간"
          hint="분 / 쿼터"
          control={
            <Stepper
              value={d.quarterMinutes}
              unit="분"
              min={1}
              max={20}
              onChange={(v) =>
                onChange(
                  applyGameRulePreset(d, {
                    label: "",
                    quarterType: d.quarterType,
                    quarterMinutes: v,
                    firstHalfTimeouts: d.firstHalfTimeouts,
                    secondHalfTimeouts: d.secondHalfTimeouts,
                  }),
                )
              }
            />
          }
        />
        <SetRow name="연장 시간" hint="분 / 연장" control={<Stepper value={d.overtimeMinutes} unit="분" min={1} max={20} onChange={(v) => set("overtimeMinutes", v)} />} />
        <SetRow name="막판 득점 정지" hint="올데드에서만 적용" control={<Stepper value={d.lastScoreStopMin} unit="분" min={0} max={2} onChange={(v) => set("lastScoreStopMin", v)} />} />
        <SetRow name="샷클락" hint="24초 · 리바운드 14초" control={<SegSm options={["사용", "미사용"]} index={d.shotClockEnabled ? 0 : 1} onSelect={(i) => set("shotClockEnabled", i === 0)} />} />
      </div>

      <RuleDetails
        icon="flag"
        title="파울 · 타임아웃"
        summary={`개인 ${d.foulLimit} · 팀 ${d.teamFoulBonus} · 타임아웃 ${d.firstHalfTimeouts}/${d.secondHalfTimeouts}`}
      >
        <div className="ct-rulegrid">
        <SetRow name="개인 파울 한도" hint="초과 시 강제 교체" control={<Stepper value={d.foulLimit} unit="파울" min={4} max={6} onChange={(v) => set("foulLimit", v)} />} />
        <SetRow name="팀파울 보너스" hint="쿼터당 · 초과 시 자유투" control={<Stepper value={d.teamFoulBonus} unit="파울" min={3} max={7} onChange={(v) => set("teamFoulBonus", v)} />} />
        <SetRow name="타임아웃 · 전반" hint="1·2쿼터 합산" control={<Stepper value={d.firstHalfTimeouts} unit="회" min={0} max={4} onChange={(v) => set("firstHalfTimeouts", v)} />} />
        <SetRow name="타임아웃 · 후반" hint="3·4쿼터 합산" control={<Stepper value={d.secondHalfTimeouts} unit="회" min={0} max={4} onChange={(v) => set("secondHalfTimeouts", v)} />} />
        <SetRow name="타임아웃 시간" hint="1회당 · 기본 30초" control={<Stepper value={d.timeoutDurationSeconds} unit="초" min={30} max={90} step={10} onChange={(v) => set("timeoutDurationSeconds", v)} />} />
        </div>
      </RuleDetails>

      <RuleDetails
        icon="timer"
        title="휴식 시간"
        summary={`쿼터 ${d.shortBreakDurationSeconds}초 · 하프 ${d.halftimeDurationSeconds}초`}
      >
        <div className="ct-rulegrid">
        <SetRow name="쿼터 사이" hint="1·3쿼터 후" control={<Stepper value={d.shortBreakDurationSeconds} unit="초" min={0} max={600} step={30} onChange={(v) => set("shortBreakDurationSeconds", v)} />} />
        <SetRow name="하프타임" hint="2쿼터 후" control={<Stepper value={d.halftimeDurationSeconds} unit="초" min={0} max={900} step={30} onChange={(v) => set("halftimeDurationSeconds", v)} />} />
        <SetRow name="연장 전 휴식" hint="연장 시작 전" control={<Stepper value={d.overtimeBreakDurationSeconds} unit="초" min={0} max={600} step={30} onChange={(v) => set("overtimeBreakDurationSeconds", v)} />} />
        <SetRow name="휴식 자동 시작" control={<SegSm options={["사용", "미사용"]} index={d.autoIntervalTimerEnabled ? 0 : 1} onSelect={(i) => set("autoIntervalTimerEnabled", i === 0)} />} />
        </div>
      </RuleDetails>

    </section>
  );
}
