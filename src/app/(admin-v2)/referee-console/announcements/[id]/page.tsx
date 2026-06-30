// ============================================================
// referee-console/announcements/[id]/page.tsx — 공고 상세 + 일자별 선정 (4-4e)
//   ★thin 서버 래퍼: params.id 만 풀어 클라(_detail)로 전달. 실 데이터/선정 mutation 은
//     클라가 기존 referee-admin announcements/[id]·pools API 를 adminFetch 로 호출(백엔드 0변경).
//   ★권한 = layout.tsx 글로벌 super 게이트(변경 0).
// ============================================================

import { AnnouncementDetail } from "./_detail";

export const dynamic = "force-dynamic";

export default async function RefereeAnnouncementDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <AnnouncementDetail announcementId={id} />;
}
