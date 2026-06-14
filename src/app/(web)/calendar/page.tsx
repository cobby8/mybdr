/* ============================================================
 * /calendar — 내 일정 (My Calendar) · 실데이터 연결 (PR-MOCK-TO-REAL Batch2 ②)
 *
 * 왜 빈상태 복원 → 실연결인가:
 *  - 이전(Phase 12 Batch B)에 mock(EVENTS 17건) 전량 삭제 후 준비중 빈상태로 둠.
 *  - 본 작업: 시안 .cal-* 달력 UI 복원 + 실데이터 연결.
 *  - 실측(count 2026-06-14): court_events=0행 / ttp.userId NOT NULL=357행(344유저) /
 *    tournament startDate NOT NULL=60. → tournament 일정만 실데이터, court_events는
 *    빈껍데기(0행). 코드 가드는 유지하되 현재 표시는 tournament 일정 위주.
 *
 * 어떻게:
 *  - server component(getWebSession 본인 식별). 인터랙션 0(월 이동은 미구현 — 현재 월 고정).
 *  - 일정 소스 2종:
 *      (A) tournament 일정 = ttp.userId=나 → tournamentTeam → Tournament(name/startDate). 타입 'tn'.
 *      (B) court_events = 본인 organizer 또는 court_event_players 참여. 타입 'game'/'court'.
 *          ★ 현재 0행 → 빈 배열. 가드만 코드로 유지(미래 populated 대비).
 *  - TODAY = 실제 현재일(new Date()), 표시 월 = 현재 월.
 *  - 빈상태: 비로그인 → 로그인 유도 / 일정 0건 → "예정된 일정이 없습니다"(더미 ❌).
 *  - active 탭(more)은 app-nav pathname 자동판정(/calendar) → prop 조작 0.
 * ============================================================ */

import Link from "next/link";
import { prisma } from "@/lib/db/prisma";
import { getWebSession } from "@/lib/auth/web-session";

// 일정 1건 표준 형태 — 달력 셀/사이드바 공통 사용
type CalEvent = {
  date: Date; // 일정 날짜(시각 포함 가능)
  day: number; // 표시 월 내 일(1~31), 표시 월 외면 -1
  title: string; // 제목
  type: "game" | "tn" | "court"; // 종류(경기/대회/코트) → cal-ev--* 색
  metaIcon: string; // Material Symbols 아이콘명
  metaText: string; // 보조 설명(예: "대회 · 5/16")
};

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
];
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

// 본인 일정 실데이터 조회 (read-only)
//  - tournament 일정: ttp.userId=나 → tournamentTeam.tournament(name/startDate)
//  - court_events: organizer or 참여 (현재 0행)
async function getMyEvents(userId: bigint, monthStart: Date, monthEnd: Date): Promise<CalEvent[]> {
  const events: CalEvent[] = [];

  // ── (A) tournament 일정 ──
  //  본인이 선수로 등록된 tournamentTeam 의 대회 중 startDate 보유 + 표시 월 범위 내
  const ttps = await prisma.tournamentTeamPlayer.findMany({
    where: {
      userId,
      tournamentTeam: {
        tournament: {
          startDate: { gte: monthStart, lte: monthEnd },
        },
      },
    },
    select: {
      tournamentTeam: {
        select: {
          tournament: { select: { id: true, name: true, startDate: true } },
        },
      },
    },
  });
  // 같은 대회가 여러 ttp 로 중복될 수 있어 tournamentId 로 dedupe
  const seenTn = new Set<string>();
  for (const ttp of ttps) {
    const tn = ttp.tournamentTeam?.tournament;
    if (!tn?.startDate) continue;
    if (seenTn.has(tn.id)) continue;
    seenTn.add(tn.id);
    const d = tn.startDate;
    events.push({
      date: d,
      day: d.getMonth() === monthStart.getMonth() ? d.getDate() : -1,
      title: tn.name,
      type: "tn",
      metaIcon: "emoji_events",
      metaText: `대회 · ${d.getMonth() + 1}/${d.getDate()}`,
    });
  }

  // ── (B) court_events (현재 0행 — 가드만 유지) ──
  //  본인 organizer 또는 court_event_players 참여. event_date 가 표시 월 범위 내.
  const courtEvents = await prisma.court_events.findMany({
    where: {
      event_date: { gte: monthStart, lte: monthEnd },
      OR: [
        { organizer_id: userId },
        { teams: { some: { players: { some: { user_id: userId } } } } },
      ],
    },
    select: { title: true, event_date: true, start_time: true },
  });
  for (const ev of courtEvents) {
    const d = ev.event_date;
    events.push({
      date: d,
      day: d.getMonth() === monthStart.getMonth() ? d.getDate() : -1,
      title: ev.title,
      // 코트 이벤트 = 경기 성격 → 'game' 색(시안 의미색)
      type: "game",
      metaIcon: "sports_basketball",
      metaText: ev.start_time ? `${ev.start_time} · 코트 경기` : "코트 경기",
    });
  }

  // 날짜 오름차순 정렬
  events.sort((a, b) => a.date.getTime() - b.date.getTime());
  return events;
}

