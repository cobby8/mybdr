"use client";

// ============================================================
// operate/[id]/_bracket-panel.tsx — 대진표 패널 (R4-B)
//   정본 1:1 포팅: Dev/design/BDR v2.41-admin-toss/bracket.jsx (window.BracketPanel · full)
//   - 정본은 전부 클라 mock(WS 인메모리·window.__BRACKET 이벤트)이지만,
//     실 백엔드 엔드포인트가 존재 → 실데이터 READ + 실 mutation 배선.
//   - 데이터(divisions/teams/matches/versions) = 서버 Prisma READ → props 주입(raw fetch 0).
//   - 상태(config/seeding/drawn) = 실데이터 파생:
//       matches 있으면 drawn(실 트리/조 렌더) · groups 배정만 있으면 grouped ·
//       아무것도 없으면 config + Empty("아직 조편성 전입니다") · seeding = 클라 오버레이.
//   - mutation = adminFetch(camel→snake 단일변환) POST, 기존 엔드포인트 재사용(백엔드 0변경):
//       · 추첨/시딩 = /api/web/admin/tournaments/[id]/division-draw
//       · 발행(일정 반영) = /api/web/admin/tournaments/[id]/division-rules/[ruleId]/generate
//   - className(bk-*/ts-*/ct-*)·마크업은 정본 verbatim.
//   ⚠️ 의도적 deviation(보고):
//     ① config 카드 = 읽기전용(format/조설정 편집 = 생성/수정 마법사 R3/R5 스코프).
//        편집 시 draw/generate 설정 불일치를 막기 위해 표시만.
//     ② 실 트리 드래그 스왑 미배선(정본 mock 전용·실 재배치 엔드포인트 없음 →
//        '다시 추첨'/'다시 생성'으로 대체).
//     ③ single_elimination 시드배정 UI 생략(랜덤 추첨만 — 조 슬롯 부재).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Icon, Btn, Badge, useAdminShell } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";
// 대회 방식 enum(정본 ALLOWED_FORMATS) — config 카드 방식 select 옵션 source of truth
import { ALLOWED_FORMATS } from "@/lib/tournaments/division-formats";

// ── 도메인 타입(서버에서 단일 매핑된 camel) ──────────────────────────────
export type BracketDivision = {
  ruleId: string; // generate 엔드포인트용
  code: string;
  label: string;
  format: string; // 해소된 값(rule.format || tournament.format || single_elimination)
  groupCount: number;
  groupSize: number;
  advancePerGroup: number;
  // settings jsonb 원본(verbatim) — config 카드 저장 시 미편집 키 병합 보존용(없으면 빈 객체)
  settingsRaw?: Record<string, unknown>;
};

export type BracketTeam = {
  id: string; // tournamentTeam id (seedAssignments teamId)
  name: string;
  color: string;
  category: string; // 종별 코드
  seed: number | null;
  group: string | null; // groupName
  groupOrder: number | null;
};

export type BracketMatch = {
  id: string;
  divisionCode: string | null; // settings.division_code
  roundName: string | null;
  roundNumber: number | null;
  bracketPosition: number | null;
  matchNumber: number | null;
  groupName: string | null;
  status: string;
  homeName: string | null;
  awayName: string | null;
  homeSlot: string | null; // settings.homeSlotLabel
  awaySlot: string | null;
  homeScore: number;
  awayScore: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  winnerTeamId: string | null;
};

export type BracketData = {
  divisions: BracketDivision[];
  teams: BracketTeam[];
  matches: BracketMatch[];
  versionCount: number;
  maxFree: number;
};

// 정본 FORMAT_LABEL (data.jsx 동일값 + 실 schema 확장 포맷)
const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "토너먼트",
  round_robin: "풀리그",
  dual_tournament: "듀얼토너먼트",
  group_stage_knockout: "조별리그+토너먼트",
  league_advancement: "링크제",
  group_stage_with_ranking: "조별리그+동순위 순위결정전",
  full_league_knockout: "풀리그+본선",
  swiss: "스위스",
  double_elimination: "더블 엘리미네이션",
};
const fmtLabel = (f: string) => FORMAT_LABEL[f] ?? f;

