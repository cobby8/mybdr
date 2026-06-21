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

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  canPublish,
  type SetupProgress,
  type ChecklistItem,
  type ChecklistStatus,
} from "@/lib/tournaments/setup-status";
// Track B-c Toss 리스킨 — Material Symbols → lucide-react 키트(<Icon>)
import { Icon } from "@/components/admin-toss";

// ─────────────────────────────────────────────────────────────────────────
// status → 색상/아이콘 매핑 (단일 진실의 원천 — UI 룰 변경 시 한 곳만 수정)
// ─────────────────────────────────────────────────────────────────────────

// 카드 좌측 상태 아이콘 (lucide 키트 이름 — Material check_circle/pending/radio_button_unchecked/lock 대체)
const STATUS_ICON: Record<ChecklistStatus, string> = {
  complete: "circle-check", // check_circle
  in_progress: "clock", // pending
  empty: "circle", // radio_button_unchecked
  locked: "lock", // lock
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

  // ⭐ PR-1C-9 (B1) — 잠금 카드 클릭 시 toast 안내 (시안 atsh-toast 박제).
  //   사유: 운영 잠금 카드는 정적 div(클릭 무반응)였음 → 시안은 클릭 시 "선행 STEP 완료 후 진행" toast.
  //   toast = { step, deps } / 2.4초 후 자동 사라짐 (시안 동일 타이밍).
  const [toast, setToast] = useState<{ step: number; deps: number[] } | null>(
    null
  );
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showLockToast = (step: number, deps: number[]) => {
    setToast({ step, deps });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  return (
    // 이유: 시안 atsh-toast 가 position:absolute 우하단 → 컨테이너 relative 기준점 필요.
    <section className="relative mb-6">
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
          <ChecklistCard
            key={item.key}
            item={item}
            // PR-1C-9 (B1): 잠금 카드 클릭 시 toast 안내 (선행 STEP 번호 전달)
            onLockClick={showLockToast}
          />
        ))}
      </div>

      {/* ⭐ UI-5 공개 게이트 영역 — 필수 항목 충족 여부에 따라 분기 */}
      <PublishGate
        gate={gate}
        tournamentId={tournamentId}
        isSitePublished={isSitePublished}
        hasSite={hasSite}
      />

      {/* ⭐ PR-1C-9 (B1) — 잠금 카드 클릭 toast (시안 atsh-toast 박제, 우하단 고정) */}
      {toast && (
        <div
          // 이유: 시안 atsh-toast = ink 배경 + 우하단 absolute. var(--color-*) 토큰만 사용.
          //   다크 기본이라 배경은 text-primary(대비 높은 ink) / 글자는 배경색(반전) — 항상 대비 확보.
          className="pointer-events-none absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-[var(--radius-chip)] px-3 py-2 text-xs font-medium shadow-lg"
          style={{
            backgroundColor: "var(--color-text-primary)",
            color: "var(--bg)",
          }}
          role="status"
        >
          {/* Material lock → lucide lock */}
          <Icon name="lock" size={16} color="var(--color-warning)" />
          {toast.deps.map((d) => `${d}단계`).join(" · ")} 완료 후 {toast.step}단계
          진행 가능
        </div>
      )}
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
        {/* Material info → lucide info */}
        <Icon name="info" size={16} className="align-middle" />{" "}
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
            {/* Material public → lucide globe */}
            <Icon name="globe" size={20} color="var(--color-success)" />
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
          {/* Material rocket_launch → lucide rocket */}
          <Icon name="rocket" size={18} className="align-middle mr-1" />
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
        {/* Material lock → lucide lock */}
        <Icon name="lock" size={18} className="align-middle mr-1" />
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
        <p className="mb-1 font-semibold text-[var(--color-text-primary)] inline-flex items-center">
          {/* Material warning → lucide triangle-alert */}
          <Icon name="triangle-alert" size={16} className="mr-1" />
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

function ChecklistCard({
  item,
  onLockClick,
}: {
  item: ChecklistItem;
  // PR-1C-9 (B1): 잠금 카드 클릭 시 부모 toast 트리거 (선행 STEP 번호 전달)
  onLockClick?: (step: number, deps: number[]) => void;
}) {
  const isLocked = item.status === "locked";
  // PR-1C-9 (B1): 시안 depends_on — 잠금 시 선행 STEP 번호 (없으면 빈 배열)
  const deps = item.dependsOn ?? [];

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
          {/* STATUS_ICON = lucide 키트 이름(circle-check/clock/circle/lock) */}
          <Icon name={STATUS_ICON[item.status]} size={28} />
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
          {/* ⭐ PR-Admin-5 — progress 필드 표시 (통합 카드 #3 "종별 + 운영 방식" 진행도 bar)
              사유: 통합 카드는 status 만으로 진척 파악 어려움 (in_progress 일 때 N/M 시각화 필요).
              progress 미박제 카드 (다른 6 카드) 는 영향 0. */}
          {item.progress && item.progress.total > 0 && (
            <div className="mt-2">
              <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-[var(--color-text-muted)]">
                <span>운영방식 박제 진척</span>
                <span>
                  {item.progress.current} / {item.progress.total}
                </span>
              </div>
              {/* progress bar (통합 카드 전용) — 4px 라운드 / accent fill */}
              <div
                className="h-1.5 w-full overflow-hidden rounded-[4px]"
                style={{ backgroundColor: "var(--color-elevated)" }}
              >
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${(item.progress.current / item.progress.total) * 100}%`,
                    backgroundColor:
                      item.progress.current === item.progress.total
                        ? "var(--color-accent)"
                        : "var(--color-warning)",
                  }}
                />
              </div>
            </div>
          )}
          {/* 잠금 사유 (locked 시만) */}
          {isLocked && item.lockedReason && (
            <p
              className="mt-2 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              {/* Material lock → lucide lock */}
              <Icon name="lock" size={14} className="align-middle" />{" "}
              {item.lockedReason}
            </p>
          )}
          {/* ⭐ PR-1C-9 (B1) — depends_on 시각화 (시안 atsh-item__dep 박제).
              잠금 + 선행 STEP 있을 때만 "N단계 완료 후 진행" link 아이콘 행 노출. */}
          {isLocked && deps.length > 0 && (
            <p
              className="mt-1 flex items-center gap-1 text-[11px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              {/* Material link → lucide link */}
              <Icon name="link" size={13} />
              {deps.map((d) => `${d}단계`).join(" · ")} 완료 후 진행
            </p>
          )}
        </div>

        {/* 우측 화살표 (non-locked 만) */}
        {!isLocked && (
          <div
            className="flex-shrink-0 self-center"
            style={{ color: "var(--color-text-muted)" }}
          >
            {/* Material chevron_right → lucide chevron-right */}
            <Icon name="chevron-right" size={24} />
          </div>
        )}
      </div>
    </div>
  );

  // 잠금 = 클릭 시 toast (시안 atsh-item onClick) / 그 외 = Link
  // 이유(PR-1C-9 B1): 기존엔 정적 div(무반응) → 시안은 클릭 시 선행 STEP toast 안내.
  //   button 으로 감싸 onLockClick 호출 (deps 비어도 클릭은 가능 / toast 는 deps 있을 때 의미 있음).
  if (isLocked) {
    return (
      <button
        type="button"
        onClick={() => onLockClick?.(item.step, deps)}
        className="block w-full text-left"
        aria-label={`${item.title} (잠김)`}
      >
        {inner}
      </button>
    );
  }
  return (
    <Link href={item.link} className="block">
      {inner}
    </Link>
  );
}
