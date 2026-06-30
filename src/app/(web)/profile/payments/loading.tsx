// 결제 내역 페이지 로딩 스켈레톤
export default function PaymentsLoading() {
  return (
    <div className="space-y-4 animate-pulse">
      {/* 페이지 제목 */}
      <div className="h-8 w-28 rounded-lg bg-[var(--border)]" />

      {/* 결제 내역 리스트 */}
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="rounded border border-[var(--border)] bg-[var(--bg-card)] p-4 space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="h-5 w-32 rounded bg-[var(--border)]" />
            <div className="h-5 w-20 rounded bg-[var(--border)]" />
          </div>
          <div className="h-4 w-48 rounded bg-[var(--border)]" />
          <div className="h-3 w-24 rounded bg-[var(--border)]" />
        </div>
      ))}
    </div>
  );
}
