/**
 * POST /api/web/upload
 * Supabase Storage 이미지 업로드 API
 *
 * - FormData: file(File), bucket(string), path(string)
 * - 인증: 쿠키 JWT (로그인 필수)
 * - 파일 검증: image/* 타입만, 최대 5MB
 * - 성공 시 공개 URL 반환
 */
import { type NextRequest } from "next/server";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError, unauthorized } from "@/lib/api/response";
import { supabase } from "@/lib/supabase";
// 2026-05-02: 팀 로고 업로드 시 sharp pipeline 자동 적용 (16팀 일괄 작업 commit 637c55e 의 정규화를 신규 업로드에도 일관 적용).
import { normalizeTeamLogo } from "@/lib/services/image-processor";

// 허용할 이미지 MIME 타입 목록
// SVG는 XSS 공격 벡터가 될 수 있어 차단 (스크립트 삽입 가능)
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

// 최대 파일 크기 (5MB)
const MAX_SIZE = 5 * 1024 * 1024;

export async function POST(req: NextRequest) {
  // 1) 인증 확인 — 로그인하지 않으면 업로드 불가
  const session = await getWebSession();
  if (!session) return unauthorized("로그인이 필요합니다.");

  // 2) Supabase 클라이언트 확인 — Service Role Key 없으면 사용 불가
  if (!supabase) {
    return apiError(
      "이미지 업로드가 설정되지 않았습니다. Supabase Service Role Key를 .env에 추가하세요.",
      503,
      "STORAGE_NOT_CONFIGURED"
    );
  }

  // 3) FormData 파싱
  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    return apiError("잘못된 요청 형식입니다. FormData를 전송하세요.", 400);
  }

  const file = formData.get("file") as File | null;
  const bucket = (formData.get("bucket") as string) ?? "tournament-images";
  const pathPrefix = (formData.get("path") as string) ?? "";

  // 4) 파일 존재 확인
  if (!file || !(file instanceof File)) {
    return apiError("파일을 선택하세요.", 400);
  }

  // 5) 파일 타입 검증 — 이미지만 허용
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError(
      `허용되지 않는 파일 형식입니다. (${ALLOWED_TYPES.join(", ")})`,
      400
    );
  }

  // 6) 파일 크기 검증 — 5MB 초과 불가
  if (file.size > MAX_SIZE) {
    return apiError(
      `파일 크기가 너무 큽니다. 최대 ${MAX_SIZE / 1024 / 1024}MB까지 업로드 가능합니다.`,
      400
    );
  }

  // 7) 파일을 ArrayBuffer 로 변환
  // 타입 명시: sharp 의 toBuffer() 는 Buffer<ArrayBufferLike> 를 반환하므로
  // 좁은 타입 (Buffer<ArrayBuffer>) 으로 추론되면 재할당 시 TS2322 발생 → Buffer 로 wide 하게 선언.
  let buffer: Buffer = Buffer.from(await file.arrayBuffer());
  // 업로드 시 사용할 contentType / 확장자 — 기본은 원본 그대로
  let outContentType = file.type;
  let outExt = file.name.split(".").pop() ?? "jpg";

  // 8) 팀 로고 자동 정규화 (bucket === "team-logos" 일 때만)
  // 사유:
  //  - 사용자 업로드 로고가 가로형/세로형 등 비율이 제각각 → 카드/헤더 슬롯에서 잘림 or 빈공간 회귀.
  //  - 16팀 일괄 작업 (commit 637c55e) 과 동일 pipeline (정방형 + 8% padding + 512×512 + PNG) 으로 신규 업로드도 자동 통일.
  //  - 다른 bucket (tournament-images / court-photos) 은 원본 비율 유지가 중요 (16:9 배너 등) → 적용 ❌.
  // 안전:
  //  - 정규화 실패 시 원본 그대로 업로드 (사용자 경험 단절 방지). 로그만 남김.
  //  - 입력 5MB 제한은 변환 전 기준 (이미 위에서 검증). 변환 후는 보통 더 작음.
  if (bucket === "team-logos") {
    try {
      buffer = await normalizeTeamLogo(buffer);
      // sharp 출력은 무조건 PNG (투명 배경 보존 + 무손실). 확장자 / contentType 강제 동기화.
      outContentType = "image/png";
      outExt = "png";
    } catch (normErr) {
      // 정규화 실패는 치명적이지 않음 — 원본 그대로 진행. 운영자 추적용으로만 로그.
      console.warn("[Upload] team-logos normalize 실패, 원본 그대로 진행:", normErr);
    }
  }

  // 9) 고유한 파일명 생성 — 충돌 방지를 위해 타임스탬프 + 랜덤 문자 추가
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${outExt}`;
  const storagePath = pathPrefix ? `${pathPrefix}/${uniqueName}` : uniqueName;

  // 10) Supabase Storage 업로드
  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(storagePath, buffer, {
      contentType: outContentType,
      upsert: false, // 같은 이름 덮어쓰기 방지
    });

  if (uploadError) {
    console.error("[Upload Error]", uploadError);
    return apiError(
      `업로드에 실패했습니다: ${uploadError.message}`,
      500
    );
  }

  // 9) 공개 URL 생성
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(storagePath);

  return apiSuccess({ url: urlData.publicUrl });
}
