"use client";

// 듀얼 토너먼트 조 배정 에디터 (2026-05-04 P4 신설)
//
// 이유: 듀얼 토너먼트는 16팀을 4그룹 (A/B/C/D × 4팀) 으로 배정해야 매치 생성 가능.
//       기존엔 운영자가 settings.bracket.groupAssignment 를 수동 JSON 으로 입력해야 했음.
//       이제는 admin UI 에서 select dropdown 으로 직관적 배정 + 저장 + 자동 매치 생성.
//
// 동작:
//   1) 승인된 16팀을 받아 select 16개 (4×4 그리드) 로 표시
//   2) 자동 시드 추천 버튼 — seedNumber 또는 팀 등록 순서로 자동 채우기
//   3) 저장 버튼 — settings.bracket.groupAssignment + semifinalPairing PATCH /api/web/tournaments/[id]
//   4) 자동 매치 생성 버튼 — POST /api/web/tournaments/[id]/bracket (저장된 settings 기반 27매치 생성)
//
// 5/2 영향 0: 본 컴포넌트는 매치 0건 + 미배정 상태에서만 의미 있음.
//             기존 27매치가 있는 5/2 대회는 이 UI 진입 X (page.tsx 가 hasMatches 분기 처리).

import { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DUAL_DEFAULT_PAIRING,
  type SemifinalPairingMode,
} from "@/lib/tournaments/dual-defaults";

// 4조 키 (UI 순서 고정 = 매치 생성 순서와 동일)
const GROUP_KEYS = ["A", "B", "C", "D"] as const;
type GroupKey = (typeof GROUP_KEYS)[number];

// 한 조당 4팀 슬롯 — string("") = 미배정, teamId = 배정
type GroupSlots = [string, string, string, string];
type GroupAssignment = Record<GroupKey, GroupSlots>;

export type ApprovedTeamLite = {
  id: string;
  seedNumber: number | null;
  team: { name: string };
};

type Props = {
  tournamentId: string;
  approvedTeams: ApprovedTeamLite[];
  // 저장된 기존 배정 (settings.bracket.groupAssignment)
  initialAssignment?: Partial<Record<GroupKey, string[]>>;
  // 저장된 페어링 모드 (settings.bracket.semifinalPairing)
  initialPairing?: SemifinalPairingMode;
  // 매치 생성 트리거 — page.tsx 의 generate(false) 호출 (저장 → 생성 두 단계)
  onGenerate: () => void | Promise<void>;
  // 저장 완료 후 부모가 다시 fetch 하도록 알림 (옵션)
  onSaved?: () => void;
  // 매치 0건 + 활성화 가능 여부 (이미 매치 있으면 disabled)
  generating?: boolean;
  canGenerate?: boolean;
};

// 빈 배정 — 16 슬롯 모두 ""
function emptyAssignment(): GroupAssignment {
  return {
    A: ["", "", "", ""],
    B: ["", "", "", ""],
    C: ["", "", "", ""],
    D: ["", "", "", ""],
  };
}

// initialAssignment 를 4×4 슬롯으로 변환 (부족하면 "" 패딩)
function fromInitial(
  initial: Partial<Record<GroupKey, string[]>> | undefined,
): GroupAssignment {
  const a = emptyAssignment();
  if (!initial) return a;
  for (const key of GROUP_KEYS) {
    const list = initial[key] ?? [];
    a[key] = [
      list[0] ?? "",
      list[1] ?? "",
      list[2] ?? "",
      list[3] ?? "",
    ] as GroupSlots;
  }
  return a;
}

