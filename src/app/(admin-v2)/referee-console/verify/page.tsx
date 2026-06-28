// ============================================================
// referee-console/verify/page.tsx — 자격·서류 검증 (정본 referee-pages RF_VERIFY 1:1)
//   ★글로벌 super 스코프 — 협회 필터 0(전 협회 자격증 통합). READ = Prisma 직접.
//   ★mutation = 검증 토글(확인모달). 기존 엔드포인트 재사용:
//     PATCH /api/web/admin/referee-certificates/[id]/verify { verified }(boolean·단일).
//   ⚠ cross-association 한계: 기존 IDOR 가드가 super 자동선택 협회 외 403 →
//     실패 시 모달에 사유 가시화. 백엔드 0변경.
//   - 서류(RefereeDocument OCR)는 본 화면 자격증 검증에 집중 → 문서 OCR 확정은 후속(보고).
//   - 데이터 0행 → SchemaList Empty(mock 0).
// ============================================================

import { prisma } from "@/lib/db/prisma";
import {
  refereeName,
  certVerifyBadge,
  fmtDate,
  avColor,
} from "../_referee-data";
import { VerifyList, type RfVerifyRow } from "./_verify";

export const dynamic = "force-dynamic";

export default async function RefereeVerifyPage() {
  // 전역 자격증 목록(협회 필터 0) — 미검증 우선, 최근 등록 우선.
  const certs = await prisma.refereeCertificate.findMany({
    orderBy: [{ verified: "asc" }, { created_at: "desc" }],
    take: 200,
    select: {
      id: true,
      cert_type: true,
      cert_grade: true,
      issuer: true,
      issued_at: true,
      expires_at: true,
      verified: true,
      referee: {
        select: { registered_name: true, verified_name: true },
      },
    },
  });

  const rows: RfVerifyRow[] = certs.map((c, i) => {
    const vb = certVerifyBadge(c.verified, c.expires_at);
    return {
      id: c.id.toString(),
      certId: c.id.toString(),
      verified: c.verified,
      name: refereeName(c.referee),
      sub: c.issuer,
      color: avColor(i),
      doc: `${c.cert_grade} ${c.cert_type === "game_official" ? "경기원" : "심판"} 자격증`,
      issued: fmtDate(c.issued_at),
      expire: fmtDate(c.expires_at),
      badge: vb.label,
      tone: vb.tone,
    };
  });

  return <VerifyList rows={rows} />;
}
