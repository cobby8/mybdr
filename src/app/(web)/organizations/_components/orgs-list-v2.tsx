"use client";

import { useMemo, useState } from "react";
import { OrgCardV2, type OrgCardData } from "./org-card-v2";

/* ============================================================
 * 단체 목록 V2 — 클라이언트 컨테이너 (OU1 보강 박제)
 *
 * 시안(OrganizationsList.jsx) 구성을 운영 실데이터로 박제:
 *   - 지역 필터 chip: region prefix(앞 단어)로 자동 생성 + 실제 필터링
 *     (기존 kind 필터는 DB에 kind 컬럼 없어 alert 처리였음 → 실동작 지역 필터로 교체)
 *   - 정렬: 시리즈 많은 순 / 신규(created_at)
 *     ⚠️ 시안의 "대회 많은 순"은 tournaments_count 컬럼이 DB에 없어 제외 (mock 금지)
 *   - 검색: 단체명 / 지역 텍스트 매칭
 *   - 그리드: auto-fill minmax(300px, 1fr) → 폭 따라 1~3열 자동 배치
 *
 * 추천 row(내 지역)는 시안에 있으나 운영 단체 수가 적고 세션 활동지역
 * 기준이 불명확해 hide (mock 금지). 데이터 충분/지역 기준 확정 시 후속 보강.
 * ============================================================ */

type SortKey = "series" | "newest";

const SORTS: { v: SortKey; l: string }[] = [
  { v: "series", l: "시리즈 많은 순" },
  { v: "newest", l: "신규" },
];

export function OrgsListV2({ orgs }: { orgs: OrgCardData[] }) {
  const [region, setRegion] = useState<string>("all"); // "all" 또는 region prefix
  const [sort, setSort] = useState<SortKey>("series");
  const [query, setQuery] = useState("");

  // 지역 chip 목록 = region 앞 단어(공백 split 첫 토큰)의 고유 집합
  // 예: "서울시 강남구" → "서울시". region 없는 단체는 chip 생성 제외
  const regions = useMemo(() => {
    const set = new Set<string>();
    for (const o of orgs) {
      if (o.region) set.add(o.region.split(" ")[0]);
    }
    return ["all", ...set];
  }, [orgs]);

  // 필터(지역) → 검색 → 정렬 순으로 파생 목록 계산
  const filtered = useMemo(() => {
    let list = orgs;

    // 지역 필터: "all"이 아니면 region이 해당 prefix로 시작하는 단체만
    if (region !== "all") {
      list = list.filter((o) => o.region?.startsWith(region));
    }

    // 검색: 단체명 또는 지역에 query 포함(대소문자 무시)
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (o) =>
          o.name.toLowerCase().includes(q) ||
          (o.region ?? "").toLowerCase().includes(q),
      );
    }

    // 정렬: 시리즈 많은 순 / 신규(created_at 내림차순)
    return [...list].sort((a, b) => {
      if (sort === "series") return b.seriesCount - a.seriesCount;
      // newest: ISO 문자열은 사전순 = 시간순이므로 문자열 비교로 충분
      return b.createdAt.localeCompare(a.createdAt);
    });
  }, [orgs, region, query, sort]);

  return (
    <>
      {/* 필터 바: 지역 chip + 정렬 chip + 검색 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        {/* 지역 그룹 */}
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-[var(--ink-mute)]">
          지역
        </span>
        <div className="flex flex-wrap gap-1">
          {regions.map((r) => {
            const isActive = region === r;
            return (
              <button
                key={r}
                type="button"
                onClick={() => setRegion(r)}
                className="rounded border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: isActive
                    ? "var(--cafe-blue)"
                    : "var(--bg-elev)",
                  color: isActive ? "#fff" : "var(--ink)",
                  borderColor: isActive
                    ? "var(--cafe-blue)"
                    : "var(--border)",
                }}
              >
                {r === "all" ? "전체" : r}
              </button>
            );
          })}
        </div>

        {/* 구분선 */}
        <span className="mx-1 h-4 w-px bg-[var(--border)]" />

        {/* 정렬 그룹 */}
        <span className="text-[10.5px] font-extrabold uppercase tracking-[0.06em] text-[var(--ink-mute)]">
          정렬
        </span>
        <div className="flex gap-1">
          {SORTS.map((s) => {
            const isActive = sort === s.v;
            return (
              <button
                key={s.v}
                type="button"
                onClick={() => setSort(s.v)}
                className="rounded border px-3 py-1.5 text-xs font-medium transition-colors"
                style={{
                  background: isActive
                    ? "var(--cafe-blue)"
                    : "var(--bg-elev)",
                  color: isActive ? "#fff" : "var(--ink)",
                  borderColor: isActive
                    ? "var(--cafe-blue)"
                    : "var(--border)",
                }}
              >
                {s.l}
              </button>
            );
          })}
        </div>

        {/* 우측 검색 (남는 공간 밀어내기) */}
        <div className="ml-auto flex min-w-[200px] items-center gap-1.5 rounded border border-[var(--border)] bg-[var(--bg-elev)] px-3 py-1.5">
          <span className="material-symbols-outlined text-base text-[var(--ink-mute)]">
            search
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="단체명 / 지역"
            className="w-full bg-transparent text-sm text-[var(--ink)] outline-none placeholder:text-[var(--ink-mute)]"
          />
        </div>
      </div>

      {/* 전체 단체 섹션 헤더 + 개수 */}
      <div className="mb-2 flex items-baseline gap-2">
        <h2 className="text-base font-extrabold text-[var(--ink)]">
          전체 단체
        </h2>
        <span className="text-xs text-[var(--ink-mute)]">
          {filtered.length}개
        </span>
      </div>

      {/* 단체 카드 그리드 */}
      {filtered.length > 0 ? (
        <div
          className="grid gap-3.5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
          }}
        >
          {filtered.map((org) => (
            <OrgCardV2 key={org.id} org={org} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center">
          <span className="material-symbols-outlined text-4xl text-[var(--ink-dim)]">
            corporate_fare
          </span>
          <p className="mt-2 text-[var(--ink-mute)]">
            {orgs.length === 0
              ? "아직 등록된 단체가 없습니다."
              : "조건에 맞는 단체가 없습니다."}
          </p>
        </div>
      )}
    </>
  );
}
