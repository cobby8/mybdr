"use client";

// ============================================================
// referee-console/assignments/_assignment-workflow.tsx — 경기 배정 관리 (클라 워크플로우)
//   ③-A 컷오버 블로커: 레거시 (referee)/referee/admin/assignments/page.tsx 워크플로우를
//   v2(Toss) 디자인으로 1:1 포팅. "읽기 드로어"였던 v2 콘솔을 배정 생성/상태변경/삭제 가능하게.
//
//   흐름(레거시 동일):
//     1단계 대회 검색/선택 → 2단계 경기 목록(경기별 배정 + 선정풀) → 3단계 배정 추가 모달
//
//   ★백엔드 0변경 — 기존 referee-admin API만 재사용:
//     - GET  /api/web/referee-admin/tournaments?q=&limit=30        (대회 검색)
//     - GET  /api/web/referee-admin/tournaments/[id]/matches        (경기+배정+available_pools)
//     - POST /api/web/referee-admin/assignments                     (배정 생성)
//     - PATCH/DELETE /api/web/referee-admin/assignments/[id]        (상태변경/삭제)
//
//   ★권한 스코프 = 글로벌 super(layout.tsx). 단 mutation 은 referee-admin API 의
//     getAssociationAdmin() sentinel 이 "첫 자동선택 협회"로 동작 → 그 협회 소속 심판/풀만
//     생성·수정 가능, 타협회는 403. 에러는 모달에 그대로 노출(데이터~0 수용·PM 결정).
//
//   ★데이터 변환 = adminFetch 단일 변환점. 응답 snake→camel(호출부 camel) / 요청 camel→snake(API snake 계약).
//     mutation 성공 시 fetchMatches 재조회(클라 로드라 router.refresh 만으론 갱신 안 됨)
//     + router.refresh()(layout nav 배지 = assigned count 갱신).
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Btn, Badge, Modal, Icon } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";
import { assignRoleLabel, assignStatusBadge, fmtDateTime } from "../_referee-data";

// ── 타입(adminFetch 응답 = snake→camel 변환 후) ──
type Tournament = {
  id: string; // Tournament.id = UUID(String)
  name: string;
  status: string | null;
  startDate: string | null;
  endDate: string | null;
  venueName: string | null;
};

type AssignmentRow = {
  id: string | number; // BigInt → JSON string|number
  refereeId: string | number;
  refereeName: string;
  role: string;
  status: string;
  memo: string | null;
  isOwnAssociation: boolean; // 우리(자동선택) 협회 소속 — true 만 액션 노출
};

type AvailablePool = {
  id: string | number;
  refereeId: string | number;
  name: string;
  level: string | null;
  isChief: boolean;
  roleType: string;
};

type MatchRow = {
  id: string | number;
  scheduledAt: string | null;
  roundName: string | null;
  status: string | null;
  courtNumber: string | null;
  homeTeamName: string | null;
  awayTeamName: string | null;
  assignments: AssignmentRow[];
  availablePools: AvailablePool[];
};

// 역할 옵션(셀렉트) — 라벨은 _referee-data assignRoleLabel 과 동일 도메인.
const ROLE_OPTIONS: { value: "main" | "sub" | "recorder" | "timer"; label: string }[] = [
  { value: "main", label: "주심" },
  { value: "sub", label: "부심" },
  { value: "recorder", label: "기록" },
  { value: "timer", label: "타이머" },
];

// 일시 표시 — fmtDateTime 은 Date|null 기대. ISO 문자열을 Date 로 변환.
function fmtAt(iso: string | null): string {
  return fmtDateTime(iso ? new Date(iso) : null);
}

// 위험 액션 공통 에러박스 스타일(verify/settlements 패턴 1:1).
const errorBoxStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--danger)",
  background: "var(--danger-weak, rgba(240,68,82,0.08))",
  border: "1px solid var(--danger)",
  borderRadius: 6,
  padding: "10px 12px",
  lineHeight: 1.5,
};

