/**
 * 대회 상세 히어로 섹션
 * - 디자인 시안: 전체 너비 그라디언트 배경 + 배지 + 대회명(대형) + 메타(날짜/장소/팀수)
 * - 경기장 이미지가 DB에 없으므로 다크 그라디언트 배경으로 대체
 */

import { Badge } from "@/components/ui/badge";

// 대회 포맷 한글 매핑 -- DB에 저장된 영어 포맷값을 한글로 변환
const FORMAT_LABEL: Record<string, string> = {
  single_elimination: "싱글 엘리미네이션",
  double_elimination: "더블 엘리미네이션",
  round_robin: "리그전",
  hybrid: "혼합",
  group_stage_knockout: "조별리그+토너먼트",
  GROUP_STAGE_KNOCKOUT: "조별리그+토너먼트",
  swiss: "스위스 라운드",
};

// 대회 상태 배지 매핑
const STATUS_LABEL: Record<string, { label: string; variant: "default" | "success" | "error" | "warning" | "info" }> = {
  draft:              { label: "준비중",  variant: "default" },
  active:             { label: "모집중",  variant: "info" },
  published:          { label: "모집중",  variant: "info" },
  registration:       { label: "참가접수", variant: "info" },
  registration_open:  { label: "참가접수", variant: "info" },
  registration_closed:{ label: "접수마감", variant: "warning" },
  ongoing:            { label: "진행중",  variant: "success" },
  completed:          { label: "완료",   variant: "default" },
  cancelled:          { label: "취소",   variant: "error" },
};

interface TournamentHeroProps {
  name: string;
  format: string | null;
  status: string | null;
  startDate: Date | null;
  endDate: Date | null;
  city: string | null;
  venueName: string | null;
  teamCount: number;
  maxTeams: number | null;
}

export function TournamentHero({
  name,
  format,
  status,
  startDate,
  endDate,
  city,
  venueName,
  teamCount,
  maxTeams,
}: TournamentHeroProps) {
  const statusInfo = STATUS_LABEL[status ?? "draft"] ?? { label: status ?? "draft", variant: "default" as const };
  // 포맷 한글 변환: 대소문자 무시하여 매핑 (DB 값이 대문자일 수도 있으므로)
  const formatLabel = FORMAT_LABEL[format ?? ""] ?? FORMAT_LABEL[(format ?? "").toLowerCase()] ?? format ?? "";

  // 날짜 포맷
  const dateStr = startDate
    ? `${startDate.toLocaleDateString("ko-KR")}${endDate ? ` ~ ${endDate.toLocaleDateString("ko-KR")}` : ""}`
    : null;

  // 팀 수 표시
  const teamsStr = maxTeams ? `${teamCount} / ${maxTeams}팀` : `${teamCount}팀`;

  return (
    /* 히어로 전체: 다크 그라디언트 배경 (이미지 대신) */
    /* 모바일: minHeight 축소(240px), 데스크탑: 360px 유지 */
    <section className="relative w-full overflow-hidden min-h-[240px] sm:min-h-[360px]">
      {/* 배경 그라디언트: 어두운 톤에서 primary 컬러를 살짝 비춰주는 효과 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(135deg, var(--color-surface) 0%, var(--color-elevated) 40%, var(--color-surface) 100%)",
        }}
      />
      {/* 하단 페이드: 배경색으로 자연스럽게 이어지도록 */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top, var(--color-background) 0%, transparent 60%)",
        }}
      />
      {/* 좌측에 살짝 보이는 장식 원 */}
      <div
        className="absolute -left-20 -top-20 h-80 w-80 rounded-full opacity-10"
        style={{ background: "radial-gradient(circle, var(--color-primary) 0%, transparent 70%)" }}
      />

      {/* 콘텐츠 영역: 모바일 패딩/높이 축소 */}
      <div className="relative flex h-full min-h-[240px] sm:min-h-[360px] flex-col justify-end px-4 pb-6 sm:px-10 sm:pb-10">
        {/* 배지 그룹: 상태 + 포맷 -- 모바일에서 gap/margin 축소 */}
        <div className="mb-2 flex flex-wrap items-center gap-2 sm:mb-4 sm:gap-3">
          <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
          {formatLabel && (
            <span
              className="rounded-sm px-2 py-0.5 text-[10px] font-bold tracking-wider text-white sm:px-3 sm:py-1 sm:text-xs"
              style={{ backgroundColor: "var(--color-primary)" }}
            >
              {formatLabel}
            </span>
          )}
        </div>

        {/* 대회명: 모바일 text-2xl -> sm:text-4xl -> lg:text-6xl (잘리지 않도록) */}
        <h1
          className="mb-3 text-2xl font-extrabold uppercase leading-tight tracking-tight sm:mb-6 sm:text-4xl sm:leading-none lg:text-6xl"
          style={{ fontFamily: "var(--font-heading)", color: "var(--color-text-primary)" }}
        >
          {name}
        </h1>

        {/* 메타 정보: 모바일은 세로 배치(flex-col gap-2), 데스크탑은 가로(flex-row gap-6) */}
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:gap-6">
          {dateStr && (
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                calendar_today
              </span>
              <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {dateStr}
              </span>
            </div>
          )}
          {(city || venueName) && (
            <div className="flex items-center gap-2">
              <span
                className="material-symbols-outlined text-lg"
                style={{ color: "var(--color-primary)" }}
              >
                location_on
              </span>
              <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
                {[city, venueName].filter(Boolean).join(" ")}
              </span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <span
              className="material-symbols-outlined text-lg"
              style={{ color: "var(--color-primary)" }}
            >
              groups
            </span>
            <span className="text-sm font-medium sm:text-base" style={{ color: "var(--color-text-secondary)" }}>
              {teamsStr}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
