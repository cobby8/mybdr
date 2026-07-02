// ============================================================
// org-console/_org-color.ts — 단체 브랜드색상 해시 팔레트 (client-safe)
//   ★client/server 경계 분리(2026-07-02 buildfix): orgColor 는 client 컴포넌트
//     (_dashboard.tsx · profile/_profile.tsx) 가 직접 import 하는 순수 함수라 서버 전용
//     의존성(getWebSession/next-headers/prisma)이 있는 _org-data.ts 에서 분리했다.
//     _org-data.ts 를 client 가 import 하면 next build 시 서버 전용 모듈이 클라 번들에
//     섞여 EXIT1 이 난다(tsc --noEmit 은 타입만 보므로 못 잡음) — 재발 방지용 분리.
//   정본 참조: org-data.jsx ORG_PALETTE 1:1. 브랜드색상 직접 지정 UI 없음(§2-3 금지 mock).
//   ⚠ 이 파일은 server 전용 import(web-session/prisma/is-super-admin/next/headers) 절대 금지.
// ============================================================

const ORG_PALETTE = [
  "#0F5FCC",
  "#1B3C87",
  "#2563EB",
  "#0E7490",
  "#0D9488",
  "#15803D",
  "#4F46E5",
  "#6D28D9",
  "#0369A1",
];

export type OrgColor = { base: string; deep: string; soft: string };

export function orgColor(id: string | bigint | null | undefined): OrgColor {
  let h = 0;
  const s = String(id ?? "");
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const base = ORG_PALETTE[h % ORG_PALETTE.length];
  return {
    base,
    deep: `color-mix(in srgb, ${base} 72%, #0B0D10)`,
    soft: `color-mix(in srgb, ${base} 12%, #fff)`,
  };
}
