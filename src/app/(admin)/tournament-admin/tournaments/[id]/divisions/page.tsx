"use client";

/**
 * 2026-05-12 Phase 3.5 — 종별 운영 방식 설정 페이지.
 *
 * 배경 (사용자 보고 5/12):
 *   - 대진표 생성 전 종별마다 다른 진행 방식 (i3-U9 링크제 / i2-U11 듀얼 등) 설정 UI 없음
 *   - Tournament.format = 단일 enum → 종별 단위 박제 불가능
 *   - Phase 3.5 = TournamentDivisionRule.format + settings 컬럼 신설
 *
 * URL: /tournament-admin/tournaments/[id]/divisions
 *
 * 기능:
 *   - 종별 목록 (코드 / 라벨 / 학년 / 참가비)
 *   - 종별마다 format 드롭다운 (8 enum) — PATCH
 *   - 종별별 settings (groupCount / advanceCount / linkagePairs) JSON 입력
 *   - 저장 시 즉시 PATCH (낙관적 UI)
 *
 * 권한: canManageTournament (super_admin / organizer / TAM / 단체 admin)
 */

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
// 2026-05-12 Phase 3.5-D — division format / settings 헬퍼 (lib 분리 → vitest 단위 검증 가능)
import {
  FORMAT_LABEL,
  showGroupSettings,
  showRankingFormat,
  calculateTotalTeams,
} from "@/lib/tournaments/division-formats";

interface DivisionRule {
  id: string;
  code: string;
  label: string;
  grade_min: number | null;
  grade_max: number | null;
  fee_krw: number;
  sort_order: number;
  format: string | null;
  settings: Record<string, unknown> | null;
}

// FORMAT_LABEL / showGroupSettings / showRankingFormat = lib/tournaments/division-formats.ts 로 이동 (Phase 3.5-D)
// 사유: server (route.ts) + client (page.tsx) 양쪽에서 동일 enum 사용 + vitest 단위 검증 가능.

