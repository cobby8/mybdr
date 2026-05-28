/**
 * UB1 시안 — 카드 05 다음 회차
 *
 * 시안 원본: Dev/design/BDR-current/screens/TournamentCompleted.jsx L162~179
 *
 * 운영 데이터 매핑:
 *  - series.tournaments 에서 현재보다 edition_number 큰 것 중 가장 가까운 회차
 *  - page.tsx 가 이미 series.tournaments 를 fetch 하므로 별도 Prisma query ❌ (의뢰서 §3 제약)
 *  - D-day = startDate - 오늘 (음수면 D+N 형식 또는 hide)
 *
 * Hide 조건:
 *  - nextEdition null → 카드 미렌더 (시리즈 미가입 대회 / 마지막 회차 대회)
 *
 * 시안 css: tournament-completed.css `.tc-next*` 박제
 */

import Link from "next/link";

interface NextEdition {
  /** 다음 회차 tournament id (UUID) — Link 라우팅용 */
  id: string;
  /** 다음 회차 표시명 (예: "Vol.22 본선" 또는 "{대회명} {edition_number}회") */
  name: string;
  /** 시작일 (D-day 계산용 + meta 표시) */
  startDate: Date | null;
}

interface Props {
  /** 다음 회차 — null 시 카드 미렌더 */
  nextEdition: NextEdition | null;
}

/**
 * D-day 계산. startDate < 오늘 = D+N (이미 시작), startDate > 오늘 = D-N (대기).
 * startDate null = null 반환 → 별도 폴백 UI
 */
function computeDDay(startDate: Date | null): { sign: "-" | "+"; days: number } | null {
  if (!startDate) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(startDate);
  target.setHours(0, 0, 0, 0);
  const diffMs = target.getTime() - today.getTime();
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (days >= 0) return { sign: "-", days };
  return { sign: "+", days: Math.abs(days) };
}

export function TournamentNextEditionCard({ nextEdition }: Props) {
  // 부모(page.tsx) 가드와 별개 — 안전 가드
  if (!nextEdition) return null;

  const dday = computeDDay(nextEdition.startDate);

  // 시작일 한국어 포맷 (yyyy.MM.dd)
  const startDateText = nextEdition.startDate
    ? nextEdition.startDate.toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    : "일정 미정";

  return (
    <article className="tc-card tc-card--next">
      <header className="tc-card__head">
        <span className="tc-card__num">05</span>
        <h2 className="tc-card__h">다음 회차</h2>
        <span className="tc-card__sub">시리즈 연결</span>
      </header>
      <div className="tc-next">
        {/* D-day 박스 — startDate null 일 때 "TBD" */}
        <div className="tc-next__d">
          {dday ? `D${dday.sign}${dday.days}` : "TBD"}
        </div>
        <div>
          <div className="tc-next__name">{nextEdition.name}</div>
          <div className="tc-next__date">{startDateText} 시작</div>
        </div>
        {/* 다음 회차 페이지로 이동 — 알림 받기는 운영 미지원 → 상세 보기로 갈음 */}
        <Link
          href={`/tournaments/${nextEdition.id}`}
          className="btn btn--accent btn--touch"
        >
          상세 보기 →
        </Link>
      </div>
    </article>
  );
}
