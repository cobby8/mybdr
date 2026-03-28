"use client";

/* ============================================================
 * CourtsContent -- 코트 지도 + 목록 통합 컴포넌트
 *
 * 재설계 요점:
 * - PC(lg+): 좌측 카카오맵 60% + 우측 코트 목록 40% (분할 뷰)
 * - 모바일(lg-): 지도/목록 토글 버튼으로 전환
 * - 필터 바: 지도 위 오버레이로 표시
 * - 마커 클릭 시 PC는 목록 하이라이트, 모바일은 하단 미니카드
 *
 * API/데이터 패칭은 전혀 변경하지 않음 (UI만 교체)
 * ============================================================ */

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { KakaoMap, type MapMarker } from "@/components/shared/kakao-map";

// API에서 직렬화된 코트 데이터 타입 (기존과 동일)
interface CourtItem {
  id: string;
  name: string;
  address: string;
  city: string;
  district: string | null;
  latitude: number;
  longitude: number;
  court_type: string;
  surface_type: string | null;
  hoops_count: number | null;
  is_free: boolean;
  has_lighting: boolean;
  fee: number | null;
  average_rating: number | null;
  reviews_count: number;
  description: string | null;
  // 야외 코트 확장 필드
  nickname: string | null;
  nearest_station: string | null;
  court_size: string | null;
  lighting_until: string | null;
  has_restroom: boolean;
  has_parking: boolean;
  verified: boolean;
  data_source: string | null;
  // 혼잡도: 현재 활성 체크인 세션 수
  activeCount: number;
}

interface CourtsContentProps {
  courts: CourtItem[];
  cities: string[];
}

// 코트 유형 탭 정의
const TYPE_TABS = [
  { key: "all", label: "전체", icon: "apps" },
  { key: "outdoor", label: "야외", icon: "park" },
  { key: "indoor", label: "실내", icon: "stadium" },
] as const;

// 야외 전용 pill 필터 정의
const OUTDOOR_PILLS = [
  { key: "free", label: "무료", icon: "savings" },
  { key: "lighting", label: "조명", icon: "lightbulb" },
  { key: "fullcourt", label: "풀코트", icon: "square_foot" },
  { key: "active", label: "사람있는곳", icon: "local_fire_department" },
] as const;

// 바닥재질 한글 매핑
const SURFACE_LABELS: Record<string, string> = {
  urethane: "우레탄",
  rubber: "고무",
  modular: "모듈형",
  concrete: "콘크리트",
  asphalt: "아스팔트",
  wood: "나무",
};

// 코트 크기 한글 매핑
const SIZE_LABELS: Record<string, string> = {
  fullcourt: "풀코트",
  halfcourt: "하프코트",
  "3x3": "3x3",
};

// 모바일 뷰 모드
type ViewMode = "map" | "list";

