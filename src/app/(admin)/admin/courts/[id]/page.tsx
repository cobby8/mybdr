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
  formatJsonValue,
  formatWon,
  initials,
  parseBigIntId,
} from "../../_components/detail-kit";

export const dynamic = "force-dynamic";

const COURT_STATUS: Record<string, StatusMeta> = {
  active: { tone: "ok", label: "운영중" },
  pending: { tone: "warn", label: "검토중" },
  inactive: { tone: "danger", label: "비활성" },
  rejected: { tone: "danger", label: "반려" },
};

const BOOKING_STATUS: Record<string, StatusMeta> = {
  confirmed: { tone: "ok", label: "확정" },
  pending: { tone: "warn", label: "대기" },
  cancelled: { tone: "danger", label: "취소" },
  refunded: { tone: "grey", label: "환불" },
  completed: { tone: "grey", label: "완료" },
  blocked: { tone: "primary", label: "차단" },
};

const REPORT_STATUS: Record<string, StatusMeta> = {
  active: { tone: "warn", label: "처리대기" },
  resolved: { tone: "ok", label: "해결" },
  dismissed: { tone: "grey", label: "기각" },
};

function getTab(value: string | undefined) {
  const tabs = ["overview", "bookings", "reports"];
  return tabs.includes(value ?? "") ? value! : "overview";
}

function booleanText(value: boolean | null | undefined) {
  if (value == null) return "미확인";
  return value ? "있음" : "없음";
}

