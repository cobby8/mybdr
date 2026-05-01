"use client";

/* ============================================================
 * FeedSectionV2 — Settings "맞춤설정 (피드)" 섹션
 *
 * 왜 (2026-05-01 신설 — 사용자 결정 A1-DB-direct + Q1=① + Q2=전체):
 *  - 시안 v2.3 Settings 7섹션 중 "feed" (맞춤설정) 자리.
 *  - 운영 `/profile/preferences` 페이지의 `<PreferenceForm mode="settings"/>` 를
 *    Settings 안에 그대로 흡수 (Q2=전체 = 8섹션 풀 폼 흡수).
 *  - 사용자 결정 Q3=빼기: 성별 chip 은 시안에만 있고 DB 미지원이라 PreferenceForm 그대로 사용.
 *  - 사용자 결정 Q1=①: /profile/preferences 페이지는 redirect 유지 (?section=feed 매핑).
 *
 * 어떻게:
 *  - PreferenceForm 시그니처 무변경 — mode="settings" 로 호출하면 자체 saving 로직 + window.reload.
 *  - 컨테이너 padding/margin 은 settings 카드 안에서 자연스럽게 보이도록 SettingsHeader 만 추가.
 *  - PreferenceForm 자체가 sticky 저장 버튼 (-mx-4) 가지고 있어 settings 카드 우측 padding 28 와
 *    살짝 충돌 가능성 있음 → 자체 컨테이너 padding 0 으로 PreferenceForm 가 자체 폭 점유.
 * ============================================================ */

import { SettingsHeader } from "./settings-ui";
import { PreferenceForm } from "@/components/shared/preference-form";

export function FeedSectionV2() {
  return (
    <>
      <SettingsHeader
        title="맞춤설정"
        desc="선택한 조건에 맞는 경기·대회·픽업만 홈·피드에 노출됩니다 · 언제든 변경 가능"
      />

      {/* PreferenceForm — settings 모드 (저장 후 window.location.reload 로 사이드바 동기화).
          내부적으로 GET/PATCH /api/web/preferences 호출 (운영 API 그대로 사용). */}
      <PreferenceForm mode="settings" />
    </>
  );
}
