/* ============================================================
 * /stats — 시즌 스탯 분석 (Stats) · 실데이터 연결 (PR-MOCK-TO-REAL ①)
 *
 * 왜 이렇게 바꾸는가:
 *  - Batch B 에서 "준비중 빈상태"로 박제됐으나, 실 source(MatchPlayerStat 2375행)가
 *    존재해 시안 대시보드(KPI·득점추이·클럽순위·경기로그)를 실데이터로 채울 수 있다.
 *  - UserSeasonStat/ShotZoneStat(0행)은 우회. ZONES/SPLIT 만 정직하게 hide(준비중).
 *
 * 어떻게:
 *  - server 컴포넌트가 getWebSession → 본인 user.id → getMySeasonStats 로 전 시즌을
 *    한 번에 선계산(시즌 셀렉터는 클라 필터 = 추가 fetch 0 / 라우트 0 = 옵션 A).
 *  - 비로그인 / 출전 0 = 빈상태를 server 에서 직접 렌더(client 불요).
 *  - 데이터 O → 직렬화(BigInt 없음·camelCase JSON) prop 으로 StatsClient 전달.
 *  - getPlayerStats(user.ts) 미변경 — 신규 헬퍼(my-season-stats.ts)로 회귀 격리.
 * ============================================================ */

import Link from "next/link";
import { getWebSession } from "@/lib/auth/web-session";
import { getMySeasonStats } from "@/lib/stats/my-season-stats";
import StatsClient from "./_v2/stats-client";

// 본인 시즌 스탯 = 매 요청 최신 집계. 정적 캐시 금지.
export const dynamic = "force-dynamic";

/** 공용 셸 — 브레드크럼 + 헤더(빈상태/데이터 공통) */
function StatsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <div className="ex-page-w">
        {/* 브레드크럼 — 홈 › 프로필 › 스탯 분석 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <Link href="/profile">프로필</Link>
          <span className="sep">›</span>
          <span className="cur">스탯 분석</span>
        </div>
        {children}
      </div>
    </div>
  );
}

/** 빈상태 카드 — 아이콘 + 제목 + 설명 + (선택) CTA */
function EmptyCard({
  icon,
  title,
  desc,
  ctaHref,
  ctaLabel,
}: {
  icon: string;
  title: string;
  desc: React.ReactNode;
  ctaHref?: string;
  ctaLabel?: string;
}) {
  return (
    <div className="card">
      <div className="ex-empty">
        <span className="ico material-symbols-outlined">{icon}</span>
        <div className="ex-empty__t">{title}</div>
        <div className="ex-empty__d">{desc}</div>
        {ctaHref && ctaLabel && (
          <div style={{ marginTop: 18 }}>
            <Link href={ctaHref} className="btn btn--accent">
              {ctaLabel}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default async function StatsPage() {
  const session = await getWebSession();

  // 빈상태 ①: 비로그인 — mock 노출 ❌, 로그인 유도.
  if (!session) {
    return (
      <StatsShell>
        <div className="ex-head">
          <div>
            <div className="eyebrow">ADVANCED STATS</div>
            <h1 className="ex-head__title">시즌 스탯 분석</h1>
            <p className="ex-head__sub">
              슈팅 존, 클럽 내 순위, 경기 로그까지 — 한 시즌을 숫자로 되짚어보는
              개인 스탯 대시보드입니다.
            </p>
          </div>
        </div>
        <EmptyCard
          icon="lock"
          title="로그인이 필요합니다"
          desc={
            <>
              내 시즌 스탯은 로그인 후 확인할 수 있어요.
              <br />
              대회 출전 기록을 바탕으로 개인 대시보드를 제공합니다.
            </>
          }
          ctaHref="/login"
          ctaLabel="로그인하고 내 스탯 보기"
        />
      </StatsShell>
    );
  }

  // 세션 sub = user.id.toString() (jwt.ts) → BigInt 로 변환해 본인 식별.
  const userId = BigInt(session.sub);

  // 기본 시즌 = 데이터가 있는 가장 최근 시즌. 우선 career 로 한 번 호출해 seasons[] 확보.
  // (옵션 A: 전 시즌을 한 번에 계산하지 않고, page 에서 시즌별로 선계산해 prop.
  //  실측 max 7경기라 시즌 2~3개 × 경량 집계 = 비용 무시. 라우트/API 0.)
  const career = await getMySeasonStats(userId, "career");

  // 빈상태 ②: 출전 이력 0건(ttp 0) — 대회 안내.
  if (career.hasNoTtp) {
    return (
      <StatsShell>
        <div className="ex-head">
          <div>
            <div className="eyebrow">ADVANCED STATS</div>
            <h1 className="ex-head__title">시즌 스탯 분석</h1>
            <p className="ex-head__sub">
              대회에 출전하면 경기 기록이 쌓여 개인 스탯 대시보드가 만들어집니다.
            </p>
          </div>
        </div>
        <EmptyCard
          icon="sports_basketball"
          title="출전 기록이 아직 없습니다"
          desc={
            <>
              대회에 참가해 경기를 치르면
              <br />
              득점·어시스트·슈팅 기록이 자동으로 집계됩니다.
            </>
          }
          ctaHref="/tournaments"
          ctaLabel="진행 중인 대회 보기"
        />
      </StatsShell>
    );
  }

  // 데이터 있는 시즌 목록. 가장 최근 시즌을 기본 선택.
  const seasons = career.seasons;
  const defaultSeason: number | "career" =
    seasons.length > 0 ? seasons[0] : "career";

  // 옵션 A: 각 시즌 + 커리어를 미리 계산해 클라에 prop(시즌 전환 = 클라 필터, fetch 0).
  // career 는 이미 계산됨. 나머지 시즌만 추가 계산.
  const perSeason: Record<string, Awaited<ReturnType<typeof getMySeasonStats>>> =
    { career };
  for (const yr of seasons) {
    perSeason[String(yr)] = await getMySeasonStats(userId, yr);
  }

  // 직렬화 — 헬퍼 반환은 camelCase + BigInt 없음(전부 number/string) → 그대로 JSON 안전.
  // (StatsClient prop 인터페이스와 1:1)
  return (
    <StatsClient
      seasons={seasons}
      defaultSeason={defaultSeason}
      perSeason={perSeason}
    />
  );
}
