import sharp from "sharp";

/**
 * 정산 서류 이미지 최적화 + 검증 유틸.
 *
 * 이유: 원본 이미지를 그대로 암호화하면 DB 용량이 폭증한다.
 *       1500px 이내 리사이즈 + 그레이스케일 + JPEG 70% 압축으로
 *       평균 80~90% 용량을 절감하면서 OCR/열람에 충분한 품질을 유지한다.
 */

// ── 허용 MIME 타입 ──
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
] as const;

// ── 최대 파일 크기: 10MB (최적화 전 원본 기준) ──
const MAX_FILE_SIZE = 10 * 1024 * 1024;

// ── 매직 바이트 시그니처 (파일 위변조 방지) ──
const MAGIC_BYTES: Record<string, number[]> = {
  "image/jpeg": [0xff, 0xd8, 0xff],        // JPEG: FF D8 FF
  "image/png": [0x89, 0x50, 0x4e, 0x47],   // PNG: 89 50 4E 47
  "application/pdf": [0x25, 0x50, 0x44, 0x46], // PDF: %PDF
};

/**
 * 이미지 최적화: 리사이즈 + 그레이스케일 + JPEG 압축.
 *
 * PDF는 이미지가 아니므로 최적화하지 않고 원본 그대로 반환한다.
 * (sharp는 PDF를 처리하지 못함)
 */
export async function optimizeDocumentImage(
  buffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  // PDF는 최적화 불가 — 원본 반환
  if (mimeType === "application/pdf") {
    return buffer;
  }

  // 1500px 이내 리사이즈 + 흑백 + JPEG 70% 압축
  return sharp(buffer)
    .resize(1500, 1500, { fit: "inside", withoutEnlargement: true })
    .grayscale()
    .jpeg({ quality: 70 })
    .toBuffer();
}

// ──────────────────────────────────────────────────────────
// 팀 로고 자동 정규화 — 정방형 + padding + 512×512 + PNG 압축
// ──────────────────────────────────────────────────────────

// 출력 캔버스 크기 (정방형). 512px 는 모바일 카드/헤더 어디에 써도 충분 + 파일 크기도 적정.
const TEAM_LOGO_TARGET_SIZE = 512;
// 가장자리 padding 비율. 8% = 좌우상하 합 16% 여백.
// 사유: 가로형 로고가 정사각 캔버스에 꽉 차면 "잘려 보이는 느낌" 발생 → 일정 여백 강제.
//       16팀 작업 (commit 637c55e) 에서 8% 가 "여유 + 답답하지 않음" 균형으로 검증됨.
const TEAM_LOGO_PADDING_RATIO = 0.08;

/**
 * 팀 로고 자동 정규화.
 *
 * 이유:
 *   - 사용자가 업로드하는 로고는 가로형/세로형/정사각 비율이 제각각.
 *     → 카드 / 헤더 / hero 등 정사각 슬롯에 그대로 박으면 잘림(cover) or 빈공간(contain) 둘 다 미관 나쁨.
 *   - 사전에 "정방형 + 적정 padding" 으로 통일하면 어디 박아도 일관된 룩.
 *   - 16팀 일괄 처리 pipeline 그대로 재사용 (검증 완료).
 *
 * 어떻게:
 *   1) inner = TARGET * (1 - PADDING*2). resize(inner, inner, contain) — 비율 유지하며 inner 안에 맞춤.
 *   2) extend(pad) — contain 결과를 가운데 정렬하여 TARGET×TARGET 으로 확장. 배경은 투명.
 *   3) png(compressionLevel: 9) — 무손실 최대 압축. 컬러 로고 보존 (그레이스케일 ❌).
 *
 * @param inputBuf 원본 이미지 Buffer (sharp 가 읽을 수 있는 모든 포맷 — PNG/JPEG/WebP/GIF/AVIF 등)
 * @returns 512×512 PNG Buffer (투명 배경 보존)
 */
export async function normalizeTeamLogo(inputBuf: Buffer): Promise<Buffer> {
  // inner: 패딩을 뺀 실제 로고가 그려질 영역 (예: 512 * 0.84 ≈ 430)
  const innerSize = Math.floor(TEAM_LOGO_TARGET_SIZE * (1 - TEAM_LOGO_PADDING_RATIO * 2));

  // 1단계: 원본을 inner × inner 안에 비율 유지 + 투명 배경으로 contain 리사이즈
  const resized = await sharp(inputBuf)
    .resize(innerSize, innerSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .toBuffer();

  // 2단계: 양옆/상하에 padding 만큼 투명 영역 추가 → 정확히 TARGET × TARGET 캔버스 완성
  // pad 가 홀수일 때 floor/ceil 로 좌우 1px 차이 보정 (sharp 가 정수 요구).
  const pad = (TEAM_LOGO_TARGET_SIZE - innerSize) / 2;
  return sharp(resized)
    .extend({
      top: Math.floor(pad),
      bottom: Math.ceil(pad),
      left: Math.floor(pad),
      right: Math.ceil(pad),
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png({ compressionLevel: 9 })
    .toBuffer();
}

/**
 * 파일 유효성 검증.
 *
 * 3가지를 확인한다:
 *   1) MIME 타입이 허용 목록에 있는지
 *   2) 파일 크기가 10MB 이내인지
 *   3) 파일의 매직 바이트(시그니처)가 MIME 타입과 일치하는지
 *
 * 매직 바이트 검증 이유: Content-Type 헤더는 클라이언트가 위조할 수 있으므로
 * 실제 파일 내용의 첫 바이트를 확인하여 위장된 악성 파일을 차단한다.
 */
export function validateImageFile(
  buffer: Buffer,
  mimeType: string
): { valid: boolean; error?: string } {
  // 1) MIME 타입 체크
  if (!ALLOWED_MIME_TYPES.includes(mimeType as typeof ALLOWED_MIME_TYPES[number])) {
    return {
      valid: false,
      error: `허용되지 않는 파일 형식입니다. (허용: JPEG, PNG, PDF)`,
    };
  }

  // 2) 파일 크기 체크 (10MB)
  if (buffer.length > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기가 너무 큽니다. (최대 10MB, 현재 ${(buffer.length / 1024 / 1024).toFixed(1)}MB)`,
    };
  }

  // 3) 매직 바이트 검증 — 실제 파일 내용과 MIME 타입 일치 확인
  const expected = MAGIC_BYTES[mimeType];
  if (expected) {
    const header = Array.from(buffer.subarray(0, expected.length));
    const matches = expected.every((byte, i) => header[i] === byte);
    if (!matches) {
      return {
        valid: false,
        error: "파일 내용이 지정된 형식과 일치하지 않습니다.",
      };
    }
  }

  return { valid: true };
}
