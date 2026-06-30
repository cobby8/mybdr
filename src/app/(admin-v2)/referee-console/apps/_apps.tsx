"use client";

// ============================================================
// referee-console/apps/_apps.tsx — 신청 관리 inbox (클라 콘솔)
//   컷오버 4-5 ③-B: 협회 관리자가 받은 배정 신청을 상태별로 모아 보고
//   신청 단위로 승인/거절. (공고 상세의 일자별 선정과 별개 경로 — 두 경로 공존)
//
//   ★신규 API 2개 사용(사용자 승인):
//     - GET   /api/web/referee-admin/applications?status=&announcement_id=  (목록)
//     - PATCH /api/web/referee-admin/applications/[id]  { action, memo }    (승인/거절)
//   ★기존 API 재사용:
//     - GET   /api/web/referee-admin/announcements  (공고 필터 드롭다운)
//
//   ★데이터 변환 = adminFetch 단일 변환점(응답 snake→camel / 요청 camel→snake).
//   ★승인 = 신청 일자 전부가 일자별 선정 풀로 자동 연동(서버에서 처리).
//     거절 = status 만 전환(풀 비삭제 · 알림 없음).
//   ★권한 스코프 = 협회 admin(자기 협회) / 전역 super(sentinel 첫 협회).
//     mutation 은 referee-admin API 의 협회 게이트 기준 — 타협회는 403 노출.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Btn, Badge, Modal } from "@/components/admin-v2";

import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// ── 타입(adminFetch 응답 = snake→camel 변환 후) ──
type ApplicationRow = {
  id: string | number;
  status: string; // submitted | approved | rejected | withdrawn
  memo: string | null;
  createdAt: string;
  refereeId: string | number;
  refereeName: string;
  refereePhone: string | null;
  announcementId: string | number;
  announcementTitle: string;
  tournamentId: string;
  tournamentName: string | null;
  roleType: "referee" | "game_official";
  dates: string[]; // ISO 날짜 문자열
};

type AnnouncementOption = {
  id: string | number;
  title: string;
};

const ROLE_LABELS: Record<string, string> = {
  referee: "심판",
  game_official: "경기원",
};

// 상태 탭 정의(대기/승인/거절) — submitted=대기.
const STATUS_TABS: { key: string; label: string }[] = [
  { key: "submitted", label: "대기" },
  { key: "approved", label: "승인" },
  { key: "rejected", label: "거절" },
];

// 신청 상태 → Badge tone/라벨.
function statusBadge(s: string): { label: string; tone: "warn" | "ok" | "danger" | "grey" } {
  if (s === "submitted") return { label: "대기", tone: "warn" };
  if (s === "approved") return { label: "승인", tone: "ok" };
  if (s === "rejected") return { label: "거절", tone: "danger" };
  if (s === "withdrawn") return { label: "철회", tone: "grey" };
  return { label: s, tone: "grey" };
}

// YYYY-MM-DD (UTC) — 일자칩 표시용.
function toYmd(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

// 공통 에러박스 스타일(콘솔 1:1).
const errorBoxStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--danger)",
  background: "var(--danger-weak, rgba(240,68,82,0.08))",
  border: "1px solid var(--danger)",
  borderRadius: 6,
  padding: "10px 12px",
  lineHeight: 1.5,
};

