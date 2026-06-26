/**
 * 2026-05-28 PR-1C-9 (B1) — 셋업 hub 모바일 sticky 공개 버튼.
 *
 * 이유(왜):
 *   - 시안 AdminTournamentSetupHub 의 atsh-mobile-sticky 박제.
 *   - 운영 공개 게이트(PublishGate)는 체크리스트 본문 안 → 모바일에서 스크롤 내려야 보임.
 *   - 모바일(≤720px)에서 하단 고정 막대로 "공개까지 N개 남음" + 공개 버튼을 항상 노출.
 *   - PC(>720px)는 hidden — 기존 PublishGate 가 본문에서 처리 (중복 노출 방지).
 *
 * 데이터/API:
 *   - 새 fetch/API/Prisma 없음. 기존 POST /api/web/tournaments/[id]/site/publish 재사용
 *     (SetupChecklist > PublishGate 와 동일 엔드포인트).
 *   - 게이트 판정값(canPublish 결과)은 서버에서 산출돼 props 로 전달 (재계산 0).
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-*) 토큰만 / Material Symbols Outlined / 4px·chip 라운드 / 44px+ 터치
 *   - sm:hidden = 모바일 전용 (Tailwind sm 분기 640px ≈ 시안 720px 대응)
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";

type Props = {
  tournamentId: string;
  // 공개 가능 여부 (canPublish 결과) — 서버 산출값 전달
  canPublish: boolean;
  // 미충족 필수 항목 수 (시안 "공개까지 N개 남음")
  missingCount: number;
  // 사이트 공개 상태 (이미 공개 중이면 sticky 미노출)
  isSitePublished: boolean;
  // 사이트 박제 여부 (미박제면 공개 버튼 대신 안내)
  hasSite: boolean;
};

export function SetupHubMobileSticky({
  tournamentId,
  canPublish,
  missingCount,
  isSitePublished,
  hasSite,
}: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  // 이미 공개 중이면 모바일 sticky 불필요 (본문 PublishGate 가 비공개 전환 담당)
  if (isSitePublished) return null;

  // 공개 활성 조건 = 사이트 박제됨 + 게이트 통과
  const enabled = hasSite && canPublish;

  // 공개 액션 — PublishGate 와 동일 엔드포인트 (새 fetch 아님)
  const handlePublish = async () => {
    if (!enabled || busy) return;
    setBusy(true);
    try {
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/site/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: true }),
        }
      );
      if (res.ok) {
        // 성공 시 서버 컴포넌트 재렌더링 (페이지 상태 갱신)
        router.refresh();
      }
      // 실패 시 본문 PublishGate 에서 상세 오류 노출 — 여기선 sticky 만 복귀
    } finally {
      setBusy(false);
    }
  };

  return (
    // 이유: 시안 atsh-mobile-sticky = 모바일 하단 고정. PC(sm 이상)는 hidden — 본문 게이트가 처리.
    <div
      className="sticky bottom-0 left-0 right-0 z-10 flex items-center justify-between gap-2.5 border-t px-3.5 py-3 sm:hidden"
      style={{
        backgroundColor: "var(--color-elevated)",
        borderColor: "var(--color-border)",
        // 시안 box-shadow 0 -4px 12px — 토큰 부재 → rgba 음영(검정 알파, 색상 아닌 그림자)
        boxShadow: "0 -4px 12px color-mix(in srgb, #000 18%, transparent)",
      }}
    >
      <div className="min-w-0">
        <div className="text-[13px] font-bold text-[var(--color-text-primary)]">
          {enabled ? "공개 준비 완료" : `공개까지 ${missingCount}개 남음`}
        </div>
        <div className="truncate text-[11.5px] text-[var(--color-text-muted)]">
          {hasSite
            ? "신청 정책 · 사이트 · 기록 · 대진"
            : "사이트를 먼저 박제하세요"}
        </div>
      </div>
      <button
        type="button"
        onClick={handlePublish}
        disabled={!enabled || busy}
        className="inline-flex items-center gap-1 rounded-[4px] px-4 py-2 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          backgroundColor: enabled
            ? "var(--color-primary)"
            : "var(--color-elevated)",
          color: enabled ? "var(--color-on-primary)" : "var(--color-text-muted)",
          minHeight: 44, // 디자인 룰 44px+
        }}
      >
        {/* Material public/lock → lucide globe/lock */}
        <Icon name={enabled ? "globe" : "lock"} size={18} />
        {busy ? "공개 중..." : "공개"}
      </button>
    </div>
  );
}
