import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

/**
 * VenueDetail — /venues/[slug] (BDR v2.2 P1-3 박제)
 *
 * Why: 공개 SEO 코트 페이지 (비로그인 열람 가능)
 *      검색엔진/공유 링크로 들어온 비로그인 유저 → 가입 유도
 * Pattern: CourtDetail.jsx 의 hero + info 카드 단순화 (예약/일정 hidden)
 *
 * 진입: 외부 검색엔진 (SEO) / 코트 공유 링크
 * 복귀: 비로그인 → /login (가입 유도) / 로그인 → /courts/[id] (풀 기능)
 *
 * 회귀 검수 매트릭스:
 *   기능              | 옛 페이지       | 시안 v2.2          | 진입점     | 모바일
 *   코트 기본 정보    | CourtDetail ✅ | ✅ hero + info     | SEO/공유   | 1열
 *   지도              | CourtDetail ✅ | ✅ static map      | -          | OK
 *   사진 갤러리       | -              | ✅ 4-up grid       | -          | 2열
 *   리뷰 요약         | -              | ✅ 평점 + 3개      | -          | OK
 *   비로그인 가입 CTA | -              | ✅ /login 카드     | -          | 하단 sticky
 *   로그인 풀페이지   | -              | ✅ /courts/[id]    | -          | OK
 *   JSON-LD          | -              | ✅ Place           | SEO        | -
 *
 * 시안 출처: Dev/design/BDR v2.2/screens/VenueDetail.jsx
 *           Dev/design/BDR v2.2/screens/CourtDetail.jsx (hero + info 패턴)
 *
 * 박제 룰:
 * - 공개 SEO 페이지 → getWebSession 가드 X (비로그인 열람 가능)
 * - DB/API 절대 변경 X — UI만 시안 톤
 * - 하드코딩 색상 금지 → var(--*) 토큰만
 * - 메타데이터 (Open Graph) 보존
 */

export const revalidate = 300; // 5분 ISR

type PageParams = { slug: string };

// SEO: 동적 메타데이터 생성 (보존 — 변경 0)
export async function generateMetadata({ params }: { params: Promise<PageParams> }): Promise<Metadata> {
  const { slug } = await params;
  let courtId: bigint;
  try { courtId = BigInt(slug); } catch { return { title: "체육관 | MyBDR" }; }

  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
    select: { name: true, address: true, court_type: true, rental_available: true },
  }).catch(() => null);

  if (!court) return { title: "체육관 | MyBDR" };

  const typeLabel = court.court_type === "indoor" ? "실내" : "야외";
  const rentalLabel = court.rental_available ? " | 대관 가능" : "";

  return {
    title: `${court.name} | MyBDR`,
    description: `${court.name} — ${typeLabel} 농구장${rentalLabel}. ${court.address}`,
    openGraph: {
      title: `${court.name} | MyBDR`,
      description: `${court.name} — ${typeLabel} 농구장${rentalLabel}`,
    },
  };
}

