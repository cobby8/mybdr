/* ============================================================
 * /scrim — 스크림 매칭 (Scrimmage) · 실데이터 연결 (PR-MOCK-TO-REAL ④)
 *
 * 왜 이 구조인가:
 *  - 더미(OPEN_REQS/INCOMING/OUTGOING/HISTORY)를 전량 제거하고 team_match_requests
 *    실데이터로 와이어한다. 인증·내 운영팀 식별·제안 조회는 SSR(서버 컴포넌트)에서 처리하고,
 *    탭/액션(수락·거절·취소)은 client 컴포넌트 <ScrimTabs> 가 담당한다.
 *  - 신규 스키마/라우트 0. 받은·보낸·지난 제안은 여기서 prisma 로 직접 조회(읽기 전용),
 *    인터랙션은 기존 PATCH/POST API 재사용.
 *
 * 빈상태 분기(정직 와이어 — mock 복원 ❌):
 *  - 비로그인 → 로그인 안내
 *  - 운영팀 없음 → "팀 운영자만" 안내
 *  - 제안 0건 → 탭별 빈상태(ScrimTabs 내부)
 * ============================================================ */

import Link from "next/link";
import { getWebSession } from "@/lib/auth/web-session";
import { prisma } from "@/lib/db/prisma";
import { ScrimTabs, type ScrimRequest } from "./_components/scrim-tabs";

// 운영진 판정 role — match-request API 가드와 동일(captain/vice/manager)
const TEAM_MANAGER_ROLES = ["captain", "vice", "manager"] as const;

// 진행 중(pending) vs 지난 기록(그 외) 분류용
const HISTORY_STATUSES = ["accepted", "rejected", "cancelled"] as const;

// 공용 페이지 셸 — 브레드크럼 + 헤더 (빈상태/정상 공통)
function ScrimShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="page">
      <div className="ex-page-w">
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="cur">스크림 매칭</span>
        </div>
        <div className="ex-head">
          <div>
            <div className="eyebrow">스크림 · SCRIMMAGE</div>
            <h1 className="ex-head__title">팀 vs 팀, 연습경기 잡기</h1>
            <p className="ex-head__sub">
              내 팀이 받은·보낸 친선 경기 제안을 한 곳에서 관리합니다.
            </p>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

