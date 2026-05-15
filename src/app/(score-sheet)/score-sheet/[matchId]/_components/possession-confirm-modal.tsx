/**
 * PossessionConfirmModal — PR-Possession-2 (2026-05-16).
 *
 * 왜 (이유):
 *   FIBA Article 12.5 (Held Ball / Alternating Possession) — 경기 중 헬드볼 발생 시
 *   화살표가 가리키는 팀이 다음 공격권을 가짐. 운영자가 헤더 화살표 클릭 시 본 모달
 *   확인 후 applyHeldBall (PR-1 helper) 호출 → arrow 토글.
 *
 *   사용자 결재: ConfirmModal 재사용 박제 (~60 LOC) — 4종 모달 시각 정합 자동.
 *
 * 사용:
 *   <PossessionConfirmModal
 *     open={heldBallConfirmOpen}
 *     takingTeam={possession.arrow ?? "home"}
 *     takingTeamName={teamName}
 *     onConfirm={handleHeldBallConfirm}
 *     onClose={() => setHeldBallConfirmOpen(false)}
 *   />
 *
 * 절대 룰:
 *   - var(--color-*) 토큰만 / lucide-react ❌ / 빨강 본문 텍스트 ❌
 *   - ConfirmModal 재사용 = 4종 모달 패턴 (ESC + backdrop + sm:flex-row + 인쇄 차단) 자동 적용
 */

"use client";

import { ConfirmModal } from "./confirm-modal";

interface PossessionConfirmModalProps {
  open: boolean;
  // 화살표가 가리키는 팀 = 헬드볼 발생 시 공격권 획득 팀
  takingTeam: "home" | "away";
  // 표시용 팀 이름 (homeRoster / awayRoster.teamName)
  takingTeamName: string;
  onConfirm: () => void;
  onClose: () => void;
}

export function PossessionConfirmModal({
  open,
  takingTeam: _takingTeam,
  takingTeamName,
  onConfirm,
  onClose,
}: PossessionConfirmModalProps) {
  // ConfirmModal 의 onSelect = value 분기 — "confirm" = 헬드볼 박제 / "cancel" = 닫기
  function handleSelect(value: string) {
    if (value === "confirm") {
      onConfirm();
    } else {
      onClose();
    }
  }

  return (
    <ConfirmModal
      open={open}
      title="헬드볼 발생 — 공격권 변경"
      message={
        <>
          <p>
            헬드볼이 발생했습니다. 공격권 화살표 방향에 따라 다음 공격권은{" "}
            {/* 강조 = bold + var(--color-info) (빨강 본문 텍스트 룰 ❌ — info 색 사용) */}
            <strong style={{ color: "var(--color-info)", fontWeight: 700 }}>
              {takingTeamName}
            </strong>{" "}
            이(가) 가져갑니다.
          </p>
          <p
            className="mt-2 text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            (FIBA Article 12.5 — Alternating Possession). 확인 시 화살표는 반대
            팀으로 토글됩니다.
          </p>
        </>
      }
      options={[
        { value: "cancel", label: "취소" },
        { value: "confirm", label: "확인 (공격권 변경)", isPrimary: true },
      ]}
      onSelect={handleSelect}
      onClose={onClose}
    />
  );
}
