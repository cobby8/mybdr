"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
// useSearchParams: 팀 가입 신청 알림(`/teams/:id/manage?tab=requests`) 클릭 시
// 곧바로 "가입 신청" 탭으로 진입시키기 위해 초기 탭을 쿼리에서 결정
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
// Phase 4 PR12 — 운영진 권한 위임 탭 (captain only)
import { OfficerPermissionsTab } from "./_components/officer-permissions-tab";

// ─────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────

const ROLE_OPTIONS = [
  { value: "director", label: "감독" },
  { value: "coach", label: "코치" },
  { value: "captain", label: "팀장" },
  { value: "manager", label: "매니저" },
  { value: "treasurer", label: "총무" },
  { value: "member", label: "멤버" },
];

interface TeamMember {
  id: string;
  user_id: string;
  nickname: string;
  position: string | null;
  profile_image: string | null;
  role: string;
}

interface JoinRequest {
  id: string;
  user_id: string;
  user: {
    id: string;
    nickname: string | null;
    name: string | null;
    position: string | null;
    city: string | null;
    district: string | null;
    profile_image: string | null;
  } | null;
  message: string | null;
  preferred_position: string | null;
  created_at: string;
}

interface TeamEditData {
  id: string;
  name: string;
  // Phase 2B: 영문 팀명 + 대표 언어
  name_en: string | null;
  name_primary: "ko" | "en" | null;
  description: string | null;
  city: string | null;
  district: string | null;
  home_court: string | null;
  founded_year: number | null;
  primary_color: string | null;
  secondary_color: string | null;
  // 2026-04-29: 생성 시 입력받지만 관리에 누락이었던 3 필드 추가
  home_color: string | null;
  away_color: string | null;
  logo_url: string | null;
  is_public: boolean | null;
  accepting_members: boolean | null;
  max_members: number | null;
  status: string | null;
  // 정책 결정 3A: 서버가 알려주는 본인 운영진 역할 / 팀장 여부
  // my_role: "captain" | "vice" | "manager" | null (super_admin이면 null)
  // is_captain: PATCH/DELETE 가능 여부 (captain 또는 super_admin)
  my_role: string | null;
  is_captain: boolean;
}

// Phase 2B: 영문명 허용 패턴 — 서버 Zod 스키마와 동일 규칙
const NAME_EN_PATTERN = /^[A-Za-z0-9 \-]+$/;

// 시안 v2(1) 4탭 + Phase 10-4 매치신청 + Phase 2 PR7 멤버 변경요청 + Phase 4 PR12 운영진 권한 = 7탭 구조
// 이유(왜): 호스트가 받은 매치 신청(team_match_requests)을 처리할 UI가 필요. 별도 페이지 없이
// 기존 manage 페이지에 탭으로 추가해 컨텍스트 유지.
// member-requests: 본인 멤버가 보낸 번호변경/휴면/탈퇴 신청을 팀장/매니저가 처리.
// officers: captain 만 진입 — manager/coach/treasurer/director 에게 권한 분배.
type ManageTab =
  | "roster"
  | "applicants"
  | "matches"
  | "member-requests"
  | "officers"
  | "invite"
  | "settings";

// 쿼리 문자열 → 내부 탭 키로 정규화.
// 이유: 팀 가입 신청 알림의 actionUrl은 `?tab=requests`로 보내지만 (의미 명확)
// 실제 내부 탭 키는 `applicants`다. 두 표기 모두 허용해 외부 진입과 내부 표기를 분리한다.
// matches: 매치 신청 알림(NOTIFICATION_TYPES.TEAM_MATCH_REQUEST_RECEIVED) 클릭 진입용
function resolveInitialTab(raw: string | null): ManageTab {
  if (!raw) return "roster";
  // requests / request → applicants 매핑 (가입 신청 알림 호환)
  if (raw === "requests" || raw === "request" || raw === "applicants") return "applicants";
  // matches / match-requests → matches 매핑 (매치 신청 알림 호환)
  if (raw === "matches" || raw === "match-requests" || raw === "match") return "matches";
  // 2026-05-05 Phase 2 PR7 — 멤버 변경요청 탭 (번호변경/휴면/탈퇴 알림 호환)
  if (raw === "member-requests" || raw === "memberRequests" || raw === "jersey-change") return "member-requests";
  // 2026-05-05 Phase 4 PR12 — 운영진 권한 탭 (captain only)
  if (raw === "officers" || raw === "officer-permissions") return "officers";
  if (raw === "roster" || raw === "invite" || raw === "settings") return raw;
  return "roster";
}

// ─── 매치 신청 인박스 카드용 타입 ───
// 이유(왜): GET /api/web/teams/[id]/match-requests 응답 형식과 1:1 매핑.
// status 는 'pending' | 'accepted' | 'rejected' | 'cancelled' 등이 올 수 있으나
// 클라이언트에서는 string 으로 받아 분기 처리 (서버가 enum 강제 안 함)
interface MatchRequestRow {
  id: string;
  status: string;
  message: string | null;
  preferred_date: string | null;
  created_at: string;
  updated_at: string;
  from_team: {
    id: string;
    name: string;
    primary_color: string | null;
    city: string | null;
    district: string | null;
  } | null;
  proposer: {
    id: string;
    nickname: string;
    profile_image: string | null;
  } | null;
}

// 2026-05-05 Phase 3 PR10+PR11 — 팀 이적 신청 (양쪽 팀장 승인 state machine)
// 이유: GET /api/web/transfer-requests 응답 형식과 1:1 매핑. 본 manage 페이지에서는
//   본 팀이 from 또는 to 인 pending 신청을 모두 조회 → side 별 분리 표시.
// PATCH /api/web/transfer-requests/:id 호출 시 side 와 action 명시.
interface TransferRequestRow {
  id: string;
  userId: string;
  fromTeamId: string;
  toTeamId: string;
  reason: string | null;
  fromTeamStatus: string;
  toTeamStatus: string;
  finalStatus: string;
  fromProcessedAt: string | null;
  toProcessedAt: string | null;
  fromRejectionReason: string | null;
  toRejectionReason: string | null;
  createdAt: string;
  fromTeam: { id: string; name: string; logoUrl: string | null } | null;
  toTeam: { id: string; name: string; logoUrl: string | null } | null;
  user?: { id: string; nickname: string | null; name: string | null; profile_image: string | null } | null;
}

// 2026-05-05 Phase 2 PR7 — 멤버 변경 요청 (번호변경/휴면/탈퇴 통합)
// 이유: PR6 GET /api/web/teams/[id]/requests 응답 형식과 1:1 매핑.
// requestType = jersey_change | dormant | withdraw / status = pending | approved | rejected | cancelled
// payload 는 type 별 다름 (snake_case 변환 0 — JSON 컬럼)
interface MemberRequestRow {
  id: string;
  teamId: string;
  userId: string;
  requestType: "jersey_change" | "dormant" | "withdraw";
  payload: unknown;
  reason: string | null;
  status: string;
  processedById: string | null;
  processedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    nickname: string | null;
    name: string | null;
    profile_image: string | null;
  } | null;
  processedBy: {
    id: string;
    nickname: string | null;
    name: string | null;
  } | null;
}

