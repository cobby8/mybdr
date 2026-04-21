/**
 * 다음카페 BDR 동아리 게시판 상수 맵.
 *
 * 왜 이 모듈이 필요한가:
 *   Phase 1 POC에서 3개 게시판(IVHA/Dilr/MptT)을 순차 스캔해야 한다.
 *   URL 조립 / 게시판 식별 / gameType 매핑을 한 곳에 모아두면
 *   fetcher/upsert/스크립트 어디서든 같은 상수로 일관성 유지 가능.
 *
 * DB 의존성 0. 순수 상수/함수만 노출.
 */

// ─────────────────────────────────────────────────────────────────────────────
// 카페 식별자
// ─────────────────────────────────────────────────────────────────────────────

/** 다음카페 URL 경로의 카페 코드 (https://m.cafe.daum.net/{CAFE_CODE}/...) */
export const CAFE_CODE = "dongarry";

/**
 * 다음카페 내부 API(`/api/v1/common-articles`)가 요구하는 카페 그룹 코드(grpid).
 *
 * 왜 별도 상수:
 *   - URL 경로의 CAFE_CODE("dongarry")와 완전히 다른 값 (내부 식별자).
 *   - Phase 3 #6 Pagination 에서 신규 도입 — 번들 역공학으로 확정 (`IGaj`).
 *   - IVHA/Dilr/MptT 3게시판 모두 동일 grpid 사용 (실측).
 *   - 하드코딩 방지 — listApiUrl 헬퍼에서만 참조.
 */
export const CAFE_GRP_CODE = "IGaj";

// ─────────────────────────────────────────────────────────────────────────────
// 게시판 정의
// ─────────────────────────────────────────────────────────────────────────────

/**
 * 카페 게시판 1건의 메타.
 *
 * - id: 다음카페 URL의 게시판 식별자 4자리 (예: IVHA)
 * - gameType: games.game_type 컬럼에 대응하는 논리 유형
 * - prefix: 생성할 code 접두사 (예: "PU-20260419-XXX")
 * - label: 로그/리포트 표시용 한글 라벨
 */
export interface CafeBoard {
  id: "IVHA" | "Dilr" | "MptT";
  gameType: "PICKUP" | "GUEST" | "PRACTICE";
  prefix: "PU" | "GU" | "PR";
  label: string;
}

/**
 * 동기화 대상 3개 게시판.
 * Phase 1은 이 3개만 순회하며 목록을 긁는다.
 */
export const CAFE_BOARDS: CafeBoard[] = [
  { id: "IVHA", gameType: "PICKUP", prefix: "PU", label: "픽업게임" },
  { id: "Dilr", gameType: "GUEST", prefix: "GU", label: "게스트 모집" },
  { id: "MptT", gameType: "PRACTICE", prefix: "PR", label: "연습 경기" },
];

// ─────────────────────────────────────────────────────────────────────────────
// URL 헬퍼
// ─────────────────────────────────────────────────────────────────────────────

/** 게시판 목록 페이지 URL (모바일) */
export function listUrl(board: CafeBoard): string {
  return `https://m.cafe.daum.net/${CAFE_CODE}/${board.id}`;
}

/** 특정 게시글 상세 URL (모바일). Phase 2에서 사용 */
export function articleUrl(board: CafeBoard, dataid: string): string {
  return `https://m.cafe.daum.net/${CAFE_CODE}/${board.id}/${dataid}`;
}

/** id 문자열로 CAFE_BOARDS에서 찾아서 반환. 못 찾으면 null */
export function getBoardById(id: string): CafeBoard | null {
  return CAFE_BOARDS.find((b) => b.id === id) ?? null;
}

/**
 * 게시판 목록 API URL (2페이지 이후 cursor-based pagination 용).
 *
 * 왜 필요한가:
 *   - 모바일 HTML SSR은 1페이지 20건만 내려주고, 후속 페이지는 Vue 컴포넌트가 XHR로 호출.
 *   - 실측 엔드포인트: `GET /api/v1/common-articles?grpid=&fldid=&targetPage=N&afterBbsDepth=<cursor>&pageSize=20`
 *   - `afterBbsDepth` 는 단순 페이지번호가 아니라 **직전 페이지 마지막 글의 bbsDepth 문자열**(커서).
 *   - pageSize 실측 상한 50 (100은 HTTP 500 반환).
 *
 * 참조: scratchpad-cafe-sync.md "📋 Phase 3 #6 Pagination 설계안" (실측 8패턴)
 *
 * @param board 대상 게시판
 * @param cursor 직전 페이지 마지막 글의 bbsDepth (1페이지 호출 금지 — afterBbsDepth=0 은 빈 배열 반환)
 * @param targetPage 요청 페이지 번호 (2부터)
 * @param pageSize 페이지당 건수 (1~50, 상한 강제는 fetcher 쪽)
 */
export function listApiUrl(
  board: CafeBoard,
  cursor: string,
  targetPage: number,
  pageSize: number,
): string {
  // URLSearchParams 로 안전 인코딩 (bbsDepth 문자열에 특수문자 잠재 대비)
  const params = new URLSearchParams({
    grpid: CAFE_GRP_CODE,
    fldid: board.id,
    targetPage: String(targetPage),
    afterBbsDepth: cursor,
    pageSize: String(pageSize),
  });
  return `https://m.cafe.daum.net/api/v1/common-articles?${params.toString()}`;
}