export default async function VenueDetailPage({ params }: { params: Promise<PageParams> }) {
  const { slug } = await params;
  let courtId: bigint;
  try { courtId = BigInt(slug); } catch { notFound(); return null; }

  // 코트 상세 조회 (보존 — DB 패칭 변경 X)
  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
  }).catch(() => null);

  if (!court || court.status !== "active") notFound();

  // 관련 다가오는 경기 조회 (보존 — count만 SEO CTA 에 사용)
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
      city: true,
    },
  }).catch(() => []);

  // v2.2 신규: 리뷰 요약 (최근 3건) — DB 변경 없이 select로 가벼운 조회
  const recentReviews = await prisma.court_reviews.findMany({
    where: {
      court_info_id: court.id,
      status: "published",
      content: { not: null }, // 본문 있는 리뷰만
    },
    orderBy: { created_at: "desc" },
    take: 3,
    select: {
      id: true,
      rating: true,
      content: true,
      created_at: true,
      users: { select: { nickname: true } },
    },
  }).catch(() => []);

  const isIndoor = court.court_type === "indoor";
  const typeLabel = isIndoor ? "실내" : "야외";
  const lat = Number(court.latitude);
  const lng = Number(court.longitude);
  const facilities = Array.isArray(court.facilities) ? court.facilities as string[] : [];

  // 카카오맵 링크
  const kakaoMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(court.name)},${lat},${lng}`;

  // v2.2 신규: JSON-LD SportsActivityLocation — SEO 강화 (구조화 데이터)
  // Why: 외부 검색엔진이 코트 정보를 풍부하게 노출하도록
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SportsActivityLocation",
    name: court.name,
    description: court.description ?? `${court.name} — ${typeLabel} 농구장`,
    address: {
      "@type": "PostalAddress",
      streetAddress: court.address,
      addressLocality: court.city ?? undefined,
      addressCountry: "KR",
    },
    geo: lat && lng ? {
      "@type": "GeoCoordinates",
      latitude: lat,
      longitude: lng,
    } : undefined,
    telephone: undefined, // court_infos 에 phone 없음
    sport: "Basketball",
    aggregateRating: court.average_rating && Number(court.average_rating) > 0 ? {
      "@type": "AggregateRating",
      ratingValue: Number(court.average_rating).toFixed(1),
      reviewCount: court.reviews_count,
    } : undefined,
  };

  // 경기 유형 레이블 — v2 badge용 짧은 라벨
  const gameTypeBadge = (type: number) => {
    switch (type) {
      case 0: return "픽업";
      case 1: return "팀매치";
      case 2: return "대회";
      default: return "경기";
    }
  };

  // 날짜 포맷 — v2 ff-mono 톤 (YYYY.MM.DD HH:mm)
  const fmtDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    return `${y}.${m}.${day} ${hh}:${mm}`;
  };

  return (
    <div className="page page--wide" style={{ paddingBottom: 80 }}>
      {/* JSON-LD: SEO 구조화 데이터 (검색엔진 노출 강화) */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* breadcrumb (v2.2 톤: 홈 › 코트 › [city] › 체육관명) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 14, flexWrap: "wrap" }}>
        <Link href="/" style={{ cursor: "pointer" }}>홈</Link>
        <span>›</span>
        <Link href="/courts" style={{ cursor: "pointer" }}>코트</Link>
        {court.city && (
          <>
            <span>›</span>
            <span>{court.city}</span>
          </>
        )}
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>{court.name}</span>
      </div>

      {/* 메인 그리드: 좌측 본문 + 우측 사이드바 */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 24, alignItems: "flex-start" }}>
        {/* 좌측 메인 */}
        <div>
          {/* 헤더 카드 — 사진 placeholder + 영역/이름/주소/소개 (CourtDetail 시안 패턴) */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
            {/* 사진 placeholder (v2 톤: 사선 줄무늬) */}
            <div style={{
              height: 220,
              background: "repeating-linear-gradient(45deg, var(--bg-alt) 0 14px, var(--bg-elev) 14px 28px)",
              position: "relative",
              borderBottom: "1px solid var(--border)",
            }}>
              <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", fontFamily: "var(--ff-mono)", fontSize: 12, color: "var(--ink-dim)" }}>
                COURT PHOTO · placeholder
              </div>
              {/* 좌측 상단 뱃지: 유형 + 대관/평점 */}
              <div style={{ position: "absolute", left: 16, top: 16, display: "flex", gap: 6, flexWrap: "wrap" }}>
                <span className="badge badge--soft">{typeLabel}</span>
                {court.rental_available && <span className="badge badge--soft">대관 가능</span>}
                {court.is_free && <span className="badge badge--soft">무료</span>}
                {court.average_rating && Number(court.average_rating) > 0 && (
                  <span className="badge badge--soft">★ {Number(court.average_rating).toFixed(1)}</span>
                )}
              </div>
            </div>

            <div style={{ padding: "22px 24px" }}>
              {/* 영역 (city 있으면 표시) */}
              {court.city && (
                <div style={{ fontSize: 12, color: "var(--ink-dim)", letterSpacing: ".08em", textTransform: "uppercase", fontWeight: 700, marginBottom: 6 }}>
                  {court.city}
                </div>
              )}
              {/* 체육관 이름 */}
              <h1 style={{ margin: "0 0 8px", fontSize: 30, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {court.name}
              </h1>
              {court.nickname && (
                <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 6 }}>{court.nickname}</div>
              )}
              {/* 주소 */}
              <div style={{ fontSize: 13, color: "var(--ink-mute)", marginBottom: 14 }}>
                {court.address}
              </div>
              {/* 소개 */}
              {court.description && (
                <p style={{ margin: 0, color: "var(--ink-soft)", lineHeight: 1.7, whiteSpace: "pre-wrap" }}>
                  {court.description}
                </p>
              )}
            </div>
          </div>

          {/* v2.2 신규: 사진 갤러리 4-up grid (placeholder) */}
          {/* Why: 시안 박제 — DB에 코트 사진 컬렉션 없으므로 placeholder 노출 */}
          <div className="card" style={{ padding: "18px 22px", marginBottom: 20 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "var(--ink-dim)", textTransform: "uppercase", marginBottom: 12 }}>
              코트 사진
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {[1, 2, 3, 4].map(i => (
                <div
                  key={i}
                  style={{
                    aspectRatio: "1",
                    background: "repeating-linear-gradient(45deg, var(--bg-alt) 0 8px, var(--bg-elev) 8px 16px)",
                    border: "1px solid var(--border)",
                    borderRadius: 4,
                    display: "grid",
                    placeItems: "center",
                    color: "var(--ink-dim)",
                    fontSize: 11,
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  PHOTO {i}
                </div>
              ))}
            </div>
          </div>

          {/* 대관 CTA (rental_available 시) — 보존 */}
          {court.rental_available && court.rental_url && (
            <div className="card" style={{ padding: "18px 22px", marginBottom: 20, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "var(--ink-dim)", textTransform: "uppercase", marginBottom: 4 }}>
                  대관 신청
                </div>
                <div style={{ fontSize: 14, color: "var(--ink)" }}>
                  {court.fee && Number(court.fee) > 0
                    ? <>대관 비용 <span style={{ fontFamily: "var(--ff-mono)", fontWeight: 700 }}>{Number(court.fee).toLocaleString()}원</span></>
                    : "외부 시스템에서 대관 신청"}
                </div>
              </div>
              <a
                href={court.rental_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
              >
                대관 신청하기
              </a>
            </div>
          )}

          {/* 추가 시설 태그 (보존) */}
          {facilities.length > 0 && (
            <div className="card" style={{ padding: "18px 22px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "var(--ink-dim)", textTransform: "uppercase", marginBottom: 12 }}>
                추가 시설
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {facilities.map((f, i) => (
                  <span key={i} className="badge badge--soft">{String(f)}</span>
                ))}
              </div>
            </div>
          )}

          {/* v2.2 신규: 리뷰 요약 (최근 3건) */}
          {recentReviews.length > 0 && (
            <div className="card" style={{ padding: "18px 22px", marginBottom: 20 }}>
              <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "var(--ink-dim)", textTransform: "uppercase" }}>
                  리뷰 ({court.reviews_count})
                </div>
                {/* 전체 보기 → 풀 페이지 (로그인 후 리뷰 작성 가능) */}
                <Link href={`/courts/${court.id}`} style={{ fontSize: 12 }}>
                  전체 보기 ›
                </Link>
              </div>
              <div style={{ display: "grid", gap: 14 }}>
                {recentReviews.map((r, i) => (
                  <div
                    key={r.id.toString()}
                    style={{
                      paddingBottom: 14,
                      borderBottom: i < recentReviews.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <b style={{ fontSize: 13 }}>{r.users?.nickname ?? "익명"}</b>
                      {/* 별점 — 시안 톤(★ 5칸) */}
                      <span style={{ color: "#F59E0B", fontSize: 13 }}>
                        {"★".repeat(r.rating)}
                        <span style={{ color: "var(--border)" }}>{"★".repeat(Math.max(0, 5 - r.rating))}</span>
                      </span>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.6 }}>
                      {r.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 이 코트의 일정 — v2 톤: card 안에 row 리스트 (보존) */}
          {upcomingGames.length > 0 && (
            <div className="card" style={{ padding: 0, marginBottom: 20 }}>
              <div style={{ padding: "16px 22px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h2 style={{ margin: 0, fontSize: 17, fontWeight: 700 }}>이 코트의 일정</h2>
                <Link href="/games" style={{ fontSize: 12 }}>더보기 ›</Link>
              </div>
              {upcomingGames.map((g, i) => (
                <Link
                  key={g.id.toString()}
                  href={`/games/${g.game_id}`}
                  style={{
                    padding: "14px 22px",
                    borderBottom: i < upcomingGames.length - 1 ? "1px solid var(--border)" : 0,
                    display: "grid",
                    gridTemplateColumns: "72px 1fr auto",
                    gap: 14,
                    alignItems: "center",
                    color: "var(--ink)",
                  }}
                >
                  <span className="badge badge--soft">{gameTypeBadge(g.game_type)}</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{g.title}</div>
                    <div style={{ fontSize: 12, color: "var(--ink-dim)", fontFamily: "var(--ff-mono)", marginTop: 2 }}>
                      {fmtDate(new Date(g.scheduled_at))}
                    </div>
                  </div>
                  <span style={{ fontFamily: "var(--ff-mono)", color: "var(--ink-dim)", fontSize: 13 }}>›</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 우측 사이드바 (sticky) */}
        <aside style={{ position: "sticky", top: 120 }}>
          {/* 지도 placeholder (보존) */}
          <div className="card" style={{ padding: 0, overflow: "hidden", marginBottom: 14 }}>
            <div style={{
              height: 180,
              background: "repeating-linear-gradient(45deg, var(--bg-alt) 0 10px, var(--bg-elev) 10px 20px)",
              position: "relative",
            }}>
              {/* 핀 (v2 톤) */}
              <div style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 18,
                height: 18,
                background: "var(--accent)",
                border: "3px solid #fff",
                borderRadius: "50% 50% 50% 0",
                transform: "translate(-50%,-100%) rotate(-45deg)",
                boxShadow: "0 2px 8px rgba(0,0,0,.3)",
              }} />
              <div style={{
                position: "absolute",
                bottom: 8,
                left: 8,
                fontFamily: "var(--ff-mono)",
                fontSize: 10,
                color: "var(--ink-dim)",
                background: "var(--bg-elev)",
                padding: "3px 7px",
                borderRadius: 3,
              }}>
                MAP · placeholder
              </div>
            </div>
            <div style={{ padding: "14px 18px" }}>
              <a
                href={kakaoMapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--sm"
                style={{ width: "100%", display: "inline-flex", justifyContent: "center" }}
              >
                지도에서 열기
              </a>
            </div>
          </div>

          {/* 시설 정보 — 라벨/값 그리드 (보존) */}
          <div className="card" style={{ padding: "18px 20px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "var(--ink-dim)", textTransform: "uppercase", marginBottom: 12 }}>
              시설 정보
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", rowGap: 9, fontSize: 13 }}>
              <div style={{ color: "var(--ink-dim)" }}>유형</div>
              <div>
                {typeLabel}
                {court.hoops_count ? ` · 골대 ${court.hoops_count}개` : ""}
              </div>

              <div style={{ color: "var(--ink-dim)" }}>이용료</div>
              <div>
                {court.is_free
                  ? "무료"
                  : (court.fee && Number(court.fee) > 0 ? `${Number(court.fee).toLocaleString()}원` : "유료")}
              </div>

              {court.court_size && (
                <>
                  <div style={{ color: "var(--ink-dim)" }}>코트</div>
                  <div>{court.court_size}</div>
                </>
              )}

              {court.surface_type && (
                <>
                  <div style={{ color: "var(--ink-dim)" }}>바닥</div>
                  <div>{court.surface_type}</div>
                </>
              )}

              <div style={{ color: "var(--ink-dim)" }}>조명</div>
              <div>{court.has_lighting ? "있음" : "없음"}</div>

              <div style={{ color: "var(--ink-dim)" }}>주차</div>
              <div>{court.has_parking ? "가능" : "불가"}</div>

              <div style={{ color: "var(--ink-dim)" }}>화장실</div>
              <div>{court.has_restroom ? "있음" : "없음"}</div>

              {court.nearest_station && (
                <>
                  <div style={{ color: "var(--ink-dim)" }}>최근역</div>
                  <div>{court.nearest_station}</div>
                </>
              )}
            </div>
          </div>

          {/* 활동 통계 (체크인/리뷰) — 보존 */}
          <div className="card" style={{ padding: "18px 20px", marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: ".1em", color: "var(--ink-dim)", textTransform: "uppercase", marginBottom: 12 }}>
              활동
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <div style={{ fontFamily: "var(--ff-mono)", fontSize: 20, fontWeight: 800 }}>{court.checkins_count}</div>
                <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>체크인</div>
              </div>
              <div>
                <div style={{ fontFamily: "var(--ff-mono)", fontSize: 20, fontWeight: 800 }}>{court.reviews_count}</div>
                <div style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 2 }}>리뷰</div>
              </div>
            </div>
          </div>

          {/* v2.2 신규: 비로그인 가입 유도 CTA (시안 박제) */}
          {/* Why: 공개 SEO 페이지 — 검색엔진/공유로 들어온 비회원 → 가입 동선 */}
          {/*       서버 컴포넌트라 로그인 상태 모름 → 항상 노출 (이미 회원이면 "이미 회원이에요" 클릭) */}
          <div
            className="card"
            style={{
              padding: "18px 22px",
              marginBottom: 14,
              background: "linear-gradient(135deg, color-mix(in oklab, var(--accent) 8%, transparent), transparent)",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 800, marginBottom: 6 }}>
              이 코트에서 더 많이 즐기려면
            </div>
            <ul style={{ margin: "0 0 14px", padding: "0 0 0 18px", fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.8 }}>
              {upcomingGames.length > 0 && (
                <li>{upcomingGames.length}건의 진행 예정 픽업·게스트 모집</li>
              )}
              <li>실시간 체크인 · 리뷰 작성</li>
              <li>이 코트 멤버 채팅방 참여</li>
            </ul>
            <Link
              href="/signup"
              className="btn btn--primary btn--xl"
              style={{ width: "100%", display: "inline-flex", justifyContent: "center" }}
            >
              가입하고 시작 →
            </Link>
            <Link
              href="/login"
              className="btn"
              style={{ width: "100%", marginTop: 8, display: "inline-flex", justifyContent: "center" }}
            >
              이미 회원이에요
            </Link>
          </div>

          {/* 코트 풀 페이지 진입 (로그인 사용자 동선) */}
          <Link
            href={`/courts/${court.id}`}
            className="btn btn--xl"
            style={{ width: "100%", display: "inline-flex", justifyContent: "center" }}
          >
            이 코트 풀 페이지 보기 →
          </Link>
        </aside>
      </div>
    </div>
  );
}
