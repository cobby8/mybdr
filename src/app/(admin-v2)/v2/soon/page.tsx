// ============================================================
// (admin-v2)/v2/soon/page.tsx — R2-A 미빌드 콘솔 "준비 중" 플레이스홀더
//   ⚠ mock 0 — 빈 화면을 가짜 데이터로 채우지 않음(다음 증분 BO-5/3/4).
//   nav 의 미빌드 항목은 /v2/soon?c=<id> 로 도달.
// ============================================================

import Link from "next/link";
import { PageHead, Empty, Icon } from "@/components/admin-v2";

export const dynamic = "force-dynamic";

const LABELS: Record<string, { title: string; eyebrow: string }> = {
  logs: { title: "활동 로그", eyebrow: "관리자 콘솔" },
  matchConsole: { title: "매칭 콘솔", eyebrow: "운영 콘솔" },
  communityConsole: { title: "커뮤니티 콘솔", eyebrow: "운영 콘솔" },
  courtConsole: { title: "코트 콘솔", eyebrow: "운영 콘솔" },
  marketingConsole: { title: "마케팅 콘솔", eyebrow: "운영 콘솔" },
  referee: { title: "심판 콘솔", eyebrow: "운영 콘솔" },
  partner: { title: "협력업체 콘솔", eyebrow: "운영 콘솔" },
  payments: { title: "결제", eyebrow: "정산·플랜" },
  plans: { title: "요금제", eyebrow: "정산·플랜" },
  notifications: { title: "알림", eyebrow: "시스템" },
  settings: { title: "설정", eyebrow: "시스템" },
  mypage: { title: "마이페이지", eyebrow: "시스템" },
};

export default async function AdminV2Soon({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const { c } = await searchParams;
  const meta = LABELS[c ?? ""] ?? { title: "준비 중", eyebrow: "관리자 콘솔" };

  return (
    <div>
      <PageHead eyebrow={meta.eyebrow} title={meta.title} sub="다음 증분에서 제공될 콘솔입니다." />
      <div className="ts-card">
        <Empty
          icon="hammer"
          title="준비 중입니다"
          desc={`${meta.title} 화면은 아직 연결되지 않았습니다. 곧 제공됩니다.`}
        >
          <Link href="/v2" className="ts-btn ts-btn--primary ts-btn--sm">
            <Icon name="home" size={15} />
            관리자 홈으로
          </Link>
        </Empty>
      </div>
    </div>
  );
}
