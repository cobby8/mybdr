"use client";

// ============================================================
// referee-console/settings/page.tsx — 설정 (정본 referee-pages RF_SETTINGS / AdSettings 1:1)
//   ★글로벌 super 스코프 — 협회별 설정(fee-settings 등)은 협회 단위라 전역 단일 저장처 없음.
//     → 정책 구조를 READ 표시(정본 1:1) · 저장 = AdSettings 데모 no-op(M2 동일 패턴·보고).
//   - 협회별 단가/정책 실편집은 레거시 협회 admin(`/referee/admin`) 또는 R6-C 후속.
//   - mock 데이터 박제 아님 — 정책 항목(토글/값)은 운영 정책 설명 텍스트(시안 정본).
// ============================================================

import { AdSettings, type SettingsGroup } from "@/components/admin-v2";

// 정본 RF_SETTINGS 1:1 — 배정/자격검증/정산 정책 그룹.
const GROUPS: SettingsGroup[] = [
  {
    group: "배정 정책",
    items: [
      {
        k: "rf_auto",
        type: "toggle",
        on: true,
        label: "자동 배정 추천",
        desc: "등급·지역 기반으로 후보 심판을 자동 추천합니다.",
      },
      {
        k: "rf_conflict",
        type: "toggle",
        on: true,
        label: "일정 충돌 차단",
        desc: "같은 시간대 중복 배정을 자동으로 막습니다.",
      },
      {
        k: "rf_min",
        type: "value",
        value: "주심 1 · 부심 2",
        label: "기본 배정 구성",
        desc: "공인 경기의 기본 심판 구성입니다.",
      },
    ],
  },
  {
    group: "자격·검증",
    items: [
      {
        k: "rf_expire",
        type: "toggle",
        on: true,
        label: "자격 만료 알림",
        desc: "자격증 만료 30일 전 자동 알림을 보냅니다.",
      },
      {
        k: "rf_probation",
        type: "value",
        value: "5경기",
        label: "수습 해제 기준",
        desc: "신규 심판의 수습 해제에 필요한 경기 수입니다.",
      },
    ],
  },
  {
    group: "정산",
    items: [
      {
        k: "rf_cycle",
        type: "value",
        value: "매월 5일",
        label: "정산 주기",
        desc: "심판 수당 정산·지급 기준일입니다.",
      },
      {
        k: "rf_tax",
        type: "toggle",
        on: true,
        label: "원천징수 적용",
        desc: "수당 지급 시 3.3% 원천징수를 자동 계산합니다.",
      },
    ],
  },
];

export default function RefereeSettingsPage() {
  return (
    <AdSettings
      eyebrow="심판 콘솔"
      title="설정"
      sub="심판 배정·자격·정산 정책을 확인합니다. 협회별 단가 편집은 준비 중입니다."
      groups={GROUPS}
    />
  );
}
