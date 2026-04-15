"use client";

// 대진 포맷 세부 설정 폼
// 이유: 대회 format(풀리그/토너먼트/조별리그 등)에 따라 필요한 세부 설정이 다르므로
//       조건부 UI로 전환하고, settings.bracket JSON에 저장한다.
// 사용처: new wizard + edit wizard 공통
import type React from "react";

export type BracketSettingsData = {
  format: string;                 // 현재 선택된 대회 방식 (wizard state와 동기화)
  knockoutSize: number;           // 토너먼트 진출 팀 수 (4, 6, 8, 12, 16 등 자유)
  bronzeMatch: boolean;           // 3/4위전 포함 여부 (기본 false)
  groupCount: number;             // 조 수 (조별리그 전용)
  teamsPerGroup: number;          // 조별 팀 수 (자동 계산 표시용 보조)
  advancePerGroup: number;        // 조별 진출 수 (1~3위)
  autoGenerateMatches: boolean;   // 경기 자동 생성 여부 (기본 true)
};

type Props = {
  data: BracketSettingsData;
  onChange: <K extends keyof BracketSettingsData>(field: K, value: BracketSettingsData[K]) => void;
  teamCount?: number;             // 정보 표시용 — 현재 참가팀 수 또는 maxTeams
  disabled?: boolean;             // 대회가 진행중/종료일 때 입력 잠금
};

