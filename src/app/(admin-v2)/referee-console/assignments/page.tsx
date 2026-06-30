// ============================================================
// referee-console/assignments/page.tsx — 경기 배정 관리 (③-A 컷오버)
//   ★기존 "읽기 드로어(flat 리스트)" → 레거시 배정 워크플로우(대회검색→경기→배정 생성/상태변경/삭제)
//     를 v2(Toss) 디자인으로 포팅. 실 데이터/mutation 은 클라 컴포넌트(_assignment-workflow)가
//     기존 referee-admin API 를 adminFetch 로 직접 호출(백엔드 0변경).
//   ★데이터가 대회 선택→경기 로드로 상호작용형이라 서버 Prisma 단발 READ 대신 클라 로드 사용
//     (레거시 흐름 동일). 본 page 는 클라 워크플로우 마운트만 담당.
//   ★권한 = layout.tsx 글로벌 super 게이트(변경 0).
// ============================================================

import { AssignmentWorkflow } from "./_assignment-workflow";

export const dynamic = "force-dynamic";

export default function RefereeAssignmentsPage() {
  return <AssignmentWorkflow />;
}
