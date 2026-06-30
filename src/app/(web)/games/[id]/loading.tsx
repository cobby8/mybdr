// 경기 상세 페이지 로딩 스켈레톤 — DS v4 토큰 사용 (--border, --bg-card)

export default function GameDetailLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 히어로 배너 스켈레톤 */}
      <div
        className="h-64 md:h-[400px] rounded-md"
        style={{ background: "var(--border)" }}
      />

      {/* 배지 스켈레톤 */}
      <div className="flex gap-2">
        <div className="h-6 w-14 rounded-full" style={{ background: "var(--border)" }} />
        <div className="h-6 w-14 rounded-full" style={{ background: "var(--border)" }} />
      </div>

      {/* 제목 스켈레톤 */}
      <div className="h-8 w-2/3 rounded-lg" style={{ background: "var(--border)" }} />

      {/* 단일 컬럼 스택 스켈레톤 */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            className="md:col-span-2 h-48 rounded-md"
            style={{ background: "var(--border)" }}
          />
          <div className="h-48 rounded-md" style={{ background: "var(--border)" }} />
        </div>
        {/* 참여자 스켈레톤 */}
        <div className="h-32 rounded-md" style={{ background: "var(--border)" }} />
        {/* ApplyPanel 스켈레톤 */}
        <div className="h-80 rounded-md" style={{ background: "var(--border)" }} />
      </div>
    </div>
  );
}