export function AppsConsole() {
  const router = useRouter();

  // ── 필터 상태 ──
  const [statusTab, setStatusTab] = React.useState("submitted");
  const [announcementId, setAnnouncementId] = React.useState(""); // ""=전체

  // ── 목록 ──
  const [items, setItems] = React.useState<ApplicationRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pageError, setPageError] = React.useState<string | null>(null);

  // ── 공고 필터 옵션 ──
  const [announcements, setAnnouncements] = React.useState<AnnouncementOption[]>([]);

  // ── 처리 중(중복 클릭 방지) 신청 id 집합 ──
  const [busy, setBusy] = React.useState<Set<string>>(new Set());
  // 카드 인라인 처리 에러
  const [actionError, setActionError] = React.useState<string | null>(null);

  // ── 거절 확인 모달 ──
  const [rejectTarget, setRejectTarget] = React.useState<ApplicationRow | null>(null);
  const [rejectMemo, setRejectMemo] = React.useState("");
  const [rejectBusy, setRejectBusy] = React.useState(false);

  // ── 공고 옵션 로드(필터 드롭다운) ──
  React.useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch<{ items: AnnouncementOption[] }>(
          "/api/web/referee-admin/announcements",
          { rawJsonKeys: ["requiredCount"] }
        );
        setAnnouncements(
          (data.items ?? []).map((a) => ({ id: a.id, title: a.title }))
        );
      } catch {
        // 무시 — 공고 필터 없이도 동작(전체 보기)
      }
    })();
  }, []);

  // ── 목록 로드(상태 탭 + 공고 필터) ──
  const loadList = React.useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      const qs = new URLSearchParams({ status: statusTab, limit: "100" });
      if (announcementId) qs.set("announcement_id", announcementId);
      const data = await adminFetch<{ items: ApplicationRow[] }>(
        `/api/web/referee-admin/applications?${qs.toString()}`
      );
      setItems(data.items ?? []);
    } catch (e) {
      setPageError(
        e instanceof AdminApiError ? e.message : "신청 목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, [statusTab, announcementId]);

  React.useEffect(() => {
    loadList();
  }, [loadList]);

  // ── 승인(즉시 PATCH approve) ──
  async function approve(app: ApplicationRow) {
    const key = String(app.id);
    if (busy.has(key)) return;
    setBusy((prev) => new Set(prev).add(key));
    setActionError(null);
    try {
      await adminFetch(`/api/web/referee-admin/applications/${app.id}`, {
        method: "PATCH",
        body: { action: "approve" },
      });
      await loadList();
      router.refresh(); // layout 신청 배지 갱신
    } catch (e) {
      setActionError(
        e instanceof AdminApiError ? e.message : "승인에 실패했습니다."
      );
    } finally {
      setBusy((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }

  // ── 거절(확인 모달 → memo → PATCH reject) ──
  async function runReject() {
    if (!rejectTarget || rejectBusy) return;
    setRejectBusy(true);
    setActionError(null);
    try {
      await adminFetch(`/api/web/referee-admin/applications/${rejectTarget.id}`, {
        method: "PATCH",
        body: {
          action: "reject",
          // 빈 메모는 보내지 않음(서버 선택 필드).
          ...(rejectMemo.trim() ? { memo: rejectMemo.trim() } : {}),
        },
      });
      setRejectBusy(false);
      setRejectTarget(null);
      setRejectMemo("");
      await loadList();
      router.refresh();
    } catch (e) {
      setRejectBusy(false);
      setActionError(
        e instanceof AdminApiError ? e.message : "거절에 실패했습니다."
      );
    }
  }

  return (
    <div>
      {/* ── 페이지 헤더(ts-ph) ── */}
      <div className="ts-ph">
        <div className="ts-ph__eyebrow">심판 콘솔</div>
        <div className="ts-ph__title">신청 관리</div>
        <div className="ts-ph__sub">
          심판·경기원이 제출한 배정 신청을 승인하거나 거절합니다. 승인하면 신청한
          일자가 모두 선정 풀에 반영됩니다.
        </div>
      </div>

      {/* ── 필터 줄: 상태 탭 + 공고 드롭다운 ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          flexWrap: "wrap",
          marginBottom: 16,
        }}
      >
        {/* 상태 탭 */}
        <div style={{ display: "flex", gap: 8 }}>
          {STATUS_TABS.map((t) => {
            const active = statusTab === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setStatusTab(t.key)}
                style={{
                  padding: "8px 16px",
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: active ? "var(--primary)" : "var(--card)",
                  color: active ? "var(--primary-fg)" : "var(--ink-soft)",
                  fontSize: 13.5,
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "var(--ff)",
                }}
              >
                {t.label}
              </button>
            );
          })}
        </div>

        {/* 공고 필터 */}
        <select
          className="ts-input"
          value={announcementId}
          onChange={(e) => setAnnouncementId(e.target.value)}
          style={{ width: "auto", minWidth: 200 }}
        >
          <option value="">전체 공고</option>
          {announcements.map((a) => (
            <option key={String(a.id)} value={String(a.id)}>
              {a.title}
            </option>
          ))}
        </select>
      </div>

      {pageError && <div style={{ ...errorBoxStyle, marginBottom: 16 }}>{pageError}</div>}
      {actionError && <div style={{ ...errorBoxStyle, marginBottom: 16 }}>{actionError}</div>}

      {/* ── 목록(카드) ── */}
      {loading ? (
        <div className="ad-panel" style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-mute)" }}>
          불러오는 중...
        </div>
      ) : items.length === 0 ? (
        <div className="ad-panel" style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-mute)" }}>
          해당 상태의 신청이 없습니다.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {items.map((app) => {
            const key = String(app.id);
            const isBusy = busy.has(key);
            const sb = statusBadge(app.status);
            return (
              <div key={key} className="ad-panel">
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                    flexWrap: "wrap",
                  }}
                >
                  {/* 좌: 신청 정보 */}
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                      <Badge tone={sb.tone}>{sb.label}</Badge>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-mute)" }}>
                        {ROLE_LABELS[app.roleType] ?? app.roleType}
                      </span>
                    </div>
                    {/* 심판명 + 연락처 */}
                    <div style={{ fontSize: 16, fontWeight: 800, color: "var(--ink)" }}>
                      {app.refereeName}
                      {app.refereePhone && (
                        <span
                          style={{
                            fontSize: 12.5,
                            fontWeight: 600,
                            color: "var(--ink-mute)",
                            marginLeft: 8,
                          }}
                        >
                          {app.refereePhone}
                        </span>
                      )}
                    </div>
                    {/* 공고 / 대회 */}
                    <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 4 }}>
                      {app.announcementTitle}
                      {app.tournamentName ? ` · ${app.tournamentName}` : ""}
                    </div>
                    {/* 일자 칩 */}
                    {app.dates.length > 0 && (
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                        {app.dates.map((d) => (
                          <span
                            key={d}
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: "var(--ink-soft)",
                              background: "var(--grey-50)",
                              border: "1px solid var(--border)",
                              borderRadius: 8,
                              padding: "4px 8px",
                            }}
                          >
                            {toYmd(d)}
                          </span>
                        ))}
                      </div>
                    )}
                    {/* 신청 메모 */}
                    {app.memo && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: "var(--ink-mute)",
                          marginTop: 10,
                          whiteSpace: "pre-wrap",
                          lineHeight: 1.5,
                        }}
                      >
                        {app.memo}
                      </div>
                    )}
                  </div>

                  {/* 우: 액션(대기 상태에서만 승인/거절) */}
                  {app.status === "submitted" && (
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 8,
                        alignItems: "stretch",
                        minWidth: 96,
                      }}
                    >
                      <Btn
                        variant="primary"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => approve(app)}
                      >
                        {isBusy ? "처리 중..." : "승인"}
                      </Btn>
                      <Btn
                        variant="danger"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => {
                          setRejectTarget(app);
                          setRejectMemo("");
                          setActionError(null);
                        }}
                      >
                        거절
                      </Btn>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ===================== 거절 확인 모달 ===================== */}
      <Modal
        open={rejectTarget !== null}
        onClose={() => {
          if (!rejectBusy) {
            setRejectTarget(null);
            setRejectMemo("");
          }
        }}
        title="신청 거절"
        sub={rejectTarget?.refereeName}
        foot={
          <>
            <Btn
              variant="secondary"
              onClick={() => {
                setRejectTarget(null);
                setRejectMemo("");
              }}
              disabled={rejectBusy}
            >
              취소
            </Btn>
            <Btn variant="danger" onClick={runReject} disabled={rejectBusy}>
              {rejectBusy ? "처리 중..." : "거절"}
            </Btn>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.5 }}>
            이 신청을 거절하시겠습니까?
          </div>
          <div className="ts-field">
            <label className="ts-field__label">사유 (선택)</label>
            <textarea
              className="ts-input"
              value={rejectMemo}
              onChange={(e) => setRejectMemo(e.target.value)}
              rows={3}
              placeholder="거절 사유를 남길 수 있습니다"
              style={{ resize: "vertical", minHeight: 64 }}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
