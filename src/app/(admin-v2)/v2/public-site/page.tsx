// ============================================================
// (admin-v2)/v2/public-site/page.tsx — R2-A 공개 사이트 런처
//   정본 bo-pages.jsx PublicSite 1:1: 단체별 공개 사이트 카드.
//   ⚠ mock 0 — 실 단체(approved/pending)만. 링크 = 실 공개 페이지 /organizations/{slug}.
//   백엔드 0변경(SELECT 만).
// ============================================================

import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { PageHead, Icon } from "@/components/admin-v2";

export const dynamic = "force-dynamic";

export default async function AdminV2PublicSite() {
  // pending 우선 → approved. rejected/archived 는 공개 대상 아님(제외).
  const orgs = await prisma.organizations.findMany({
    where: { status: { in: ["pending", "approved"] } },
    orderBy: [{ status: "asc" }, { created_at: "desc" }],
    take: 60,
    select: {
      id: true,
      name: true,
      slug: true,
      region: true,
      status: true,
      _count: { select: { series: true } },
    },
  });

  return (
    <div>
      <PageHead
        eyebrow="관리자 콘솔"
        title="공개 사이트"
        sub="각 단체의 외부 공개 사이트입니다. 단체를 선택해 발행된 사이트를 확인합니다."
      />

      <div className="bo-orgsite-note">
        <Icon name="info" size={16} color="var(--primary)" style={{ flex: "0 0 auto", marginTop: 1 }} />
        <span>
          슈퍼 관리자는 모든 단체의 공개 사이트를 열어볼 수 있습니다. 인증 대기 단체는 비공개
          미리보기로 열립니다.
        </span>
      </div>

      <div className="bo-launchgrid">
        {orgs.map((o) => {
          const pending = o.status === "pending";
          return (
            <a
              key={o.id.toString()}
              href={`/organizations/${o.slug}`}
              target="_blank"
              rel="noopener"
              className="bo-launch"
            >
              <span className="bo-launch__ic">
                <Icon name="globe" size={20} />
              </span>
              <span className="bo-launch__body">
                <span className="bo-launch__t">{o.name}</span>
                <span className="bo-launch__d">
                  {(o.region || "지역 미등록") + ` · 시리즈 ${o._count.series}개`}
                </span>
              </span>
              <span className="bo-chip" data-tone={pending ? "warn" : "ok"} style={{ flex: "0 0 auto" }}>
                {pending ? "인증 대기" : "공개중"}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
