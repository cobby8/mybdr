"use client";

import type { WizardFormData, GameType, Permissions, UpgradeReason, RecentGame } from "./game-wizard";

const GAME_TYPES: {
  value: GameType;
  label: string;
  emoji: string;
  desc: string;
  lockCheck: keyof Permissions;
  upgradeReason: UpgradeReason;
}[] = [
  {
    value: "1",
    label: "게스트",
    emoji: "🤝",
    desc: "합류할 분 모집",
    lockCheck: "canCreatePickup",
    upgradeReason: "pickup_hosting",
  },
  {
    value: "0",
    label: "픽업",
    emoji: "🏀",
    desc: "자유롭게 뛰기",
    lockCheck: "canCreatePickup",
    upgradeReason: "pickup_hosting",
  },
  {
    value: "2",
    label: "팀 대결",
    emoji: "⚔️",
    desc: "정식 대결",
    lockCheck: "canCreateTeamMatch",
    upgradeReason: "team_creation",
  },
];

interface StepTypeProps {
  data: WizardFormData;
  updateData: <K extends keyof WizardFormData>(key: K, value: WizardFormData[K]) => void;
  permissions: Permissions;
  onUpgrade: (reason: UpgradeReason) => void;
  recentGames: RecentGame[];
  gamesLoading: boolean;
  onCopyGame: (game: RecentGame) => void;
  onNext: () => void;
}

export function StepType({
  data,
  updateData,
  permissions,
  onUpgrade,
  recentGames,
  gamesLoading,
  onCopyGame,
  onNext,
}: StepTypeProps) {
  const handleSelect = (type: (typeof GAME_TYPES)[number]) => {
    // 게스트 모집(value=1)은 항상 허용
    if (type.value !== "1") {
      const canCreate = permissions[type.lockCheck];
      if (!canCreate) {
        onUpgrade(type.upgradeReason);
        return;
      }
    }
    updateData("gameType", type.value);
    // 유형에 따라 기본 인원 조정
    if (type.value === "1") updateData("maxParticipants", 5);
    else if (type.value === "2") updateData("maxParticipants", 5);
    else updateData("maxParticipants", 10);
    // 바로 다음 스텝으로 이동
    setTimeout(onNext, 100);
  };

  const typeLabel = (gt: number) => {
    if (gt === 0) return "픽업";
    if (gt === 1) return "게스트";
    return "팀 대결";
  };

  const timeSince = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return "오늘";
    if (days === 1) return "어제";
    if (days < 7) return `${days}일 전`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  };

  return (
    <div aria-live="polite">
      <h2 className="mb-1 text-xl font-bold sm:text-2xl text-[var(--color-text-primary)]">어떤 경기를 만들까요?</h2>
      <p className="mb-4 text-sm text-[var(--color-text-secondary)]">유형을 선택하면 바로 다음으로 넘어가요.</p>

      {/* Game type cards — 3열 */}
      <div className="grid grid-cols-3 gap-2.5">
        {GAME_TYPES.map((type) => {
          const isLocked = type.value !== "1" && !permissions[type.lockCheck];

          return (
            <button
              key={type.value}
              type="button"
              onClick={() => handleSelect(type)}
              className={`relative flex flex-col items-center gap-1.5 rounded-[14px] border-2 p-3 text-center transition-all active:scale-[0.97] ${
                isLocked
                  ? "border-[var(--color-border)] bg-[var(--color-surface)] opacity-50"
                  : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5"
              }`}
            >
              {isLocked && (
                <span className="absolute right-1.5 top-1.5 text-xs">🔒</span>
              )}
              <span className="text-2xl">{type.emoji}</span>
              <span className="text-sm font-semibold text-[var(--color-text-primary)]">{type.label}</span>
              <span className="text-xs text-[var(--color-text-secondary)] leading-tight">{type.desc}</span>
            </button>
          );
        })}
      </div>

      {/* Copy last game */}
      <div className="mt-5">
        {gamesLoading ? (
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-[var(--color-border)]" />
            <div className="h-10 w-full animate-pulse rounded-[12px] bg-[var(--color-border)]" />
          </div>
        ) : recentGames.length > 0 ? (
          <div>
            <p className="mb-2 flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)]">
              🔄 지난 경기 복사
            </p>
            <div className="space-y-2">
              {recentGames.map((game, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onCopyGame(game)}
                  className="flex w-full items-center gap-3 rounded-[12px] border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2.5 text-left transition-colors hover:border-[var(--color-primary)]/50 hover:bg-[var(--color-primary)]/5"
                >
                  <span className="text-base">
                    {game.game_type === 0 ? "🏀" : game.game_type === 1 ? "🤝" : "⚔️"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <span className="block text-sm font-medium text-[var(--color-text-primary)] truncate">
                      {typeLabel(game.game_type)}
                    </span>
                    <span className="block text-xs text-[var(--color-text-secondary)] truncate">
                      {timeSince(game.scheduled_at)}
                      {game.venue_name && ` · ${game.venue_name}`}
                      {!game.venue_name && game.city && ` · ${game.city}`}
                    </span>
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)]">→</span>
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
