import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Badge, DL, Panel, StatusBadge, type StatusMeta } from "@/components/admin/console-kit";
import {
  DetailHead,
  DetailTabs,
  EmptyDetail,
  MiniStat,
  displayUser,
  formatDateTime,
  formatWon,
  initials,
  parseBigIntId,
} from "../../_components/detail-kit";

export const dynamic = "force-dynamic";

const GAME_STATUS: Record<string, StatusMeta> = {
  "1": { tone: "ok", label: "모집중" },
  "2": { tone: "primary", label: "확정" },
  "3": { tone: "grey", label: "완료" },
  "4": { tone: "danger", label: "취소" },
};

const APPLICATION_STATUS: Record<string, StatusMeta> = {
  "0": { tone: "warn", label: "대기" },
  "1": { tone: "ok", label: "승인" },
  "2": { tone: "danger", label: "거절" },
  "3": { tone: "grey", label: "대기열" },
};

const REPORT_STATUS: Record<string, StatusMeta> = {
  submitted: { tone: "warn", label: "접수" },
  draft: { tone: "grey", label: "임시" },
  reviewed: { tone: "ok", label: "검토완료" },
  dismissed: { tone: "danger", label: "반려" },
};

const GAME_TYPE: Record<number, string> = {
  0: "픽업",
  1: "게스트",
  2: "연습",
};

function getTab(value: string | undefined) {
  const tabs = ["overview", "lineup", "reports"];
  return tabs.includes(value ?? "") ? value! : "overview";
}

