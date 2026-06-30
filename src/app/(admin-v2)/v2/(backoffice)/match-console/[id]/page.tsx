// ============================================================
// (admin-v2)/v2/match-console/[id]/page.tsx — 컷오버 ② 매칭 상세(3탭)
//   매칭 = 픽업/게스트/연습 경기. 레거시 (admin)/admin/games/[id]/page.tsx 를
//   admin-v2(Toss) 디자인으로 1:1 포팅(개요 / 참가·라인업 / 리포트).
//   ⚠ 백엔드 0변경 — 순수 READ 서버 컴포넌트(Prisma findUnique, 레거시 include 동일).
//     레거시 상세는 mutation 0(읽기전용)이라 v2 도 mutation 없음(신규 API/action 0).
//     탭 전환은 레거시 그대로 ?tab= searchParams + Link(클라 컴포넌트/추가 fetch 0).
// ============================================================

import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Badge, Icon, type BadgeTone } from "@/components/admin-v2";

export const dynamic = "force-dynamic";

// ── 라벨/톤 매핑(목록·레거시 동일) ──
// game status Int: 1=모집중 / 2=확정 / 3=완료 / 4=취소
const STATUS_LABEL: Record<number, string> = { 1: "모집중", 2: "확정", 3: "완료", 4: "취소" };
const STATUS_TONE: Record<number, BadgeTone> = { 1: "ok", 2: "primary", 3: "grey", 4: "danger" };
// game_type Int: 0=픽업 / 1=게스트 / 2=연습
const TYPE_LABEL: Record<number, string> = { 0: "픽업", 1: "게스트", 2: "연습" };
// game_applications.status Int: 0=대기 / 1=승인 / 2=거절 / 3=대기열
const APP_STATUS_LABEL: Record<number, string> = { 0: "대기", 1: "승인", 2: "거절", 3: "대기열" };
const APP_STATUS_TONE: Record<number, BadgeTone> = { 0: "warn", 1: "ok", 2: "danger", 3: "grey" };
// game_reports.status: 문자열(레거시 동일 + resolve API 의 "resolved" 보강)
const REPORT_STATUS_LABEL: Record<string, string> = {
  submitted: "접수", draft: "임시", reviewed: "검토완료", resolved: "처리완료", dismissed: "반려",
};
const REPORT_STATUS_TONE: Record<string, BadgeTone> = {
  submitted: "warn", draft: "grey", reviewed: "ok", resolved: "ok", dismissed: "danger",
};

const TABS = ["overview", "lineup", "reports"] as const;
type TabKey = (typeof TABS)[number];

// ── 작은 유틸(admin-v2 자기완결 — 레거시 detail-kit 미의존) ──
// BigInt id 파싱(숫자 아니면 null → notFound 가드)
function parseBigIntId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null;
  try {
    return BigInt(raw);
  } catch {
    return null;
  }
}

// 사용자 표시명(닉네임 > 이름 > 이메일)
type MiniUser = { nickname: string | null; name: string | null; email: string | null } | null;
function displayUser(u: MiniUser): string {
  if (!u) return "-";
  return u.nickname || u.name || u.email || "-";
}

// 아바타 이니셜(첫 글자)
function initials(s: string): string {
  return (s.trim()[0] ?? "?").toUpperCase();
}

