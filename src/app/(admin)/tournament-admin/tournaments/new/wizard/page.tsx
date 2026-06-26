"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { TossCard } from "@/components/toss/toss-card";
import { ScheduleForm, type ScheduleFormData, type PlaceInfo } from "@/components/tournament/schedule-form";
import {
  RegistrationSettingsForm,
  type RegistrationSettingsData,
} from "@/components/tournament/registration-settings-form";
import { TeamSettingsForm, type TeamSettingsData } from "@/components/tournament/team-settings-form";
import { GameTimeInput } from "@/components/tournament/game-time-input";
import { GameBallInput } from "@/components/tournament/game-ball-input";
// 대진 포맷 세부 설정 폼 — format 선택 UI 아래에 삽입
import { BracketSettingsForm, type BracketSettingsData } from "@/components/tournament/bracket-settings-form";
// 2026-05-04 (P3) — 듀얼 토너먼트 표준 default 자동 적용 (format 변경 시 dual 선택 → DUAL_DEFAULT_BRACKET)
import { DUAL_DEFAULT_BRACKET, DUAL_DEFAULT_PAIRING } from "@/lib/tournaments/dual-defaults";
// 2026-05-13 UI-1.3 — 인라인 시리즈 생성 폼 (공통 컴포넌트)
import { InlineSeriesForm, type CreatedSeries } from "@/components/tournament/inline-series-form";
import { DivisionGeneratorModal } from "@/components/tournament/division-generator-modal";
import { ImageUploader } from "@/components/shared/image-uploader";
import { TournamentCopyModal, type CopyData } from "@/components/tournament/tournament-copy-modal";
// 2026-05-11: BDR 브랜드 hex hardcode 단일화 (conventions.md `admin 빨강 본문 금지` 박제)
import { BDR_PRIMARY_HEX, BDR_SECONDARY_HEX } from "@/lib/constants/colors";
// 2026-05-15 Admin-7-B Sub-B3 박제 — 시안 v2.14 AdminTournamentWizard1Step.jsx 헤더 패턴.
//   eyebrow + breadcrumbs 3단계 + actions slot (× 종료). Sub-B1/B2 와 동일 패턴 (옵션 A 보수적).
import { AdminPageHeader } from "@/components/admin/admin-page-header";
// 2026-05-20 Phase 3 fix — prospectus AI 분석 후 sessionStorage draft 자동 채움.
import { loadDraft } from "@/lib/tournaments/wizard-draft";
// 2026-06-21 Track B B-b Toss 리스킨 — Material Symbols → lucide <Icon> 키트.
//   비주얼만 교체(아이콘 1:1 매핑)·기능/단계/POST body/라우트 변경 0. data-skin="toss" 루트 opt-in.
import { Icon, useTossConfirm } from "@/components/admin-toss";
// 2026-06-21 Track B Phase4 B-2 — 새 대회 생성폼(2컬럼 단일폼). quick 탭 본문 전면교체.
//   대회정보·일정장소·종별·경기설정 + 하단 고정 생성바. 제출 POST 배선 포함.
import { CtCreateTournament, type CtDraftPayload } from "./_components/ct-create-tournament";

// --- 3단계 구성 (기존 8탭 → 3단계로 간소화) ---
// 2026-06-21 Toss B-b — icon 값을 lucide kebab 명으로 교체(아이콘만·라벨/key/단계 동일).
const STEPS = [
  { key: "info", label: "대회 정보", icon: "trophy" },          // emoji_events
  { key: "registration", label: "참가 설정", icon: "user-plus" }, // group_add
  { key: "confirm", label: "확인 및 생성", icon: "circle-check" }, // check_circle
];

// 대회 방식 옵션 (4종만)
const FORMAT_OPTIONS = [
  { value: "single_elimination", label: "토너먼트" },
  { value: "round_robin", label: "풀리그" },
  { value: "dual_tournament", label: "듀얼토너먼트" },
  { value: "group_stage_knockout", label: "조별리그+토너먼트" },
  { value: "league_advancement", label: "링크제" },
  { value: "group_stage_with_ranking", label: "조별리그+동순위 순위결정전" },
];

// 성별 옵션 — BDR은 남성부/여성부만 운영 (혼성 없음)
const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

// 2026-05-28 PR-1C-14 (PA2) — 진입점 sub-tab 4 옵션 (시안 AdminTournamentWizard1Step.jsx SUBTABS 박제).
//   quick = 현재 QuickCreateForm 폼 / 나머지 3개 = 기존 라우트로 이동 (라우팅 구조 변경 ❌).
//   adminOnly = showAssociationCard 권한일 때만 노출 (Phase 6 PR2 분기 재사용).
// 2026-06-21 Toss B-b — icon 값을 lucide kebab 명으로 교체(아이콘만·key/label/탭 동작 동일).
const SUBTABS = [
  { key: "quick", icon: "zap", label: "Quick", hint: "이름·시작일만", time: "1분", recommended: true, adminOnly: false },        // flash_on
  { key: "legacy", icon: "list-checks", label: "단계별 설정", hint: "3-step", time: "5분", recommended: false, adminOnly: false }, // list_alt
  { key: "prospectus", icon: "file-text", label: "PDF 요강", hint: "AI 추출", time: "3분", recommended: false, adminOnly: false }, // description
  { key: "association", icon: "award", label: "협회 대회", hint: "super admin", time: "7분", recommended: false, adminOnly: true }, // workspace_premium
] as const;

// draft step(0~4) → 사람이 읽는 단계 라벨. 작성시각이 없으므로 진행도는 step 으로만 표시.
//   wizard-types.ts WizardStep: 0 단체 / 1 시리즈 / 2 대회정보 / 3 참가설정 / 4 확인생성.
const DRAFT_STEP_LABELS = ["단체", "시리즈", "대회 정보", "참가 설정", "확인·생성"] as const;

// 토스 스타일 인풋 — surface 배경, border 없음, rounded-md
const inputCls =
  "w-full rounded-md border-none bg-[var(--color-border)] px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/50";
const labelCls = "mb-1 block text-sm text-[var(--color-text-muted)]";

// pill 버튼 — 선택 상태에 따라 info/border 배경 (2026-05-12 admin 빨강 본문 금지 룰)
const pillCls = (active: boolean) =>
  `rounded-[4px] px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer ${
    active
      ? "bg-[var(--color-info)] text-white"
      : "bg-[var(--color-border)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border-active)]"
  }`;

// 섹션 제목 컴포넌트 — 2026-06-21 Toss B-b: Material span → lucide <Icon>(kebab name) 교체.
//   accent 색상은 인라인 color 로 동등 이전(text-lg≈18px → size 18). 텍스트/구조 동일.
function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
      <Icon name={icon} size={18} color="var(--color-accent)" />
      {children}
    </h3>
  );
}

type AuthStatus = "loading" | "unauthenticated" | "unauthorized" | "authorized";

/**
 * 2026-05-13 UI-2 — 기본 = 압축 1-step 폼 / `?legacy=1` 시 기존 3-step 폼.
 *
 * 이유 (왜):
 *   - 3-step (기본정보 → 신청설정 → 확인생성) 은 운영자가 한 번에 너무 많은 결정을 요구받음 → 이탈
 *   - 필수 1 필드 (대회 이름) 만 받고 즉시 draft 생성 → 체크리스트 hub 에서 점진 보강 흐름
 *   - 기존 폼은 `?legacy=1` 안전망 (1주 운영 후 별도 PR 로 폐기 예정)
 *
 * 어떻게 (방법):
 *   - 본 함수 = 라우터. useSearchParams 로 `?legacy=1` 분기.
 *   - 신규 압축 폼 = QuickCreateForm (대회 이름 + 시작일 + 시리즈 dropdown + InlineSeriesForm)
 *   - 기존 3-step 폼 = LegacyWizardForm (코드 보존 — 동작 변경 0)
 */
export default function NewTournamentWizardPage() {
  const searchParams = useSearchParams();
  // null-safe — Next.js 15 App Router 환경에서 안전
  const isLegacy = searchParams?.get("legacy") === "1";

  if (isLegacy) {
    return <LegacyWizardForm />;
  }
  return <QuickCreateForm />;
}

/**
 * QuickCreateForm — 2026-05-13 UI-2 신규 압축 1-step 폼.
 *
 * 박제 기준 (서버 POST /api/web/tournaments — route.ts 검증):
 *   - 필수: name (trim 후 비어있지 않음)
 *   - default 박제 (클라이언트 측 — POST schema 변경 0):
 *       format = "single_elimination" / maxTeams = 16 / teamSize = 5
 *       rosterMin = 5 / rosterMax = 12 / gender = "male"
 *       primaryColor / secondaryColor = BDR 토큰
 *       status / categories / divCaps 등 = 미전송 (서버 기본값 적용)
 *   - 운영자가 선택 입력 가능: 시작일 (startDate) / 시리즈 (seriesId)
 *
 * 흐름:
 *   1) 인증 체크 (관리자 이상)
 *   2) 시리즈 / 단체 로드 (dropdown + 인라인 생성용)
 *   3) 제출 → POST → 응답 redirect_url 사용 (체크리스트 hub)
 */
