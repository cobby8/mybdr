/**
 * POST /api/web/upload/news-photo
 * 알기자 (BDR NEWS) 기사 사진 업로드 — admin only.
 *
 * 흐름:
 *   1. 인증: getWebSession + isAdmin
 *   2. FormData 파싱: file + matchId (required) + isHero? + caption?
 *   3. 파일 검증: image/* 타입, 최대 10MB
 *   4. 매치 검증: TournamentMatch.findUnique
 *   5. sharp 정규화: long-edge 1920px + WebP 80% (모바일 사진 정리 + 용량 절감)
 *   6. Supabase Storage `news-photos` bucket 업로드 (path: match-{id}/{timestamp}-{random}.webp)
 *   7. isHero=true 일 때 트랜잭션 — 같은 매치 기존 isHero 모두 false 후 신규 INSERT
 *   8. display_order = 같은 매치 max(display_order) + 1
 */
import { type NextRequest } from "next/server";
import sharp from "sharp";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError, unauthorized } from "@/lib/api/response";
import { supabase } from "@/lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB (모바일 고화질 허용)
const TARGET_LONG_EDGE = 1920;
const WEBP_QUALITY = 80;
const BUCKET = "news-photos";

export async function POST(req: NextRequest) {
  // 1) 인증 + admin 검증
  const session = await getWebSession();
  if (!session) return unauthorized("로그인이 필요합니다.");

  const user = await prisma.user.findUnique({
    where: { id: BigInt(session.sub) },
    select: { id: true, isAdmin: true },
  });
  if (!user?.isAdmin) return apiError("관리자 권한이 필요합니다.", 403);

  // 2) Supabase Storage 사용 가능 여부
  if (!supabase) {
    return apiError(
      "이미지 업로드가 설정되지 않았습니다. Supabase Service Role Key를 .env에 추가하세요.",
      503,
      "STORAGE_NOT_CONFIGURED",
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
  const matchIdStr = formData.get("matchId") as string | null;
  const isHeroRaw = formData.get("isHero") as string | null;
  const caption = (formData.get("caption") as string | null) ?? null;

  if (!file || !(file instanceof File)) return apiError("파일을 선택하세요.", 400);
  if (!matchIdStr) return apiError("matchId 가 필요합니다.", 400);
  if (!ALLOWED_TYPES.includes(file.type)) {
    return apiError(`허용되지 않는 파일 형식입니다. (${ALLOWED_TYPES.join(", ")})`, 400);
  }
  if (file.size > MAX_SIZE) {
    return apiError(`파일이 너무 큽니다. 최대 ${MAX_SIZE / 1024 / 1024}MB.`, 400);
  }

  let matchId: bigint;
  try {
    matchId = BigInt(matchIdStr);
  } catch {
    return apiError("잘못된 matchId 형식입니다.", 400);
  }

  const isHero = isHeroRaw === "true";

  // 4) 매치 검증
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { id: true },
  });
  if (!match) return apiError("매치를 찾을 수 없습니다.", 404);

  // 5) sharp 정규화 — long-edge 1920 / WebP 80%
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let processed: Buffer;
  let width = 0;
  let height = 0;
  let exifMeta: Record<string, unknown> | null = null;
  try {
    const meta = await sharp(inputBuffer).metadata();
    const origW = meta.width ?? 0;
    const origH = meta.height ?? 0;
    const longEdge = Math.max(origW, origH);

    // EXIF 메타 (Phase 2 EXIF 매핑 큐 — 일단 기본 메타만 저장)
    exifMeta = {
      original_width: origW,
      original_height: origH,
      original_format: meta.format ?? null,
      original_size: file.size,
      // Phase 2 큐: exif 파싱 (촬영시각/GPS/카메라) — exif-reader 등 라이브러리 도입 시 확장
      has_exif: !!meta.exif,
    };

    if (longEdge > TARGET_LONG_EDGE) {
      // 비율 유지 long-edge 1920 리사이즈 + webp 변환
      processed = await sharp(inputBuffer)
        .rotate() // EXIF 회전 정보 자동 적용 (모바일 세로 사진 정렬)
        .resize({
          width: origW >= origH ? TARGET_LONG_EDGE : undefined,
          height: origH > origW ? TARGET_LONG_EDGE : undefined,
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    } else {
      processed = await sharp(inputBuffer)
        .rotate()
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
    }

    const outMeta = await sharp(processed).metadata();
    width = outMeta.width ?? 0;
    height = outMeta.height ?? 0;
  } catch (e) {
    console.error("[news-photo upload] sharp 정규화 실패:", e);
    return apiError("이미지 처리에 실패했습니다.", 500);
  }

  // 6) Supabase Storage 업로드
  const uniqueName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
  const storagePath = `match-${matchId}/${uniqueName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, processed, {
      contentType: "image/webp",
      upsert: false,
    });

  if (uploadError) {
    console.error("[news-photo upload] Supabase Storage 실패:", uploadError);
    return apiError(`업로드에 실패했습니다: ${uploadError.message}`, 500);
  }

  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  const publicUrl = urlData.publicUrl;

  // 7) DB INSERT — isHero=true 면 트랜잭션 (기존 isHero 모두 false)
  // 8) display_order = 같은 매치 max(display_order) + 1
  try {
    const created = await prisma.$transaction(async (tx) => {
      if (isHero) {
        await tx.news_photo.updateMany({
          where: { match_id: matchId, is_hero: true },
          data: { is_hero: false },
        });
      }
      // display_order 계산
      const maxOrder = await tx.news_photo.aggregate({
        where: { match_id: matchId },
        _max: { display_order: true },
      });
      const nextOrder = (maxOrder._max.display_order ?? -1) + 1;

      return tx.news_photo.create({
        data: {
          match_id: matchId,
          url: publicUrl,
          storage_path: storagePath,
          width,
          height,
          size_bytes: processed.length,
          is_hero: isHero,
          display_order: nextOrder,
          uploaded_by: user.id,
          caption,
          exif_meta: exifMeta as object,
        },
        select: {
          id: true,
          url: true,
          width: true,
          height: true,
          is_hero: true,
          display_order: true,
          caption: true,
          created_at: true,
        },
      });
    });

    return apiSuccess({
      id: created.id.toString(),
      url: created.url,
      width: created.width,
      height: created.height,
      isHero: created.is_hero,
      displayOrder: created.display_order,
      caption: created.caption,
      createdAt: created.created_at.toISOString(),
    });
  } catch (e) {
    // DB 실패 시 Storage 정리 (best effort)
    console.error("[news-photo upload] DB INSERT 실패:", e);
    void supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
    return apiError("DB 저장에 실패했습니다.", 500);
  }
}

/**
 * DELETE /api/web/upload/news-photo?id={photoId}
 * 사진 삭제 — admin only. DB row + Supabase Storage 둘 다 정리.
 */
export async function DELETE(req: NextRequest) {
  const session = await getWebSession();
  if (!session) return unauthorized("로그인이 필요합니다.");

  const user = await prisma.user.findUnique({
    where: { id: BigInt(session.sub) },
    select: { isAdmin: true },
  });
  if (!user?.isAdmin) return apiError("관리자 권한이 필요합니다.", 403);

  if (!supabase) return apiError("Storage 미설정", 503);

  const { searchParams } = new URL(req.url);
  const idStr = searchParams.get("id");
  if (!idStr) return apiError("id 가 필요합니다.", 400);

  let photoId: bigint;
  try {
    photoId = BigInt(idStr);
  } catch {
    return apiError("잘못된 id 형식입니다.", 400);
  }

  const photo = await prisma.news_photo.findUnique({
    where: { id: photoId },
    select: { id: true, storage_path: true },
  });
  if (!photo) return apiError("사진을 찾을 수 없습니다.", 404);

  // Storage 먼저 삭제 (실패해도 DB row 는 삭제 진행 — orphan storage 는 별도 cleanup 큐)
  await supabase.storage.from(BUCKET).remove([photo.storage_path]).catch((e) => {
    console.warn("[news-photo delete] Storage 삭제 실패 (DB 는 진행):", e);
  });

  await prisma.news_photo.delete({ where: { id: photoId } });
  return apiSuccess({ ok: true });
}
