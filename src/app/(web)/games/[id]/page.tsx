/* ============================================================
 * 경기 상세 페이지 — BDR v2 재구성
 *
 * 왜 재작성하는가:
 * 기존 구조는 HeroBanner / PriceCard / PickupDetail·GuestDetail·TeamMatchDetail
 * / ParticipantsGrid / HostActions / HostApplications 가 각각 떨어져
 * 시안과 공간 리듬이 맞지 않고, DB의 일부 필드(contact_phone/
 * requirements/notes/allow_guests/uniform 색상)가 UI에 노출되지
 * 않는 문제가 있었다. 확정안(안 A)에 따라:
 *   - SummaryCard       : 2열 info grid + 조건부 행(duration/contact/게스트/유니폼)
 *   - AboutCard         : description + requirements + notes 흡수
 *   - ParticipantList   : 이니셜 아바타 + 닉네임/이름 + position
 *   - ApplyPanel        : 신청/취소/승인 CTA + 한마디/저장/문의(alert)
 *   - HostPanel         : 수정/취소 + 신청자 관리
 * 5개 _v2 컴포넌트로 정리. API/route.ts/Prisma/서비스 레이어 변경 0.
 *
 * 서버 컴포넌트 — getGame/listGameApplications/getWebSession/getUserGameProfile
 * 는 기존 그대로 사용. generateMetadata 로직도 유지.
 * ============================================================ */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGame, listGameApplications } from "@/lib/services/game";
import { getUserGameProfile } from "@/lib/services/user";
// Phase 10-1 B-8: 종료 경기에서 final MVP 사용자 정보와 game_reports 제출 수를
// 조회하기 위해 page 레벨에서 직접 prisma를 사용. getGame()을 수정하면 include 키가
// 다른 모든 호출처(메타데이터/리스트 등)에도 노출돼 영향 범위가 커지므로,
// 이 페이지 안에서 status===3일 때만 추가 쿼리 2개를 돌리는 방식으로 격리한다.
import { prisma } from "@/lib/db/prisma";
import { ProfileIncompleteBanner } from "./profile-banner";
import { getWebSession } from "@/lib/auth/web-session";
import { getMissingFields } from "@/lib/profile/completion";
import { Breadcrumb } from "@/components/shared/breadcrumb";
// 카페 크롤링 텍스트의 HTML 엔티티를 렌더링 시점에만 디코드.
import { decodeHtmlEntities } from "@/lib/utils/decode-html";
// 5/8 PR3 — 본인인증 미완료 사용자 페이지 진입 가드 (mock 모드 default)
import { requireIdentityForPage } from "@/lib/auth/require-identity-for-page";

// _v2: 이번 재구성에서 새로 추가한 상세 UI 컴포넌트들
import { SummaryCard } from "./_v2/summary-card";
import { AboutCard } from "./_v2/about-card";
import { ParticipantList } from "./_v2/participant-list";
import { ApplyPanel } from "./_v2/apply-panel";
import { HostPanel } from "./_v2/host-panel";

export const revalidate = 30;

