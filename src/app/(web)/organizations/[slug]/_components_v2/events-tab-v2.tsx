import Link from "next/link";
import { OrgHierarchyCrumbs } from "@/components/shared/org-hierarchy-crumbs";

/* ============================================================
 * 단체 상세 - 대회·이벤트 탭 v2 (Server Component) · BO2 보강
 *
 * 이유(왜):
 *  - 시안(OrganizationDetail.jsx 탭3)은 "시리즈 블록 → 그 안에 회차(대회)"
 *    위계 구조다. 기존 v2는 series.tournaments 를 평탄화한 단순 리스트라
 *    위계 정보가 사라졌다 → BO2 요구대로 시리즈 단위로 그룹핑해서 복원.
 *  - 시안의 fakeEditions(mock) 는 전부 제거. 실제 DB 의 series.tournaments
 *    실측값만 회차로 노출 (mock 금지 컨벤션).
 *  - 데이터 패칭은 부모 page.tsx 의 include 그대로 받아씀 (쿼리 변경 0).
 *
 * 방법(어떻게):
 *  - series 배열을 시리즈 단위로 순회 → 각 시리즈 = 헤더(이름/진행 회수/hub 링크)
 *    + 회차(대회) 카드 리스트.
 *  - 상단에 OrgHierarchyCrumbs 로 "단체 → 시리즈 → 대회" 위계 안내 (공용 컴포넌트).
 *  - 시리즈가 0건이거나 모든 시리즈에 회차 0건이어도 빈 상태 placeholder.
 * ============================================================ */

interface SeriesTournament {
  id: number;
  name: string;
  // tournaments.status 는 Prisma 스키마상 nullable → 그대로 받아 fallback 처리
  status: string | null;
  startDate: Date | null;
}

interface SeriesItem {
  id: bigint;
  slug: string;
  name: string;
  // BO2: 시리즈 메타 (누적 회수 / 소개) — 부모에서 select 추가
  tournamentsCount: number;
  description: string | null;
  tournaments: SeriesTournament[];
}

interface EventsTabV2Props {
  orgSlug: string;
  // BO2 위계 안내용 단체명
  orgName: string;
  series: SeriesItem[];
}

// tournaments.status → 한국어 라벨 + 토큰 색상 (recruiting/ongoing/completed 등)
function statusLabel(status: string | null): { text: string; color: string } {
  switch (status) {
    case "recruiting":
    case "open":
      return { text: "모집중", color: "var(--color-success)" };
    case "ongoing":
    case "in_progress":
      return { text: "진행중", color: "var(--color-info)" };
    case "completed":
    case "finished":
      return { text: "종료", color: "var(--color-text-muted)" };
    default:
      // 알 수 없는 status 는 원문 그대로 (없으면 예정)
      return { text: status || "예정", color: "var(--color-text-muted)" };
  }
}

export function EventsTabV2({ orgSlug, orgName, series }: EventsTabV2Props) {
  // 전체 회차 수 (빈 상태 판정용)
  const totalTournaments = series.reduce(
    (sum, s) => sum + s.tournaments.length,
    0,
  );

  // 시리즈 자체가 없으면 빈 상태
  if (series.length === 0) {
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] py-16 text-center">
        <span className="material-symbols-outlined text-4xl text-[var(--color-text-disabled)]">
          event
        </span>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">
          아직 등록된 시리즈가 없습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* BO2 위계 안내 — 단체 → 시리즈 → 대회 (공용 컴포넌트) */}
      <OrgHierarchyCrumbs
        trail={[
          { label: orgName, level: "org", active: true },
          { label: "시리즈", level: "series" },
          { label: "대회", level: "tournament" },
        ]}
      />

      {series.map((s) => {
        const tournaments = s.tournaments;
        return (
          <div
            key={s.id.toString()}
            className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]"
          >
            {/* 시리즈 헤더 — 이름 + 누적 회수/소개 + 시리즈 hub 링크 */}
            <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-[18px] py-3.5">
              {/* 시리즈 아이콘 박스 (정사각 → rounded 4px, pill 금지) */}
              <div className="grid h-10 w-10 flex-shrink-0 place-items-center rounded bg-[var(--color-info)] text-white">
                <span className="material-symbols-outlined text-xl">
                  collections_bookmark
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-[var(--color-text-primary)]">
                  {s.name}
                </div>
                <div className="mt-0.5 truncate text-xs text-[var(--color-text-muted)]">
                  {/* tournamentsCount 캐시값 우선, 0이면 실측 tournaments 길이 */}
                  {(s.tournamentsCount || tournaments.length)}회 진행
                  {s.description ? ` · ${s.description}` : ""}
                </div>
              </div>
              {/* 시리즈 hub 진입 (기존 라우트 /organizations/[slug]/series/[seriesSlug]) */}
              <Link
                href={`/organizations/${orgSlug}/series/${s.slug}`}
                className="inline-flex flex-shrink-0 items-center gap-1 rounded border border-[var(--color-border)] px-3 py-1.5 text-xs text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-primary)]"
              >
                시리즈 hub
                <span className="material-symbols-outlined text-sm">
                  arrow_forward
                </span>
              </Link>
            </div>

            {/* 회차(대회) 리스트 — 실측 tournaments 만 */}
            {tournaments.length === 0 ? (
              <div className="px-[18px] py-6 text-center text-xs text-[var(--color-text-muted)]">
                아직 진행된 회차가 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border)]">
                {tournaments.map((t) => {
                  const st = statusLabel(t.status);
                  return (
                    <Link
                      key={t.id}
                      // 시리즈 hub 로 이동 (개별 대회 상세 라우트 분리 시 변경 가능)
                      href={`/organizations/${orgSlug}/series/${s.slug}`}
                      className="group flex items-center gap-3 px-[18px] py-3 transition-colors hover:bg-[var(--color-bg)]"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-[var(--color-text-primary)]">
                          {t.name}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          {t.startDate
                            ? new Date(t.startDate).toLocaleDateString("ko-KR")
                            : "날짜 미정"}
                        </div>
                      </div>
                      {/* status 칩 */}
                      <span
                        className="flex-shrink-0 text-xs font-semibold"
                        style={{ color: st.color }}
                      >
                        {st.text}
                      </span>
                      <span className="material-symbols-outlined flex-shrink-0 text-base text-[var(--color-text-disabled)]">
                        chevron_right
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* 시리즈는 있는데 모든 회차가 0건인 경우 안내 (전부 준비 중) */}
      {totalTournaments === 0 && (
        <p className="text-center text-xs text-[var(--color-text-disabled)]">
          등록된 시리즈는 있으나 아직 진행된 회차가 없습니다.
        </p>
      )}
    </div>
  );
}
