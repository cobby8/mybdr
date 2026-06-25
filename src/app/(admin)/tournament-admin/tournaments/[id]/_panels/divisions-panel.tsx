"use client";

/**
 * 2026-05-12 Phase 3.5 — 종별 운영 방식 설정 페이지.
 *
 * 배경 (사용자 보고 5/12):
 *   - 대진표 생성 전 종별마다 다른 진행 방식 (i3-U9 링크제 / i2-U11 듀얼 등) 설정 UI 없음
 *   - Tournament.format = 단일 enum → 종별 단위 박제 불가능
 *   - Phase 3.5 = TournamentDivisionRule.format + settings 컬럼 신설
 *
 * Workspace panel: /tournament-admin/tournaments/[id]#divisions
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
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";
// 2026-05-12 Phase 3.5-D — division format / settings 헬퍼 (lib 분리 → vitest 단위 검증 가능)
import {
  FORMAT_LABEL,
  showGroupSettings,
  showRankingFormat,
  shouldShowAdvancePerGroup,
  ADVANCE_PER_GROUP_DEFAULT,
  calculateTotalTeams,
} from "@/lib/tournaments/division-formats";
// 2026-06-22 F-2b — 디비전 일정(날짜/코트) 역참조 표시 헬퍼
import {
  resolveDivisionSchedule,
  allCourts,
  type ScheduleDateLite,
  type PlaceLite,
  type DivScheduleEntry,
} from "../divisions/_components/schedule-format";

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

type MasterCategory = {
  id: string;
  name: string;
  divisions: string[];
  ages: string[];
  sort_order: number;
};

type CurrentCategory = {
  category: string;
  divisions: Array<{
    name: string;
    cap: number | null;
    fee: number | null;
  }>;
};

// FORMAT_LABEL / showGroupSettings / showRankingFormat = lib/tournaments/division-formats.ts 로 이동 (Phase 3.5-D)
// 사유: server (route.ts) + client (page.tsx) 양쪽에서 동일 enum 사용 + vitest 단위 검증 가능.

export default function DivisionsSetupPage() {
  const params = useParams();
  const tournamentId = params.id as string;

  const [rules, setRules] = useState<DivisionRule[]>([]);
  const [allowedFormats, setAllowedFormats] = useState<string[]>([]);
  const [masterCategories, setMasterCategories] = useState<MasterCategory[]>([]);
  const [currentCategories, setCurrentCategories] = useState<CurrentCategory[]>([]);
  // 2026-06-22 F-2b — 디비전 일정 역참조용 데이터(div_schedule 배열 + 룩업 소스)
  //   route 에서 map→배열로 변환해 내보내므로(디비전명 snake 변환 회피) 배열로 받는다.
  const [divSchedule, setDivSchedule] = useState<DivScheduleEntry[]>([]);
  const [scheduleDates, setScheduleDates] = useState<ScheduleDateLite[]>([]);
  const [places, setPlaces] = useState<PlaceLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncResult, setSyncResult] = useState<string | null>(null);
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
      setMasterCategories((json.master_categories ?? []) as MasterCategory[]);
      setCurrentCategories((json.current_categories ?? []) as CurrentCategory[]);
      // F-2b — 디비전 일정 역참조 데이터(배열·route 에서 map→배열 변환·snake)
      setDivSchedule(
        Array.isArray(json.div_schedule)
          ? (json.div_schedule as DivScheduleEntry[])
          : [],
      );
      setScheduleDates((json.schedule_dates ?? []) as ScheduleDateLite[]);
      setPlaces((json.places ?? []) as PlaceLite[]);
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    load();
  }, [load]);

  const isDivisionSelected = (category: string, division: string) =>
    currentCategories.some(
      (item) =>
        item.category === category &&
        item.divisions.some((current) => current.name === division),
    );

  const toggleDivision = (category: string, division: string) => {
    setSyncResult(null);
    setCurrentCategories((prev) => {
      const existing = prev.find((item) => item.category === category);
      if (!existing) {
        return [
          ...prev,
          { category, divisions: [{ name: division, cap: null, fee: null }] },
        ];
      }

      const selected = existing.divisions.some((item) => item.name === division);
      const nextDivisions = selected
        ? existing.divisions.filter((item) => item.name !== division)
        : [...existing.divisions, { name: division, cap: null, fee: null }];

      if (nextDivisions.length === 0) {
        return prev.filter((item) => item.category !== category);
      }

      return prev.map((item) =>
        item.category === category ? { ...item, divisions: nextDivisions } : item,
      );
    });
  };

  const getCurrentDivisionName = (category: string, divisionIndex: number) =>
    currentCategories.find((item) => item.category === category)?.divisions[
      divisionIndex
    ]?.name ?? null;

  const updateDivisionName = (
    category: string,
    divisionIndex: number,
    value: string,
  ) => {
    const previousName = getCurrentDivisionName(category, divisionIndex);
    setSyncResult(null);
    setError(null);
    setCurrentCategories((prev) =>
      prev.map((item) =>
        item.category === category
          ? {
              ...item,
              divisions: item.divisions.map((current, index) =>
                index === divisionIndex ? { ...current, name: value } : current,
              ),
            }
          : item,
      ),
    );
    if (previousName && previousName !== value) {
      setDivSchedule((prev) =>
        prev.map((entry) =>
          entry.division === previousName ? { ...entry, division: value } : entry,
        ),
      );
    }
  };

  const removeDivision = (category: string, divisionIndex: number) => {
    const removedName = getCurrentDivisionName(category, divisionIndex);
    if (!removedName) return;
    if (!confirm(`"${removedName}" 디비전을 삭제할까요?`)) return;

    setSyncResult(null);
    setError(null);
    setCurrentCategories((prev) =>
      prev
        .map((item) =>
          item.category === category
            ? {
                ...item,
                divisions: item.divisions.filter((_, index) => index !== divisionIndex),
              }
            : item,
        )
        .filter((item) => item.divisions.length > 0),
    );
    setDivSchedule((prev) =>
      prev.filter((entry) => entry.division !== removedName),
    );
  };

  const updateDivisionNumber = (
    category: string,
    divisionIndex: number,
    key: "cap" | "fee",
    value: string,
  ) => {
    const numberValue = value === "" ? null : Math.max(0, Number(value));
    setCurrentCategories((prev) =>
      prev.map((item) =>
        item.category === category
          ? {
              ...item,
              divisions: item.divisions.map((current, index) =>
                index === divisionIndex
                  ? { ...current, [key]: numberValue }
                  : current,
              ),
            }
          : item,
      ),
    );
  };

  const getDivisionSchedule = (division: string) => {
    const entry = divSchedule.find((item) => item.division === division);
    return {
      dateId: entry?.date_id ?? "",
      courtId: entry?.court_id ?? "",
    };
  };

  const updateDivisionSchedule = (
    division: string,
    patch: Partial<Pick<DivScheduleEntry, "date_id" | "court_id">>,
  ) => {
    setSyncResult(null);
    setDivSchedule((prev) => {
      const existing = prev.find((item) => item.division === division);
      const next = {
        division,
        date_id: patch.date_id !== undefined ? patch.date_id : existing?.date_id,
        court_id: patch.court_id !== undefined ? patch.court_id : existing?.court_id,
      };
      const withoutCurrent = prev.filter((item) => item.division !== division);
      if (!next.date_id && !next.court_id) return withoutCurrent;
      return [...withoutCurrent, next];
    });
  };

  const syncDivisions = async () => {
    const normalizedCategories = currentCategories
      .map((item) => ({
        ...item,
        divisions: item.divisions.map((division) => ({
          ...division,
          name: division.name.trim(),
        })),
      }))
      .filter((item) => item.divisions.length > 0);
    const divisionNames = normalizedCategories.flatMap((item) =>
      item.divisions.map((division) => division.name),
    );
    if (divisionNames.some((name) => name.length === 0)) {
      setError("디비전명을 입력해 주세요.");
      return;
    }
    const duplicateNames = divisionNames.filter(
      (name, index) => divisionNames.indexOf(name) !== index,
    );
    if (duplicateNames.length > 0) {
      setError(`디비전명이 중복되었습니다: ${[...new Set(duplicateNames)].join(", ")}`);
      return;
    }
    const categories = Object.fromEntries(
      normalizedCategories.map((item) => [
        item.category,
        item.divisions.map((division) => division.name),
      ]),
    );
    const divCaps = Object.fromEntries(
      normalizedCategories.flatMap((item) =>
        item.divisions
          .filter((division) => division.cap != null)
          .map((division) => [division.name, division.cap]),
      ),
    );
    const divFees = Object.fromEntries(
      normalizedCategories.flatMap((item) =>
        item.divisions
          .filter((division) => division.fee != null)
          .map((division) => [division.name, division.fee]),
      ),
    );
    const selectedDivisionNames = new Set(
      normalizedCategories.flatMap((item) =>
        item.divisions.map((division) => division.name),
      ),
    );
    const divScheduleMap = Object.fromEntries(
      divSchedule
        .filter(
          (entry) =>
            selectedDivisionNames.has(entry.division.trim()) &&
            entry.date_id &&
            entry.court_id,
        )
        .map((entry) => [
          entry.division.trim(),
          { dateId: entry.date_id, courtId: entry.court_id },
        ]),
    );

    setSyncing(true);
    setError(null);
    setSyncResult(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ categories, divCaps, divFees, divSchedule: divScheduleMap }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "종별 저장 실패");
        return;
      }

      setRules((json.rules ?? []) as DivisionRule[]);
      setCurrentCategories((json.current_categories ?? []) as CurrentCategory[]);
      setDivSchedule(
        Array.isArray(json.div_schedule)
          ? (json.div_schedule as DivScheduleEntry[])
          : [],
      );
      const result = json.sync_result;
      setSyncResult(
        result
          ? `저장 완료 · 신규 ${result.created ?? 0}건 · 갱신 ${result.updated ?? 0}건 · 삭제 ${result.deleted ?? 0}건`
          : "저장 완료",
      );
    } catch {
      setError("네트워크 오류");
    } finally {
      setSyncing(false);
    }
  };

  // 2026-05-12 Phase 3.5-C — 종별 진출 매핑 수동 실행
  const advanceDivision = async (ruleId: string, code: string) => {
    if (!confirm(`"${code}" 종별 진출 매핑을 실행하시겠어요?\n\n예선 순위를 기준으로 순위전 경기를 자동으로 채웁니다.`)) return;
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

  const courtOptions = allCourts(places);

  if (loading) {
    return (
      <div data-skin="toss" className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-[var(--color-surface)]" />
        <div className="h-32 animate-pulse rounded-lg bg-[var(--color-surface)]" />
      </div>
    );
  }

  return (
    // Track B-c — Toss 토큰 적용 루트 opt-in
    <div data-skin="toss" className="space-y-4">

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

      <section className="rounded-[18px] bg-[var(--grey-50)] p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 gap-3">
            <div className="ct-headicon">
              <Icon name="category" size={18} color="var(--primary)" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base font-bold text-[var(--ink)]">
                종별 구성
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-mute)]">
                대회 생성과 같은 종별 마스터를 사용합니다.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={syncDivisions}
            disabled={syncing}
            className="ts-btn ts-btn--primary ts-btn--sm"
          >
            {syncing ? "저장 중..." : "종별 저장"}
          </button>
        </div>

        {syncResult && (
          <div
            className="mt-3 rounded-[4px] border px-3 py-2 text-sm"
            style={{
              borderColor: "var(--color-success)",
              background: "color-mix(in srgb, var(--color-success) 8%, transparent)",
              color: "var(--color-success)",
            }}
          >
            {syncResult}
          </div>
        )}

        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          {masterCategories.map((category) => {
            const selected = currentCategories.find(
              (item) => item.category === category.name,
            );
            return (
              <div
                key={category.id}
                className="rounded-[16px] border bg-[var(--card)] p-3"
                style={{
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-semibold text-[var(--ink)]">
                    {category.name}
                  </h3>
                  <span className="ts-badge ts-badge--grey">
                    {selected?.divisions.length ?? 0}개 선택
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {category.divisions.map((division) => {
                    const checked = isDivisionSelected(category.name, division);
                    return (
                      <button
                        key={division}
                        type="button"
                        onClick={() => toggleDivision(category.name, division)}
                        data-active={checked}
                        className="ts-chip"
                      >
                        {checked && <Icon name="check" size={14} />}
                        {division}
                      </button>
                    );
                  })}
                </div>

                {selected && selected.divisions.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {selected.divisions.map((division, divisionIndex) => {
                      const schedule = getDivisionSchedule(division.name);
                      const selectedDate = scheduleDates.find(
                        (date) => date.id === schedule.dateId,
                      );
                      const availableCourts =
                        selectedDate?.court_ids?.length
                          ? courtOptions.filter((court) =>
                              selectedDate.court_ids?.includes(court.id),
                            )
                          : courtOptions;

                      return (
                        <div
                          key={`${category.name}-${divisionIndex}`}
                          className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(112px,1fr)_88px_100px_minmax(128px,1.15fr)_minmax(136px,1.2fr)_44px]"
                        >
                          <input
                            type="text"
                            value={division.name}
                            onChange={(e) =>
                              updateDivisionName(
                                category.name,
                                divisionIndex,
                                e.target.value,
                              )
                            }
                            className="ts-input min-h-[44px] font-semibold"
                            aria-label={`${category.name} 디비전명`}
                            placeholder="디비전명"
                          />
                          <input
                            type="number"
                            min={0}
                            value={division.cap ?? ""}
                            onChange={(e) =>
                              updateDivisionNumber(
                                category.name,
                                divisionIndex,
                                "cap",
                                e.target.value,
                              )
                            }
                            className="ts-input min-h-[44px]"
                            placeholder="정원"
                          />
                          <input
                            type="number"
                            min={0}
                            step={1000}
                            value={division.fee ?? ""}
                            onChange={(e) =>
                              updateDivisionNumber(
                                category.name,
                                divisionIndex,
                                "fee",
                                e.target.value,
                              )
                            }
                            className="ts-input min-h-[44px]"
                            placeholder="참가비"
                          />
                          <select
                            value={schedule.dateId}
                            onChange={(e) =>
                              updateDivisionSchedule(division.name, {
                                date_id: e.target.value,
                                court_id: "",
                              })
                            }
                            className="ts-select min-h-[44px]"
                          >
                            <option value="">일정 선택</option>
                            {scheduleDates.map((date) => (
                              <option key={date.id} value={date.id}>
                                {date.date}
                              </option>
                            ))}
                          </select>
                          <select
                            value={schedule.courtId}
                            onChange={(e) =>
                              updateDivisionSchedule(division.name, {
                                court_id: e.target.value,
                              })
                            }
                            className="ts-select min-h-[44px]"
                          >
                            <option value="">체육관 선택</option>
                            {availableCourts.map((court) => (
                              <option key={court.id} value={court.id}>
                                {court.full}
                              </option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={() => removeDivision(category.name, divisionIndex)}
                            className="ts-btn ts-btn--ghost min-h-[44px] px-0"
                            aria-label={`${division.name || "디비전"} 삭제`}
                            title="삭제"
                          >
                            <Icon name="trash-2" size={18} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {rules.length === 0 ? (
        /*
          2026-05-28 PR-1C-12 박제 — 시안 adv-empty (빈 상태 발견성 강화).
          사유: 운영 평면 텍스트 → 시안의 아이콘 + 종별 개념 안내 + 마법사 진입 CTA 로 보강.
          dashed border = 시안 adv-empty 점선 박스를 운영 토큰으로 치환.
        */
        <div className="ct-emptybox ct-emptybox--tall">
            {/* Material category → lucide layout-grid */}
            <Icon name="layout-grid" size={48} color="var(--color-text-muted)" />
            <div className="text-base font-bold text-[var(--ink)]">
              저장된 종별이 없습니다
            </div>
            <div className="max-w-md text-sm text-[var(--ink-mute)]">
              위에서 종별을 선택하고 저장하세요.
            </div>
        </div>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {rules.map((r) => (
            <article key={r.id} className="rounded-[18px] border bg-[var(--card)] p-4" style={{ borderColor: "var(--color-border)" }}>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {/*
                    2026-05-28 PR-1C-12 박제 — 시안 adv-card__head (code 모노 칩 + 종별명).
                    사유: 운영 평면 "code (label)" → 시안의 code 모노 칩(blue-soft 배경) + 라벨로 시각 강화.
                    --color-info 8% 틴트 = 시안 adv-card__name 의 cafe-blue-soft 칩을 운영 토큰으로 치환.
                  */}
                  <p className="flex items-center gap-2 font-semibold text-[var(--ink)]">
                    <span
                      className="rounded-[4px] px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wide"
                      style={{
                        color: "var(--color-info)",
                        background: "color-mix(in srgb, var(--color-info) 12%, transparent)",
                      }}
                    >
                      {r.code}
                    </span>
                    {r.label}
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                    {/* 2026-05-12 룰 변경: 어린 학년 자유 참가 — gradeMax 이하 표시 */}
                    {r.grade_max != null ? `${r.grade_max}학년 이하` : "학년 제한 없음"} · 참가비 {r.fee_krw.toLocaleString()}원
                  </p>
                  {/*
                    2026-06-22 F-2b — 디비전별 경기 날짜/코트 표시.
                    div_schedule 배열에서 division ↔ DivisionRule.label 우선 매칭, 없으면 code 폴백.
                    역참조 실패(매칭/값 부재/룩업 실패)는 "–" 로 graceful 표시.
                  */}
                  {(() => {
                    const { dateLabel, courtLabel } = resolveDivisionSchedule(
                      divSchedule,
                      r.label,
                      r.code,
                      scheduleDates,
                      places,
                    );
                    return (
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}>
                          <Icon name="calendar" size={12} />
                          {dateLabel ?? "–"}
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-[4px] border px-1.5 py-0.5 text-[11px] font-medium text-[var(--color-text-muted)]"
                          style={{ borderColor: "var(--color-border)", background: "var(--color-elevated)" }}>
                          <Icon name="map-pin" size={12} />
                          {courtLabel ?? "–"}
                        </span>
                      </div>
                    );
                  })()}
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-[var(--color-text-muted)]">진행 방식:</label>
                  <select
                    value={r.format ?? ""}
                    disabled={savingId === r.id}
                    onChange={(e) =>
                      updateRule(r.id, { format: e.target.value || null })
                    }
                    className="ts-select min-w-[160px]"
                  >
                    <option value="">대회 방식 사용</option>
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

              {/* 2026-05-12 Phase 3.5-C — 진출 매핑 수동 실행 */}
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-[var(--color-text-muted)]">
                  예선 순위 기준 순위전 자동 매핑
                </p>
                <button
                  type="button"
                  onClick={() => advanceDivision(r.id, r.code)}
                  disabled={advancingId === r.id}
                  className="ts-btn ts-btn--secondary ts-btn--sm"
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
                  매핑 완료 · 갱신 {advanceResult.updated}건 · 제외 {advanceResult.skipped}건
                </div>
              )}
            </article>
          ))}
        </div>
      )}

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
  const isDualTournament = format === "dual_tournament";

  // 기존 settings 의 group_size / group_count / ranking_format / advance_per_group 추출 (legacy 키 호환)
  const initialGroupSize =
    typeof settings?.group_size === "number" ? settings.group_size : null;
  const initialGroupCount =
    typeof settings?.group_count === "number" ? settings.group_count : null;
  const initialRankingFormat =
    typeof settings?.ranking_format === "string"
      ? (settings.ranking_format as string)
      : "round_robin";
  // 2026-05-13 — 조별 본선 진출 팀 수 (default 2 = 생활체육 표준 1·2위 진출)
  const initialAdvancePerGroup =
    typeof settings?.advance_per_group === "number" ? settings.advance_per_group : null;

  // 로컬 상태 (input 입력값) — 빈 문자열 허용 (사용자가 일시적으로 비울 수 있음)
  const [groupSize, setGroupSize] = useState<string>(
    initialGroupSize != null ? String(initialGroupSize) : isDualTournament ? "4" : "",
  );
  const [groupCount, setGroupCount] = useState<string>(
    initialGroupCount != null ? String(initialGroupCount) : "",
  );
  const [rankingFormat, setRankingFormat] = useState<string>(initialRankingFormat);
  const [advancePerGroup, setAdvancePerGroup] = useState<string>(
    initialAdvancePerGroup != null ? String(initialAdvancePerGroup) : isDualTournament ? "2" : "",
  );

  // 총 팀 수 계산 (group_size × group_count) — division-formats.ts 헬퍼 사용
  const totalTeams = calculateTotalTeams(
    isDualTournament ? 4 : groupSize !== "" ? Number(groupSize) : null,
    groupCount !== "" ? Number(groupCount) : null,
  );
  const effectiveAdvancePerGroup = isDualTournament
    ? 2
    : advancePerGroup !== ""
      ? Number(advancePerGroup)
      : ADVANCE_PER_GROUP_DEFAULT;

  // 저장 트리거 — 기존 settings + 신규 키 머지 (legacy linkage_pairs / advanceCount 보존)
  const handleSave = () => {
    const next: Record<string, unknown> = { ...(settings ?? {}) };

    // group_size / group_count: 빈 값이면 키 삭제
    if (isDualTournament) next.group_size = 4;
    else if (groupSize === "") delete next.group_size;
    else next.group_size = Number(groupSize);

    if (groupCount === "") delete next.group_count;
    else next.group_count = Number(groupCount);

    // ranking_format: 신규 enum 일 때만 박제 (다른 format 은 의미 없음)
    if (showRankingFormat(format)) {
      next.ranking_format = rankingFormat;
    }

    // 2026-05-13 — advance_per_group: 조별리그→본선 enum (3개) 일 때만 박제
    // (group_stage_knockout / full_league_knockout / dual_tournament)
    if (shouldShowAdvancePerGroup(format)) {
      if (isDualTournament) next.advance_per_group = 2;
      else if (advancePerGroup === "") delete next.advance_per_group;
      else next.advance_per_group = Number(advancePerGroup);
    } else {
      // 노출 조건이 아닌 enum 으로 전환 시 기존 키 정리 (의미 없는 박제 잔존 방지)
      delete next.advance_per_group;
    }

    onSave(next);
  };

  return (
    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
      <label className="ts-field text-xs text-[var(--ink-mute)]">
        {isDualTournament ? "조 크기 (고정)" : "조 크기 (팀)"}
        <input
          type="number"
          min={1}
          max={32}
          step={1}
          value={isDualTournament ? "4" : groupSize}
          disabled={saving || isDualTournament}
          onChange={(e) => setGroupSize(e.target.value)}
          onBlur={handleSave}
          className="ts-input mt-1"
          placeholder="4"
        />
      </label>
      <label className="ts-field text-xs text-[var(--ink-mute)]">
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
          className="ts-input mt-1"
          placeholder="4"
        />
      </label>
      {/* 2026-05-13 — 신규 enum 만 ranking_format 영역 노출. 단, group_count <= 2 이면 드롭다운 대신 안내문 노출
          (사용자 결재 §B: 2조 이하 = 어떤 방식이든 단판 1경기로 자동 매핑됨)
          드롭다운 라벨도 한국식: "풀리그" / "토너먼트" */}
      {showRankingFormat(format) && (
        groupCount !== "" && Number(groupCount) <= 2 ? (
          // 조 2개 이하 — 단판 안내문 (드롭다운 숨김 / settings.ranking_format 기본값 round_robin 박제 유지)
          <div className="text-xs text-[var(--ink-mute)]">
            <span className="block font-medium text-[var(--ink)]">동순위전 방식</span>
            <p
              className="mt-1 rounded-[12px] bg-[var(--grey-50)] px-3 py-2 text-xs leading-relaxed"
            >
              각 동순위전이 단판 경기로 자동 진행됩니다 (조 개수가 2조 이하)
            </p>
          </div>
        ) : (
          // 조 3개 이상 — 풀리그 / 토너먼트 선택 드롭다운
          <label className="ts-field text-xs text-[var(--ink-mute)]">
            동순위전 방식
            <select
              value={rankingFormat}
              disabled={saving}
              onChange={(e) => setRankingFormat(e.target.value)}
              onBlur={handleSave}
              className="ts-select mt-1"
            >
              {/* 2026-05-13 라벨 한국식 통일 — "싱글 엘리미네이션" → "토너먼트" */}
              <option value="round_robin">풀리그</option>
              <option value="single_elimination">토너먼트</option>
            </select>
          </label>
        )
      )}
      {/* 2026-05-13 — 조별 본선 진출 팀 수 (group_stage_knockout / full_league_knockout / dual_tournament 만)
          사유: 조별리그/풀리그 → 본선 토너먼트 enum 만 의미 있음 (조 N위까지 본선 진출).
          UI: group_size 가 max 상한 (조 크기 초과 진출 불가). default 2 = 생활체육 표준 1·2위 */}
      {shouldShowAdvancePerGroup(format) && (
        <label className="ts-field text-xs text-[var(--ink-mute)]">
          {isDualTournament ? "조별 진출 팀 수 (고정)" : "조별 본선 진출 팀 수"}
          <input
            type="number"
            min={1}
            max={isDualTournament ? 4 : groupSize !== "" ? Number(groupSize) : 32}
            step={1}
            value={isDualTournament ? "2" : advancePerGroup}
            disabled={saving || isDualTournament}
            onChange={(e) => setAdvancePerGroup(e.target.value)}
            onBlur={handleSave}
            className="ts-input mt-1"
            placeholder={`${ADVANCE_PER_GROUP_DEFAULT}`}
          />
        </label>
      )}
      {/* 총 팀 수 + 총 본선 진출 팀 수 안내 — 모든 컬럼 가로 펼침 */}
      <p className="col-span-2 text-xs text-[var(--color-text-muted)] sm:col-span-3">
        {totalTeams != null
          ? `총 ${totalTeams}팀 (${groupSize} × ${groupCount})`
          : "조 크기 × 조 개수 = 총 팀 수"}
        {shouldShowAdvancePerGroup(format) && groupCount !== "" && (
          <>
            {" / "}
            총 본선 진출 ={" "}
            {effectiveAdvancePerGroup * Number(groupCount)}
            팀
          </>
        )}
      </p>
    </div>
  );
}
