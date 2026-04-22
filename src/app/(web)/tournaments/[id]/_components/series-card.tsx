/**
 * SeriesCard — "이 대회가 속한 시리즈" 카드
 *
 * 왜 이 컴포넌트가 필요한가:
 * - L3 3계층 IA(단체 → 시리즈 → 대회)에서 대회 상세 페이지는 "고립된 개별 대회"가 아니라
 *   "시리즈 맥락 안의 한 회차"로 인식되어야 한다.
 * - 사용자가 3회차 대회를 보고 있을 때 "이 대회는 시리즈 X의 3회차 / 전체 N회차 중"이라는
 *   맥락을 즉시 제공하고, 같은 시리즈의 다른 회차로 이동할 동선을 연다.
 *
 * 어떻게 동작하나:
 * - Hero 직후에 카드 1개만 렌더. series_id + edition_number 둘 다 있어야 렌더됨(페이지 레벨 조건).
 * - 카드 내부: 로고 + 시리즈명/현재 회차 표시 + "시리즈 전체 보기" 링크 + 하단 EditionSwitcher.
 * - 단체(organization) 정보는 optional — 있으면 작은 링크로 표시.
 * - 색상은 전부 CSS 변수(var(--color-*)) — 하드코딩 금지.
 */

import Link from "next/link";
import { EditionSwitcher } from "@/components/shared/edition-switcher";

export interface SeriesCardProps {
  /** 시리즈 이름 (예: "BDR 챔피언십") */
  seriesName: string;
  /** 시리즈 slug — "전체 보기" / EditionSwitcher 내부 링크에 사용 */
  seriesSlug: string;
  /** 현재 대회의 회차 번호 */
  currentEditionNumber: number;
  /** 시리즈 전체 회차 수 */
  totalEditions: number;
  /** 시리즈 로고 URL (optional) */
  seriesLogoUrl?: string | null;
  /** 소속 단체 이름 (optional) — 있으면 "단체명 · 시리즈명" 형태 */
  orgName?: string | null;
  /** 소속 단체 slug (optional) — 링크 가능 시만 존재 */
  orgSlug?: string | null;
  /** 이전 회차 대회 UUID (1회차면 null) */
  prevTournamentId: string | null;
  /** 다음 회차 대회 UUID (최신 회차면 null) */
  nextTournamentId: string | null;
}

export function SeriesCard({
  seriesName,
  seriesSlug,
  currentEditionNumber,
  totalEditions,
  seriesLogoUrl,
  orgName,
  orgSlug,
  prevTournamentId,
  nextTournamentId,
}: SeriesCardProps) {
  return (
    <div
      className="mx-auto mt-4 max-w-7xl px-4 sm:px-6 lg:px-8"
      aria-label="소속 시리즈"
    >
      <div
        className="rounded-lg border p-4"
        style={{
          borderColor: "var(--color-border)",
          backgroundColor: "var(--color-card)",
        }}
      >
        {/* 상단: 로고 + 시리즈명 + 전체보기 링크 */}
        <div className="flex items-start gap-3">
          {/* 시리즈 로고 — 있으면 img, 없으면 이니셜 아바타 (CSS 그라디언트) */}
          {seriesLogoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- 보이스카우트 범위 외(next/image 전환은 별도 작업)
            <img
              src={seriesLogoUrl}
              alt={seriesName}
              className="h-12 w-12 flex-shrink-0 rounded object-cover"
            />
          ) : (
            <div
              className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded text-base font-bold"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-primary), var(--color-navy))",
                color: "var(--color-on-accent)",
              }}
            >
              {seriesName.charAt(0)}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {/* 소속 단체 (있을 때만) — 작은 라벨 */}
            {orgName && (
              <p
                className="truncate text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                {orgSlug ? (
                  <Link
                    href={`/organizations/${orgSlug}`}
                    className="hover:underline"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {orgName}
                  </Link>
                ) : (
                  orgName
                )}
              </p>
            )}
            {/* 시리즈명 + 전체 회차 */}
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <Link
                href={`/series/${seriesSlug}`}
                className="truncate text-base font-bold hover:underline"
                style={{ color: "var(--color-text-primary)" }}
              >
                {seriesName}
              </Link>
              <span
                className="text-xs"
                style={{ color: "var(--color-text-muted)" }}
              >
                · 전체 {totalEditions}회차
              </span>
            </div>
            {/* 현재 회차 강조 */}
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--color-text-secondary)" }}
            >
              이 대회는{" "}
              <span
                className="font-semibold"
                style={{ color: "var(--color-primary)" }}
              >
                {currentEditionNumber}회차
              </span>{" "}
              입니다
            </p>
          </div>

          {/* 시리즈 전체 보기 (우측 상단) — PC에서만 별도 버튼 표시 */}
          <Link
            href={`/series/${seriesSlug}`}
            className="hidden flex-shrink-0 items-center gap-1 text-xs hover:underline sm:inline-flex"
            style={{ color: "var(--color-info)" }}
          >
            시리즈 전체 보기
            <span className="material-symbols-outlined text-sm">
              arrow_forward
            </span>
          </Link>
        </div>

        {/* 하단: 회차 이동 스위처 (이전/전체/다음)
         * 위 헤더와 시각적으로 구분하기 위해 상단 border 구분선 + 여백 */}
        <div
          className="mt-3 border-t pt-3"
          style={{ borderColor: "var(--color-border)" }}
        >
          <EditionSwitcher
            currentEditionNumber={currentEditionNumber}
            prevTournamentId={prevTournamentId}
            nextTournamentId={nextTournamentId}
            seriesSlug={seriesSlug}
            totalEditions={totalEditions}
          />
        </div>
      </div>
    </div>
  );
}
