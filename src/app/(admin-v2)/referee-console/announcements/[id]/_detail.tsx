"use client";

// ============================================================
// referee-console/announcements/[id]/_detail.tsx — 공고 상세 + 일자별 선정 (클라)
//   4-4e 컷오버 핵심: 레거시 (referee)/referee/admin/announcements/[id]/page.tsx 의
//   "일자별 선정 워크플로우"를 v2(Toss) 디자인으로 1:1 포팅.
//
//   흐름(레거시 동일):
//     공고 상세 로드 → 대회 단위 풀 전체 로드 → 일자 탭별로 클라 필터.
//     [좌] 미선정 신청자(해당 일자 신청 − 선정된 풀)  [우] 선정된 풀(책임자 토글/취소)
//
//   ★백엔드 0변경 — 기존 referee-admin API만 재사용:
//     - GET    /api/web/referee-admin/announcements/[id]  (공고 + applications)
//     - GET    /api/web/referee-admin/pools?tournament_id= (풀 목록)
//     - POST   /api/web/referee-admin/pools               (선정)
//     - DELETE /api/web/referee-admin/pools/[poolId]      (선정 취소)
//     - PATCH  /api/web/referee-admin/pools/[poolId]      (책임자 토글)
//
//   ★데이터 변환 = adminFetch 단일 변환점(응답 snake→camel / 요청 camel→snake).
//     required_count(jsonb·날짜키 Record)는 rawJsonKeys 로 값 verbatim 보존.
//     선정 POST body { tournamentId, date, refereeId, roleType } → API snake 계약 일치.
//   ★권한 스코프 = 글로벌 super(layout.tsx). mutation 은 referee-admin API 의
//     getAssociationAdmin() sentinel(첫 자동선택 협회) 기준 — 타협회는 403 에러 노출.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Btn, Badge, Modal, Icon } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";
import { formatOfficialLevel } from "@/lib/referee/official-roles";

// ── 타입(adminFetch 응답 = snake→camel 변환 후) ──
type ApplicationRow = {
  id: string | number;
  refereeId: string | number;
  refereeName: string;
  refereePhone: string | null;
  memo: string | null;
  status: string;
  createdAt: string;
  dates: string[]; // ISO 날짜 문자열
};

type AnnouncementDetailData = {
  id: string | number;
  tournamentId: string;
  tournamentName: string | null;
  title: string;
  description: string | null;
  roleType: "referee" | "game_official";
  dates: string[];
  requiredCount: Record<string, number>; // jsonb(rawJsonKeys 보존)
  deadline: string | null;
  status: "open" | "closed" | "cancelled";
  applications: ApplicationRow[];
};

type PoolItem = {
  id: string | number;
  tournamentId: string;
  date: string;
  refereeId: string | number;
  roleType: "referee" | "game_official";
  isChief: boolean;
  memo: string | null;
  refereeName: string;
  refereeLevel: string | null;
  refereeCertGrade: string | null;
};

// YYYY-MM-DD (UTC) — 레거시 동일.
function toYmd(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

const ROLE_LABELS: Record<string, string> = {
  referee: "심판",
  game_official: "경기원",
};

function statusBadge(s: string): { label: string; tone: "ok" | "grey" | "danger" } {
  if (s === "open") return { label: "모집중", tone: "ok" };
  if (s === "closed") return { label: "마감", tone: "grey" };
  if (s === "cancelled") return { label: "취소", tone: "danger" };
  return { label: s, tone: "grey" };
}

const errorBoxStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--danger)",
  background: "var(--danger-weak, rgba(240,68,82,0.08))",
  border: "1px solid var(--danger)",
  borderRadius: 6,
  padding: "10px 12px",
  lineHeight: 1.5,
};