// 날짜 포맷(ko-KR) — 목록과 동일 표기
function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return "-";
  return new Date(d).toLocaleString("ko-KR", {
    year: "numeric", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// 참가비(0=무료)
function fmtWon(n: number | null | undefined): string {
  if (!n || n <= 0) return "무료";
  return `${n.toLocaleString()}원`;
}

export default async function AdminV2MatchDetail({
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

  // ── READ: 레거시 findUnique include 1:1 복제(write 0) ──
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

  // 활성 탭(화이트리스트 가드)
  const activeTab: TabKey = TABS.includes((tabParam ?? "") as TabKey)
    ? (tabParam as TabKey)
    : "overview";

  const baseHref = `/v2/match-console/${id}`;
  const pendingApplications = game.game_applications.filter((a) => a.status === 0).length;

  // 장소/지역(games 자체값 우선, 없으면 courts 조인값)
  const venue = game.venue_name ?? game.courts?.name ?? game.city ?? "장소 미입력";
  const region = [game.city ?? game.courts?.city, game.district ?? game.courts?.district]
    .filter(Boolean)
    .join(" ");

  const status = game.status ?? 1; // DB default 0/null → 1(모집중)

  // 탭 정의(레거시 동일 — 라인업/리포트 카운트 노출)
  const tabs: { key: TabKey; label: string; count?: number }[] = [
    { key: "overview", label: "개요" },
    { key: "lineup", label: "참가/라인업", count: game.game_applications.length },
    { key: "reports", label: "리포트", count: game.game_reports.length },
  ];

  return (
    <div>
      {/* 뒤로 — 목록으로 */}
      <Link
        href="/v2/match-console"
        style={{
          display: "inline-flex", alignItems: "center", gap: 6, marginBottom: 14,
          fontSize: 13, fontWeight: 700, color: "var(--ink-mute)", textDecoration: "none",
        }}
      >
        <Icon name="arrow-left" size={16} />
        매칭 콘솔
      </Link>

      {/* 상세 헤더(hero 아바타 + 제목 + 배지 + 액션) */}
      <div className="bo-detail-head">
        <div className="bo-hero">
          <span className="bo-hero__av" style={{ background: "var(--primary)" }}>
            {initials(game.title ?? "경기")}
          </span>
          <div className="bo-hero__meta">
            <div className="bo-hero__name">{game.title || "(제목 없음)"}</div>
            <div className="bo-hero__sub">
              {TYPE_LABEL[game.game_type] ?? game.game_type} · {venue}
            </div>
            <div className="bo-hero__badges">
              <Badge tone={STATUS_TONE[status] ?? "grey"}>{STATUS_LABEL[status] ?? status}</Badge>
              {pendingApplications > 0 && <Badge tone="warn">대기 {pendingApplications}</Badge>}
              {game.allow_guests && <Badge tone="primary">게스트 허용</Badge>}
            </div>
          </div>
        </div>
        <Link href="/v2/match-console" className="ts-btn ts-btn--secondary ts-btn--sm" style={{ textDecoration: "none" }}>
          <Icon name="settings" size={15} />
          상태 관리
        </Link>
      </div>

      {/* 미니 통계 띠(참가자/신청/대기/참가비) */}
      <div className="bo-statgrid">
        <div className="bo-stat">
          <div className="bo-stat__v">
            {game.current_participants ?? 0}/{game.max_participants ?? "-"}
          </div>
          <div className="bo-stat__k">참가자</div>
        </div>
        <div className="bo-stat">
          <div className="bo-stat__v">{game.game_applications.length.toLocaleString()}</div>
          <div className="bo-stat__k">신청</div>
        </div>
        <div className="bo-stat">
          <div className="bo-stat__v" data-tone={pendingApplications > 0 ? "primary" : undefined}>
            {pendingApplications.toLocaleString()}
          </div>
          <div className="bo-stat__k">대기</div>
        </div>
        <div className="bo-stat">
          <div className="bo-stat__v">{fmtWon(game.fee_per_person)}</div>
          <div className="bo-stat__k">참가비</div>
        </div>
      </div>

      {/* 탭바(레거시 동일 — ?tab= Link 서버 전환) */}
      <div className="bo-constabs" style={{ marginTop: 18 }}>
        {tabs.map((t) => (
          <Link
            key={t.key}
            href={t.key === "overview" ? baseHref : `${baseHref}?tab=${t.key}`}
            className="bo-constab"
            data-on={activeTab === t.key ? "true" : "false"}
            style={{ textDecoration: "none" }}
          >
            {t.label}
            {t.count != null && t.count > 0 ? ` ${t.count}` : ""}
          </Link>
        ))}
      </div>

      {/* ── 탭 1: 개요(경기정보 / 운영메타 / 설명) ── */}
      {activeTab === "overview" && (
        <div className="bo-form-grid">
          {/* 좌: 경기 정보 + 설명 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div className="ad-panel">
              <div className="ad-section-label">경기 정보</div>
              <div>
                <Field k="제목" v={game.title || "-"} />
                <Field k="유형" v={TYPE_LABEL[game.game_type] ?? String(game.game_type)} />
                <Field k="주최자" v={displayUser(game.users)} />
                <Field k="장소" v={venue} />
                <Field k="지역" v={region || "-"} />
                <Field k="예정" v={fmtDateTime(game.scheduled_at)} mono />
                <Field k="종료" v={fmtDateTime(game.ended_at)} mono />
                <Field k="진행시간" v={`${game.duration_hours ?? "-"}시간`} />
                <Field k="최소/최대" v={`${game.min_participants ?? "-"} / ${game.max_participants ?? "-"}`} />
                <Field k="참가비" v={fmtWon(game.fee_per_person)} />
              </div>
            </div>
            <div className="ad-panel">
              <div className="ad-section-label">설명</div>
              <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                {game.description || "등록된 경기 설명이 없습니다."}
              </p>
            </div>
          </div>

          {/* 우: 운영 메타 + 안내 메모 */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>
            <div className="ad-panel">
              <div className="ad-section-label">운영 메타</div>
              <div>
                <Field k="게임 코드" v={game.game_id ?? "-"} mono />
                <Field k="스킬 레벨" v={game.skill_level ?? "-"} />
                <Field k="신청 수" v={`${game.applications_count ?? game.game_applications.length}건`} />
                <Field k="조회수" v={`${game.views_count ?? 0}회`} />
                <Field k="최종 MVP" v={game.final_mvp ? displayUser(game.final_mvp) : "-"} />
                <Field k="생성일" v={fmtDateTime(game.created_at)} mono />
                <Field k="수정일" v={fmtDateTime(game.updated_at)} mono />
              </div>
            </div>
            <div className="ad-panel">
              <div className="ad-section-label">스코어/라인업 메모</div>
              <p style={{ color: "var(--ink-mute)", fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                이 화면은 일반 경기(픽업·게스트·연습) 관리 데이터 기준입니다. 공식 대회 경기의 스코어보드와
                라인업 기록은 대회 상세에서 읽기 전용으로 연결됩니다.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── 탭 2: 참가/라인업 ── */}
      {activeTab === "lineup" && (
        <div className="ad-panel">
          <div className="ad-section-label">참가/라인업 · 신청 {game.game_applications.length}건</div>
          {game.game_applications.length === 0 ? (
            <div className="ts-empty" style={{ padding: "40px 0" }}>
              <div className="ts-empty__icon"><Icon name="users" size={28} /></div>
              <div className="ts-empty__title">참가 신청 기록이 없습니다.</div>
            </div>
          ) : (
            <div>
              {game.game_applications.map((a) => (
                <div key={a.id.toString()} className="bo-rowitem">
                  <span className="bo-rowitem__av" style={{ background: "var(--primary)" }}>
                    {initials(displayUser(a.users))}
                  </span>
                  <div className="bo-rowitem__body">
                    <div className="bo-rowitem__t">
                      {displayUser(a.users)}
                      {a.is_guest && (
                        <span className="bo-chip" style={{ marginLeft: 8 }}>게스트</span>
                      )}
                    </div>
                    <div className="bo-rowitem__s">
                      {(a.position ?? a.users.position ?? "-")} · 신청 {fmtDateTime(a.created_at)}
                    </div>
                  </div>
                  {/* 결제(레거시 동일: 필요 시 payment_status, 아니면 불필요) */}
                  <span className="bo-rowitem__meta">
                    {a.payment_required ? `결제 ${String(a.payment_status ?? 0)}` : "결제 불필요"}
                  </span>
                  <Badge tone={APP_STATUS_TONE[a.status] ?? "grey"}>
                    {APP_STATUS_LABEL[a.status] ?? a.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── 탭 3: 리포트(평점·MVP·신고, 읽기전용 — 레거시 동일) ── */}
      {activeTab === "reports" && (
        <div className="ad-panel">
          <div className="ad-section-label">경기 리포트 · 최근 {game.game_reports.length}건</div>
          {game.game_reports.length === 0 ? (
            <div className="ts-empty" style={{ padding: "40px 0" }}>
              <div className="ts-empty__icon"><Icon name="flag" size={28} /></div>
              <div className="ts-empty__title">경기 리포트가 없습니다.</div>
            </div>
          ) : (
            <div>
              {game.game_reports.map((r) => (
                <div key={r.id.toString()} className="bo-rowitem">
                  <span className="bo-rowitem__av" style={{ background: "var(--primary)" }}>
                    {initials(displayUser(r.reporter))}
                  </span>
                  <div className="bo-rowitem__body">
                    <div className="bo-rowitem__t">
                      {displayUser(r.reporter)}
                      {r.mvp_player && (
                        <span className="bo-chip" data-tone="primary" style={{ marginLeft: 8 }}>
                          MVP {displayUser(r.mvp_player)}
                        </span>
                      )}
                    </div>
                    <div className="bo-rowitem__s">
                      {r.comment ? r.comment : "코멘트 없음"} · {fmtDateTime(r.created_at)}
                    </div>
                  </div>
                  {/* 평점 */}
                  <span className="bo-rowitem__meta">평점 {r.overall_rating ?? "-"}</span>
                  <Badge tone={REPORT_STATUS_TONE[r.status] ?? "grey"}>
                    {REPORT_STATUS_LABEL[r.status] ?? r.status}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── DL 한 줄(bo-field) — 키/값 ──
function Field({ k, v, mono }: { k: string; v: React.ReactNode; mono?: boolean }) {
  return (
    <div className="bo-field">
      <span className="bo-field__k">{k}</span>
      <span className="bo-field__v" style={mono ? { fontFamily: "var(--ff-mono)" } : undefined}>
        {v}
      </span>
    </div>
  );
}
