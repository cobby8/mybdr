"use client";

import Link from "next/link";

/* ============================================================
 * 단체 카드 V2 — BDR v2 디자인 적용
 *
 * - 상단: 단체 색상 기반 그라디언트 헤더 (로고/태그/이름/종류 배지)
 * - 본문: 설명 + 지역/팀/인원 3분할 통계
 * - 하단: "상세" 링크 + "가입 신청" 버튼 (준비 중)
 *
 * ⚠️ DB에 kind/brand_color/tag 필드가 아직 없음 → 폴백 로직 사용:
 *   - color: id 해시 → 6색 팔레트
 *   - tag: 이름에서 자동 생성 (첫 2글자 또는 영문 이니셜)
 *   - kind: "단체" 고정 (Phase 3 Orgs에서 추가 예정)
 * ============================================================ */

type OrgCardData = {
  id: string;
  slug: string;
  name: string;
  logoUrl: string | null;
  region: string | null;
  description: string | null;
  membersCount: number;
  seriesCount: number;
};

// 6색 팔레트 (디자인 시안 ORGS 더미 색상 참조)
const COLOR_PALETTE = [
  "#0F5FCC", // 파랑
  "#E31B23", // BDR Red
  "#10B981", // 초록
  "#F59E0B", // 주황
  "#8B5CF6", // 보라
  "#0EA5E9", // 하늘
];

// id로부터 결정적 색상 선택 (같은 단체는 항상 같은 색)
function pickColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return COLOR_PALETTE[Math.abs(hash) % COLOR_PALETTE.length];
}

// 단체명에서 태그 자동 생성 (영문이면 대문자 4글자, 한글이면 첫 2글자)
function generateTag(name: string): string {
  const trimmed = name.trim();
  // 영문 위주면 대문자만 추출 → 최대 4글자
  const upperOnly = trimmed.replace(/[^A-Z]/g, "");
  if (upperOnly.length >= 2) return upperOnly.slice(0, 4);
  // 영문 단어 첫 글자
  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.every((w) => /^[A-Za-z]/.test(w)) && words.length >= 2) {
    return words
      .map((w) => w.charAt(0).toUpperCase())
      .join("")
      .slice(0, 4);
  }
  // 한글/혼합: 앞 2글자
  return trimmed.slice(0, 2).toUpperCase();
}

export function OrgCardV2({ org }: { org: OrgCardData }) {
  const color = pickColor(org.id);
  const tag = generateTag(org.name);

  // 가입 신청 → 준비 중 알림 (Phase 3 Orgs에서 API 추가 예정)
  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    alert("준비 중인 기능입니다");
  };

  return (
    <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] transition-colors hover:border-[var(--color-primary)]">
      {/* 헤더: 그라디언트 + 로고/태그/이름/종류 */}
      <div
        className="flex items-start gap-3.5 px-5 py-4 text-white"
        style={{
          background: `linear-gradient(135deg, ${color}, ${color}CC)`,
          minHeight: 92,
        }}
      >
        {/* 로고 또는 태그 박스 */}
        {org.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={org.logoUrl}
            alt={org.name}
            className="h-[52px] w-[52px] flex-shrink-0 rounded object-cover"
            style={{ background: "rgba(255,255,255,0.18)" }}
          />
        ) : (
          <div
            className="flex h-[52px] w-[52px] flex-shrink-0 items-center justify-center rounded text-xs font-extrabold tracking-wide"
            style={{ background: "rgba(255,255,255,0.18)" }}
          >
            {tag}
          </div>
        )}

        {/* 태그 라벨 + 단체명 */}
        <div className="min-w-0 flex-1">
          <div className="text-[11px] font-extrabold tracking-[0.12em] opacity-85">
            {tag}
          </div>
          <div className="mt-1 truncate text-xl font-black leading-tight tracking-tight">
            {org.name}
          </div>
        </div>

        {/* 종류 배지 (kind 필드 없음 → "단체" 고정) */}
        <span
          className="flex-shrink-0 rounded border px-2 py-0.5 text-[11px] font-medium"
          style={{
            background: "rgba(0,0,0,0.25)",
            borderColor: "rgba(255,255,255,0.35)",
            color: "#fff",
          }}
        >
          단체
        </span>
      </div>

      {/* 본문: 설명 + 통계 3분할 */}
      <div className="px-[18px] py-3.5">
        <p
          className="mb-3 line-clamp-2 text-[13px] leading-[1.5] text-[var(--color-text-secondary)]"
          style={{ minHeight: 40 }}
        >
          {org.description || "단체 소개가 없습니다."}
        </p>

        <div className="grid grid-cols-3 gap-2">
          {/* 지역 */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              지역
            </div>
            <div className="mt-0.5 text-[13px] font-bold text-[var(--color-text-primary)]">
              {org.region || "전국"}
            </div>
          </div>
          {/* 시리즈 (DB에 teams 집계 없음 → series_count로 대체) */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              시리즈
            </div>
            <div className="mt-0.5 text-lg font-black tracking-tight text-[var(--color-text-primary)]">
              {org.seriesCount}
            </div>
          </div>
          {/* 인원 */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
              인원
            </div>
            <div className="mt-0.5 text-lg font-black tracking-tight text-[var(--color-text-primary)]">
              {org.membersCount}
            </div>
          </div>
        </div>
      </div>

      {/* 하단 액션: 상세 (Link) / 가입 신청 (준비 중 alert) */}
      <div className="flex gap-1.5 border-t border-[var(--color-border)] px-[18px] pb-3.5 pt-2.5">
        <Link
          href={`/organizations/${org.slug}`}
          className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-center text-xs font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-text-muted)]"
        >
          상세
        </Link>
        <button
          type="button"
          onClick={handleApply}
          className="flex-1 rounded bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-[var(--color-primary-hover)]"
        >
          가입 신청
        </button>
      </div>
    </div>
  );
}

export type { OrgCardData };
