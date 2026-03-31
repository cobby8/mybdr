// 구독 관리 페이지 로딩 스켈레톤
export default function SubscriptionLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 페이지 제목 */}
      <div className="h-8 w-28 rounded-lg bg-[var(--color-border)]" />

      {/* 현재 구독 상태 카드 */}
      <div className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 space-y-3">
        <div className="h-6 w-32 rounded bg-[var(--color-border)]" />
        <div className="h-10 w-24 rounded bg-[var(--color-border)]" />
        <div className="h-4 w-48 rounded bg-[var(--color-border)]" />
      </div>

      {/* 플랜 비교 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-6 space-y-3"
          >
            <div className="h-6 w-20 rounded bg-[var(--color-border)]" />
            <div className="h-8 w-28 rounded bg-[var(--color-border)]" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="h-4 w-full rounded bg-[var(--color-border)]" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