export default async function CalendarPage() {
  const session = await getWebSession();

  // ── 비로그인 → 로그인 유도 카드 (더미 ❌) ──
  if (!session) {
    return (
      <div className="page">
        <div className="page__inner page__inner--wide">
          <div className="ex-crumb">
            <Link href="/">홈</Link>
            <span className="sep">›</span>
            <span className="cur">내 일정</span>
          </div>
          <div className="card">
            <div className="ex-empty">
              <span className="ico material-symbols-outlined">lock</span>
              <div className="ex-empty__t">로그인이 필요합니다</div>
              <div className="ex-empty__d">
                참가 예정 경기·대회·코트 일정을 보려면 로그인하세요.
              </div>
              <Link href="/login" className="btn btn--primary" style={{ marginTop: 14 }}>
                로그인
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const userId = BigInt(session.sub);

  // ── 현재 월 경계 + TODAY (실제 현재일) ──
  const today = new Date();
  const todayDate = today.getDate();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-indexed
  const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
  const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999); // 말일
  const monthLabel = `${year}년 ${month + 1}월`;

  // 일정 실데이터
  const events = await getMyEvents(userId, monthStart, monthEnd);

  // 일(day) → 해당 일 이벤트 목록 맵 (달력 셀용, 표시 월 내만)
  const eventsByDay = new Map<number, CalEvent[]>();
  for (const ev of events) {
    if (ev.day < 0) continue;
    const arr = eventsByDay.get(ev.day) ?? [];
    arr.push(ev);
    eventsByDay.set(ev.day, arr);
  }

  // 달력 셀 배열: 1일 요일만큼 null 패딩 → 1~말일 → 7배수 맞춤
  const firstDow = monthStart.getDay(); // 0=일
  const daysInMonth = monthEnd.getDate();
  const cells: (number | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // 다가오는 일정 = 오늘 이후(>= 오늘 00:00) 일정 상위 6건
  const startOfToday = new Date(year, month, todayDate, 0, 0, 0, 0);
  const upcoming = events.filter((e) => e.date.getTime() >= startOfToday.getTime()).slice(0, 6);

  return (
    <div className="page">
      <div className="page__inner page__inner--wide">
        {/* 브레드크럼 */}
        <div className="ex-crumb">
          <Link href="/">홈</Link>
          <span className="sep">›</span>
          <span className="cur">내 일정</span>
        </div>

        {/* 헤더 */}
        <div className="ex-head">
          <div>
            <div className="eyebrow">CALENDAR · 내 일정</div>
            <h1 className="ex-head__title">경기 · 대회 · 예약 한눈에</h1>
            <p className="ex-head__sub">참가 예정 경기와 대회, 코트 일정을 달력으로 확인하세요.</p>
          </div>
        </div>

        <div className="cal-layout">
          {/* ── 달력 카드 ── */}
          <div className="card cal-card">
            <div className="cal-bar">
              <div className="cal-bar__month">{monthLabel}</div>
            </div>
            <div className="cal-grid">
              {/* 요일 헤더 — 일요일만 강조색(.cal-dow--sun) */}
              {DOW.map((d, i) => (
                <div key={`h${i}`} className={`cal-dow${i === 0 ? " cal-dow--sun" : ""}`}>
                  {d}
                </div>
              ))}
              {/* 날짜 셀 */}
              {cells.map((d, i) => (
                <div
                  key={i}
                  className={
                    "cal-cell" +
                    (d === null ? " is-out" : "") +
                    (d === todayDate ? " is-today" : "")
                  }
                >
                  {d !== null && (
                    <>
                      <div className="cal-cell__n">{d}</div>
                      {(eventsByDay.get(d) ?? []).map((ev, j) => (
                        <div key={j} className={`cal-ev cal-ev--${ev.type}`}>
                          {ev.title}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ))}
            </div>
            {/* 범례 — 이벤트 종류색 3종(시안 의미색 유지) */}
            <div className="cal-legend">
              <span><i style={{ background: "var(--cafe-blue)" }} />경기</span>
              <span><i style={{ background: "var(--accent)" }} />대회</span>
              <span><i style={{ background: "var(--ok)" }} />코트 예약</span>
            </div>
          </div>

          {/* ── 다가오는 일정 사이드 ── */}
          <div className="card cal-card">
            <h3 className="cal-side__h">다가오는 일정</h3>
            {upcoming.length === 0 ? (
              // 일정 0건 빈상태 (더미 ❌)
              <div className="ex-empty">
                <span className="ico material-symbols-outlined">event_busy</span>
                <div className="ex-empty__t">예정된 일정이 없습니다</div>
                <div className="ex-empty__d">참가 예정 경기·대회가 생기면 여기에 표시됩니다.</div>
              </div>
            ) : (
              <div className="cal-up">
                {upcoming.map((u, i) => (
                  <div key={i} className="cal-up__row">
                    <div className="cal-up__date">
                      <div className="d">{String(u.date.getDate()).padStart(2, "0")}</div>
                      <div className="m">{MONTH_ABBR[u.date.getMonth()]}</div>
                    </div>
                    <div>
                      <div className="cal-up__t">{u.title}</div>
                      <div className="cal-up__meta">
                        <span className="ico material-symbols-outlined">{u.metaIcon}</span>
                        {u.metaText}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