export function CourtsContent({ courts, cities }: CourtsContentProps) {
  // 필터 상태
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [activePills, setActivePills] = useState<Set<string>>(new Set());

  // 지도/목록 관련 상태
  const [viewMode, setViewMode] = useState<ViewMode>("map"); // 모바일 뷰 모드
  const [selectedCourtId, setSelectedCourtId] = useState<string | null>(null);

  // 목록 스크롤 참조 (선택 시 자동 스크롤용)
  const listRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // pill 필터 토글
  const togglePill = (key: string) => {
    setActivePills((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // 필터링 + 정렬
  const filtered = useMemo(() => {
    let result = courts;

    // 유형 필터
    if (typeFilter !== "all") {
      result = result.filter((c) => c.court_type === typeFilter);
    }

    // 지역 필터
    if (cityFilter !== "all") {
      result = result.filter((c) => c.city === cityFilter);
    }

    // pill 필터
    if (activePills.has("free")) {
      result = result.filter((c) => c.is_free);
    }
    if (activePills.has("lighting")) {
      result = result.filter((c) => c.has_lighting);
    }
    if (activePills.has("fullcourt")) {
      result = result.filter((c) => c.court_size === "fullcourt");
    }
    // "사람있는곳" 필터: 체크인 1명 이상인 코트만
    if (activePills.has("active")) {
      result = result.filter((c) => c.activeCount > 0);
    }

    // 야외 우선 + 검증 우선 + 평점순 정렬
    result = [...result].sort((a, b) => {
      const typeOrder = (t: string) =>
        t === "outdoor" ? 0 : t === "indoor" ? 1 : 2;
      const typeDiff = typeOrder(a.court_type) - typeOrder(b.court_type);
      if (typeDiff !== 0) return typeDiff;
      if (a.verified !== b.verified) return a.verified ? -1 : 1;
      return (b.average_rating ?? 0) - (a.average_rating ?? 0);
    });

    return result;
  }, [courts, typeFilter, cityFilter, activePills]);

  // 지도 마커 데이터 변환 (위경도 유효한 것만)
  const mapMarkers: MapMarker[] = useMemo(
    () =>
      filtered
        .filter((c) => c.latitude !== 0 && c.longitude !== 0)
        .map((c) => ({
          id: c.id,
          lat: c.latitude,
          lng: c.longitude,
          name: c.name,
          type: c.court_type === "indoor" ? "indoor" : "outdoor",
          activeCount: c.activeCount,
        })),
    [filtered]
  );

  // 선택된 코트 정보
  const selectedCourt = useMemo(
    () => filtered.find((c) => c.id === selectedCourtId) ?? null,
    [filtered, selectedCourtId]
  );

  // 마커 클릭 핸들러: 목록에서 해당 카드로 스크롤
  const handleMarkerClick = useCallback((id: string) => {
    setSelectedCourtId(id);

    // PC에서 목록 카드로 자동 스크롤
    const card = cardRefs.current.get(id);
    if (card) {
      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, []);

  // 필터 변경 핸들러
  const handleTypeChange = (key: string) => {
    setTypeFilter(key);
    setSelectedCourtId(null);
    if (key === "indoor") setActivePills(new Set());
  };
  const handleCityChange = (val: string) => {
    setCityFilter(val);
    setSelectedCourtId(null);
  };

  // 통계
  const stats = useMemo(() => {
    const indoor = courts.filter((c) => c.court_type === "indoor").length;
    const outdoor = courts.filter((c) => c.court_type === "outdoor").length;
    return { total: courts.length, indoor, outdoor };
  }, [courts]);

  // pill 필터 표시 조건 (실내 탭이 아닐 때)
  const showPills = typeFilter !== "indoor";

  return (
    <div className="flex flex-col" style={{ height: "calc(100vh - 80px)" }}>
      {/* ═══════ 상단: 제목 + 모바일 뷰 토글 ═══════ */}
      <div className="shrink-0 mb-3">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-xl font-extrabold tracking-tight sm:text-2xl"
              style={{
                fontFamily: "var(--font-heading)",
                color: "var(--color-text-primary)",
              }}
            >
              내 주변 농구장
            </h1>
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              전국 {stats.total}개 (실내 {stats.indoor} / 실외 {stats.outdoor}) | 필터 결과 {filtered.length}개
            </p>
          </div>

          {/* 모바일 전용 뷰 토글 (lg 미만에서만 표시) */}
          <div
            className="flex lg:hidden rounded-[4px] overflow-hidden"
            style={{
              border: "1px solid var(--color-border)",
            }}
          >
            <button
              onClick={() => setViewMode("map")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                backgroundColor:
                  viewMode === "map"
                    ? "var(--color-primary)"
                    : "var(--color-surface)",
                color: viewMode === "map" ? "white" : "var(--color-text-secondary)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                map
              </span>
              지도
            </button>
            <button
              onClick={() => setViewMode("list")}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                backgroundColor:
                  viewMode === "list"
                    ? "var(--color-primary)"
                    : "var(--color-surface)",
                color: viewMode === "list" ? "white" : "var(--color-text-secondary)",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: "16px" }}>
                list
              </span>
              목록
            </button>
          </div>
        </div>

        {/* ═══════ 필터 바 ═══════ */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {/* 유형 탭 */}
          <div className="flex gap-1">
            {TYPE_TABS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => handleTypeChange(tab.key)}
                className="flex items-center gap-1 rounded-[4px] px-3 py-1.5 text-xs font-semibold transition-all duration-150"
                style={{
                  backgroundColor:
                    typeFilter === tab.key
                      ? "var(--color-primary)"
                      : "var(--color-surface-bright)",
                  color:
                    typeFilter === tab.key
                      ? "white"
                      : "var(--color-text-secondary)",
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* 지역 드롭다운 */}
          <select
            value={cityFilter}
            onChange={(e) => handleCityChange(e.target.value)}
            className="rounded-[4px] border px-2 py-1.5 text-xs"
            style={{
              borderColor: "var(--color-border)",
              backgroundColor: "var(--color-surface)",
              color: "var(--color-text-primary)",
            }}
          >
            <option value="all">전체 지역</option>
            {cities.map((city) => (
              <option key={city} value={city}>
                {city}
              </option>
            ))}
          </select>

          {/* pill 필터 (야외 전용 + 사람있는곳) */}
          {showPills &&
            OUTDOOR_PILLS.map((pill) => {
              const isActive = activePills.has(pill.key);
              return (
                <button
                  key={pill.key}
                  onClick={() => togglePill(pill.key)}
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium transition-all duration-150"
                  style={{
                    backgroundColor: isActive
                      ? "color-mix(in srgb, var(--color-primary) 15%, transparent)"
                      : "var(--color-surface-bright)",
                    color: isActive
                      ? "var(--color-primary)"
                      : "var(--color-text-secondary)",
                    border: isActive
                      ? "1px solid color-mix(in srgb, var(--color-primary) 30%, transparent)"
                      : "1px solid transparent",
                  }}
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "13px" }}
                  >
                    {pill.icon}
                  </span>
                  {pill.label}
                </button>
              );
            })}
        </div>
      </div>

      {/* ═══════ 메인 영역: 지도 + 목록 분할 ═══════ */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-3">
        {/* --- 좌측: 카카오맵 (PC: 60%, 모바일: 지도모드일 때 100%) --- */}
        <div
          className={`relative lg:block ${viewMode === "map" ? "flex-1" : "hidden"} lg:flex-[6]`}
          style={{ minHeight: "300px" }}
        >
          <KakaoMap
            markers={mapMarkers}
            onMarkerClick={handleMarkerClick}
            selectedId={selectedCourtId}
            className="h-full w-full rounded-lg overflow-hidden"
            showCurrentLocation
          />

          {/* 모바일: 선택된 코트 미니카드 (지도 하단 슬라이드업) */}
          {viewMode === "map" && selectedCourt && (
            <div className="lg:hidden absolute bottom-16 left-3 right-3 z-10 animate-slide-up">
              <MiniCourtCard court={selectedCourt} />
            </div>
          )}
        </div>

        {/* --- 우측: 코트 목록 (PC: 40%, 모바일: 목록모드일 때 100%) --- */}
        <div
          ref={listRef}
          className={`lg:block ${viewMode === "list" ? "flex-1" : "hidden"} lg:flex-[4] overflow-y-auto`}
          style={{ minHeight: 0 }}
        >
          {filtered.length > 0 ? (
            <div className="space-y-2 pr-1">
              {filtered.map((court) => (
                <div
                  key={court.id}
                  ref={(el) => {
                    if (el) cardRefs.current.set(court.id, el);
                  }}
                >
                  <CourtListCard
                    court={court}
                    isSelected={court.id === selectedCourtId}
                    onSelect={() => {
                      setSelectedCourtId(court.id);
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            /* 빈 상태 */
            <div
              className="rounded-xl p-10 text-center"
              style={{
                backgroundColor: "var(--color-card)",
                boxShadow: "var(--shadow-card)",
              }}
            >
              <span
                className="material-symbols-outlined text-3xl mb-2 block"
                style={{ color: "var(--color-text-disabled)" }}
              >
                sports_basketball
              </span>
              <p
                className="text-sm font-medium"
                style={{ color: "var(--color-text-muted)" }}
              >
                조건에 맞는 농구장이 없습니다
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "var(--color-text-disabled)" }}
              >
                다른 필터를 선택해보세요
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MiniCourtCard -- 모바일 지도 하단에 표시되는 미니 카드
// ─────────────────────────────────────────────────────────
function MiniCourtCard({ court }: { court: CourtItem }) {
  const isIndoor = court.court_type === "indoor";
  const typeLabel = isIndoor ? "실내" : "야외";

  return (
    <Link href={`/courts/${court.id}`}>
      <div
        className="rounded-xl p-3 transition-all"
        style={{
          backgroundColor: "var(--color-card)",
          boxShadow: "0 -2px 16px rgba(0,0,0,0.2)",
          border: "1px solid var(--color-border)",
        }}
      >
        <div className="flex items-center gap-3">
          {/* 유형 아이콘 */}
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: isIndoor
                ? "color-mix(in srgb, var(--color-info) 15%, transparent)"
                : "color-mix(in srgb, var(--color-success) 15%, transparent)",
            }}
          >
            <span
              className="material-symbols-outlined text-lg"
              style={{
                color: isIndoor ? "var(--color-info)" : "var(--color-success)",
              }}
            >
              {isIndoor ? "stadium" : "park"}
            </span>
          </div>

          {/* 정보 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <h3
                className="text-sm font-bold truncate"
                style={{ color: "var(--color-text-primary)" }}
              >
                {court.name}
              </h3>
              {court.verified && (
                <span
                  className="material-symbols-outlined shrink-0"
                  style={{ fontSize: "14px", color: "var(--color-info)" }}
                >
                  verified
                </span>
              )}
            </div>
            <div
              className="flex items-center gap-2 text-[11px] mt-0.5"
              style={{ color: "var(--color-text-muted)" }}
            >
              <span>{typeLabel}</span>
              {court.is_free && (
                <span style={{ color: "var(--color-success)" }}>무료</span>
              )}
              {court.activeCount > 0 && (
                <span style={{ color: "var(--color-accent)" }}>
                  {court.activeCount}명 이용중
                </span>
              )}
              {court.nearest_station && (
                <span>{court.nearest_station}</span>
              )}
            </div>
          </div>

          {/* 화살표 */}
          <span
            className="material-symbols-outlined shrink-0"
            style={{ fontSize: "20px", color: "var(--color-text-muted)" }}
          >
            chevron_right
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────────────────
// CourtListCard -- 우측 목록 개별 코트 카드
// ─────────────────────────────────────────────────────────
function CourtListCard({
  court,
  isSelected,
  onSelect,
}: {
  court: CourtItem;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isOutdoor = court.court_type === "outdoor";
  const isIndoor = court.court_type === "indoor";
  const typeIcon = isIndoor ? "stadium" : "park";
  const typeLabel = isIndoor ? "실내" : isOutdoor ? "야외" : "미분류";
  const typeBg = isIndoor
    ? "color-mix(in srgb, var(--color-info) 15%, transparent)"
    : "color-mix(in srgb, var(--color-success) 15%, transparent)";
  const typeColor = isIndoor ? "var(--color-info)" : "var(--color-success)";

  // 카카오맵 길찾기 URL
  const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(court.name)},${court.latitude},${court.longitude}`;

  return (
    <div
      onClick={onSelect}
      className="cursor-pointer rounded-xl p-3 sm:p-4 transition-all duration-200"
      style={{
        backgroundColor: "var(--color-card)",
        boxShadow: isSelected ? "var(--shadow-elevated)" : "var(--shadow-card)",
        // 선택된 카드: 좌측에 primary 색상 보더
        borderLeft: isSelected ? "3px solid var(--color-primary)" : "3px solid transparent",
      }}
    >
      <div className="flex items-start gap-3">
        {/* 유형 아이콘 (원형) */}
        <div
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ backgroundColor: typeBg }}
        >
          <span
            className="material-symbols-outlined text-lg"
            style={{ color: typeColor }}
          >
            {typeIcon}
          </span>
        </div>

        {/* 코트 정보 */}
        <div className="flex-1 min-w-0">
          {/* 이름 + 검증 뱃지 */}
          <div className="flex items-center gap-1.5">
            <Link
              href={`/courts/${court.id}`}
              className="text-sm font-bold truncate hover:underline"
              style={{ color: "var(--color-text-primary)" }}
              onClick={(e) => e.stopPropagation()}
            >
              {court.name}
            </Link>
            {court.verified && (
              <span
                className="material-symbols-outlined shrink-0"
                style={{ fontSize: "13px", color: "var(--color-info)" }}
                title="검증된 코트"
              >
                verified
              </span>
            )}
          </div>

          {/* 속성 뱃지 행 */}
          <div className="mt-1 flex flex-wrap items-center gap-1">
            {/* 실내/야외 */}
            <span
              className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
              style={{ backgroundColor: typeBg, color: typeColor }}
            >
              {typeLabel}
            </span>

            {/* 코트 크기 */}
            {court.court_size && SIZE_LABELS[court.court_size] && (
              <span
                className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: "var(--color-surface-bright)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {SIZE_LABELS[court.court_size]}
              </span>
            )}

            {/* 바닥재질 */}
            {court.surface_type && SURFACE_LABELS[court.surface_type] && (
              <span
                className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor: "var(--color-surface-bright)",
                  color: "var(--color-text-secondary)",
                }}
              >
                {SURFACE_LABELS[court.surface_type]}
              </span>
            )}

            {/* 무료/유료 */}
            <span
              className="rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
              style={{
                backgroundColor: court.is_free
                  ? "color-mix(in srgb, var(--color-success) 15%, transparent)"
                  : "color-mix(in srgb, var(--color-warning) 15%, transparent)",
                color: court.is_free
                  ? "var(--color-success)"
                  : "var(--color-warning)",
              }}
            >
              {court.is_free
                ? "무료"
                : court.fee
                  ? `${court.fee.toLocaleString()}원`
                  : "유료"}
            </span>

            {/* 조명 */}
            {court.has_lighting && (
              <span
                className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[10px] font-medium"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                  color: "var(--color-accent)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "11px" }}
                >
                  lightbulb
                </span>
                {court.lighting_until ? `~${court.lighting_until}` : "조명"}
              </span>
            )}

            {/* 평점 */}
            {court.average_rating !== null && court.average_rating > 0 && (
              <span
                className="inline-flex items-center gap-0.5 text-[10px] font-bold"
                style={{ color: "var(--color-primary)" }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "11px" }}
                >
                  star
                </span>
                {court.average_rating.toFixed(1)}
              </span>
            )}

            {/* 혼잡도 뱃지 */}
            {court.activeCount >= 5 && (
              <span
                className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-success) 15%, transparent)",
                  color: "var(--color-success)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "11px" }}
                >
                  local_fire_department
                </span>
                활발 {court.activeCount}명
              </span>
            )}
            {court.activeCount >= 1 && court.activeCount < 5 && (
              <span
                className="inline-flex items-center gap-0.5 rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--color-accent) 15%, transparent)",
                  color: "var(--color-accent)",
                }}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontSize: "11px" }}
                >
                  groups
                </span>
                {court.activeCount}명
              </span>
            )}
          </div>

          {/* 주소 + 가까운 역 */}
          <div
            className="mt-1.5 flex items-center gap-1.5 text-[11px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span className="truncate">
              {court.city} {court.district}
            </span>
            {court.nearest_station && (
              <>
                <span style={{ color: "var(--color-border)" }}>|</span>
                <span className="inline-flex items-center gap-0.5 truncate">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: "11px" }}
                  >
                    train
                  </span>
                  {court.nearest_station}
                </span>
              </>
            )}
          </div>
        </div>

        {/* 우측: 길찾기 버튼 */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            window.open(kakaoUrl, "_blank");
          }}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-colors"
          style={{
            backgroundColor: "var(--color-surface-bright)",
          }}
          title="카카오맵 길찾기"
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: "16px", color: "var(--color-text-secondary)" }}
          >
            directions
          </span>
        </button>
      </div>
    </div>
  );
}
