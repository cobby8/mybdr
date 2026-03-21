export default function GameDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 메인 카드 */}
      <div className="rounded-[16px] bg-[var(--color-card)] border border-[var(--color-border)] p-6">
        <div className="mb-4 flex gap-2">
          <div className="h-6 w-14 rounded-full bg-[var(--color-border)]" />
          <div className="h-6 w-14 rounded-full bg-[var(--color-border)]" />
        </div>
        <div className="mb-4 h-8 w-2/3 rounded-[8px] bg-[var(--color-border)]" />
        <div className="space-y-2">
          <div className="h-4 w-full rounded bg-[var(--color-border)]" />
          <div className="h-4 w-3/4 rounded bg-[var(--color-border)]" />
          <div className="h-4 w-1/2 rounded bg-[var(--color-border)]" />
        </div>
        <div className="mt-6 h-11 w-full rounded-[12px] bg-[var(--color-border)]" />
      </div>

      {/* 참가자 카드 */}
      <div className="rounded-[16px] bg-[var(--color-card)] border border-[var(--color-border)] p-6">
        <div className="mb-4 h-6 w-32 rounded bg-[var(--color-border)]" />
        <div className="space-y-2">
          <div className="h-10 w-full rounded-[12px] bg-[var(--color-border)]" />
          <div className="h-10 w-full rounded-[12px] bg-[var(--color-border)]" />
        </div>
      </div>
    </div>
  );
}