export function BracketSettingsForm({ data, onChange, teamCount, disabled = false }: Props) {
  // 포맷별 분기 — 어느 섹션을 보여줄지 결정
  // single_elimination / dual_tournament: 순수 토너먼트 → knockoutSize만
  // full_league_knockout: 풀리그 후 토너먼트 → knockoutSize (진출팀 수)
  // group_stage_knockout: 조별리그 후 토너먼트 → 조 설정 + knockoutSize
  // group_stage: 조별리그만 → 조 설정만
  // round_robin: 풀리그만 → 조 설정도 토너먼트도 없음
  const isSingleElim = data.format === "single_elimination" || data.format === "double_elimination" || data.format === "dual_tournament";
  const isGroupOnly = data.format === "group_stage";
  const isGroupKnockout = data.format === "group_stage_knockout";
  const isFullLeagueKnockout = data.format === "full_league_knockout";
  const hasGroupSettings = isGroupOnly || isGroupKnockout;
  const hasKnockout = isSingleElim || isFullLeagueKnockout || isGroupKnockout;

  // 조별 팀 수 자동 계산 (참가팀 수 / 조 수 올림)
  const autoTeamsPerGroup = teamCount && data.groupCount ? Math.ceil(teamCount / data.groupCount) : null;

  // 입력 공통 스타일 — 기존 wizard의 input 스타일을 간소화
  const inputCls =
    "rounded border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/40 disabled:opacity-50 disabled:cursor-not-allowed";
  const inputStyle: React.CSSProperties = {
    borderColor: "var(--color-border)",
    backgroundColor: "var(--color-surface)",
    color: "var(--color-text-primary)",
  };

  return (
    <div className="space-y-4">
      <h3 className="text-base font-bold" style={{ color: "var(--color-text-primary)" }}>
        대진 세부 설정
      </h3>

      {disabled && (
        <p className="text-xs" style={{ color: "var(--color-text-muted)" }}>
          대회가 진행 중이거나 종료되어 대진 설정을 수정할 수 없습니다.
        </p>
      )}

      {/* --- 조별리그 설정 (group_stage, group_stage_knockout 전용) --- */}
      {hasGroupSettings && (
        <>
          <FieldRow label="조 수" hint={teamCount ? `${teamCount}팀 기준` : undefined}>
            <input
              type="number"
              min={1}
              max={16}
              value={data.groupCount}
              disabled={disabled}
              onChange={(e) => onChange("groupCount", Number(e.target.value))}
              className={`${inputCls} w-20`}
              style={inputStyle}
            />
            <span className="ml-2 text-sm" style={{ color: "var(--color-text-muted)" }}>조</span>
          </FieldRow>

          <FieldRow label="조별 팀 수" hint="자동 계산됨">
            <span className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
              {autoTeamsPerGroup !== null ? `${autoTeamsPerGroup}팀` : "-"}
            </span>
          </FieldRow>

          <FieldRow label="조별 진출 수">
            <select
              value={data.advancePerGroup}
              disabled={disabled}
              onChange={(e) => onChange("advancePerGroup", Number(e.target.value))}
              className={`${inputCls}`}
              style={inputStyle}
            >
              <option value={1}>각 조 1위</option>
              <option value={2}>각 조 1~2위</option>
              <option value={3}>각 조 1~3위</option>
            </select>
          </FieldRow>
        </>
      )}

      {/* --- 토너먼트 진출팀 수 (hasKnockout일 때만) --- */}
      {hasKnockout && (
        <FieldRow
          label="토너먼트 진출팀 수"
          hint="2의 제곱이 아니어도 됩니다 (예: 6, 12). 부전승 자동 처리"
        >
          <input
            type="number"
            min={2}
            max={64}
            value={data.knockoutSize}
            disabled={disabled}
            onChange={(e) => onChange("knockoutSize", Number(e.target.value))}
            className={`${inputCls} w-20`}
            style={inputStyle}
          />
          <span className="ml-2 text-sm" style={{ color: "var(--color-text-muted)" }}>강</span>
        </FieldRow>
      )}

      {/* --- 3/4위전 --- */}
      {hasKnockout && (
        <FieldRow label="3/4위전">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={data.bronzeMatch}
              disabled={disabled}
              onChange={(e) => onChange("bronzeMatch", e.target.checked)}
              className="h-4 w-4"
            />
            <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>포함</span>
          </label>
        </FieldRow>
      )}

      {/* --- 경기 자동 생성 (모든 포맷 공통) --- */}
      <FieldRow label="경기 자동 생성" hint="비활성화 시 관리자가 수동으로 경기 입력">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={data.autoGenerateMatches}
            disabled={disabled}
            onChange={(e) => onChange("autoGenerateMatches", e.target.checked)}
            className="h-4 w-4"
          />
          <span className="text-sm" style={{ color: "var(--color-text-primary)" }}>자동 생성</span>
        </label>
      </FieldRow>

      {/* --- 요약 문구 — 대회 구성이 한눈에 보이도록 --- */}
      <div
        className="rounded border p-3 text-xs"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-text-muted)",
        }}
      >
        <p className="mb-1 font-bold" style={{ color: "var(--color-text-secondary)" }}>
          대진 요약
        </p>
        {isFullLeagueKnockout && (
          <p>
            풀리그 {teamCount ?? "?"}팀 → {data.knockoutSize}강 토너먼트
            {data.bronzeMatch ? " + 3/4위전" : ""}
          </p>
        )}
        {isSingleElim && (
          <p>
            {data.knockoutSize}강 토너먼트
            {data.bronzeMatch ? " + 3/4위전" : ""}
          </p>
        )}
        {isGroupKnockout && (
          <p>
            {data.groupCount}조 × {autoTeamsPerGroup ?? "?"}팀 → 조별 {data.advancePerGroup}위 진출 → {data.knockoutSize}강 토너먼트
            {data.bronzeMatch ? " + 3/4위전" : ""}
          </p>
        )}
        {isGroupOnly && (
          <p>
            {data.groupCount}조 × {autoTeamsPerGroup ?? "?"}팀 조별리그
          </p>
        )}
        {data.format === "round_robin" && <p>풀리그 {teamCount ?? "?"}팀</p>}
      </div>
    </div>
  );
}

// 라벨 + 힌트 + 입력을 한 줄로 배치하는 보조 컴포넌트
function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center gap-2">
        <label className="text-sm font-medium" style={{ color: "var(--color-text-primary)" }}>
          {label}
        </label>
        {hint && (
          <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
            {hint}
          </span>
        )}
      </div>
      <div>{children}</div>
    </div>
  );
}
