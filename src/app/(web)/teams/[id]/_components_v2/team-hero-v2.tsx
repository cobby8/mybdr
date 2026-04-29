import Link from "next/link";
import { TeamFollowButtonV2 } from "./team-follow-button";
import { TeamMatchRequestModalV2 } from "./team-match-request-modal";

/**
 * TeamHeroV2
 * ─────────────────────────────────────────────────────────
 * v2 시안 `TeamDetail.jsx`의 Hero 블록 재현.
 *
 * 이유(왜): 기존 히어로는 flex 기반 풀블리드 배너(220~280px)로
 * "사진처럼 느껴지는 배경"을 목표로 했다. 시안은 그 반대로
 * `border-radius:var(--radius-card)`의 **카드형 블록** 안에
 * 우상단에 거대한 tag 워터마크를 깔고, 좌측 Avatar + 중앙 메타/스탯 +
 * 우측 CTA 2개를 grid로 배치한다. 본 컴포넌트는 그 레이아웃을 그대로 따른다.
 *
 * 방법(어떻게):
 * - grid-template: `auto 1fr auto` 3열 (Avatar / 본문 / CTA)
 * - 배경: `linear-gradient(135deg, accent 0%, accent+CC 60%, var(--color-card) 140%)`
 * - tag 워터마크: `position:absolute` + `font:var(--ff-display) 900 220px` + `opacity:.12`
 * - eyebrow: `TEAM · {tag} · 창단 {founded}`
 * - 스탯 4종: 레이팅(= wins 대체) / 승 / 패 / 승률
 * - CTA 2종: 팔로우 (Phase 10-4 활성) / 매치 신청 (Phase 10-4 활성)
 *   + 운영진(팀장/부팀장/매니저) 일 때만 "팀 관리" 링크 추가 노출
 *     (P1-A에서 captain only → captain+vice+manager로 권한 확대)
 *
 * Phase 10-4 활성화:
 * - 팔로우: TeamFollowButtonV2 (낙관적 토글, POST/DELETE /api/web/teams/:id/follow)
 * - 매치 신청: TeamMatchRequestModalV2 (모달 폼, POST /api/web/teams/:id/match-request)
 *
 * DB 미지원 항목:
 * - `rating`(별도 레이팅) → wins로 대체 표시 (기존 /teams 목록과 동일 규칙)
 */

type ManagedTeam = { id: string; name: string };

type Props = {
  accent: string;
  ink: string; // accent 위 텍스트 색 (보통 #FFFFFF)
  tag: string;
  teamName: string;
  teamNameSecondary: string | null;
  foundedYear: number | null;
  // rating prop 제거 (2026-04-29) — 팀 레이팅 미구현 기능이라 표시 X.
  // 부모 page.tsx 의 rating 변수는 OverviewTabV2 등 다른 곳에서도 쓰이므로 유지.
  wins: number;
  losses: number;
  winRate: number | null;
  teamId: string;
  // P1-A: captain only → 운영진(captain/vice/manager) 으로 의미 확장.
  // 이름도 의미에 맞게 canManage 로 변경 (서버 컴포넌트에서 운영진 여부 판정).
  canManage: boolean;
  // Phase 10-4 — 팔로우 / 매치 신청 활성화에 필요한 SSR 사전 계산 props
  isLoggedIn: boolean;
  isFollowing: boolean;
  // 본인이 운영진(captain/vice/manager)인 다른 팀 목록 — 매치 신청 모달의 from_team 후보
  myManagedTeams: ManagedTeam[];
};

