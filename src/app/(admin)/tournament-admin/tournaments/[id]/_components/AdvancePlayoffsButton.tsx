/**
 * 2026-05-16 PR-Admin-2 — 단일 순위전 진출 trigger (admin 흐름 §6.5 우선 2).
 *
 * 이유(왜):
 *   - admin-flow-audit-2026-05-16 §3 단계 10 = matches 페이지에서 "예선 종료 → 순위전 진출".
 *   - 기존 teams 페이지 헤더에 박제된 "순위전 자동 채우기" 버튼은 운영 흐름상 부적절한 위치.
 *   - 본 컴포넌트 = matches 페이지 헤더 우측 단일 trigger 로 이동 (teams 에서 제거 + matches 박제).
 *   - match-sync.ts:674 자동 trigger 와 양면 박제 (운영자 수동 fallback — advance route idempotent).
 *
 * 핵심 로직:
 *   - POST /api/web/admin/tournaments/[id]/advance-placeholders 호출 (body {} = 모든 종 일괄)
 *   - 응답 (apiSuccess snake_case 변환): { total_updated, total_skipped, total_errors, results: [{ division_code, updated, skipped, errors, standings }] }
 *   - 결과 모달 Card 표 (종별 / UPDATE / SKIP / 에러 4 col) → 에러 0 = success 톤 / 에러 ≥1 = warning 톤
 *   - "확인" 클릭 → onSuccess() → matches load() refetch
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-info) Navy 톤 trigger 버튼 / rounded-[4px] / material-symbols "trending_up"
 *   - 모달 = Card 패턴 / var(--color-success) 또는 var(--color-warning) 배너
 *   - 모바일 44px+ 터치
 */

"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

type Props = {
  tournamentId: string;
  // 종별 코드 (선택 — 결과 모달 노출 라벨 안내용. 미사용 시 응답 division_code 표기)
  divisionCodes?: string[];
  // 호출자 (matches-client) refetch trigger
  onSuccess?: () => void;
};

// 응답 결과 row (apiSuccess snake_case 변환 후)
type ResultRow = {
  division_code: string;
  updated: number;
  skipped: number;
  errors: Array<{ match_id: string; reason: string }>;
};

type ResponsePayload = {
  total_updated: number;
  total_skipped: number;
  total_errors: number;
  results: ResultRow[];
};

