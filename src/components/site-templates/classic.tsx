import Link from "next/link";
import Image from "next/image";
import type { CSSProperties } from "react";
import type { Prisma } from "@prisma/client";
import { TOURNAMENT_STATUS_LABEL, TOURNAMENT_FORMAT_LABEL, effectiveTournamentStatus } from "@/lib/constants/tournament-status";
import type {
  PublicSection,
  PublicVisibilityResult,
} from "@/lib/tournaments/public-visibility";
// 대진표 밴드/연결선 트리 — 정본 site.css .s-bracket 을 BDR 토큰으로 박제 (PR-5 5-B)
import styles from "./bracket.module.css";

// ─── 타입 ───────────────────────────────────────────────────────────────────

type Tournament = {
  id: string;
  name: string;
  format: string | null;
  startDate: Date | null;
  endDate: Date | null;
  status: string | null;
  maxTeams: number | null;
  entry_fee: Prisma.Decimal | null;
  venue_name: string | null;
};

type TeamEntry = {
  id: bigint;
  wins: number | null;
  losses: number | null;
  draws: number | null;
  points_for: number | null;
  points_against: number | null;
  status: string | null;
  team: { name: string; logoUrl: string | null; city: string | null };
};

type MatchEntry = {
  id: bigint;
  roundName: string | null;
  // 대진 그룹핑용 — page.tsx 의 tournamentMatch 쿼리가 이미 scalar 로 반환하므로 타입만 선언
  round_number: number | null;
  bracket_position: number | null;
  scheduledAt: Date | null;
  homeScore: number | null;
  awayScore: number | null;
  status: string | null;
  venue_name: string | null;
  homeTeam: { team: { name: string; logoUrl: string | null } } | null;
  awayTeam: { team: { name: string; logoUrl: string | null } } | null;
};

type SitePage = { id: bigint; title: string; content: string | null; slug: string };

type SiteData = {
  site_name: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  logoUrl: string | null;
  subdomain: string;
  siteTemplate: { slug: string; name: string } | null;
  site_pages: SitePage[];
  tournament: Tournament;
};

export type ClassicTemplateProps = {
  site: SiteData;
  teams: TeamEntry[];
  matches: MatchEntry[];
  currentPage: string;
  templateType: "classic" | "dark" | "minimal";
  visibility: PublicVisibilityResult;
};

// ─── 헬퍼 ───────────────────────────────────────────────────────────────────

function fmtDate(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

function fmtDateFull(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "Asia/Seoul",
  });
}

function fmtTime(d: Date | null | undefined): string {
  if (!d) return "";
  return new Date(d).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  });
}

// 대회 상태/형식 라벨 → 공통 상수에서 가져옴
// start/end 전달 시 종료일 경과를 반영해 "종료"로 보정 (표시 전용, 인자 없으면 원본 라벨).
function statusLabel(
  s: string | null,
  startDate?: Date | null,
  endDate?: Date | null,
): string {
  const eff = effectiveTournamentStatus(s, startDate, endDate);
  return TOURNAMENT_STATUS_LABEL[eff] ?? "대회";
}

function formatLabel(f: string | null): string {
  return TOURNAMENT_FORMAT_LABEL[f ?? ""] ?? f ?? "";
}

function TeamAvatar({ name, logoUrl, size = 8 }: { name: string; logoUrl: string | null; size?: number }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={size * 4}
        height={size * 4}
        // 팀 로고는 비율이 제각각 — contain 으로 잘림 방지 (2026-05-02)
        className={`h-${size} w-${size} rounded-full object-contain`}
        unoptimized /* 외부 도메인이 다양하므로 최적화 생략 */
      />
    );
  }
  return (
    <div
      className={`flex h-${size} w-${size} items-center justify-center rounded-full bg-(--color-border) text-xs font-bold text-(--color-text-muted)`}
    >
      {name[0]}
    </div>
  );
}

// ─── 페이지 컴포넌트 ──────────────────────────────────────────────────────────

function StatCard({ label, value, primary }: { label: string; value: number; primary: string }) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-5 text-center shadow-sm">
      <p className="text-3xl font-bold" style={{ color: primary }}>
        {value}
      </p>
      <p className="mt-1 text-sm text-(--color-text-muted)">{label}</p>
    </div>
  );
}

