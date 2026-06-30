"use client";

// ============================================================
// referee-console/settlements/_settlements-bulk.tsx — 정산 일괄 생성(클라)
//   레거시 (referee)/referee/admin/settlements/new-batch 박제:
//     대회 선택 → 미리보기(GET) → 체크/금액/메모 편집 → 일괄 생성(POST).
//   ★데이터 = 기존 엔드포인트 재사용(백엔드 0변경):
//     · GET  /api/web/referee-admin/tournaments?limit=50         (대회 드롭다운)
//     · GET  /api/web/referee-admin/settlements/bulk-create      (미리보기)
//     · POST /api/web/referee-admin/settlements/bulk-create      (확정)
//     adminFetch 단일 변환: 응답 snake→camel · 요청 body camel→snake(자동).
//     권한 = settlement_manage. super sentinel 자동통과.
//   ⚠ super 범위 한계: bulk-create 는 admin.associationId(자동선택 협회) 심판만 대상 →
//     타 협회 배정은 미리보기/생성 제외(FORBIDDEN). 데이터 희박 환경 무영향.
//   ★admin-v2 키트(Btn/Check)·var(--*)만 — 하드코딩 색 0.
// ============================================================

import React from "react";
import { Btn, Check, Empty } from "@/components/admin-v2";
import { adminFetch, AdminApiError } from "@/lib/admin-v2/data/client";

// ── 응답 타입(camel — adminFetch 변환 후) ────────────────────────────
type Tournament = { id: string; name: string };

type PreviewItem = {
  assignmentId: string; // bigint → string
  refereeId: string;
  refereeName: string;
  role: string;
  feeSnapshot: number | null;
  expectedAmount: number;
  match: {
    id: string;
    scheduledAt: string | null;
    venueName: string | null;
    roundName: string | null;
  } | null;
};

type PreviewResponse = {
  items: PreviewItem[];
  fees: {
    feeMain: number;
    feeSub: number;
    feeRecorder: number;
    feeTimer: number;
  } | null;
};

type BulkResult = {
  created: number;
  createdIds: string[];
  failed: { assignmentId: string; reason: string }[];
};

// 역할/실패사유 라벨(레거시 박제).
const ROLE_LABEL: Record<string, string> = {
  main: "주심",
  sub: "부심",
  recorder: "경기원",
  timer: "경기원",
};
const FAIL_REASON: Record<string, string> = {
  NOT_FOUND: "배정 없음",
  FORBIDDEN: "권한 없음(다른 협회)",
  NOT_COMPLETED: "배정이 완료 상태 아님",
  DUPLICATE: "이미 정산 존재",
  ERROR: "DB 에러",
};

const formatNumber = (n: number) => n.toLocaleString("ko-KR");
const formatDate = (iso: string | null) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "-";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
};

type EditState = { checked: boolean; amount: string; memo: string };

