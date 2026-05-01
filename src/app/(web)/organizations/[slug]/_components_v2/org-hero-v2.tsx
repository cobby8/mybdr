"use client";

import { pickColor, generateTag } from "./org-color";

/* ============================================================
 * 단체 상세 Hero v2 — design/BDR v2/screens/OrgDetail.jsx 기반
 *
 * 이유(왜):
 *  - v1은 "로고 + 헤더" 평면 레이아웃이었으나 v2 시안은 단체별 brand color
 *    그라디언트로 시각 임팩트를 강화한다.
 *  - 가입 신청 버튼은 우측에 노출하되, DB/API 미지원이므로 alert("준비 중")
 *    로 대응 (scratchpad "Phase 3 Orgs" 추후 구현 목록과 일치).
 *
 * 방법(어떻게):
 *  - 클라이언트 컴포넌트 (alert 핸들러 필요)
 *  - 색상은 `pickColor(org.id)` 결정적 매핑 → linear-gradient 배경
 *  - 메타 라인은 시안 그대로 "회원 N명 / 팀 N개 / 설립 N년" 표기
 *    └ 팀 수: DB 집계 미구현 → "준비 중" 표기
 *    └ 설립: organizations.founded_year 컬럼 미존재 → "준비 중" 표기
 * ============================================================ */

interface OrgHeroV2Props {
  id: string;
  name: string;
  logoUrl: string | null;
  region: string | null;
  description: string | null;
  membersCount: number;
}

export function OrgHeroV2({
  id,
  name,
  logoUrl,
  region,
  description,
  membersCount,
}: OrgHeroV2Props) {
  // 단체별 결정적 brand color (DB 컬럼 없을 때의 fallback)
  const color = pickColor(id);
  const tag = generateTag(name);

  // 가입 신청: API 미구현 → 준비 중 안내
  const handleApply = () => {
    alert("준비 중인 기능입니다");
  };

  return (
    <div
      // 풀폭 깨짐 방지 (P0 layout fix, 2026-04-27) + 모바일 분기 (2026-05-02)
      // 부모 wrapper(max-w-5xl)가 더 좁으면 그 폭이 우선되어 무해. wrapper 누락 시 안전망.
      // 모바일: padding 축소 (px-5 py-6) + 폰트 축소 (text-[28px])
      className="relative mx-auto mb-5 max-w-[1200px] overflow-hidden rounded-lg px-5 py-6 text-white sm:px-8 sm:py-9"
      style={{
        // 시안 그대로: 단체 색상 → 60% 지점에서 어두운 배경으로 페이드
        background: `linear-gradient(135deg, ${color}, ${color}AA 60%, #0B0D10)`,
      }}
    >
      <div className="flex flex-wrap items-end gap-3 sm:gap-5">
        {/* 로고 또는 태그 박스 — 모바일 64x64 / sm+ 96x96 (2026-05-02) */}
        {logoUrl ? (
          // 시안에서 정의된 96x96 라운드 박스. 현재 카드 v2와 동일하게
          // <img> 사용 (next/image 도입은 운영 DB 분리 후 일괄 작업 예정)
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={name}
            className="h-16 w-16 flex-shrink-0 rounded-[10px] object-cover sm:h-24 sm:w-24"
            style={{ background: "rgba(255,255,255,0.18)" }}
          />
        ) : (
          <div
            className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-[10px] text-sm font-extrabold tracking-wide sm:h-24 sm:w-24 sm:text-base"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            {tag}
          </div>
        )}

        {/* 본문 정보 */}
        <div className="min-w-0 flex-1">
          {/* eyebrow: kind · area — kind 컬럼 미존재 → "단체" 고정 */}
          <div className="text-[11px] font-extrabold tracking-[0.12em] opacity-85">
            단체 · {region || "전국"}
          </div>
          {/* 단체명: 모바일 28px → sm 34px → md 40px (시안). 자간/줄바꿈 보호 */}
          <h1
            className="mt-1.5 break-keep text-[26px] font-black leading-tight tracking-[-0.02em] sm:text-[34px] md:text-[40px]"
            style={{ marginBottom: 4, wordBreak: "keep-all" }}
          >
            {name}
          </h1>
          {/* 설명 (없으면 placeholder) */}
          <div className="mb-2.5 text-[13px] opacity-90 sm:text-sm">
            {description || "단체 소개가 없습니다."}
          </div>
          {/* 메타: 회원 / 팀 / 설립 — 팀 수 + 설립연도는 "준비 중" */}
          <div className="flex flex-wrap gap-x-[14px] gap-y-1 text-[12px] opacity-90 sm:gap-x-[18px] sm:text-[13px]">
            <span>
              <span className="material-symbols-outlined mr-0.5 align-middle text-base">
                group
              </span>
              회원 {membersCount}명
            </span>
            <span title="팀 집계 준비 중">
              <span className="material-symbols-outlined mr-0.5 align-middle text-base">
                sports_basketball
              </span>
              팀 준비 중
            </span>
            <span title="설립 연도 준비 중">
              <span className="material-symbols-outlined mr-0.5 align-middle text-base">
                calendar_month
              </span>
              설립 준비 중
            </span>
          </div>
        </div>

        {/* 가입 신청 버튼 — 모바일 풀폭 (2026-05-02) */}
        <button
          type="button"
          onClick={handleApply}
          className="w-full rounded bg-[var(--color-primary)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)] sm:w-auto"
        >
          가입 신청
        </button>
      </div>
    </div>
  );
}
