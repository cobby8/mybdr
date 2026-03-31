import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { apiSuccess, apiError } from "@/lib/api/response";

/**
 * GET /api/web/venues/:slug
 * 체육관 공개 상세 조회 API
 *
 * slug 파라미터는 court_infos.id를 사용한다 (모델에 slug 필드가 없으므로).
 * 대관 가능한 체육관의 상세 정보를 반환한다.
 * 5분 캐시 적용 (공개 페이지이므로 실시간 불필요)
 */
export const revalidate = 300;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  // slug가 숫자면 id로 조회, 아니면 이름으로 검색
  let courtId: bigint;
  try {
    courtId = BigInt(slug);
  } catch {
    return apiError("잘못된 체육관 ID입니다.", 400);
  }

  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
    select: {
      id: true,
      name: true,
      nickname: true,
      description: true,
      address: true,
      city: true,
      district: true,
      latitude: true,
      longitude: true,
      court_type: true,
      hoops_count: true,
      surface_type: true,
      is_free: true,
      fee: true,
      operating_hours: true,
      facilities: true,
      has_lighting: true,
      has_restroom: true,
      has_parking: true,
      rental_available: true,
      rental_url: true,
      photo_url: true,
      nearest_station: true,
      court_size: true,
      average_rating: true,
      reviews_count: true,
      checkins_count: true,
      status: true,
    },
  });

  if (!court || court.status !== "active") {
    return apiError("체육관을 찾을 수 없습니다.", 404);
  }

  // 관련 경기 조회 (최근 5건)
  const upcomingGames = await prisma.games.findMany({
    where: {
      court_id: court.id,
      scheduled_at: { gte: new Date() },
    },
    orderBy: { scheduled_at: "asc" },
    take: 5,
    select: {
      id: true,
      game_id: true,
      title: true,
      game_type: true,
      scheduled_at: true,
    },
  }).catch(() => []);

  return apiSuccess({
    id: court.id.toString(),
    name: court.name,
    nickname: court.nickname,
    description: court.description,
    address: court.address,
    city: court.city,
    district: court.district,
    latitude: court.latitude ? Number(court.latitude) : null,
    longitude: court.longitude ? Number(court.longitude) : null,
    court_type: court.court_type,
    hoops_count: court.hoops_count,
    surface_type: court.surface_type,
    is_free: court.is_free,
    fee: court.fee ? Number(court.fee) : null,
    operating_hours: court.operating_hours,
    facilities: Array.isArray(court.facilities) ? court.facilities : [],
    has_lighting: court.has_lighting,
    has_restroom: court.has_restroom,
    has_parking: court.has_parking,
    rental_available: court.rental_available,
    rental_url: court.rental_url,
    photo_url: court.photo_url,
    nearest_station: court.nearest_station,
    court_size: court.court_size,
    average_rating: court.average_rating ? Number(court.average_rating) : null,
    reviews_count: court.reviews_count,
    checkins_count: court.checkins_count,
    upcoming_games: upcomingGames.map((g) => ({
      id: g.id.toString(),
      game_id: g.game_id,
      title: g.title,
      game_type: g.game_type,
      scheduled_at: g.scheduled_at,
    })),
  });
}