export default async function AdminCourtDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab: tabParam } = await searchParams;
  const courtId = parseBigIntId(id);
  if (!courtId) notFound();

  const court = await prisma.court_infos.findUnique({
    where: { id: courtId },
    include: {
      users: { select: { id: true, nickname: true, name: true, email: true } },
      court_bookings: {
        orderBy: { start_at: "desc" },
        take: 30,
        include: {
          user: { select: { id: true, nickname: true, name: true, email: true } },
        },
      },
      court_reports: {
        orderBy: { created_at: "desc" },
        take: 20,
        include: {
          users: { select: { id: true, nickname: true, name: true, email: true } },
        },
      },
      _count: {
        select: {
          court_bookings: true,
          court_reviews: true,
          court_reports: true,
          court_ambassadors: true,
        },
      },
    },
  });

  if (!court) notFound();

  const activeTab = getTab(tabParam);
  const baseHref = `/admin/courts/${id}`;
  const tabs = [
    { id: "overview", label: "개요", icon: "map-pin", href: baseHref },
    { id: "bookings", label: "예약 현황", icon: "calendar-days", href: `${baseHref}?tab=bookings`, count: court._count.court_bookings },
    { id: "reports", label: "신고", icon: "flag", href: `${baseHref}?tab=reports`, count: court._count.court_reports },
  ];

  const region = [court.city, court.district].filter(Boolean).join(" ");
  const facilityLabels = [
    court.court_type && `유형 ${court.court_type}`,
    court.hoops_count != null && `골대 ${court.hoops_count}개`,
    court.surface_type && `바닥 ${court.surface_type}`,
    court.has_lighting && "조명",
    court.has_restroom && "화장실",
    court.has_parking && "주차",
    court.rental_available && "대관",
  ].filter(Boolean);

  return (
    <div data-skin="toss">
      <DetailHead
        backHref="/admin/courts"
        backLabel="코트 목록"
        eyebrow="ADMIN / 코트 상세"
        eyebrowIcon="map-pin"
        avatar={initials(court.name)}
        avatarGrey
        title={court.name}
        sub={`${region || "지역 미입력"} / ${court.address}`}
        badges={
          <>
            <StatusBadge map={COURT_STATUS} value={court.status} />
            <Badge tone={court.verified ? "ok" : "grey"}>{court.verified ? "검증됨" : "미검증"}</Badge>
            <Badge tone={court.is_free ? "primary" : "grey"}>{court.is_free ? "무료" : "유료/미확인"}</Badge>
          </>
        }
        actions={
          <Link href="/admin/courts" className="btn btn--sm">
            코트 관리
          </Link>
        }
      />

      <MiniStat
        items={[
          { label: "예약", value: court._count.court_bookings.toLocaleString() },
          { label: "리뷰", value: court._count.court_reviews.toLocaleString() },
          { label: "신고", value: court._count.court_reports.toLocaleString() },
          { label: "평점", value: court.average_rating ? Number(court.average_rating).toFixed(1) : "-" },
        ]}
      />

      <DetailTabs tabs={tabs} active={activeTab} />

      {activeTab === "overview" && (
        <div className="au-dgrid">
          <div className="au-dstack">
            <Panel title="코트 정보">
              <DL
                rows={[
                  ["코트명", court.name],
                  ["주소", court.address],
                  ["지역", region || "-"],
                  ["좌표", `${court.latitude.toString()}, ${court.longitude.toString()}`],
                  ["운영시간", formatJsonValue(court.operating_hours)],
                  ["이용료", court.fee ? formatWon(court.fee) : court.is_free ? "무료" : "-"],
                  ["대관 모드", court.booking_mode],
                  ["시간당 대관료", court.booking_fee_per_hour ? formatWon(court.booking_fee_per_hour) : "-"],
                ]}
              />
            </Panel>

            <Panel title="편의시설">
              {facilityLabels.length === 0 && formatJsonValue(court.facilities) === "-" ? (
                <EmptyDetail title="등록된 편의시설 정보가 없습니다." />
              ) : (
                <div className="au-chips">
                  {facilityLabels.map((label) => (
                    <span className="au-chips__item" key={String(label)}>
                      {label}
                    </span>
                  ))}
                  {Array.isArray(court.facilities) &&
                    court.facilities.map((item) => (
                      <span className="au-chips__item" key={String(item)}>
                        {String(item)}
                      </span>
                    ))}
                </div>
              )}
            </Panel>
          </div>

          <div className="au-dstack">
            <Panel title="등록/관리">
              <DL
                rows={[
                  [
                    "등록자",
                    <Link key="owner" href={`/admin/users/${court.user_id.toString()}`}>
                      {displayUser(court.users)}
                    </Link>,
                  ],
                  ["체크인", `${court.checkins_count.toLocaleString()}건`],
                  ["앰배서더", `${court._count.court_ambassadors.toLocaleString()}명`],
                  ["화장실", booleanText(court.has_restroom)],
                  ["주차", booleanText(court.has_parking)],
                  ["조명", booleanText(court.has_lighting)],
                  ["생성일", formatDateTime(court.created_at)],
                  ["수정일", formatDateTime(court.updated_at)],
                ]}
              />
            </Panel>
            <Panel title="설명">
              <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6 }}>
                {court.description || "등록된 설명이 없습니다."}
              </p>
            </Panel>
          </div>
        </div>
      )}

      {activeTab === "bookings" && (
        <Panel title="예약 현황" sub={`최근 ${court.court_bookings.length}건`} pad={0} style={{ overflow: "hidden" }}>
          {court.court_bookings.length === 0 ? (
            <EmptyDetail title="예약 기록이 없습니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>예약자</th>
                  <th>시작</th>
                  <th>종료</th>
                  <th>목적</th>
                  <th>금액</th>
                  <th style={{ paddingRight: 20 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {court.court_bookings.map((booking) => (
                  <tr key={booking.id.toString()}>
                    <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/admin/users/${booking.user_id.toString()}`}>{displayUser(booking.user)}</Link>
                    </td>
                    <td>{formatDateTime(booking.start_at)}</td>
                    <td>{formatDateTime(booking.end_at)}</td>
                    <td>{booking.purpose}</td>
                    <td>{formatWon(booking.final_amount)}</td>
                    <td style={{ paddingRight: 20 }}>
                      <StatusBadge map={BOOKING_STATUS} value={booking.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      )}

      {activeTab === "reports" && (
        <Panel title="코트 신고" sub={`최근 ${court.court_reports.length}건`} pad={0} style={{ overflow: "hidden" }}>
          {court.court_reports.length === 0 ? (
            <EmptyDetail title="신고 기록이 없습니다." />
          ) : (
            <table className="au-sub">
              <thead>
                <tr>
                  <th style={{ paddingLeft: 20 }}>신고자</th>
                  <th>유형</th>
                  <th>내용</th>
                  <th>일시</th>
                  <th style={{ paddingRight: 20 }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {court.court_reports.map((report) => (
                  <tr key={report.id.toString()}>
                    <td className="au-sub__name" style={{ paddingLeft: 20 }}>
                      <Link href={`/admin/users/${report.user_id.toString()}`}>{displayUser(report.users)}</Link>
                    </td>
                    <td>{report.report_type}</td>
                    <td>{report.description ?? "-"}</td>
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
