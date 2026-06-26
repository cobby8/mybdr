function AdminSkeleton({ className }: { className?: string }) {
  return <div className={`st-skel ${className ?? ""}`} aria-hidden="true" />;
}

export default function TournamentAdminLoading() {
  return (
    <div className="space-y-6">
      <AdminSkeleton className="h-8 w-48" />
      {/* 통계 카드 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-5 space-y-2">
            <AdminSkeleton className="h-4 w-16" />
            <AdminSkeleton className="h-7 w-12" />
          </div>
        ))}
      </div>
      {/* 목록 */}
      <div className="space-y-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-[16px] border border-[var(--color-border)] bg-[var(--color-card)] p-4 flex items-center justify-between">
            <div className="space-y-2">
              <AdminSkeleton className="h-5 w-40" />
              <AdminSkeleton className="h-4 w-24" />
            </div>
            <AdminSkeleton className="h-8 w-20 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