function QuickCreateForm() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 2026-05-15 Phase 6 PR2 — super_admin / association_admin 분기 카드 노출용.
  // 이유: 협회 마법사 (/tournament-admin/wizard/association) 진입점을 일반 마법사 상단에 안내.
  //   AppNav frozen 룰 (CLAUDE.md 13 룰) 위반 회피 — 더보기 메뉴 추가 ❌ / 일반 마법사 진입 카드 ✅.
  const [showAssociationCard, setShowAssociationCard] = useState(false);

  // 2026-05-28 Phase 1C PR-1C-14 (PA2) — 시안 AdminTournamentWizard1Step.jsx 진입점 sub-tab.
  // 이유: S3 사각지대(생성 방식 진입점 분산) 해소 — quick / legacy / prospectus / association 4 옵션을
  //   sub-tab 으로 통합. quick 만 본 폼 표시, 나머지는 "전환 안내 카드" + 기존 라우트 이동 버튼.
  //   라우팅 구조 변경 ❌ (탭은 상태 + router.push 만). association 탭은 showAssociationCard 권한일 때만.
  const [subtab, setSubtab] = useState<"quick" | "legacy" | "prospectus" | "association">("quick");
  // draft 복구 배너 dismiss 상태 — [새로 시작] 클릭 시 배너만 숨김 (sessionStorage 는 유지).
  const [draftDismissed, setDraftDismissed] = useState(false);
  // draft 복구 배너 표시용 메타 — loadDraft() 결과에서 제목/단계만 추출 (작성시각 미저장 → 표시 ❌).
  const [draftMeta, setDraftMeta] = useState<{ title: string; step: number } | null>(null);

  // 필수 1: 대회 이름
  const [name, setName] = useState("");
  // 권장 (선택): 시작일 (날짜 입력 type=date — YYYY-MM-DD)
  const [startDate, setStartDate] = useState("");
  // 2026-06-21 B-2 — 새 대회 생성폼 토스트(시안 toast 콜백 대체). 2.4초 후 자동 사라짐.
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const tossConfirm = useTossConfirm();
  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => setToastMsg(null), 2400);
  }, []);

  // 시리즈 dropdown / 인라인 생성 — UI-1.3 의 동일 패턴 재사용
  type SeriesOption = {
    id: string;
    name: string;
    organization: { id: string; name: string; slug: string } | null;
  };
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [seriesLoaded, setSeriesLoaded] = useState(false);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [myOrgs, setMyOrgs] = useState<{ id: string; name: string }[]>([]);

  // 인증 체크 (LegacyWizardForm 과 동일 로직 — 재사용 아니라 복제. 단순 분리 우선)
  useEffect(() => {
    fetch("/api/web/me")
      .then((res) => {
        if (!res.ok) {
          setAuthStatus("unauthenticated");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const role = (data.role ?? data.data?.role ?? "") as string;
        if (["super_admin", "organizer", "admin", "tournament_admin"].includes(role)) {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
        // 2026-05-15 Phase 6 PR2 — 협회 마법사 카드 노출 분기.
        // super_admin (JWT role) 또는 협회 관리자 매핑 (admin_info.is_admin=true) 시만 카드 노출.
        const adminInfo = (data.admin_info ?? data.data?.admin_info) as
          | { is_admin?: boolean }
          | null;
        if (role === "super_admin" || !!adminInfo?.is_admin) {
          setShowAssociationCard(true);
        }
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  // 2026-05-20 Phase 3 fix — prospectus AI 분석 후 sessionStorage draft 자동 채움 (QuickCreateForm).
  // 흐름: /wizard/prospectus → "이대로 wizard 진입" → saveDraft → /new/wizard → 본 useEffect → setName 등.
  //
  // 2026-05-28 PR-1C-14 — draft 복구 배너 메타도 본 useEffect 에서 추출 (loadDraft 1회 호출 재사용).
  //   배너 표시 조건 = draftMeta !== null && !draftDismissed. 작성시각은 WizardDraft 에 미저장 → 표시 ❌.
  useEffect(() => {
    const draft = loadDraft();
    if (!draft) return;
    const p = draft.tournament_payload;
    if (p.title) setName(p.title);
    if (p.schedule.startDate) setStartDate(p.schedule.startDate);
    if (draft.series_id) setSeriesId(String(draft.series_id));
    // 배너 메타 — 제목(없으면 "(제목 미정)") + 단계(0~4). 작성시각 가짜 텍스트(mock) 금지.
    setDraftMeta({ title: p.title?.trim() || "(제목 미정)", step: draft.step });
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?redirect=/tournament-admin/tournaments/new/wizard");
    }
  }, [authStatus, router]);

  // 시리즈 / 단체 로드 (UI-1.3 패턴 동일)
  useEffect(() => {
    if (authStatus !== "authorized") return;
    let cancelled = false;

    async function loadSeries() {
      try {
        const res = await fetch("/api/web/series/my");
        if (!res.ok) {
          if (!cancelled) setSeriesLoaded(true);
          return;
        }
        const json = await res.json();
        const list: SeriesOption[] = (json.data?.data ?? json.data ?? []) as SeriesOption[];
        if (!cancelled) {
          setSeriesOptions(list);
          setSeriesLoaded(true);
        }
      } catch {
        if (!cancelled) setSeriesLoaded(true);
      }
    }

    async function loadOrgs() {
      try {
        const res = await fetch("/api/web/organizations");
        if (!res.ok) return;
        const json = await res.json();
        const list = (json.data?.organizations ?? json.organizations ?? []) as Array<{
          id: string;
          name: string;
          myRole?: string;
          my_role?: string;
        }>;
        const filtered = list
          .filter((o) => {
            const role = o.myRole ?? o.my_role;
            return role === "owner" || role === "admin";
          })
          .map((o) => ({ id: o.id, name: o.name }));
        if (!cancelled) setMyOrgs(filtered);
      } catch {
        // 실패 무시 — 단체 dropdown 만 안 보임 (개인 시리즈 생성은 가능).
      }
    }

    loadSeries();
    loadOrgs();
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  // 인라인 시리즈 생성 성공 시
  function handleSeriesCreated(created: CreatedSeries) {
    setSeriesOptions((prev) => [created, ...prev]);
    setSeriesId(created.id);
    setShowSeriesForm(false);
  }

  async function cancelWizard() {
    const ok = await tossConfirm.confirm({
      title: "작성 종료",
      sub: "진행 중인 대회 작성을 종료합니다.",
      body: "아직 생성하지 않은 입력값은 저장되지 않습니다.",
      confirmLabel: "종료",
      tone: "danger",
    });
    if (ok) {
      router.push("/tournament-admin/tournaments");
    }
  }

  // 로딩 / 미인증 상태
  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[var(--color-text-muted)]">로딩 중...</div>
      </div>
    );
  }

  // 권한 없음 — 2026-06-21 Toss B-b: early-return 루트에도 data-skin opt-in + lock→lucide.
  if (authStatus === "unauthorized") {
    return (
      <div data-skin="toss" className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <Icon name="lock" size={48} color="var(--color-text-muted)" />
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">권한이 필요합니다</h1>
        <p className="max-w-md text-sm text-[var(--color-text-muted)]">
          대회를 만들려면 <strong>대회 관리자</strong> 이상의 권한이 필요합니다.
          <br />
          운영자에게 문의해주세요.
        </p>
        <Link href="/tournaments" className="ts-btn ts-btn--primary mt-2">
          대회 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // 대회 생성 — 필수 1 + 권장 2 + 클라이언트 default 박제.
  // 이유: POST /api/web/tournaments 가 name 만 필수. 그 외는 미전송 시 서버 default 적용.
  //   클라이언트가 일부 default 를 박아 보내면 dashboard 진입 시 안내 표시가 자연스러움.
  async function handleCreate(e?: React.FormEvent) {
    e?.preventDefault();
    if (!name.trim()) {
      setError("대회 이름을 입력하세요.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/web/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          // 클라이언트 측 default 박제 — POST schema 변경 0 (route.ts FORMAT_MAP fallback 과 일치)
          format: "single_elimination",
          gender: "male",
          maxTeams: 16,
          teamSize: 5,
          rosterMin: 5,
          rosterMax: 12,
          primaryColor: BDR_PRIMARY_HEX,
          secondaryColor: BDR_SECONDARY_HEX,
          // 운영자 입력값 (선택)
          startDate: startDate || undefined,
          seriesId: seriesId ?? undefined,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        // 응답 키 — apiSuccess 가 snake_case 변환 → redirect_url. 폴백 camelCase.
        router.push(data.redirect_url ?? data.redirectUrl ?? "/tournament-admin/tournaments");
      } else {
        setError(data.error ?? "오류가 발생했습니다.");
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  // === 2026-06-21 B-2 — quick 탭: 2컬럼 단일 생성폼(풀폭). 시안 CreateTournament.
  //   이유: 시안은 자체 헤더(ct-head)·하단 고정 생성바를 가진 풀폭 단일 페이지 → AdminPageHeader/SUBTABS
  //         셸과 겹친다. quick 일 때는 셸을 렌더하지 않고 풀폭 폼만 보인다(focused·서브탭 숨김).
  //   B-4: 게시 모달 확인 시 실제 POST /api/web/tournaments 배선.
  //   legacy/prospectus/association 전환은 아래 셸 return 에서 처리(quick 외 탭).
  if (subtab === "quick") {
    // ── B-4 제출 배선 ──────────────────────────────────────────────────
    //   왜: payload 는 ct-create-tournament 에서 이미 POST body 형태로 평면변환 완료.
    //       categories/divCaps/divFees/gameRules/scheduleDates 는 createTournament 가 받는 키 →
    //       API/schema 확장 0. 응답 키는 apiSuccess snake → redirect_url.
    const handleSubmitDraft = async (payload: CtDraftPayload) => {
      setLoading(true); // CtCreateTournament saving 으로 전달 → 모달 버튼 스피너/잠금
      try {
        const res = await fetch("/api/web/tournaments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: payload.name,
            format: payload.format ?? undefined,
            // 시리즈(정규대회) 연결 — POST seriesId 키(camelCase). 미연결 시 미전송.
            seriesId: payload.isRegular ? payload.seriesId ?? undefined : undefined,
            organizer: payload.organizer || undefined,
            host: payload.host || undefined,
            // 후원사 = 콤마 구분 plain 문자열(ct-create-tournament 에서 변환). 빈 문자열이면 미전송.
            sponsors: payload.sponsors || undefined,
            logoUrl: payload.poster || undefined, // 포스터 → logoUrl(대회 대표 이미지)
            // 일정·장소(B-1 확장형)
            startDate: payload.startDate || undefined,
            endDate: payload.endDate || undefined,
            registrationStartAt: payload.registrationStartAt || undefined,
            registrationEndAt: payload.registrationEndAt || undefined,
            places: payload.places.length > 0 ? payload.places : undefined,
            scheduleDates: payload.scheduleDates.length > 0 ? payload.scheduleDates : undefined,
            // 경기 설정(camelCase jsonb)
            gameRules: payload.gameRules,
            // 종별·디비전(평면변환된 3개 Record)
            categories: Object.keys(payload.categories).length > 0 ? payload.categories : undefined,
            divCaps: Object.keys(payload.divCaps).length > 0 ? payload.divCaps : undefined,
            divFees: Object.keys(payload.divFees).length > 0 ? payload.divFees : undefined,
            // 결제(계좌이체)
            bankName: payload.bankName || undefined,
            bankAccount: payload.bankAccount || undefined,
            bankHolder: payload.bankHolder || undefined,
            // F-1: 후원사 로고·디비전 일정 보존(settings jsonb) — 있을 때만 전송
            settings: payload.settings,
          }),
        });
        const data = await res.json();
        if (res.ok) {
          // 응답 키 — apiSuccess snake_case 변환 → redirect_url. 폴백 camelCase.
          router.push(data.redirect_url ?? data.redirectUrl ?? "/tournament-admin/tournaments");
        } else {
          showToast(data.error ?? "대회 생성 중 오류가 발생했습니다.");
          setLoading(false);
        }
      } catch {
        showToast("네트워크 오류가 발생했습니다.");
        setLoading(false);
      }
    };
    return (
      <div data-skin="toss">
        {tossConfirm.dialog}
        <CtCreateTournament
          seriesOptions={seriesOptions}
          seriesLoaded={seriesLoaded}
          myOrgs={myOrgs}
          onSeriesCreated={handleSeriesCreated}
          onCancel={cancelWizard}
          onOpenProspectus={() => router.push("/tournament-admin/tournaments/new/wizard/prospectus")}
          onOpenAssociationWizard={() => router.push("/tournament-admin/wizard/association")}
          onSubmitDraft={handleSubmitDraft}
          saving={loading}
          toast={showToast}
        />
        {/* 토스트 — 하단 중앙 고정 (ts-toast 는 toss-admin.css) */}
        {toastMsg && (
          <div className="ts-toast" role="status">
            {toastMsg}
          </div>
        )}
      </div>
    );
  }

  return (
    // 2026-06-21 Toss B-b: 위저드(Quick) 루트에 data-skin="toss" opt-in(공유셸 미부착·Phase2 패턴).
    <div data-skin="toss" className="mx-auto max-w-2xl">
      {tossConfirm.dialog}
      {/* === 헤더: 시안 v2.14 AdminTournamentWizard1Step 패턴 박제 (Admin-7-B Sub-B3) ===
          이유: Sub-B1 (SetupHub) / Sub-B2 (EditWizard) 와 시각 일관성 박제 — AdminPageHeader 공통 컴포넌트.
                Admin-3 `d98ff79` 박제 시각 자산 (eyebrow Navy + × 종료 confirm 1회) 100% 동등 이전.
                breadcrumbs 3단계 (ADMIN › 대회 관리 › 새 대회) 신규 박제.
          비즈 보존 (UI-2 `60dd37e`): 라우터 분기 / QuickCreateForm state / handleCreate POST / Phase 6 PR2 카드 / InlineSeriesForm 변경 0. */}
      <AdminPageHeader
        eyebrow="대회 관리 · 마법사 진행 중"
        title="새 대회 만들기"
        subtitle="이름만 입력해도 대회를 만들 수 있어요. 나머지 설정은 대회 대시보드에서 차근차근 진행하세요."
        breadcrumbs={[
          { label: "ADMIN" },
          { label: "대회 관리" },
          { label: "새 대회" },
        ]}
        actions={
          <>
            {/* 2026-05-20 Phase 3 — 요강 AI 분석 진입점 (별도 라우트 / 시그니처 변경 0). */}
            <Link
              href="/tournament-admin/tournaments/new/wizard/prospectus"
              className="ts-btn ts-btn--secondary ts-btn--sm"
              aria-label="요강 AI 분석"
            >
              <Icon name="file-up" size={16} />
              요강 분석
            </Link>
            <button
              type="button"
              onClick={cancelWizard}
              className="ts-btn ts-btn--secondary ts-btn--sm"
              aria-label="작성 종료"
            >
              <Icon name="x" size={16} />
              종료
            </button>
          </>
        }
      />

      {/* === 2026-05-28 PR-1C-14 (PA2) — 진입점 sub-tab (4 옵션) ===
          이유: 생성 방식 진입점이 헤더 actions(요강 분석) / association 카드 / ?legacy 링크로 분산(S3 사각지대).
                시안처럼 quick/legacy/prospectus/association 을 sub-tab 으로 통합 → 한 화면에서 방식 전환.
          박제 룰: 탭은 상태 + router.push 만. 라우팅 구조 / API / POST body 변경 0.
                   association 탭은 showAssociationCard 권한일 때만 노출 (Phase 6 PR2 권한 분기 재사용). */}
      <div role="tablist" className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {SUBTABS.filter((t) => !t.adminOnly || showAssociationCard).map((t) => {
          const active = subtab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setSubtab(t.key)}
              className={`flex flex-col gap-1 rounded-md border p-3 text-left transition-colors ${
                active
                  ? "border-[var(--color-info)] bg-[var(--color-info)]/10"
                  : "border-[var(--color-border)] bg-[var(--color-elevated)] hover:bg-[var(--color-border)]"
              }`}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold text-[var(--color-text-primary)]">
                {/* 2026-06-21 Toss B-b: Material span → lucide <Icon>(kebab). active 색상 동등 이전. */}
                <Icon
                  name={t.icon}
                  size={18}
                  color={active ? "var(--color-info)" : "var(--color-text-muted)"}
                />
                {t.label}
                {/* 추천 칩 — quick 만. info 토큰 (admin 빨강 본문 금지). */}
                {t.recommended && (
                  <span className="rounded-[4px] bg-[var(--color-info)] px-1.5 py-0.5 text-[10px] font-bold text-white">
                    추천
                  </span>
                )}
              </span>
              <span className="text-xs text-[var(--color-text-muted)]">
                {t.hint} · ~{t.time}
              </span>
            </button>
          );
        })}
      </div>

      {/* === 2026-05-28 PR-1C-14 (PA2) — draft 복구 배너 ===
          이유: 작성 중이던 draft(sessionStorage)가 있으면 "이어하기"를 명시 노출 → 재진입 시 이탈 방지.
          박제 룰: loadDraft() 결과 있을 때만(draftMeta) + dismiss 안 했을 때(!draftDismissed) 표시.
                   작성시각은 WizardDraft 에 미저장 → 표시 ❌ (시안의 "2일 전" 가짜 텍스트 박제 금지).
                   [이어하기] = 이미 위 useEffect 가 폼을 채워둠 → quick 탭 전환 + 배너 닫기로 안내.
                   [새로 시작] = 배너만 dismiss (sessionStorage 는 다음 생성 성공 시 자연 덮어쓰기). */}
      {draftMeta && !draftDismissed && (
        <div className="mb-4 flex flex-col gap-3 rounded-md border border-[var(--color-info)]/40 bg-[var(--color-info)]/10 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <Icon name="history" size={24} color="var(--color-info)" />
            <div>
              <div className="text-sm font-bold text-[var(--color-text-primary)]">
                이전 작성 이어하기
              </div>
              {/* 제목 + 진행도(step/4). 단계 라벨은 DRAFT_STEP_LABELS 매핑. 작성시각 ❌. */}
              <div className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                {draftMeta.title} · {DRAFT_STEP_LABELS[draftMeta.step] ?? "진행 중"} 단계 ({draftMeta.step}/4)
              </div>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setDraftDismissed(true)}
              className="ts-btn ts-btn--secondary ts-btn--sm"
            >
              새로 시작
            </button>
            <button
              type="button"
              onClick={() => {
                // 이어하기 — 폼은 이미 위 useEffect 가 채워둠. quick 탭으로 전환 + 배너 닫기만 수행.
                setSubtab("quick");
                setDraftDismissed(true);
              }}
              className="ts-btn ts-btn--primary ts-btn--sm inline-flex items-center gap-1"
            >
              <Icon name="arrow-right" size={16} />
              이어하기
            </button>
          </div>
        </div>
      )}

      {/* 2026-05-15 Phase 6 PR2 — super_admin / association_admin 분기 카드.
          이유: 협회 마법사 진입점을 일반 사용자에게는 숨기고 권한 보유자에게만 안내.
          AppNav frozen 룰 위반 회피 (메인 탭 / 더보기 추가 ❌) — 일반 마법사 상단 카드 1건만 추가. */}
      {showAssociationCard && (
        <div className="mb-4 rounded-md border border-[var(--color-info)]/40 bg-[var(--color-info)]/10 p-4">
          <div className="flex items-start gap-3">
            <Icon name="building-2" size={24} color="var(--color-info)" />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">
                협회 만들기 (super_admin)
              </h3>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                협회 본체, 사무국장, 배정비 단가표를 한 번에 등록합니다.
              </p>
              <Link
                href="/tournament-admin/wizard/association"
                className="mt-2 inline-flex items-center gap-1 rounded-[4px] bg-[var(--color-info)] px-3 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
              >
                협회 마법사 열기
                <Icon name="arrow-right" size={14} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* === 2026-05-28 PR-1C-14 (PA2) — quick 외 sub-tab 선택 시 "전환 안내 카드" ===
          이유: legacy/prospectus/association 탭은 별도 라우트가 정답(라우팅 구조 변경 ❌).
                각 방식 설명 + 기존 라우트로 이동 버튼만 표시 (시안 L170~191 패턴).
          박제 룰: 이동 = router.push (legacy 는 ?legacy=1 쿼리). 새 라우트 생성 0 / fetch 0.
          2026-06-21 B-2: quick 탭은 위 early-return(2컬럼 폼)으로 분리 → 여기 도달 시 subtab 은 항상 quick 외. */}
      {(
        <TossCard className="flex flex-col items-center gap-3 py-10 text-center hover:scale-100">
          {/* 2026-06-21 Toss B-b: 동적 Material → lucide <Icon>(SUBTABS.icon 은 이미 kebab). */}
          <Icon
            name={SUBTABS.find((t) => t.key === subtab)?.icon ?? "circle"}
            size={48}
            color="var(--color-text-muted)"
          />
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
            {SUBTABS.find((t) => t.key === subtab)?.label} 방식으로 전환
          </h3>
          <p className="max-w-md text-sm text-[var(--color-text-muted)]">
            {subtab === "legacy" && "3-step 마법사로 전환합니다. 대회 정보 → 참가 설정 → 확인·생성 순서로 진행해요."}
            {subtab === "prospectus" && "PDF 요강을 업로드하면 AI 가 종별·신청 정책을 자동으로 추출합니다."}
            {subtab === "association" && "협회 본체·사무국장·배정비를 한 번에 등록하는 협회 마법사로 전환합니다."}
          </p>
          <button
            type="button"
            onClick={() => {
              // 기존 라우트로만 이동 — 라우팅 구조 변경 ❌.
              if (subtab === "legacy") router.push("/tournament-admin/tournaments/new/wizard?legacy=1");
              else if (subtab === "prospectus") router.push("/tournament-admin/tournaments/new/wizard/prospectus");
              else if (subtab === "association") router.push("/tournament-admin/wizard/association");
            }}
            className="ts-btn ts-btn--primary inline-flex items-center gap-1"
          >
            <Icon name="arrow-right" size={16} />
            이 방식으로 전환
          </button>
        </TossCard>
      )}

      {/* quick 탭 본문은 위 early-return(2컬럼 풀폭 폼)으로 분리됨 — 여기엔 quick 외 전환 카드만 노출. */}
    </div>
  );
}

/**
 * LegacyWizardForm — 기존 3-step 폼 (대회정보 → 참가설정 → 확인생성).
 *
 * 2026-05-13 UI-2 — 본 함수는 코드 변경 0. 단지 default export 를 라우터로 변경하면서
 *   기존 컴포넌트를 함수 이름만 LegacyWizardForm 으로 변경. ?legacy=1 진입 시에만 노출.
 *
 * 1주 운영 후 별도 PR 로 본 함수 통째로 제거 예정 (UI-2 안정화 확인 후).
 */
function LegacyWizardForm() {
  const router = useRouter();
  const [authStatus, setAuthStatus] = useState<AuthStatus>("loading");
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 모달 상태
  const [showDivisionGenerator, setShowDivisionGenerator] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);

  // --- Step 1에서 사용하는 state (기본정보 + 일정/장소 + 경기설정) ---
  const [name, setName] = useState("");
  const [format, setFormat] = useState("group_stage_knockout");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState("");   // 주최
  const [host, setHost] = useState("");             // 주관
  const [sponsors, setSponsors] = useState("");     // 후원사
  const [gender, setGender] = useState("male");     // 성별 (기본: 남성)
  const [rules, setRules] = useState("");           // 규칙
  const [prizeInfo, setPrizeInfo] = useState("");   // 상금 정보

  // 일정/장소 (places 배열 포함)
  const [schedule, setSchedule] = useState<ScheduleFormData>({
    startDate: "",
    endDate: "",
    registrationStartAt: "",
    registrationEndAt: "",
    venueName: "",
    venueAddress: "",
    city: "",
    places: [],
  });

  // 경기 설정
  const [gameTime, setGameTime] = useState("");
  const [gameBall, setGameBall] = useState("");
  const [gameMethod, setGameMethod] = useState("");

  // 2026-05-13 UI-1.3 — 소속 시리즈 (선택).
  // 이유: wizard 안에서 시리즈 dropdown + 인라인 생성을 통해 대회 생성과 동시에 시리즈 연결.
  //   기존에는 wizard 후 별도 편집 페이지에서 연결해야 했음 (2단계 동선) → 1단계로 단축.
  type SeriesOption = {
    id: string;
    name: string;
    organization: { id: string; name: string; slug: string } | null;
  };
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [seriesLoaded, setSeriesLoaded] = useState(false);
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [myOrgs, setMyOrgs] = useState<{ id: string; name: string }[]>([]);

  // --- Step 2에서 사용하는 state (접수설정 + 팀설정) ---
  const [registration, setRegistration] = useState<RegistrationSettingsData>({
    categories: {},
    divCaps: {},
    divFees: {},
    allowWaitingList: false,
    waitingListCap: "",
    entryFee: "0",
    bankName: "",
    bankAccount: "",
    bankHolder: "",
    feeNotes: "",
  });

  const [teamSettings, setTeamSettings] = useState<TeamSettingsData>({
    maxTeams: "16",
    teamSize: "5",
    rosterMin: "5",
    rosterMax: "12",
    autoApproveTeams: false,
    autoCalcMaxTeams: false,
  });

  // --- 대진 포맷 세부 설정 (settings.bracket 저장) ---
  // 이유: 조 수, 토너먼트 진출 팀 수, 3/4위전 등 포맷별 추가 설정을 한 곳에 모아 관리
  const [bracketSettings, setBracketSettings] = useState<BracketSettingsData>({
    format: "group_stage_knockout",
    knockoutSize: 8,
    bronzeMatch: false,
    groupCount: 2,
    teamsPerGroup: 4,
    advancePerGroup: 2,
    autoGenerateMatches: true,
    // 2026-05-04 (P3) — 듀얼 표준 default (다른 포맷에서도 무해 — wizard payload 시 dual 일 때만 사용)
    semifinalPairing: DUAL_DEFAULT_PAIRING,
  });

  // format 선택이 바뀌면 bracketSettings.format도 동기화 (요약 표시 + 분기용)
  // 2026-05-04 (P3) — dual_tournament 선택 시 표준 default 자동 적용
  //   - groupCount/teamsPerGroup/advancePerGroup/knockoutSize/bronzeMatch/semifinalPairing 일괄
  //   - 운영자가 페어링 모드만 select 로 변경 가능 (BracketSettingsForm 의 select)
  useEffect(() => {
    setBracketSettings((prev) => {
      if (format === "dual_tournament") {
        // 듀얼 선택 → 16팀 4조 27매치 표준 자동 채우기
        // 단 semifinalPairing 은 사용자가 이전에 선택했을 수 있으므로 기존값 보존
        return {
          ...prev,
          format,
          groupCount: DUAL_DEFAULT_BRACKET.groupCount,
          teamsPerGroup: DUAL_DEFAULT_BRACKET.teamsPerGroup,
          advancePerGroup: DUAL_DEFAULT_BRACKET.advancePerGroup,
          knockoutSize: DUAL_DEFAULT_BRACKET.knockoutSize,
          bronzeMatch: DUAL_DEFAULT_BRACKET.bronzeMatch,
          hasGroupFinal: DUAL_DEFAULT_BRACKET.hasGroupFinal,
          semifinalPairing: prev.semifinalPairing ?? DUAL_DEFAULT_PAIRING,
        };
      }
      return { ...prev, format };
    });
  }, [format]);

  // --- Step 3에서 사용하는 state (디자인) ---
  const [designTemplate, setDesignTemplate] = useState("basic");
  const [logoUrl, setLogoUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  // BDR 브랜드 hex 초기값 (lib/constants/colors.ts 단일 source)
  const [primaryColor, setPrimaryColor] = useState(BDR_PRIMARY_HEX);
  const [secondaryColor, setSecondaryColor] = useState(BDR_SECONDARY_HEX);
  const [subdomain, setSubdomain] = useState("");

  // 디비전 정원 합산 — 자동 계산에 사용
  const totalDivCaps = Object.values(registration.divCaps).reduce((s, v) => s + v, 0);

  // 이전 대회 복사 적용 — 모든 필드를 한 번에 덮어씌움
  const handleCopyApply = useCallback((data: CopyData) => {
    if (data.format) setFormat(data.format);
    if (data.description) setDescription(data.description);
    if (data.organizer) setOrganizer(data.organizer);
    if (data.host) setHost(data.host);
    if (data.sponsors) setSponsors(data.sponsors);
    if (data.gender) setGender(data.gender);
    if (data.rules) setRules(data.rules);
    if (data.prizeInfo) setPrizeInfo(data.prizeInfo);
    if (data.venueName || data.venueAddress || data.city || data.places) {
      setSchedule((prev) => ({
        ...prev,
        venueName: data.venueName ?? prev.venueName,
        venueAddress: data.venueAddress ?? prev.venueAddress,
        city: data.city ?? prev.city,
        places: data.places ?? prev.places,
      }));
    }
    if (data.gameTime) setGameTime(data.gameTime);
    if (data.gameBall) setGameBall(data.gameBall);
    if (data.gameMethod) setGameMethod(data.gameMethod);
    if (data.categories || data.divCaps || data.divFees || data.entryFee || data.bankName) {
      setRegistration((prev) => ({
        ...prev,
        categories: data.categories ?? prev.categories,
        divCaps: data.divCaps ?? prev.divCaps,
        divFees: data.divFees ?? prev.divFees,
        entryFee: data.entryFee ?? prev.entryFee,
        bankName: data.bankName ?? prev.bankName,
        bankAccount: data.bankAccount ?? prev.bankAccount,
        bankHolder: data.bankHolder ?? prev.bankHolder,
        feeNotes: data.feeNotes ?? prev.feeNotes,
      }));
    }
    if (data.maxTeams || data.teamSize || data.rosterMin || data.rosterMax) {
      setTeamSettings((prev) => ({
        ...prev,
        maxTeams: data.maxTeams ?? prev.maxTeams,
        teamSize: data.teamSize ?? prev.teamSize,
        rosterMin: data.rosterMin ?? prev.rosterMin,
        rosterMax: data.rosterMax ?? prev.rosterMax,
      }));
    }
    if (data.primaryColor) setPrimaryColor(data.primaryColor);
    if (data.secondaryColor) setSecondaryColor(data.secondaryColor);
  }, []);

  // 종별 자동생성기 적용
  const handleDivisionApply = useCallback((categories: Record<string, string[]>) => {
    setRegistration((prev) => ({
      ...prev,
      categories: { ...prev.categories, ...categories },
    }));
  }, []);

  // 인증 체크 — 관리자 이상만 접근 가능
  useEffect(() => {
    fetch("/api/web/me")
      .then((res) => {
        if (!res.ok) {
          setAuthStatus("unauthenticated");
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        const role = (data.role ?? data.data?.role ?? "") as string;
        if (["super_admin", "organizer", "admin", "tournament_admin"].includes(role)) {
          setAuthStatus("authorized");
        } else {
          setAuthStatus("unauthorized");
        }
      })
      .catch(() => setAuthStatus("unauthenticated"));
  }, []);

  useEffect(() => {
    if (authStatus === "unauthenticated") {
      router.push("/login?redirect=/tournament-admin/tournaments/new/wizard");
    }
  }, [authStatus, router]);

  // 2026-05-13 UI-1.3 — 본인 보유 시리즈 + owner/admin 단체 목록 로드.
  // 이유: wizard Step 1 에서 시리즈 dropdown 옵션을 채우고, 인라인 생성 시 단체 dropdown 도 채움.
  //   authorized 상태에서만 호출 (비로그인 회피).
  useEffect(() => {
    if (authStatus !== "authorized") return;
    let cancelled = false;

    // 본인 보유 시리즈
    async function loadSeries() {
      try {
        const res = await fetch("/api/web/series/my");
        if (!res.ok) {
          if (!cancelled) setSeriesLoaded(true);
          return;
        }
        const json = await res.json();
        // apiSuccess 가 한 번 감싸므로 json.data.data 형식. 폴백 추가.
        const list: SeriesOption[] = (json.data?.data ?? json.data ?? []) as SeriesOption[];
        if (!cancelled) {
          setSeriesOptions(list);
          setSeriesLoaded(true);
        }
      } catch {
        if (!cancelled) setSeriesLoaded(true);
      }
    }

    // 본인 owner/admin 단체 — 인라인 시리즈 생성 폼의 단체 dropdown 용
    async function loadOrgs() {
      try {
        const res = await fetch("/api/web/organizations");
        if (!res.ok) return;
        const json = await res.json();
        const list = (json.data?.organizations ?? json.organizations ?? []) as Array<{
          id: string;
          name: string;
          myRole?: string;
          my_role?: string;
        }>;
        const filtered = list
          .filter((o) => {
            const role = o.myRole ?? o.my_role;
            return role === "owner" || role === "admin";
          })
          .map((o) => ({ id: o.id, name: o.name }));
        if (!cancelled) setMyOrgs(filtered);
      } catch {
        // 실패해도 wizard 자체는 계속 사용 가능 — 단체 dropdown 만 안 보임.
      }
    }

    loadSeries();
    loadOrgs();
    return () => {
      cancelled = true;
    };
  }, [authStatus]);

  // 2026-05-20 Phase 3 fix — prospectus AI 분석 후 sessionStorage draft 자동 채움 (LegacyWizardForm).
  // QuickCreateForm 보다 폼 필드가 많음 — title / description / format / schedule / team / registration / seriesId 전체 자동 채움.
  // 인증 통과 후 1회만 실행 (authorized 되면 draft 읽기). 이후 사용자 직접 수정 가능 (덮어쓰기 ❌).
  useEffect(() => {
    if (authStatus !== "authorized") return;
    const draft = loadDraft();
    if (!draft) return;
    const p = draft.tournament_payload;
    if (p.title) setName(p.title);
    if (p.description) setDescription(p.description);
    if (p.format) setFormat(p.format);
    if (p.schedule) {
      setSchedule((prev) => ({ ...prev, ...p.schedule }));
    }
    if (p.team) {
      setTeamSettings((prev) => ({ ...prev, ...p.team }));
    }
    if (p.registration) {
      setRegistration((prev) => ({ ...prev, ...p.registration }));
    }
    if (draft.series_id) setSeriesId(String(draft.series_id));
  }, [authStatus]);

  // 인라인 폼에서 시리즈 생성 성공 시 — seriesOptions 갱신 + 자동 선택 + 폼 닫기.
  function handleSeriesCreated(created: CreatedSeries) {
    setSeriesOptions((prev) => [created, ...prev]);
    setSeriesId(created.id);
    setShowSeriesForm(false);
  }

  // 로딩/미인증 상태
  if (authStatus === "loading" || authStatus === "unauthenticated") {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[var(--color-text-muted)]">로딩 중...</div>
      </div>
    );
  }

  // 권한 없음
  if (authStatus === "unauthorized") {
    return (
      <div data-skin="toss" className="flex min-h-[40vh] flex-col items-center justify-center gap-4 text-center">
        <Icon name="lock" size={48} color="var(--color-text-muted)" />
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">권한이 필요합니다</h1>
        <p className="max-w-md text-sm text-[var(--color-text-muted)]">
          대회를 만들려면 <strong>대회 관리자</strong> 이상의 권한이 필요합니다.
          <br />
          운영자에게 문의해주세요.
        </p>
        {/* 2026-05-12: admin 빨강 본문 금지 → btn--primary */}
        <Link href="/tournaments" className="ts-btn ts-btn--primary mt-2">
          대회 목록으로 돌아가기
        </Link>
      </div>
    );
  }

  // 다음 단계 이동 — Step 0에서 대회명 필수 검증
  function goNext() {
    if (currentStep === 0 && !name.trim()) {
      setError("대회 이름을 입력하세요.");
      return;
    }
    setError(null);
    setCurrentStep(currentStep + 1);
    // 스크롤 최상단으로 이동 (긴 폼이므로)
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 대회 생성 API 호출 — 기존 로직 100% 유지
  async function handleCreate() {
    setLoading(true);
    setError(null);

    // 디비전 정원 합산이 있으면 자동 계산, 없으면 수동 입력값
    const effectiveMaxTeams =
      teamSettings.autoCalcMaxTeams && totalDivCaps > 0
        ? totalDivCaps
        : Number(teamSettings.maxTeams) || 16;

    try {
      const res = await fetch("/api/web/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          format,
          // 2026-05-13 UI-1.3 — 시리즈 연결 (선택). null/"" 모두 미연결로 처리.
          // POST /api/web/tournaments 의 seriesId 키 (camelCase) 그대로 전달 — route.ts L160 박제.
          seriesId: seriesId ?? undefined,
          description: description || undefined,
          organizer: organizer || undefined,
          host: host || undefined,
          sponsors: sponsors || undefined,
          gender: gender || undefined,
          rules: rules || undefined,
          prizeInfo: prizeInfo || undefined,
          startDate: schedule.startDate || undefined,
          endDate: schedule.endDate || undefined,
          registrationStartAt: schedule.registrationStartAt || undefined,
          registrationEndAt: schedule.registrationEndAt || undefined,
          venueName: schedule.venueName || undefined,
          venueAddress: schedule.venueAddress || undefined,
          city: schedule.city || undefined,
          places: schedule.places.length > 0 ? schedule.places : undefined,
          gameTime: gameTime || undefined,
          gameBall: gameBall || undefined,
          gameMethod: gameMethod || undefined,
          categories: Object.keys(registration.categories).length > 0 ? registration.categories : undefined,
          divCaps: Object.keys(registration.divCaps).length > 0 ? registration.divCaps : undefined,
          divFees: Object.keys(registration.divFees).length > 0 ? registration.divFees : undefined,
          allowWaitingList: registration.allowWaitingList || undefined,
          waitingListCap: registration.waitingListCap ? Number(registration.waitingListCap) : undefined,
          entryFee: Number(registration.entryFee) || undefined,
          bankName: registration.bankName || undefined,
          bankAccount: registration.bankAccount || undefined,
          bankHolder: registration.bankHolder || undefined,
          feeNotes: registration.feeNotes || undefined,
          maxTeams: effectiveMaxTeams,
          teamSize: Number(teamSettings.teamSize) || 5,
          rosterMin: Number(teamSettings.rosterMin) || 5,
          rosterMax: Number(teamSettings.rosterMax) || 12,
          autoApproveTeams: teamSettings.autoApproveTeams || undefined,
          designTemplate: designTemplate || undefined,
          logoUrl: logoUrl || undefined,
          bannerUrl: bannerUrl || undefined,
          primaryColor,
          secondaryColor,
          subdomain: subdomain || undefined,
          // 대진 포맷 세부 설정 — settings.bracket에 저장
          // (API의 PATCH 로직은 기존 settings와 머지. 신규 POST는 아래 값이 바로 settings에 들어감)
          // 2026-05-04 (P3): dual 표준 default — semifinalPairing/hasGroupFinal/teamsPerGroup 추가 전달
          //   bracket route 의 generateDualTournament 호출 시 settings.bracket.semifinalPairing 참조
          settings: {
            bracket: {
              knockoutSize: bracketSettings.knockoutSize,
              bronzeMatch: bracketSettings.bronzeMatch,
              groupCount: bracketSettings.groupCount,
              teamsPerGroup: bracketSettings.teamsPerGroup,
              advancePerGroup: bracketSettings.advancePerGroup,
              autoGenerateMatches: bracketSettings.autoGenerateMatches,
              hasGroupFinal: bracketSettings.hasGroupFinal,
              semifinalPairing: bracketSettings.semifinalPairing,
            },
          },
        }),
      });

      const data = await res.json();
      if (res.ok) {
        router.push(data.redirect_url ?? data.redirectUrl ?? "/tournament-admin/tournaments");
      } else {
        setError(data.error ?? "오류가 발생했습니다.");
        setLoading(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setLoading(false);
    }
  }

  return (
    // 2026-06-21 Toss B-b: Legacy 3-step 위저드 루트에 data-skin="toss" opt-in.
    <div data-skin="toss" className="mx-auto max-w-3xl">
      {/* === 헤더: 타이틀 + 이전 대회 복사 버튼 === */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">새 대회 만들기</h1>
        <button
          onClick={() => setShowCopyModal(true)}
          className="flex items-center gap-1 rounded-[4px] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]"
        >
          <Icon name="copy" size={16} />
          이전 대회에서 복사
        </button>
      </div>

      {/* === 3단계 탭 인디케이터 === */}
      <div className="mb-6 flex gap-2">
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => {
              // 이전 단계로만 이동 가능 (클릭으로 되돌아가기)
              if (i < currentStep) {
                setCurrentStep(i);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }
            }}
            // 2026-05-12 — admin 빨강 본문 금지 (wizard 활성 탭) → info(Navy)
            className={`flex flex-1 items-center justify-center gap-2 rounded-[4px] py-3 text-sm font-semibold transition-colors ${
              i === currentStep
                ? "bg-[var(--color-info)] text-white"
                : i < currentStep
                  ? "cursor-pointer bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]"
                  : "cursor-not-allowed bg-[var(--color-elevated)] text-[var(--color-text-muted)]"
            }`}
          >
            {/* 2026-06-21 Toss B-b: Material → lucide <Icon>. 완료=circle-check, 그 외 step.icon(kebab).
                색상은 부모 버튼 text-* 의 currentColor 상속(흰/success/muted). */}
            <Icon name={i < currentStep ? "circle-check" : step.icon} size={18} />
            <span className="hidden sm:inline">{step.label}</span>
            <span className="sm:hidden">{i + 1}</span>
          </button>
        ))}
      </div>

      {/* 에러 메시지 — 하드코딩 색상 → CSS 변수 토큰 (배경은 color-mix 10% 투명) */}
      {error && (
        <div className="mb-4 rounded-md bg-[color-mix(in_srgb,var(--color-error)_10%,transparent)] px-4 py-3 text-sm text-[var(--color-error)]">{error}</div>
      )}

      {/* ================================================================
       * Step 1: 대회 정보 (기본정보 + 일정/장소 + 경기설정)
       * 하나의 긴 폼을 TossCard 섹션으로 구분
       * ================================================================ */}
      {currentStep === 0 && (
        <div className="space-y-4">
          {/* --- 섹션 1: 기본 정보 --- */}
          <TossCard className="space-y-4 hover:scale-100">
            <SectionTitle icon="file-pen">기본 정보</SectionTitle>

            {/* 대회명 (필수) */}
            <div>
              <label className={labelCls}>대회 이름 *</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputCls}
                placeholder="대회 이름 입력"
              />
            </div>

            {/*
              2026-05-13 UI-1.3 — 소속 시리즈 (선택).
              이유: 운영자가 wizard 한 번에 시리즈 연결까지 완료. 기존엔 대회 생성 후 편집 wizard
                재진입해야 했음 → 1단계로 단축. POST body.seriesId 로 전달 (api route.ts L160).
              "개인 대회" 옵션 = 시리즈 미연결 (서버에서 null 처리).
              "새 시리즈 만들기" 버튼 → InlineSeriesForm (UI-1.2 공통 컴포넌트) 토글.
            */}
            <div>
              <label className={labelCls}>소속 시리즈 (선택)</label>
              <select
                value={seriesId ?? ""}
                onChange={(e) => setSeriesId(e.target.value === "" ? null : e.target.value)}
                className={inputCls}
                disabled={!seriesLoaded}
              >
                <option value="">개인 대회 (시리즈 없음)</option>
                {seriesOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.organization?.name ?? "단체 미연결"})
                  </option>
                ))}
              </select>

              {/* 빈 상태 / 새 시리즈 트리거 — 폼이 열려있지 않을 때만 노출 */}
              {seriesLoaded && !showSeriesForm && seriesOptions.length === 0 && (
                <div className="mt-2">
                  <p className="mb-2 text-xs text-[var(--color-text-muted)]">
                    아직 보유한 시리즈가 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSeriesForm(true)}
                    className="inline-flex items-center gap-1 rounded-[4px] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
                  >
                    <Icon name="plus" size={16} />
                    새 시리즈 만들기
                  </button>
                </div>
              )}
              {seriesLoaded && !showSeriesForm && seriesOptions.length > 0 && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowSeriesForm(true)}
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-info)] hover:underline"
                  >
                    <Icon name="plus" size={14} />
                    새 시리즈 만들기
                  </button>
                </div>
              )}

              {/* InlineSeriesForm — UI-1.2/UI-1.3 공통 컴포넌트 */}
              {showSeriesForm && (
                <InlineSeriesForm
                  myOrgs={myOrgs}
                  onCreated={handleSeriesCreated}
                  onCancel={() => setShowSeriesForm(false)}
                />
              )}
            </div>

            {/* 주최 / 주관 / 후원사 */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className={labelCls}>주최</label>
                <input
                  type="text"
                  value={organizer}
                  onChange={(e) => setOrganizer(e.target.value)}
                  className={inputCls}
                  placeholder="주최 단체/기관"
                />
              </div>
              <div>
                <label className={labelCls}>주관</label>
                <input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className={inputCls}
                  placeholder="주관 단체/기관"
                />
              </div>
              <div>
                <label className={labelCls}>후원</label>
                <input
                  type="text"
                  value={sponsors}
                  onChange={(e) => setSponsors(e.target.value)}
                  className={inputCls}
                  placeholder="후원사 (쉼표 구분)"
                />
              </div>
            </div>

            {/* 성별 pill */}
            <div>
              <label className={labelCls}>성별</label>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => setGender(g.value)}
                    className={pillCls(gender === g.value)}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 대회 설명 */}
            <div>
              <label className={labelCls}>대회 소개</label>
              <textarea
                className={inputCls}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="대회 소개 입력"
              />
            </div>

            {/* 규칙 */}
            <div>
              <label className={labelCls}>규칙</label>
              <textarea
                className={inputCls}
                rows={3}
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                placeholder="대회 규칙 (예: KBL 규칙 준용, 파울 5개 퇴장 등)"
              />
            </div>

            {/* 상금 정보 */}
            <div>
              <label className={labelCls}>상금 / 시상 정보</label>
              <textarea
                className={inputCls}
                rows={2}
                value={prizeInfo}
                onChange={(e) => setPrizeInfo(e.target.value)}
                placeholder="우승 100만원, 준우승 50만원 등"
              />
            </div>
          </TossCard>

          {/* --- 섹션 2: 일정 및 장소 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="calendar">일정 및 장소</SectionTitle>
            {/* ScheduleForm 서브 컴포넌트 재사용 (기존 그대로) */}
            <div className="mt-4">
              <ScheduleForm
                data={schedule}
                onChange={(field, value) =>
                  setSchedule((prev) => ({ ...prev, [field]: value }))
                }
              />
            </div>
          </TossCard>

          {/* --- 섹션 3: 경기 설정 --- */}
          <TossCard className="space-y-6 hover:scale-100">
            <SectionTitle icon="volleyball">경기 설정</SectionTitle>

            {/* 대회 방식 (FORMAT은 select → GameMethodInput 4종 pill) */}
            <div>
              <label className={labelCls}>대회 방식</label>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value)}
                className={inputCls}
              >
                {FORMAT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            {/* 대진 포맷 세부 설정 — 조 수/토너먼트 진출팀/3-4위전 등 */}
            {/* 신규 대회는 아직 참가팀이 없으므로 maxTeams 기준으로 미리보기 */}
            <BracketSettingsForm
              data={bracketSettings}
              teamCount={Number(teamSettings.maxTeams) || undefined}
              onChange={(field, value) =>
                setBracketSettings((prev) => ({ ...prev, [field]: value }))
              }
            />

            {/*
              2026-05-13 P2 — dual_tournament 정합성 경고 (16팀 고정 vs 디비전 정원 합산).
              이유: dual_tournament 는 4조×4팀 미니 더블엘리미 = 16팀 고정 포맷이라
                divCaps 합산 ≠ 16 이면 대진표 생성 단계에서 누락/부전승 자동 발생.
              사후 가드(생성 시점) 보다 사전 안내가 운영자에게 친절. divCaps 미입력(0)은 경고 X.
            */}
            {format === "dual_tournament" && totalDivCaps > 0 && (
              totalDivCaps === 16 ? (
                <p className="text-xs text-[var(--color-success)]">
                  ✅ 디비전 정원 합산 16팀 — 듀얼 대진과 일치합니다.
                </p>
              ) : (
                <div className="rounded-[4px] border border-[var(--color-warning)] bg-[color-mix(in_srgb,var(--color-warning)_8%,transparent)] p-2 text-xs">
                  ⚠️ 듀얼 토너먼트는 16팀 고정인데 디비전 정원 합산이 {totalDivCaps}팀입니다. 정원을 16팀으로 맞춰주세요.
                </div>
              )
            )}

            {/* 경기시간 프리셋 */}
            <GameTimeInput value={gameTime} onChange={setGameTime} />

            {/* 경기구 선택 */}
            <GameBallInput value={gameBall} onChange={setGameBall} />

            {/*
              2026-05-13 UI-1.1 — 경기 룰 (비고) textarea.
              이유: 기존 GameMethodInput 은 FORMAT 4종 pill 과 중복 → 단순 textarea 로 game_method 활용.
              저장 흐름: state(gameMethod) → POST body.gameMethod (L344 기존) → DB game_method.
            */}
            <div>
              <label className={labelCls}>경기 룰 (비고)</label>
              <textarea
                className={inputCls}
                rows={2}
                value={gameMethod}
                onChange={(e) => setGameMethod(e.target.value)}
                placeholder="예: 올데드 / 자유 교체 / 5반칙 제외 등"
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                경기 운영 시 적용할 특별 룰을 자유롭게 적어주세요.
              </p>
            </div>
          </TossCard>
        </div>
      )}

      {/* ================================================================
       * Step 2: 참가 설정 (종별/디비전 + 팀설정 + 참가비/입금)
       * ================================================================ */}
      {currentStep === 1 && (
        <div className="space-y-4">
          {/* --- 섹션 1: 종별/디비전 --- */}
          <TossCard className="hover:scale-100">
            <div className="mb-4 flex items-center justify-between">
              <SectionTitle icon="layout-grid">종별 / 디비전</SectionTitle>
              {/* BDR 종별 자동생성기 버튼 */}
              <button
                type="button"
                onClick={() => setShowDivisionGenerator(true)}
                className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <Icon name="circle-plus" size={18} />
                종별 추가
              </button>
            </div>
            {/* RegistrationSettingsForm 재사용 — 접수 관련 전체 폼 */}
            <RegistrationSettingsForm
              data={registration}
              onChange={(updates) => setRegistration((prev) => ({ ...prev, ...updates }))}
            />
          </TossCard>

          {/* --- 섹션 2: 팀 설정 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="users">팀 설정</SectionTitle>
            <div className="mt-4">
              {/* TeamSettingsForm 재사용 */}
              <TeamSettingsForm
                data={teamSettings}
                totalDivCaps={totalDivCaps}
                onChange={(field, value) =>
                  setTeamSettings((prev) => ({ ...prev, [field]: value }))
                }
              />
            </div>
          </TossCard>
        </div>
      )}

      {/* ================================================================
       * Step 3: 확인 및 생성 (디자인 + 미리보기)
       * ================================================================ */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* --- 디자인 설정 --- */}
          <TossCard className="space-y-5 hover:scale-100">
            <SectionTitle icon="palette">디자인</SectionTitle>

            {/* 템플릿 선택 — 4종 pill 버튼 */}
            <div>
              <label className={labelCls}>템플릿</label>
              <div className="flex flex-wrap gap-2">
                {/* 2026-06-21 Toss B-b: 템플릿 icon Material → lucide kebab (gradient 부재→square 의미대체). */}
                {(
                  [
                    { value: "basic", label: "기본형", icon: "square" },     // gradient
                    { value: "poster", label: "포스터형", icon: "image" },   // image
                    { value: "logo", label: "로고형", icon: "badge" },       // badge
                    { value: "photo", label: "사진형", icon: "camera" },     // photo_camera
                  ] as const
                ).map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setDesignTemplate(t.value)}
                    className={pillCls(designTemplate === t.value)}
                  >
                    <Icon name={t.icon} size={14} className="align-middle mr-1" />
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 대회 로고 업로드 (1:1 비율) — 생성 시에는 아직 ID가 없으므로 임시 경로 */}
            <ImageUploader
              value={logoUrl}
              onChange={setLogoUrl}
              bucket="tournament-images"
              path="tournaments/new/logo"
              label="대회 로고"
              aspectRatio="1/1"
              maxSizeMB={5}
            />

            {/* 대회 포스터/배너 업로드 (16:9 비율) */}
            <ImageUploader
              value={bannerUrl}
              onChange={setBannerUrl}
              bucket="tournament-images"
              path="tournaments/new/banner"
              label="대회 포스터"
              aspectRatio="16/9"
              maxSizeMB={5}
            />

            {/* 색상 설정 */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelCls}>대표 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="h-12 w-16 cursor-pointer rounded-md border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">{primaryColor}</span>
                </div>
              </div>
              <div>
                <label className={labelCls}>보조 색상</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setSecondaryColor(e.target.value)}
                    className="h-12 w-16 cursor-pointer rounded-md border-none bg-transparent p-0"
                  />
                  <span className="text-sm text-[var(--color-text-muted)]">{secondaryColor}</span>
                </div>
              </div>
            </div>

            {/* 실시간 미리보기 — 선택한 템플릿에 따라 다르게 표시 */}
            <div>
              <label className={labelCls}>미리보기</label>
              <div className="overflow-hidden rounded-md" style={{ aspectRatio: "16/9" }}>
                {designTemplate === "basic" && (
                  <div
                    className="flex h-full items-end p-6"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    <p className="text-lg font-bold text-white drop-shadow">{name || "대회 이름"}</p>
                  </div>
                )}
                {designTemplate === "poster" && (
                  <div className="relative flex h-full items-end">
                    {bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bannerUrl} alt="포스터" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }} />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="relative p-6 text-lg font-bold text-white drop-shadow">{name || "대회 이름"}</p>
                  </div>
                )}
                {designTemplate === "logo" && (
                  <div
                    className="flex h-full flex-col items-center justify-center gap-3"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                  >
                    {logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={logoUrl} alt="로고" className="h-16 w-16 rounded-md object-cover shadow-lg" />
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-md bg-white/20 text-white">
                        <Icon name="trophy" size={30} />
                      </div>
                    )}
                    <p className="text-lg font-bold text-white drop-shadow">{name || "대회 이름"}</p>
                  </div>
                )}
                {designTemplate === "photo" && (
                  <div className="relative flex h-full items-end">
                    {bannerUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={bannerUrl} alt="사진" className="absolute inset-0 h-full w-full object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-[var(--color-surface)]" />
                    )}
                    <div className="absolute inset-0 bg-black/50" />
                    <p className="relative p-6 text-lg font-bold text-white drop-shadow">{name || "대회 이름"}</p>
                  </div>
                )}
              </div>
            </div>

            {/* 서브도메인 URL */}
            <div>
              <label className={labelCls}>서브도메인 (선택)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={subdomain}
                  onChange={(e) =>
                    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))
                  }
                  className={`flex-1 ${inputCls}`}
                  placeholder="my-tournament"
                />
                <span className="text-sm text-[var(--color-text-muted)]">.mybdr.kr</span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">비워두면 대회 ID로 접근합니다.</p>
            </div>
          </TossCard>

          {/* --- 전체 요약 미리보기 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="clipboard-check">입력 내용 확인</SectionTitle>

            <div className="mt-4 space-y-3 text-sm">
              {/* 기본 정보 */}
              <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">대회 정보</p>
                <Row label="대회명" value={name || "미입력"} />
                <Row label="형식" value={FORMAT_OPTIONS.find((f) => f.value === format)?.label ?? format} />
                <Row label="성별" value={GENDER_OPTIONS.find((g) => g.value === gender)?.label ?? gender} />
                {organizer && <Row label="주최" value={organizer} />}
                {host && <Row label="주관" value={host} />}
                {sponsors && <Row label="후원" value={sponsors} />}
              </div>

              {/* 일정/장소 */}
              <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">일정 및 장소</p>
                <Row
                  label="대회 기간"
                  value={
                    schedule.startDate
                      ? `${schedule.startDate} ~ ${schedule.endDate || "미정"}`
                      : "미정"
                  }
                />
                <Row
                  label="접수 기간"
                  value={
                    schedule.registrationStartAt
                      ? `${schedule.registrationStartAt} ~ ${schedule.registrationEndAt || "미정"}`
                      : "미설정"
                  }
                />
                <Row
                  label="장소"
                  value={
                    schedule.places.length > 0
                      ? schedule.places.map((p) => p.name).join(", ")
                      : [schedule.city, schedule.venueName].filter(Boolean).join(" ") || "미설정"
                  }
                />
              </div>

              {/* 경기 설정 */}
              {(gameTime || gameBall || gameMethod) && (
                <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">경기 설정</p>
                  {gameTime && <Row label="경기시간" value={gameTime} />}
                  {gameBall && <Row label="경기구" value={gameBall} />}
                  {gameMethod && <Row label="비고" value={gameMethod} />}
                </div>
              )}

              {/* 참가 설정 */}
              <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">참가 설정</p>

                {/* 부문/디비전 */}
                {Object.keys(registration.categories).length > 0 && (
                  <div className="space-y-1">
                    {Object.entries(registration.categories).map(([cat, divs]) => (
                      <div key={cat} className="flex gap-2">
                        <span className="text-[var(--color-text-muted)]">{cat}:</span>
                        <span className="font-medium">
                          {divs
                            .map((d) => {
                              const cap = registration.divCaps[d];
                              const fee = registration.divFees[d];
                              let label = d;
                              if (cap) label += ` (${cap}팀)`;
                              if (fee) label += ` ${fee.toLocaleString()}원`;
                              return label;
                            })
                            .join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <Row
                  label="참가비"
                  value={
                    Number(registration.entryFee) > 0
                      ? `${Number(registration.entryFee).toLocaleString()}원`
                      : "무료"
                  }
                />
                <Row
                  label="최대 팀"
                  value={`${teamSettings.autoCalcMaxTeams && totalDivCaps > 0 ? totalDivCaps : teamSettings.maxTeams}팀`}
                />
                <Row
                  label="로스터"
                  value={`${teamSettings.rosterMin} ~ ${teamSettings.rosterMax}명`}
                />
                {registration.bankName && (
                  <Row
                    label="입금계좌"
                    value={`${registration.bankName} ${registration.bankAccount} (${registration.bankHolder})`}
                  />
                )}
              </div>

              {/* 기타 */}
              {(rules || prizeInfo) && (
                <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                  <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">기타</p>
                  {rules && <Row label="규칙" value={rules.slice(0, 80) + (rules.length > 80 ? "..." : "")} />}
                  {prizeInfo && <Row label="상금" value={prizeInfo.slice(0, 80) + (prizeInfo.length > 80 ? "..." : "")} />}
                </div>
              )}

              <Row
                label="URL"
                value={subdomain ? `${subdomain}.mybdr.kr` : "자동 생성"}
              />
            </div>
          </TossCard>

          {/* === 생성 버튼 (풀와이드 CTA) === 2026-05-12: admin 빨강 본문 금지 → btn--primary */}
          <button
            onClick={handleCreate}
            disabled={loading}
            className="ts-btn ts-btn--primary w-full disabled:opacity-50"
          >
            {loading ? "생성 중..." : "대회 생성하기"}
          </button>
        </div>
      )}

      {/* === 하단 네비게이션: 이전/다음 (마지막 단계 제외 — CTA가 있으므로) === */}
      {currentStep < 2 && (
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => {
              setCurrentStep(Math.max(0, currentStep - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={currentStep === 0 || loading}
            className="rounded-[4px] border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-30"
          >
            이전
          </button>
          {/* 2026-05-12: admin 빨강 본문 금지 → btn--primary */}
          <button type="button" onClick={goNext} className="ts-btn ts-btn--primary">
            다음
          </button>
        </div>
      )}

      {/* 마지막 단계에서 이전 버튼만 표시 */}
      {currentStep === 2 && (
        <div className="mt-4">
          <button
            onClick={() => {
              setCurrentStep(1);
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            className="rounded-[4px] border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
          >
            이전 단계로
          </button>
        </div>
      )}

      {/* === 모달들 === */}
      <DivisionGeneratorModal
        open={showDivisionGenerator}
        onClose={() => setShowDivisionGenerator(false)}
        onApply={handleDivisionApply}
      />
      <TournamentCopyModal
        open={showCopyModal}
        onClose={() => setShowCopyModal(false)}
        onApply={handleCopyApply}
      />
    </div>
  );
}

// 미리보기에서 라벨-값 한 줄 표시
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-[var(--color-text-muted)]">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
