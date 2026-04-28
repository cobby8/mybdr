import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/db/prisma";

// 왜 SEO 메타: 시리즈 목록은 검색 유입 타겟이므로 title/description 명시
export const metadata: Metadata = {
  title: "대회 시리즈 | MyBDR",
  description: "정기 대회 시리즈를 확인하고 참가하세요.",
};

// 왜 revalidate 300: 시리즈 목록은 변경이 드물어 5분 ISR로 충분
export const revalidate = 300;

export default async function SeriesListPage() {
  // 왜 is_public 필터 + created_at desc 보존: 비공개 시리즈 차단 + 최신순 정렬 (기존 로직 그대로)
  const series = await prisma.tournament_series
    .findMany({
      where: { is_public: true },
      orderBy: { created_at: "desc" },
      take: 20,
      select: {
        id: true,
        slug: true,
        name: true,
        description: true,
        logo_url: true,
        tournaments_count: true,
      },
    })
    .catch(() => []);

  // 왜 spotlight 분리: 시안의 1번째 카드 강조용 (가장 최신 시리즈)
  const spotlight = series[0];
  const rest = series; // 시안은 spotlight도 grid에 포함되어 있음

  return (
    <div className="mx-auto max-w-5xl px-4 pb-16">
      {/* 헤더 — 시안: eyebrow + 큰 타이틀 + 우측 CTA */}
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div
            className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-[var(--color-text-muted)]"
          >
            시리즈 · SERIES
          </div>
          <h1
            className="mt-1.5 mb-1 text-[28px] font-extrabold tracking-tight"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            대회 시리즈 허브
          </h1>
          <div className="text-[13px] text-[var(--color-text-muted)]">
            정기적으로 열리는 모든 시리즈와 그 회차의 계보
          </div>
        </div>
        {/* 왜 CTA: P1-D 진입점 보강 — /series/new 라우트는 server wrapper에서 로그인 가드,
            여기서는 노출만. 권한 검증은 라우트가 처리하므로 모든 사용자에게 표시 */}
        <Link href="/series/new" className="btn btn--primary">
          + 시리즈 만들기
        </Link>
      </div>

      {/* spotlight — 시안 박제. 그라디언트는 var(--color-accent) 기반 (하드코딩 금지) */}
      {spotlight && (
        <Link href={`/series/${spotlight.slug}`}>
          <div
            className="mb-5 grid cursor-pointer overflow-hidden rounded-[16px] border border-[var(--color-border)] sm:grid-cols-2"
          >
            {/* 왼쪽: 그라디언트 + 시리즈명 강조 */}
            <div
              className="px-8 py-7 text-white"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 70%, transparent) 50%, #0B0D10)",
              }}
            >
              <div className="mb-2.5 text-[11px] font-extrabold uppercase tracking-[0.14em] opacity-85">
                SPOTLIGHT · {spotlight.tournaments_count ?? 0}TH EDITION
              </div>
              <div
                className="text-[40px] font-black leading-[1.05] tracking-tight"
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {spotlight.name}
              </div>
              {spotlight.description && (
                <div className="mt-2 line-clamp-2 text-[15px] opacity-90">
                  {spotlight.description}
                </div>
              )}
            </div>
            {/* 오른쪽: 누적 회차 + CTA */}
            <div className="flex flex-col justify-between bg-[var(--color-surface)] px-8 py-6">
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                  누적 회차
                </div>
                <div className="mb-2 text-[22px] font-extrabold">
                  {spotlight.tournaments_count ?? 0}회 진행
                </div>
                <div className="text-[13px] leading-[1.6] text-[var(--color-text-muted)]">
                  시리즈 페이지에서 회차별 우승팀과 MVP 기록을 확인할 수 있습니다.
                </div>
              </div>
              <div className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[var(--color-accent)]">
                회차 보기 →
              </div>
            </div>
          </div>
        </Link>
      )}

      {/* grid — 시안: 2열 (모바일은 1열) */}
      <div className="grid gap-3.5 sm:grid-cols-2">
        {rest.map((s) => {
          const initial = s.name?.trim().charAt(0) ?? "?";
          // 왜 약어 태그: 시안의 우측 컬러 박스용 (slug의 첫 단어 3자)
          const tag = s.slug?.split("-")[0]?.slice(0, 3).toUpperCase() ?? "BDR";
          return (
            <Link key={s.id.toString()} href={`/series/${s.slug}`}>
              <div className="cursor-pointer overflow-hidden rounded-[12px] border border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-bright)]">
                {/* 상단: 시리즈명 + 우측 컬러 태그 */}
                <div className="flex items-start justify-between gap-3.5 border-b border-[var(--color-border)] px-5 py-4">
                  <div className="min-w-0 flex-1">
                    <div className="mb-1.5 flex items-center gap-1.5">
                      <span className="inline-flex items-center rounded-[3px] bg-[var(--color-surface-bright)] px-1.5 py-0.5 text-[11px] font-semibold text-[var(--color-text-muted)]">
                        {s.tournaments_count ?? 0}회
                      </span>
                    </div>
                    <div
                      className="mb-0.5 truncate text-[20px] font-black tracking-tight"
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {s.name}
                    </div>
                    {s.description && (
                      <div className="line-clamp-1 text-[13px] text-[var(--color-text-muted)]">
                        {s.description}
                      </div>
                    )}
                  </div>
                  {/* 컬러 박스 — 로고 있으면 로고, 없으면 이니셜/태그 */}
                  {s.logo_url ? (
                    <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg bg-[var(--color-surface-bright)]">
                      <Image src={s.logo_url} alt={s.name} fill sizes="48px" className="object-cover" />
                    </div>
                  ) : (
                    <div
                      className="grid h-12 w-12 flex-shrink-0 place-items-center rounded-lg text-[13px] font-extrabold text-white"
                      style={{ background: "var(--color-accent)", fontFamily: "var(--font-heading)" }}
                      aria-hidden
                    >
                      {tag || initial}
                    </div>
                  )}
                </div>
                {/* 하단: 메타 라인 */}
                <div className="flex justify-between bg-[var(--color-surface-bright)] px-5 py-3 text-[12px] text-[var(--color-text-muted)]">
                  <span className="truncate">시리즈</span>
                  <span>
                    <b className="text-[var(--color-text)]" style={{ fontFamily: "var(--font-heading)" }}>
                      {s.tournaments_count ?? 0}
                    </b>
                    회 진행
                  </span>
                </div>
              </div>
            </Link>
          );
        })}

        {series.length === 0 && (
          <div className="col-span-full rounded-[12px] border border-[var(--color-border)] py-12 text-center text-[var(--color-text-muted)]">
            <p className="text-sm">등록된 시리즈가 없습니다.</p>
          </div>
        )}
      </div>

      {/* about — 시안 박제 (시리즈란 안내 박스) */}
      <div
        className="mt-6 rounded-[12px] bg-[var(--color-surface-bright)] px-6 py-4"
        style={{ borderLeft: "3px solid var(--color-info)" }}
      >
        <div className="flex items-start gap-3.5">
          <span
            className="material-symbols-outlined text-[24px] text-[var(--color-info)]"
            aria-hidden
          >
            lightbulb
          </span>
          <div>
            <div className="mb-1 font-bold">시리즈란?</div>
            <div className="text-[13px] leading-[1.65] text-[var(--color-text-muted)]">
              같은 주최자가 정기적으로 여는 대회들의 묶음입니다. 시리즈 페이지에는{" "}
              <b className="text-[var(--color-text)]">전 회차 우승팀·MVP·대진 결과</b>가 누적되며,
              내 팀이 출전한 시리즈 이력이 프로필에 기록됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
