"use client";

import { useEffect, useState } from "react";
import { JerseyChangeRequestModal } from "./jersey-change-request-modal";

/**
 * JerseyChangeButton
 * ─────────────────────────────────────────────────────────
 * 이유(왜): 팀 페이지 로스터의 본인 row 옆 "번호 변경" 버튼 + 모달 트리거.
 *   RosterTabV2 는 server component 라서 인터랙션을 별도 client wrapper 로 분리.
 *
 * 진입 조건 (server 단에서 props 로 보장):
 *  - 본인 (currentUserId === member.userId)
 *  - active 멤버
 *  - 단, pending 신청 여부는 클라이언트에서 GET 으로 확인 (mount 시 1회)
 *    → SSR 1쿼리 추가하지 않고 본인 rows 만 fetch (성능 영향 0)
 *
 * 표시:
 *  - pending 없음: "번호 변경" 활성 버튼
 *  - pending jersey_change 있음: "[#N] 변경 승인 대기 중" disabled
 *  - pending 다른 type 있음: "신청 대기 중" disabled (PR8/PR9 흐름과 충돌 회피)
 */

type Props = {
  teamId: string;
  currentJersey: number | null; // 본인 현재 등번호
};

type PendingState =
  | { kind: "loading" }
  | { kind: "none" }
  | { kind: "jersey_change"; newJersey: number | null }
  | { kind: "other"; requestType: string };

export function JerseyChangeButton({ teamId, currentJersey }: Props) {
  const [pending, setPending] = useState<PendingState>({ kind: "loading" });
  const [modalOpen, setModalOpen] = useState(false);

  // mount 시 본인 pending 신청 1회 조회 (PR6 GET API — 일반 멤버는 본인 신청만 응답)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/web/teams/${teamId}/requests?status=pending`);
        const json = await res.json().catch(() => ({}));
        if (cancelled) return;
        const list = (json?.data?.requests ?? []) as Array<{
          requestType: string;
          payload: unknown;
        }>;
        if (list.length === 0) {
          setPending({ kind: "none" });
          return;
        }
        const first = list[0];
        if (first.requestType === "jersey_change") {
          // payload 에서 newJersey 추출 (snake_case 변환 0 — JSON 컬럼)
          const p = first.payload as { newJersey?: number } | null;
          setPending({
            kind: "jersey_change",
            newJersey: typeof p?.newJersey === "number" ? p.newJersey : null,
          });
        } else {
          setPending({ kind: "other", requestType: first.requestType });
        }
      } catch {
        // 실패 시 보수적으로 활성 (사용자가 신청 시도 → 서버 ALREADY_PENDING 차단)
        if (!cancelled) setPending({ kind: "none" });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [teamId]);

  // 신청 성공 시 즉시 pending 상태 갱신 (페이지 refresh 전에도 시각 즉시 반영)
  function handleSuccess() {
    setPending({ kind: "loading" }); // 새 GET 으로 재조회 트리거 대신 잠깐 loading
    // 짧은 지연 후 재조회
    setTimeout(() => {
      fetch(`/api/web/teams/${teamId}/requests?status=pending`)
        .then((r) => r.json())
        .then((json) => {
          const list = (json?.data?.requests ?? []) as Array<{
            requestType: string;
            payload: unknown;
          }>;
          if (list.length === 0) {
            setPending({ kind: "none" });
          } else {
            const first = list[0];
            if (first.requestType === "jersey_change") {
              const p = first.payload as { newJersey?: number } | null;
              setPending({
                kind: "jersey_change",
                newJersey: typeof p?.newJersey === "number" ? p.newJersey : null,
              });
            } else {
              setPending({ kind: "other", requestType: first.requestType });
            }
          }
        })
        .catch(() => setPending({ kind: "none" }));
    }, 300);
  }

  // 버튼 표시 분기
  let buttonLabel: string = "번호 변경";
  let disabled = false;
  if (pending.kind === "loading") {
    buttonLabel = "확인 중...";
    disabled = true;
  } else if (pending.kind === "jersey_change") {
    buttonLabel =
      pending.newJersey !== null ? `#${pending.newJersey}번 승인 대기` : "변경 승인 대기";
    disabled = true;
  } else if (pending.kind === "other") {
    buttonLabel = "신청 대기 중";
    disabled = true;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={disabled}
        className="btn"
        style={{
          fontSize: 11,
          padding: "4px 8px",
          minHeight: 28,
          opacity: disabled ? 0.65 : 1,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        {buttonLabel}
      </button>
      <JerseyChangeRequestModal
        teamId={teamId}
        currentJersey={currentJersey}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSuccess}
      />
    </>
  );
}
