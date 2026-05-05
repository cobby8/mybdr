// 알림 타입 상수 — 새 타입 추가 시 여기에만 추가
export const NOTIFICATION_TYPES = {
  // 경기 관련
  GAME_APPLICATION_RECEIVED: "game.application.received",     // 주최자: 신청 접수
  GAME_APPLICATION_SUBMITTED: "game.application.submitted",   // 신청자: 신청 완료
  GAME_APPLICATION_APPROVED: "game.application.approved",     // 신청자: 승인됨
  GAME_APPLICATION_REJECTED: "game.application.rejected",     // 신청자: 거부됨
  GAME_CANCELLED: "game.cancelled",                           // 참가자: 경기 취소
  GAME_REPORT_REQUEST: "game.report.request",                 // 참가자/호스트: 경기 종료 후 평가 작성 요청 (Phase 10-2)

  // 팀 관련
  TEAM_JOIN_REQUEST_RECEIVED: "team.join_request.received",   // 팀장: 가입신청 접수
  TEAM_JOIN_REQUEST_APPROVED: "team.join_request.approved",   // 신청자: 가입 승인
  TEAM_JOIN_REQUEST_REJECTED: "team.join_request.rejected",   // 신청자: 가입 거부
  // 2026-05-05 Phase 2 PR6 — 팀 멤버 라이프사이클 통합 신청 (jersey_change/dormant/withdraw)
  // 인프라만 = type 별 실제 동작 dispatcher 는 PR7+ 에서.
  TEAM_MEMBER_REQUEST_NEW: "team.member_request.new",         // 팀장/매니저: 멤버 신청 접수 (번호변경/휴면/탈퇴)
  TEAM_MEMBER_REQUEST_APPROVED: "team.member_request.approved", // 신청자: 신청 승인됨
  TEAM_MEMBER_REQUEST_REJECTED: "team.member_request.rejected", // 신청자: 신청 거부됨
  // 2026-05-05 Phase 3 PR10 — 팀 이적 (양쪽 팀장 승인 state machine)
  // FROM = 현 팀장에게 (신청자가 떠나려 한다는 통보) / TO = 새 팀장에게 (현 팀장 승인 후 통보)
  // APPROVED/REJECTED = 신청자에게 최종 결과 통보 (다른 사이드 captain 도 정보용 발송)
  TRANSFER_REQUEST_NEW_FROM: "transfer.request.new_from",     // 현 팀장: 본인 멤버가 이적 신청 시작
  TRANSFER_REQUEST_NEW_TO: "transfer.request.new_to",         // 새 팀장: 현 팀장 승인 후 결정 요청
  TRANSFER_REQUEST_APPROVED: "transfer.request.approved",     // 신청자: 양쪽 모두 승인 → 자동 이동 완료
  TRANSFER_REQUEST_REJECTED: "transfer.request.rejected",     // 신청자: 한쪽이라도 거부 → 종결
  // 2026-05-05 Phase 4 PR12 — 운영진 권한 위임/회수
  TEAM_OFFICER_PERMISSION_GRANTED: "team.officer_permission.granted",   // 위임받은 자: captain 이 권한 위임
  TEAM_OFFICER_PERMISSION_REVOKED: "team.officer_permission.revoked",   // 위임받은 자: captain 이 권한 회수 (또는 자동 회수)
  // 2026-05-05 Phase 5 PR15 — 유령회원 강제 액션 알림
  // 이유(왜): captain/ghostClassify 위임자가 강제 변경 시 대상에게 명시적 통지 (사용자 권리 보호).
  GHOST_CLASSIFIED: "team.ghost.classified",          // 대상: 유령으로 분류됨 (정보 — 로그인 유도)
  FORCE_WITHDRAWN: "team.ghost.force_withdrawn",      // 대상: 강제 탈퇴 처리됨
  FORCE_JERSEY_CHANGED: "team.ghost.force_jersey_changed", // 대상: 강제 jersey 변경됨
  // Phase 10-4 — 팀 매치 신청 (from_team → to_team). to_team captain 에게 발송.
  TEAM_MATCH_REQUEST_RECEIVED: "team.match_request.received", // 호스트팀 captain: 매치 신청 접수
  // Phase 10-4 후속 — PATCH (수락/거절/취소) 시 발송되는 결과 알림.
  // 이유(왜): 신청자(from_team proposer)는 자기가 보낸 매치 신청이 처리되면 즉시 알아야 하고,
  //         to_team captain 도 from 측이 신청을 취소했을 때 인박스에서 사라진 사유를 알 수 있어야 함.
  TEAM_MATCH_REQUEST_ACCEPTED: "team.match_request.accepted", // 신청자(proposer): 매치 신청 수락됨
  TEAM_MATCH_REQUEST_REJECTED: "team.match_request.rejected", // 신청자(proposer): 매치 신청 거절됨
  TEAM_MATCH_REQUEST_CANCELLED: "team.match_request.cancelled", // 호스트팀 captain: 매치 신청 취소됨

  // 대회 관련
  TOURNAMENT_JOIN_SUBMITTED: "tournament.join.submitted",     // 신청자: 대회 참가 신청 완료
  TOURNAMENT_JOIN_RECEIVED: "tournament.join.received",       // 주최자: 대회 참가 신청 접수
  TOURNAMENT_DDAY_REMINDER: "tournament.dday.reminder",       // 팀장: D-3/D-1 알림
  TOURNAMENT_BRACKET_APPROVAL: "tournament.bracket.approval", // 슈퍼관리자: 브라켓 승인 요청
  TOURNAMENT_BRACKET_APPROVED: "tournament.bracket.approved", // 관리자: 브라켓 승인됨

  // 리포트 관련
  WEEKLY_REPORT: "weekly.report",                             // 유저: 주간 운동 리포트 도착

  // 심판 플랫폼 관련 — 협회 워크플로우 5종
  // 이유: 공고 → 신청 → 선정 → 책임자 → 경기 배정 → 정산 흐름에서
  //      심판/관리자에게 이벤트별 알림이 필요. notifications 테이블을 그대로 사용.
  REFEREE_POOL_SELECTED: "referee.pool.selected",             // 심판: 공고에 선정됨
  REFEREE_POOL_CHIEF: "referee.pool.chief_assigned",          // 심판: 책임심판으로 지정됨
  REFEREE_ASSIGNMENT_CREATED: "referee.assignment.created",   // 심판: 경기 배정 생성
  REFEREE_SETTLEMENT_PAID: "referee.settlement.paid",         // 심판: 정산 상태 전환(paid/cancelled/refunded)
  REFEREE_ANNOUNCEMENT_NEW: "referee.announcement.new",       // 심판: 새 배정 공고 게시
} as const;

export type NotificationType =
  (typeof NOTIFICATION_TYPES)[keyof typeof NOTIFICATION_TYPES];