export function AssignmentWorkflow() {
  const router = useRouter();

  // ── 1단계: 대회 검색/선택 ──
  const [searchQ, setSearchQ] = React.useState("");
  const [tournaments, setTournaments] = React.useState<Tournament[]>([]);
  const [loadingT, setLoadingT] = React.useState(false);
  const [selected, setSelected] = React.useState<Tournament | null>(null);

  // ── 2단계: 경기 목록 ──
  const [matches, setMatches] = React.useState<MatchRow[]>([]);
  const [loadingM, setLoadingM] = React.useState(false);

  // 공통 로드 에러
  const [pageError, setPageError] = React.useState<string | null>(null);

  // ── 3단계: 배정 추가 모달 ──
  const [createMatch, setCreateMatch] = React.useState<MatchRow | null>(null);
  const [pickedPoolId, setPickedPoolId] = React.useState<string>("");
  const [formRole, setFormRole] = React.useState<"main" | "sub" | "recorder" | "timer">("main");
  const [formMemo, setFormMemo] = React.useState("");
  const [creating, setCreating] = React.useState(false);
  const [createError, setCreateError] = React.useState<string | null>(null);

  // ── 액션 모달(확정/삭제 2단계 확인 + 에러 노출) ──
  const [action, setAction] = React.useState<
    | { kind: "confirm" | "delete"; assignment: AssignmentRow; match: MatchRow }
    | null
  >(null);
  const [actionBusy, setActionBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // ── 1단계: 대회 검색(adminFetch GET — body 없음 → GET) ──
  const fetchTournaments = React.useCallback(async (q: string) => {
    setLoadingT(true);
    setPageError(null);
    try {
      const qs = new URLSearchParams({ limit: "30" });
      if (q) qs.set("q", q);
      const data = await adminFetch<{ items: Tournament[] }>(
        `/api/web/referee-admin/tournaments?${qs.toString()}`
      );
      setTournaments(data.items ?? []);
    } catch (e) {
      setPageError(
        e instanceof AdminApiError ? e.message : "대회 목록을 불러오지 못했습니다."
      );
      setTournaments([]);
    } finally {
      setLoadingT(false);
    }
  }, []);

  // 최초 로드 + 검색 디바운스(300ms)
  React.useEffect(() => {
    const timer = setTimeout(() => fetchTournaments(searchQ), 300);
    return () => clearTimeout(timer);
  }, [searchQ, fetchTournaments]);

  // ── 2단계: 경기 목록 로드 ──
  const fetchMatches = React.useCallback(async (tournamentId: string) => {
    setLoadingM(true);
    setPageError(null);
    try {
      const data = await adminFetch<{ items: MatchRow[] }>(
        `/api/web/referee-admin/tournaments/${tournamentId}/matches`
      );
      setMatches(data.items ?? []);
    } catch (e) {
      setPageError(
        e instanceof AdminApiError ? e.message : "경기 목록을 불러오지 못했습니다."
      );
      setMatches([]);
    } finally {
      setLoadingM(false);
    }
  }, []);

  React.useEffect(() => {
    if (selected) fetchMatches(selected.id);
    else setMatches([]);
  }, [selected, fetchMatches]);

  // ── 3단계: 배정 추가 모달 열기/닫기 ──
  function openCreate(match: MatchRow) {
    setCreateMatch(match);
    setPickedPoolId("");
    setFormRole("main");
    setFormMemo("");
    setCreateError(null);
  }
  function closeCreate() {
    if (creating) return;
    setCreateMatch(null);
  }

  // 이미 배정된 심판 제외한 선택 가능 풀
  function selectablePools(m: MatchRow): AvailablePool[] {
    const assigned = new Set(m.assignments.map((a) => String(a.refereeId)));
    return m.availablePools.filter((p) => !assigned.has(String(p.refereeId)));
  }

  // ── 배정 생성(POST) ──
  async function submitCreate() {
    if (!createMatch || creating) return;
    const pool = createMatch.availablePools.find(
      (p) => String(p.id) === pickedPoolId
    );
    if (!pool) {
      setCreateError("심판을 선택해 주세요.");
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      // adminFetch: camel→snake 자동(refereeId→referee_id 등). POST 계약 일치.
      await adminFetch(`/api/web/referee-admin/assignments`, {
        method: "POST",
        body: {
          refereeId: pool.refereeId,
          tournamentMatchId: String(createMatch.id),
          role: formRole,
          memo: formMemo.trim() || null,
          poolId: pool.id, // 서버 4중 검증(풀·심판·대회·일자) 후 저장
        },
      });
      setCreating(false);
      setCreateMatch(null);
      if (selected) await fetchMatches(selected.id); // 클라 로드 → 직접 재조회
      router.refresh(); // layout nav 배지(assigned count) 갱신
    } catch (e) {
      setCreating(false);
      setCreateError(
        e instanceof AdminApiError ? e.message : "배정 생성에 실패했습니다."
      );
    }
  }

  // ── 액션 모달 열기/닫기 ──
  function openAction(
    kind: "confirm" | "delete",
    assignment: AssignmentRow,
    match: MatchRow
  ) {
    setAction({ kind, assignment, match });
    setActionError(null);
  }
  function closeAction() {
    if (actionBusy) return;
    setAction(null);
    setActionError(null);
  }

  // ── 상태변경(PATCH) / 삭제(DELETE) 실행 ──
  async function runAction() {
    if (!action || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    const id = action.assignment.id;
    try {
      if (action.kind === "confirm") {
        // body { status } — 단일단어라 camel/snake 동일.
        await adminFetch(`/api/web/referee-admin/assignments/${id}`, {
          method: "PATCH",
          body: { status: "confirmed" },
        });
      } else {
        // 삭제 — 정산 연동(paid/pending/scheduled/refunded) 시 API 가 409 거부 → 메시지 노출.
        await adminFetch(`/api/web/referee-admin/assignments/${id}`, {
          method: "DELETE",
        });
      }
      setActionBusy(false);
      setAction(null);
      if (selected) await fetchMatches(selected.id);
      router.refresh();
    } catch (e) {
      setActionBusy(false);
      setActionError(
        e instanceof AdminApiError
          ? e.message
          : action.kind === "delete"
            ? "배정 삭제에 실패했습니다."
            : "상태 변경에 실패했습니다."
      );
    }
  }

  // 역할별 배정 수 요약(주/부/경기원).
  function summarize(list: AssignmentRow[]) {
    const c = { main: 0, sub: 0, recorder: 0, timer: 0 };
    for (const a of list) if (a.role in c) c[a.role as keyof typeof c] += 1;
    return c;
  }

  return (
    <div>
      {/* ── 페이지 헤더(ts-ph) ── */}
      <div className="ts-ph">
        <div className="ts-ph__eyebrow">심판 콘솔</div>
        <div className="ts-ph__title">경기 배정 관리</div>
        <div className="ts-ph__sub">
          대회를 선택한 뒤 경기별로 심판을 배정하세요. 심판은 해당 일자에 선정된
          인원 중에서만 고를 수 있습니다.
        </div>
      </div>

      {pageError && (
        <div style={{ ...errorBoxStyle, marginBottom: 20 }}>{pageError}</div>
      )}

      {/* ===================== 1단계: 대회 선택 ===================== */}
      <div className="ts-card" style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
            1. 대회 선택
          </h2>
          {selected && (
            <Btn variant="ghost" size="sm" icon="x" onClick={() => setSelected(null)}>
              선택 해제
            </Btn>
          )}
        </div>

        {/* 검색 인풋 */}
        <div style={{ position: "relative", marginBottom: selected ? 16 : 0 }}>
          <input
            className="ts-input"
            type="text"
            placeholder="대회명 검색"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            style={{ paddingLeft: 44 }}
          />
          <span
            style={{
              position: "absolute",
              left: 14,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--ink-mute)",
              pointerEvents: "none",
            }}
          >
            <Icon name="search" size={18} />
          </span>
        </div>

        {/* 선택된 대회 / 목록 */}
        {selected ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "14px 16px",
              borderRadius: "var(--radius-input)",
              background: "var(--primary-weak)",
            }}
          >
            <span style={{ color: "var(--primary)" }}>
              <Icon name="trophy" size={22} />
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--ink)" }}>
                {selected.name}
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-mute)", marginTop: 2 }}>
                {selected.status ?? "-"} · {fmtAt(selected.startDate)}
                {selected.venueName ? ` · ${selected.venueName}` : ""}
              </div>
            </div>
          </div>
        ) : loadingT ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-mute)" }}>
            불러오는 중...
          </div>
        ) : tournaments.length === 0 ? (
          <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-mute)" }}>
            검색된 대회가 없습니다.
          </div>
        ) : (
          <div
            style={{
              marginTop: 16,
              maxHeight: 320,
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: 6,
            }}
          >
            {tournaments.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelected(t)}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  width: "100%",
                  textAlign: "left",
                  padding: "12px 14px",
                  borderRadius: "var(--radius-input)",
                  border: "1px solid var(--border)",
                  background: "var(--card)",
                  cursor: "pointer",
                  fontFamily: "var(--ff)",
                }}
              >
                <span style={{ color: "var(--ink-mute)", marginTop: 1 }}>
                  <Icon name="trophy" size={16} />
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "var(--ink)" }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12.5, color: "var(--ink-mute)", marginTop: 2 }}>
                    {t.status ?? "-"} · {fmtAt(t.startDate)}
                    {t.venueName ? ` · ${t.venueName}` : ""}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ===================== 2단계: 경기 목록 ===================== */}
      {selected && (
        <div className="ts-card">
          <h2
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: "var(--ink)",
              marginBottom: 16,
            }}
          >
            2. 경기 목록 ({matches.length}건)
          </h2>

          {loadingM ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-mute)" }}>
              불러오는 중...
            </div>
          ) : matches.length === 0 ? (
            <div style={{ padding: "32px 0", textAlign: "center", color: "var(--ink-mute)" }}>
              이 대회에는 등록된 경기가 없습니다.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {matches.map((m) => {
                const counts = summarize(m.assignments);
                const remaining = selectablePools(m).length;
                const poolTotal = m.availablePools.length;
                const canAdd = remaining > 0;
                return (
                  <div
                    key={String(m.id)}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: 16,
                      padding: 16,
                      background: "var(--grey-50)",
                    }}
                  >
                    {/* 경기 헤더 */}
                    <div
                      style={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        gap: 12,
                        marginBottom: 12,
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 200 }}>
                        <div style={{ fontSize: 12.5, color: "var(--ink-mute)" }}>
                          {fmtAt(m.scheduledAt)}
                          {m.roundName ? ` · ${m.roundName}` : ""}
                          {m.courtNumber ? ` · 코트 ${m.courtNumber}` : ""}
                        </div>
                        <div
                          style={{
                            fontSize: 15,
                            fontWeight: 700,
                            color: "var(--ink)",
                            marginTop: 4,
                          }}
                        >
                          {m.homeTeamName ?? "TBD"} vs {m.awayTeamName ?? "TBD"}
                        </div>
                        <div style={{ fontSize: 12, color: "var(--ink-mute)", marginTop: 4 }}>
                          선정 풀 {poolTotal}명 · 가용 {remaining}명
                        </div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <Badge tone="grey">
                          주 {counts.main} / 부 {counts.sub} / 경기원{" "}
                          {counts.recorder + counts.timer}
                        </Badge>
                        <Btn
                          variant="primary"
                          size="sm"
                          icon="plus"
                          disabled={!canAdd}
                          onClick={() => openCreate(m)}
                          title={
                            canAdd
                              ? undefined
                              : poolTotal === 0
                                ? "이 일자에 선정된 인원이 없습니다"
                                : "선정 인원이 모두 배정되었습니다"
                          }
                        >
                          배정 추가
                        </Btn>
                      </div>
                    </div>

                    {/* 빈 풀 / 전부 배정됨 안내 */}
                    {poolTotal === 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12.5,
                          padding: "8px 10px",
                          marginBottom: 10,
                          borderRadius: 10,
                          background: "var(--warn-weak)",
                          color: "var(--warn)",
                        }}
                      >
                        <Icon name="info" size={16} />
                        이 일자에 선정된 인원이 없습니다. 먼저 일자별 운영에서 인원을
                        선정하세요.
                      </div>
                    )}
                    {poolTotal > 0 && remaining === 0 && (
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          fontSize: 12.5,
                          padding: "8px 10px",
                          marginBottom: 10,
                          borderRadius: 10,
                          background: "var(--grey-100)",
                          color: "var(--ink-mute)",
                        }}
                      >
                        <Icon name="circle-check" size={16} />
                        모든 선정 인원이 이미 배정되었습니다.
                      </div>
                    )}

                    {/* 배정 목록 */}
                    {m.assignments.length === 0 ? (
                      <div style={{ fontSize: 12.5, color: "var(--ink-mute)", padding: "4px 0" }}>
                        아직 배정된 심판이 없습니다.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                        {m.assignments.map((a) => {
                          const st = assignStatusBadge(a.status);
                          return (
                            <div
                              key={String(a.id)}
                              style={{
                                display: "flex",
                                flexWrap: "wrap",
                                alignItems: "center",
                                gap: 8,
                                padding: "10px 12px",
                                borderRadius: 10,
                                background: "var(--card)",
                                border: "1px solid var(--border)",
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 13,
                                  fontWeight: 800,
                                  color: "var(--primary)",
                                }}
                              >
                                {assignRoleLabel(a.role)}
                              </span>
                              <span style={{ fontSize: 13.5, color: "var(--ink)" }}>
                                {a.refereeName}
                              </span>
                              {!a.isOwnAssociation && (
                                <Badge tone="grey">타협회</Badge>
                              )}
                              <Badge tone={st.tone}>{st.label}</Badge>
                              <div
                                style={{
                                  marginLeft: "auto",
                                  display: "flex",
                                  gap: 6,
                                }}
                              >
                                {/* 우리(자동선택) 협회 배정만 액션 노출 — 타협회는 API 403 */}
                                {a.isOwnAssociation && (
                                  <>
                                    {a.status !== "confirmed" && (
                                      <Btn
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => openAction("confirm", a, m)}
                                      >
                                        확정
                                      </Btn>
                                    )}
                                    <Btn
                                      variant="danger"
                                      size="sm"
                                      onClick={() => openAction("delete", a, m)}
                                    >
                                      삭제
                                    </Btn>
                                  </>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== 배정 추가 모달 ===================== */}
      <Modal
        open={createMatch !== null}
        onClose={closeCreate}
        title="배정 추가"
        sub={
          createMatch
            ? `${fmtAt(createMatch.scheduledAt)} · ${createMatch.homeTeamName ?? "TBD"} vs ${createMatch.awayTeamName ?? "TBD"}`
            : undefined
        }
        foot={
          createMatch ? (
            <>
              <Btn variant="secondary" onClick={closeCreate} disabled={creating}>
                취소
              </Btn>
              <Btn
                variant="primary"
                onClick={submitCreate}
                disabled={creating || !pickedPoolId}
              >
                {creating ? "저장 중..." : "배정 확정"}
              </Btn>
            </>
          ) : undefined
        }
      >
        {createMatch && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {/* 심판 선택(선정풀 중) */}
            <div className="ts-field">
              <label className="ts-field__label">심판 (선정된 인원 중에서만 선택)</label>
              {selectablePools(createMatch).length === 0 ? (
                <div style={{ fontSize: 13.5, color: "var(--warn)" }}>
                  배정 가능한 선정 인원이 없습니다.
                </div>
              ) : (
                <select
                  className="ts-select"
                  value={pickedPoolId}
                  onChange={(e) => {
                    setPickedPoolId(e.target.value);
                    setCreateError(null);
                  }}
                >
                  <option value="">심판 선택</option>
                  {selectablePools(createMatch).map((p) => (
                    <option key={String(p.id)} value={String(p.id)}>
                      {p.name}
                      {p.isChief ? " · 배정장" : ""}
                      {p.roleType === "game_official" ? " (경기원)" : ""}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 역할 */}
            <div className="ts-field">
              <label className="ts-field__label">역할</label>
              <select
                className="ts-select"
                value={formRole}
                onChange={(e) =>
                  setFormRole(e.target.value as typeof formRole)
                }
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 메모 */}
            <div className="ts-field">
              <label className="ts-field__label">메모</label>
              <textarea
                className="ts-input"
                value={formMemo}
                onChange={(e) => setFormMemo(e.target.value)}
                rows={2}
                placeholder="선택사항"
                style={{ resize: "vertical", minHeight: 60 }}
              />
            </div>

            {createError && <div style={errorBoxStyle}>{createError}</div>}
          </div>
        )}
      </Modal>

      {/* ===================== 확정/삭제 확인 모달 ===================== */}
      <Modal
        open={action !== null}
        onClose={closeAction}
        title={action?.kind === "delete" ? "배정 삭제" : "배정 확정"}
        sub={
          action
            ? `${assignRoleLabel(action.assignment.role)} · ${action.assignment.refereeName}`
            : undefined
        }
        foot={
          action ? (
            <>
              <Btn variant="secondary" onClick={closeAction} disabled={actionBusy}>
                취소
              </Btn>
              <Btn
                variant={action.kind === "delete" ? "danger" : "primary"}
                onClick={runAction}
                disabled={actionBusy}
              >
                {actionBusy ? "처리 중..." : "확인"}
              </Btn>
            </>
          ) : undefined
        }
      >
        {action && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.5 }}>
              {action.kind === "delete" ? (
                <>이 배정을 삭제하시겠습니까?</>
              ) : (
                <>이 배정을 <b>확정</b> 처리할까요?</>
              )}
            </div>
            {actionError && <div style={errorBoxStyle}>{actionError}</div>}
          </div>
        )}
      </Modal>
    </div>
  );
}
