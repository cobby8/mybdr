"use client";

import { useEffect, useState, useCallback, use } from "react";
import Link from "next/link";
// useSearchParams: 팀 가입 신청 알림(`/teams/:id/manage?tab=requests`) 클릭 시
// 곧바로 "가입 신청" 탭으로 진입시키기 위해 초기 탭을 쿼리에서 결정
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

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
  is_public: boolean | null;
  accepting_members: boolean | null;
  max_members: number | null;
  status: string | null;
}

// Phase 2B: 영문명 허용 패턴 — 서버 Zod 스키마와 동일 규칙
const NAME_EN_PATTERN = /^[A-Za-z0-9 \-]+$/;

// 시안 v2(1) 4탭 구조: 로스터 / 가입신청 / 초대링크 / 팀설정
type ManageTab = "roster" | "applicants" | "invite" | "settings";

// 쿼리 문자열 → 내부 탭 키로 정규화.
// 이유: 팀 가입 신청 알림의 actionUrl은 `?tab=requests`로 보내지만 (의미 명확)
// 실제 내부 탭 키는 `applicants`다. 두 표기 모두 허용해 외부 진입과 내부 표기를 분리한다.
function resolveInitialTab(raw: string | null): ManageTab {
  if (!raw) return "roster";
  // requests / request → applicants 매핑 (가입 신청 알림 호환)
  if (raw === "requests" || raw === "request" || raw === "applicants") return "applicants";
  if (raw === "roster" || raw === "invite" || raw === "settings") return raw;
  return "roster";
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
      setMembers(data.data?.members ?? data.members ?? []);
      setRequests(data.data?.requests ?? data.data ?? []);
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
      const json = await res.json();
      const data: TeamEditData = json.data;
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
      setIsPublic(data.is_public ?? true);
      setAcceptingMembers(data.accepting_members ?? true);
      setMaxMembers(data.max_members ?? 15);
    } catch {
      // 설정 로드 실패는 무시 (멤버 관리만 사용 가능)
    } finally {
      setSettingsLoading(false);
    }
  }, [id]);

  // 초기 로드: 멤버/신청 (탭과 무관하게 항상 로드 — 탭 카운트 표시용)
  useEffect(() => { fetchRequests(); }, [fetchRequests]);
  useEffect(() => {
    if (tab === "settings" && !teamData) {
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
        alert(data.message ?? "처리 중 오류가 발생했습니다.");
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
          is_public: isPublic,
          accepting_members: acceptingMembers,
          max_members: maxMembers,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "수정 중 오류가 발생했습니다.");
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

  // 시안 4탭 정의 — 카운트는 실데이터 기반
  const tabs: { id: ManageTab; label: string; count: number }[] = [
    { id: "roster", label: "로스터", count: members.length },
    { id: "applicants", label: "가입 신청", count: requests.length },
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

      {/* ═══════════ 팀 설정 탭 ═══════════ */}
      {tab === "settings" && (
        <>
          {settingsLoading && (
            <div className="py-12 text-center text-sm text-[var(--color-text-secondary)]">불러오는 중...</div>
          )}

          {!settingsLoading && teamData && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
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
