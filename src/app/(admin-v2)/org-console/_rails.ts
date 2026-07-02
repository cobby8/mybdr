// ============================================================
// org-console/_rails.ts — 8레일 골격 메타(P2/후속 컨셉) 정의
//   정본 참조: org-pages.jsx ORG_RAILS. 전부 [무중단ADD]/[신규테이블] 경계(브리프 §2-2) —
//   실동작 없음(준비중 ComingSoon 골격만). billing 만 "잠금"(정산 출금은 인증 후).
// ============================================================

export type RailKey =
  | "members"
  | "officers"
  | "teams"
  | "applications"
  | "leagues"
  | "suborgs"
  | "notices"
  | "billing";

export type RailMeta = {
  title: string;
  sub: string;
  note: string;
  kind: "table" | "cards";
  /** true면 "잠금"(인증 필요) 톤, false/미지정이면 "준비중" 톤. */
  locked?: boolean;
};

export const ORG_RAILS: Record<RailKey, RailMeta> = {
  members: {
    title: "멤버",
    sub: "단체 멤버를 초대하고 등급·권한을 관리해요.",
    kind: "table",
    note: "멤버 초대·등급 관리 화면을 준비하고 있어요. 곧 자기 단체 멤버를 직접 관리할 수 있어요.",
  },
  officers: {
    title: "임원",
    sub: "회장·총무 등 임원을 직책으로 지정해요.",
    kind: "table",
    note: "직책(텍스트)으로 임원을 지정하는 화면을 준비하고 있어요.",
  },
  teams: {
    title: "소속 팀",
    sub: "우리 단체 소속 팀을 등록·관리해요.",
    kind: "cards",
    note: "소속 팀 관리 화면을 준비하고 있어요.",
  },
  applications: {
    title: "회원 신청",
    sub: "가입 신청을 승인하거나 반려해요.",
    kind: "table",
    note: "회원 가입 신청 처리 화면을 준비하고 있어요.",
  },
  leagues: {
    title: "대회 · 리그",
    sub: "우리 단체가 여는 대회 · 리그를 관리해요.",
    kind: "cards",
    note: "대회 · 리그 개최 화면을 준비하고 있어요. 공식 대회 개최는 단체 인증 후 이용할 수 있어요.",
  },
  suborgs: {
    title: "하위 단체",
    sub: "지부 · 산하 단체를 1단계로 연결해요.",
    kind: "cards",
    note: "하위 단체(1단계) 연결 화면을 준비하고 있어요.",
  },
  notices: {
    title: "공지",
    sub: "멤버에게 공지를 발행해요.",
    kind: "table",
    note: "공지 작성 · 발행 화면을 준비하고 있어요.",
  },
  billing: {
    title: "회비 정산",
    sub: "회비 수납과 정산 내역을 확인해요.",
    kind: "table",
    locked: true,
    note: "회비 수납 · 조회는 곧 제공돼요. 다만 정산 출금은 단체 인증을 완료해야 이용할 수 있어요.",
  },
};