export function SettlementsBulk() {
  const [tournaments, setTournaments] = React.useState<Tournament[]>([]);
  const [tournamentId, setTournamentId] = React.useState<string>("");

  const [items, setItems] = React.useState<PreviewItem[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // assignmentId → 행 편집 상태(체크/금액/메모).
  const [edits, setEdits] = React.useState<Record<string, EditState>>({});

  const [result, setResult] = React.useState<BulkResult | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  // 대회 목록 로드(초기 1회).
  React.useEffect(() => {
    let alive = true;
    adminFetch<{ items: Tournament[] }>(
      "/api/web/referee-admin/tournaments?limit=50"
    )
      .then((d) => {
        if (alive && Array.isArray(d?.items)) setTournaments(d.items);
      })
      .catch(() => {
        /* 드롭다운 비워둠 — 무시 */
      });
    return () => {
      alive = false;
    };
  }, []);

  // 대회 선택 → 미리보기 로드.
  const loadPreview = React.useCallback(async (tid: string) => {
    setLoading(true);
    setError(null);
    setItems([]);
    setEdits({});
    try {
      const data = await adminFetch<PreviewResponse>(
        `/api/web/referee-admin/settlements/bulk-create?tournament_id=${encodeURIComponent(
          tid
        )}`
      );
      const list = data.items ?? [];
      setItems(list);
      // 초기 편집 — 전부 체크 + 예상 금액 채움.
      const init: Record<string, EditState> = {};
      for (const it of list) {
        init[it.assignmentId] = {
          checked: true,
          amount: String(it.expectedAmount),
          memo: "",
        };
      }
      setEdits(init);
    } catch (e) {
      setError(
        e instanceof AdminApiError ? e.message : "미리보기를 불러오지 못했습니다."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (tournamentId) loadPreview(tournamentId);
    else {
      setItems([]);
      setEdits({});
    }
  }, [tournamentId, loadPreview]);

  // 전체 선택 상태.
  const allChecked = React.useMemo(() => {
    if (items.length === 0) return false;
    return items.every((it) => edits[it.assignmentId]?.checked);
  }, [items, edits]);

  const toggleAll = (v: boolean) => {
    setEdits((prev) => {
      const next = { ...prev };
      for (const it of items) {
        next[it.assignmentId] = {
          ...(next[it.assignmentId] ?? { amount: "0", memo: "" }),
          checked: v,
        };
      }
      return next;
    });
  };
  const toggleOne = (key: string, v: boolean) =>
    setEdits((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { amount: "0", memo: "" }), checked: v },
    }));
  const setAmount = (key: string, v: string) =>
    setEdits((prev) => ({
      ...prev,
      [key]: {
        ...(prev[key] ?? { checked: true, memo: "" }),
        amount: v.replace(/[^0-9]/g, ""), // 숫자만
      },
    }));
  const setMemo = (key: string, v: string) =>
    setEdits((prev) => ({
      ...prev,
      [key]: { ...(prev[key] ?? { checked: true, amount: "0" }), memo: v },
    }));

  // 선택 합계.
  const selected = React.useMemo(() => {
    let count = 0;
    let sum = 0;
    for (const it of items) {
      const e = edits[it.assignmentId];
      if (e?.checked) {
        count += 1;
        sum += parseInt(e.amount || "0", 10) || 0;
      }
    }
    return { count, sum };
  }, [items, edits]);

  // 제출 — 선택 행만 POST(camel body → adminFetch 자동 snake 변환).
  const submit = async () => {
    if (!tournamentId) return;
    const selectedItems = items
      .filter((it) => edits[it.assignmentId]?.checked)
      .map((it) => {
        const e = edits[it.assignmentId];
        return {
          assignmentId: it.assignmentId,
          amount: parseInt(e.amount || "0", 10) || 0,
          memo: e.memo || undefined,
        };
      });
    if (selectedItems.length === 0) {
      setError("선택된 항목이 없습니다.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const data = await adminFetch<BulkResult>(
        "/api/web/referee-admin/settlements/bulk-create",
        {
          method: "POST",
          body: { tournamentId, items: selectedItems },
        }
      );
      setResult(data);
      // 성공 행(선택했고 failed 에 없는 건) 목록에서 제거 — 실패분만 재시도 가능.
      const selectedIds = new Set(selectedItems.map((s) => s.assignmentId));
      const failedIds = new Set((data.failed ?? []).map((f) => f.assignmentId));
      setItems((prev) =>
        prev.filter((it) => {
          const aid = it.assignmentId;
          if (selectedIds.has(aid) && !failedIds.has(aid)) return false;
          return true;
        })
      );
    } catch (e) {
      setError(
        e instanceof AdminApiError ? e.message : "일괄 생성에 실패했습니다."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // 입력 공통 스타일(var 토큰만).
  const inputStyle: React.CSSProperties = {
    padding: "7px 10px",
    border: "1px solid var(--border)",
    background: "var(--card)",
    color: "var(--ink)",
    borderRadius: 8,
    fontSize: 13.5,
    fontFamily: "var(--ff)",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ fontSize: 13.5, color: "var(--ink-mute)", lineHeight: 1.5 }}>
        대회별로 완료(completed) 배정 중 아직 정산이 없는 건을 한 번에 생성합니다.
      </div>

      {/* 대회 선택 */}
      <div className="ad-panel">
        <label style={{ display: "block" }}>
          <span
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 700,
              color: "var(--ink-mute)",
              marginBottom: 6,
            }}
          >
            대회 선택
          </span>
          <select
            value={tournamentId}
            onChange={(e) => {
              setTournamentId(e.target.value);
              setResult(null);
            }}
            style={{ ...inputStyle, width: "100%", padding: "10px 12px" }}
          >
            <option value="">-- 대회를 선택하세요 --</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* 결과 요약 */}
      {result && (
        <div
          style={{
            border: "1px solid var(--ok)",
            background: "color-mix(in srgb, var(--ok) 8%, transparent)",
            borderRadius: 12,
            padding: "14px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
          }}
        >
          <div style={{ fontWeight: 800, color: "var(--ink)" }}>
            생성 완료: {result.created}건
            {result.failed.length > 0 && ` / 실패: ${result.failed.length}건`}
          </div>
          {result.failed.length > 0 && (
            <ul
              style={{
                fontSize: 12.5,
                color: "var(--ink-mute)",
                margin: 0,
                paddingLeft: 16,
              }}
            >
              {result.failed.map((f) => (
                <li key={f.assignmentId}>
                  배정 #{f.assignmentId}: {FAIL_REASON[f.reason] ?? f.reason}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* 에러 */}
      {error && (
        <div
          style={{
            fontSize: 13.5,
            color: "var(--danger)",
            background: "var(--danger-weak)",
            border: "1px solid var(--danger)",
            borderRadius: 10,
            padding: "12px 14px",
          }}
        >
          {error}
        </div>
      )}

      {/* 로딩 */}
      {loading && (
        <div style={{ padding: 32 }}>
          <Empty icon="loader" title="불러오는 중..." />
        </div>
      )}

      {/* 빈 상태 */}
      {!loading && tournamentId && items.length === 0 && !result && (
        <Empty
          icon="inbox"
          title="생성 가능한 배정이 없습니다"
          desc="완료된 배정이 없거나 이미 정산이 존재합니다."
        />
      )}

      {/* 미리보기 테이블 */}
      {!loading && items.length > 0 && (
        <>
          {/* 전체 선택 + 합계 */}
          <div
            className="ad-panel"
            style={{
              display: "flex",
              flexWrap: "wrap",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                fontSize: 14,
                fontWeight: 700,
                color: "var(--ink)",
                cursor: "pointer",
              }}
            >
              <Check on={allChecked} onChange={toggleAll} />
              전체 선택 ({items.length}건 중)
            </label>
            <div style={{ fontSize: 13.5, color: "var(--ink-soft)" }}>
              선택 <b style={{ color: "var(--ink)" }}>{selected.count}</b>건 · 예상 금액{" "}
              <b style={{ color: "var(--primary)" }}>
                {formatNumber(selected.sum)}원
              </b>
            </div>
          </div>

          {/* 행 목록(테이블 대신 카드형 행 — 모바일 안전) */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 8,
            }}
          >
            {items.map((it) => {
              const key = it.assignmentId;
              const e = edits[key] ?? {
                checked: true,
                amount: String(it.expectedAmount),
                memo: "",
              };
              return (
                <div
                  key={key}
                  className="ad-panel"
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "auto minmax(0,1.4fr) auto auto minmax(0,1.2fr)",
                    alignItems: "center",
                    gap: 12,
                    padding: "12px 14px",
                    opacity: e.checked ? 1 : 0.5,
                  }}
                >
                  <Check
                    on={e.checked}
                    onChange={(v) => toggleOne(key, v)}
                  />
                  {/* 경기일 + 심판 */}
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: "var(--ink)" }}>
                      {it.refereeName}
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color: "var(--ink-mute)",
                        }}
                      >
                        {ROLE_LABEL[it.role] ?? it.role}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: "var(--ink-mute)" }}>
                      {formatDate(it.match?.scheduledAt ?? null)}
                      {it.match?.roundName ? ` · ${it.match.roundName}` : ""}
                      {it.match?.venueName ? ` · ${it.match.venueName}` : ""}
                    </div>
                  </div>
                  {/* 금액 입력 */}
                  <div style={{ textAlign: "right" }}>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={e.amount}
                      onChange={(ev) => setAmount(key, ev.target.value)}
                      style={{
                        ...inputStyle,
                        width: 110,
                        textAlign: "right",
                        fontFamily: "var(--ff-mono)",
                      }}
                    />
                    {it.feeSnapshot === null && (
                      <div
                        style={{
                          fontSize: 10.5,
                          color: "var(--ink-mute)",
                          marginTop: 2,
                        }}
                      >
                        (단가표 기준)
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: 12, color: "var(--ink-mute)" }}>원</span>
                  {/* 메모 */}
                  <input
                    type="text"
                    value={e.memo}
                    onChange={(ev) => setMemo(key, ev.target.value)}
                    placeholder="메모"
                    style={{ ...inputStyle, width: "100%" }}
                  />
                </div>
              );
            })}
          </div>

          {/* 제출 */}
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
            <Btn
              variant="primary"
              icon="check"
              disabled={submitting || selected.count === 0}
              onClick={submit}
            >
              {submitting ? "생성 중..." : `${selected.count}건 일괄 생성`}
            </Btn>
          </div>
        </>
      )}
    </div>
  );
}
