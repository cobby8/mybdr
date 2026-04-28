import type { Metadata } from "next";
import { CourtSubmitForm } from "./_form/court-submit-form";

/* ============================================================
 * /courts/submit — 코트 제보 페이지 (UI 전용 박제)
 *
 * 이유(왜):
 *   BDR v2 신규 시안 CourtAdd.jsx 를 그대로 박제. DB 모델이 아직
 *   준비되지 않아(`court_submissions` 미존재) 이번 페이즈는 UI 만
 *   배치하고, 제출 시 alert("준비 중") + 완료 화면 분기만 동작한다.
 *   실제 제출 흐름(테이블·승인·알림)은 scratchpad 백로그에 정리.
 *
 * 구조:
 *   - server page: Metadata + 클라이언트 폼 임포트만
 *   - 클라이언트 폼: _form/court-submit-form.tsx (StepWizard 셸 사용)
 * ============================================================ */

export const metadata: Metadata = {
  title: "코트 제보 | MyBDR",
  description:
    "BDR에 등록되지 않은 농구장을 제보하세요. 운영팀 검토 후 등록되면 포인트와 배지를 받을 수 있어요.",
};

// 정적 페이지 — 별도 데이터 패칭 없음 (UI 박제 단계)
export default function CourtSubmitPage() {
  return <CourtSubmitForm />;
}
