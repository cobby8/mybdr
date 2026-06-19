/* ============================================================
 * /my/registrations — 내 신청 현황 (M2 wave2 대기열)
 *
 * 왜 이 페이지가 있는가:
 *   대기열 도입으로 "내가 신청한 경기"가 신청완료·확정·대기 N번·승격(확정 대기)
 *   4개 상태로 갈린다. 이를 한 화면에서 관리하도록 시안 MyRegistrationStatus 를 박제.
 *
 * 구조: 얇은 서버 컴포넌트(메타데이터만) + 클라 컴포넌트(데이터 fetch + 상태분기).
 *   데이터는 GET /api/web/me/registrations 로 클라에서 받는다(읽기 전용).
 * ============================================================ */

import type { Metadata } from "next";
import { MyRegistrationsClient } from "./registrations-client";

export const metadata: Metadata = {
  title: "내 신청 현황 | MyBDR",
  description: "신청·대기·확정 상태를 한 화면에서 관리하세요.",
};

export default function MyRegistrationsPage() {
  return <MyRegistrationsClient />;
}
