import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/db/prisma";

/**
 * 체육관 상세 페이지 (공개, SEO 최적화)
 * - 서버 컴포넌트로 Prisma 직접 쿼리
 * - 대관 정보, 시설, 위치, 관련 경기 표시
 * - court_infos.id 기반 (slug 필드 없음)
 *
 * v2 톤 박제 (CourtDetail.jsx 참조):
 * - .page page--wide 컨테이너
 * - breadcrumb (홈 › 코트 › 체육관명)
 * - 좌측 메인(card 헤더 placeholder + 시설 + 일정) + 우측 사이드바(map + 시설 정보)
 * - var(--ink-*), var(--bg-*), var(--border), var(--accent), var(--ff-mono) 토큰 사용
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

  // 코트 상세 조회 (보존)
  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
  }).catch(() => null);

  if (!court || court.status !== "active") notFound();

  // 관련 다가오는 경기 조회 (보존)
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

  const isIndoor = court.court_type === "indoor";
  const typeLabel = isIndoor ? "실내" : "야외";
  const lat = Number(court.latitude);
  const lng = Number(court.longitude);
  const facilities = Array.isArray(court.facilities) ? court.facilities as string[] : [];

  // 카카오맵 링크
  const kakaoMapUrl = `https://map.kakao.com/link/map/${encodeURIComponent(court.name)},${lat},${lng}`;

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
    <div className="page page--wide">
      {/* breadcrumb (v2 톤: 홈 › 코트 › 체육관명) */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "var(--ink-mute)", marginBottom: 14, flexWrap: "wrap" }}>
        <Link href="/" style={{ cursor: "pointer" }}>홈</Link>
        <span>›</span>
        <Link href="/courts" style={{ cursor: "pointer" }}>코트</Link>
        <span>›</span>
        <span style={{ color: "var(--ink)" }}>{court.name}</span>
      </div>

      {/* 메인 그리드: 좌측 본문 + 우측 사이드바 */}
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) 340px", gap: 24, alignItems: "flex-start" }}>
        {/* 좌측 메인 */}
        <div>
          {/* 헤더 카드 — 사진 placeholder + 영역/이름/주소/소개 */}
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

          {/* 대관 CTA (rental_available 시) */}
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

          {/* 추가 시설 태그 (있을 때만) */}
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

          {/* 이 코트의 일정 — v2 톤: card 안에 row 리스트 */}
          {upcomingGames.length > 0 && (
            <div className="card" style={{ padding: 0 }}>
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
          {/* 지도 placeholder */}
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

          {/* 시설 정보 — 라벨/값 그리드 (v2 톤) */}
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

          {/* 활동 통계 (체크인/리뷰) */}
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

          {/* 코트 상세 페이지 링크 (리뷰/제보/체크인) */}
          <Link
            href={`/courts/${court.id}`}
            className="btn btn--xl"
            style={{ width: "100%", display: "inline-flex", justifyContent: "center" }}
          >
            코트 상세 보기
          </Link>
        </aside>
      </div>
    </div>
  );
}
