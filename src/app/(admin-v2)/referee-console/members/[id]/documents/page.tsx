// ============================================================
// referee-console/members/[id]/documents/page.tsx — 심판 정산서류 관리 (서버 thin 래퍼)
//   레거시 (referee)/referee/admin/members/[id]/documents 포팅(4-4b 마무리).
//   ★데이터 패칭 0 — 업로드/OCR/확인/인쇄 전부 클라(_documents)에서 raw fetch.
//     사유: FormData(업로드)·blob(PDF 다운로드)이라 adminFetch(JSON snake↔camel) 부적합.
//           → 레거시 raw fetch 로직 verbatim 유지(transfer-organizer·photo-manager 패턴 동일).
//   ★백엔드/DB/Prisma 0변경 — 기존 4개 API만 재사용:
//     · GET/POST /api/web/referee-admin/documents (목록/대리 업로드)
//     · POST     /api/web/referee-admin/documents/[id]/ocr (OCR 실행)
//     · POST     /api/web/referee-admin/documents/[id]/ocr/confirm (OCR 확정)
//     · POST     /api/web/referee-admin/documents/print (PDF 인쇄·사무국장만)
//   ★권한 = layout(super_admin)·기존 API IDOR 가드. 별도 가드 불필요.
//   - 잘못된 id(비숫자) → 클라에서 refereeId 그대로 전달(API가 400 반환).
// ============================================================

import { RefereeDocuments } from "./_documents";

export const dynamic = "force-dynamic";

export default async function RefereeMemberDocumentsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // 서버 데이터 패칭 없음 — refereeId(문자열)만 클라 폼에 전달.
  return <RefereeDocuments refereeId={id} />;
}