// SEO: 경기 상세 동적 메타데이터 — 기존 로직 100% 유지
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(id);
  if (!game) return { title: "경기 상세 | MyBDR" };

  // SEO 메타 디코드 — SNS/검색엔진에 노출되는 title/description에서 &amp; 등 방지
  const decodedTitle = decodeHtmlEntities(game.title) || "경기 상세";
  const decodedDesc =
    decodeHtmlEntities(game.description)?.slice(0, 100) ||
    "경기 상세 정보를 확인하고 참가 신청하세요.";

  const title = `${decodedTitle} | MyBDR`;

  return {
    title,
    description: decodedDesc,
    openGraph: {
      title: decodedTitle,
      description: decodedDesc,
      type: "website",
      url: `https://mybdr.kr/games/${id}`,
    },
    twitter: {
      card: "summary",
      title: decodedTitle,
      description: decodedDesc,
    },
  };
}

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // 5/8 PR3 — 본인인증 미완료 사용자 강제 redirect (mock 모드 default).
  //   PortOne 채널 키 환경변수 미설정 시 noop → 운영 영향 0.
  //   활성 시 미인증 로그인 사용자만 /onboarding/identity 로 즉시 redirect (returnTo 보존).
  await requireIdentityForPage(`/games/${id}`);

  // Phase 1: 경기 조회 + 세션 확인 병렬 (기존 로직 100% 유지)
  const [game, session] = await Promise.all([getGame(id), getWebSession()]);
  if (!game) return notFound();

  // Phase 2: 유저 프로필 + 신청자 목록 병렬 (기존 로직 100% 유지)
  const [userRecord, applications] = await Promise.all([
    session ? getUserGameProfile(BigInt(session.sub)) : Promise.resolve(null),
    listGameApplications(game.id).catch(() => []),
  ]);

  const isHost = session ? game.organizer_id === BigInt(session.sub) : false;
  // 로그인 유저의 신청 여부 (status: 0=대기, 1=승인, 2=거절)
  const myApplication = session
    ? applications.find((a) => a.user_id === BigInt(session.sub))
    : null;

  // 프로필 완성 여부 판단 (기존 로직 100% 유지)
  let missingFields: string[] = [];
  let profileCompleted = true;
  let showProfileBanner = false;

  if (session && userRecord) {
    missingFields = getMissingFields({
      name: userRecord.name,
      nickname: userRecord.nickname,
      phone: userRecord.phone,
      position: userRecord.position,
      city: userRecord.city,
    });
    profileCompleted = missingFields.length === 0;

    if (!profileCompleted) {
      const now = new Date(
        new Date().toLocaleString("en-US", { timeZone: "Asia/Seoul" })
      );
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      showProfileBanner =
        !userRecord.profileReminderShownAt ||
        userRecord.profileReminderShownAt < todayStart;
    }
  }

  // 승인된 참가자 목록 — position + skill_level 필드 전달 (ParticipantList 시안 정합).
  // Phase C (2026-05-02): skill_level 추가 → 시안의 "L.5 · 가드" 메타 노출용.
  const approvedParticipants = applications
    .filter((a) => a.status === 1)
    .map((a) => ({
      id: a.id.toString(),
      nickname: a.users?.nickname ?? null,
      name: a.users?.name ?? null,
      position: a.users?.position ?? null,
      // users.skill_level 은 string|null. 빈 문자열·null 인 경우 ParticipantRow 측에서 미노출
      skill_level: a.users?.skill_level ?? null,
    }));

  // 호스트 전용 신청자 배열
  // Phase 10-3 B-7: 게스트 신청 라벨링 — is_guest=true 일 때 신청서에 입력된
  //   position(G/F/C) / experience_years(0~4) / message 를 우선 노출.
  //   회원 프로필 position 은 게스트가 아닌 경우의 fallback 으로만 사용.
  const hostApplicants = applications.map((a) => ({
    id: a.id.toString(),
    status: a.status,
    nickname: a.users?.nickname ?? null,
    name: a.users?.name ?? null,
    phone: a.users?.phone ?? null,
    // 신청서 position(G/F/C) 우선, 없으면 회원 프로필 position
    position: a.position ?? a.users?.position ?? null,
    city: a.users?.city ?? null,
    district: a.users?.district ?? null,
    // 게스트 라벨링용 필드
    is_guest: a.is_guest ?? false,
    experience_years: a.experience_years ?? null,
    message: a.message ?? null,
  }));

  // AboutCard 렌더 판단 — 3 필드 중 하나라도 있을 때만
  const hasAboutContent = Boolean(
    game.description || game.requirements || game.notes
  );

  /* ----------------------------------------------------------------
   * Phase 10-1 B-8 — 종료된 경기에서 MVP 배지 + 평가 진행 상태 노출
   *
   * 왜 status===3일 때만 조회하는가:
   *   완료되지 않은 경기에서는 final_mvp_user_id 가 없고 game_reports 도
   *   유의미하게 쌓이지 않아 매번 추가 쿼리를 돌리면 비용 낭비. 종료된
   *   경기에서만 조건부로 두 개의 가벼운 쿼리(findUnique + count)를 돌린다.
   *
   * 왜 page에서 직접 prisma를 호출하는가:
   *   getGame()은 메타데이터/리스트 등 다른 호출처에서 공유되어 include 추가
   *   비용이 크다. 이 한 페이지의 추가 노출만을 위해 공용 fetcher를 변경하지
   *   않고 격리.
   * -------------------------------------------------------------- */
  let finalMvp: {
    id: bigint;
    nickname: string | null;
    name: string | null;
  } | null = null;
  let reportCount = 0;
  // 호스트 + 승인된 신청자 수 (status===1 만 카운트). 평가 모집단의 정의.
  const participantCount = approvedParticipants.length + 1; // 호스트 포함

  if (game.status === 3) {
    // MVP 사용자 정보 — final_mvp_user_id 가 세팅된 경우에만 조회
    const mvpId = game.final_mvp_user_id;
    const [mvpUser, submittedCount] = await Promise.all([
      mvpId
        ? prisma.user
            .findUnique({
              where: { id: mvpId },
              select: { id: true, nickname: true, name: true },
            })
            .catch(() => null)
        : Promise.resolve(null),
      prisma.game_reports
        .count({
          where: { game_id: game.id, status: "submitted" },
        })
        .catch(() => 0),
    ]);
    finalMvp = mvpUser;
    reportCount = submittedCount;
  }

  // 카페 댓글 (기존 유지)
  const meta = game.metadata as Record<string, unknown> | null;
  const cafeComments = (Array.isArray(meta?.cafe_comments)
    ? meta!.cafe_comments
    : []) as Array<{
    nickname: string;
    text: string;
    date: string;
    is_reply: boolean;
  }>;

  return (
    // .page 셸 — v2 전체에서 공통 사용하는 max-width + 중앙정렬 + 상하여백
    <div className="page">
      {/* 브레드크럼 — 모바일에선 숨김(컴포넌트 내부 처리) */}
      <Breadcrumb
        items={[
          { label: "경기", href: "/games" },
          { label: decodeHtmlEntities(game.title) || "경기 상세" },
        ]}
      />

      {/* 프로필 미완성 안내 배너 (1일 1회, 기존 로직 유지) */}
      {showProfileBanner && <ProfileIncompleteBanner />}

      {/* 2컬럼 그리드 — 데스크톱: 1fr + 340px 사이드, 모바일: 단일 컬럼 스택.
       * CSS 변수 없이 인라인으로 관리(페이지 1곳에서만 사용). */}
      <div
        style={{
          display: "grid",
          gap: 18,
          gridTemplateColumns: "minmax(0, 1fr)",
          marginTop: 14,
        }}
      >
        {/* 모바일/PC 공통: 좌측 메인 스택 + 우측 신청 패널.
         * 간결한 반응형을 위해 className 대신 중첩 grid 2개 사용. */}
        <div
          style={{
            display: "grid",
            gap: 18,
            // 768px 이상에서만 2열 — Tailwind lg 와 유사한 효과를 미디어쿼리 대신
            // CSS grid auto-fit 으로 단순화할 수도 있지만, 우측 고정 340px가 필요해
            // className="game-detail-grid" 도입 대신 inline + global 그리드 쿼리
            // 생략. 대신 기존 페이지 전체에서 써온 tailwind lg:grid-cols 패턴 적용.
          }}
          className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-5"
        >
          {/* 좌측 메인 스택 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Phase 10-1 B-8 — 종료된 경기 hero 띠: MVP 배지 + 평가 진행 상태.
             * SummaryCard 위에 한 줄짜리 카드로 띄워 종료된 경기의 결과 요약을
             * 가장 먼저 인지할 수 있도록 한다. status===3 (완료) 일 때만 노출. */}
            {game.status === 3 && (
              <section
                className="card"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                  padding: "12px 16px",
                }}
              >
                {/* MVP 배지 — final_mvp_user_id 가 확정된 경우에만 강조 색으로 노출.
                 * 미확정인 경우엔 "아직 확정 전" 보조 라벨을 보여 운영 흐름을 암시. */}
                {finalMvp ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 4,
                      background: "var(--accent)",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 13,
                      lineHeight: 1.2,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18 }}
                      aria-hidden
                    >
                      military_tech
                    </span>
                    MVP · {finalMvp.nickname || finalMvp.name || "익명"}
                  </span>
                ) : (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 12px",
                      borderRadius: 4,
                      background: "var(--surface-2)",
                      color: "var(--ink-mute)",
                      fontWeight: 600,
                      fontSize: 13,
                      lineHeight: 1.2,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 18 }}
                      aria-hidden
                    >
                      military_tech
                    </span>
                    MVP 확정 전
                  </span>
                )}

                {/* 평가 진행 상태 — 제출된 game_reports 수 / 모집단 수.
                 * 모집단은 호스트 + 승인된 참가자(status===1) 수로 정의. */}
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 4,
                    fontSize: 13,
                    color: "var(--ink-mute)",
                    fontFamily: "var(--ff-mono)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, color: "var(--ink-dim)" }}
                    aria-hidden
                  >
                    rate_review
                  </span>
                  {reportCount}/{participantCount}명 평가 완료
                </span>
              </section>
            )}

            {/* 1. SummaryCard — 타이틀/배지/info grid/진행바 */}
            <SummaryCard game={game} />

            {/* 2. AboutCard — description/requirements/notes (있을 때만) */}
            {hasAboutContent && (
              <AboutCard
                description={game.description}
                requirements={game.requirements}
                notes={game.notes}
              />
            )}

            {/* 3. 호스트 패널(호스트만) 또는 참가자 리스트(그 외) */}
            {isHost ? (
              <HostPanel
                gameId={id}
                applicants={hostApplicants}
                maxParticipants={game.max_participants}
              />
            ) : (
              <ParticipantList
                participants={approvedParticipants}
                maxParticipants={game.max_participants}
              />
            )}

            {/* 4. 카페 댓글 — 기존 디자인 유지(요청: 유지) */}
            {cafeComments.length > 0 && (
              <section
                className="card"
                style={{ padding: 0, overflow: "hidden" }}
              >
                <div
                  style={{
                    padding: "14px 20px",
                    borderBottom: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 15, color: "var(--ink)" }}>
                    댓글
                  </span>
                  <span
                    style={{
                      fontFamily: "var(--ff-mono)",
                      fontWeight: 700,
                      color: "var(--cafe-blue)",
                    }}
                  >
                    {cafeComments.length}
                  </span>
                </div>
                <div style={{ padding: "14px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
                  {cafeComments.map((c, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        gap: 10,
                        // 대댓글은 좌측 들여쓰기 + 좌측 테두리
                        marginLeft: c.is_reply ? 32 : 0,
                        paddingLeft: c.is_reply ? 12 : 0,
                        borderLeft: c.is_reply ? "2px solid var(--border)" : "none",
                      }}
                    >
                      <div
                        aria-hidden
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: "50%",
                          flexShrink: 0,
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 12,
                          fontWeight: 700,
                          color: "#fff",
                          background: c.is_reply ? "var(--ink-dim)" : "var(--cafe-blue)",
                        }}
                      >
                        {(c.nickname || "?").charAt(0)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            marginBottom: 2,
                          }}
                        >
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: "var(--ink)",
                            }}
                          >
                            {c.nickname || "익명"}
                          </span>
                          {c.date && (
                            <span
                              style={{
                                fontSize: 11,
                                color: "var(--ink-dim)",
                                fontFamily: "var(--ff-mono)",
                              }}
                            >
                              {c.date}
                            </span>
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            color: "var(--ink-mute)",
                            lineHeight: 1.55,
                            margin: 0,
                            whiteSpace: "pre-wrap",
                          }}
                        >
                          {c.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 5. 하단 이동 버튼 — 다른 경기 / 내 경기 + 조건부 진입점(평가/게스트 지원)
             *
             * 왜 여기에 진입점을 두는가:
             * v2 ApplyPanel(우측)은 신청 흐름에 응집된 패널이라 props 추가는 응집도를
             * 깬다. 좌측 하단의 이동 버튼 행은 이미 보조 액션을 모아둔 자연스러운
             * 진입점 영역이라 여기에 조건부 CTA 2개를 추가한다.
             * - "경기 평가": 완료된 경기(status===3)일 때 노출. 클릭 후 상세 권한
             *   가드는 /games/[id]/report 페이지가 처리.
             * - "게스트 지원": GUEST 유형(game_type===1)이고 호스트가 아닐 때 노출.
             *   클릭 후 모집중/마감 등 디테일 가드는 /games/[id]/guest-apply 처리. */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
              <Link
                href="/games"
                className="btn btn--sm"
                style={{ textDecoration: "none" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: 16, marginRight: 4 }}
                >
                  sports_basketball
                </span>
                다른 경기 보기
              </Link>
              {session && (
                <Link
                  href="/games/my-games"
                  className="btn btn--sm"
                  style={{ textDecoration: "none" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, marginRight: 4 }}
                  >
                    assignment
                  </span>
                  내 경기 보기
                </Link>
              )}

              {/* 경기 평가 진입점 — 완료된 경기일 때만 노출 (status===3=완료, STATUS_LABEL 기준) */}
              {game.status === 3 && (
                <Link
                  href={`/games/${id}/report`}
                  className="btn btn--sm"
                  style={{ textDecoration: "none" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, marginRight: 4 }}
                  >
                    rate_review
                  </span>
                  경기 평가
                </Link>
              )}

              {/* 게스트 지원 진입점 — GUEST 유형(game_type===1) + 본인이 호스트가 아닐 때만 노출.
               * 모집 마감/취소 여부는 진입한 페이지 측에서 처리하므로 여기서는 유형만으로 노출 판단. */}
              {game.game_type === 1 && !isHost && (
                <Link
                  href={`/games/${id}/guest-apply`}
                  className="btn btn--sm btn--primary"
                  style={{ textDecoration: "none" }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, marginRight: 4 }}
                  >
                    person_add
                  </span>
                  게스트 지원
                </Link>
              )}
            </div>
          </div>

          {/* 우측 사이드 — ApplyPanel (lg 이상에서 340px 고정, 모바일에선 스택 아래) */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <ApplyPanel
              gameId={id}
              gameStatus={game.status}
              feePerPerson={game.fee_per_person}
              entryFeeNote={game.entry_fee_note}
              maxParticipants={game.max_participants}
              currentParticipants={game.current_participants}
              isLoggedIn={Boolean(session)}
              isHost={isHost}
              myApplicationStatus={myApplication ? myApplication.status : null}
              profileCompleted={profileCompleted}
              missingFields={missingFields}
              // Phase C (2026-05-02): 신청자 정보 카드 노출용. userRecord 없으면 (비로그인) null.
              // 시안 결정 4 = A: skill_level select 1줄 추가, 그 외 정보는 user 자동.
              myProfile={
                userRecord
                  ? {
                      nickname: userRecord.nickname,
                      name: userRecord.name,
                      position: userRecord.position,
                      skill_level: userRecord.skill_level,
                    }
                  : null
              }
            />
          </div>
        </div>
      </div>
    </div>
  );
}
