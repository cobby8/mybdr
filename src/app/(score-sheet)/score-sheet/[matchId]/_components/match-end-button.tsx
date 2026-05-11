/**
 * MatchEndButton — 경기 종료 버튼 + confirm modal + BFF POST submit.
 *
 * 2026-05-12 — Phase 3.5 신규 (Phase 5 일부 선진입 — 사용자 결재 §5).
 *
 * 왜 (이유):
 *   FIBA 양식 마무리 = 경기 종료 확정 + 라이브 페이지 자동 발행. Phase 5 서명/노트는
 *   후속이지만, 현장에서 "Q4 끝났는데 어떻게 끝내?" 흐름이 막혀있어 사용자 결재 §5
 *   에서 본 Phase 3.5 에 선진입 결정.
 *
 * 동작:
 *   1. "경기 종료" 버튼 클릭 → confirm modal
 *   2. 모달 안: 양 팀 점수 + Winner + ⚠️ 라이브 발행 안내
 *   3. "경기 종료 확인" 클릭 → BFF POST `/api/web/score-sheet/{matchId}/submit`
 *      status="completed" + running_score + fouls 박제
 *   4. 응답 성공 → toast "매치 종료 완료" + 라이브 페이지 Link
 *   5. 실패 → toast 에러 + 모달 유지 (재시도 가능)
 *
 * 절대 룰:
 *   - var(--*) 토큰만 / lucide-react ❌ / Material Symbols Outlined 만
 *   - 빨강 본문 텍스트 ❌ — 종료 확인 버튼 = primary 빨강 배경 (위험 액션 예외)
 *   - 터치 영역 44px+
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useToast } from "@/contexts/toast-context";
import type { FinalScore } from "@/lib/score-sheet/running-score-types";

interface MatchEndButtonProps {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  final: FinalScore;
  // 제출 페이로드 빌더 — caller (ScoreSheetForm) 가 running_score/fouls/quarter_scores 박제
  buildPayload: () => unknown;
  disabled?: boolean;
}

export function MatchEndButton({
  matchId,
  homeTeamName,
  awayTeamName,
  final,
  buildPayload,
  disabled,
}: MatchEndButtonProps) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  // ESC = 모달 닫기 (제출 중에는 차단)
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, submitting]);

  // 승팀명 표시 (tie / none / home / away)
  const winnerLabel =
    final.winner === "home"
      ? homeTeamName
      : final.winner === "away"
        ? awayTeamName
        : final.winner === "tie"
          ? "동점 (OT 필요)"
          : "—";

  // BFF POST 호출
  async function handleConfirm() {
    if (submitting) return;
    setSubmitting(true);
    try {
      const payload = buildPayload();
      const res = await fetch(`/api/web/score-sheet/${matchId}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        credentials: "include",
      });
      const json = await res.json();
      // BFF 응답 형식 — 성공: apiSuccess (snake_case 키만) / 실패: apiError ({ error, code })
      // 이유: res.ok 가 가장 신뢰할 수 있는 단일 판정 — apiSuccess 는 success 키 없음 (errors.md 5회 재발 예방)
      if (!res.ok) {
        const errMsg =
          (typeof json?.error === "string" && json.error) ||
          json?.message ||
          "제출 실패 (알 수 없는 오류)";
        showToast(errMsg, "error");
        setSubmitting(false);
        return;
      }
      // 성공
      showToast("매치 종료 완료 — 라이브 페이지에 발행됩니다.", "success");
      setSubmitted(true);
      setSubmitting(false);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      showToast(`제출 실패: ${msg}`, "error");
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-4">
      {/* 종료 후 안내 카드 (submitted = true 시) */}
      {submitted && (
        <div
          className="mb-3 rounded-[4px] px-3 py-3 text-center"
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--color-success) 15%, transparent)",
            color: "var(--color-success)",
            border: "1px solid var(--color-success)",
          }}
        >
          <p className="text-sm font-semibold">✓ 매치 종료 완료</p>
          <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
            라이브 페이지에 자동 발행되었습니다.
          </p>
          <Link
            href={`/live/${matchId}`}
            target="_blank"
            className="mt-2 inline-flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-xs font-medium"
            style={{
              backgroundColor: "var(--color-success)",
              color: "#fff",
            }}
          >
            <span className="material-symbols-outlined text-sm">
              open_in_new
            </span>
            라이브 페이지 열기
          </Link>
        </div>
      )}

      {/* 종료 버튼 */}
      {!submitted && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          disabled={disabled}
          className="flex w-full items-center justify-center gap-2 rounded-[4px] py-3 text-base font-semibold disabled:opacity-40"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "#fff",
            touchAction: "manipulation",
          }}
          aria-label="경기 종료"
        >
          <span className="material-symbols-outlined text-lg">flag</span>
          경기 종료
        </button>
      )}

      {/* Confirm Modal */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center px-4"
          style={{ backgroundColor: "color-mix(in srgb, #000 60%, transparent)" }}
          onClick={() => !submitting && setOpen(false)}
          role="dialog"
          aria-modal="true"
          aria-labelledby="match-end-modal-title"
        >
          <div
            className="w-full max-w-md rounded-[4px] p-4"
            style={{
              backgroundColor: "var(--color-background)",
              border: "1px solid var(--color-border)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="match-end-modal-title"
              className="text-base font-bold"
              style={{ color: "var(--color-text-primary)" }}
            >
              경기 종료
            </h2>

            {/* 점수 + Winner 요약 */}
            <div
              className="mt-3 rounded-[4px] p-3"
              style={{
                backgroundColor: "var(--color-surface)",
                border: "1px solid var(--color-border)",
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 text-center">
                  <div
                    className="line-clamp-1 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {homeTeamName}
                  </div>
                  <div
                    className="font-mono text-2xl font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {final.homeTotal}
                  </div>
                </div>
                <div
                  className="text-base font-semibold"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  :
                </div>
                <div className="flex-1 text-center">
                  <div
                    className="line-clamp-1 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {awayTeamName}
                  </div>
                  <div
                    className="font-mono text-2xl font-bold"
                    style={{ color: "var(--color-text-primary)" }}
                  >
                    {final.awayTotal}
                  </div>
                </div>
              </div>
              <div
                className="mt-2 text-center text-sm font-semibold"
                style={{
                  color:
                    final.winner === "tie"
                      ? "var(--color-warning)"
                      : "var(--color-success)",
                }}
              >
                Winner: {winnerLabel}
              </div>
            </div>

            {/* ⚠️ 안내 */}
            <div
              className="mt-3 rounded-[4px] px-3 py-2 text-xs"
              style={{
                backgroundColor:
                  "color-mix(in srgb, var(--color-warning) 15%, transparent)",
                color: "var(--color-warning)",
              }}
            >
              <span className="material-symbols-outlined mr-1 align-middle text-sm">
                warning
              </span>
              매치 종료 후 라이브 페이지에 자동 발행됩니다. 점수 / 파울 / 박스스코어가
              모두 박제됩니다.
            </div>

            {/* 버튼 영역 */}
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={submitting}
                className="flex-1 rounded-[4px] py-2 text-sm font-medium disabled:opacity-40"
                style={{
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text-primary)",
                  touchAction: "manipulation",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={submitting}
                className="flex-1 rounded-[4px] py-2 text-sm font-semibold disabled:opacity-40"
                style={{
                  backgroundColor: "var(--color-primary)",
                  color: "#fff",
                  touchAction: "manipulation",
                }}
              >
                {submitting ? "제출 중..." : "경기 종료 확인"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