const GL = (i: number) => String.fromCharCode(65 + i); // 0 -> A
// 슬롯 수(=팀 수의 2배)로 라운드명 추정. 실 roundName 우선, 폴백.
const RNAME = (n: number): string =>
  ({ 2: "결승", 4: "4강", 8: "8강", 16: "16강", 32: "32강" } as Record<number, string>)[n] ||
  `${n}강`;

// 매치 점수 노출 여부(정본 동일 톤 — 예정/부전승은 점수 숨김)
function showScore(status: string): boolean {
  return status === "completed" || status === "live" || status === "in_progress";
}

function errMsg(e: unknown): string {
  if (e instanceof AdminApiError) return e.message || "요청을 처리하지 못했습니다";
  return "요청을 처리하지 못했습니다";
}

export function BracketPanel({
  tournamentId,
  data,
}: {
  tournamentId: string;
  data: BracketData;
}) {
  const { toast } = useAdminShell();
  const router = useRouter();

  const { divisions, teams: allTeams, matches: allMatches } = data;

  const [divCode, setDivCode] = React.useState<string>(divisions[0]?.code ?? "");
  const div = divisions.find((d) => d.code === divCode) ?? divisions[0];

  // 클라 상태(추첨/시딩 진행) — 종별 전환 시 리셋
  const [seeding, setSeeding] = React.useState(false);
  const [seedDraft, setSeedDraft] = React.useState<Record<string, string>>({}); // slot -> teamId
  const [pickSlot, setPickSlot] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  React.useEffect(() => {
    setSeeding(false);
    setSeedDraft({});
    setPickSlot(null);
  }, [divCode]);

  // ── config 카드 로컬 편집 state(대회 방식·조 설정) ──────────────────
  //   정본 bracket.jsx 의 cfg(WS mock)를 실데이터 기반으로 대체.
  //   서버 props(div)를 초기값으로 두고, 종별 전환·저장 후 router.refresh 로 div 가 바뀌면 재동기화.
  //   편집 중에는 div 가 그대로라 deps 불변 → 로컬 편집값 유지.
  const [cfg, setCfg] = React.useState(() => ({
    format: div?.format ?? "single_elimination",
    groupCount: div?.groupCount ?? 2,
    groupSize: div?.groupSize ?? 4,
    advancePerGroup: div?.advancePerGroup ?? 2,
  }));
  React.useEffect(() => {
    if (!div) return;
    setCfg({
      format: div.format,
      groupCount: div.groupCount,
      groupSize: div.groupSize,
      advancePerGroup: div.advancePerGroup,
    });
    // div 의 스칼라 값 변화(종별 전환 / 저장 후 서버 refresh)에만 재동기화
  }, [div?.code, div?.format, div?.groupCount, div?.groupSize, div?.advancePerGroup]);

  if (!div) {
    // 종별 룰이 없는 대회 — 정본 Empty
    return (
      <div className="ct-emptybox">
        <Icon name="git-merge" size={36} color="var(--ink-dim)" />
        <b style={{ color: "var(--ink)" }}>등록된 종별이 없습니다</b>
        <span>대회 생성/수정에서 종별을 먼저 추가하세요.</span>
      </div>
    );
  }

  // ── 종별별 데이터 파생 ──────────────────────────────────────────────
  const single = divisions.length === 1;
  // 팀: category === code (단일 룰이면 전체 — 레거시 teamsForDivisionRule 동일)
  const divTeams = single
    ? allTeams
    : allTeams.filter((t) => t.category === divCode);
  // 매치: settings.division_code === code (단일 룰이면 전체 — 레거시 matchesForRule 보정)
  const divMatches = single
    ? allMatches
    : allMatches.filter((m) => m.divisionCode === divCode);

  const hasMatches = divMatches.length > 0;
  const hasGroups = divTeams.some((t) => t.group);
  // 추첨 완료 신호: 조 배정(group 포맷) 또는 시드 배정(단일 토너먼트) 중 하나라도 있으면 grouped.
  const hasDraw = hasGroups || divTeams.some((t) => t.seed != null);

  const isGroupFormat = div.format !== "single_elimination";
  const leagueOnly = div.format === "round_robin";
  const isDual = div.format === "dual_tournament";

  // 현재 단계(실데이터 + 클라 오버레이)
  const phase: "config" | "seeding" | "grouped" | "drawn" = hasMatches
    ? "drawn"
    : seeding
      ? "seeding"
      : hasDraw
        ? "grouped"
        : "config";

  // (슬롯 수 계산은 config 카드에서 편집 중 cfg 기준 cfgTotalSlots 로 이동 — 정본 즉시 반영)

  // 시드 배정 슬롯(조 포맷만): A1,A2.../ 단일토너먼트는 시드 UI 생략
  const seedSlots: string[] = React.useMemo(() => {
    if (!isGroupFormat) return [];
    const out: string[] = [];
    for (let g = 0; g < div.groupCount; g++)
      for (let s = 1; s <= div.groupSize; s++) out.push(GL(g) + s);
    return out;
  }, [isGroupFormat, div.groupCount, div.groupSize]);

  const seededTeamIds = new Set(Object.values(seedDraft));

  // ── 조 편성 결과(실 teams.group 기반) ──────────────────────────────
  const groups = React.useMemo(() => {
    const map = new Map<string, BracketTeam[]>();
    divTeams.forEach((t) => {
      const g = t.group || "-";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(t);
    });
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([g, ts]) => ({
        group: g,
        teams: ts.slice().sort((x, y) => (x.groupOrder ?? 0) - (y.groupOrder ?? 0)),
      }));
  }, [divTeams]);

  const groupMatchCount = (g: string) =>
    divMatches.filter((m) => m.groupName === g).length;

  // ── 토너먼트 트리(실 matches 기반 — round_number 그룹·bracket_position 정렬) ──
  const rounds = React.useMemo(() => {
    const tree = divMatches.filter((m) => m.roundNumber != null && !m.groupName);
    if (!tree.length) return [];
    const byRound = new Map<number, BracketMatch[]>();
    tree.forEach((m) => {
      const r = m.roundNumber as number;
      if (!byRound.has(r)) byRound.set(r, []);
      byRound.get(r)!.push(m);
    });
    return [...byRound.keys()]
      .sort((a, b) => a - b)
      .map((rn) => {
        const ms = byRound
          .get(rn)!
          .slice()
          .sort(
            (a, b) =>
              (a.bracketPosition ?? a.matchNumber ?? 0) -
              (b.bracketPosition ?? b.matchNumber ?? 0),
          );
        const name = ms[0]?.roundName || RNAME(ms.length * 2);
        return { name, matches: ms };
      });
  }, [divMatches]);

  // ── mutation: 추첨/시딩 ────────────────────────────────────────────
  const runDraw = async (
    mode: "random" | "seeded",
    seedAssignments?: { teamId: string; slot: string }[],
  ) => {
    if (busy) return;
    setBusy(true);
    try {
      await adminFetch(
        `/api/web/admin/tournaments/${tournamentId}/division-draw`,
        {
          method: "POST",
          // ⚠️ division-draw zod = camelCase 계약(divisionCode/groupCount/seedAssignments/teamId)
          //    → rawBody 로 snake 변환 우회(verbatim 전송). 일반 web API(snake)와 다름.
          rawBody: true,
          body: {
            divisionCode: divCode,
            groupCount: div.groupCount,
            groupSize: div.groupSize,
            mode,
            ...(seedAssignments && seedAssignments.length
              ? { seedAssignments }
              : {}),
          },
        },
      );
      toast(
        mode === "seeded"
          ? "시드 반영 + 나머지 랜덤 추첨 완료"
          : "완전 랜덤 추첨 완료",
      );
      setSeeding(false);
      setSeedDraft({});
      setPickSlot(null);
      router.refresh();
    } catch (e) {
      toast(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  // ── mutation: 발행(일정 반영) / 재생성 ─────────────────────────────
  const generate = async (clear: boolean) => {
    if (busy) return;
    setBusy(true);
    try {
      await adminFetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules/${div.ruleId}/generate`,
        { method: "POST", body: { clear } },
      );
      toast(clear ? "대진 재생성 완료" : "대진 생성 — 일정에 반영되었습니다");
      router.refresh();
    } catch (e) {
      toast(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  // ── config 카드: 편집 헬퍼 + 정본 조건부 disabled 파생 ───────────────
  // cfg 부분 갱신(정본 setCfg 동일 — 머지 패치)
  const patchCfg = (p: Partial<typeof cfg>) =>
    setCfg((c) => ({ ...c, ...p }));
  // 정본 bracket.jsx 동일 규칙(편집 중인 cfg.format 기준 — div 아님)
  const cfgIsSingle = cfg.format === "single_elimination";
  const cfgLeagueOnly = cfg.format === "round_robin"; // 풀리그 = 리그전 마무리(본선 없음)
  const cfgIsDual = cfg.format === "dual_tournament"; // 듀얼 = 조 1·2위 자동 진출
  const cfgNoAdvance = cfgIsSingle || cfgLeagueOnly; // 본선 진출 칸 비활성 조건
  const cfgIsGroup = !cfgIsSingle; // 조 개념 유무
  const cfgTotalSlots = cfgIsGroup
    ? cfg.groupCount * cfg.groupSize
    : Math.max(divTeams.length, 2);
  // 서버값(div) 대비 편집됐는지 — 저장 버튼 노출/전송 게이트
  const cfgDirty =
    cfg.format !== div.format ||
    (cfgIsGroup && cfg.groupCount !== div.groupCount) ||
    (cfgIsGroup && cfg.groupSize !== div.groupSize) ||
    (!cfgNoAdvance && !cfgIsDual && cfg.advancePerGroup !== div.advancePerGroup);

  // ── mutation: config 저장(PATCH division-rules — format/settings) ───
  //   PATCH 라우트가 format + settings(group_count/group_size/advance_per_group) 이미 지원 → API 0변경.
  //   ⚠️ settings 는 서버에서 전체 교체 → 기존 settings(ranking_format/linkage_pairs 등) 위에 병합 전송(미편집 키 보존).
  //   adminFetch 가 body 키 camel→snake 변환(deep) → settings 내부 키도 snake 로 직렬화.
  const saveCfg = async () => {
    if (busy || !cfgDirty) return;
    setBusy(true);
    try {
      // single_elimination 은 조 개념 없음 → 조설정 기본값으로 정규화(정본 비활성 입력과 일치)
      const groupCount = cfgIsGroup ? Math.max(cfg.groupCount, 1) : 1;
      const groupSize = cfgIsGroup ? Math.max(cfg.groupSize, 2) : 2;
      // advance_per_group 은 group_size 이하 강제(서버 validateDivisionSettings 동일 규칙)
      const advancePerGroup = Math.min(Math.max(cfg.advancePerGroup, 1), groupSize);
      await adminFetch(
        `/api/web/admin/tournaments/${tournamentId}/division-rules/${div.ruleId}`,
        {
          method: "PATCH",
          body: {
            format: cfg.format,
            // 기존 settings 병합 후 조설정 3키만 갱신(미편집 키 보존)
            settings: {
              ...(div.settingsRaw ?? {}),
              group_count: groupCount,
              group_size: groupSize,
              advance_per_group: advancePerGroup,
            },
          },
        },
      );
      toast("대회 방식·조 설정을 저장했습니다");
      router.refresh(); // 서버 재조회 → div 갱신 → cfg 재동기화
    } catch (e) {
      toast(errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  // 시드 슬롯 조작
  const assignSeed = (slot: string, teamId: string) => {
    setSeedDraft((d) => ({ ...d, [slot]: teamId }));
    setPickSlot(null);
  };
  const clearSeed = (slot: string) => {
    setSeedDraft((d) => {
      const n = { ...d };
      delete n[slot];
      return n;
    });
  };
  const teamName = (id: string) => divTeams.find((t) => t.id === id)?.name ?? id;

  const phaseHint =
    phase === "drawn"
      ? leagueOnly
        ? "조편성 완료 — 리그전으로 진행됩니다"
        : "대진 생성 완료 — 일정 탭에서 경기 일정을 관리하세요"
      : phase === "grouped"
        ? "조편성 완료 — '일정에 반영'으로 대진을 생성하세요"
        : phase === "seeding"
          ? "시드 팀을 조·슬롯에 배정한 뒤 나머지를 랜덤 추첨하세요"
          : "완전 랜덤 또는 시드 배정 후 랜덤으로 추첨하세요";

  const tooFewTeams = divTeams.length < 2;

  return (
    <div>
      {/* 종별 선택 */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: 6,
          marginBottom: 14,
        }}
      >
        <span style={{ fontSize: 12, color: "var(--ink-mute)", marginRight: 2 }}>
          종별:
        </span>
        {divisions.map((r) => {
          const on = r.code === divCode;
          const rMatches = single
            ? allMatches.length > 0
            : allMatches.some((m) => m.divisionCode === r.code);
          return (
            <button
              key={r.code + (on ? "-on" : "")}
              className="ts-chip"
              style={
                on
                  ? {
                      borderColor: "var(--primary)",
                      background: "var(--primary-weak)",
                      color: "var(--primary)",
                    }
                  : undefined
              }
              onClick={() => setDivCode(r.code)}
            >
              {r.label}
              {rMatches && <Icon name="check" size={13} />}
            </button>
          );
        })}
      </div>

      {/* 대회 방식 · 조 설정(조건부 편집 가능 — 정본 bracket.jsx L232-251) */}
      <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}
        >
          <span className="ct-headicon">
            <Icon name="settings-2" size={18} />
          </span>
          <div>
            <h3 style={{ fontSize: 14 }}>대회 방식 · 조 설정</h3>
            <p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
              대회 생성 시 입력값 — 여기서 확인·수정할 수 있습니다
            </p>
          </div>
        </div>
        <div className="bk-cfg-grid">
          {/* 대회 방식 — 항상 편집 가능(정본: disabled 없음) */}
          <label className="ts-field" style={{ margin: 0 }}>
            <span className="ts-field__label">대회 방식</span>
            <select
              className="ts-select"
              value={cfg.format}
              onChange={(e) => patchCfg({ format: e.target.value })}
            >
              {ALLOWED_FORMATS.map((f) => (
                <option key={f} value={f}>
                  {fmtLabel(f)}
                </option>
              ))}
            </select>
          </label>
          {/* 조 수 — 토너먼트(single_elimination) 시 비활성(정본 규칙) */}
          <label
            className="ts-field"
            style={{ margin: 0, opacity: cfgIsSingle ? 0.45 : 1 }}
          >
            <span className="ts-field__label">조 수</span>
            <input
              className="ts-input"
              type="number"
              min={1}
              max={8}
              value={cfg.groupCount}
              disabled={cfgIsSingle}
              onChange={(e) => patchCfg({ groupCount: Math.max(+e.target.value || 1, 1) })}
              style={{ padding: "9px 11px" }}
            />
          </label>
          {/* 조별 팀수 — 토너먼트(single_elimination) 시 비활성(정본 규칙) */}
          <label
            className="ts-field"
            style={{ margin: 0, opacity: cfgIsSingle ? 0.45 : 1 }}
          >
            <span className="ts-field__label">조별 팀수</span>
            <input
              className="ts-input"
              type="number"
              min={2}
              max={8}
              value={cfg.groupSize}
              disabled={cfgIsSingle}
              onChange={(e) => patchCfg({ groupSize: Math.max(+e.target.value || 2, 2) })}
              style={{ padding: "9px 11px" }}
            />
          </label>
          {/* 본선 진출(조별) — 본선 없음(토너먼트/리그전) 또는 듀얼(자동 2) 시 비활성(정본 규칙) */}
          <label
            className="ts-field"
            style={{ margin: 0, opacity: cfgNoAdvance || cfgIsDual ? 0.55 : 1 }}
          >
            <span className="ts-field__label">본선 진출(조별)</span>
            <input
              className="ts-input"
              type="number"
              min={1}
              max={cfg.groupSize}
              value={cfgLeagueOnly ? "" : cfgIsDual ? 2 : cfg.advancePerGroup}
              placeholder={cfgLeagueOnly ? "리그전" : undefined}
              disabled={cfgNoAdvance || cfgIsDual}
              onChange={(e) => patchCfg({ advancePerGroup: Math.max(+e.target.value || 1, 1) })}
              style={{ padding: "9px 11px" }}
            />
          </label>
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 6,
            marginTop: 12,
            alignItems: "center",
          }}
        >
          {/* 뱃지는 편집 중 cfg 기준으로 즉시 반영(정본 동일) */}
          <Badge tone="grey">{fmtLabel(cfg.format)}</Badge>
          <Badge tone="grey">참가 {divTeams.length}팀</Badge>
          <Badge tone="grey">
            슬롯 {cfgTotalSlots}
            {divTeams.length < cfgTotalSlots
              ? ` · 부전승 ${cfgTotalSlots - divTeams.length}`
              : ""}
          </Badge>
          {cfgLeagueOnly && <Badge tone="grey">리그전 마무리 · 본선 진출 없음</Badge>}
          {cfgIsDual && <Badge tone="grey">조별 더블엘리미 · 1·2위 진출</Badge>}
          {/* 변경분 저장(PATCH division-rules) — dirty 시에만 노출 */}
          {cfgDirty && (
            <Btn
              size="sm"
              icon="save"
              onClick={saveCfg}
              disabled={busy}
              style={{ marginLeft: "auto" }}
            >
              변경사항 저장
            </Btn>
          )}
        </div>
      </div>

      {/* 조편성 컨트롤 */}
      <div
        className="ts-card ts-card--flat"
        style={{
          marginBottom: 14,
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div>
          <p style={{ fontSize: 13, fontWeight: 700 }}>조편성</p>
          <p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 2 }}>
            {phaseHint}
          </p>
        </div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {phase === "config" && (
            <>
              <Btn
                variant="secondary"
                size="sm"
                icon="shuffle"
                onClick={() => runDraw("random")}
                disabled={tooFewTeams || busy}
              >
                완전 랜덤 추첨
              </Btn>
              {isGroupFormat && (
                <Btn
                  size="sm"
                  icon="list-ordered"
                  onClick={() => setSeeding(true)}
                  disabled={tooFewTeams || busy}
                >
                  시드 배정
                </Btn>
              )}
            </>
          )}
          {phase === "seeding" && (
            <>
              <Btn
                variant="secondary"
                size="sm"
                icon="x"
                onClick={() => {
                  setSeeding(false);
                  setSeedDraft({});
                  setPickSlot(null);
                }}
                disabled={busy}
              >
                시드 취소
              </Btn>
              <Btn
                size="sm"
                icon="shuffle"
                onClick={() =>
                  runDraw(
                    "seeded",
                    Object.entries(seedDraft).map(([slot, teamId]) => ({
                      teamId,
                      slot,
                    })),
                  )
                }
                disabled={busy}
              >
                시드 완료 → 랜덤 추첨
              </Btn>
            </>
          )}
          {phase === "grouped" && (
            <>
              <Btn
                variant="secondary"
                size="sm"
                icon="rotate-ccw"
                onClick={() => runDraw("random")}
                disabled={busy}
              >
                다시 추첨
              </Btn>
              <Btn
                size="sm"
                icon="calendar-plus"
                onClick={() => generate(false)}
                disabled={busy}
              >
                일정에 반영
              </Btn>
            </>
          )}
          {phase === "drawn" && (
            <Btn
              variant="secondary"
              size="sm"
              icon="rotate-ccw"
              onClick={() => generate(true)}
              disabled={busy}
            >
              다시 생성
            </Btn>
          )}
        </div>
      </div>

      {/* 시드 배정 모드 */}
      {phase === "seeding" && (
        <div className="ts-card ts-card--flat" style={{ marginBottom: 14 }}>
          <h4 className="bk-subh">시드 슬롯 — 클릭해 팀 배정 (예: A1·B1·C1·D1)</h4>
          <div className="bk-groups">
            {Array.from({ length: Math.max(div.groupCount, 1) }).map((_, g) => (
              <div key={g} className="bk-group">
                <div className="bk-group__name">{GL(g)}조</div>
                {seedSlots
                  .filter((s) => s[0] === GL(g))
                  .map((sl) => (
                    <div key={sl} className="bk-slot" data-seeded={!!seedDraft[sl]}>
                      <span className="bk-slot__lbl">{sl}</span>
                      {seedDraft[sl] ? (
                        <>
                          <span className="bk-slot__team">{teamName(seedDraft[sl])}</span>
                          <button className="sc-del" onClick={() => clearSeed(sl)}>
                            <Icon name="x" size={13} />
                          </button>
                        </>
                      ) : (
                        <button
                          className="bk-slot__assign"
                          onClick={() => setPickSlot(pickSlot === sl ? null : sl)}
                        >
                          {pickSlot === sl ? "팀 선택…" : "시드 배정"}
                        </button>
                      )}
                      {pickSlot === sl && (
                        <div className="bk-pick">
                          {divTeams
                            .filter((t) => !seededTeamIds.has(t.id))
                            .map((t) => (
                              <button key={t.id} onClick={() => assignSeed(sl, t.id)}>
                                <span
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    background: t.color,
                                    flex: "0 0 auto",
                                  }}
                                />
                                {t.name}
                              </button>
                            ))}
                          {divTeams.filter((t) => !seededTeamIds.has(t.id)).length ===
                            0 && (
                            <span
                              style={{ fontSize: 12, color: "var(--ink-dim)", padding: 8 }}
                            >
                              남은 팀 없음
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            ))}
          </div>
          <p style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 10 }}>
            배정한 시드 {Object.keys(seedDraft).length}팀은 고정되고, "시드 완료 → 랜덤 추첨"으로
            나머지 {Math.max(divTeams.length - Object.keys(seedDraft).length, 0)}팀이 빈 슬롯에 랜덤
            배정됩니다.
          </p>
        </div>
      )}

      {/* 조 편성 결과(실 teams.group) */}
      {(phase === "grouped" || phase === "drawn") && hasGroups && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <h4 className="bk-subh" style={{ margin: 0 }}>
              조 편성
              {leagueOnly && (
                <span
                  style={{
                    fontWeight: 500,
                    color: "var(--ink-dim)",
                    textTransform: "none",
                    letterSpacing: 0,
                  }}
                >
                  {" "}
                  · 리그전
                </span>
              )}
            </h4>
            {/* 리그전(round_robin)은 토너먼트 트리가 없어 별도 발행 진입점 필요 —
                정본 bracket.jsx:302 "일정에 반영"(publish) → 패널의 generate(false) 재사용 */}
            {leagueOnly && phase === "drawn" && (
              <Btn
                size="sm"
                icon="calendar-plus"
                onClick={() => generate(false)}
                disabled={busy}
              >
                일정에 반영
              </Btn>
            )}
          </div>
          <div className="bk-groups" style={{ marginBottom: 16 }}>
            {groups.map(({ group, teams: gteams }) => (
              <div key={group} className="bk-group">
                <div className="bk-group__name">{group === "-" ? "미배정" : `${group}조`}</div>
                {gteams.map((t, i) => (
                  <div key={t.id} className="bk-slot">
                    <span className="bk-slot__lbl">
                      {group === "-" ? i + 1 : `${group}${i + 1}`}
                    </span>
                    <span className="bk-slot__team">{t.name}</span>
                  </div>
                ))}
                {group !== "-" && (
                  <div className="bk-group__games">조별 {groupMatchCount(group)}경기</div>
                )}
              </div>
            ))}
          </div>
        </>
      )}

      {/* 조별 더블 엘리미네이션(듀얼토너먼트) — 정본 bracket.jsx:327-348 박제.
          정본 mock window.dualGroupStages(L,size) 대신 실 조별 매치(groupName===조)를 표시 */}
      {phase === "drawn" && isDual && (
        <>
          <h4 className="bk-subh">
            조별 더블 엘리미네이션{" "}
            <span
              style={{
                fontWeight: 500,
                color: "var(--ink-dim)",
                textTransform: "none",
                letterSpacing: 0,
              }}
            >
              · 1·2경기 → 승자전/패자전 → 조 최종전
            </span>
          </h4>
          <div className="bk-groups" style={{ marginBottom: 16 }}>
            {groups
              .filter(({ group }) => group !== "-")
              .map(({ group }) => {
                // 조별 매치(groupName === 조) = 더블엘리미 5경기 구조 — matchNumber→bracketPosition 순
                const dgames = divMatches
                  .filter((m) => m.groupName === group)
                  .slice()
                  .sort(
                    (a, b) =>
                      (a.matchNumber ?? a.bracketPosition ?? 0) -
                      (b.matchNumber ?? b.bracketPosition ?? 0),
                  );
                return (
                  <div key={group} className="bk-group">
                    <div className="bk-group__name">{group}조</div>
                    {dgames.map((m) => {
                      // 조 최종전(2위 결정) = roundName에 "최종" 포함 → 정본 stage===2 강조
                      const isFinal = /최종/.test(m.roundName || "");
                      const label = m.roundName
                        ? `${group}조 ${m.roundName}`
                        : `${group}조 ${m.matchNumber ?? ""}경기`;
                      return (
                        <div key={m.id} className="bk-dualrow" data-final={isFinal}>
                          <span className="bk-dualrow__lbl">{label}</span>
                          <span className="bk-dualrow__vs">
                            <b>{m.homeName || m.homeSlot || "미정"}</b>
                            <i>대</i>
                            <b>{m.awayName || m.awaySlot || "미정"}</b>
                          </span>
                        </div>
                      );
                    })}
                    <div className="bk-group__games">
                      승자전 승자 = 1위 · 최종전 승자 = 2위
                    </div>
                  </div>
                );
              })}
          </div>
        </>
      )}

      {/* 시드 순서(단일 토너먼트 — 조 없음·생성 전) */}
      {phase === "grouped" && !hasGroups && (
        <>
          <h4 className="bk-subh">시드 순서</h4>
          <div className="bk-group" style={{ marginBottom: 16, maxWidth: 300 }}>
            {[...divTeams]
              .sort((a, b) => (a.seed ?? 99) - (b.seed ?? 99))
              .map((t, i) => (
                <div key={t.id} className="bk-slot">
                  <span className="bk-slot__lbl">{i + 1}</span>
                  <span className="bk-slot__team">{t.name}</span>
                </div>
              ))}
          </div>
        </>
      )}

      {/* 토너먼트 트리(실 matches) */}
      {phase === "drawn" && rounds.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 8,
              marginBottom: 8,
              flexWrap: "wrap",
            }}
          >
            <h4 className="bk-subh" style={{ margin: 0 }}>
              토너먼트 트리
            </h4>
          </div>
          <div className="bk-tree">
            {rounds.map((rd, ri) => (
              <div key={ri} className="bk-round">
                <div className="bk-round__name">
                  <span>{rd.name}</span>
                </div>
                <div className="bk-round__body">
                  {rd.matches.map((m) => {
                    const sc = showScore(m.status);
                    const homeWin = !!m.winnerTeamId && m.winnerTeamId === m.homeTeamId;
                    const awayWin = !!m.winnerTeamId && m.winnerTeamId === m.awayTeamId;
                    return (
                      <div key={m.id} className="bk-cell">
                        <div className="bk-match">
                          <div
                            className="bk-seedrow"
                            data-winner={homeWin ? "true" : undefined}
                          >
                            <span>{m.homeName || m.homeSlot || "미정"}</span>
                            {sc && <span className="bk-seedrow__score">{m.homeScore}</span>}
                          </div>
                          <div
                            className="bk-seedrow"
                            data-winner={awayWin ? "true" : undefined}
                          >
                            <span>{m.awayName || m.awaySlot || "미정"}</span>
                            {sc && <span className="bk-seedrow__score">{m.awayScore}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 조편성 전 안내(정본 Empty) */}
      {phase === "config" && (
        <div className="ct-emptybox">
          <Icon name="git-merge" size={36} color="var(--ink-dim)" />
          <b style={{ color: "var(--ink)" }}>아직 조편성 전입니다</b>
          <span>
            {tooFewTeams ? (
              <>
                승인된 참가팀이 2팀 이상이어야 추첨할 수 있습니다. 참가팀 탭에서 신청을
                승인하세요.
              </>
            ) : (
              <>
                위에서 대회 방식·조 설정을 확인한 뒤 <b>완전 랜덤 추첨</b> 또는{" "}
                <b>시드 배정</b>을 진행하세요. 조편성 후 <b>일정에 반영</b>하면 대회 방식에 따라
                대진이 생성됩니다.
              </>
            )}
          </span>
        </div>
      )}
    </div>
  );
}
