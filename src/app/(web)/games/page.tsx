import { Suspense } from "react";
import { GamesFilter } from "./games-filter";
import { GamesContent } from "./_components/games-content";
import { Skeleton } from "@/components/ui/skeleton";

// 페이지 전체 스켈레톤 (Suspense fallback용)
function PageSkeleton() {
  return (
    <div>
      {/* 헤더 스켈레톤 */}
      <div className="mb-5 flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </div>
      {/* 카드 그리드 스켈레톤 */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-[16px] bg-[var(--color-card)] border border-[var(--color-border)] overflow-hidden">
            <div className="h-1 bg-[var(--color-border)]" />
            <div className="p-3.5 space-y-2.5">
              <Skeleton className="h-4 w-14 rounded-[6px]" />
              <Skeleton className="h-4 w-3/4 rounded" />
              <Skeleton className="h-3 w-1/2 rounded" />
              <Skeleton className="h-1.5 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * /games 페이지 - 래퍼 컴포넌트
 *
 * DB 직접 호출을 제거하고, GamesContent 클라이언트 컴포넌트에 위임.
 * GamesContent가 /api/web/games API를 호출하여 데이터를 가져온다.
 *
 * [변경 이유]
 * 서버 컴포넌트에서 원격 DB를 직접 호출하면 렌더링이 DB 응답을 기다리느라
 * 무한 로딩 상태에 빠지는 문제가 있었음. 클라이언트 컴포넌트 + API route 패턴으로
 * 전환하여 페이지는 즉시 렌더링되고, 데이터는 비동기로 로드됨.
 */
export default function GamesPage() {
  return (
    <div>
      {/* Suspense로 useSearchParams() 사용하는 클라이언트 컴포넌트 감싸기 */}
      <Suspense fallback={<PageSkeleton />}>
        <GamesContent GamesFilterComponent={GamesFilter} />
      </Suspense>
    </div>
  );
}
