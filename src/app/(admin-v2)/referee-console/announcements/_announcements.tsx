"use client";

// ============================================================
// referee-console/announcements/_announcements.tsx — 배정 신청 공고 (클라 콘솔)
//   4-4e 컷오버: 레거시 (referee)/referee/admin/announcements/page.tsx 를 v2(Toss)
//   디자인으로 1:1 포팅. 공고 목록 + 게시 모달 + 마감/열기 토글 + 삭제.
//
//   ★백엔드 0변경 — 기존 referee-admin API만 재사용:
//     - GET  /api/web/referee-admin/announcements                 (공고 목록)
//     - POST /api/web/referee-admin/announcements                 (공고 게시)
//     - PATCH/DELETE /api/web/referee-admin/announcements/[id]     (상태변경/삭제)
//     - GET  /api/web/referee-admin/tournaments?q=&limit=20        (대회 검색)
//
//   ★데이터 변환 = adminFetch 단일 변환점(응답 snake→camel / 요청 camel→snake).
//     단 required_count(jsonb·날짜키 Record)는 rawJsonKeys 로 값 verbatim 보존
//     → "2026-05-02" 같은 날짜키가 toCamel 로 변형되지 않게 차단(일자별 선정 무결성).
//
//   ★권한 스코프 = 글로벌 super(layout.tsx). mutation 은 referee-admin API 의
//     getAssociationAdmin() sentinel 이 "첫 자동선택 협회"로 동작 → 그 협회만 게시/관리.
// ============================================================

import React from "react";
import { useRouter } from "next/navigation";
import { Btn, Badge, Modal, Icon } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// ── 타입(adminFetch 응답 = snake→camel 변환 후) ──
type Tournament = {
  id: string; // Tournament.id = UUID(String)
  name: string;
};

type AnnouncementRow = {
  id: string | number; // BigInt → JSON string|number
  tournamentId: string;
  tournamentName: string | null;
  title: string;
  roleType: "referee" | "game_official";
  dates: string[]; // ISO 날짜 문자열
  requiredCount: Record<string, number>; // jsonb(rawJsonKeys 로 날짜키 verbatim)
  deadline: string | null;
  status: "open" | "closed" | "cancelled";
  applicationsCount: number;
  createdAt: string;
};

const ROLE_LABELS: Record<string, string> = {
  referee: "심판",
  game_official: "경기원",
};

// 공고 상태 → Badge tone/라벨(정본 도메인 매핑).
function statusBadge(s: string): { label: string; tone: "ok" | "grey" | "danger" } {
  if (s === "open") return { label: "모집중", tone: "ok" };
  if (s === "closed") return { label: "마감", tone: "grey" };
  if (s === "cancelled") return { label: "취소", tone: "danger" };
  return { label: s, tone: "grey" };
}

// 위험/안내 공통 에러박스 스타일(assignment-workflow 1:1).
const errorBoxStyle: React.CSSProperties = {
  fontSize: 13.5,
  color: "var(--danger)",
  background: "var(--danger-weak, rgba(240,68,82,0.08))",
  border: "1px solid var(--danger)",
  borderRadius: 6,
  padding: "10px 12px",
  lineHeight: 1.5,
};

// required_count 합계(필요 인원 총합).
function totalRequired(rc: Record<string, number>): number {
  return Object.values(rc ?? {}).reduce((sum, v) => sum + (v || 0), 0);
}

