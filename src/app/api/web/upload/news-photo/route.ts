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
// 2026-05-04: EXIF 메타 파싱 (Phase 2 EXIF 자동 매치 추천)
// exifr — 표준 EXIF lib, ~30KB, DateTimeOriginal + GPS 추출
import exifr from "exifr";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";
import { apiSuccess, apiError, unauthorized } from "@/lib/api/response";
import { supabase } from "@/lib/supabase";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB (모바일 고화질 허용)
const TARGET_LONG_EDGE = 1920;
const WEBP_QUALITY = 80;
const BUCKET = "news-photos";
// 2026-05-04: 매치당 사진 최대 개수 — UI 가독성 + Storage 무제한 방지
// 일반 커뮤니티 기준 (Reddit gallery 20장, 네이버 카페 30장) 대비 보수
// 알기자 기사 = 단신 위주라 5~10장이 적정 / 15장은 여유 한도
const MAX_PHOTOS_PER_MATCH = 15;

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

  // 4) 매치 검증 + 매치당 사진 개수 한도 검증 (15장)
  const match = await prisma.tournamentMatch.findUnique({
    where: { id: matchId },
    select: { id: true },
  });
  if (!match) return apiError("매치를 찾을 수 없습니다.", 404);

  // 4-1) 매치당 사진 개수 한도
  const photoCount = await prisma.news_photo.count({ where: { match_id: matchId } });
  if (photoCount >= MAX_PHOTOS_PER_MATCH) {
    return apiError(
      `매치당 사진은 최대 ${MAX_PHOTOS_PER_MATCH}장까지 업로드 가능합니다. (현재 ${photoCount}장) 기존 사진 삭제 후 추가해주세요.`,
      400,
    );
  }

  // 5) sharp 정규화 — long-edge 1920 / WebP 80%
  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let processed: Buffer;
  let width = 0;
  let height = 0;
  let exifMeta: Record<string, unknown> | null = null;
  // 2026-05-04: EXIF 자동 매치 추천 — try 밖에서 접근하기 위해 호이스팅
  let photoTakenAt: string | null = null;
  try {
    const meta = await sharp(inputBuffer).metadata();
    const origW = meta.width ?? 0;
    const origH = meta.height ?? 0;
    const longEdge = Math.max(origW, origH);

    // 2026-05-04: EXIF 파싱 — DateTimeOriginal (촬영시각) + GPS (위도/경도) + 카메라
    // Phase 2 EXIF 자동 매치 추천에 활용 (촬영시각 ± 60분 범위 매치 검색)
    // photoTakenAt 은 try 밖에서 호이스팅됨 (응답에 포함하기 위함)
    let gpsLatitude: number | null = null;
    let gpsLongitude: number | null = null;
    let cameraMake: string | null = null;
    let cameraModel: string | null = null;
    if (meta.exif) {
      try {
        const parsed = await exifr.parse(inputBuffer, {
          pick: ["DateTimeOriginal", "CreateDate", "GPSLatitude", "GPSLongitude", "Make", "Model"],
        });
        if (parsed) {
          const dt = parsed.DateTimeOriginal ?? parsed.CreateDate;
          if (dt instanceof Date && !isNaN(dt.getTime())) {
            photoTakenAt = dt.toISOString();
          }
          if (typeof parsed.GPSLatitude === "number") gpsLatitude = parsed.GPSLatitude;
          if (typeof parsed.GPSLongitude === "number") gpsLongitude = parsed.GPSLongitude;
          if (typeof parsed.Make === "string") cameraMake = parsed.Make;
          if (typeof parsed.Model === "string") cameraModel = parsed.Model;
        }
      } catch (exifErr) {
        // EXIF 파싱 실패는 치명적이지 않음 — meta 만 저장
        console.warn(`[news-photo upload] EXIF parse 실패 (matchId=${matchId}):`, exifErr);
      }
    }

    exifMeta = {
      original_width: origW,
      original_height: origH,
      original_format: meta.format ?? null,
      original_size: file.size,
      has_exif: !!meta.exif,
      // 2026-05-04: EXIF 자동 매핑 큐 — 추천 시스템 활용
      photo_taken_at: photoTakenAt,
      gps_latitude: gpsLatitude,
      gps_longitude: gpsLongitude,
      camera_make: cameraMake,
      camera_model: cameraModel,
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

    // 2026-05-04: EXIF 추천 매치 — photo_taken_at 있으면 ± 60분 범위 매치 검색
    // 첫 1건만 반환 (현재 매치와 다르면 클라이언트가 경고 노출)
    let recommendedMatchId: string | null = null;
    let recommendedMatchInfo: { matchNumber: number | null; tournamentName: string | null } | null = null;
    if (photoTakenAt) {
      const taken = new Date(photoTakenAt);
      const before = new Date(taken.getTime() - 60 * 60 * 1000);
      const after = new Date(taken.getTime() + 60 * 60 * 1000);
      const candidate = await prisma.tournamentMatch.findFirst({
        where: {
          status: "completed",
          OR: [
            { ended_at: { gte: before, lte: after } },
            { scheduledAt: { gte: before, lte: after } },
          ],
        },
        select: {
          id: true,
          match_number: true,
          tournament: { select: { name: true } },
        },
        orderBy: { ended_at: "desc" },
      }).catch(() => null);
      if (candidate) {
        recommendedMatchId = candidate.id.toString();
        recommendedMatchInfo = {
          matchNumber: candidate.match_number,
          tournamentName: candidate.tournament?.name ?? null,
        };
      }
    }

    return apiSuccess({
      id: created.id.toString(),
      url: created.url,
      width: created.width,
      height: created.height,
      isHero: created.is_hero,
      displayOrder: created.display_order,
      caption: created.caption,
      createdAt: created.created_at.toISOString(),
      // EXIF 자동 추천 (다르면 클라이언트가 운영자에게 경고)
      photoTakenAt,
      recommendedMatchId,
      recommendedMatchInfo,
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
