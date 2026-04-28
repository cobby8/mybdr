import Link from "next/link";

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
 * - CTA 2종: 팔로우 (disabled, 준비 중) / 매치 신청 (disabled, 준비 중)
 *   + 운영진(팀장/부팀장/매니저) 일 때만 "팀 관리" 링크 추가 노출
 *     (P1-A에서 captain only → captain+vice+manager로 권한 확대)
 *
 * DB 미지원 항목:
 * - `rating`(별도 레이팅) → wins로 대체 표시 (기존 /teams 목록과 동일 규칙)
 * - 팔로우 기능 → UI만, disabled + title="준비 중"
 * - 매치 신청 → UI만, disabled + title="준비 중"
 */

type Props = {
  accent: string;
  ink: string; // accent 위 텍스트 색 (보통 #FFFFFF)
  tag: string;
  teamName: string;
  teamNameSecondary: string | null;
  foundedYear: number | null;
  rating: number;
  wins: number;
  losses: number;
  winRate: number | null;
  teamId: string;
  // P1-A: captain only → 운영진(captain/vice/manager) 으로 의미 확장.
  // 이름도 의미에 맞게 canManage 로 변경 (서버 컴포넌트에서 운영진 여부 판정).
  canManage: boolean;
};

export function TeamHeroV2({
  accent,
  ink,
  tag,
  teamName,
  teamNameSecondary,
  foundedYear,
  rating,
  wins,
  losses,
  winRate,
  teamId,
  canManage,
}: Props) {
  // 시안 그라디언트 — accent 0%, accent+CC(80% 불투명) 60%, #0B0D10 140%.
  // 이유: 시안 TeamDetail.jsx은 끝점을 #0B0D10(거의 검정)으로 고정해
  // accent → 어두운 폴딩으로 떨어지게 한다. 라이트/다크 모드 어디서나
  // 동일한 시각적 깊이가 나오도록 토큰 대신 시안의 고정 색을 사용한다.
  // (var(--color-card)로 두면 라이트 모드에서 흰색으로 끝나 그라디언트가 어색함)
  const bgGradient = `linear-gradient(135deg, ${accent} 0%, ${accent}CC 60%, #0B0D10 140%)`;

  return (
    <section
      className="relative overflow-hidden"
      style={{
        background: bgGradient,
        color: ink,
        borderRadius: "var(--radius-card)",
        padding: "36px 32px",
        marginBottom: 20,
      }}
    >
      {/* 우상단 거대 tag 워터마크 — 시안의 시그니처 장식.
          opacity .12 로 가독성 방해 없이 브랜드 감만 남긴다. */}
      <div
        aria-hidden
        className="pointer-events-none select-none"
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
        <div className="flex items-start gap-4 sm:gap-6 lg:items-end">
          {/* Avatar — 96px / radius 12 / tag 이니셜 폴백.
              accent 위에 반투명 흰 배경(.2)으로 살짝 떠 보이게. */}
          <div
            className="flex-shrink-0 grid place-items-center"
            style={{
              width: 96,
              height: 96,
              borderRadius: 12,
              background: "rgba(255,255,255,0.2)",
              color: ink,
              fontFamily: "var(--ff-display)",
              fontWeight: 900,
              fontSize: 28,
              letterSpacing: "-0.02em",
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

            {/* 메인 팀명 — 시안 52px. 모바일 32px / sm 42px / lg 52px 점진 확대 */}
            <h1
              className="t-display"
              style={{
                margin: 0,
                fontSize: "clamp(28px, 6vw, 52px)",
                lineHeight: 1,
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

            {/* 스탯 4종 — 시안 그대로: 숫자(22px ff-display 900) + 라벨(14px opacity .75) */}
            <div
              className="flex flex-wrap"
              style={{ gap: 22, marginTop: 18, fontSize: 14 }}
            >
              <StatInline value={rating} label="레이팅" ink={ink} />
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
          {/*
            DB 미구현 — Phase 10 백로그 (Dev/design/phase-9-future-features.md 5-2)
            아래 두 버튼(팔로우 / 매치 신청)은 PM 정책에 따라 메뉴/UI에서 숨김.
            - 팔로우: team_follows 테이블 추가 필요
            - 매치 신청: team_match_requests 테이블 추가 필요
            DB 구현 후 주석 해제 한 줄로 복귀.

            <button
              type="button"
              disabled
              aria-disabled="true"
              title="준비 중인 기능입니다"
              className="btn"
              style={{
                background: "rgba(255,255,255,0.16)",
                color: ink,
                borderColor: "rgba(255,255,255,0.35)",
                opacity: 0.7,
                cursor: "not-allowed",
              }}
            >
              팔로우
            </button>
            <button
              type="button"
              disabled
              aria-disabled="true"
              title="준비 중인 기능입니다"
              className="btn btn--accent"
              style={{ opacity: 0.7, cursor: "not-allowed" }}
            >
              매치 신청
            </button>
          */}
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
