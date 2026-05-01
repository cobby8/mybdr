"use client";

/* ============================================================
 * DisplaySectionV2 — Settings "표시 · 접근성" 섹션
 *
 * 왜 (2026-05-01 신설 — 사용자 결정 D2):
 *  - 시안 v2.3 Settings 7섹션 중 "display" (표시·접근성) 자리.
 *  - 시안 6 행: 언어 / 시간대 / 다크모드 / 폰트 크기 / 모션 줄이기 / 고대비 모드.
 *  - 모두 DB 미지원 — UI placeholder 만 박제 (자리 보존, 향후 i18n/접근성 단계 진입점).
 *  - 9999px → 50% 룰 (D2): 본 섹션 자체에는 9999px 사용처 없음. SettingsToggle 의
 *    토글 손잡이는 ".settings-ui.tsx" 에서 이미 50% 사용 중.
 *
 * 어떻게:
 *  - SettingsRow 4행 + SettingsToggle 2행. 모두 disabled.
 *  - 다크모드 행은 운영 AppNav 에 이미 동작 중인 진짜 다크모드 토글 있어 자리 placeholder 유지.
 * ============================================================ */

import { SettingsHeader, SettingsRow, SettingsToggle } from "./settings-ui";

export function DisplaySectionV2() {
  return (
    <>
      <SettingsHeader
        title="표시 · 접근성"
        desc="언어 · 시간대 · 다크모드 · 폰트 크기"
      />

      {/* 1. 언어 — 한국어 고정 (i18n 미지원) */}
      <SettingsRow
        label="언어"
        value="한국어"
        action="변경"
        disabled
      />

      {/* 2. 시간대 — KST 고정 */}
      <SettingsRow
        label="시간대"
        value="GMT+9 (서울)"
        action="변경"
        disabled
      />

      {/* 3. 다크모드 — 운영 AppNav 에 이미 동작. 여기서는 자리 placeholder */}
      <SettingsRow
        label="다크모드"
        value="시스템 설정 따름"
        action="변경"
        disabled
      />

      {/* 4. 폰트 크기 — 운영 PreferenceForm 의 TextSizeSelector 와 별도 자리 */}
      <SettingsRow
        label="폰트 크기"
        value="기본"
        action="변경"
        disabled
      />

      {/* 5. 모션 줄이기 — 접근성 (prefers-reduced-motion 미지원) */}
      <SettingsToggle
        label="모션 줄이기"
        desc="화면 전환 애니메이션 감소"
        checked={false}
        disabled
      />

      {/* 6. 고대비 모드 — 접근성 (prefers-contrast 미지원) */}
      <SettingsToggle
        label="고대비 모드"
        desc="명도 대비 강화"
        checked={false}
        disabled
      />
    </>
  );
}