export default async function AdminGameDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const gameId = parseBigIntId(id);
  if (!gameId) notFound();

  const game = await prisma.games.findUnique({
    where: { id: gameId },
    include: {
      users: { select: { id: true, nickname: true, name: true, email: true } },
      final_mvp: { select: { id: true, nickname: true, name: true, email: true } },
      courts: { select: { id: true, name: true, address: true, city: true, district: true } },
      game_applications: {
        orderBy: { created_at: "desc" },
        include: {
          users: { select: { id: true, nickname: true, name: true, email: true, position: true } },
        },
      },
      game_reports: {
        orderBy: { created_at: "desc" },
        include: {
          reporter: { select: { id: true, nickname: true, name: true, email: true } },
          mvp_player: { select: { id: true, nickname: true, name: true, email: true } },
        },
      },
    },
  });

  if (!game) notFound();

  const activeTab = getTab(tabParam);
  const baseHref = `/admin/games/${id}`;
  const pendingApplications = game.game_applications.filter((a) => a.status === 0).length;
  const tabs = [
    { id: "overview", label: "개요", icon: "clipboard-list", href: baseHref },
    { id: "lineup", label: "참가/라인업", icon: "users", href: `${baseHref}?tab=lineup`, count: game.game_applications.length },
    { id: "reports", label: "리포트", icon: "flag", href: `${baseHref}?tab=reports`, count: game.game_reports.length },
  ];

  const venue = game.venue_name ?? game.courts?.name ?? game.city ?? "장소 미입력";
  const region = [game.city ?? game.courts?.city, game.district ?? game.courts?.district]
    .filter(Boolean)
    .join(" ");

  return (
    <div data-skin="toss">
      <DetailHead
        backHref="/admin/games"
        backLabel="경기 목록"
        eyebrow="ADMIN / 경기 상세"
        eyebrowIcon="volleyball"
        avatar={initials(game.title ?? "경기")}
        title={game.title ?? "(제목 없음)"}
        sub={`${GAME_TYPE[game.game_type] ?? game.game_type} / ${venue}`}
        badges={
          <>
            <StatusBadge map={GAME_STATUS} value={String(game.status)} />
            {pendingApplications > 0 && <Badge tone="warn">대기 {pendingApplications}</Badge>}
            {game.allow_guests && <Badge tone="primary">게스트 허용</Badge>}
          </>
        }
        actions={
          <Link href="/admin/games" className="btn btn--sm">
            상태 관리
          </Link>
        }
      />

      <MiniStat
        items={[
          { label: "참가자", value: `${game.current_participants ?? 0}/${game.max_participants ?? "-"}` },
          { label: "신청", value: game.game_applications.length.toLocaleString() },
          { label: "대기", value: pendingApplications.toLocaleString() },
          { label: "참가비", value: formatWon(game.fee_per_person ?? 0) },
        ]}
      />

      <DetailTabs tabs={tabs} active={activeTab} />

      {activeTab === "overview" && (
        <div className="au-dgrid">
          <div className="au-dstack">
            <Panel title="경기 정보">
              <DL
                rows={[
                  ["제목", game.title ?? "-"],
                  ["유형", GAME_TYPE[game.game_type] ?? String(game.game_type)],
                  ["주최자", <Link key="host" href={`/admin/users/${game.organizer_id.toString()}`}>{displayUser(game.users)}</Link>],
                  ["장소", venue],
                  ["지역", region || "-"],
                  ["예정", formatDateTime(game.scheduled_at)],
                  ["종료", formatDateTime(game.ended_at)],
                  ["진행시간", `${game.duration_hours ?? "-"}시간`],
                  ["최소/최대", `${game.min_participants ?? "-"} / ${game.max_participants ?? "-"}`],
                  ["참가비", formatWon(game.fee_per_person ?? 0)],
                ]}
              />
            </Panel>

            <Panel title="설명">
              <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6 }}>
                {game.description || "등록된 경기 설명이 없습니다."}
              </p>
            </Panel>
          </div>

          <div className="au-dstack">
            <Panel title="운영 메타">
              <DL
                rows={[
                  ["게임 코드", game.game_id],
                  ["스킬 레벨", game.skill_level ?? "-"],
                  ["신청 수", `${game.applications_count ?? game.game_applications.length}건`],
                  ["조회수", `${game.views_count ?? 0}회`],
                  ["최종 MVP", game.final_mvp ? <Link key="mvp" href={`/admin/users/${game.final_mvp.id.toString()}`}>{displayUser(game.final_mvp)}</Link> : "-"],
                  ["생성일", formatDateTime(game.created_at)],
                  ["수정일", formatDateTime(game.updated_at)],
                ]}
              />
            </Panel>
            <Panel title="스코어/라인업 메모">
              <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6 }}>
                이 라우트는 일반 경기 관리 데이터 기준입니다. 공식 대회 경기 스코어보드와 라인업 기록은 대회 상세 배치에서 읽기 전용으로 연결합니다.
              </p>
            </Panel>
          </div>
        </div>
      )}

      {activeTab === "lineup" && (
        <Panel title="참가/라인업" sub={`신청 ${game.game_applications.length}건`} pad={0} style={{ overflow: "hidden" }}>
          {game.game_applications.length === 0 ? (
            <EmptyDetail title="참가 신청 기록이 없습니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>참가자</th>
                  <th>포지션</th>
                  <th>게스트</th>
                  <th>신청일</th>
                  <th>결제</th>
                  <th style={{ paddingRight: 20 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {game.game_applications.map((application) => (
                  <tr key={application.id.toString()}>
                    <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/admin/users/${application.user_id.toString()}`}>
                        {displayUser(application.users)}
                      </Link>
                    </td>
                    <td>{application.position ?? application.users.position ?? "-"}</td>
                    <td>{application.is_guest ? "게스트" : "회원"}</td>
                    <td>{formatDateTime(application.created_at)}</td>
                    <td>{application.payment_required ? String(application.payment_status ?? 0) : "불필요"}</td>
                    <td style={{ paddingRight: 20 }}>
                      <StatusBadge map={APPLICATION_STATUS} value={String(application.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {activeTab === "reports" && (
        <Panel title="경기 리포트" sub={`최근 ${game.game_reports.length}건`} pad={0} style={{ overflow: "hidden" }}>
          {game.game_reports.length === 0 ? (
            <EmptyDetail title="경기 리포트가 없습니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>작성자</th>
                  <th>평점</th>
                  <th>MVP</th>
                  <th>코멘트</th>
                  <th>일시</th>
                  <th style={{ paddingRight: 20 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {game.game_reports.map((report) => (
                  <tr key={report.id.toString()}>
                    <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/admin/users/${report.reporter_user_id.toString()}`}>
                        {displayUser(report.reporter)}
                      </Link>
                    </td>
                    <td>{report.overall_rating}</td>
                    <td>
                      {report.mvp_player ? (
                        <Link href={`/admin/users/${report.mvp_player.id.toString()}`}>
                          {displayUser(report.mvp_player)}
                        </Link>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td>{report.comment ?? "-"}</td>
                    <td>{formatDateTime(report.created_at)}</td>
                    <td style={{ paddingRight: 20 }}>
                      <StatusBadge map={REPORT_STATUS} value={report.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}
    </div>
  );
}
