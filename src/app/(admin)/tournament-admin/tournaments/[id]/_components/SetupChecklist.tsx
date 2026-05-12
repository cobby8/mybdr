/**
 * 2026-05-13 UI-1 — 대회 셋업 체크리스트 hub.
 * 2026-05-13 UI-5 — 공개 게이트 도입 (클라이언트 컴포넌트로 전환).
 *
 * 이유(왜):
 *   - dashboard 의 8 메뉴 카드는 "어디서 뭘 해야하는지" 만 안내했지 "지금 어디까지 왔는지" 못 보여줌.
 *   - 체크리스트 카드 8개 + 상단 progress bar 로 "진행도 + 잠금 단계 + 진입 링크" 를 한 화면에 통합.
 *   - UI-5: 필수 7항목 ✅ 일 때만 공개 버튼 활성. 미충족 시 disabled + 사유 노출 (서버 가드 = /site/publish).
 *
 * 구성:
 *   1. 상단 progress bar (`completed / total` + %)
 *   2. 8 카드 (Link wrapper / status 별 색상 / 잠금 시 cursor-not-allowed)
 *   3. 공개 버튼 (canPublish 통과 시 활성 / 미통과 시 잠금 + 미충족 항목 안내) + 비공개 전환 버튼 (공개 중일 때)
 *
 * 디자인 룰 (BDR 13):
 *   - var(--color-*) 토큰만 / Material Symbols Outlined / 4px border-radius / 44px+ 터치
 *   - 색상: ✅ accent / 🔄 warning / ⚪ text-muted / 🔒 muted + opacity 0.6
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  canPublish,
  type SetupProgress,
  type ChecklistItem,
  type ChecklistStatus,
} from "@/lib/tournaments/setup-status";

// ─────────────────────────────────────────────────────────────────────────
// status → 색상/아이콘 매핑 (단일 진실의 원천 — UI 룰 변경 시 한 곳만 수정)
// ─────────────────────────────────────────────────────────────────────────

// 카드 좌측 상태 아이콘 (Material Symbols 이름)
const STATUS_ICON: Record<ChecklistStatus, string> = {
  complete: "check_circle",
  in_progress: "pending",
  empty: "radio_button_unchecked",
  locked: "lock",
};

// 카드 좌측 아이콘 색상 (CSS 변수)
const STATUS_COLOR: Record<ChecklistStatus, string> = {
  complete: "var(--color-accent)",
  in_progress: "var(--color-warning)",
  empty: "var(--color-text-muted)",
  locked: "var(--color-text-muted)",
};

// 카드 좌측 상태 라벨 (한국어 — 시각 안내)
const STATUS_LABEL: Record<ChecklistStatus, string> = {
  complete: "완료",
  in_progress: "진행 중",
  empty: "미설정",
  locked: "잠금",
};

// ─────────────────────────────────────────────────────────────────────────
// 컴포넌트
// ─────────────────────────────────────────────────────────────────────────

type Props = {
  progress: SetupProgress;
  // UI-5 공개 게이트 — POST /api/web/tournaments/[id]/site/publish 에 필요
  tournamentId: string;
  // 현재 사이트 공개 상태 (사이트 박제됐을 때만 의미. 미박제 시 false)
  isSitePublished: boolean;
  // 사이트 박제 여부 (false 면 공개 버튼 대신 "사이트 만들기" 링크)
  hasSite: boolean;
};

export function SetupChecklist({
  progress,
  tournamentId,
  isSitePublished,
  hasSite,
}: Props) {
  // 진행도 % (소수 1자리, 8개 기준이라 정수 가능 시 정수로 노출)
  const percent = Math.round((progress.completed / progress.total) * 100);

  // 공개 가드 — setup-status.ts 단일 source
  const gate = canPublish(progress);

  return (
    <section className="mb-6">
      {/* 상단 진행도 바 */}
      <div
        className="mb-4 rounded-[var(--radius-card)] border p-4"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
      >
        <div className="mb-2 flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--color-text-primary)]">
            대회 셋업 진행도
          </span>
          <span className="font-semibold text-[var(--color-text-primary)]">
            {progress.completed} / {progress.total}{" "}
            <span className="text-[var(--color-text-muted)]">({percent}%)</span>
          </span>
        </div>
        {/* 이유: progress bar = elevated track + accent fill. 높이 8px / 라운드 4px (디자인 룰). */}
        <div
          className="h-2 w-full overflow-hidden rounded-[4px]"
          style={{ backgroundColor: "var(--color-elevated)" }}
        >
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${percent}%`,
              backgroundColor: "var(--color-accent)",
            }}
          />
        </div>
      </div>

      {/* 체크리스트 8 카드 */}
      <div className="grid gap-3 sm:grid-cols-2">
        {progress.items.map((item) => (
          <ChecklistCard key={item.key} item={item} />
        ))}
      </div>

      {/* ⭐ UI-5 공개 게이트 영역 — 필수 항목 충족 여부에 따라 분기 */}
      <PublishGate
        gate={gate}
        tournamentId={tournamentId}
        isSitePublished={isSitePublished}
        hasSite={hasSite}
      />
    </section>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 공개 게이트 (UI-5)
// ─────────────────────────────────────────────────────────────────────────

function PublishGate({
  gate,
  tournamentId,
  isSitePublished,
  hasSite,
}: {
  gate: { ok: boolean; missing: string[] };
  tournamentId: string;
  isSitePublished: boolean;
  hasSite: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // 공개 액션 (publish=true) — 게이트 통과 + 사이트 박제 시만 호출
  const handlePublish = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/site/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: true }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        // 서버 가드 위반 시 missing 배열 응답 — 사용자에게 노출
        const missing = Array.isArray(data?.missing)
          ? `: ${data.missing.join(", ")}`
          : "";
        throw new Error((data?.error ?? "공개 실패") + missing);
      }
      // 성공 — 서버 컴포넌트 재렌더링 (페이지 상태 갱신)
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setBusy(false);
    }
  };

  // 비공개 전환 액션 (publish=false) — 게이트 무관 (즉시 허용)
  const handleUnpublish = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(
        `/api/web/tournaments/${tournamentId}/site/publish`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publish: false }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "전환 실패");
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "오류 발생");
    } finally {
      setBusy(false);
    }
  };

  // 사이트 미박제 시 — 6번 카드의 link 로 우회 안내 (공개 버튼 자체 노출 안 함)
  if (!hasSite) {
    return (
      <div
        className="mt-4 rounded-[var(--radius-card)] border p-4 text-sm"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-elevated)",
          color: "var(--color-text-muted)",
        }}
      >
        <span className="material-symbols-outlined align-middle text-[16px]">
          info
        </span>{" "}
        사이트를 먼저 박제하세요. (6단계 → 사이트 설정)
      </div>
    );
  }

  // 이미 공개 중 — 비공개 전환 버튼
  if (isSitePublished) {
    return (
      <div
        className="mt-4 rounded-[var(--radius-card)] border p-4"
        style={{
          // 이유: 공개 중 = 긍정 상태 → success tone (어두운 톤 살짝)
          borderColor: "color-mix(in srgb, var(--color-success) 30%, transparent)",
          backgroundColor: "color-mix(in srgb, var(--color-success) 8%, transparent)",
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--color-success)", fontSize: 20 }}
            >
              public
            </span>
            <span className="text-sm font-semibold text-[var(--color-text-primary)]">
              대회 사이트 공개 중
            </span>
          </div>
          <button
            onClick={handleUnpublish}
            disabled={busy}
            className="rounded-[4px] border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-40"
            style={{
              borderColor:
                "color-mix(in srgb, var(--color-error) 30%, transparent)",
              color: "var(--color-error)",
              minHeight: 44, // 디자인 룰 44px+
            }}
          >
            {busy ? "처리 중..." : "비공개 전환"}
          </button>
        </div>
        {error && (
          <p
            className="mt-2 text-xs"
            style={{ color: "var(--color-error)" }}
          >
            {error}
          </p>
        )}
      </div>
    );
  }

  // 비공개 + 게이트 통과 (필수 7항목 ✅) — 공개 버튼 활성
  if (gate.ok) {
    return (
      <div className="mt-4 flex flex-col gap-2">
        <button
          onClick={handlePublish}
          disabled={busy}
          className="rounded-[4px] px-4 py-3 text-sm font-semibold transition-colors disabled:opacity-40"
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-on-primary)",
            minHeight: 44,
          }}
        >
          <span className="material-symbols-outlined align-middle text-[18px] mr-1">
            rocket_launch
          </span>
          {busy ? "공개 중..." : "대회 공개하기"}
        </button>
        {error && (
          <p className="text-xs" style={{ color: "var(--color-error)" }}>
            {error}
          </p>
        )}
        <p className="text-xs text-[var(--color-text-muted)]">
          공개 시 서브도메인 사이트로 누구나 접근 가능합니다. 언제든 비공개 전환
          가능.
        </p>
      </div>
    );
  }

  // 비공개 + 게이트 미통과 — 잠긴 버튼 + 미충족 항목 안내
  return (
    <div className="mt-4 flex flex-col gap-2">
      <button
        disabled
        className="cursor-not-allowed rounded-[4px] px-4 py-3 text-sm font-semibold"
        style={{
          backgroundColor: "var(--color-elevated)",
          color: "var(--color-text-muted)",
          minHeight: 44,
          opacity: 0.7,
        }}
      >
        <span className="material-symbols-outlined align-middle text-[18px] mr-1">
          lock
        </span>
        공개 잠금 (필수 항목 미완료)
      </button>
      <div
        className="rounded-[4px] border p-3 text-sm"
        style={{
          // 이유: 안내 = warning tone (작업 필요 = 주의). var(--color-warning) 토큰 룰 11 준수.
          borderColor:
            "color-mix(in srgb, var(--color-warning) 30%, transparent)",
          backgroundColor:
            "color-mix(in srgb, var(--color-warning) 8%, transparent)",
        }}
      >
        <p className="mb-1 font-semibold text-[var(--color-text-primary)]">
          <span className="material-symbols-outlined align-middle text-[16px] mr-1">
            warning
          </span>
          다음 항목을 완료해주세요
        </p>
        <ul className="ml-1 list-disc pl-4 text-[var(--color-text-muted)]">
          {gate.missing.map((title) => (
            <li key={title}>{title}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// 개별 카드
// ─────────────────────────────────────────────────────────────────────────

function ChecklistCard({ item }: { item: ChecklistItem }) {
  const isLocked = item.status === "locked";

  // 이유: 잠금 카드는 클릭 비활성 (Link 미사용). non-locked 만 Link wrapper.
  const inner = (
    <div
      className="rounded-[var(--radius-card)] border p-4 transition-colors"
      style={{
        borderColor: "var(--color-border)",
        backgroundColor: "var(--color-card)",
        opacity: isLocked ? 0.6 : 1,
        cursor: isLocked ? "not-allowed" : "pointer",
        minHeight: 96, // 44px+ 터치 (디자인 룰)
      }}
    >
      <div className="flex items-start gap-3">
        {/* 좌측 상태 아이콘 */}
        <div
          className="flex-shrink-0"
          style={{ color: STATUS_COLOR[item.status] }}
          aria-label={STATUS_LABEL[item.status]}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 28 }}
          >
            {STATUS_ICON[item.status]}
          </span>
        </div>

        {/* 본문 */}
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span className="text-xs font-bold text-[var(--color-text-muted)]">
              {item.step}단계
            </span>
            {!item.required && (
              <span className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: "var(--color-elevated)",
                  color: "var(--color-text-muted)",
                }}
              >
                선택
              </span>
            )}
          </div>
          <h3 className="mb-1 font-semibold text-[var(--color-text-primary)]">
            {item.title}
          </h3>
          <p className="text-sm text-[var(--color-text-muted)]">{item.summary}</p>
          {/* 잠금 사유 (locked 시만) */}
          {isLocked && item.lockedReason && (
            <p
              className="mt-2 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span className="material-symbols-outlined align-middle text-[14px]">
                lock
              </span>{" "}
              {item.lockedReason}
            </p>
          )}
        </div>

        {/* 우측 화살표 (non-locked 만) */}
        {!isLocked && (
          <div
            className="flex-shrink-0 self-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </div>
        )}
      </div>
    </div>
  );

  // 잠금 = 정적 div / 그 외 = Link
  if (isLocked) {
    return <div>{inner}</div>;
  }
  return (
    <Link href={item.link} className="block">
      {inner}
    </Link>
  );
}
