/**
 * POST /api/web/profile/upload-image
 *
 * 왜 (Phase 12 follow-up — 프로필 사진 업로드 기본 기능):
 *  - 시안 박제만 되어있던 /profile/edit 사진 탭을 실제 동작으로 활성화
 *  - mybdr 가 Vercel 배포 환경 → Vercel Blob (B1) 으로 자연스러운 통합
 *  - 이전엔 User.profile_image_url 컬럼만 존재하고 업로드 동선이 없어서
 *    헤더 UserDropdown 이미지가 항상 이니셜 fallback 만 사용됨
 *
 * 어떻게:
 *  - withWebAuth 가드 → ctx.userId(bigint) 추출
 *  - multipart/form-data 파싱: req.formData() → file 필드
 *  - 파일 검증:
 *      MIME: image/jpeg | image/png | image/webp 만 허용 (그 외 400)
 *      크기: 최대 2MB (시안에도 명시된 제한)
 *  - put() 호출 — pathname `profile/{userId}-{timestamp}.{ext}`:
 *      timestamp 로 캐시 무효화 + 이전 이미지와 충돌 방지
 *      access: "public" — 헤더 <Image> 가 직접 표시할 수 있어야 함
 *      addRandomSuffix: false — path 직접 제어 (suffix 자동 추가 차단)
 *  - DB 업데이트 + 이전 이미지 del() (정리 실패해도 새 이미지 등록 성공 처리)
 *  - BLOB_READ_WRITE_TOKEN 미설정 시 친화 에러 메시지로 503 반환
 *    (운영 관리자가 Vercel 대시보드에서 토큰 발급 필요)
 *
 * 응답 (apiSuccess 자동 snake_case):
 *   { profile_image_url: string }
 */

import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/db/prisma";
import { withWebAuth, type WebAuthContext } from "@/lib/auth/web-session";
import { apiSuccess, apiError } from "@/lib/api/response";

// 허용 MIME 타입 — 시안 명시 (jpeg/png/webp). gif/heic 등은 차단.
const ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
// 최대 2MB — 시안 명시 + 모바일 업로드 친화 제한
const MAX_SIZE = 2 * 1024 * 1024;

// MIME 타입 → 확장자 매핑 (pathname 생성용)
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export const POST = withWebAuth(async (req: Request, ctx: WebAuthContext) => {
  try {
    // 환경변수 사전 점검 — BLOB_READ_WRITE_TOKEN 없으면 put() 호출 시점에
    // SDK 내부에서 던지는 에러가 사용자에게 친화적이지 않으므로 사전 차단
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return apiError(
        "이미지 업로드 환경 변수가 설정되지 않았습니다. 운영 관리자에게 문의해주세요.",
        503,
      );
    }

    // multipart/form-data 파싱 — Next.js Route Handler 표준 방식
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return apiError("multipart/form-data 형식이 아닙니다.", 400);
    }

    const file = formData.get("file");
    if (!(file instanceof File)) {
      return apiError("file 필드가 필요합니다.", 400);
    }

    // MIME 타입 검증 — 클라가 보낸 file.type 신뢰 (Vercel Blob 내부도 검증)
    if (!ALLOWED_MIME.includes(file.type as (typeof ALLOWED_MIME)[number])) {
      return apiError(
        "JPG, PNG, WEBP 형식만 업로드할 수 있습니다.",
        400,
      );
    }

    // 크기 검증 — file.size 는 byte 단위
    if (file.size > MAX_SIZE) {
      return apiError("이미지 크기는 2MB 이하여야 합니다.", 400);
    }
    if (file.size === 0) {
      return apiError("빈 파일은 업로드할 수 없습니다.", 400);
    }

    // 이전 이미지 URL 조회 (업로드 성공 후 정리에 사용)
    // 이 조회 실패는 업로드 실패가 아니므로 try/catch 로 격리
    const prev = await prisma.user
      .findUnique({
        where: { id: ctx.userId },
        select: { profile_image_url: true },
      })
      .catch(() => null);

    // pathname: profile/{userId}-{timestamp}.{ext}
    // - userId 로 사용자별 격리
    // - timestamp 로 같은 사용자 재업로드 시 URL 충돌 방지 + CDN 캐시 무효화
    const ext = MIME_TO_EXT[file.type] ?? "jpg";
    const pathname = `profile/${ctx.userId.toString()}-${Date.now()}.${ext}`;

    // Vercel Blob put — token 옵션 생략 시 process.env.BLOB_READ_WRITE_TOKEN 자동 사용
    const blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    // DB 업데이트 — profile_image_url 갱신 (snake_case 컬럼)
    await prisma.user.update({
      where: { id: ctx.userId },
      data: { profile_image_url: blob.url },
    });

    // 이전 이미지 정리 — 실패해도 신규 등록 성공으로 처리 (best effort)
    // 정리 실패 케이스: 이미 삭제됨 / 권한 변경 / 외부 URL(우리 blob 아님) 등
    if (prev?.profile_image_url && prev.profile_image_url !== blob.url) {
      try {
        await del(prev.profile_image_url);
      } catch (delErr) {
        // 로그만 남기고 응답에는 영향 없음
        console.warn(
          "[POST /api/web/profile/upload-image] 이전 이미지 정리 실패:",
          delErr,
        );
      }
    }

    return apiSuccess({ profile_image_url: blob.url });
  } catch (e) {
    // errors.md 04-30: catch raw 에러 console.error 명시
    console.error("[POST /api/web/profile/upload-image]", e);
    return apiError("Internal error", 500);
  }
});