export function AdvancePlayoffsButton({ tournamentId, onSuccess }: Props) {
  // 호출 중 표시 (중복 클릭 방지)
  const [loading, setLoading] = useState(false);
  // 결과 모달 데이터 (null = 모달 닫힘 / not null = 모달 표시)
  const [result, setResult] = useState<ResponsePayload | null>(null);
  // 네트워크 / 서버 오류 메시지 (null = 정상)
  const [error, setError] = useState<string | null>(null);

  // ─────────────────────────────────────────────────────────────
  // 클릭 핸들러 — confirm() 다이얼로그 → POST 호출 → 결과 모달
  // ─────────────────────────────────────────────────────────────
  async function handleClick() {
    // confirm 다이얼로그 — 운영자 의도 재확인 (idempotent 안내 포함)
    if (
      !confirm(
        "모든 종별 순위전 placeholder 매치를 standings 기반으로 자동 채우시겠습니까?\n\n조별 예선 종료 후 사용하세요.\n재호출 시 이미 채워진 슬롯은 보호됩니다.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/web/admin/tournaments/${tournamentId}/advance-placeholders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "자동 채우기 실패");
        return;
      }
      // apiSuccess 응답 = { success: true, data: { ... } } 구조 확인
      // data 안에 snake_case 변환된 payload
      const payload: ResponsePayload = json.data ?? json;
      setResult(payload);
    } catch {
      setError("네트워크 오류 — 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // 모달 닫기 — 결과 확인 후 호출자 refetch trigger
  // ─────────────────────────────────────────────────────────────
  function handleClose() {
    setResult(null);
    setError(null);
    onSuccess?.();
  }

  return (
    <>
      {/* trigger 버튼 — matches 헤더 우측 박제 (BDR Navy 톤) */}
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center gap-1 rounded-[4px] px-4 py-2 text-xs font-semibold transition-colors disabled:opacity-50"
        style={{
          backgroundColor: "var(--color-info)",
          color: "#ffffff",
          minHeight: 44,
        }}
        title="모든 종별 예선 종료 후 순위전(A조 N위 vs B조 N위) 자동 매핑"
      >
        <span className="material-symbols-outlined align-middle text-[18px]" aria-hidden="true">
          trending_up
        </span>
        {loading ? "처리 중..." : "예선 종료 → 순위전 진출"}
      </button>

      {/* 에러 모달 — 네트워크/서버 오류 (응답 검증 실패 케이스) */}
      {error && (
        <ResultModal onClose={() => setError(null)}>
          <Card
            style={{
              backgroundColor: "color-mix(in srgb, var(--color-error) 10%, transparent)",
              borderColor: "var(--color-error)",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined flex-shrink-0"
                style={{ color: "var(--color-error)", fontSize: 24 }}
                aria-hidden="true"
              >
                error
              </span>
              <div className="flex-1">
                <p className="font-semibold" style={{ color: "var(--color-error)" }}>
                  순위전 자동 채우기 실패
                </p>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">{error}</p>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setError(null)}
                className="rounded-[4px] px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--color-elevated)",
                  color: "var(--color-text-primary)",
                  minHeight: 44,
                }}
              >
                닫기
              </button>
            </div>
          </Card>
        </ResultModal>
      )}

      {/* 결과 모달 — 종별 표 (UPDATE / SKIP / 에러 4 col) */}
      {result && (
        <ResultModal onClose={handleClose}>
          <Card
            style={{
              // 에러 0 = success 톤 / 에러 ≥1 = warning 톤
              backgroundColor:
                result.total_errors === 0
                  ? "color-mix(in srgb, var(--color-success) 10%, transparent)"
                  : "color-mix(in srgb, var(--color-warning) 10%, transparent)",
              borderColor:
                result.total_errors === 0 ? "var(--color-success)" : "var(--color-warning)",
            }}
          >
            <div className="flex items-start gap-3">
              <span
                className="material-symbols-outlined flex-shrink-0"
                style={{
                  color:
                    result.total_errors === 0 ? "var(--color-success)" : "var(--color-warning)",
                  fontSize: 24,
                }}
                aria-hidden="true"
              >
                {result.total_errors === 0 ? "check_circle" : "warning"}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className="font-semibold"
                  style={{
                    color:
                      result.total_errors === 0 ? "var(--color-success)" : "var(--color-warning)",
                  }}
                >
                  {result.total_errors === 0
                    ? "순위전 자동 채우기 완료"
                    : "순위전 자동 채우기 — 일부 에러"}
                </p>
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  업데이트 {result.total_updated}건 / 스킵 {result.total_skipped}건
                  {result.total_errors > 0 && ` / 에러 ${result.total_errors}건`}
                </p>
              </div>
            </div>

            {/* 종별 결과 표 — 4 col (종별 / UPDATE / SKIP / 에러) */}
            {result.results.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr
                      className="border-b text-left"
                      style={{ borderColor: "var(--color-border)" }}
                    >
                      <th className="px-2 py-2 font-semibold">종별</th>
                      <th className="px-2 py-2 text-right font-semibold">UPDATE</th>
                      <th className="px-2 py-2 text-right font-semibold">SKIP</th>
                      <th className="px-2 py-2 text-right font-semibold">에러</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.results.map((r) => (
                      <tr
                        key={r.division_code}
                        className="border-b"
                        style={{ borderColor: "var(--color-border)" }}
                      >
                        <td className="px-2 py-2 font-mono">{r.division_code}</td>
                        <td className="px-2 py-2 text-right">
                          <span
                            style={{
                              color:
                                r.updated > 0
                                  ? "var(--color-success)"
                                  : "var(--color-text-muted)",
                            }}
                          >
                            {r.updated}
                          </span>
                        </td>
                        <td className="px-2 py-2 text-right text-[var(--color-text-muted)]">
                          {r.skipped}
                        </td>
                        <td className="px-2 py-2 text-right">
                          <span
                            style={{
                              color:
                                r.errors.length > 0
                                  ? "var(--color-warning)"
                                  : "var(--color-text-muted)",
                            }}
                          >
                            {r.errors.length}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* 확인 버튼 — onSuccess() 호출 → matches load() refetch */}
            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="rounded-[4px] px-4 py-2 text-sm font-semibold"
                style={{
                  backgroundColor: "var(--color-info)",
                  color: "#ffffff",
                  minHeight: 44,
                }}
              >
                확인
              </button>
            </div>
          </Card>
        </ResultModal>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// 모달 wrapper — backdrop + 가운데 정렬 (Card 컴포넌트 외 dependency 0)
// ─────────────────────────────────────────────────────────────
function ResultModal({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