export default function TeamManagePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();

  // 탭 상태 — 시안 기본값 'roster' 유지하되, ?tab= 쿼리가 있으면 우선 적용
  // (팀 가입 신청 알림 클릭 시 ?tab=requests → applicants 자동 활성화)
  const [tab, setTab] = useState<ManageTab>(() =>
    resolveInitialTab(searchParams.get("tab")),
  );

  // ─── 멤버 관리 상태 ───
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);
  const [roleChanging, setRoleChanging] = useState<string | null>(null);

  // ─── 매치 신청 인박스 상태 ───
  // 이유(왜): roster/가입신청과 분리된 별도 fetch — 매치신청 탭 진입 시점에만 로드해
  // 초기 페이지 로딩 부담을 줄인다. 다만 상단 배너 카운트 동기화를 위해 첫 마운트 시도 1회 호출.
  const [matchRequests, setMatchRequests] = useState<MatchRequestRow[]>([]);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  // 수락/거절 처리 중인 신청 id (버튼 disabled + 처리 중 라벨용)
  const [matchProcessing, setMatchProcessing] = useState<string | null>(null);

  // ─── 2026-05-05 Phase 2 PR7 — 멤버 변경 요청 (번호변경/휴면/탈퇴) 인박스 상태 ───
  // 이유: 팀장/매니저가 받은 멤버 신청 (jersey_change/dormant/withdraw) 을 한 곳에서 처리.
  // PR7 = jersey_change 만 실제 작동 / dormant + withdraw 는 표시만 (PR8/PR9 에서 활성화).
  const [memberRequests, setMemberRequests] = useState<MemberRequestRow[]>([]);
  const [memberReqLoading, setMemberReqLoading] = useState(false);
  const [memberReqError, setMemberReqError] = useState<string | null>(null);
  const [memberReqProcessing, setMemberReqProcessing] = useState<string | null>(null);

  // ─── 2026-05-05 Phase 3 PR10+PR11 — 팀 이적 신청 인박스 상태 ───
  // 이유: 본 팀이 fromTeam (떠나는 신청) 또는 toTeam (들어오는 신청) 인 pending 만 조회.
  //   captain only — 권한 검증은 GET/PATCH 시 서버에서 수행 (이중 가드).
  // 사용처: "변경 요청" 탭 하단 별도 섹션 ("이적 신청") — type 별 시각 분리
  const [transferRequests, setTransferRequests] = useState<TransferRequestRow[]>([]);
  const [transferReqLoading, setTransferReqLoading] = useState(false);
  const [transferReqError, setTransferReqError] = useState<string | null>(null);
  const [transferReqProcessing, setTransferReqProcessing] = useState<string | null>(null);

  // ─── 팀 설정 상태 ───
  const [teamData, setTeamData] = useState<TeamEditData | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showDissolve, setShowDissolve] = useState(false);
  const [dissolving, setDissolving] = useState(false);

  // 팀 수정 폼 필드
  const [name, setName] = useState("");
  // Phase 2B: 영문 팀명 + 대표 언어
  const [nameEn, setNameEn] = useState("");
  const [namePrimary, setNamePrimary] = useState<"ko" | "en">("ko");
  const [nameEnError, setNameEnError] = useState<string | null>(null);
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [homeCourt, setHomeCourt] = useState("");
  const [foundedYear, setFoundedYear] = useState<number | "">("");
  const [primaryColor, setPrimaryColor] = useState("#FFFFFF");
  const [secondaryColor, setSecondaryColor] = useState("#000000");
  // 2026-04-29: 신규 — 홈/어웨이 유니폼 색상 + 팀 로고 URL.
  // 기본값은 BDR 브랜드 컬러 (생성 폼 step-emblem 과 동일) 로 맞춰
  // 미설정 팀에서도 화면이 깨지지 않게 한다.
  const [homeColor, setHomeColor] = useState("#E31B23");
  const [awayColor, setAwayColor] = useState("#1B3C87");
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  // 로고 업로드 진행 중 상태 — 중복 클릭 차단 + 시각 피드백
  const [logoUploading, setLogoUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(true);
  const [acceptingMembers, setAcceptingMembers] = useState(true);
  const [maxMembers, setMaxMembers] = useState(15);

  // ─── 멤버 관리: 가입 신청 목록 조회 ───
  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/web/teams/${id}/members`);
      if (res.status === 403) {
        setError("팀장만 접근할 수 있습니다.");
        return;
      }
      if (!res.ok) throw new Error("조회 실패");
      const data = await res.json();
      // apiSuccess 응답 형식: { members, requests } 직접 (data.data 래핑 없음)
      // 이전 코드 `data.data?.requests ?? data.data ?? []` 는 항상 [] 반환 — 버그
      setMembers(data.members ?? []);
      setRequests(data.requests ?? []);
    } catch {
      setError("가입신청 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  // ─── 팀 설정: 팀 정보 로드 ───
  const fetchTeamData = useCallback(async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch(`/api/web/teams/${id}`);
      if (res.status === 403) {
        setError("팀장만 접근할 수 있습니다.");
        return;
      }
      if (!res.ok) throw new Error();
      // apiSuccess 응답 형식: { id, name, ... } 직접 (data 래핑 없음)
      // 이전 코드 `json.data` 는 undefined → 폼이 빈값으로 초기화되는 버그
      const data: TeamEditData = await res.json();
      setTeamData(data);

      // 폼 초기값 설정
      setName(data.name ?? "");
      // Phase 2B: 영문명/대표 언어 로드
      setNameEn(data.name_en ?? "");
      setNamePrimary(data.name_primary === "en" ? "en" : "ko");
      setDescription(data.description ?? "");
      setCity(data.city ?? "");
      setDistrict(data.district ?? "");
      setHomeCourt(data.home_court ?? "");
      setFoundedYear(data.founded_year ?? "");
      setPrimaryColor(data.primary_color ?? "#FFFFFF");
      setSecondaryColor(data.secondary_color ?? "#000000");
      // 2026-04-29: home/away 가 null 이면 primary/secondary 폴백,
      // 그것도 없으면 BDR 기본값. 기존 팀(home_color 백필 전) UX 보호.
      setHomeColor(data.home_color ?? data.primary_color ?? "#E31B23");
      setAwayColor(data.away_color ?? data.secondary_color ?? "#1B3C87");
      setLogoUrl(data.logo_url ?? null);
      setIsPublic(data.is_public ?? true);
      setAcceptingMembers(data.accepting_members ?? true);
      setMaxMembers(data.max_members ?? 15);
    } catch {
      // 설정 로드 실패는 무시 (멤버 관리만 사용 가능)
    } finally {
      setSettingsLoading(false);
    }
  }, [id]);

  // ─── 매치 신청 인박스: 목록 조회 ───
  // 이유(왜): captain/vice/manager 가드는 서버에서 처리. 클라이언트는 403/실패만 메시지 노출.
  const fetchMatchRequests = useCallback(async () => {
    setMatchLoading(true);
    setMatchError(null);
    try {
      const res = await fetch(`/api/web/teams/${id}/match-requests`);
      if (res.status === 403) {
        setMatchError("팀 운영진만 접근할 수 있습니다.");
        return;
      }
      if (!res.ok) throw new Error("조회 실패");
      const data = await res.json();
      setMatchRequests(data.requests ?? []);
    } catch {
      setMatchError("매치 신청 목록을 불러오지 못했습니다.");
    } finally {
      setMatchLoading(false);
    }
  }, [id]);

  // ─── 매치 신청: 수락/거절 액션 ───
  // 이유(왜): PATCH 라우트는 별도 작업에서 신설 예정. 여기서는 호출만 — captain 만 가능.
  // 단순화: rejection_reason 입력 UI 미포함 (가입신청과 달리 매치신청은 "취소"만 안내).
  async function handleMatchAction(reqId: string, action: "approve" | "reject") {
    setMatchProcessing(reqId);
    try {
      const res = await fetch(`/api/web/teams/${id}/match-request/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // 서버가 아직 PATCH 미구현일 수도 있어 404 도 메시지화
        const msg =
          res.status === 404
            ? "수락/거절 기능이 아직 준비되지 않았습니다."
            : (data.message ?? data.error ?? "처리 중 오류가 발생했습니다.");
        alert(msg);
        return;
      }
      // 성공 시 status 를 즉시 업데이트 — 카드 색상 분기에 활용
      setMatchRequests((prev) =>
        prev.map((r) =>
          r.id === reqId
            ? { ...r, status: action === "approve" ? "accepted" : "rejected" }
            : r
        )
      );
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setMatchProcessing(null);
    }
  }

  // ─── 2026-05-05 Phase 2 PR7 — 멤버 변경 요청 목록 조회 ───
  // 이유: GET /api/web/teams/[id]/requests?status=pending 으로 pending 만 조회.
  // captain/manager 권한 검증은 서버에서 수행 (canSeeAll=true 일 때만 팀 전체 응답).
  const fetchMemberRequests = useCallback(async () => {
    setMemberReqLoading(true);
    setMemberReqError(null);
    try {
      const res = await fetch(`/api/web/teams/${id}/requests?status=pending`);
      if (res.status === 403) {
        setMemberReqError("팀장 또는 매니저만 접근할 수 있습니다.");
        return;
      }
      if (!res.ok) throw new Error("조회 실패");
      const data = await res.json();
      // apiSuccess envelope: { data: { requests, canSeeAll } }
      const list = (data?.data?.requests ?? data?.requests ?? []) as MemberRequestRow[];
      const canSeeAll = data?.data?.canSeeAll ?? data?.canSeeAll ?? false;
      // canSeeAll=false 면 본인 신청만 응답 — 일반 멤버 시야이므로 빈 처리
      setMemberRequests(canSeeAll ? list : []);
    } catch {
      setMemberReqError("멤버 신청 목록을 불러오지 못했습니다.");
    } finally {
      setMemberReqLoading(false);
    }
  }, [id]);

  // ─── 멤버 변경 요청: 승인/거부 액션 ───
  // 이유: PATCH /api/web/teams/[id]/requests/[requestId] 호출.
  // PR7 에서 jersey_change 는 실제 동작 (team_members.jersey_number UPDATE) /
  // dormant·withdraw 는 status 변경만 (PR8/PR9 에서 활성화).
  async function handleMemberRequestAction(reqId: string, action: "approve" | "reject") {
    let rejectionReason: string | null = null;
    if (action === "reject") {
      const input = window.prompt(
        "거부 사유를 입력하세요 (선택, 신청자에게 노출됩니다. 비워두면 사유 없이 거부):",
        "",
      );
      if (input === null) return;
      const trimmed = input.trim();
      rejectionReason = trimmed ? trimmed.slice(0, 500) : null;
    }
    setMemberReqProcessing(reqId);
    try {
      const res = await fetch(`/api/web/teams/${id}/requests/${reqId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          ...(action === "reject" && rejectionReason ? { rejectionReason } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? data.message ?? "처리 중 오류가 발생했습니다.");
        return;
      }
      // 성공 시 row 제거 (pending 만 표시 중이므로)
      setMemberRequests((prev) => prev.filter((r) => r.id !== reqId));
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setMemberReqProcessing(null);
    }
  }

  // ─── 2026-05-05 Phase 3 PR10+PR11 — 팀 이적 신청 조회 ───
  // 이유: 본 팀이 fromTeam 또는 toTeam 인 pending 신청을 captain 시야로 조회.
  // 권한: 서버 GET /api/web/teams/[id]/transfer-requests 가 captain 검증.
  const fetchTransferRequests = useCallback(async () => {
    setTransferReqLoading(true);
    setTransferReqError(null);
    try {
      const res = await fetch(`/api/web/teams/${id}/transfer-requests?status=pending`);
      if (res.status === 403) {
        setTransferReqError("팀장만 접근할 수 있습니다.");
        setTransferRequests([]);
        return;
      }
      if (!res.ok) throw new Error("조회 실패");
      const data = await res.json();
      const list = (data?.data?.transferRequests ?? []) as TransferRequestRow[];
      setTransferRequests(list);
    } catch {
      setTransferReqError("이적 신청 목록을 불러오지 못했습니다.");
    } finally {
      setTransferReqLoading(false);
    }
  }, [id]);

  // ─── 이적 승인/거부 액션 ───
  // 이유: PATCH /api/web/transfer-requests/[requestId] 호출 시 side ('from' | 'to') 명시.
  //   side 는 본 팀 == fromTeam 이면 'from', 본 팀 == toTeam 이면 'to'.
  async function handleTransferAction(
    row: TransferRequestRow,
    action: "approve" | "reject",
  ) {
    // side 결정 — 본 팀이 어느 사이드인지
    const side: "from" | "to" =
      row.fromTeamId === id ? "from" : row.toTeamId === id ? "to" : "from";
    let rejectionReason: string | null = null;
    if (action === "reject") {
      const input = window.prompt(
        "거부 사유를 입력하세요 (선택, 신청자에게 노출됩니다. 비워두면 사유 없이 거부):",
        "",
      );
      if (input === null) return;
      const trimmed = input.trim();
      rejectionReason = trimmed ? trimmed.slice(0, 500) : null;
    }
    setTransferReqProcessing(row.id);
    try {
      const res = await fetch(`/api/web/transfer-requests/${row.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          side,
          action,
          ...(action === "reject" && rejectionReason ? { rejectionReason } : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? data.message ?? "처리 중 오류가 발생했습니다.");
        return;
      }
      // 성공 시 row 제거 — finalStatus 가 pending 으로 남아도 본 사이드 처리 끝났으므로 인박스에서 제외
      setTransferRequests((prev) => prev.filter((r) => r.id !== row.id));
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setTransferReqProcessing(null);
    }
  }

  // 초기 로드: 멤버/신청 (탭과 무관하게 항상 로드 — 탭 카운트 표시용)
  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  // 매치 신청도 첫 마운트 시 1회 로드 — 탭 카운트 뱃지 표시용
  // 이유(왜): 탭에 들어가기 전에도 "몇 건 대기 중" 정보를 노출해야 캡틴이 알아챈다.
  useEffect(() => { fetchMatchRequests(); }, [fetchMatchRequests]);
  // 2026-05-05 Phase 2 PR7 — 멤버 변경 요청도 첫 마운트 시 1회 로드 (탭 카운트용)
  useEffect(() => { fetchMemberRequests(); }, [fetchMemberRequests]);
  // 2026-05-05 Phase 3 PR10+PR11 — 이적 신청도 첫 마운트 시 1회 로드 (변경 요청 탭 카운트 합산)
  useEffect(() => { fetchTransferRequests(); }, [fetchTransferRequests]);
  useEffect(() => {
    // settings 또는 matches 탭 진입 시 teamData 로드.
    // 이유(왜): matches 탭의 수락/거절 버튼 노출 분기는 is_captain 에 의존 — 미로드 시 항상 비활성화로 보여
    // 캡틴이 액션을 못 하는 사일런트 버그가 난다.
    if ((tab === "settings" || tab === "matches") && !teamData) {
      fetchTeamData();
    }
  }, [tab, teamData, fetchTeamData]);

  // ─── 멤버 관리: 승인/거부 핸들러 ───
  // reject 시 거부 사유 prompt — 빈값 허용 / cancel은 진행 중단
  // (신청자의 `/profile/activity?tab=teams` 와 팀 상세 UI, 앱 알림 content에 노출)
  async function handleAction(requestId: string, action: "approve" | "reject") {
    let rejectionReason: string | null = null;
    if (action === "reject") {
      const input = window.prompt(
        "거부 사유를 입력하세요 (선택, 신청자에게 노출됩니다. 비워두면 사유 없이 거부):",
        "",
      );
      // prompt null = cancel 클릭 → 거부 자체를 취소
      if (input === null) return;
      const trimmed = input.trim();
      rejectionReason = trimmed ? trimmed.slice(0, 500) : null;
    }

    setProcessing(requestId);
    try {
      const res = await fetch(`/api/web/teams/${id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId,
          action,
          ...(action === "reject" && rejectionReason
            ? { rejection_reason: rejectionReason }
            : {}),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? data.message ?? "처리 중 오류가 발생했습니다.");
        return;
      }
      setRequests((prev) => prev.filter((r) => r.id !== requestId));
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setProcessing(null);
    }
  }

  // ─── 멤버 관리: 역할 변경 핸들러 ───
  async function handleRoleChange(memberId: string, newRole: string) {
    setRoleChanging(memberId);
    try {
      const res = await fetch(`/api/web/teams/${id}/members`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, role: newRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? data.message ?? "역할 변경 실패");
        return;
      }
      setMembers((prev) => prev.map((m) => m.id === memberId ? { ...m, role: newRole } : m));
    } catch {
      alert("네트워크 오류");
    } finally {
      setRoleChanging(null);
    }
  }

  // ─── 팀 로고 업로드 핸들러 ───
  // 이유(왜): 생성 폼 step-emblem.tsx 와 동일한 즉시 업로드 패턴.
  //   파일 선택 즉시 /api/web/upload (Supabase Storage) 호출 → public URL 받아 state 저장.
  //   클라 1차 검증: 5MB 이하 + image/* MIME 만 허용 (서버는 jpeg/png/webp/gif).
  // 부분 실패 방어: 업로드 실패 시 logoUrl 은 미변경 유지.
  async function handleLogoFile(file: File | null) {
    setLogoError(null);
    if (!file) {
      setLogoUrl(null);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("이미지 크기는 5MB 이하만 가능합니다.");
      return;
    }
    if (!file.type.startsWith("image/")) {
      setLogoError("PNG, JPG, WEBP, GIF 이미지만 업로드 가능합니다.");
      return;
    }
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("bucket", "team-logos");
      fd.append("path", "logos");
      const res = await fetch("/api/web/upload", { method: "POST", body: fd });
      const json = (await res.json().catch(() => null)) as
        | { url?: string; error?: string }
        | null;
      if (!res.ok) {
        setLogoError(json?.error ?? "업로드에 실패했습니다.");
        return;
      }
      const url = json?.url;
      if (!url) {
        setLogoError("서버 응답에 URL이 없습니다.");
        return;
      }
      setLogoUrl(url);
    } catch (err) {
      console.error("[manage logo upload]", err);
      setLogoError("네트워크 오류로 업로드하지 못했습니다.");
    } finally {
      setLogoUploading(false);
    }
  }

  // ─── 팀 설정: 수정 제출 핸들러 ───
  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (name.trim().length < 2) {
      alert("팀명은 2자 이상 입력해주세요.");
      return;
    }
    // Phase 2B: 영문명이 입력돼 있다면 형식 체크 (서버 400을 미리 방어)
    const trimmedNameEn = nameEn.trim();
    if (trimmedNameEn && !NAME_EN_PATTERN.test(trimmedNameEn)) {
      setNameEnError("영문/숫자/공백/하이픈만 입력할 수 있습니다.");
      alert("영문 팀명은 영문/숫자/공백/하이픈만 입력할 수 있습니다.");
      return;
    }
    setNameEnError(null);
    setSaving(true);
    try {
      const res = await fetch(`/api/web/teams/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          // Phase 2B: 영문명 비어있으면 null로 저장 / 대표언어는 영문명이 있을 때만 의미, 없으면 "ko"
          name_en: trimmedNameEn || null,
          name_primary: trimmedNameEn ? namePrimary : "ko",
          description: description.trim() || null,
          city: city.trim() || null,
          district: district.trim() || null,
          home_court: homeCourt.trim() || null,
          founded_year: foundedYear || null,
          primary_color: primaryColor,
          secondary_color: secondaryColor,
          // 2026-04-29: 신규 필드 — Zod regex 가 #RRGGBB 형식 강제하므로
          // 항상 6자리 hex 만 전송됨 (UI 에서 onBlur 복원 처리).
          home_color: homeColor,
          away_color: awayColor,
          // null 도 허용 (logoUrlSchema 가 처리). 빈 문자열 -> null 로 보내면 logo 제거.
          logo_url: logoUrl ?? null,
          is_public: isPublic,
          accepting_members: acceptingMembers,
          max_members: maxMembers,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? data.message ?? "수정 중 오류가 발생했습니다.");
        return;
      }
      alert("팀 정보가 수정되었습니다.");
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // ─── 팀 해산 핸들러 ───
  async function handleDissolve() {
    setDissolving(true);
    try {
      const res = await fetch(`/api/web/teams/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "해산 처리 중 오류가 발생했습니다.");
        return;
      }
      // 해산 성공 → 팀 목록으로 이동
      router.push("/teams");
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setDissolving(false);
      setShowDissolve(false);
    }
  }

  // 정책 결정 3A: captain만 수정/해산 가능. 부팀장/매니저는 조회만 가능.
  // 서버가 응답에 is_captain을 명시 — 클라이언트는 그 boolean으로 폼/버튼 disabled 분기.
  // teamData가 아직 없을 때(=로딩 전)는 false로 두어도 무방 (폼 자체가 안 보임)
  const canEditTeam = teamData?.is_captain === true;

  // 매치신청 pending 카운트 — 탭 뱃지에 표시
  // 이유(왜): 전체 신청 수가 아닌 처리 대기(pending) 만 노출해야 호스트의 행동 유도가 명확.
  const pendingMatchCount = matchRequests.filter((r) => r.status === "pending").length;
  // 2026-05-05 Phase 2 PR7 — 멤버 변경 요청 (이미 status=pending 만 조회하므로 length 그대로)
  // 2026-05-05 Phase 3 PR10+PR11 — 이적 신청도 합산 (양쪽 사이드 미처리)
  const pendingMemberReqCount = memberRequests.length + transferRequests.length;

  // 시안 4탭 + 매치신청 + 멤버 변경요청 + (captain) 운영진 권한 = 7탭.
  // 운영진 권한 탭은 captain 만 노출 (위임 가능 권한자 = captain only — 보고서 §4 결정 #4)
  const tabs: { id: ManageTab; label: string; count: number }[] = [
    { id: "roster", label: "로스터", count: members.length },
    { id: "applicants", label: "가입 신청", count: requests.length },
    { id: "member-requests", label: "변경 요청", count: pendingMemberReqCount },
    { id: "matches", label: "매치 신청", count: pendingMatchCount },
    ...((teamData?.is_captain === true)
      ? ([{ id: "officers" as ManageTab, label: "운영진 권한", count: 0 }] as const)
      : []),
    { id: "invite", label: "초대 링크", count: 0 },
    { id: "settings", label: "팀 설정", count: 0 },
  ];

  // 역할 라벨/색상 — 시안 톤
  const roleLabel: Record<string, string> = {
    director: "감독",
    coach: "코치",
    captain: "팀장",
    manager: "매니저",
    treasurer: "총무",
    member: "멤버",
    vice: "부팀장",
    rookie: "루키",
  };

  // 포지션별 색상 — 시안 톤 (G=blue / F=green / C=red)
  function posColor(pos: string | null): string {
    if (pos === "G") return "var(--color-info)";
    if (pos === "F") return "var(--color-success)";
    if (pos === "C") return "var(--color-primary)";
    return "var(--color-text-muted)";
  }

  return (
    <div>
      {/* 브레드크럼 — 시안 톤 */}
      <div className="mb-3 flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
        <Link href="/" className="hover:text-[var(--color-text-secondary)]">홈</Link>
        <span>›</span>
        <Link href="/teams" className="hover:text-[var(--color-text-secondary)]">팀</Link>
        <span>›</span>
        <Link href={`/teams/${id}`} className="hover:text-[var(--color-text-secondary)]">팀 상세</Link>
        <span>›</span>
        <span className="text-[var(--color-text-primary)]">팀 관리</span>
      </div>

      {/* 헤더 배너 — 시안 v2(1) Captain View 톤 */}
      <div
        className="mb-5 grid items-center gap-4 rounded-lg p-5"
        style={{
          gridTemplateColumns: "64px 1fr auto",
          backgroundColor: teamData?.primary_color ?? "var(--color-card)",
          color: teamData?.primary_color ? "#fff" : "var(--color-text-primary)",
        }}
      >
        {/* 팀 태그 박스 (이니셜) */}
        <div
          className="flex h-16 w-16 items-center justify-center rounded font-bold"
          style={{
            backgroundColor: teamData?.primary_color ? "rgba(255,255,255,0.2)" : "var(--color-surface-bright)",
            fontSize: 22,
          }}
        >
          {(teamData?.name ?? "T").slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-[10px] font-extrabold tracking-widest opacity-85">CAPTAIN VIEW · 팀 관리</div>
          <div className="mt-1 truncate text-xl font-extrabold sm:text-2xl">{teamData?.name ?? "팀 관리"}</div>
          <div className="mt-0.5 font-mono text-xs opacity-85">
            멤버 {members.length}명 · 신청 대기 {requests.length}건
          </div>
        </div>
        <Link
          href={`/teams/${id}`}
          className="rounded border px-3 py-1.5 text-xs font-medium transition-colors"
          style={{
            backgroundColor: teamData?.primary_color ? "rgba(255,255,255,0.18)" : "var(--color-surface)",
            borderColor: teamData?.primary_color ? "rgba(255,255,255,0.35)" : "var(--color-border)",
            color: teamData?.primary_color ? "#fff" : "var(--color-text-secondary)",
          }}
        >
          팀 페이지 보기
        </Link>
      </div>

      {/* 탭 — 시안 v2(1) 톤 (border-bottom 라인 + 카운트 뱃지) */}
      <div className="mb-5 flex gap-0.5 overflow-x-auto border-b border-[var(--color-border)]">
        {tabs.map((t) => {
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className="flex items-center gap-1.5 whitespace-nowrap border-b-2 px-4 py-2.5 text-sm transition-colors"
              style={{
                background: "transparent",
                fontWeight: active ? 700 : 500,
                borderColor: active ? "var(--color-primary)" : "transparent",
                color: active ? "var(--color-text-primary)" : "var(--color-text-secondary)",
                marginBottom: -1,
              }}
            >
              {t.label}
              {t.count > 0 && (
                <span
                  className="rounded-full px-1.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: active ? "var(--color-primary)" : "var(--color-surface)",
                    color: active ? "#fff" : "var(--color-text-muted)",
                    paddingTop: 1,
                    paddingBottom: 1,
                  }}
                >
                  {t.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ═══════════ 로스터 탭 ═══════════ */}
      {tab === "roster" && (
        <div>
          {loading && (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}
          {!loading && error && (
            <div
              className="rounded-lg px-5 py-4 text-sm"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
                color: "var(--color-error)",
              }}
            >
              {error}
            </div>
          )}
          {!loading && !error && members.length === 0 && (
            <div className="rounded-lg bg-[var(--color-card)] py-16 text-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-[var(--color-text-muted)]">
                groups
              </span>
              <p className="text-sm text-[var(--color-text-secondary)]">아직 등록된 멤버가 없습니다.</p>
            </div>
          )}
          {!loading && !error && members.length > 0 && (
            <>
              {/* 상단 액션 영역 — 시안 v2(1) (좌: 필터 / 우: 초대) */}
              <div className="mb-3 flex items-center justify-between">
                <div className="text-xs font-medium text-[var(--color-text-muted)]">
                  활성 {members.length}명
                </div>
                <button
                  onClick={() => setTab("invite")}
                  className="rounded border border-[var(--color-primary)] bg-[var(--color-primary)] px-3 py-1.5 text-xs font-bold text-white transition-colors hover:opacity-90"
                >
                  + 멤버 초대
                </button>
              </div>

              {/* 데이터 테이블 — 시안 톤 (모바일 대응: 카드 형태로 자동 전환) */}
              <div className="overflow-hidden rounded-lg bg-[var(--color-card)]">
                {/* 데스크탑 헤더 */}
                <div
                  className="hidden grid-cols-[50px_1fr_100px_140px_180px] gap-3 bg-[var(--color-surface)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--color-text-muted)] md:grid"
                >
                  <div>POS</div>
                  <div>MEMBER</div>
                  <div>ROLE</div>
                  <div>POSITION</div>
                  <div className="text-right">ACTIONS</div>
                </div>
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="grid grid-cols-1 gap-2 border-t border-[var(--color-border)] px-4 py-3 text-sm md:grid-cols-[50px_1fr_100px_140px_180px] md:items-center md:gap-3"
                  >
                    {/* POS 컬럼 — 시안 색상 톤 */}
                    <div
                      className="font-extrabold"
                      style={{ color: posColor(m.position), fontSize: 14 }}
                    >
                      {m.position ?? "—"}
                    </div>

                    {/* MEMBER (이름) */}
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-bright)] text-xs font-bold text-[var(--color-accent)]">
                        {m.nickname.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate font-bold text-[var(--color-text-primary)]">
                        {m.nickname}
                      </span>
                    </div>

                    {/* ROLE 라벨 (모바일에서는 인라인) */}
                    <div className="text-xs font-bold" style={{ color: m.role === "captain" ? "var(--color-primary)" : "var(--color-text-secondary)" }}>
                      <span className="md:hidden text-[10px] text-[var(--color-text-muted)] mr-1">ROLE:</span>
                      {roleLabel[m.role] ?? m.role}
                    </div>

                    {/* POSITION 변경 (역할 셀렉트) */}
                    <div>
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        disabled={roleChanging === m.id}
                        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1 text-xs text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      >
                        {ROLE_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* ACTIONS — 권한/쪽지/탈퇴는 DB 미지원 → '준비 중' 안내만 노출 */}
                    <div className="flex justify-start gap-1.5 md:justify-end">
                      <span className="text-[10px] text-[var(--color-text-muted)]">
                        ※ 추가 액션 준비 중
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* ═══════════ 가입 신청 탭 ═══════════ */}
      {tab === "applicants" && (
        <div className="flex flex-col gap-2.5">
          {loading && (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}
          {!loading && error && (
            <div
              className="rounded-lg px-5 py-4 text-sm"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
                color: "var(--color-error)",
              }}
            >
              {error}
            </div>
          )}
          {!loading && !error && requests.length === 0 && (
            <div className="rounded-lg bg-[var(--color-card)] py-16 text-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-[var(--color-text-muted)]">
                person_search
              </span>
              <p className="text-sm text-[var(--color-text-secondary)]">현재 가입 신청이 없습니다.</p>
            </div>
          )}
          {!loading && !error && requests.map((req) => {
            const displayName = req.user?.nickname ?? req.user?.name ?? "신청자";
            const location = [req.user?.city, req.user?.district].filter(Boolean).join(" ");
            const isProcessing = processing === req.id;
            const when = new Date(req.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

            return (
              <div key={req.id} className="rounded-lg bg-[var(--color-card)] p-5">
                {/* 시안: 48px avatar / 1fr / actions */}
                <div className="mb-3 grid items-center gap-3.5" style={{ gridTemplateColumns: "48px 1fr auto" }}>
                  <div className="flex h-12 w-12 items-center justify-center rounded bg-[var(--color-info)] text-base font-bold text-white">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-extrabold text-[var(--color-text-primary)]">{displayName}</div>
                    <div className="mt-0.5 font-mono text-[11px] text-[var(--color-text-muted)]">
                      {req.user?.position ?? "—"} {location && `· ${location}`} · 신청 {when}
                    </div>
                  </div>
                  {/* 데스크탑 액션 */}
                  <div className="hidden items-center gap-1.5 sm:flex">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleAction(req.id, "reject")}
                      className="rounded border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-surface-bright)] disabled:opacity-50"
                      style={{ color: "var(--color-error)" }}
                    >
                      거절
                    </button>
                    <Button
                      disabled={isProcessing}
                      onClick={() => handleAction(req.id, "approve")}
                      className="!px-3 !py-1.5 text-xs"
                    >
                      {isProcessing ? "처리 중..." : "수락"}
                    </Button>
                  </div>
                </div>

                {/* 메시지 — 시안: 좌측 accent border */}
                {req.message && (
                  <div
                    className="rounded border-l-[3px] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text-secondary)]"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      borderLeftColor: "var(--color-primary)",
                    }}
                  >
                    &ldquo;{req.message}&rdquo;
                  </div>
                )}

                {/* 모바일 액션 — 카드 하단 가로 배치 */}
                <div className="mt-3 flex gap-2 sm:hidden">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleAction(req.id, "reject")}
                    className="flex-1 rounded border border-[var(--color-border)] px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ color: "var(--color-error)" }}
                  >
                    거절
                  </button>
                  <Button
                    disabled={isProcessing}
                    onClick={() => handleAction(req.id, "approve")}
                    className="flex-1"
                  >
                    {isProcessing ? "처리 중..." : "수락"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ 매치 신청 탭 (Phase 10-4 후속) ═══════════ */}
      {/* 이유(왜): 호스트(to_team)의 captain/vice/manager 가 받은 매치 신청을 한 곳에서 처리.
          captain 만 수락/거절 가능 (vice/manager 는 조회만). 카드 색상은 status 별로 분기. */}
      {tab === "matches" && (
        <div className="flex flex-col gap-2.5">
          {matchLoading && (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}
          {!matchLoading && matchError && (
            <div
              className="rounded-lg px-5 py-4 text-sm"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
                color: "var(--color-error)",
              }}
            >
              {matchError}
            </div>
          )}
          {!matchLoading && !matchError && matchRequests.length === 0 && (
            <div className="rounded-lg bg-[var(--color-card)] py-16 text-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-[var(--color-text-muted)]">
                sports_basketball
              </span>
              <p className="text-sm text-[var(--color-text-secondary)]">받은 매치 신청이 없습니다.</p>
            </div>
          )}

          {/* captain 이 아니면 안내 배너 — 액션 버튼은 미노출 */}
          {/* 이유(왜): 정책 결정 3A 일관성 — 팀 정보 수정/해산은 captain 전용. 매치 수락/거절도 동일 톤 적용 */}
          {!matchLoading && !matchError && matchRequests.length > 0 && teamData && !teamData.is_captain && (
            <div
              className="rounded-lg border px-4 py-3 text-sm"
              style={{
                borderColor: "color-mix(in srgb, var(--color-info) 30%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--color-info) 8%, transparent)",
                color: "var(--color-info)",
              }}
            >
              <span className="material-symbols-outlined mr-1.5 align-middle text-base">info</span>
              <span className="align-middle">매치 신청 수락/거절은 팀장만 가능합니다. (조회만 가능)</span>
            </div>
          )}

          {!matchLoading && !matchError && matchRequests.map((req) => {
            const isPending = req.status === "pending";
            const isAccepted = req.status === "accepted";
            const isRejected = req.status === "rejected";
            const isProcessing = matchProcessing === req.id;
            // captain 만 액션 가능 — teamData 가 아직 없으면 일단 false (안전한 기본값)
            const canAct = teamData?.is_captain === true && isPending;

            const fromName = req.from_team?.name ?? "알 수 없는 팀";
            const proposerName = req.proposer?.nickname ?? "운영진";
            const fromLocation = [req.from_team?.city, req.from_team?.district].filter(Boolean).join(" ");
            // primary_color 가 헥스로 들어오면 from_team 이니셜 박스 배경으로 사용
            const teamColor = req.from_team?.primary_color ?? "var(--color-info)";
            const createdAt = new Date(req.created_at).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });
            // preferred_date: 신청자가 선호한 경기일 — 없을 수도 있음
            const preferred = req.preferred_date
              ? new Date(req.preferred_date).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
              : null;

            // 카드 배경 — status 별 분기
            // pending: 기본 카드 / accepted: success tint / rejected: error tint
            // 이유(왜): 처리 직후 카드 색상이 즉시 바뀌어 시각적 피드백을 명확히 한다.
            const cardBg = isAccepted
              ? "color-mix(in srgb, var(--color-success) 8%, var(--color-card))"
              : isRejected
                ? "color-mix(in srgb, var(--color-error) 6%, var(--color-card))"
                : "var(--color-card)";
            const cardBorder = isAccepted
              ? "color-mix(in srgb, var(--color-success) 30%, transparent)"
              : isRejected
                ? "color-mix(in srgb, var(--color-error) 25%, transparent)"
                : "transparent";

            return (
              <div
                key={req.id}
                className="rounded-lg border p-5"
                style={{ backgroundColor: cardBg, borderColor: cardBorder }}
              >
                {/* 시안 톤: 48px 팀 로고 박스 / 1fr 정보 / 우측 액션 */}
                <div
                  className="mb-3 grid items-center gap-3.5"
                  style={{ gridTemplateColumns: "48px 1fr auto" }}
                >
                  {/* 팀 색상 박스 — primary_color 가 있으면 사용, 없으면 info 폴백 */}
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded text-base font-bold text-white"
                    style={{ backgroundColor: teamColor }}
                  >
                    {fromName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-base font-extrabold text-[var(--color-text-primary)]">
                      {fromName}
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[var(--color-text-muted)]">
                      {proposerName} {fromLocation && `· ${fromLocation}`} · 신청 {createdAt}
                      {preferred && ` · 희망일 ${preferred}`}
                    </div>
                  </div>

                  {/* 상태 라벨 — pending 외에는 액션 대신 status 뱃지 노출 */}
                  {/* 데스크탑 액션 영역 */}
                  <div className="hidden items-center gap-1.5 sm:flex">
                    {isPending && canAct && (
                      <>
                        <button
                          disabled={isProcessing}
                          onClick={() => handleMatchAction(req.id, "reject")}
                          className="rounded border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-surface-bright)] disabled:opacity-50"
                          style={{ color: "var(--color-error)" }}
                        >
                          거절
                        </button>
                        <Button
                          disabled={isProcessing}
                          onClick={() => handleMatchAction(req.id, "approve")}
                          className="!px-3 !py-1.5 text-xs"
                        >
                          {isProcessing ? "처리 중..." : "수락"}
                        </Button>
                      </>
                    )}
                    {isPending && !canAct && (
                      <span className="rounded bg-[var(--color-surface)] px-2 py-1 text-[11px] font-bold text-[var(--color-text-muted)]">
                        대기중
                      </span>
                    )}
                    {isAccepted && (
                      <span
                        className="rounded px-2 py-1 text-[11px] font-bold"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--color-success) 18%, transparent)",
                          color: "var(--color-success)",
                        }}
                      >
                        수락됨
                      </span>
                    )}
                    {isRejected && (
                      <span
                        className="rounded px-2 py-1 text-[11px] font-bold"
                        style={{
                          backgroundColor: "color-mix(in srgb, var(--color-error) 15%, transparent)",
                          color: "var(--color-error)",
                        }}
                      >
                        거절됨
                      </span>
                    )}
                  </div>
                </div>

                {/* 신청 메시지 — 가입신청 카드와 동일 톤 (좌측 accent border) */}
                {req.message && (
                  <div
                    className="rounded border-l-[3px] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text-secondary)]"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      borderLeftColor: "var(--color-primary)",
                    }}
                  >
                    &ldquo;{req.message}&rdquo;
                  </div>
                )}

                {/* 모바일 액션 — 카드 하단 가로 배치 (pending + canAct 일 때만) */}
                {isPending && canAct && (
                  <div className="mt-3 flex gap-2 sm:hidden">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleMatchAction(req.id, "reject")}
                      className="flex-1 rounded border border-[var(--color-border)] px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                      style={{ color: "var(--color-error)" }}
                    >
                      거절
                    </button>
                    <Button
                      disabled={isProcessing}
                      onClick={() => handleMatchAction(req.id, "approve")}
                      className="flex-1"
                    >
                      {isProcessing ? "처리 중..." : "수락"}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════ 변경 요청 탭 (Phase 2 PR7) ═══════════ */}
      {/* 이유(왜): 멤버가 보낸 번호변경/휴면/탈퇴 신청을 팀장/매니저가 처리.
          PR7 = jersey_change 만 실제 동작 (team_members.jersey_number UPDATE).
          dormant/withdraw 는 status='approved' UPDATE 만 — PR8/PR9 에서 실제 동작 추가. */}
      {tab === "member-requests" && (
        <div className="flex flex-col gap-2.5">
          {memberReqLoading && (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}
          {!memberReqLoading && memberReqError && (
            <div
              className="rounded-lg px-5 py-4 text-sm"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
                color: "var(--color-error)",
              }}
            >
              {memberReqError}
            </div>
          )}
          {!memberReqLoading && !memberReqError && memberRequests.length === 0 && (
            <div className="rounded-lg bg-[var(--color-card)] py-16 text-center">
              <span className="material-symbols-outlined mb-2 text-4xl text-[var(--color-text-muted)]">
                inbox
              </span>
              <p className="text-sm text-[var(--color-text-secondary)]">
                대기 중인 변경 요청이 없습니다.
              </p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                멤버가 등번호 변경 / 휴면 / 탈퇴를 신청하면 여기에 표시됩니다.
              </p>
            </div>
          )}

          {/* 안내 — PR7+PR8+PR9 모두 즉시 반영 (2026-05-05) */}
          {!memberReqLoading && !memberReqError && memberRequests.length > 0 && (
            <div
              className="rounded-lg border px-4 py-2.5 text-xs"
              style={{
                borderColor: "color-mix(in srgb, var(--color-info) 30%, transparent)",
                backgroundColor: "color-mix(in srgb, var(--color-info) 8%, transparent)",
                color: "var(--color-info)",
              }}
            >
              <span className="material-symbols-outlined mr-1 align-middle text-sm">info</span>
              <span className="align-middle">
                승인 시 즉시 반영: 등번호 변경 → 새 번호 적용 / 휴면 → 로스터 휴면 뱃지 (만료 시 자동 복귀) / 탈퇴 → 명단 자동 제외 (활동 기록은 보존).
              </span>
            </div>
          )}

          {!memberReqLoading && !memberReqError && memberRequests.map((req) => {
            const isProcessing = memberReqProcessing === req.id;
            const applicantName = req.user?.nickname ?? req.user?.name ?? "회원";
            const when = new Date(req.createdAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" });

            // 종류 라벨 + 내용 — type 별 분기
            let typeLabel: string;
            let typeColor: string;
            let contentText: string;
            if (req.requestType === "jersey_change") {
              const p = req.payload as { newJersey?: number } | null;
              const newJ = typeof p?.newJersey === "number" ? p.newJersey : "?";
              typeLabel = "등번호 변경";
              typeColor = "var(--color-info)";
              contentText = `→ #${newJ}`;
            } else if (req.requestType === "dormant") {
              const p = req.payload as { until?: string } | null;
              const until = p?.until
                ? new Date(p.until).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })
                : "기한 미정";
              typeLabel = "휴면 신청";
              typeColor = "var(--color-text-muted)";
              contentText = `복귀 예정: ${until}`;
            } else {
              typeLabel = "탈퇴 신청";
              typeColor = "var(--color-error)";
              contentText = "팀 명단 제외";
            }

            return (
              <div key={req.id} className="rounded-lg bg-[var(--color-card)] p-5">
                {/* 시안 톤: 48px 아이콘박스 / 1fr 정보 / 우측 액션 */}
                <div className="mb-3 grid items-center gap-3.5" style={{ gridTemplateColumns: "48px 1fr auto" }}>
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded text-base font-bold text-white"
                    style={{ backgroundColor: typeColor }}
                  >
                    {applicantName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="truncate text-base font-extrabold text-[var(--color-text-primary)]">
                        {applicantName}
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                        style={{
                          backgroundColor: "color-mix(in srgb, " + typeColor + " 16%, transparent)",
                          color: typeColor,
                        }}
                      >
                        {typeLabel}
                      </span>
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-[var(--color-text-muted)]">
                      {contentText} · 신청 {when}
                    </div>
                  </div>
                  {/* 데스크탑 액션 — captain or manager 가 보는 페이지 (서버 GET 가드)
                      — 모든 표시된 row 는 처리 가능 */}
                  <div className="hidden items-center gap-1.5 sm:flex">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleMemberRequestAction(req.id, "reject")}
                      className="rounded border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-surface-bright)] disabled:opacity-50"
                      style={{ color: "var(--color-error)" }}
                    >
                      거부
                    </button>
                    <Button
                      disabled={isProcessing}
                      onClick={() => handleMemberRequestAction(req.id, "approve")}
                      className="!px-3 !py-1.5 text-xs"
                    >
                      {isProcessing ? "처리 중..." : "승인"}
                    </Button>
                  </div>
                </div>

                {/* 사유 — 좌측 accent border (가입 신청 카드와 동일 톤) */}
                {req.reason && (
                  <div
                    className="rounded border-l-[3px] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text-secondary)]"
                    style={{
                      backgroundColor: "var(--color-surface)",
                      borderLeftColor: typeColor,
                    }}
                  >
                    &ldquo;{req.reason}&rdquo;
                  </div>
                )}

                {/* 모바일 액션 — 카드 하단 가로 배치 */}
                <div className="mt-3 flex gap-2 sm:hidden">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleMemberRequestAction(req.id, "reject")}
                    className="flex-1 rounded border border-[var(--color-border)] px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                    style={{ color: "var(--color-error)" }}
                  >
                    거부
                  </button>
                  <Button
                    disabled={isProcessing}
                    onClick={() => handleMemberRequestAction(req.id, "approve")}
                    className="flex-1"
                  >
                    {isProcessing ? "처리 중..." : "승인"}
                  </Button>
                </div>
              </div>
            );
          })}

          {/* ═══ 2026-05-05 Phase 3 PR10+PR11 — 이적 신청 섹션 ═══ */}
          {/* 이유: 본 팀이 fromTeam 또는 toTeam 인 pending 이적 신청을 표시.
              "이 팀에서 떠나려는 신청" (현 팀장 결정) / "이 팀에 들어오려는 신청" (새 팀장 결정) 분리.
              각 row 액션 = approve/reject → PATCH /api/web/transfer-requests/:id (side 자동 결정). */}
          {transferReqError && (
            <div
              className="rounded-lg px-5 py-4 text-sm"
              style={{
                backgroundColor: "color-mix(in srgb, var(--color-error) 12%, transparent)",
                color: "var(--color-error)",
              }}
            >
              {transferReqError}
            </div>
          )}
          {!transferReqLoading && !transferReqError && transferRequests.length > 0 && (
            <>
              <div className="mt-4 mb-2 flex items-center gap-2">
                <span className="material-symbols-outlined text-base text-[var(--color-text-secondary)]">
                  swap_horiz
                </span>
                <h3 className="text-sm font-bold text-[var(--color-text-primary)]">이적 신청</h3>
                <span
                  className="rounded px-2 py-0.5 text-[11px] font-bold"
                  style={{
                    backgroundColor: "color-mix(in srgb, var(--color-info) 16%, transparent)",
                    color: "var(--color-info)",
                  }}
                >
                  {transferRequests.length}
                </span>
              </div>
              <div
                className="rounded-lg border px-4 py-2.5 text-xs"
                style={{
                  borderColor: "color-mix(in srgb, var(--color-info) 30%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--color-info) 8%, transparent)",
                  color: "var(--color-info)",
                }}
              >
                <span className="material-symbols-outlined mr-1 align-middle text-sm">info</span>
                <span className="align-middle">
                  현 팀장 + 새 팀장 모두 승인해야 이적이 완료됩니다. 한쪽이라도 거부하면 신청이 종결됩니다.
                </span>
              </div>

              {transferRequests.map((row) => {
                const isProcessing = transferReqProcessing === row.id;
                // 본 팀이 어느 사이드인지 분기 (UI 라벨)
                const isFromMine = row.fromTeamId === id;
                const sideLabel = isFromMine ? "이 팀에서 떠나려는 신청" : "이 팀에 들어오려는 신청";
                const sideColor = isFromMine ? "var(--color-error)" : "var(--color-info)";
                const counterTeam = isFromMine ? row.toTeam : row.fromTeam;
                const counterStatus = isFromMine ? row.toTeamStatus : row.fromTeamStatus;
                const counterStatusLabel =
                  counterStatus === "pending"
                    ? "대기"
                    : counterStatus === "approved"
                    ? "승인됨"
                    : "거부됨";
                // 신청자 이름 — user 정보 없을 수 있음 (응답 안 함). userId 만 표시 fallback
                const applicantName = row.user?.nickname ?? row.user?.name ?? `회원 #${row.userId}`;
                const when = new Date(row.createdAt).toLocaleDateString("ko-KR", {
                  timeZone: "Asia/Seoul",
                });

                return (
                  <div key={row.id} className="rounded-lg bg-[var(--color-card)] p-5">
                    <div
                      className="mb-3 grid items-center gap-3.5"
                      style={{ gridTemplateColumns: "48px 1fr auto" }}
                    >
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded text-base font-bold text-white"
                        style={{ backgroundColor: sideColor }}
                      >
                        {applicantName.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-base font-extrabold text-[var(--color-text-primary)]">
                            {applicantName}
                          </span>
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                            style={{
                              backgroundColor: "color-mix(in srgb, " + sideColor + " 16%, transparent)",
                              color: sideColor,
                            }}
                          >
                            {sideLabel}
                          </span>
                        </div>
                        <div className="mt-0.5 font-mono text-[11px] text-[var(--color-text-muted)]">
                          {isFromMine ? "→ " : "← "}
                          {counterTeam?.name ?? "상대 팀"} · 상대 팀 결정: {counterStatusLabel} · 신청 {when}
                        </div>
                      </div>
                      <div className="hidden items-center gap-1.5 sm:flex">
                        <button
                          disabled={isProcessing}
                          onClick={() => handleTransferAction(row, "reject")}
                          className="rounded border border-[var(--color-border)] px-3 py-1.5 text-xs font-medium transition-colors hover:bg-[var(--color-surface-bright)] disabled:opacity-50"
                          style={{ color: "var(--color-error)" }}
                        >
                          거부
                        </button>
                        <Button
                          disabled={isProcessing}
                          onClick={() => handleTransferAction(row, "approve")}
                          className="!px-3 !py-1.5 text-xs"
                        >
                          {isProcessing ? "처리 중..." : "승인"}
                        </Button>
                      </div>
                    </div>

                    {row.reason && (
                      <div
                        className="rounded border-l-[3px] px-3 py-2.5 text-sm leading-relaxed text-[var(--color-text-secondary)]"
                        style={{
                          backgroundColor: "var(--color-surface)",
                          borderLeftColor: sideColor,
                        }}
                      >
                        &ldquo;{row.reason}&rdquo;
                      </div>
                    )}

                    {/* 모바일 액션 */}
                    <div className="mt-3 flex gap-2 sm:hidden">
                      <button
                        disabled={isProcessing}
                        onClick={() => handleTransferAction(row, "reject")}
                        className="flex-1 rounded border border-[var(--color-border)] px-3 py-2 text-sm font-medium transition-colors disabled:opacity-50"
                        style={{ color: "var(--color-error)" }}
                      >
                        거부
                      </button>
                      <Button
                        disabled={isProcessing}
                        onClick={() => handleTransferAction(row, "approve")}
                        className="flex-1"
                      >
                        {isProcessing ? "처리 중..." : "승인"}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>
      )}

      {/* ═══════════ 초대 링크 탭 (DB 미지원: 준비 중) ═══════════ */}
      {tab === "invite" && (
        <div className="rounded-lg border border-dashed border-[var(--color-border)] bg-[var(--color-card)] p-8 text-center">
          <span className="material-symbols-outlined mb-3 text-5xl text-[var(--color-text-muted)]">
            link
          </span>
          <h3 className="mb-2 text-base font-bold text-[var(--color-text-primary)]">초대 링크 — 준비 중</h3>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--color-text-muted)]">
            초대 링크 발급 / 만료 / 사용 횟수 관리 기능을 준비하고 있습니다. 현재는 가입 신청 탭에서 신청자를 직접 승인해주세요.
          </p>
          <button
            onClick={() => setTab("applicants")}
            className="mt-4 rounded border border-[var(--color-border)] px-4 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-bright)]"
          >
            가입 신청 보기
          </button>
        </div>
      )}

      {/* ═══════════ 운영진 권한 탭 (Phase 4 PR12 — captain only) ═══════════ */}
      {tab === "officers" && teamData?.is_captain === true && (
        <div>
          <h2 className="mb-3 text-lg font-semibold" style={{ color: "var(--color-text-primary)" }}>
            운영진 권한 위임
          </h2>
          <OfficerPermissionsTab
            teamId={id}
            members={members.map((m) => ({
              id: m.id,
              user_id: m.user_id,
              nickname: m.nickname,
              role: m.role,
              profile_image: m.profile_image,
            }))}
          />
        </div>
      )}
      {tab === "officers" && teamData?.is_captain !== true && (
        <div className="py-12 text-center text-sm" style={{ color: "var(--color-text-secondary)" }}>
          운영진 권한 위임은 팀장만 관리할 수 있습니다.
        </div>
      )}

      {/* ═══════════ 팀 설정 탭 ═══════════ */}
      {tab === "settings" && (
        <>
          {settingsLoading && (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}

          {!settingsLoading && teamData && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {/* 정책 결정 3A: 부팀장/매니저는 조회만 가능 — 안내 배너 노출 */}
              {/* 이유(왜): 입력 필드만 disabled로 두면 사용자가 이유를 모른 채 좌절한다.
                  명시적으로 "팀장만 수정 가능"이라고 알려주는 것이 UX상 안전 */}
              {!canEditTeam && (
                <div
                  className="rounded-lg border px-4 py-3 text-sm"
                  style={{
                    borderColor: "color-mix(in srgb, var(--color-info) 30%, transparent)",
                    backgroundColor: "color-mix(in srgb, var(--color-info) 8%, transparent)",
                    color: "var(--color-info)",
                  }}
                >
                  <span className="material-symbols-outlined mr-1.5 align-middle text-base">info</span>
                  <span className="align-middle">팀 정보 수정과 팀 해산은 팀장만 가능합니다. (조회만 가능)</span>
                </div>
              )}

              {/* fieldset disabled — captain이 아니면 모든 입력/버튼이 한 번에 비활성화
                  이유(왜): 개별 input마다 disabled prop을 다는 것보다 안전하고 누락 위험 0 */}
              <fieldset disabled={!canEditTeam} className="space-y-6 disabled:opacity-70">
              {/* 기본 정보 */}
              <div className="rounded-lg bg-[var(--color-card)] p-5">
                <h3 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-[var(--color-text-primary)]">
                  <span className="material-symbols-outlined text-base">badge</span>
                  기본 정보
                </h3>
                <div className="space-y-4">
                  {/* 팀명 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">팀명 *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={30}
                      required
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  {/* Phase 2B: 영문 팀명 (선택) */}
                  <div>
                    <label
                      className="mb-1 block text-sm font-medium"
                      style={{ color: "var(--color-text-secondary)" }}
                    >
                      영문 팀명{" "}
                      <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                        (선택)
                      </span>
                    </label>
                    <input
                      type="text"
                      value={nameEn}
                      onChange={(e) => {
                        setNameEn(e.target.value);
                        if (nameEnError) setNameEnError(null);
                      }}
                      placeholder="RISING EAGLES"
                      pattern="[A-Za-z0-9 \-]+"
                      maxLength={80}
                      className="w-full rounded border px-3 py-2.5 text-sm outline-none focus:border-[var(--color-primary)]"
                      style={{
                        borderColor: nameEnError ? "var(--color-error)" : "var(--color-border)",
                        backgroundColor: "var(--color-surface)",
                        color: "var(--color-text-primary)",
                      }}
                    />
                    {nameEnError ? (
                      <p className="mt-1 text-xs" style={{ color: "var(--color-error)" }}>
                        {nameEnError}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs" style={{ color: "var(--color-text-muted)" }}>
                        대한민국농구협회 등록 영문명. 영문/숫자/공백/하이픈만 허용.
                      </p>
                    )}
                  </div>

                  {/* Phase 2B: 대표 팀명 선택 — 영문명 있을 때만 노출 */}
                  {nameEn.trim() && (
                    <div>
                      <label
                        className="mb-1 block text-sm font-medium"
                        style={{ color: "var(--color-text-secondary)" }}
                      >
                        대표 팀명{" "}
                        <span className="text-xs" style={{ color: "var(--color-text-muted)" }}>
                          (우선 표시)
                        </span>
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setNamePrimary("ko")}
                          className="flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors"
                          style={
                            namePrimary === "ko"
                              ? {
                                  borderColor: "var(--color-primary)",
                                  backgroundColor: "var(--color-primary)",
                                  color: "white",
                                }
                              : {
                                  borderColor: "var(--color-border)",
                                  backgroundColor: "var(--color-surface)",
                                  color: "var(--color-text-secondary)",
                                }
                          }
                        >
                          한글 ({name || "팀명"})
                        </button>
                        <button
                          type="button"
                          onClick={() => setNamePrimary("en")}
                          className="flex-1 rounded border px-3 py-2 text-sm font-medium transition-colors"
                          style={
                            namePrimary === "en"
                              ? {
                                  borderColor: "var(--color-primary)",
                                  backgroundColor: "var(--color-primary)",
                                  color: "white",
                                }
                              : {
                                  borderColor: "var(--color-border)",
                                  backgroundColor: "var(--color-surface)",
                                  color: "var(--color-text-secondary)",
                                }
                          }
                        >
                          영문 ({nameEn})
                        </button>
                      </div>
                    </div>
                  )}
                  {/* 팀 소개 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">팀 소개</label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={3}
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  {/* 도시 / 지역구 */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">도시</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="서울"
                        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">지역구</label>
                      <input
                        type="text"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        placeholder="강남구"
                        className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                  {/* 홈코트 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">홈코트</label>
                    <input
                      type="text"
                      value={homeCourt}
                      onChange={(e) => setHomeCourt(e.target.value)}
                      placeholder="OO체육관"
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                  {/* 창단연도 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">창단연도</label>
                    <input
                      type="number"
                      value={foundedYear}
                      onChange={(e) => setFoundedYear(e.target.value ? Number(e.target.value) : "")}
                      min={1900}
                      max={new Date().getFullYear()}
                      placeholder="2024"
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* 팀 색상 */}
              <div className="rounded-lg bg-[var(--color-card)] p-5">
                <h3 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-[var(--color-text-primary)]">
                  <span className="material-symbols-outlined text-base">palette</span>
                  팀 색상
                </h3>
                <div className="grid gap-3 sm:gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">주 색상</label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="color"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer rounded border border-[var(--color-border)]"
                      />
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        maxLength={7}
                        className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">보조 색상</label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="color"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer rounded border border-[var(--color-border)]"
                      />
                      <input
                        type="text"
                        value={secondaryColor}
                        onChange={(e) => setSecondaryColor(e.target.value)}
                        maxLength={7}
                        className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                </div>

                {/* 2026-04-29: 홈/어웨이 유니폼 색상 — 생성 폼 step-emblem 과 동일 패턴.
                    이유(왜): 팀 생성 시 입력받지만 관리에서 누락이었음.
                    onBlur: 미완성 hex 면 기본값(BDR Red/Navy)으로 silent 복원해
                    invalid 값으로 PATCH 요청해 400 받는 일을 사전 차단. */}
                <div className="mt-4 grid gap-3 sm:gap-4 sm:grid-cols-2 border-t border-[var(--color-border)] pt-4">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                      홈 유니폼 색상
                    </label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="color"
                        value={homeColor}
                        onChange={(e) => setHomeColor(e.target.value)}
                        aria-label="홈 유니폼 색상 선택"
                        className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer rounded border border-[var(--color-border)]"
                      />
                      <input
                        type="text"
                        value={homeColor.toUpperCase()}
                        onChange={(e) => {
                          const v = e.target.value;
                          // 입력 중간 단계 허용: # + 0~6자리 hex
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                            setHomeColor(v.toLowerCase());
                          }
                        }}
                        onBlur={(e) => {
                          // 미완성 hex 면 BDR Red 로 silent 복원 — invalid PATCH 차단
                          if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                            setHomeColor("#E31B23");
                          }
                        }}
                        maxLength={7}
                        placeholder="#E31B23"
                        aria-label="홈 유니폼 hex 코드"
                        className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">
                      어웨이 유니폼 색상
                    </label>
                    <div className="flex items-center gap-2 sm:gap-3">
                      <input
                        type="color"
                        value={awayColor}
                        onChange={(e) => setAwayColor(e.target.value)}
                        aria-label="어웨이 유니폼 색상 선택"
                        className="h-8 w-8 sm:h-10 sm:w-10 cursor-pointer rounded border border-[var(--color-border)]"
                      />
                      <input
                        type="text"
                        value={awayColor.toUpperCase()}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^#[0-9A-Fa-f]{0,6}$/.test(v)) {
                            setAwayColor(v.toLowerCase());
                          }
                        }}
                        onBlur={(e) => {
                          if (!/^#[0-9A-Fa-f]{6}$/.test(e.target.value)) {
                            setAwayColor("#1B3C87");
                          }
                        }}
                        maxLength={7}
                        placeholder="#1B3C87"
                        aria-label="어웨이 유니폼 hex 코드"
                        className="flex-1 rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* 2026-04-29: 팀 로고 카드 — 생성 시 입력받지만 관리에 누락이었음.
                  이유(왜): step-emblem.tsx 와 동일한 즉시 업로드 패턴 (파일 선택 → /api/web/upload → public URL).
                  미리보기는 Supabase 외부 도메인이라 next/image 대신 <img> 사용 (eslint disable). */}
              <div className="rounded-lg bg-[var(--color-card)] p-5">
                <h3 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-[var(--color-text-primary)]">
                  <span className="material-symbols-outlined text-base">image</span>
                  팀 로고
                </h3>
                <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                  {logoUrl ? (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={logoUrl}
                        alt="팀 로고 미리보기"
                        // 팀 로고는 비율이 제각각 — contain 으로 잘림 방지 (2026-05-02)
                        className="h-20 w-20 rounded-lg border border-[var(--color-border)] object-contain"
                      />
                      <div className="flex flex-1 flex-col gap-2 sm:flex-row">
                        <label className="btn btn--sm cursor-pointer text-center" style={{ fontSize: 13 }}>
                          {/* 다른 이미지 교체 — 동일 input 재사용 (key 로 reset) */}
                          {logoUploading ? "업로드 중…" : "다른 이미지로 교체"}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp,image/gif"
                            onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
                            disabled={logoUploading}
                            className="hidden"
                          />
                        </label>
                        <button
                          type="button"
                          onClick={() => {
                            // 로컬 state 만 비움 — 실제 DB 반영은 "수정 저장" 클릭 시
                            setLogoUrl(null);
                            setLogoError(null);
                          }}
                          disabled={logoUploading}
                          className="btn btn--sm"
                          style={{ fontSize: 13 }}
                        >
                          제거
                        </button>
                      </div>
                    </>
                  ) : (
                    <label
                      className="flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed border-[var(--color-border)] p-6 text-center text-sm text-[var(--color-text-secondary)] hover:border-[var(--color-primary)]"
                      style={{ opacity: logoUploading ? 0.6 : 1, cursor: logoUploading ? "wait" : "pointer" }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 28 }}>
                        {logoUploading ? "hourglass_empty" : "upload"}
                      </span>
                      <span className="font-medium text-[var(--color-text-primary)]">
                        {logoUploading ? "업로드 중…" : "클릭해서 이미지 업로드"}
                      </span>
                      <span className="text-xs">PNG · JPG · WEBP · 정방형 권장 · 최대 5MB</span>
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={(e) => handleLogoFile(e.target.files?.[0] ?? null)}
                        disabled={logoUploading}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                {/* 에러 메시지 — 시스템 alert 대신 inline 표시 (모바일 친화) */}
                {logoError && (
                  <div
                    role="alert"
                    className="mt-2 rounded px-2.5 py-2 text-xs"
                    style={{
                      color: "var(--color-error)",
                      background: "color-mix(in srgb, var(--color-error) 10%, transparent)",
                    }}
                  >
                    {logoError}
                  </div>
                )}
              </div>

              {/* 운영 설정 */}
              <div className="rounded-lg bg-[var(--color-card)] p-5">
                <h3 className="mb-4 flex items-center gap-1.5 text-base font-semibold text-[var(--color-text-primary)]">
                  <span className="material-symbols-outlined text-base">tune</span>
                  운영 설정
                </h3>
                <div className="space-y-4">
                  {/* 공개 여부 토글 */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">팀 공개</span>
                    <input
                      type="checkbox"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                      className="h-5 w-5 rounded accent-[var(--color-primary)]"
                    />
                  </label>
                  {/* 멤버 모집 토글 */}
                  <label className="flex items-center justify-between">
                    <span className="text-sm text-[var(--color-text-secondary)]">멤버 모집중</span>
                    <input
                      type="checkbox"
                      checked={acceptingMembers}
                      onChange={(e) => setAcceptingMembers(e.target.checked)}
                      className="h-5 w-5 rounded accent-[var(--color-primary)]"
                    />
                  </label>
                  {/* 최대 인원 */}
                  <div>
                    <label className="mb-1 block text-sm font-medium text-[var(--color-text-secondary)]">최대 멤버 수</label>
                    <input
                      type="number"
                      value={maxMembers}
                      onChange={(e) => setMaxMembers(Number(e.target.value))}
                      min={2}
                      max={50}
                      className="w-full rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-primary)]"
                    />
                  </div>
                </div>
              </div>

              {/* 저장 버튼 */}
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "저장 중..." : "설정 저장"}
              </Button>

              {/* ─── 위험 영역: 팀 해산 ─── (CSS 변수 기반 error 색상) */}
              <div
                className="mt-8 rounded-lg border p-5"
                style={{
                  borderColor: "color-mix(in srgb, var(--color-error) 30%, transparent)",
                  backgroundColor: "color-mix(in srgb, var(--color-error) 5%, transparent)",
                }}
              >
                <h3
                  className="mb-2 flex items-center gap-1.5 text-base font-semibold"
                  style={{ color: "var(--color-error)" }}
                >
                  <span className="material-symbols-outlined text-base">warning</span>
                  위험 영역
                </h3>
                <p className="mb-4 text-sm text-[var(--color-text-muted)]">
                  팀을 해산하면 되돌릴 수 없습니다. 모든 멤버가 팀에서 제외되며, 팀 정보는 비활성화됩니다.
                </p>
                <button
                  type="button"
                  onClick={() => setShowDissolve(true)}
                  className="rounded border px-4 py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-error)] hover:text-white"
                  style={{
                    borderColor: "var(--color-error)",
                    color: "var(--color-error)",
                  }}
                >
                  팀 해산
                </button>
              </div>
              </fieldset>
              {/* fieldset 종료 — 정책 결정 3A: captain이 아니면 위 모든 입력/버튼 비활성화 */}
            </form>
          )}
        </>
      )}

      {/* ═══════════ 팀 해산 확인 모달 ═══════════ */}
      {showDissolve && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => !dissolving && setShowDissolve(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded-lg bg-[var(--color-card)] p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex justify-center">
              <span
                className="material-symbols-outlined text-4xl"
                style={{ color: "var(--color-error)" }}
              >
                delete_forever
              </span>
            </div>
            <h3 className="mb-2 text-center text-lg font-bold text-[var(--color-text-primary)]">
              정말로 팀을 해산하시겠습니까?
            </h3>
            <p className="mb-6 text-center text-sm text-[var(--color-text-muted)]">
              이 작업은 되돌릴 수 없습니다. 팀의 모든 활동이 중단되고 멤버 모집이 비활성화됩니다.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDissolve(false)}
                disabled={dissolving}
                className="flex-1 rounded border border-[var(--color-border)] px-4 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-elevated)]"
              >
                취소
              </button>
              {/* 팀 해산 확정 버튼 — red-500/600 → error 토큰 + hover color-mix 85% black 15%로 톤다운 */}
              <button
                onClick={handleDissolve}
                disabled={dissolving}
                className="flex-1 rounded bg-[var(--color-error)] px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[color-mix(in_srgb,var(--color-error)_85%,black)] disabled:opacity-50"
              >
                {dissolving ? "해산 처리중..." : "팀 해산"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