function MatchCard({
  match,
  primary,
  showScore = false,
}: {
  match: MatchEntry;
  primary: string;
  showScore?: boolean;
}) {
  const home = match.homeTeam?.team;
  const away = match.awayTeam?.team;
  const isCompleted = match.status === "completed";

  return (
    <div className="overflow-hidden rounded-md border border-[var(--color-border)] bg-[var(--color-card)] shadow-md">
      {/* Round label */}
      {match.roundName && (
        <div className="border-b border-(--color-border) px-4 py-2">
          <span className="text-xs font-medium text-(--color-text-muted)">{match.roundName}</span>
          {match.scheduledAt && (
            <span className="ml-2 text-xs text-(--color-text-secondary)">
              {fmtDate(match.scheduledAt)} {fmtTime(match.scheduledAt)}
            </span>
          )}
        </div>
      )}
      {/* Teams */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Home team */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamAvatar name={home?.name ?? "TBD"} logoUrl={home?.logoUrl ?? null} size={10} />
          <span className="text-sm font-medium text-(--color-text-primary)">{home?.name ?? "TBD"}</span>
        </div>
        {/* Score or VS */}
        <div className="flex flex-col items-center px-4">
          {(showScore || isCompleted) && home && away ? (
            <div className="flex items-center gap-3">
              <span
                className="text-3xl font-black"
                style={{
                  color:
                    (match.homeScore ?? 0) > (match.awayScore ?? 0) ? primary : "var(--color-text-secondary)",
                }}
              >
                {match.homeScore ?? 0}
              </span>
              <span className="text-sm text-(--color-text-secondary)">:</span>
              <span
                className="text-3xl font-black"
                style={{
                  color:
                    (match.awayScore ?? 0) > (match.homeScore ?? 0) ? primary : "var(--color-text-secondary)",
                }}
              >
                {match.awayScore ?? 0}
              </span>
            </div>
          ) : (
            <span className="text-xl font-bold sm:text-2xl text-(--color-border)">VS</span>
          )}
          {match.scheduledAt && !showScore && !isCompleted && (
            <span className="mt-1 text-xs text-(--color-text-secondary)">
              {fmtDate(match.scheduledAt)} {fmtTime(match.scheduledAt)}
            </span>
          )}
        </div>
        {/* Away team */}
        <div className="flex flex-1 flex-col items-center gap-2">
          <TeamAvatar name={away?.name ?? "TBD"} logoUrl={away?.logoUrl ?? null} size={10} />
          <span className="text-sm font-medium text-(--color-text-primary)">{away?.name ?? "TBD"}</span>
        </div>
      </div>
      {match.venue_name && (
        <div className="border-t border-(--color-border) px-4 py-2 text-center text-xs text-(--color-text-secondary)">
          📍 {match.venue_name}
        </div>
      )}
    </div>
  );
}

// ─── 홈 페이지 ─────────────────────────────────────────────────────────────

function HomePage({
  teams,
  matches,
  primary,
}: {
  teams: TeamEntry[];
  matches: MatchEntry[];
  primary: string;
}) {
  const upcoming = matches.filter((m) => m.status === "scheduled" || m.status === "in_progress");
  const completed = matches.filter((m) => m.status === "completed");

  return (
    <div className="space-y-10">
      {/* 통계 */}
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="참가팀" value={teams.length} primary={primary} />
        <StatCard label="예정 경기" value={upcoming.length} primary={primary} />
        <StatCard label="완료 경기" value={completed.length} primary={primary} />
      </div>

      {/* 팀 순위 */}
      {teams.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-(--color-text-primary)">팀 순위</h2>
            <Link href="/teams" className="text-sm font-medium hover:opacity-80" style={{ color: primary }}>
              전체 보기 →
            </Link>
          </div>
          <div className="overflow-hidden rounded-md border border-[var(--color-border)] shadow-md">
            <table className="w-full">
              <thead>
                <tr className="border-b border-(--color-border) bg-(--color-surface) text-xs font-medium text-(--color-text-muted)">
                  <th className="px-4 py-3 text-left">순위</th>
                  <th className="px-4 py-3 text-left">팀</th>
                  <th className="px-4 py-3 text-center">승</th>
                  <th className="px-4 py-3 text-center">패</th>
                  <th className="hidden px-4 py-3 text-center md:table-cell">득실</th>
                </tr>
              </thead>
              <tbody>
                {teams.slice(0, 5).map((t, i) => (
                  <tr
                    key={t.id.toString()}
                    className="border-b border-(--color-border) last:border-0 hover:bg-(--color-surface)"
                  >
                    <td className="px-4 py-3">
                      {/* 순위 색상: 1위(금)/3위(동)은 warning 토큰으로 통일 — 하드코딩 제거 */}
                      <span
                        className={`text-sm font-bold ${
                          i === 0
                            ? "text-(--color-warning)"
                            : i === 1
                            ? "text-(--color-text-secondary)"
                            : i === 2
                            ? "text-(--color-warning)"
                            : "text-[var(--color-text-disabled)]"
                        }`}
                      >
                        {i + 1}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <TeamAvatar name={t.team.name} logoUrl={t.team.logoUrl} size={7} />
                        <span className="text-sm font-medium text-(--color-text-primary)">{t.team.name}</span>
                        {t.team.city && (
                          <span className="hidden text-xs text-(--color-text-secondary) md:inline">
                            {t.team.city}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-(--color-text-primary)">
                      {t.wins ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-(--color-text-muted)">
                      {t.losses ?? 0}
                    </td>
                    <td className="hidden px-4 py-3 text-center text-sm text-(--color-text-muted) md:table-cell">
                      {(t.points_for ?? 0) - (t.points_against ?? 0) >= 0 ? "+" : ""}
                      {(t.points_for ?? 0) - (t.points_against ?? 0)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* 다음 경기 */}
      {upcoming.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-(--color-text-primary)">다음 경기</h2>
            <Link href="/schedule" className="text-sm font-medium hover:opacity-80" style={{ color: primary }}>
              전체 일정 →
            </Link>
          </div>
          <MatchCard match={upcoming[0]} primary={primary} />
        </section>
      )}

      {/* 최근 결과 */}
      {completed.length > 0 && (
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-bold text-(--color-text-primary)">최근 결과</h2>
            <Link href="/results" className="text-sm font-medium hover:opacity-80" style={{ color: primary }}>
              전체 결과 →
            </Link>
          </div>
          <div className="space-y-3">
            {[...completed].reverse().slice(0, 3).map((m) => (
              <MatchCard key={m.id.toString()} match={m} primary={primary} showScore />
            ))}
          </div>
        </section>
      )}

      {/* 데이터 없음 */}
      {teams.length === 0 && matches.length === 0 && (
        <div className="py-16 text-center text-(--color-text-secondary)">
          <p className="text-5xl mb-4">🏀</p>
          <p className="text-lg font-medium text-(--color-text-muted)">대회가 준비 중입니다</p>
          <p className="mt-1 text-sm">곧 정보가 업데이트될 예정입니다</p>
        </div>
      )}
    </div>
  );
}

// ─── 팀 페이지 ─────────────────────────────────────────────────────────────

function TeamsPage({ teams, primary }: { teams: TeamEntry[]; primary: string }) {
  if (teams.length === 0) {
    return (
      <div className="py-20 text-center text-(--color-text-secondary)">
        <p className="text-5xl mb-4">👥</p>
        <p className="text-lg font-medium text-(--color-text-muted)">참가 팀이 아직 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-(--color-text-primary)">참가팀 ({teams.length})</h2>
      <div className="overflow-hidden rounded-md border border-[var(--color-border)] shadow-md">
        <table className="w-full">
          <thead>
            <tr className="border-b border-(--color-border) bg-(--color-surface) text-xs font-medium text-(--color-text-muted)">
              <th className="px-4 py-3 text-left">순위</th>
              <th className="px-4 py-3 text-left">팀명</th>
              <th className="px-4 py-3 text-center">승</th>
              <th className="px-4 py-3 text-center">패</th>
              <th className="hidden px-4 py-3 text-center md:table-cell">무</th>
              <th className="hidden px-4 py-3 text-center md:table-cell">득점</th>
              <th className="hidden px-4 py-3 text-center md:table-cell">실점</th>
              <th className="hidden px-4 py-3 text-center md:table-cell">득실차</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((t, i) => (
              <tr
                key={t.id.toString()}
                className="border-b border-(--color-border) last:border-0 hover:bg-(--color-surface)"
              >
                <td className="px-4 py-3 text-center">
                  {/* 순위 색상: 1위(금)/3위(동)은 warning 토큰으로 통일 — 하드코딩 제거 */}
                  <span
                    className={`text-sm font-bold ${
                      i === 0
                        ? "text-(--color-warning)"
                        : i === 1
                        ? "text-(--color-text-secondary)"
                        : i === 2
                        ? "text-(--color-warning)"
                        : "text-[var(--color-text-disabled)]"
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <TeamAvatar name={t.team.name} logoUrl={t.team.logoUrl} size={9} />
                    <div>
                      <p className="text-sm font-semibold text-(--color-text-primary)">{t.team.name}</p>
                      {t.team.city && (
                        <p className="text-xs text-(--color-text-secondary)">{t.team.city}</p>
                      )}
                    </div>
                  </div>
                </td>
                <td
                  className="px-4 py-3 text-center text-sm font-semibold"
                  style={{ color: primary }}
                >
                  {t.wins ?? 0}
                </td>
                <td className="px-4 py-3 text-center text-sm text-(--color-text-muted)">
                  {t.losses ?? 0}
                </td>
                <td className="hidden px-4 py-3 text-center text-sm text-(--color-text-muted) md:table-cell">
                  {t.draws ?? 0}
                </td>
                <td className="hidden px-4 py-3 text-center text-sm text-(--color-text-muted) md:table-cell">
                  {t.points_for ?? 0}
                </td>
                <td className="hidden px-4 py-3 text-center text-sm text-(--color-text-muted) md:table-cell">
                  {t.points_against ?? 0}
                </td>
                <td className="hidden px-4 py-3 text-center text-sm md:table-cell" style={{ color: primary }}>
                  {(t.points_for ?? 0) - (t.points_against ?? 0) >= 0 ? "+" : ""}
                  {(t.points_for ?? 0) - (t.points_against ?? 0)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── 일정 페이지 ────────────────────────────────────────────────────────────

function SchedulePage({
  matches,
  primary,
}: {
  matches: MatchEntry[];
  primary: string;
}) {
  const upcoming = matches.filter((m) => m.status !== "completed");

  if (upcoming.length === 0) {
    return (
      <div className="py-20 text-center text-(--color-text-secondary)">
        <p className="text-5xl mb-4">📅</p>
        <p className="text-lg font-medium text-(--color-text-muted)">예정된 경기가 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-(--color-text-primary)">경기 일정 ({upcoming.length})</h2>
      <div className="space-y-3">
        {upcoming.map((m) => (
          <MatchCard key={m.id.toString()} match={m} primary={primary} />
        ))}
      </div>
    </div>
  );
}

// ─── 결과 페이지 ────────────────────────────────────────────────────────────

function ResultsPage({
  matches,
  primary,
}: {
  matches: MatchEntry[];
  primary: string;
}) {
  const completed = matches.filter((m) => m.status === "completed");

  if (completed.length === 0) {
    return (
      <div className="py-20 text-center text-(--color-text-secondary)">
        <p className="text-5xl mb-4">🏆</p>
        <p className="text-lg font-medium text-(--color-text-muted)">완료된 경기가 없습니다</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-xl font-bold text-(--color-text-primary)">경기 결과 ({completed.length})</h2>
      <div className="space-y-3">
        {[...completed].reverse().map((m) => (
          <MatchCard key={m.id.toString()} match={m} primary={primary} showScore />
        ))}
      </div>
    </div>
  );
}

// ─── 대진 페이지 ────────────────────────────────────────────────────────────
// 정본 BracketPage(public-site-pages.jsx) 밴드/연결선 트리를 운영 실데이터로 박제.
// 데이터: 운영 매치 중 라운드/슬롯(round_number·bracket_position)이 둘 다 있는 대진 경기만 파생
//   (예선/순위전 매치 제외). mock 0 — 실 매치 파생만.
function BracketPage({
  matches,
  primary,
  showScore,
}: {
  matches: MatchEntry[];
  primary: string;
  showScore: boolean;
}) {
  // 대진 경기 = round_number·bracket_position 둘 다 존재
  const bracketMatches = matches.filter(
    (m) => m.round_number != null && m.bracket_position != null,
  );

  // 라운드(round_number) 오름차순 그룹핑 → 8강·4강·결승 순서로 왼→오 배치
  const roundMap = new Map<number, MatchEntry[]>();
  for (const m of bracketMatches) {
    const r = m.round_number as number;
    if (!roundMap.has(r)) roundMap.set(r, []);
    roundMap.get(r)!.push(m);
  }
  const rounds = [...roundMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([roundNumber, games]) => ({
      roundNumber,
      // 라운드명 = roundName 우선, 없으면 "N라운드"
      name: games[0]?.roundName ?? `${roundNumber}라운드`,
      // 슬롯(bracket_position) 순서대로 — 트리 세로 배치 기준
      games: [...games].sort(
        (a, b) => (a.bracket_position ?? 0) - (b.bracket_position ?? 0),
      ),
    }));

  // show 인데 아직 대진 경기가 없으면 준비중 안내(방어적 fallback)
  if (rounds.length === 0) {
    return (
      <div>
        <h2 className="mb-1 text-xl font-bold text-(--color-text-primary)">대진표</h2>
        <p className="mb-6 text-sm text-(--color-text-muted)">결선 토너먼트</p>
        <SectionPlaceholder
          title="대진 준비 중"
          description="조별리그 종료 후 조 1·2위가 가려지면 결선 대진이 공개됩니다."
        />
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-1 text-xl font-bold text-(--color-text-primary)">대진표</h2>
      <p className="mb-6 text-sm text-(--color-text-muted)">
        결선 토너먼트 — 각 라운드 승자가 다음 라운드로 진출합니다
      </p>
      {/* 정본 s-bracket: 가로 스크롤 라운드 컬럼 + 밴드/연결선.
          --bk-primary = 사이트 primary 주입(승자 강조 동적 대응, 하드코딩 hex 0). */}
      <div
        className={styles.bracket}
        style={{ ["--bk-primary"]: primary } as CSSProperties}
      >
        {rounds.map((rd) => (
          <div key={rd.roundNumber} className={styles.col}>
            <div className={styles.colHead}>
              <span>{rd.name}</span>
            </div>
            <div className={styles.colBody}>
              {rd.games.map((g) => {
                const home = g.homeTeam?.team;
                const away = g.awayTeam?.team;
                // 스코어는 live/ended 상태 + 완료 경기에서만 노출 (정본 동일)
                const done = showScore && g.status === "completed";
                const homeWin = done && (g.homeScore ?? 0) > (g.awayScore ?? 0);
                const awayWin = done && (g.awayScore ?? 0) > (g.homeScore ?? 0);
                return (
                  <div key={g.id.toString()} className={styles.cell}>
                    <div className={styles.game}>
                      <div className={`${styles.row} ${homeWin ? styles.rowWin : ""}`}>
                        <span className={styles.nm}>{home?.name ?? "TBD"}</span>
                        <span className={styles.sc}>{done ? g.homeScore ?? 0 : "–"}</span>
                      </div>
                      <div className={`${styles.row} ${awayWin ? styles.rowWin : ""}`}>
                        <span className={styles.nm}>{away?.name ?? "TBD"}</span>
                        <span className={styles.sc}>{done ? g.awayScore ?? 0 : "–"}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SectionPlaceholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] px-6 py-16 text-center shadow-sm">
      <p className="text-lg font-bold text-[var(--color-text-primary)]">{title}</p>
      <p className="mt-2 text-sm text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}

// ─── 참가신청 페이지 ─────────────────────────────────────────────────────────

function RegistrationPage({
  tournament,
  primary,
}: {
  tournament: Tournament;
  primary: string;
}) {
  // 상태별 색상 - 의미적 고정 색상이므로 하드코딩 유지 (시맨틱 컬러)
  const statusColors: Record<string, string> = {
    registration_open: "#22C55E",
    registration_closed: "#EF4444",
    ongoing: "#E31B23",
    completed: "#9CA3AF",
  };
  const statusColor = statusColors[tournament.status ?? ""] ?? "#6B7280";

  return (
    <div className="mx-auto max-w-xl">
      <h2 className="mb-6 text-xl font-bold text-(--color-text-primary)">참가 신청</h2>

      <div className="space-y-4">
        {/* 신청 상태 */}
        <div className="flex items-center justify-between rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-sm">
          <span className="text-sm font-medium text-(--color-text-muted)">신청 현황</span>
          <span className="text-sm font-bold" style={{ color: statusColor }}>
            ● {statusLabel(tournament.status, tournament.startDate, tournament.endDate)}
          </span>
        </div>

        {/* 정보 카드 */}
        <div className="rounded-md border border-[var(--color-border)] bg-[var(--color-card)] p-6 shadow-sm">
          <h3 className="mb-4 text-base font-semibold text-(--color-text-primary)">대회 정보</h3>
          <dl className="space-y-3 text-sm">
            {tournament.format && (
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">방식</dt>
                <dd className="font-medium text-(--color-text-primary)">{formatLabel(tournament.format)}</dd>
              </div>
            )}
            {tournament.maxTeams && (
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">최대 참가팀</dt>
                <dd className="font-medium text-(--color-text-primary)">{tournament.maxTeams}팀</dd>
              </div>
            )}
            {tournament.startDate && (
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">대회 기간</dt>
                <dd className="font-medium text-(--color-text-primary)">
                  {fmtDateFull(tournament.startDate)}
                  {tournament.endDate && ` ~ ${fmtDateFull(tournament.endDate)}`}
                </dd>
              </div>
            )}
            {tournament.venue_name && (
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">장소</dt>
                <dd className="font-medium text-(--color-text-primary)">{tournament.venue_name}</dd>
              </div>
            )}
            {tournament.entry_fee !== null && tournament.entry_fee !== undefined && (
              <div className="flex justify-between">
                <dt className="text-(--color-text-muted)">참가비</dt>
                <dd className="font-medium text-(--color-text-primary)">
                  {Number(tournament.entry_fee) === 0
                    ? "무료"
                    : `₩${Number(tournament.entry_fee).toLocaleString()}`}
                </dd>
              </div>
            )}
          </dl>
        </div>

        {/* CTA */}
        {tournament.status === "registration_open" ? (
          <a
            href={`https://mybdr.kr/tournaments/${tournament.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-sm py-4 text-center text-[13px] font-black uppercase tracking-widest text-white transition-opacity hover:opacity-90 shadow-glow-primary"
            style={{ backgroundColor: primary }}
          >
            신청하기 →
          </a>
        ) : (
          <div className="rounded-sm bg-[var(--color-surface)] p-4 text-center text-[11px] font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
            {tournament.status === "completed"
              ? "대회가 종료되었습니다"
              : "현재 참가 신청을 받지 않습니다"}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── 메인 템플릿 ─────────────────────────────────────────────────────────────

const NAV_LINKS = [
  { href: "/", label: "홈", page: "home", section: "overview" },
  { href: "/teams", label: "팀", page: "teams", section: "teams" },
  { href: "/schedule", label: "일정", page: "schedule", section: "schedule" },
  // PR-5 5-B: 대진 탭 — visibleNavLinks 필터가 bracket==="hide" 면 자동 숨김(정본 위치 = 일정·결과 사이)
  { href: "/bracket", label: "대진", page: "bracket", section: "bracket" },
  { href: "/results", label: "결과", page: "results", section: "results" },
  { href: "/registration", label: "참가신청", page: "registration", section: "registration" },
] satisfies Array<{
  href: string;
  label: string;
  page: string;
  section: PublicSection;
}>;

export function ClassicTemplate({
  site,
  teams,
  matches,
  currentPage,
  templateType,
  visibility,
}: ClassicTemplateProps) {
  const primary = site.primaryColor ?? "#1B3C87";
  const secondary = site.secondaryColor ?? "#E76F51";
  const siteName = site.site_name ?? site.tournament.name;

  // dark 템플릿은 어두운 배경으로 변형 - CSS 변수가 자동으로 다크/라이트 대응
  const isDark = templateType === "dark";
  const bgBase = isDark ? "#0F172A" : "var(--color-card)";
  const bgHero = isDark
    ? `linear-gradient(160deg, ${primary}30 0%, #0F172A 60%)`
    : `linear-gradient(160deg, ${primary}12 0%, ${secondary}08 100%)`;
  const textPrimary = isDark ? "#F1F5F9" : "var(--color-text-primary)";
  const textSecondary = isDark ? "#94A3B8" : "var(--color-text-muted)";
  const borderColor = isDark ? "#1E293B" : "var(--color-border)";
  const visibleNavLinks = NAV_LINKS.filter(
    (link) => visibility.sections[link.section] !== "hide",
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: bgBase }}>
      {/* 네비게이션 */}
      <header style={{ backgroundColor: primary }}>
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {site.logoUrl ? (
              <Image src={site.logoUrl} alt={`${siteName} 로고`} width={32} height={32} className="h-8 w-8 rounded-full object-cover" unoptimized />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-sm font-bold text-white">
                {siteName[0]}
              </div>
            )}
            <span className="text-lg font-bold text-white">{siteName}</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden gap-1 md:flex">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.page}
                href={link.href}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  currentPage === link.page
                    ? "bg-white/20 text-white"
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Mobile nav */}
          <nav className="flex gap-4 md:hidden">
            {visibleNavLinks.slice(0, 4).map((link) => (
              <Link
                key={link.page}
                href={link.href}
                className={`text-xs font-medium ${
                  currentPage === link.page ? "text-white" : "text-white/70"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      {/* 히어로 */}
      <div
        className="border-b py-12 text-center"
        style={{
          background: bgHero,
          borderColor: isDark ? "#1E293B" : "var(--color-border)",
        }}
      >
        <span
          className="mb-3 inline-block rounded-full px-3 py-1 text-xs font-semibold text-white"
          style={{ backgroundColor: primary }}
        >
          {statusLabel(site.tournament.status, site.tournament.startDate, site.tournament.endDate)}
        </span>
        <h1
          className="mb-3 text-3xl font-black md:text-4xl"
          style={{ color: textPrimary }}
        >
          {site.tournament.name}
        </h1>
        <div
          className="flex flex-wrap items-center justify-center gap-3 text-sm"
          style={{ color: textSecondary }}
        >
          {site.tournament.format && (
            <span className="rounded-full border px-3 py-1 text-xs" style={{ borderColor }}>
              {formatLabel(site.tournament.format)}
            </span>
          )}
          {site.tournament.startDate && (
            <span>
              {fmtDateFull(site.tournament.startDate)}
              {site.tournament.endDate ? ` ~ ${fmtDateFull(site.tournament.endDate)}` : ""}
            </span>
          )}
          {site.tournament.venue_name && (
            <span>📍 {site.tournament.venue_name}</span>
          )}
        </div>
      </div>

      {/* 콘텐츠 */}
      <main className="mx-auto max-w-5xl px-4 py-10">
        {currentPage === "teams" ? (
          <TeamsPage teams={teams} primary={primary} />
        ) : currentPage === "schedule" && visibility.sections.schedule === "prep" ? (
          <SectionPlaceholder
            title="일정 준비 중"
            description="운영자가 경기 일정과 코트를 확정하면 이곳에 공개됩니다."
          />
        ) : currentPage === "schedule" ? (
          <SchedulePage matches={matches} primary={primary} />
        ) : currentPage === "bracket" && visibility.sections.bracket === "prep" ? (
          // PR-5 5-B: 대진 prep — 정본 카피(조 1·2위 확정 후 공개). schedule/results prep 과 동일 패턴.
          <SectionPlaceholder
            title="대진 준비 중"
            description="조별리그 종료 후 조 1·2위가 가려지면 결선 대진이 공개됩니다."
          />
        ) : currentPage === "bracket" ? (
          // show 상태 — 실 매치 파생 대진 트리. 스코어는 live/ended 에서만 노출.
          <BracketPage
            matches={matches}
            primary={primary}
            showScore={visibility.state === "live" || visibility.state === "ended"}
          />
        ) : currentPage === "results" && visibility.sections.results === "prep" ? (
          // PR-5 5-A §정합: 미발행/종료-미보유 시 공식 기록 prep 카피(정본 public-site-pages.jsx).
          //   mock 기사/가짜 데이터 0 — "준비중" 안내만. SectionPlaceholder = BDR var(--color-*).
          <SectionPlaceholder
            title="공식 기록 준비 중"
            description="대회 공식 스탯과 기사는 집계 후 게시됩니다. 준비되면 이 영역에 공개됩니다."
          />
        ) : currentPage === "results" ? (
          <ResultsPage matches={matches} primary={primary} />
        ) : currentPage === "registration" ? (
          <RegistrationPage tournament={site.tournament} primary={primary} />
        ) : (
          <HomePage teams={teams} matches={matches} primary={primary} />
        )}
      </main>

      {/* 푸터 */}
      <footer
        className="mt-16 border-t py-8 text-center text-sm"
        style={{ borderColor, color: textSecondary }}
      >
        <p>
          Powered by{" "}
          <a
            href="https://mybdr.kr"
            className="font-semibold hover:opacity-80"
            style={{ color: primary }}
          >
            MyBDR
          </a>
        </p>
      </footer>
    </div>
  );
}