export default async function ScrimPage() {
  const session = await getWebSession();

  // 1) 비로그인 → 로그인 안내 빈상태
  if (!session?.sub) {
    return (
      <ScrimShell>
        <div className="card">
          <div className="ex-empty">
            <span className="ico material-symbols-outlined">lock</span>
            <div className="ex-empty__t">로그인이 필요합니다</div>
            <div className="ex-empty__d">
              스크림 매칭은 팀 운영자가 제안을 주고받는 기능입니다. 로그인 후
              이용해 주세요.
            </div>
            <Link
              href="/login?returnTo=/scrim"
              className="btn btn--primary btn--sm"
              style={{ marginTop: 12 }}
            >
              로그인
            </Link>
          </div>
        </div>
      </ScrimShell>
    );
  }

  const userId = BigInt(session.sub);

  // 2) 내 운영팀 식별 — captainId 1순위 + role(captain/vice/manager) fallback.
  //    스크림은 "내 팀" 단위라 운영팀 1개를 대표로 선택(가장 우선순위 높은 1팀).
  //    captainId 매칭 팀을 먼저, 없으면 멤버십 role 운영팀.
  const captainTeam = await prisma.team
    .findFirst({
      where: { captainId: userId },
      select: { id: true, name: true },
      orderBy: { id: "asc" },
    })
    .catch(() => null);

  let myTeam: { id: bigint; name: string } | null = captainTeam;

  if (!myTeam) {
    const managerMembership = await prisma.teamMember
      .findFirst({
        where: {
          userId,
          status: "active",
          role: { in: [...TEAM_MANAGER_ROLES] },
        },
        include: { team: { select: { id: true, name: true } } },
        orderBy: { id: "asc" },
      })
      .catch(() => null);
    if (managerMembership?.team) {
      myTeam = {
        id: managerMembership.team.id,
        name: managerMembership.team.name,
      };
    }
  }

  // 3) 운영팀 없음 → "팀 운영자만" 빈상태
  if (!myTeam) {
    return (
      <ScrimShell>
        <div className="card">
          <div className="ex-empty">
            <span className="ico material-symbols-outlined">groups</span>
            <div className="ex-empty__t">팀 운영자만 이용할 수 있습니다</div>
            <div className="ex-empty__d">
              스크림 제안은 팀장·부팀장·매니저가 우리 팀을 대표해 주고받습니다.
              팀을 만들거나 운영진이 되면 이용할 수 있습니다.
            </div>
            <Link
              href="/teams"
              className="btn btn--primary btn--sm"
              style={{ marginTop: 12 }}
            >
              팀 둘러보기
            </Link>
          </div>
        </div>
      </ScrimShell>
    );
  }

  // 4) 받은(to_team=내팀) / 보낸(from_team=내팀) 제안을 한 번에 조회.
  //    counterpart(상대팀) include — 받은=from_team / 보낸=to_team.
  //    응답 키는 snake_case 로 정규화(클라이언트 접근자와 일치).
  const [incomingRows, outgoingRows] = await Promise.all([
    prisma.team_match_requests.findMany({
      where: { to_team_id: myTeam.id, status: "pending" },
      include: {
        from_team: {
          select: {
            id: true,
            name: true,
            primaryColor: true,
            city: true,
            district: true,
          },
        },
        proposer: { select: { nickname: true, name: true } },
      },
      orderBy: { created_at: "desc" },
    }),
    prisma.team_match_requests.findMany({
      where: { from_team_id: myTeam.id, status: "pending" },
      include: {
        to_team: {
          select: {
            id: true,
            name: true,
            primaryColor: true,
            city: true,
            district: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    }),
  ]);

  // 지난 기록 — 받은·보낸 양쪽에서 accepted/rejected/cancelled 모두.
  const historyRows = await prisma.team_match_requests.findMany({
    where: {
      status: { in: [...HISTORY_STATUSES] },
      OR: [{ to_team_id: myTeam.id }, { from_team_id: myTeam.id }],
    },
    include: {
      from_team: { select: { id: true, name: true, primaryColor: true } },
      to_team: { select: { id: true, name: true, primaryColor: true } },
    },
    orderBy: { updated_at: "desc" },
    take: 50, // 과도한 누적 방지
  });

  const myTeamIdStr = myTeam.id.toString();

  // 받은 제안 → 상대 = from_team
  const incoming: ScrimRequest[] = incomingRows.map((r) => ({
    id: r.id.toString(),
    status: r.status,
    message: r.message,
    preferred_date: r.preferred_date ? r.preferred_date.toISOString() : null,
    created_at: r.created_at.toISOString(),
    counterpart: r.from_team
      ? {
          id: r.from_team.id.toString(),
          name: r.from_team.name,
          primary_color: r.from_team.primaryColor,
          city: r.from_team.city,
          district: r.from_team.district,
        }
      : null,
    proposer_nickname: r.proposer?.nickname ?? r.proposer?.name ?? null,
  }));

  // 보낸 제안 → 상대 = to_team
  const outgoing: ScrimRequest[] = outgoingRows.map((r) => ({
    id: r.id.toString(),
    status: r.status,
    message: r.message,
    preferred_date: r.preferred_date ? r.preferred_date.toISOString() : null,
    created_at: r.created_at.toISOString(),
    counterpart: r.to_team
      ? {
          id: r.to_team.id.toString(),
          name: r.to_team.name,
          primary_color: r.to_team.primaryColor,
          city: r.to_team.city,
          district: r.to_team.district,
        }
      : null,
    proposer_nickname: null,
  }));

  // 지난 기록 → 상대는 "내가 아닌 쪽" (받은이면 from_team, 보낸이면 to_team)
  const history: ScrimRequest[] = historyRows.map((r) => {
    const iAmReceiver = r.to_team_id === myTeam!.id;
    const other = iAmReceiver ? r.from_team : r.to_team;
    return {
      id: r.id.toString(),
      status: r.status,
      message: r.message,
      preferred_date: r.preferred_date ? r.preferred_date.toISOString() : null,
      created_at: r.created_at.toISOString(),
      counterpart: other
        ? {
            id: other.id.toString(),
            name: other.name,
            primary_color: other.primaryColor,
            city: null,
            district: null,
          }
        : null,
      proposer_nickname: null,
    };
  });

  return (
    <ScrimShell>
      <ScrimTabs
        myTeamId={myTeamIdStr}
        myTeamName={myTeam.name}
        incoming={incoming}
        outgoing={outgoing}
        history={history}
      />
    </ScrimShell>
  );
}
