import Link from "next/link";
import type { games } from "@prisma/client";

type GameCardData = Pick<
  games,
  | "id" | "uuid" | "title" | "status" | "game_type"
  | "city" | "venue_name" | "scheduled_at"
  | "current_participants" | "max_participants"
  | "fee_per_person" | "skill_level"
>;

const TYPE_BADGE: Record<number, { label: string; color: string; bg: string }> = {
  0: { label: "픽업",   color: "#2563EB", bg: "rgba(37,99,235,0.12)" },
  1: { label: "게스트", color: "#16A34A", bg: "rgba(22,163,74,0.12)" },
  2: { label: "연습",   color: "#D97706", bg: "rgba(217,119,6,0.12)" },
};

const STATUS_LABEL: Record<number, { text: string; color: string }> = {
  1: { text: "모집중", color: "#16A34A" },
  2: { text: "확정",   color: "#2563EB" },
  3: { text: "완료",   color: "#6B7280" },
  4: { text: "취소",   color: "#EF4444" },
};

const SKILL_BADGE: Record<string, { label: string; color: string; bg: string }> = {
  beginner:               { label: "초급",   color: "#16A34A", bg: "rgba(22,163,74,0.10)" },
  intermediate:           { label: "중급",   color: "#2563EB", bg: "rgba(37,99,235,0.10)" },
  intermediate_advanced:  { label: "중상",   color: "#D97706", bg: "rgba(217,119,6,0.10)" },
  advanced:               { label: "고급",   color: "#DC2626", bg: "rgba(220,38,38,0.10)" },
};

export function GameCardCompact({ game }: { game: GameCardData }) {
  const href = `/games/${game.uuid?.slice(0, 8) ?? game.id}`;
  const badge = TYPE_BADGE[game.game_type] ?? TYPE_BADGE[0];
  const status = STATUS_LABEL[game.status] ?? null;
  const skill = game.skill_level && game.skill_level !== "all" ? SKILL_BADGE[game.skill_level] : null;
  const cur = game.current_participants ?? 0;
  const max = game.max_participants ?? 0;
  const pct = max > 0 ? Math.min((cur / max) * 100, 100) : 0;
  const barColor = pct >= 100 ? "#EF4444" : pct >= 80 ? "#D97706" : "#1B3C87";
  const location = game.venue_name ?? game.city ?? "";
  const fee = game.fee_per_person && Number(game.fee_per_person) > 0
    ? `${(Number(game.fee_per_person) / 1000).toFixed(0)}천원`
    : null;

  const dateStr = game.scheduled_at
    ? `${game.scheduled_at.toLocaleDateString("ko-KR", { month: "numeric", day: "numeric", timeZone: "Asia/Seoul" })} ${game.scheduled_at.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Seoul" })}`
    : "";

  return (
    <Link href={href}>
      <div className="flex h-full flex-col rounded-[14px] border border-[#E8ECF0] bg-[#FFFFFF] p-3 transition-all hover:-translate-y-0.5 hover:shadow-md"
           style={{ borderTop: `3px solid ${badge.color}` }}>
        {/* Row 1: 유형 뱃지 + 상태 */}
        <div className="mb-1.5 flex items-center justify-between">
          <span
            className="rounded-full px-2 py-[1px] text-[10px] font-bold leading-tight"
            style={{ backgroundColor: badge.bg, color: badge.color }}
          >
            {badge.label}
          </span>
          {status && (
            <span className="text-[10px] font-semibold" style={{ color: status.color }}>
              {status.text}
            </span>
          )}
        </div>

        {/* Row 2: 제목 */}
        <h3 className="mb-1 text-[13px] font-bold text-[#111827] line-clamp-1 leading-tight">
          {game.title}
        </h3>

        {/* Row 3: 날짜 */}
        {dateStr && (
          <p className="text-xs text-[#9CA3AF] line-clamp-1">{dateStr}</p>
        )}
        {/* Row 4: 장소 */}
        {location && (
          <p className="mb-1.5 text-xs text-[#9CA3AF] line-clamp-1">{location}</p>
        )}

        {/* Row 5: 참가바 */}
        {max > 0 && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[#E8ECF0]">
              <div
                className="absolute left-0 top-0 h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: barColor }}
              />
            </div>
            <span className="text-[10px] font-medium text-[#6B7280]">{cur}/{max}</span>
          </div>
        )}

        {/* Row 6: 참가비 + 난이도 */}
        <div className="mt-auto flex items-center justify-between">
          <span className="text-xs text-[#9CA3AF]">
            {fee ? <span className="font-medium">{fee}</span> : "무료"}
          </span>
          {skill && (
            <span
              className="rounded-full px-2 py-[1px] text-[10px] font-bold"
              style={{ backgroundColor: skill.bg, color: skill.color }}
            >
              {skill.label}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