export function AnnouncementsConsole() {
  const router = useRouter();

  // ── 목록 ──
  const [items, setItems] = React.useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [pageError, setPageError] = React.useState<string | null>(null);

  // ── 게시 모달 ──
  const [modalOpen, setModalOpen] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);

  // 대회 검색
  const [tSearch, setTSearch] = React.useState("");
  const [tournaments, setTournaments] = React.useState<Tournament[]>([]);
  const [selectedT, setSelectedT] = React.useState<Tournament | null>(null);

  // 폼 필드(레거시 동일)
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [roleType, setRoleType] = React.useState<"referee" | "game_official">("referee");
  const [dateInput, setDateInput] = React.useState("");
  const [dates, setDates] = React.useState<string[]>([]);
  const [requiredCount, setRequiredCount] = React.useState<Record<string, number>>({});
  const [deadline, setDeadline] = React.useState(""); // datetime-local 값

  // ── 삭제 확인 모달 ──
  const [deleteTarget, setDeleteTarget] = React.useState<AnnouncementRow | null>(null);
  const [actionBusy, setActionBusy] = React.useState(false);
  const [actionError, setActionError] = React.useState<string | null>(null);

  // ── 목록 로드 ──
  const loadList = React.useCallback(async () => {
    setLoading(true);
    setPageError(null);
    try {
      // required_count(jsonb) 날짜키 verbatim 보존
      const data = await adminFetch<{ items: AnnouncementRow[] }>(
        "/api/web/referee-admin/announcements",
        { rawJsonKeys: ["requiredCount"] }
      );
      setItems(data.items ?? []);
    } catch (e) {
      setPageError(
        e instanceof AdminApiError ? e.message : "목록을 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadList();
  }, [loadList]);

  // ── 대회 검색 ──
  const searchTournaments = React.useCallback(async (q: string) => {
    try {
      const qs = new URLSearchParams({ limit: "20" });
      if (q) qs.set("q", q);
      const data = await adminFetch<{ items: Tournament[] }>(
        `/api/web/referee-admin/tournaments?${qs.toString()}`
      );
      setTournaments(data.items ?? []);
    } catch {
      // 무시 — 빈 목록 유지(레거시 동일)
    }
  }, []);

  // 모달 열릴 때 기본 대회 목록 로드
  React.useEffect(() => {
    if (modalOpen && tournaments.length === 0) {
      searchTournaments("");
    }
  }, [modalOpen, tournaments.length, searchTournaments]);

  // ── 일자 추가/삭제(레거시 동일) ──
  function addDate() {
    if (!dateInput) return;
    if (dates.includes(dateInput)) return;
    setDates((prev) => [...prev, dateInput].sort());
    setRequiredCount((prev) => ({ ...prev, [dateInput]: 1 }));
    setDateInput("");
  }
  function removeDate(d: string) {
    setDates((prev) => prev.filter((x) => x !== d));
    setRequiredCount((prev) => {
      const next = { ...prev };
      delete next[d];
      return next;
    });
  }

  // ── 폼 리셋 ──
  function resetForm() {
    setSelectedT(null);
    setTSearch("");
    setTitle("");
    setDescription("");
    setRoleType("referee");
    setDateInput("");
    setDates([]);
    setRequiredCount({});
    setDeadline("");
    setFormError(null);
  }

  function closeModal() {
    if (submitting) return;
    setModalOpen(false);
    resetForm();
  }

  // ── 공고 게시(POST) ──
  async function submitForm() {
    setFormError(null);
    if (!selectedT) return setFormError("대회를 선택해 주세요.");
    if (!title.trim()) return setFormError("제목을 입력해 주세요.");
    if (dates.length === 0) return setFormError("일자를 최소 1개 추가해 주세요.");

    setSubmitting(true);
    try {
      await adminFetch("/api/web/referee-admin/announcements", {
        method: "POST",
        // required_count 의 날짜키 보존(camel→snake 변환 우회).
        rawJsonKeys: ["requiredCount"],
        body: {
          tournamentId: selectedT.id,
          title: title.trim(),
          description: description.trim() || undefined,
          roleType,
          dates,
          requiredCount,
          // datetime-local 은 타임존 없이 오므로 ISO 변환(레거시 동일)
          deadline: deadline ? new Date(deadline).toISOString() : undefined,
        },
      });
      setSubmitting(false);
      setModalOpen(false);
      resetForm();
      await loadList();
    } catch (e) {
      setSubmitting(false);
      setFormError(
        e instanceof AdminApiError ? e.message : "공고 게시에 실패했습니다."
      );
    }
  }

  // ── 상태 토글(열기/마감) ──
  async function toggleStatus(a: AnnouncementRow) {
    const nextStatus: "open" | "closed" = a.status === "open" ? "closed" : "open";
    try {
      await adminFetch(`/api/web/referee-admin/announcements/${a.id}`, {
        method: "PATCH",
        body: { status: nextStatus },
      });
      await loadList();
    } catch (e) {
      setPageError(
        e instanceof AdminApiError ? e.message : "상태 변경에 실패했습니다."
      );
    }
  }

  // ── 삭제 실행(DELETE) ──
  async function runDelete() {
    if (!deleteTarget || actionBusy) return;
    setActionBusy(true);
    setActionError(null);
    try {
      await adminFetch(`/api/web/referee-admin/announcements/${deleteTarget.id}`, {
        method: "DELETE",
      });
      setActionBusy(false);
      setDeleteTarget(null);
      await loadList();
    } catch (e) {
      setActionBusy(false);
      setActionError(
        e instanceof AdminApiError ? e.message : "삭제에 실패했습니다."
      );
    }
  }

  return (
    <div>
      {/* ── 페이지 헤더(ts-ph) ── */}
      <div className="ts-ph">
        <div className="ts-ph__eyebrow">심판 콘솔</div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <div className="ts-ph__title">배정 신청 공고</div>
            <div className="ts-ph__sub">
              심판·경기원에게 배정 신청을 받을 공고를 게시하고, 일자별로 선정합니다.
            </div>
          </div>
          <Btn variant="primary" icon="plus" onClick={() => setModalOpen(true)}>
            공고 게시
          </Btn>
        </div>
      </div>

      {pageError && (
        <div style={{ ...errorBoxStyle, marginBottom: 20 }}>{pageError}</div>
      )}

      {/* ── 목록 ── */}
      {loading ? (
        <div className="ad-panel" style={{ padding: "40px 0", textAlign: "center", color: "var(--ink-mute)" }}>
          불러오는 중...
        </div>
      ) : items.length === 0 ? (
        <div className="ad-panel" style={{ padding: "48px 0", textAlign: "center", color: "var(--ink-mute)" }}>
          게시된 공고가 없습니다. &ldquo;공고 게시&rdquo; 버튼으로 추가하세요.
        </div>
      ) : (
        // 기존 v2 포팅(bulk-verify) 동일 패턴: ad-panel(padding:0) + raw table(borderCollapse)
        <div className="ad-panel" style={{ padding: 0, overflowX: "auto" }}>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: 13,
              fontFamily: "var(--ff)",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                {[
                  { label: "제목", align: "left" as const },
                  { label: "대회", align: "left" as const },
                  { label: "역할", align: "left" as const },
                  { label: "일자", align: "center" as const },
                  { label: "필요/신청", align: "center" as const },
                  { label: "상태", align: "center" as const },
                  { label: "마감일", align: "left" as const },
                  { label: "관리", align: "right" as const },
                ].map((h) => (
                  <th
                    key={h.label}
                    style={{
                      padding: "10px 14px",
                      textAlign: h.align,
                      fontSize: 11,
                      fontWeight: 700,
                      color: "var(--ink-mute)",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {h.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((a) => {
                const sb = statusBadge(a.status);
                return (
                  <tr key={String(a.id)} style={{ borderBottom: "1px solid var(--border)" }}>
                    <td style={{ padding: "10px 14px", fontWeight: 700, color: "var(--ink)" }}>
                      {a.title}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--ink-soft)" }}>
                      {a.tournamentName ?? "—"}
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--ink)", whiteSpace: "nowrap" }}>
                      {ROLE_LABELS[a.roleType] ?? a.roleType}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--ink)", whiteSpace: "nowrap" }}>
                      {a.dates.length}일
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center", color: "var(--ink)", whiteSpace: "nowrap" }}>
                      {totalRequired(a.requiredCount)}명 / {a.applicationsCount}명
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "center" }}>
                      <Badge tone={sb.tone}>{sb.label}</Badge>
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--ink-mute)", fontSize: 12.5, whiteSpace: "nowrap" }}>
                      {a.deadline ? new Date(a.deadline).toLocaleString("ko-KR") : "—"}
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right" }}>
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 6 }}>
                        <Btn
                          variant="secondary"
                          size="sm"
                          onClick={() => router.push(`/referee-console/announcements/${a.id}`)}
                        >
                          상세
                        </Btn>
                        <Btn variant="ghost" size="sm" onClick={() => toggleStatus(a)}>
                          {a.status === "open" ? "마감" : "열기"}
                        </Btn>
                        <Btn
                          variant="danger"
                          size="sm"
                          onClick={() => {
                            setDeleteTarget(a);
                            setActionError(null);
                          }}
                        >
                          삭제
                        </Btn>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ===================== 공고 게시 모달 ===================== */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        title="새 공고 게시"
        sub="대회·역할·대상 일자·일자별 필요 인원을 입력하세요."
        foot={
          <>
            <Btn variant="secondary" onClick={closeModal} disabled={submitting}>
              취소
            </Btn>
            <Btn variant="primary" onClick={submitForm} disabled={submitting}>
              {submitting ? "게시 중..." : "게시하기"}
            </Btn>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {/* 대회 선택 */}
          <div className="ts-field">
            <label className="ts-field__label">대회</label>
            {selectedT ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12,
                  padding: "12px 14px",
                  borderRadius: "var(--radius-input)",
                  background: "var(--primary-weak)",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                  {selectedT.name}
                </div>
                <Btn
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedT(null)}
                >
                  변경
                </Btn>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                <input
                  className="ts-input"
                  value={tSearch}
                  onChange={(e) => setTSearch(e.target.value)}
                  onKeyDown={(e) => {
                    // 한글 IME composition 중 Enter 차단(레거시 동일)
                    if (e.nativeEvent.isComposing) return;
                    if (e.key === "Enter") {
                      e.preventDefault();
                      searchTournaments(tSearch);
                    }
                  }}
                  placeholder="대회명 검색 (Enter)"
                />
                <div
                  style={{
                    maxHeight: 180,
                    overflowY: "auto",
                    border: "1px solid var(--border)",
                    borderRadius: "var(--radius-input)",
                  }}
                >
                  {tournaments.length === 0 ? (
                    <div
                      style={{
                        padding: 12,
                        textAlign: "center",
                        fontSize: 12.5,
                        color: "var(--ink-mute)",
                      }}
                    >
                      검색 결과 없음
                    </div>
                  ) : (
                    tournaments.map((t, i) => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setSelectedT(t)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          padding: "10px 14px",
                          fontSize: 14,
                          color: "var(--ink)",
                          background: "var(--card)",
                          border: "none",
                          borderTop: i === 0 ? "none" : "1px solid var(--border)",
                          cursor: "pointer",
                          fontFamily: "var(--ff)",
                        }}
                      >
                        {t.name}
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* 제목 */}
          <div className="ts-field">
            <label className="ts-field__label">제목</label>
            <input
              className="ts-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="5월 U18 챔피언십 심판 모집"
            />
          </div>

          {/* 설명 */}
          <div className="ts-field">
            <label className="ts-field__label">설명 (선택)</label>
            <textarea
              className="ts-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="모집 안내 / 근무 조건 등"
              style={{ resize: "vertical", minHeight: 72 }}
            />
          </div>

          {/* 역할 유형 */}
          <div className="ts-field">
            <label className="ts-field__label">역할 유형</label>
            <div style={{ display: "flex", gap: 8 }}>
              {(["referee", "game_official"] as const).map((r) => (
                <Btn
                  key={r}
                  variant={roleType === r ? "primary" : "secondary"}
                  size="sm"
                  onClick={() => setRoleType(r)}
                >
                  {ROLE_LABELS[r]}
                </Btn>
              ))}
            </div>
          </div>

          {/* 대상 일자 */}
          <div className="ts-field">
            <label className="ts-field__label">대상 일자</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
              <input
                className="ts-input"
                type="date"
                value={dateInput}
                onChange={(e) => setDateInput(e.target.value)}
                style={{ flex: 1 }}
              />
              <Btn variant="secondary" size="sm" icon="plus" onClick={addDate}>
                추가
              </Btn>
            </div>
            {dates.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {dates.map((d) => (
                  <div
                    key={d}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "var(--grey-50)",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <span style={{ fontSize: 13.5, color: "var(--ink)" }}>{d}</span>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <label style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                        필요 인원
                      </label>
                      <input
                        className="ts-input"
                        type="number"
                        min={0}
                        max={100}
                        value={requiredCount[d] ?? 1}
                        onChange={(e) =>
                          setRequiredCount((prev) => ({
                            ...prev,
                            [d]: Number(e.target.value) || 0,
                          }))
                        }
                        style={{ width: 72, textAlign: "right" }}
                      />
                      <button
                        type="button"
                        onClick={() => removeDate(d)}
                        aria-label="일자 삭제"
                        style={{
                          display: "inline-flex",
                          color: "var(--danger)",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: 2,
                        }}
                      >
                        <Icon name="x" size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 마감일 */}
          <div className="ts-field">
            <label className="ts-field__label">신청 마감 (선택)</label>
            <input
              className="ts-input"
              type="datetime-local"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          {formError && <div style={errorBoxStyle}>{formError}</div>}
        </div>
      </Modal>

      {/* ===================== 삭제 확인 모달 ===================== */}
      <Modal
        open={deleteTarget !== null}
        onClose={() => {
          if (!actionBusy) {
            setDeleteTarget(null);
            setActionError(null);
          }
        }}
        title="공고 삭제"
        sub={deleteTarget?.title}
        foot={
          <>
            <Btn
              variant="secondary"
              onClick={() => {
                setDeleteTarget(null);
                setActionError(null);
              }}
              disabled={actionBusy}
            >
              취소
            </Btn>
            <Btn variant="danger" onClick={runDelete} disabled={actionBusy}>
              {actionBusy ? "삭제 중..." : "삭제"}
            </Btn>
          </>
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 14.5, color: "var(--ink)", lineHeight: 1.5 }}>
            이 공고를 삭제하시겠습니까? 신청 내역도 함께 삭제됩니다.
          </div>
          {actionError && <div style={errorBoxStyle}>{actionError}</div>}
        </div>
      </Modal>
    </div>
  );
}
