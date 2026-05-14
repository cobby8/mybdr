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

import { useCallback, useEffect, useState } from "react";
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
  // Phase 19 PR-S2 — controlled `open` 패턴 (선택형).
  //   왜: 시안 toolbar 의 "경기 종료" 버튼 = 본 컴포넌트의 confirm modal trigger 외부 위임.
  //   기본 (props 미전달): 기존 internal state 그대로 — 운영 동작 100% 보존.
  //   controlled (open + onOpenChange 둘 다 전달): 외부 toolbar 가 모달 open/close 제어.
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  // Phase 19 PR-S2 — frame 하단 큰 "경기 종료" 버튼 + 종료 후 안내 카드 hide 옵션.
  //   왜: 시안 toolbar 가 종료 trigger 를 흡수하면 frame 하단 큰 버튼 시각 중복.
  //   true 시: 종료 버튼 + submitted 카드 모두 hide / Confirm Modal 만 렌더.
  //   false (기본): 기존 동작 100% 보존 (frame 하단 종료 버튼 + 종료 후 카드 표시).
  hideTriggerButton?: boolean;
  // Phase 19 PR-S2 후속 (2026-05-14) — submitted 상태 외부 알림 콜백.
  //   왜: controlled 모드에서 외부 toolbar 가 "경기 종료" 버튼 disabled 시각 분기를 적용할 수
  //   있도록, submitted=true 가 되는 시점을 form 에 알린다. 콜백 미전달 시 영향 0.
  onSubmittedChange?: (submitted: boolean) => void;
}

export function MatchEndButton({
  matchId,
  homeTeamName,
  awayTeamName,
  final,
  buildPayload,
  disabled,
  open: controlledOpen,
  onOpenChange,
  hideTriggerButton,
  onSubmittedChange,
}: MatchEndButtonProps) {
  // controlled vs uncontrolled 결정:
  //   controlledOpen !== undefined = 외부 제어 (toolbar 가 setMatchEndOpen 호출) → useState 무시
  //   undefined = 기존 internal state (uncontrolled) — 운영 동작 100% 보존
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const { showToast } = useToast();

  // PR-S2 후속 fix 2 (2026-05-14) — setOpen 을 useCallback 으로 메모이제이션.
  //   왜: useEffect 의 ESC 핸들러가 setOpen 을 호출하므로 deps 에 포함해야 안전.
  //   inline 함수면 매 render 마다 새 reference → useEffect 가 매번 재실행 (성능 + stale closure 잠재).
  //   useCallback 으로 isControlled / onOpenChange 의존성만 추적하면 안정 reference 유지.
  //
  // PR-S2 후속 fix 1 (2026-05-14) — submitted 가드 추가.
  //   왜: setOpen(true) = modal 열기 trigger. submitted 후 toolbar 가 다시 setMatchEndOpen(true)
  //   호출해도 modal 재오픈 차단 (재진입 시 BFF 중복 호출 차단의 1차 방어선).
  const setOpen = useCallback(
    (next: boolean) => {
      // submitted 상태에서 modal 다시 열기 시도 차단 (close 는 항상 허용)
      if (next && submitted) return;
      if (!isControlled) setInternalOpen(next);
      onOpenChange?.(next);
    },
    [isControlled, onOpenChange, submitted],
  );

  // PR-S2 후속 fix (2026-05-14) — submitted 외부 알림.
  //   왜: form (외부) 이 toolbar 의 "경기 종료" 버튼 disabled 시각 분기를 적용할 수 있도록.
  //   콜백 미전달 시 동작 영향 0.
  useEffect(() => {
    onSubmittedChange?.(submitted);
  }, [submitted, onSubmittedChange]);

  // ESC = 모달 닫기 (제출 중에는 차단)
  // PR-S2 후속 fix 2 — deps 에 setOpen 추가 (useCallback 메모이제이션으로 안정 reference).
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !submitting) {
        setOpen(false);
      }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, submitting, setOpen]);

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
  //
  // PR-S2 후속 fix 1 (2026-05-14) — submitted 가드 강화.
  //   왜: 기존 PR-S2 전 코드는 `{!submitted && <button>}` 분기로 종료 버튼 자체가 hide 되어
  //   재진입이 UI 단에서 자연 차단됐다. PR-S2 후 toolbar 의 "경기 종료" 버튼은 submitted 를
  //   인지하지 못해 modal 재오픈 → handleConfirm 재호출 가능 → 토스트 / 라이브 발행 중복 위험.
  //   1차 방어선 (setOpen 의 submitted 가드) 외 2차 방어선으로 handleConfirm 진입부에서도 차단.
  //   서버 멱등성에만 의존하지 않고 클라이언트 단에서 명시적으로 막는다.
  async function handleConfirm() {
    if (submitting || submitted) return;
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
    // Phase 6 — `no-print` = 인쇄 시 경기 종료 영역 전체 제거.
    //   이유: FIBA 양식 = 종이 기록지. 인쇄 시 종료 버튼 / confirm 모달 / 종료 후 카드는
    //   양식과 무관 → 숨김 (실서명 영역만 출력)
    //
    // Phase 19 PR-S2 — hideTriggerButton=true 시: 종료 버튼 + submitted 카드 hide / 모달만 유지.
    //   외부 toolbar 가 trigger 흡수 — 시각 중복 방지.
    <div className={hideTriggerButton ? "no-print" : "no-print mt-4"}>
      {/* 종료 후 안내 카드 (submitted = true 시) — hideTriggerButton 시 hide */}
      {submitted && !hideTriggerButton && (
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

      {/* 종료 버튼 — hideTriggerButton 시 hide (toolbar 가 흡수) */}
      {!submitted && !hideTriggerButton && (
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
