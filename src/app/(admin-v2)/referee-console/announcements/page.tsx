// ============================================================
// referee-console/announcements/page.tsx — 배정 신청 공고 (4-4e 컷오버)
//   ★레거시 (referee)/referee/admin/announcements/page.tsx 를 v2(Toss) 디자인으로 포팅.
//     공고 목록/게시/마감토글/삭제. 실 데이터/mutation 은 클라(_announcements)가
//     기존 referee-admin API 를 adminFetch 로 직접 호출(백엔드 0변경).
//   ★데이터가 대회 검색→공고 게시로 상호작용형이라 서버 Prisma 단발 READ 대신 클라 로드
//     사용(레거시 흐름 동일). 본 page 는 클라 콘솔 마운트만 담당.
//   ★권한 = layout.tsx 글로벌 super 게이트(변경 0).
// ============================================================

import { AnnouncementsConsole } from "./_announcements";

export const dynamic = "force-dynamic";

export default function RefereeAnnouncementsPage() {
  return <AnnouncementsConsole />;
}
