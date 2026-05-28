"use client";

/**
 * 대회 요강 AI 분석 4-step 진행도 bar (PR-1C-11 PA9 시안 박제 2026-05-28).
 *
 * 시안 apr-progress (admin.css L1245~1280) 를 운영 --color-* 토큰 + Tailwind 로 박제.
 * 시안은 admin.css 클래스(--r-md / --bg-elev / --ink) 기반이지만, 운영 page.tsx 가
 * 전부 var(--color-*) Tailwind 기반이라 토큰 체계를 운영에 맞춤 (admin.css import 회피).
 *
 * ⚠️ 데이터 0 추가 — page.tsx 의 기존 AnalyzeStatus(idle/uploading/analyzing/done/failed)
 *    를 1~4 step 번호로 매핑만 한다 (새 state / fetch / AI 로직 변경 ❌).
 *
 * 박제 룰 (시안 13룰):
 * - Material Symbols Outlined / lucide-react ❌
 * - var(--color-*) 토큰만 / pill 9999px ❌ (단 정사각 dot 은 원형 50% 허용 — §C-10)
 * - 활성 dot 글자 = text-white (운영 accent 배경 위 텍스트 관례 — page.tsx L252/L279 동일)
 */

// 시안 STEPS 그대로 — PDF 업로드 → AI 분석 → 미리보기 → wizard 진입
const STEPS = [
  { n: 1, label: "PDF 업로드" },
  { n: 2, label: "AI 분석" },
  { n: 3, label: "미리보기" },
  { n: 4, label: "wizard 진입" },
] as const;

interface Props {
  /** 현재 진행 step (1~4) — page.tsx 에서 AnalyzeStatus 를 매핑해 전달 */
  current: number;
}

export function ProspectusProgressSteps({ current }: Props) {
  return (
    // 시안 .apr-progress — bg-elev 카드 + 가로 stepper (모바일 가로 스크롤)
    <div className="mb-4 flex items-center gap-2 overflow-x-auto rounded-[4px] border border-[var(--color-border)] bg-[var(--color-surface)] px-5 py-4">
      {STEPS.map((s) => {
        // 시안 cls 분기 — 지난 step = is-done / 현재 = is-cur / 이후 = (대기)
        const isDone = current > s.n;
        const isCur = current === s.n;

        return (
          <div
            key={s.n}
            // flex-1 + min-w 90px (시안 .apr-progress__step) — 균등 분배 + 연결선 공간
            className="relative flex min-w-[90px] flex-1 flex-col items-center gap-1.5"
          >
            {/* 연결선 — 두 번째 step 부터 왼쪽으로 이전 dot 까지 잇는 가로선 (시안 ::before) */}
            {s.n > 1 && (
              <span
                aria-hidden
                className={`absolute left-[-50%] top-[14px] h-[2px] w-full ${
                  // 현재/지난 step 의 선 = accent (시안 is-done+ / is-cur::before)
                  isDone || isCur
                    ? "bg-[var(--color-accent)]"
                    : "bg-[var(--color-border)]"
                }`}
              />
            )}

            {/* 동그란 dot — 정사각(W=H) 원형 50% 허용 (§C-10 / pill 9999px 회피 무관) */}
            <span
              className={`relative z-[1] inline-flex h-[30px] w-[30px] items-center justify-center rounded-full border-2 text-xs font-extrabold ${
                isDone
                  ? // 완료 = success 배경 + 체크 아이콘 (시안 is-done __dot)
                    "border-[var(--color-success)] bg-[var(--color-success)] text-white"
                  : isCur
                    ? // 현재 = accent 배경 + ring (시안 is-cur __dot box-shadow)
                      "border-[var(--color-accent)] bg-[var(--color-accent)] text-white ring-[3px] ring-[var(--color-accent-light)]"
                    : // 대기 = 중립 (시안 기본 __dot)
                      "border-[var(--color-border)] bg-[var(--color-background)] text-[var(--color-text-muted)]"
              }`}
            >
              {isDone ? (
                <span className="material-symbols-outlined text-base" aria-hidden>
                  check
                </span>
              ) : (
                s.n
              )}
            </span>

            {/* 라벨 — 현재/완료 = 강조 (시안 is-done/is-cur __lbl) */}
            <span
              className={`text-center text-[11.5px] ${
                isDone || isCur
                  ? "font-extrabold text-[var(--color-text-primary)]"
                  : "font-bold text-[var(--color-text-muted)]"
              }`}
            >
              {s.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
