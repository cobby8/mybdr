"use client";

/* ============================================================
 * RecommendedVideos — BDR 추천 영상 섹션 (유튜브 스타일 카드 + RecommendedRail 통일 헤더)
 *
 * 5/10 재설계 (사용자 결정):
 * 기존 = 3개 큰 카드 / NBA 2K 톤 (uppercase + 네온 글로우 + 시점만 메타)
 * 변경 = 5개 압축 카드 / 유튜브 톤 (mixed case + duration chip + 채널명 + 조회수+시점)
 *
 * 왜 유튜브 톤인가:
 * - 사용자가 평소 영상 콘텐츠 = 유튜브에서 본다 → 유튜브 카드 = 친숙한 스캔 패턴
 * - 영상시간 chip / 채널명 / 조회수 = 사용자가 클릭 전 판단하는 핵심 메타
 * - uppercase 굵은 폰트 (2K 톤) → 영상 4~5줄 제목 가독성 떨어짐
 *
 * 카드 구조:
 *   ┌──────────────────────┐
 *   │  [LIVE]      [22:47] │  ← 16:9 썸네일 + 좌상 LIVE / 우하 duration chip
 *   │  (썸네일 16:9)        │
 *   └──────────────────────┘
 *   🏀 BDR 썰전 EP11 ...        ← 제목 2줄 line-clamp 굵게 (시안 권장 13px)
 *   [BDR]동아리농구방            ← 채널명 작은 회색
 *   조회수 5.1천 · 5일 전        ← 메타 더 작은 회색
 *
 * 레이아웃:
 * - 헤더 = RecommendedRail wrapper (eyebrow / title / "전체 보기 →") 그대로 재사용
 * - 카드 grid = RecommendedRail 의 gridAutoFlow:column (가로 스크롤 + scroll-snap)
 * - PC = 카드 폭 minmax(260, 1fr) → 본문 폭에 따라 4~5개 노출 + 나머지 스크롤
 * - 모바일 = 동일 가로 스크롤 (snap-x) — 한 번에 1.5~2개 노출
 *
 * API/데이터 패칭 변경 0 — 기존 useSWR 그대로 사용. duration / channel_title 신규 응답 필드.
 * ============================================================ */

import useSWR from "swr";
import { Skeleton } from "@/components/ui/skeleton";
import { RecommendedRail } from "@/components/bdr-v2/recommended-rail";

interface VideoItem {
  video_id: string;
  title: string;
  thumbnail: string;
  published_at: string;
  view_count?: number;
  duration?: string; // ISO 8601 (예: "PT22M47S")
  channel_title?: string;
  badges: string[];
  is_live: boolean;
}

/* 더미 데이터: API 로딩 실패 / 비어있을 시 폴백 (유튜브 톤 메타) */
const DUMMY_VIDEOS = [
  {
    video_id: "dummy1",
    title: "2026 서울 챌린지 베스트 골 TOP 10",
    thumbnail: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=480&q=60",
    duration_text: "12:45",
    channel_title: "[BDR]동아리농구방",
    views_text: "조회수 24.5만",
    date_text: "2일 전",
  },
  {
    video_id: "dummy2",
    title: "실전 드리블 기술 가이드 — 코트에서 바로 써먹는",
    thumbnail: "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=480&q=60",
    duration_text: "8:20",
    channel_title: "[BDR]동아리농구방",
    views_text: "조회수 12.8만",
    date_text: "1주 전",
  },
  {
    video_id: "dummy3",
    title: "STORM FC 우승 비결 인터뷰",
    thumbnail: "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=480&q=60",
    duration_text: "15:10",
    channel_title: "[BDR]동아리농구방",
    views_text: "조회수 5.2만",
    date_text: "3일 전",
  },
  {
    video_id: "dummy4",
    title: "매치데이 브이로그 — 대회 현장의 열기",
    thumbnail: "https://images.unsplash.com/photo-1504450758481-7338bbe75005?w=480&q=60",
    duration_text: "5:45",
    channel_title: "[BDR]동아리농구방",
    views_text: "조회수 1.9만",
    date_text: "22시간 전",
  },
  {
    video_id: "dummy5",
    title: "시즌 베스트 어시스트 모음",
    thumbnail: "https://images.unsplash.com/photo-1518131672697-613becd4fab5?w=480&q=60",
    duration_text: "7:30",
    channel_title: "[BDR]동아리농구방",
    views_text: "조회수 8.4만",
    date_text: "5일 전",
  },
];

// 카드 폭 — RecommendedRail gridAutoColumns minmax 260px 와 정합
// shrink-0 + 고정 폭 = 가로 스크롤 시 카드 폭 일정 보장
const CARD_WIDTH_CLASS = "shrink-0 w-[260px]";