export default function DivisionsSetupPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [rules, setRules] = useState<DivisionRule[]>([]);
  const [allowedFormats, setAllowedFormats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  // 2026-05-12 Phase 3.5-C — 진출 매핑 수동 trigger
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [advanceResult, setAdvanceResult] = useState<{
    code: string;
    updated: number;
    skipped: number;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules`
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "조회 실패");
        setLoading(false);
        return;
      }
      setRules((json.rules ?? []) as DivisionRule[]);
      setAllowedFormats((json.allowed_formats ?? []) as string[]);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  // 2026-05-12 Phase 3.5-C — 종별 진출 매핑 수동 실행
  const advanceDivision = async (ruleId: string, code: string) => {
    if (!confirm(`"${code}" 종별 진출 매핑을 실행하시겠어요?\n\n예선 종료 후 standings 기반으로 순위전 placeholder 매치를 자동 채웁니다.`)) return;
    setAdvancingId(ruleId);
    setAdvanceResult(null);
    setError(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules/${ruleId}/advance`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "매핑 실패");
        return;
      }
      setAdvanceResult({
        code: json.division_code,
        updated: json.updated,
        skipped: json.skipped,
      });
    } catch {
      setError("네트워크 오류");
    } finally {
      setAdvancingId(null);
    }
  };

  const updateRule = async (
    ruleId: string,
    patch: { format?: string | null; settings?: Record<string, unknown> }
  ) => {
    setSavingId(ruleId);
    setError(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules/${ruleId}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        }
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "저장 실패");
        return;
      }
      // 낙관적 갱신
      setRules((prev) =>
        prev.map((r) =>
          r.id === ruleId
            ? {
                ...r,
                format: patch.format ?? r.format,
                settings: patch.settings ?? r.settings,
              }
            : r
        )
      );
    } catch {
      setError("네트워크 오류");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface)]" />
        <div className="h-32 animate-pulse rounded-lg bg-[var(--color-surface)]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div>
        <Link
          href={`/tournament-admin/tournaments/${tournamentId}`}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          ← 대회 관리
        </Link>
        <h1 className="mt-1 text-xl font-bold sm:text-2xl">종별 운영 방식 설정</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          종별마다 다른 진행 방식(싱글/듀얼/링크제 등)을 설정합니다. 대진표 생성 전 박제 필수.
        </p>
      </div>

      {error && (
        <div
          className="rounded-[4px] border p-3 text-sm"
          style={{
            borderColor: "var(--color-error)",
            background: "color-mix(in srgb, var(--color-error) 8%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {error}
        </div>
      )}

      {rules.length === 0 ? (
        <Card className="py-12 text-center text-[var(--color-text-muted)]">
          <p className="text-sm">종별이 등록되지 않았습니다. 대회 마법사에서 종별을 먼저 추가하세요.</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {rules.map((r) => (
            <Card key={r.id}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold text-[var(--color-text-primary)]">
                    {r.code} <span className="ml-1 text-sm font-normal text-[var(--color-text-muted)]">({r.label})</span>
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {/* 2026-05-12 룰 변경: 어린 학년 자유 참가 — gradeMax 이하 표시 */}
                    {r.grade_max != null ? `${r.grade_max}학년 이하` : "학년 제한 없음"} · 참가비 {r.fee_krw.toLocaleString()}원
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--color-text-muted)]">진행 방식:</label>
                  <select
                    value={r.format ?? ""}
                    disabled={savingId === r.id}
                    onChange={(e) =>
                      updateRule(r.id, { format: e.target.value || null })
                    }
                    className="rounded-[4px] border px-2 py-1.5 text-sm focus:outline-none focus:ring-1"
                    style={{
                      borderColor: "var(--color-border)",
                      background: "var(--color-card)",
                      color: "var(--color-text-primary)",
                    }}
                  >
                    <option value="">(대회 format 폴백)</option>
                    {allowedFormats.map((f) => (
                      <option key={f} value={f}>
                        {/* FORMAT_LABEL 타입 = DivisionFormat narrow → string indexing 위해 cast (런타임은 ?? f 폴백) */}
                        {(FORMAT_LABEL as Record<string, string>)[f] ?? f}
                      </option>
                    ))}
                  </select>
                  {savingId === r.id && (
                    <span className="text-xs text-[var(--color-text-muted)]">저장 중...</span>
                  )}
                </div>
              </div>

              {/* 2026-05-12 Phase 3.5-D — 조 크기 / 조 개수 입력 (풀리그 기반 진행 방식만) */}
              {showGroupSettings(r.format) && (
                <GroupSettingsInputs
                  ruleId={r.id}
                  format={r.format}
                  settings={r.settings}
                  saving={savingId === r.id}
                  onSave={(patch) => updateRule(r.id, { settings: patch })}
                />
              )}

              {/* settings JSON 표시 (디버깅용 — 운영자가 박제 결과 검증) */}
              {r.settings && Object.keys(r.settings).length > 0 && (
                <div className="mt-2 rounded-[4px] bg-[var(--color-elevated)] p-2 text-xs text-[var(--color-text-muted)]">
                  <strong>settings:</strong> {JSON.stringify(r.settings)}
                </div>
              )}

              {/* 2026-05-12 Phase 3.5-C — 진출 매핑 수동 실행 */}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-[var(--color-text-muted)]">
                  예선 종료 후 standings 기반 순위전 자동 매핑
                </p>
                <button
                  type="button"
                  onClick={() => advanceDivision(r.id, r.code)}
                  disabled={advancingId === r.id}
                  className="btn btn--sm"
                >
                  {advancingId === r.id ? "실행 중..." : "진출 매핑 실행"}
                </button>
              </div>

              {/* 매핑 결과 — 해당 종별만 표시 */}
              {advanceResult && advanceResult.code === r.code && (
                <div
                  className="mt-2 rounded-[4px] border p-2 text-xs"
                  style={{
                    borderColor: "var(--color-success)",
                    background: "color-mix(in srgb, var(--color-success) 8%, transparent)",
                    color: "var(--color-success)",
                  }}
                >
                  ✅ 매핑 완료 — UPDATE {advanceResult.updated}건 / skip {advanceResult.skipped}건
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {/* 안내 */}
      <Card className="bg-[var(--color-elevated)]">
        <h3 className="mb-2 text-sm font-semibold text-[var(--color-text-primary)]">진행 방식 가이드</h3>
        <ul className="space-y-1 text-xs text-[var(--color-text-muted)]">
          {/* 2026-05-13 한국식 용어 통일 (§A) — "싱글 엘리미네이션" → "토너먼트" / "더블 엘리미네이션" → "더블 토너먼트" / "풀리그 (Round Robin)" → "풀리그" */}
          <li>• <strong>토너먼트</strong> — 한번 지면 끝. 16팀 → 8 → 4 → 결승</li>
          <li>• <strong>더블 토너먼트</strong> — 한 번 진 팀에게 패자 부활 기회 제공 (16팀 31경기)</li>
          <li>• <strong>듀얼 토너먼트</strong> — 4조×4팀 미니 더블엘리미 → 8강 → 결승 (16팀, 27경기)</li>
          <li>• <strong>풀리그</strong> — 모든 팀끼리 한 번씩. 승점 합산</li>
          <li>• <strong>조별리그 + 토너먼트</strong> — 조별 1·2위 본선 진출</li>
          <li>• <strong>링크제 (각조 동순위전)</strong> — i3-U9 표준. 예선 → 1·2위 결정전 / 3·4위 결정전 (linkage_pairs 명시)</li>
          {/* 2026-05-12 Phase 3.5-D — 신규 enum 가이드 */}
          <li>• <strong>조별리그 + 동순위 순위결정전</strong> — 각 조 풀리그 → 1위×N팀 / 2위×N팀 ... 동순위전 자동 매칭. 4×4=16팀 / 9경기+12경기 ≈ 21경기</li>
        </ul>
      </Card>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 2026-05-12 Phase 3.5-D — 조 설정 입력 컴포넌트 (group_size / group_count / ranking_format)
// ─────────────────────────────────────────────────────────────────────────
//
// 동작:
//   - 진행 방식이 풀리그 기반일 때만 노출 (showGroupSettings 가드)
//   - 입력값 변경 → onSave 호출 (debounce 없음 — onBlur 기준)
//   - 신규 enum (group_stage_with_ranking) 시 ranking_format select 추가 노출
//   - 빈 값 = undefined 박제 (settings JSON 에서 제외)
//
// 검증:
//   - 1~32 정수 (서버 zod 와 동일)
//   - 음수/소수/0 입력 시 input 자체가 거부 (min/max/step)
//
function GroupSettingsInputs(props: {
  ruleId: string;
  format: string | null;
  settings: Record<string, unknown> | null;
  saving: boolean;
  onSave: (settings: Record<string, unknown>) => void;
}) {
  const { format, settings, saving, onSave } = props;

  // 기존 settings 의 group_size / group_count / ranking_format 추출 (legacy 키 호환)
  const initialGroupSize =
    typeof settings?.group_size === "number" ? settings.group_size : null;
  const initialGroupCount =
    typeof settings?.group_count === "number" ? settings.group_count : null;
  const initialRankingFormat =
    typeof settings?.ranking_format === "string"
      ? (settings.ranking_format as string)
      : "round_robin";

  // 로컬 상태 (input 입력값) — 빈 문자열 허용 (사용자가 일시적으로 비울 수 있음)
  const [groupSize, setGroupSize] = useState<string>(
    initialGroupSize != null ? String(initialGroupSize) : "",
  );
  const [groupCount, setGroupCount] = useState<string>(
    initialGroupCount != null ? String(initialGroupCount) : "",
  );
  const [rankingFormat, setRankingFormat] = useState<string>(initialRankingFormat);

  // 총 팀 수 계산 (group_size × group_count) — division-formats.ts 헬퍼 사용
  const totalTeams = calculateTotalTeams(
    groupSize !== "" ? Number(groupSize) : null,
    groupCount !== "" ? Number(groupCount) : null,
  );

  // 저장 트리거 — 기존 settings + 신규 키 머지 (legacy linkage_pairs / advanceCount 보존)
  const handleSave = () => {
    const next: Record<string, unknown> = { ...(settings ?? {}) };

    // group_size / group_count: 빈 값이면 키 삭제
    if (groupSize === "") delete next.group_size;
    else next.group_size = Number(groupSize);

    if (groupCount === "") delete next.group_count;
    else next.group_count = Number(groupCount);

    // ranking_format: 신규 enum 일 때만 박제 (다른 format 은 의미 없음)
    if (showRankingFormat(format)) {
      next.ranking_format = rankingFormat;
    }

    onSave(next);
  };

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
      <label className="text-xs text-[var(--color-text-muted)]">
        조 크기 (팀)
        <input
          type="number"
          min={1}
          max={32}
          step={1}
          value={groupSize}
          disabled={saving}
          onChange={(e) => setGroupSize(e.target.value)}
          onBlur={handleSave}
          className="mt-1 w-full rounded-[4px] border px-2 py-1.5 text-sm focus:outline-none focus:ring-1"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-card)",
            color: "var(--color-text-primary)",
            minHeight: 44,
          }}
          placeholder="예: 4"
        />
      </label>
      <label className="text-xs text-[var(--color-text-muted)]">
        조 개수
        <input
          type="number"
          min={1}
          max={32}
          step={1}
          value={groupCount}
          disabled={saving}
          onChange={(e) => setGroupCount(e.target.value)}
          onBlur={handleSave}
          className="mt-1 w-full rounded-[4px] border px-2 py-1.5 text-sm focus:outline-none focus:ring-1"
          style={{
            borderColor: "var(--color-border)",
            background: "var(--color-card)",
            color: "var(--color-text-primary)",
            minHeight: 44,
          }}
          placeholder="예: 4"
        />
      </label>
      {/* 2026-05-13 — 신규 enum 만 ranking_format 영역 노출. 단, group_count <= 2 이면 드롭다운 대신 안내문 노출
          (사용자 결재 §B: 2조 이하 = 어떤 방식이든 단판 1경기로 자동 매핑됨)
          드롭다운 라벨도 한국식: "풀리그" / "토너먼트" */}
      {showRankingFormat(format) && (
        groupCount !== "" && Number(groupCount) <= 2 ? (
          // 조 2개 이하 — 단판 안내문 (드롭다운 숨김 / settings.ranking_format 기본값 round_robin 박제 유지)
          <div className="text-xs text-[var(--color-text-muted)]">
            <span className="block font-medium text-[var(--color-text-primary)]">동순위전 방식</span>
            <p
              className="mt-1 rounded-[4px] border px-2 py-2 text-xs leading-relaxed"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-elevated)",
                minHeight: 44,
              }}
            >
              각 동순위전이 단판 경기로 자동 진행됩니다 (조 개수가 2조 이하)
            </p>
          </div>
        ) : (
          // 조 3개 이상 — 풀리그 / 토너먼트 선택 드롭다운
          <label className="text-xs text-[var(--color-text-muted)]">
            동순위전 방식
            <select
              value={rankingFormat}
              disabled={saving}
              onChange={(e) => setRankingFormat(e.target.value)}
              onBlur={handleSave}
              className="mt-1 w-full rounded-[4px] border px-2 py-1.5 text-sm focus:outline-none focus:ring-1"
              style={{
                borderColor: "var(--color-border)",
                background: "var(--color-card)",
                color: "var(--color-text-primary)",
                minHeight: 44,
              }}
            >
              {/* 2026-05-13 라벨 한국식 통일 — "싱글 엘리미네이션" → "토너먼트" */}
              <option value="round_robin">풀리그</option>
              <option value="single_elimination">토너먼트</option>
            </select>
          </label>
        )
      )}
      {/* 총 팀 수 안내 — 모든 컬럼 가로 펼침 */}
      <p
        className={
          showRankingFormat(format)
            ? "col-span-2 text-xs text-[var(--color-text-muted)] sm:col-span-3"
            : "col-span-2 text-xs text-[var(--color-text-muted)] sm:col-span-3"
        }
      >
        {totalTeams != null
          ? `총 ${totalTeams}팀 (${groupSize} × ${groupCount})`
          : "조 크기 × 조 개수 = 총 팀 수"}
      </p>
    </div>
  );
}
