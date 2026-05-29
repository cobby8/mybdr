import { prisma } from "@/lib/db/prisma";
import Link from "next/link";
import type { Metadata } from "next";
import { OrgsListV2 } from "./_components/orgs-list-v2";
import type { OrgCardData } from "./_components/org-card-v2";
// Phase 12 §G: 모바일 백버튼 (사용자 보고)

/* ============================================================
 * 단체 목록 (공개) — /organizations  [BDR v2 디자인 적용]
 *
 * 공개 단체를 카드 그리드로 표시. 그라디언트 헤더 + 통계 3분할.
 * SSR + ISR 캐시 적용 (60초). 데이터 패칭 로직은 v1과 동일 — UI만 교체.
 *
 * 향후 Phase 3 Orgs 추가 예정:
 *   - organizations.kind (리그/협회/동호회) → 실제 필터링
 *   - organizations.brand_color → 헤더 그라디언트
 *   - organizations.tag → 자동 생성 대신 명시값 사용
 *   - 단체 가입 신청 API
 *   - 단체별 팀 수 집계 (series→teams 조인)
 * ============================================================ */

export const metadata: Metadata = {
  title: "단체 목록 | MyBDR",
  description: "대회를 주최하는 농구 단체 목록을 확인하세요.",
};

export const revalidate = 60; // 60초 ISR

export default async function OrganizationsPage() {
  // 빌드 시점 DB 연결 실패 시 빈 목록 fallback (ISR 60초로 복구)
  const orgs = await prisma.organizations
    .findMany({
      where: { is_public: true, status: "approved" },
      orderBy: { series_count: "desc" },
      select: {
        id: true,
        name: true,
        slug: true,
        logo_url: true,
        region: true,
        series_count: true,
        description: true,
        // OU1 보강: "신규" 정렬용. founded_year 컬럼이 없어 created_at으로 대체
        created_at: true,
        _count: { select: { members: { where: { is_active: true } } } },
      },
      take: 50,
    })
    .catch(() => []);

  // BigInt → string 직렬화 + 클라 컴포넌트용 props 매핑
  const cardData: OrgCardData[] = orgs.map((org) => ({
    id: org.id.toString(),
    slug: org.slug,
    name: org.name,
    logoUrl: org.logo_url,
    region: org.region,
    description: org.description,
    membersCount: org._count.members,
    seriesCount: org.series_count,
    // 정렬(신규)용 — 클라에서 비교만 하므로 ISO 문자열로 전달
    createdAt: org.created_at.toISOString(),
  }));

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* 2026-05-04: 메인 페이지에서 PageBackButton 제거 (BottomNav 가 홈 이동 대체) */}
      {/* 페이지 헤더: eyebrow + h1 + 부제 + 등록 버튼 */}
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-muted)]">
            단체 · ORGANIZATIONS
          </div>
          <h1 className="mt-1.5 text-[28px] font-extrabold tracking-tight text-[var(--color-text-primary)]">
            리그 · 협회 · 동호회
          </h1>
          <div className="mt-1 text-[13px] text-[var(--color-text-muted)]">
            여러 팀을 아우르는 {orgs.length}개의 농구 단체. 단체 페이지에서 소속
            시리즈와 누적 우승팀을 확인할 수 있습니다.
          </div>
        </div>
        {/* 단체 등록 버튼 (라벨: PM 지시 "단체 등록"). 기존 /apply 라우트 유지 */}
        <Link
          href="/organizations/apply"
          className="inline-flex items-center gap-1.5 rounded bg-[var(--color-primary)] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          단체 등록
        </Link>
      </div>

      {/* 클라 컨테이너: 필터 chip + 그리드 */}
      <OrgsListV2 orgs={cardData} />

      {/* About box (OU1 시안 박제) — "단체란?" 정적 안내. cafe-blue 토큰 사용 */}
      <div
        className="mt-6 flex items-start gap-3.5 rounded-lg p-[18px_22px]"
        style={{
          background: "var(--cafe-blue-soft)",
          border: "1px solid var(--cafe-blue-hair)",
          borderLeft: "3px solid var(--cafe-blue)",
        }}
      >
        <span
          className="material-symbols-outlined flex-shrink-0 text-2xl"
          style={{ color: "var(--cafe-blue-deep)" }}
        >
          lightbulb
        </span>
        <div>
          <div
            className="mb-1 font-extrabold"
            style={{ color: "var(--cafe-blue-deep)" }}
          >
            단체란?
          </div>
          <div
            className="text-[13px] leading-[1.6]"
            style={{ color: "var(--ink-soft)" }}
          >
            여러 팀을 아우르는 <b>리그 / 협회 / 동호회 연합</b>입니다. 단체는{" "}
            <b>시리즈</b>를 만들고 시리즈마다 <b>회차(대회)</b>가 누적됩니다.
            본인이 단체를 운영하고 싶다면 <b>&quot;단체 등록&quot;</b> 으로 신청 후
            사이트 운영자 승인을 받으세요 (1-2일 소요).
          </div>
        </div>
      </div>
    </div>
  );
}