export function RecommendedVideos() {
  // useSWR로 YouTube 추천 API 호출 (기존과 동일)
  const { data: apiData, isLoading: loading } = useSWR<{ videos: VideoItem[] }>(
    "/api/web/youtube/recommend"
  );
  const videos = apiData?.videos ?? [];

  if (loading) {
    // 로딩 스켈레톤 — RecommendedRail 헤더와 같은 폭으로 통일
    return (
      <section>
        <Skeleton className="h-6 w-32 mb-4" />
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className={CARD_WIDTH_CLASS}>
              <Skeleton className="aspect-video w-full rounded-md mb-2" />
              <Skeleton className="h-4 w-full mb-1" />
              <Skeleton className="h-3 w-3/4 mb-1" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  const hasApiData = videos.length > 0;

  // 시안 line 124~132 매핑: BDR 추천 영상 / WATCH NOW · YOUTUBE / YouTube 채널 외부 링크
  return (
    <RecommendedRail
      title="BDR 추천 영상"
      eyebrow="WATCH NOW · YOUTUBE"
      more={{ href: "https://www.youtube.com/@BDRBASKET", label: "전체 보기" }}
    >
      {/* 카드 영역 — RecommendedRail 의 가로 스크롤 grid 가 담당.
          children 직접 배치. 5개로 제한 (slice 0,5). */}
      <>
        {hasApiData
          ? videos.slice(0, 5).map((v) => (
              <YoutubeCard
                key={v.video_id}
                videoId={v.video_id}
                title={v.title}
                thumbnail={v.thumbnail}
                durationText={formatDuration(v.duration)}
                channelTitle={v.channel_title}
                viewsText={
                  // 조회수 = 유튜브 라이브일 때 "실시간 시청자 X" / VOD 일 때 "조회수 X"
                  v.is_live
                    ? v.view_count
                      ? `실시간 ${formatViewCount(v.view_count)}`
                      : "실시간"
                    : v.view_count
                      ? `조회수 ${formatViewCount(v.view_count)}`
                      : ""
                }
                dateText={formatRelativeTime(v.published_at)}
                isLive={v.is_live}
              />
            ))
          : DUMMY_VIDEOS.map((v) => (
              <YoutubeCard
                key={v.video_id}
                videoId={v.video_id}
                title={v.title}
                thumbnail={v.thumbnail}
                durationText={v.duration_text}
                channelTitle={v.channel_title}
                viewsText={v.views_text}
                dateText={v.date_text}
                isLive={false}
                isDummy
              />
            ))}
      </>
    </RecommendedRail>
  );
}

/* ============================================================
 * YoutubeCard — 유튜브 스타일 영상 미니 카드
 *
 * 시각 룰:
 * - 썸네일 16:9 / rounded 6px / overflow hidden
 * - LIVE 배지 좌상단 (있을 때만) — accent 빨강 + ping dot
 * - duration chip 우하단 — 검정 반투명 + 흰 글자 (LIVE 일 때 미표시)
 * - 제목 line-clamp 2줄 / font-semibold / 부모 색상 상속
 * - 채널명 = 작은 mute 색
 * - 메타 (조회수+시점) = 더 작은 mute 색
 *
 * BDR 디자인 13 룰 준수:
 * - var(--*) 토큰만 (핑크/살몬 0)
 * - Material Symbols (lucide 0)
 * - 정사각 모양 빼고 pill (9999) 0
 * ============================================================ */
interface YoutubeCardProps {
  videoId: string;
  title: string;
  thumbnail: string;
  durationText?: string; // 이미 포맷된 "M:SS" / "H:MM:SS"
  channelTitle?: string;
  viewsText?: string; // 이미 포맷된 "조회수 5.1천"
  dateText?: string; // 이미 포맷된 "5일 전"
  isLive: boolean;
  isDummy?: boolean; // dummy 일 때 클릭 비활성
}

function YoutubeCard({
  videoId,
  title,
  thumbnail,
  durationText,
  channelTitle,
  viewsText,
  dateText,
  isLive,
  isDummy = false,
}: YoutubeCardProps) {
  // dummy 는 클릭해도 실제 유튜브로 가지 않음 (placeholder URL 회피)
  const Wrapper: "a" | "div" = isDummy ? "div" : "a";
  const wrapperProps = isDummy
    ? {}
    : {
        href: `https://www.youtube.com/watch?v=${videoId}`,
        target: "_blank",
        rel: "noopener noreferrer",
      };

  return (
    <Wrapper
      {...wrapperProps}
      className={`${CARD_WIDTH_CLASS} group block scroll-snap-align-start no-underline`}
      style={{ scrollSnapAlign: "start" }}
    >
      {/* 썸네일 영역 — 16:9 + duration chip + LIVE 배지 */}
      <div
        className="relative aspect-video overflow-hidden"
        style={{
          borderRadius: 6,
          background: "var(--bg-elev)",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 외부 YouTube 썸네일 (도메인 무한정) */}
        <img
          alt={title}
          src={thumbnail}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
        />

        {/* LIVE 배지 좌상단 — accent 빨강 + 흰 ping dot */}
        {isLive && (
          <span
            style={{
              position: "absolute",
              top: 6,
              left: 6,
              background: "var(--accent)",
              color: "#fff",
              fontSize: 10,
              fontWeight: 800,
              letterSpacing: "0.04em",
              padding: "3px 7px",
              borderRadius: 3,
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <span
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%", // 정사각 50% (pill 9999 회피 — 13 룰 §10)
                background: "#fff",
              }}
            />
            LIVE
          </span>
        )}

        {/* duration chip 우하단 — 검정 반투명 + 흰 글자 (LIVE 일 때 미표시) */}
        {!isLive && durationText && (
          <span
            style={{
              position: "absolute",
              bottom: 6,
              right: 6,
              background: "rgba(0, 0, 0, 0.85)",
              color: "#fff",
              fontSize: 11,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              padding: "2px 5px",
              borderRadius: 3,
              lineHeight: 1.3,
            }}
          >
            {durationText}
          </span>
        )}
      </div>

      {/* 정보 영역 — 제목 + 채널명 + 메타 */}
      <div style={{ padding: "8px 2px 0" }}>
        {/* 제목 — line-clamp 2 줄 / 굵게 / 부모 색상 (var(--ink)) */}
        <h4
          style={{
            margin: 0,
            fontSize: 13,
            fontWeight: 600,
            color: "var(--ink)",
            lineHeight: 1.35,
            // 2줄 ellipsis (Tailwind line-clamp-2 와 동등 — 인라인 style 로 폰트 정합 보장)
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            wordBreak: "break-word",
          }}
        >
          {title}
        </h4>

        {/* 채널명 — 작은 mute 색 */}
        {channelTitle && (
          <div
            style={{
              marginTop: 4,
              fontSize: 11,
              color: "var(--ink-mute)",
              fontWeight: 500,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {channelTitle}
          </div>
        )}

        {/* 메타 (조회수 · 시점) — 더 작은 dim 색 */}
        {(viewsText || dateText) && (
          <div
            style={{
              marginTop: 2,
              fontSize: 11,
              color: "var(--ink-dim, var(--ink-mute))",
              display: "flex",
              alignItems: "center",
              gap: 4,
              flexWrap: "wrap",
            }}
          >
            {viewsText && <span>{viewsText}</span>}
            {viewsText && dateText && <span aria-hidden="true">·</span>}
            {dateText && <span>{dateText}</span>}
          </div>
        )}
      </div>
    </Wrapper>
  );
}

/* ============================================================
 * 포맷터 헬퍼
 * ============================================================ */

/**
 * ISO 8601 duration → "M:SS" / "H:MM:SS" 변환.
 * 예: "PT22M47S" → "22:47", "PT1H22M47S" → "1:22:47", "PT10S" → "0:10"
 * 잘못된 입력 / 0초 → 빈 문자열 (chip 미표시)
 */
function formatDuration(iso?: string): string {
  if (!iso) return "";
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return "";

  const hours = parseInt(match[1] ?? "0", 10);
  const minutes = parseInt(match[2] ?? "0", 10);
  const seconds = parseInt(match[3] ?? "0", 10);
  const totalSec = hours * 3600 + minutes * 60 + seconds;

  if (totalSec === 0) return "";

  // 시간 단위 있을 때 = "H:MM:SS" / 없을 때 = "M:SS"
  const ss = String(seconds).padStart(2, "0");
  if (hours > 0) {
    const mm = String(minutes).padStart(2, "0");
    return `${hours}:${mm}:${ss}`;
  }
  return `${minutes}:${ss}`;
}

/**
 * 조회수 한국어 단축 표기.
 * 예: 523 → "523", 5_123 → "5.1천", 123_456 → "12.3만", 5_234_567 → "523만"
 * 1억 이상은 "X.X억" (드물지만 안전장치).
 */
function formatViewCount(n: number): string {
  if (!Number.isFinite(n) || n < 0) return "0";
  if (n < 1000) return String(n);
  if (n < 10_000) {
    // 5_123 → 5.1천
    const k = n / 1000;
    return `${k.toFixed(1).replace(/\.0$/, "")}천`;
  }
  if (n < 1_000_000) {
    // 12_345 → 1.2만, 123_456 → 12.3만
    const m = n / 10_000;
    if (m >= 100) return `${Math.floor(m)}만`;
    return `${m.toFixed(1).replace(/\.0$/, "")}만`;
  }
  if (n < 100_000_000) {
    // 1_234_567 → 123만
    const m = Math.floor(n / 10_000);
    return `${m}만`;
  }
  // 1억 이상 — 매우 드물게
  const e = n / 100_000_000;
  return `${e.toFixed(1).replace(/\.0$/, "")}억`;
}

/**
 * 게시일 → "방금 전 / N분 전 / N시간 전 / N일 전 / N주 전 / N개월 전 / N년 전".
 * 한국어 24시간 기준.
 */
function formatRelativeTime(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";

  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHour = Math.floor(diffMs / 3_600_000);
  const diffDay = Math.floor(diffMs / 86_400_000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  if (diffDay < 7) return `${diffDay}일 전`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}주 전`;
  if (diffDay < 365) return `${Math.floor(diffDay / 30)}개월 전`;
  return `${Math.floor(diffDay / 365)}년 전`;
}
