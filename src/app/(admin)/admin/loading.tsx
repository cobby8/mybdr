function AdminSkeleton({ className }: { className?: string }) {
  return <div className={`st-skel ${className ?? ""}`} aria-hidden="true" />;
}

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <AdminSkeleton className="h-8 w-32" />
      {/* 통계 */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-[16px] border border-[var(--color-border)] bg-white p-5 space-y-2">
            <AdminSkeleton className="h-4 w-20" />
            <AdminSkeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      {/* 테이블 */}
      <div className="rounded-[16px] border border-[var(--color-border)] bg-white overflow-hidden">
        <div className="p-4 border-b border-[var(--color-border)]">
          <AdminSkeleton className="h-5 w-24" />
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="p-4 border-b border-[var(--color-border-subtle)] flex items-center gap-4">
            <AdminSkeleton className="h-8 w-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-1">
              <AdminSkeleton className="h-4 w-32" />
              <AdminSkeleton className="h-3 w-48" />
            </div>
            <AdminSkeleton className="h-6 w-16 rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}