export function AnnouncementDetail({ announcementId }: { announcementId: string }) {
  const router = useRouter();

  const [detail, setDetail] = React.useState<AnnouncementDetailData | null>(null);
  const [pools, setPools] = React.useState<PoolItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pageError, setPageError] = React.useState<string | null>(null);

  // 현재 선택된 일자 탭(YYYY-MM-DD)
  const [activeDate, setActiveDate] = React.useState<string | null>(null);

  // 선정 중(중복 클릭 방지) referee_id 집합
  const [selecting, setSelecting] = React.useState<Set<string>>(new Set());
  // 선정/책임자 mutation 에러(패널 인라인)
  const [actionError, setActionError] = React.useState<string | null>(null);

  // 선정 취소 확인 모달
  const [unselectTarget, setUnselectTarget] = React.useState<PoolItem | null>(null);
  const [unselectBusy, setUnselectBusy] = React.useState(false);

  // ── 공고 상세 로드 ──
  const loadDetail = React.useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const data = await adminFetch<{ announcement: AnnouncementDetailData }>(
        `/api/web/referee-admin/announcements/${announcementId}`,
        { rawJsonKeys: ["requiredCount"] }
      );
      const ann = data.announcement;
      setDetail(ann);
      // 첫 진입 시 첫 일자 활성화(레거시 동일)
      setActiveDate((prev) =>
        prev ?? (ann.dates.length > 0 ? toYmd(ann.dates[0]) : null)
      );
    } catch (e) {
      setPageError(
        e instanceof AdminApiError ? e.message : "공고를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [announcementId]);

  // ── 풀 전체 로드(대회 단위로 한번에 → 클라에서 일자별 필터, 레거시 동일) ──
  const loadPools = React.useCallback(async (tournamentId: string) => {
    try {
      const data = await adminFetch<{ items: PoolItem[] }>(
        `/api/web/referee-admin/pools?tournament_id=${encodeURIComponent(tournamentId)}`
      );
      setPools(data.items ?? []);
    } catch {
      // 무시 — 풀 없음 상태 유지(레거시 동일)
    }
  }, []);

  React.useEffect(() => {
    loadDetail();
  }, [loadDetail]);

  React.useEffect(() => {
    if (detail) loadPools(detail.tournamentId);
  }, [detail, loadPools]);

  // ── 현재 일자 기준 파생값(레거시 동일) ──
  const currentApplicants = React.useMemo(() => {
    if (!detail || !activeDate) return [] as ApplicationRow[];
    return detail.applications.filter((a) =>
      a.dates.some((d) => toYmd(d) === activeDate)
    );
  }, [detail, activeDate]);

  const currentPools = React.useMemo(() => {
    if (!activeDate) return [] as PoolItem[];
    return pools.filter((p) => toYmd(p.date) === activeDate);
  }, [pools, activeDate]);

  const selectedRefereeIds = React.useMemo(
    () => new Set(currentPools.map((p) => String(p.refereeId))),
    [currentPools]
  );

  // 미선정 신청자 = 해당 일자 신청자 − 선정된 풀
  const pendingApplicants = React.useMemo(
    () =>
      currentApplicants.filter(
        (a) => !selectedRefereeIds.has(String(a.refereeId))
      ),
    [currentApplicants, selectedRefereeIds]
  );

  // 일자별 필요/선정 표시용
  const dateSummary = React.useCallback(
    (ymd: string) => {
      const need = detail?.requiredCount?.[ymd] ?? 0;
      const selected = pools.filter((p) => toYmd(p.date) === ymd).length;
      return { need, selected };
    },
    [detail, pools]
  );

  // ── 선정(POST) ──
  async function selectReferee(refereeId: string | number) {
    if (!detail || !activeDate) return;
    const key = String(refereeId);
    if (selecting.has(key)) return;
    setSelecting((prev) => new Set(prev).add(key));
    setActionError(null);
    try {
      await adminFetch("/api/web/referee-admin/pools", {
        method: "POST",
        body: {
          tournamentId: detail.tournamentId,
          date: activeDate,
          refereeId,
          roleType: detail.roleType,
        },
      });
      await loadPools(detail.tournamentId);
      router.refresh(); // layout nav 배지 갱신
    } catch (e) {
      setActionError(
        e instanceof AdminApiError ? e.message : "선정에 실패했습니다."
      );
    } finally {
      setSelecting((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  // ── 선정 취소(DELETE) ──
  async function runUnselect() {
    if (!unselectTarget || unselectBusy || !detail) return;
    setUnselectBusy(true);
    setActionError(null);
    try {
      await adminFetch(`/api/web/referee-admin/pools/${unselectTarget.id}`, {
        method: "DELETE",
      });
      setUnselectBusy(false);
      setUnselectTarget(null);
      await loadPools(detail.tournamentId);
      router.refresh();
    } catch (e) {
      setUnselectBusy(false);
      setActionError(
        e instanceof AdminApiError ? e.message : "선정 취소에 실패했습니다."
      );
    }
  }

  // ── 책임자 토글(PATCH) ──
  async function toggleChief(poolId: string | number, nextValue: boolean) {
    if (!detail) return;
    setActionError(null);
    try {
      await adminFetch(`/api/web/referee-admin/pools/${poolId}`, {
        method: "PATCH",
        body: { isChief: nextValue },
      });
      await loadPools(detail.tournamentId);
    } catch (e) {
      setActionError(
        e instanceof AdminApiError ? e.message : "책임자 지정에 실패했습니다."
      );
    }
  }

  // ── 로딩/에러 가드 ──
  if (loading && !detail) {
    return (
      <div style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-mute)" }}>
        불러오는 중...
      </div>
    );
  }

  if (pageError || !detail) {
    return (
      <div>
        <Btn
          variant="ghost"
          size="sm"
          icon="arrow-left"
          onClick={() => router.push("/referee-console/announcements")}
        >
          공고 목록
        </Btn>
        <div style={{ ...errorBoxStyle, marginTop: 16 }}>
          {pageError ?? "공고를 찾을 수 없습니다."}
        </div>
      </div>
    );
  }

  const sb = statusBadge(detail.status);

  return (
    <div>
      {/* 뒤로가기 */}
      <Btn
        variant="ghost"
        size="sm"
        icon="arrow-left"
        onClick={() => router.push("/referee-console/announcements")}
      >
        공고 목록
      </Btn>

      {/* ── 공고 요약 ── */}
      <div className="ad-panel" style={{ marginTop: 16, marginBottom: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
              <Badge tone={sb.tone}>{sb.label}</Badge>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)" }}>
                {ROLE_LABELS[detail.roleType] ?? detail.roleType}
              </span>
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: "var(--ink)" }}>
              {detail.title}
            </h1>
            <div style={{ fontSize: 14, color: "var(--ink-soft)", marginTop: 4 }}>
              {detail.tournamentName ?? "—"}
            </div>
            {detail.description && (
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--ink-soft)",
                  marginTop: 12,
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                }}
              >
                {detail.description}
              </p>
            )}
          </div>
          <div style={{ textAlign: "right", fontSize: 12.5, color: "var(--ink-mute)" }}>
            <div>
              마감일:{" "}
              {detail.deadline
                ? new Date(detail.deadline).toLocaleString("ko-KR")
                : "—"}
            </div>
            <div style={{ marginTop: 4 }}>신청자 {detail.applications.length}명</div>
          </div>
        </div>
      </div>

      {/* ── 일자 탭 ── */}
      <div
        role="tablist"
        style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}
      >
        {detail.dates.map((iso) => {
          const ymd = toYmd(iso);
          const { need, selected } = dateSummary(ymd);
          const active = activeDate === ymd;
          return (
            <button
              key={ymd}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveDate(ymd)}
              style={{
                padding: "8px 14px",
                borderRadius: 10,
                border: "1px solid var(--border)",
                background: active ? "var(--primary)" : "var(--card)",
                color: active ? "var(--primary-fg)" : "var(--ink-soft)",
                cursor: "pointer",
                fontFamily: "var(--ff)",
                textAlign: "left",
              }}
            >
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>{ymd}</div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  marginTop: 2,
                  color: active ? "color-mix(in srgb, var(--primary-fg) 85%, transparent)" : "var(--ink-mute)",
                }}
              >
                {selected}/{need} 선정
              </div>
            </button>
          );
        })}
      </div>

      {actionError && <div style={{ ...errorBoxStyle, marginBottom: 16 }}>{actionError}</div>}

      {/* ── 일자 패널: 좌 신청자 / 우 선정풀 ── */}
      {activeDate && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {/* 좌: 미선정 신청자 */}
          <section className="ad-panel">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                신청자 ({pendingApplicants.length})
              </h2>
              <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{activeDate}</span>
            </div>
            {pendingApplicants.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12.5, color: "var(--ink-mute)" }}>
                이 일자에 대한 미선정 신청자가 없습니다.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pendingApplicants.map((a) => {
                  const key = String(a.refereeId);
                  const busy = selecting.has(key);
                  return (
                    <div
                      key={String(a.id)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 12,
                        padding: "12px 14px",
                        borderRadius: 10,
                        background: "var(--grey-50)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>
                          {a.refereeName}
                        </div>
                        {a.memo && (
                          <div
                            style={{
                              fontSize: 12,
                              color: "var(--ink-mute)",
                              marginTop: 4,
                              whiteSpace: "pre-wrap",
                            }}
                          >
                            {a.memo}
                          </div>
                        )}
                      </div>
                      <Btn
                        variant="primary"
                        size="sm"
                        disabled={busy}
                        onClick={() => selectReferee(a.refereeId)}
                      >
                        {busy ? "선정 중..." : "선정"}
                      </Btn>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* 우: 선정된 풀 */}
          <section className="ad-panel">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 14,
              }}
            >
              <h2 style={{ fontSize: 14, fontWeight: 800, color: "var(--ink)" }}>
                선정된 풀 ({currentPools.length}/{detail.requiredCount?.[activeDate] ?? 0})
              </h2>
              <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>{activeDate}</span>
            </div>
            {currentPools.length === 0 ? (
              <div style={{ padding: "24px 0", textAlign: "center", fontSize: 12.5, color: "var(--ink-mute)" }}>
                아직 선정된 인원이 없습니다. 좌측에서 선정하세요.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {currentPools.map((p) => (
                  <div
                    key={String(p.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                      padding: "12px 14px",
                      borderRadius: 10,
                      background: "var(--grey-50)",
                      // 책임자 강조 — 색상은 토큰만 사용
                      border: p.isChief
                        ? "1px solid var(--primary)"
                        : "1px solid var(--border)",
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 4,
                          fontSize: 14,
                          fontWeight: 700,
                          color: "var(--ink)",
                        }}
                      >
                        {p.isChief && (
                          <span style={{ color: "var(--primary)", display: "inline-flex" }}>
                            <Icon name="star" size={15} />
                          </span>
                        )}
                        {p.refereeName}
                      </div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-mute)", marginTop: 2 }}>
                        {p.refereeCertGrade ??
                          (p.refereeLevel
                            ? formatOfficialLevel(p.refereeLevel)
                            : "등급 미등록")}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {/* 책임자 토글 */}
                      <Btn
                        variant={p.isChief ? "primary" : "secondary"}
                        size="sm"
                        icon="star"
                        title={p.isChief ? "책임자 해제" : "책임자 지정"}
                        onClick={() => toggleChief(p.id, !p.isChief)}
                      />
                      <Btn
                        variant="ghost"
                        size="sm"
                        onClick={() => setUnselectTarget(p)}
                      >
                        취소
                      </Btn>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── 선정 취소 확인 모달 ── */}
      <Modal
        open={unselectTarget !== null}
        onClose={() => {
          if (!unselectBusy) setUnselectTarget(null);
        }}
        title="선정 취소"
        sub={unselectTarget?.refereeName}
        foot={
          <>
            <Btn
              variant="secondary"
              onClick={() => setUnselectTarget(null)}
              disabled={unselectBusy}
            >
              취소
            </Btn>
            <Btn variant="danger" onClick={runUnselect} disabled={unselectBusy}>
              {unselectBusy ? "처리 중..." : "선정 취소"}
            </Btn>
          </>
        }
      >
        <div style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.5 }}>
          이 심판의 선정을 취소하시겠습니까?
        </div>
      </Modal>
    </div>
  );
}
