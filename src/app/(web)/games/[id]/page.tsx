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
// [v2.16 Phase 3-1c fix] super_admin 판정 — admin 계정은 "내가 호스트" 대신 "관리자 view" 표시
import { isSuperAdmin } from "@/lib/auth/is-super-admin";
// 5/9 displayName P0 — 공식 기록(MVP 시상) 실명 우선 헬퍼
import { getDisplayName } from "@/lib/utils/player-display-name";
// 4단계 A — MVP 시상 / 호스트 / 참가자 / 신청자 닉네임 → 공개프로필 PlayerLink
import { PlayerLink } from "@/components/links/player-link";

// _v2: 이번 재구성에서 새로 추가한 상세 UI 컴포넌트들
import { SummaryCard } from "./_v2/summary-card";
import { AboutCard } from "./_v2/about-card";
import { ParticipantList } from "./_v2/participant-list";
import { ApplyPanel } from "./_v2/apply-panel";
import { HostPanel } from "./_v2/host-panel";
// [v2.16 Phase 3-1a] 풀폭 다크 hero band — 사용자 결정 §11 V2 Hero-led
import { GameDetailHero } from "./_v2/game-detail-hero";
// [v2.16 Phase 3-1b] Concept B 10인 슬롯 보드 — 사용자 결정 §11 Concept B
import {
  ParticipantsSlotBoard,
  type SlotMember,
} from "./_v2/participants-slot-board";
// [v2.16 Phase 3-1c] ApplyRibbon (hero 아래 빠른 액션) + MobileStickyBar (모바일 하단 fixed)
import { ApplyRibbon } from "./_v2/apply-ribbon";
import { MobileStickyBar } from "./_v2/mobile-sticky-bar";
// [Phase 2C · UA2 BG1] 내 신청 진행 단계 인디케이터 — 본인 신청 상태(0/1/2)를
// [신청 완료 → 호스트 승인 → 참가 확정] 3단계로 시각화. 미신청(null)은 미렌더(mock 금지).
import { ApplyStep } from "./_v2/apply-step";

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

  // Phase 2: 유저 프로필 + 신청자 목록 + 호스트(organizer) 정보 병렬
  // [v2.16 Phase 3-1b] organizer 추가 — Concept B 슬롯 보드의 첫 슬롯에 호스트 노출
  const [userRecord, applications, organizer] = await Promise.all([
    session ? getUserGameProfile(BigInt(session.sub)) : Promise.resolve(null),
    listGameApplications(game.id).catch(() => []),
    prisma.user
      .findUnique({
        where: { id: game.organizer_id },
        select: {
          id: true,
          nickname: true,
          name: true,
          position: true,
          skill_level: true,
        },
      })
      .catch(() => null),
  ]);

  const isHost = session ? game.organizer_id === BigInt(session.sub) : false;
  // [v2.16 Phase 3-1c fix] admin 계정은 카페 크롤링 게임의 organizer 가 모두 admin master(id=1) 라서
  // 모든 게임에서 isHost=true 가 됨 → "내가 호스트" 라벨이 부적절. admin 은 별도 "관리자 view" 분기.
  const isAdmin = isSuperAdmin(session);
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
  // 4단계 A: PlayerLink 라우팅용 user_id 전달 (placeholder/게스트는 user_id null → span fallback).
  const approvedParticipants = applications
    .filter((a) => a.status === 1)
    .map((a) => ({
      id: a.id.toString(),
      // 4단계 A: BigInt → string 직렬화 (클라 컴포넌트 props 직렬화 제약)
      user_id: a.user_id != null ? a.user_id.toString() : null,
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
    // 4단계 A: 신청자 닉네임 클릭 → 공개프로필 PlayerLink 라우팅용 (BigInt → string 직렬화)
    user_id: a.user_id != null ? a.user_id.toString() : null,
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

      {/* [v2.16 Phase 3-1a] 풀폭 다크 hero band — 종별 + status + countdown + meta + progress
       * 사용자 결정 §11 V2 (Hero-led). 박제 source: BDR-current/screens-gd/ConceptB.jsx */}
      <GameDetailHero
        gameType={game.game_type}
        status={game.status}
        title={game.title}
        venueName={game.venue_name}
        areaLabel={[game.city, game.district].filter(Boolean).join(" ")}
        scheduledAt={game.scheduled_at}
        durationHours={game.duration_hours ?? null}
        feePerPerson={game.fee_per_person ?? null}
        skillLevel={game.skill_level}
        allowGuests={game.allow_guests ?? false}
        maxParticipants={game.max_participants ?? 10}
        minParticipants={game.min_participants ?? 4}
        currentParticipants={game.current_participants ?? 0}
      />

      {/* [v2.16 Phase 3-1c] Hero 바로 아래 ApplyRibbon — 정원 progress + 호스트 + 신청 CTA */}
      <ApplyRibbon
        gameType={game.game_type}
        gameStatus={game.status}
        maxParticipants={game.max_participants ?? 10}
        currentParticipants={game.current_participants ?? 0}
        organizer={organizer}
        isLoggedIn={Boolean(session)}
        isHost={isHost}
        isAdmin={isAdmin}
        myApplicationStatus={myApplication ? myApplication.status : null}
        applyAnchorId="apply-panel"
      />

      {/* [v2.16 Phase 3-1c] V2 단일 칼럼 본문 — 2-col grid → 1-col 변경
       * 사유: 사용자 결정 §11 V2 Hero-led / 작업지시서 §3-1
       * 우측 sticky ApplyPanel → 본문 하단 (SlotBoard 아래) 이동 */}
      <div style={{ marginTop: 16 }}>
        <div>
          {/* 단일 컬럼 메인 스택 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* ============================================================
             * [Phase 2C · UB1 BG4] 종료 경기 결과 hero (GameResult.jsx 박제)
             *
             * 왜 기존 한 줄 띠를 hero 카드로 격상하는가:
             *   시안 UB1(GameResult)은 종료된 경기를 "결과 발표" 톤으로 가장 먼저
             *   인지시키는 화면이다. 기존 Phase 10-1 의 한 줄짜리 MVP 배지 띠를
             *   시안 gr-hero 구조(🏆 트로피 + 결과 발표 태그 + MVP 큰 강조 +
             *   종료 일시 + 평가 진행 상태)로 끌어올린다.
             *
             * ⚠️ mock 금지 — 운영 데이터에 없는 요소는 박제하지 않는다:
             *   - 스코어(home:away 점수): games 모델에 점수 컬럼 없음 → 미표시
             *   - 우승/준우승 팀: 픽업 games 에 팀/우승 개념 없음(2C-2 동일 결론) → 미표시
             *   - Best 3 개인 스탯: 개인 득점 데이터 없음 → 미표시
             *   - 호스트 한마디: games 에 호스트 종료 메시지 컬럼 없음 → 미표시
             *   → 시안 4카드 중 운영 데이터로 채울 수 있는 MVP + 평가 진행만 hero 로 박제.
             *
             * 데이터: 기존 finalMvp(L239~) / reportCount / participantCount 재사용.
             *   final_mvp_user_id 는 UA1(2C-2, game.ts)·UA5 종료 카드와 동일 소스.
             *   새 쿼리 0. status===3(완료) 일 때만 노출. */}
            {game.status === 3 && (
              <section
                className="card"
                style={{
                  padding: 0,
                  overflow: "hidden",
                }}
              >
                {/* 상단 밴드 — "🏆 결과 발표" 태그 + 종료 일시(ended_at 있을 때만) */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    background: "var(--surface-2)",
                    borderBottom: "1px solid var(--border)",
                  }}
                >
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 4,
                      fontSize: 12,
                      fontWeight: 800,
                      color: "var(--accent)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {/* 🏆 = 유니코드 이모지 — 시안 gr-hero__tag 동일 (색상 토큰 룰 무관) */}
                    <span aria-hidden="true">🏆</span>
                    결과 발표
                  </span>
                  {/* ended_at 있을 때만 종료 일시 — 없으면 라인 자체를 숨김(mock 금지).
                   * KST 기준 "YYYY.M.D 종료" 한 줄. */}
                  {game.ended_at && (
                    <span
                      style={{
                        marginLeft: "auto",
                        fontSize: 12,
                        color: "var(--ink-dim)",
                        fontFamily: "var(--ff-mono)",
                      }}
                    >
                      {new Date(game.ended_at).toLocaleDateString("ko-KR", {
                        timeZone: "Asia/Seoul",
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}{" "}
                      종료
                    </span>
                  )}
                </div>

                {/* 본문 — MVP 큰 강조(시안 gr-hero__mvp) + 평가 진행 상태 */}
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 16,
                    padding: "16px 20px",
                  }}
                >
                  {/* MVP 강조 — final_mvp_user_id 가 확정된 경우 트로피 + 이름 크게.
                   * 미확정인 경우엔 "아직 확정 전" 보조 라벨로 운영 흐름을 암시. */}
                  {finalMvp ? (
                    // 4단계 A: MVP 시상 PlayerLink — 텍스트 색 inherit, hover underline.
                    <PlayerLink
                      userId={finalMvp.id}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 12,
                        textDecoration: "none",
                        color: "var(--ink)",
                        minWidth: 0,
                      }}
                    >
                      {/* 트로피 원형 메달 — 정사각(W=H) 이므로 50% 라운딩 허용(토큰 룰 예외). */}
                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          flexShrink: 0,
                          fontSize: 24,
                          background: "var(--accent)",
                          color: "#fff",
                        }}
                      >
                        🏆
                      </span>
                      <span style={{ minWidth: 0 }}>
                        {/* MVP 라벨 — gr-hero__mvp-lbl */}
                        <span
                          style={{
                            display: "block",
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--accent)",
                            fontFamily: "var(--ff-mono)",
                          }}
                        >
                          MVP
                        </span>
                        {/* MVP 이름 크게 — 시안 gr-hero__mvp-name (Pretendard 900 톤).
                         * 5/9 displayName P0 — 공식 기록(시상)은 실명 우선. */}
                        <span
                          style={{
                            display: "block",
                            fontSize: 22,
                            fontWeight: 900,
                            color: "var(--ink)",
                            lineHeight: 1.2,
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {getDisplayName(finalMvp, undefined, "익명")}
                        </span>
                      </span>
                    </PlayerLink>
                  ) : (
                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 12,
                        color: "var(--ink-mute)",
                        minWidth: 0,
                      }}
                    >
                      <span
                        aria-hidden="true"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          width: 48,
                          height: 48,
                          borderRadius: "50%",
                          flexShrink: 0,
                          background: "var(--surface-2)",
                          border: "1px solid var(--border)",
                        }}
                      >
                        <span
                          className="material-symbols-outlined"
                          style={{ fontSize: 24, color: "var(--ink-dim)" }}
                        >
                          military_tech
                        </span>
                      </span>
                      <span style={{ minWidth: 0 }}>
                        <span
                          style={{
                            display: "block",
                            fontSize: 11,
                            fontWeight: 800,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            color: "var(--ink-dim)",
                            fontFamily: "var(--ff-mono)",
                          }}
                        >
                          MVP
                        </span>
                        <span
                          style={{
                            display: "block",
                            fontSize: 16,
                            fontWeight: 700,
                            color: "var(--ink-mute)",
                            lineHeight: 1.2,
                          }}
                        >
                          아직 확정 전
                        </span>
                      </span>
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
                </div>
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

            {/* 3. 호스트 패널(호스트만) 또는 참가자 리스트(그 외)
             * [v2.16 Phase 3-1b] 비호스트 → ParticipantsSlotBoard (Concept B 10인 슬롯 보드)
             * 호스트 자신은 HostPanel 그대로 (관리 액션). 추후 PR 에서 호스트도 슬롯 보드 +
             * HostPanel 병기 가능 (단, 화면 길이 증가). 이번 PR 은 보수적 교체. */}
            {isHost ? (
              <HostPanel
                gameId={id}
                applicants={hostApplicants}
                maxParticipants={game.max_participants}
              />
            ) : (
              <ParticipantsSlotBoard
                spotsTotal={game.max_participants ?? 10}
                gameType={game.game_type}
                applyAnchorId="apply-panel"
                members={(() => {
                  // [v2.16] 호스트(organizer) + 승인된 신청자 — 슬롯 1 = 호스트
                  const list: SlotMember[] = [];
                  if (organizer) {
                    list.push({
                      user_id: organizer.id.toString(),
                      nickname: organizer.nickname,
                      name: organizer.name,
                      position: organizer.position,
                      skill_level: organizer.skill_level,
                      isHost: true,
                    });
                  }
                  approvedParticipants.forEach((p) => {
                    list.push({
                      user_id: p.user_id,
                      nickname: p.nickname,
                      name: p.name,
                      position: p.position,
                      skill_level: p.skill_level,
                      isHost: false,
                    });
                  });
                  return list;
                })()}
              />
            )}

            {/* [Phase 2C · UA2 BG1] 내 신청 현황 — 본인이 이미 신청한 경우만 노출.
             * 시안 GameDetail.jsx BG1 sidebar "내 신청 현황" step indicator 박제.
             * 운영은 단일 칼럼이라 sidebar 대신 ApplyPanel 바로 위 카드로 배치.
             * 데이터: 기존 myApplication(이미 본인 것만 안전 추출 — IDOR 안전) 재사용.
             * 새 조회 0. 미신청(myApplication=null)이면 렌더 자체를 건너뜀 → mock 금지 준수.
             * status 매핑(0/1/2)은 my-games/activity(2C-3)/apply-panel 과 동일 단일 진실. */}
            {myApplication && !isHost && (
              <section className="card" style={{ padding: "16px 20px" }}>
                <h3
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    margin: "0 0 14px",
                    fontSize: 14,
                    fontWeight: 800,
                    color: "var(--ink)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 18, color: "var(--accent)" }}
                    aria-hidden
                  >
                    where_to_vote
                  </span>
                  내 신청 현황
                </h3>

                {/* 3단계 step indicator — created_at/approved_at/rejected_at 전달.
                 * 이 값들은 listGameApplications(findMany, select 없음)가 전체 컬럼을
                 * 반환하므로 추가 조회 없이 myApplication 에서 그대로 사용 가능. */}
                <ApplyStep
                  status={myApplication.status}
                  appliedAt={myApplication.created_at}
                  approvedAt={myApplication.approved_at}
                  rejectedAt={myApplication.rejected_at}
                />

                {/* 상태별 한 줄 안내 + 마이페이지 딥링크 (시안 gd-mine__note/__link 정합) */}
                <div
                  style={{
                    marginTop: 14,
                    paddingTop: 12,
                    borderTop: "1px solid var(--border)",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 12,
                    color: "var(--ink-dim)",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16 }}
                    aria-hidden
                  >
                    {myApplication.status === 1
                      ? "check_circle"
                      : myApplication.status === 2
                        ? "info"
                        : "schedule"}
                  </span>
                  <span>
                    {myApplication.status === 1
                      ? "참가가 확정되었습니다. 경기 시간에 맞춰 방문해 주세요."
                      : myApplication.status === 2
                        ? "이번 신청은 거절되었습니다. 다른 경기를 찾아보세요."
                        : "호스트 승인 대기 중 — 결과는 알림으로 알려드립니다."}
                  </span>
                </div>
                <Link
                  href="/games/my-games"
                  className="btn btn--sm"
                  style={{
                    marginTop: 10,
                    textDecoration: "none",
                    width: "100%",
                    justifyContent: "center",
                  }}
                >
                  내 경기에서 모든 신청 보기
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 16, marginLeft: 4 }}
                  >
                    arrow_forward
                  </span>
                </Link>
              </section>
            )}

            {/* [v2.16 Phase 3-1c] ApplyPanel — V2 단일 칼럼 본문 안으로 이동 (이전 우측 sticky).
             * id="apply-panel" 유지 — Ribbon CTA / SlotBoard 빈 슬롯 anchor 타겟. */}
            {/* M2 wave2: ApplyPanel 에 대기열 분기용 필드 전달 — 내 신청의 대기 순번 /
             * 승격 마감 / 신청 id. IDOR 안전: myApplication 은 이미 본인 것만 추출됨(L143~145).
             * BigInt id → string, Date → ISO 문자열(클라 컴포넌트 직렬화 제약). */}
            <div id="apply-panel" style={{ scrollMarginTop: 80 }}>
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
                myApplicationId={myApplication ? myApplication.id.toString() : null}
                waitlistPosition={myApplication?.waitlist_position ?? null}
                promotionDeadline={
                  myApplication?.promotion_deadline
                    ? new Date(myApplication.promotion_deadline).toISOString()
                    : null
                }
                profileCompleted={profileCompleted}
                missingFields={missingFields}
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

        </div>
      </div>

      {/* [v2.16 Phase 3-1c] 모바일 하단 fixed sticky bar — ≤720px 만 표시
       * 정원 + 신청 CTA (44px 터치). #apply-panel anchor scroll. */}
      <MobileStickyBar
        gameType={game.game_type}
        gameStatus={game.status}
        maxParticipants={game.max_participants ?? 10}
        currentParticipants={game.current_participants ?? 0}
        isLoggedIn={Boolean(session)}
        isHost={isHost}
        isAdmin={isAdmin}
        myApplicationStatus={myApplication ? myApplication.status : null}
        applyAnchorId="apply-panel"
      />
    </div>
  );
}
