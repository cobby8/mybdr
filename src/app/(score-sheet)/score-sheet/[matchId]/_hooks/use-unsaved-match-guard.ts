/**
 * useUnsavedMatchGuard — 미종료(in_progress) 경기 이탈 방지 가드.
 *
 * 2026-06-28 — 매치357 사고 재발 방지 (전자기록지 다중 입력 → PBP/스탯 2배 누적).
 *
 * 왜 (이유):
 *   매치357 = 임상엽이 입력 후 "경기 종료"를 누르지 않고 페이지 이탈 → 매치가 in_progress 로
 *   남음 → 나중에 다른 기록원(수빈)이 같은 경기를 열어 기존 데이터 위에 다시 입력 + 종료 →
 *   PBP/quarter_scores/선수스탯 2배 박제. 근본 원인은 "미종료 경기를 이탈해 in_progress 로
 *   방치"한 운영 흐름. 본 가드가 그 1차 진입점을 차단한다.
 *
 * 방법 (어떻게 — 두 벡터 모두 커버):
 *   1. beforeunload — 새로고침 / 탭 닫기 / 외부 URL 이동 / 브라우저 종료 (네이티브 확인창).
 *      SPA 라우트 변경에는 발화하지 않으므로 ②로 보완.
 *   2. popstate sentinel — 브라우저/기기 "뒤로", toolbar "뒤로"(router.back) 모두 popstate 발화.
 *      mount 시 sentinel history 1개 push → "뒤로" 시 sentinel 이 먼저 pop 되며 popstate 가 발화 →
 *      window.confirm 으로 경고. 취소 시 sentinel 재무장(머무름) / 확인 시 listener 해제 후 실제 이탈.
 *
 * 특징:
 *   - active=false 면 어떤 리스너도 설치하지 않음 (빈 경기 / 종료 매치 / 연습 모드 = 가드 0).
 *   - 하드 블록이 아닌 "경고 후 사용자 선택" (하프타임 등 정상 이탈 허용 — 운영 현실 정합).
 *   - DB / schema 변경 0. 순수 브라우저 history/이벤트.
 */

import { useEffect, useRef } from "react";

const LEAVE_MESSAGE =
  "경기가 아직 종료되지 않았습니다. '경기 종료'를 누르지 않고 나가면, 다른 기록원이 이어받을 때 같은 경기를 다시 입력해 점수·기록이 중복 박제될 수 있습니다. 정말 나가시겠습니까?";

export function useUnsavedMatchGuard(active: boolean): void {
  // 최신 active 값을 popstate 핸들러(클로저)가 참조하도록 ref 로 추적.
  const activeRef = useRef(active);
  activeRef.current = active;

  // ① beforeunload — 새로고침 / 탭 닫기 / 외부 이동 / 종료.
  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;
    const handler = (e: BeforeUnloadEvent) => {
      // 네이티브 확인창 트리거 (대부분 브라우저는 커스텀 문구 무시 — 표준 문구 노출).
      e.preventDefault();
      e.returnValue = "";
      return "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [active]);

  // ② popstate sentinel — 브라우저/기기 "뒤로" + toolbar "뒤로"(router.back) 공통 가드.
  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined") return;

    // sentinel 1개 push — "뒤로" 시 이 항목이 먼저 pop 되며 popstate 발화.
    window.history.pushState(null, "", window.location.href);

    const onPopState = () => {
      // 가드 비활성(종료/취소 등으로 active=false 전환) 시 통과.
      if (!activeRef.current) return;
      // 동기 confirm — popstate 는 비동기 모달을 기다릴 수 없으므로 네이티브 confirm 사용.
      const leave = window.confirm(LEAVE_MESSAGE);
      if (leave) {
        // 확인 → listener 해제 후 실제 이전 페이지로 이탈.
        window.removeEventListener("popstate", onPopState);
        window.history.back();
      } else {
        // 취소 → sentinel 재무장 (현재 페이지 머무름).
        window.history.pushState(null, "", window.location.href);
      }
    };

    window.addEventListener("popstate", onPopState);
    return () => {
      // listener 만 해제. 남은 sentinel 1개는 무해 (다음 "뒤로" 1회가 현재 페이지로 흡수될 뿐).
      //   cleanup 에서 history.back() 자동 호출 금지 — 종료 직후 가드 해제 시 사용자를
      //   의도치 않게 페이지 밖으로 튕겨내는 사고 방지.
      window.removeEventListener("popstate", onPopState);
    };
  }, [active]);
}