export function DualGroupAssignmentEditor({
  tournamentId,
  approvedTeams,
  initialAssignment,
  initialPairing,
  onGenerate,
  onSaved,
  generating = false,
  canGenerate = true,
}: Props) {
  // 배정 상태 (조-슬롯 → teamId)
  const [assignment, setAssignment] = useState<GroupAssignment>(() =>
    fromInitial(initialAssignment),
  );
  // 4강 페어링 모드 — 운영자 변경 가능 (default = sequential)
  const [pairing, setPairing] = useState<SemifinalPairingMode>(
    initialPairing ?? DUAL_DEFAULT_PAIRING,
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [savedOnce, setSavedOnce] = useState(false);

  // initialAssignment / initialPairing 이 늦게 도착해도 동기화 (페이지 첫 fetch 후)
  // 단 사용자가 이미 변경했으면 덮어쓰지 않기 위해 savedOnce 체크
  useEffect(() => {
    if (savedOnce) return;
    setAssignment(fromInitial(initialAssignment));
    setPairing(initialPairing ?? DUAL_DEFAULT_PAIRING);
  }, [initialAssignment, initialPairing, savedOnce]);

  // 사용된 teamId 모음 (다른 슬롯에서 disable 처리용)
  const usedTeamIds = useMemo(() => {
    const used = new Set<string>();
    for (const key of GROUP_KEYS) {
      for (const id of assignment[key]) {
        if (id) used.add(id);
      }
    }
    return used;
  }, [assignment]);

  // 한 슬롯 변경
  function setSlot(group: GroupKey, slotIdx: number, teamId: string) {
    setAssignment((prev) => {
      const next = { ...prev };
      const slots = [...next[group]] as GroupSlots;
      slots[slotIdx] = teamId;
      next[group] = slots;
      return next;
    });
  }

  // 자동 시드 추천 — seedNumber 우선 (없으면 등록 순서) → 4×4 분배
  // 분배 패턴: seed 1·5·9·13 → A조 1번슬롯, B조 1번슬롯 ... (snake draft 변형)
  // 단순화: 1~4 = A조, 5~8 = B조, ... 순차 (운영자가 추후 swap 가능)
  function autoSeed() {
    if (approvedTeams.length !== 16) {
      setSaveError(`승인된 팀이 정확히 16팀이어야 합니다 (현재 ${approvedTeams.length}팀).`);
      return;
    }
    const sorted = [...approvedTeams].sort((a, b) => {
      // seedNumber 우선 (낮은 숫자 = 상위 시드)
      const sA = a.seedNumber ?? Number.MAX_SAFE_INTEGER;
      const sB = b.seedNumber ?? Number.MAX_SAFE_INTEGER;
      if (sA !== sB) return sA - sB;
      // tie-break: id (등록 순서 근사)
      return a.id.localeCompare(b.id);
    });
    const next: GroupAssignment = emptyAssignment();
    for (let i = 0; i < 16; i++) {
      // 1~4 = A조, 5~8 = B조, 9~12 = C조, 13~16 = D조
      const groupIdx = Math.floor(i / 4);
      const slotIdx = i % 4;
      const groupKey = GROUP_KEYS[groupIdx];
      next[groupKey][slotIdx] = sorted[i].id;
    }
    setAssignment(next);
    setSaveError("");
  }

  // 검증 — 16팀 unique 채워졌는지
  function validate(): { ok: boolean; error?: string } {
    const all: string[] = [];
    for (const key of GROUP_KEYS) {
      for (const id of assignment[key]) {
        if (!id) {
          return { ok: false, error: `${key}조에 미배정 슬롯이 있습니다.` };
        }
        all.push(id);
      }
    }
    if (all.length !== 16) {
      return { ok: false, error: `16팀이 모두 배정되어야 합니다 (현재 ${all.length}팀).` };
    }
    const unique = new Set(all);
    if (unique.size !== 16) {
      return { ok: false, error: "한 팀이 두 조에 들어갈 수 없습니다." };
    }
    return { ok: true };
  }

  // 저장 — settings.bracket.groupAssignment + semifinalPairing PATCH
  async function save() {
    const v = validate();
    if (!v.ok) {
      setSaveError(v.error ?? "검증 실패");
      return;
    }
    setSaving(true);
    setSaveError("");
    try {
      // 기존 settings 머지 — bracket 키만 갱신 (다른 settings 유지)
      // PATCH /api/web/tournaments/[id] 가 settings 머지 처리 (wizard 와 동일 패턴)
      const groupAssignment: Record<GroupKey, string[]> = {
        A: assignment.A,
        B: assignment.B,
        C: assignment.C,
        D: assignment.D,
      };
      const res = await fetch(`/api/web/tournaments/${tournamentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          settings: {
            bracket: {
              // dual 표준값 + 사용자 입력
              groupCount: 4,
              teamsPerGroup: 4,
              advancePerGroup: 2,
              knockoutSize: 8,
              hasGroupFinal: true,
              bronzeMatch: false,
              semifinalPairing: pairing,
              groupAssignment,
            },
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        throw new Error(body.error ?? "저장 실패");
      }
      setSavedOnce(true);
      onSaved?.();
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "저장 중 오류");
    } finally {
      setSaving(false);
    }
  }

  // 저장 + 매치 자동 생성 (한 번에 처리)
  async function saveAndGenerate() {
    const v = validate();
    if (!v.ok) {
      setSaveError(v.error ?? "검증 실패");
      return;
    }
    await save();
    // save 가 setSaveError 했으면 중단
    if (saveError) return;
    // 약간의 시차 — settings PATCH 후 BE 가 settings 반영하도록 1 frame 양보
    // (실제로는 PATCH response 받은 시점이면 DB committed 상태)
    await onGenerate();
  }

  const validation = validate();
  const isReady = validation.ok;

  return (
    <Card className="mb-6">
      {/* 헤더 + 자동 시드 */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-[var(--color-text-primary)]">
            조 배정
          </h2>
          <p className="mt-1 text-xs text-[var(--color-text-muted)]">
            16팀을 4그룹 (A/B/C/D) 에 배정하세요. 각 조 4팀 = 시드 순서.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={autoSeed}
          disabled={approvedTeams.length !== 16 || saving}
          className="text-sm"
        >
          자동 시드 추천
        </Button>
      </div>

      {/* 4×4 그리드 — 모바일 1열 / md 2열 / lg 4열 */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {GROUP_KEYS.map((groupKey) => (
          <div
            key={groupKey}
            className="rounded-[8px] bg-[var(--color-surface)] p-3"
          >
            <p className="mb-2 text-sm font-bold text-[var(--color-text-primary)]">
              {groupKey}조
            </p>
            <div className="space-y-2">
              {assignment[groupKey].map((teamId, slotIdx) => (
                <div key={slotIdx} className="flex items-center gap-2">
                  <span className="w-5 shrink-0 text-xs text-[var(--color-text-muted)]">
                    {slotIdx + 1}.
                  </span>
                  <select
                    value={teamId}
                    disabled={saving || generating}
                    onChange={(e) =>
                      setSlot(groupKey, slotIdx, e.target.value)
                    }
                    className="w-full rounded-[6px] border-none bg-[var(--color-elevated)] px-2 py-1.5 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
                  >
                    <option value="">미정</option>
                    {approvedTeams.map((t) => {
                      // 다른 슬롯에서 사용 중인 팀은 disable (단 자기 자신은 허용)
                      const isUsedElsewhere =
                        usedTeamIds.has(t.id) && t.id !== teamId;
                      return (
                        <option
                          key={t.id}
                          value={t.id}
                          disabled={isUsedElsewhere}
                        >
                          {t.team.name}
                          {t.seedNumber != null ? ` (#${t.seedNumber})` : ""}
                          {isUsedElsewhere ? " — 배정됨" : ""}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* 4강 페어링 모드 — 운영자 변경 가능 (default = sequential) */}
      <div className="mt-4 rounded-[8px] bg-[var(--color-surface)] p-3">
        <label className="mb-2 block text-sm font-medium text-[var(--color-text-primary)]">
          4강 페어링 모드
        </label>
        <select
          value={pairing}
          disabled={saving || generating}
          onChange={(e) =>
            setPairing(e.target.value as SemifinalPairingMode)
          }
          className="w-full rounded-[6px] border-none bg-[var(--color-elevated)] px-3 py-2 text-sm text-[var(--color-text-primary)] disabled:opacity-50"
        >
          <option value="sequential">표준 (시드 분리, 단일 코트 순차 진행)</option>
          <option value="adjacent">5/2 패턴 (AB/CD 진영 분리, 멀티 코트 묶기)</option>
        </select>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {pairing === "adjacent"
            ? "8강 1·2 → 4강 1 / 8강 3·4 → 4강 2 (인접) — 5/2 동호회최강전 패턴"
            : "8강 A1+D2 / B1+C2 / C1+B2 / D1+A2 — 같은 조 결승까지 분리"}
        </p>
      </div>

      {/* 검증 오류 */}
      {saveError && (
        <div
          className="mt-3 rounded-[6px] px-3 py-2 text-sm"
          style={{
            backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
            color: "var(--color-error)",
          }}
        >
          {saveError}
        </div>
      )}

      {/* 저장 / 매치 생성 버튼 */}
      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="secondary"
          onClick={save}
          disabled={!isReady || saving || generating}
          className="text-sm"
        >
          {saving ? "저장 중..." : "조 배정 저장"}
        </Button>
        <Button
          onClick={saveAndGenerate}
          disabled={!isReady || saving || generating || !canGenerate}
          className="text-sm"
        >
          {generating ? "생성 중..." : "저장 + 매치 자동 생성"}
        </Button>
      </div>
    </Card>
  );
}
