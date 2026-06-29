import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

// ============================================================
// 헬스체크 API — GET /api/health
//
// 왜 필요한가?
// - Vercel/로드밸런서가 서버가 살아있는지 주기적으로 확인하는 용도
// - DB 연결까지 체크하여 "서버는 뜨는데 DB가 죽은" 상황도 감지
//
// 응답:
// - 정상: 200 { status: "ok", db: "connected", timestamp: ... }
// - 이상: 503 { status: "error", db: "disconnected", error: ... }
// ============================================================

export const dynamic = "force-dynamic"; // 캐시 금지 — 항상 실시간 체크

export async function GET() {
  const timestamp = new Date().toISOString();

  try {
    // DB 연결 확인: 가장 가벼운 쿼리 (SELECT 1)
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json(
      {
        status: "ok",
        db: "connected",
        timestamp,
      },
      { status: 200 }
    );
  } catch (error) {
    // DB 연결 실패 → 503 Service Unavailable
    // 보안: raw 에러 메시지(DB 호스트/드라이버 내부 정보 등)는 응답에 노출하지 않는다.
    //       원인 진단용 상세 메시지는 서버 로그(Vercel 함수 로그)로만 남긴다.
    console.error("[health] DB check failed:", error);
    return NextResponse.json(
      {
        status: "error",
        db: "disconnected",
        error: "database error",
        timestamp,
      },
      { status: 503 }
    );
  }
}
