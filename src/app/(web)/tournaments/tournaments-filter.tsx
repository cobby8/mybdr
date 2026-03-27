"use client";

import { useState, useCallback } from "react";
import { FloatingFilterPanel, type FilterConfig } from "@/components/shared/floating-filter-panel";

/**
 * TournamentsFilter - 대회 필터 (플로팅 패널 방식)
 *
 * 필터 구성: 지역(17개 시도) / 성별 / 종별 / 디비전
 * - 상태 필터는 상단 탭으로 이동했으므로 여기서 제거
 * - 참가비 필터도 제거
 */

// 17개 시도 + 전체 (행정구역 기준)
const REGION_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "서울", label: "서울" },
  { value: "부산", label: "부산" },
  { value: "대구", label: "대구" },
  { value: "인천", label: "인천" },
  { value: "광주", label: "광주" },
  { value: "대전", label: "대전" },
  { value: "울산", label: "울산" },
  { value: "세종", label: "세종" },
  { value: "경기", label: "경기" },
  { value: "강원", label: "강원" },
  { value: "충북", label: "충북" },
  { value: "충남", label: "충남" },
  { value: "전북", label: "전북" },
  { value: "전남", label: "전남" },
  { value: "경북", label: "경북" },
  { value: "경남", label: "경남" },
  { value: "제주", label: "제주" },
];

// 성별 옵션
const GENDER_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
  { value: "mixed", label: "혼성" },
];

// 종별 옵션
const CATEGORY_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "general", label: "일반부" },
  { value: "university", label: "대학부" },
  { value: "high_school", label: "고등부" },
  { value: "middle_school", label: "중등부" },
  { value: "elementary", label: "초등부" },
  { value: "masters", label: "마스터즈(40+)" },
  { value: "senior", label: "시니어(50+)" },
];

// 디비전 옵션
const DIVISION_OPTIONS = [
  { value: "all", label: "전체" },
  { value: "1", label: "1부" },
  { value: "2", label: "2부" },
  { value: "3", label: "3부" },
  { value: "4", label: "4부" },
  { value: "5", label: "5부" },
  { value: "6", label: "6부" },
  { value: "7", label: "7부" },
  { value: "open", label: "오픈" },
];

export function TournamentsFilter({
  onSearchChange,
  onRegionChange,
  onGenderChange,
  onCategoryChange,
  onDivisionChange,
}: {
  onSearchChange: (query: string) => void;
  onRegionChange: (region: string) => void;
  onGenderChange: (gender: string) => void;
  onCategoryChange: (category: string) => void;
  onDivisionChange: (division: string) => void;
}) {
  // 각 필터의 로컬 상태 (URL에 반영하지 않는 클라이언트 필터)
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [selectedGender, setSelectedGender] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedDivision, setSelectedDivision] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // 검색어 입력 핸들러
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearchChange(e.target.value);
  };

  // 지역 필터 변경
  const handleRegionChange = (region: string) => {
    setSelectedRegion(region);
    onRegionChange(region);
  };

  // 성별 필터 변경
  const handleGenderChange = (gender: string) => {
    setSelectedGender(gender);
    onGenderChange(gender);
  };

  // 종별 필터 변경
  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    onCategoryChange(category);
  };

  // 디비전 필터 변경
  const handleDivisionChange = (division: string) => {
    setSelectedDivision(division);
    onDivisionChange(division);
  };

  // 전체 초기화
  const handleReset = useCallback(() => {
    setSelectedRegion("all");
    setSelectedGender("all");
    setSelectedCategory("all");
    setSelectedDivision("all");
    setSearchQuery("");
    onRegionChange("all");
    onGenderChange("all");
    onCategoryChange("all");
    onDivisionChange("all");
    onSearchChange("");
  }, [onRegionChange, onGenderChange, onCategoryChange, onDivisionChange, onSearchChange]);

  // 활성 필터 수 계산 ("all"이 아닌 필터 개수)
  const activeCount = [
    selectedRegion !== "all" ? 1 : 0,
    selectedGender !== "all" ? 1 : 0,
    selectedCategory !== "all" ? 1 : 0,
    selectedDivision !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  // FloatingFilterPanel에 전달할 필터 설정 배열
  const filterConfigs: FilterConfig[] = [
    {
      key: "region",
      label: "지역",
      type: "select",
      options: REGION_OPTIONS,
      value: selectedRegion,
      onChange: handleRegionChange,
    },
    {
      key: "gender",
      label: "성별",
      type: "select",
      options: GENDER_OPTIONS,
      value: selectedGender,
      onChange: handleGenderChange,
    },
    {
      key: "category",
      label: "종별",
      type: "select",
      options: CATEGORY_OPTIONS,
      value: selectedCategory,
      onChange: handleCategoryChange,
    },
    {
      key: "division",
      label: "디비전",
      type: "select",
      options: DIVISION_OPTIONS,
      value: selectedDivision,
      onChange: handleDivisionChange,
    },
  ];

  // 검색창 토글 상태
  const [showSearch, setShowSearch] = useState(false);

  return (
    <div className="flex items-center gap-2">
      {/* 검색 아이콘 버튼 (클릭 시 검색창 토글) */}
      <button
        type="button"
        onClick={() => setShowSearch((prev) => !prev)}
        className="flex h-9 w-9 items-center justify-center rounded-full transition-colors"
        style={{
          backgroundColor: showSearch ? "var(--color-primary)" : "var(--color-accent)",
          color: showSearch ? "var(--color-on-primary)" : "var(--color-text-primary)",
        }}
        title="검색"
      >
        <span className="material-symbols-outlined text-lg">search</span>
      </button>

      {/* 검색 input: 토글 시 표시 */}
      {showSearch && (
        <input
          type="text"
          placeholder="대회 검색..."
          value={searchQuery}
          onChange={handleSearch}
          autoFocus
          className="h-9 rounded px-3 text-sm outline-none border transition-all w-40 sm:w-56"
          style={{
            backgroundColor: "var(--color-card)",
            borderColor: "var(--color-border)",
            color: "var(--color-text-primary)",
          }}
        />
      )}

      {/* 플로팅 필터 트리거 버튼 */}
      <FloatingFilterPanel
        filters={filterConfigs}
        onReset={handleReset}
        activeCount={activeCount}
      />
    </div>
  );
}