export function TeamHeroV2({
  accent,
  ink,
  tag,
  teamName,
  teamNameSecondary,
  foundedYear,
  wins,
  losses,
  winRate,
  teamId,
  canManage,
  isLoggedIn,
  isFollowing,
  myManagedTeams,
}: Props) {
  // 시안 그라디언트 — accent 0%, accent+CC(80% 불투명) 60%, #0B0D10 140%.
  // 이유: 시안 TeamDetail.jsx은 끝점을 #0B0D10(거의 검정)으로 고정해
  // accent → 어두운 폴딩으로 떨어지게 한다. 라이트/다크 모드 어디서나
  // 동일한 시각적 깊이가 나오도록 토큰 대신 시안의 고정 색을 사용한다.
  // (var(--color-card)로 두면 라이트 모드에서 흰색으로 끝나 그라디언트가 어색함)
  const bgGradient = `linear-gradient(135deg, ${accent} 0%, ${accent}CC 60%, #0B0D10 140%)`;

  return (
    <section
      // padding 모바일 축소 (2026-04-29) — 기존 36px 32px 고정 → 반응형
      className="relative overflow-hidden px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-9"
      style={{
        background: bgGradient,
        color: ink,
        borderRadius: "var(--radius-card)",
        marginBottom: 20,
        // 풀폭 깨짐 방지 (P0 layout fix, 2026-04-27)
        // 부모 .page wrapper가 1200px이므로 동일 폭 안전망. wrapper 누락 시에도 hero만 풀폭으로 튀지 않게.
        maxWidth: 1200,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      {/* 우상단 거대 tag 워터마크 — 시안의 시그니처 장식.
          opacity .12 로 가독성 방해 없이 브랜드 감만 남긴다.
          모바일(366px viewport)에서는 220px 워터마크가 본문 위로 올라와 글자 겹침 발생 →
          sm 이상에서만 노출 (2026-04-29 모바일 최적화) */}
      <div
        aria-hidden
        className="pointer-events-none select-none hidden sm:block"
        style={{
          position: "absolute",
          right: -20,
          top: -20,
          fontFamily: "var(--ff-display)",
          fontWeight: 900,
          fontSize: 220,
          letterSpacing: "-0.04em",
          opacity: 0.12,
          lineHeight: 0.8,
        }}
      >
        {tag}
      </div>

      {/* 본문 grid — 모바일은 세로 스택, lg부터 3열 가로.
          시안은 PC 전제라 항상 3열이지만 mybdr은 모바일 퍼스트이므로
          반응형 분기를 추가한다 (데이터/레이아웃 훼손 없음) */}
      <div
        className="relative grid gap-4 sm:gap-6 items-start lg:items-end"
        style={{
          gridTemplateColumns: "minmax(0, 1fr)",
        }}
      >
        {/* 1행 (lg미만) / 좌열 (lg+) — Avatar + 텍스트 블록을 한 줄에 */}
        <div className="flex items-start gap-3 sm:gap-6 lg:items-end">
          {/* Avatar — 모바일 64px / sm 이상 96px (2026-04-29 모바일 최적화)
              tag 이니셜 폴백. accent 위에 반투명 흰 배경(.2)으로 살짝 떠 보이게.
              ─ Avatar 박스 외부 침범 방지 (2026-04-29 fix #1):
                LUNATIC 처럼 영문 5자 이상 tag 가 64px 박스를 넘어 우측 한글 팀명과
                겹치는 문제 발견 → 컨테이너에 `overflow-hidden` 추가 + 영문 폰트
                모바일 사이즈를 clamp 로 가변(14px~22px)하여 박스 내부 여유 확보. */}
          <div
            className="flex-shrink-0 grid place-items-center w-16 h-16 sm:w-24 sm:h-24 overflow-hidden"
            style={{
              borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              color: ink,
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              // 박스 폭에 맞춰 가변 (모바일 64px → 14~16px / sm+ 96px → 22px 도달)
              fontSize: "clamp(14px, 4vw, 22px)",
              letterSpacing: "-0.02em",
              // 폭 초과 시 박스 안에서 잘림 (텍스트 자체가 박스 밖으로 나가지 않도록)
              padding: "0 4px",
              textAlign: "center",
              lineHeight: 1,
            }}
          >
            {tag}
          </div>

          <div className="min-w-0">
            {/* eyebrow — TEAM · TAG · 창단 YYYY */}
            <div
              style={{
                fontFamily: "var(--ff-display)",
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: "0.14em",
                opacity: 0.9,
                marginBottom: 10,
              }}
            >
              TEAM · {tag}
              {foundedYear ? ` · 창단 ${foundedYear}` : ""}
            </div>

            {/* 메인 팀명 — 모바일 더 작게 (2026-04-29): clamp(20px, 5vw, 42px) */}
            <h1
              className="t-display"
              style={{
                margin: 0,
                fontSize: "clamp(20px, 5vw, 42px)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
                fontFamily: "var(--ff-display)",
                fontWeight: 900,
                color: ink,
              }}
            >
              {teamName}
            </h1>
            {/* 부제(반대 언어) — 기존 page.tsx 규칙 유지 */}
            {teamNameSecondary && (
              <p
                className="mt-1"
                style={{ fontSize: 13, opacity: 0.7, color: ink }}
              >
                {teamNameSecondary}
              </p>
            )}

            {/* 스탯 3종 — 레이팅 stat 제거 (2026-04-29, PM 결정: 미구현 기능)
                숫자(22px ff-display 900) + 라벨(14px opacity .75) */}
            <div
              className="flex flex-wrap"
              style={{ gap: 22, marginTop: 18, fontSize: 14 }}
            >
              <StatInline value={wins} label="승" ink={ink} />
              <StatInline value={losses} label="패" ink={ink} />
              <StatInline
                value={winRate != null ? `${winRate}%` : "—"}
                label="승률"
                ink={ink}
              />
            </div>
          </div>
        </div>

        {/* CTA 그룹 — 모바일은 본문 아래, lg에선 우열(sticky 오른쪽 정렬).
            시안은 우측 고정이라 lg:justify-end 처리 */}
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {canManage && (
            // 운영진(팀장/부팀장/매니저) 전용 — 실제 동작 있는 유일한 버튼.
            // P1-A에서 captain only → 운영진 3종으로 권한 확장.
            <Link
              href={`/teams/${teamId}/manage`}
              aria-label="팀 관리"
              className="btn"
              style={{
                background: "rgba(255,255,255,0.16)",
                color: ink,
                borderColor: "rgba(255,255,255,0.35)",
              }}
            >
              <span className="material-symbols-outlined text-base">settings</span>
              <span className="ml-1.5">팀 관리</span>
            </Link>
          )}
          {/* Phase 10-4 활성화 — DB 신설(team_follows / team_match_requests)로 실제 동작.
              팔로우: 즉시 토글, 매치 신청: 모달 폼 (from_team 선택 + 메시지 + 선호 일시) */}
          <TeamFollowButtonV2
            teamId={teamId}
            initialFollowing={isFollowing}
            isLoggedIn={isLoggedIn}
            ink={ink}
          />
          <TeamMatchRequestModalV2
            toTeamId={teamId}
            toTeamName={teamName}
            myManagedTeams={myManagedTeams}
            isLoggedIn={isLoggedIn}
          />
        </div>
      </div>
    </section>
  );
}

// 스탯 인라인 — 숫자(22px) + 라벨(14px, opacity .75) 한 줄 묶음
function StatInline({
  value,
  label,
  ink,
}: {
  value: number | string;
  label: string;
  ink: string;
}) {
  return (
    <div style={{ color: ink }}>
      <b
        style={{
          fontSize: 22,
          fontFamily: "var(--ff-display)",
          fontWeight: 900,
        }}
      >
        {value}
      </b>
      <span style={{ opacity: 0.75, marginLeft: 4 }}>{label}</span>
    </div>
  );
}
