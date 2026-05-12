"use client";

import { useState, useEffect, useCallback } from "react";
// 2026-05-13 UI-1.5 — 체크리스트 5번 카드(?step=2) 진입 시 RegistrationSettingsForm 영역 자동 이동
//   useSearchParams 로 ?step=N 읽어 initialStep 설정 (1-based → currentStep N-1)
import { useParams, useRouter, useSearchParams } from "next/navigation";
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
// 2026-05-13 UI-1.2 — 빈 상태 인라인 시리즈 생성 폼 (공통 컴포넌트)
import { InlineSeriesForm, type CreatedSeries } from "@/components/tournament/inline-series-form";
// 2026-05-13 UI-3 — BracketSettingsForm / DUAL_DEFAULT_* / FORMAT_OPTIONS 제거.
//   사유: 운영 방식(format/조 크기/본선 진출 등)은 /divisions 페이지(division_rules.format) 단일 source.
//   wizard 가 중복 박제하던 settings.bracket / format state 모두 제거 → /divisions 페이지로 이관.
// 2026-05-13 UI-4 — 디자인 / 공개여부 / 사이트 설정 제거.
//   사유: 사이트 설정(서브도메인/배너/색상/공개)은 /site 페이지 단일 source.
//   wizard 가 박제하던 design_template / logo_url / banner_url / primary_color / secondary_color / is_public 제거.
import { DivisionGeneratorModal } from "@/components/tournament/division-generator-modal";
// 2026-05-09: 사이트 전역 휴대폰 입력 컴포넌트 (자동 하이픈 / 11자리 / inputMode=numeric)
//   conventions.md [2026-05-08] 사이트 전역 input 룰 — type="tel" 직접 사용 금지
import { PhoneInput } from "@/components/inputs/phone-input";

// --- 3단계 구성 (생성 위자드와 동일) ---
// 2026-05-13 UI-3/UI-4 — Step 3 라벨 = "확인 및 저장" 유지 (디자인 영역만 제거)
const STEPS = [
  { key: "info", label: "대회 정보", icon: "emoji_events" },
  { key: "registration", label: "참가 설정", icon: "group_add" },
  { key: "confirm", label: "확인 및 저장", icon: "check_circle" },
];

// 2026-05-13 UI-3 — FORMAT_OPTIONS / LEGACY_FORMAT_MAP 제거.
//   사유: 운영 방식은 /divisions 페이지 단일 source. wizard 에서 format select 제거.

// 성별 옵션 — BDR은 남성부/여성부만 운영 (혼성 없음)
const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

// 대회 상태 4종 통일 (draft/registration/in_progress/completed)
const STATUS_OPTIONS = [
  { value: "draft", label: "준비중" },
  { value: "registration", label: "접수중" },
  { value: "in_progress", label: "진행중" },
  { value: "completed", label: "종료" },
];

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

// 섹션 제목 컴포넌트 — Material Symbols 아이콘 + bold
function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <h3 className="flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
      <span className="material-symbols-outlined text-lg text-[var(--color-accent)]">{icon}</span>
      {children}
    </h3>
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

export default function TournamentEditWizardPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // 2026-05-13 UI-1.5 — query param ?step=N (1-based) 으로 진입 시 해당 step 으로 자동 이동.
  //   - SetupChecklist 5번 "신청 정책" 카드 → /wizard?step=2 → currentStep=1 (RegistrationSettingsForm 영역)
  //   - 범위 검증: 1~STEPS.length 밖이면 1 로 fallback (외부 링크 위변조 가드)
  const searchParams = useSearchParams();
  const initialStep = (() => {
    const raw = Number(searchParams?.get("step"));
    if (!Number.isFinite(raw) || raw < 1 || raw > STEPS.length) return 0;
    return raw - 1; // 1-based → 0-based
  })();
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDivisionGenerator, setShowDivisionGenerator] = useState(false);

  // --- Step 1: 기본정보 + 일정/장소 + 경기설정 ---
  // 2026-05-13 UI-3 — format state 제거 (운영 방식은 /divisions 단일 source)
  // 2026-05-13 UI-4 — isPublic state 제거 (사이트 공개여부는 /site 단일 source)
  const [name, setName] = useState("");
  const [status, setStatus] = useState("draft");
  const [description, setDescription] = useState("");
  const [organizer, setOrganizer] = useState("");
  const [host, setHost] = useState("");
  const [sponsors, setSponsors] = useState("");
  const [gender, setGender] = useState("male");
  const [rules, setRules] = useState("");
  const [prizeInfo, setPrizeInfo] = useState("");

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

  // --- Step 2: 접수설정 + 팀설정 ---
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

  // --- 문의 연락처 (settings.contact_phone에 저장) ---
  const [contactPhone, setContactPhone] = useState("");

  // 2026-05-13 UI-3 — bracketSettings state 제거 (운영 방식 = /divisions 단일 source).
  //   settings.bracket 박제도 제거 — wizard 가 더 이상 덮어쓰지 않음.

  // 기존 settings 원본 — 저장 시 머지용 (다른 키 유실 방지)
  const [rawSettings, setRawSettings] = useState<Record<string, unknown>>({});

  // --- 시리즈 연결 (2026-05-12 PR2) ---
  // 이유: 운영자가 본인 보유 시리즈에 대회를 사후 연결/분리 가능 (PATCH series_id).
  //   초기값 = DB tournament.series_id (없으면 null). 드롭다운 변경 시 confirm 후 state 반영.
  // 드롭다운 라벨: "시리즈명 (단체명)" — 단체 미연결 시리즈는 "(단체 미연결)" 박제.
  type SeriesOption = {
    id: string;
    name: string;
    organization: { id: string; name: string; slug: string } | null;
  };
  const [seriesId, setSeriesId] = useState<string | null>(null);
  const [seriesOptions, setSeriesOptions] = useState<SeriesOption[]>([]);
  const [seriesLoaded, setSeriesLoaded] = useState(false);

  // 2026-05-13 UI-1.2 — 인라인 시리즈 생성 폼 토글 + 본인 owner/admin 단체 목록.
  // 이유: wizard 안에서 즉석 시리즈 생성 → dropdown 옵션 즉시 갱신 + 자동 선택.
  //   단체 목록은 GET /api/web/organizations 응답에서 myRole 이 owner/admin 인 항목만 필터링.
  const [showSeriesForm, setShowSeriesForm] = useState(false);
  const [myOrgs, setMyOrgs] = useState<{ id: string; name: string }[]>([]);

  // 2026-05-13 UI-4 — 디자인 state 5종 (designTemplate / logoUrl / bannerUrl / primaryColor / secondaryColor) 제거.
  //   사유: 사이트 설정은 /site 페이지 단일 source. wizard 가 더 이상 박제하지 않음.

  // 디비전 정원 합산 — 자동 계산에 사용
  const totalDivCaps = Object.values(registration.divCaps).reduce((s, v) => s + v, 0);

  // ISO 날짜 → input[type=date] 형식 변환
  const toDateInput = (iso: string | null | undefined) => {
    if (!iso) return "";
    return new Date(iso).toISOString().split("T")[0];
  };

  // 기존 대회 데이터 로드 — DB에서 가져와서 각 state에 분배
  const loadTournament = useCallback(async () => {
    try {
      const res = await fetch(`/api/web/tournaments/${id}`);
      if (!res.ok) throw new Error("로드 실패");
      const json = await res.json();
      // apiSuccess 래퍼가 있으면 data 꺼내기, 없으면 그대로
      const t = json.data ?? json;

      // 기본 정보
      // 2026-05-13 UI-3 — format 복원 제거 (운영 방식은 /divisions 단일 source)
      // 2026-05-13 UI-4 — isPublic 복원 제거 (사이트 공개여부는 /site 단일 source)
      setName(t.name ?? "");
      setStatus(t.status ?? "draft");
      setDescription(t.description ?? "");
      setOrganizer(t.organizer ?? "");
      setHost(t.host ?? "");
      setSponsors(t.sponsors ?? "");
      setGender(t.gender ?? "male");
      setRules(t.rules ?? "");
      setPrizeInfo(t.prize_info ?? t.prizeInfo ?? "");

      // 일정/장소
      setSchedule({
        startDate: toDateInput(t.startDate ?? t.start_date),
        endDate: toDateInput(t.endDate ?? t.end_date),
        registrationStartAt: toDateInput(t.registration_start_at ?? t.registrationStartAt),
        registrationEndAt: toDateInput(t.registration_end_at ?? t.registrationEndAt),
        venueName: t.venue_name ?? t.venueName ?? "",
        venueAddress: t.venue_address ?? t.venueAddress ?? "",
        city: t.city ?? "",
        places: (t.places as PlaceInfo[]) ?? [],
      });

      // 경기 설정
      setGameTime(t.game_time ?? t.gameTime ?? "");
      setGameBall(t.game_ball ?? t.gameBall ?? "");
      setGameMethod(t.game_method ?? t.gameMethod ?? "");

      // 접수 설정
      setRegistration({
        categories: t.categories ?? {},
        divCaps: t.div_caps ?? t.divCaps ?? {},
        divFees: t.div_fees ?? t.divFees ?? {},
        allowWaitingList: t.allow_waiting_list ?? t.allowWaitingList ?? false,
        waitingListCap: String(t.waiting_list_cap ?? t.waitingListCap ?? ""),
        entryFee: String(Number(t.entry_fee ?? t.entryFee ?? 0)),
        bankName: t.bank_name ?? t.bankName ?? "",
        bankAccount: t.bank_account ?? t.bankAccount ?? "",
        bankHolder: t.bank_holder ?? t.bankHolder ?? "",
        feeNotes: t.fee_notes ?? t.feeNotes ?? "",
      });

      // 팀 설정
      setTeamSettings({
        maxTeams: String(t.maxTeams ?? t.max_teams ?? 16),
        teamSize: String(t.team_size ?? t.teamSize ?? 5),
        rosterMin: String(t.roster_min ?? t.rosterMin ?? 5),
        rosterMax: String(t.roster_max ?? t.rosterMax ?? 12),
        autoApproveTeams: t.auto_approve_teams ?? t.autoApproveTeams ?? false,
        autoCalcMaxTeams: false,
      });

      // 2026-05-13 UI-4 — 디자인 5종 복원 제거 (사이트 설정은 /site 단일 source)

      // 문의 연락처 (settings JSON에서 읽기)
      const settings = (t.settings ?? {}) as Record<string, unknown>;
      setRawSettings(settings);
      setContactPhone((settings.contact_phone as string) ?? "");

      // 시리즈 연결 초기값 — apiSuccess 응답이 snake_case 변환되므로 series_id 키 우선,
      // 폴백으로 seriesId (혹시 변환 누락) 도 검사. null 이면 미연결.
      const initialSeriesId = (t.series_id ?? t.seriesId ?? null) as string | number | bigint | null;
      setSeriesId(
        initialSeriesId === null || initialSeriesId === undefined
          ? null
          : String(initialSeriesId),
      );

      // 2026-05-13 UI-3 — settings.bracket 복원 로직 제거.
      //   기존 settings.bracket 키는 rawSettings 안에 그대로 유지(머지)되므로 데이터 손실 없음.
      //   wizard 가 더 이상 settings.bracket 을 노출/수정하지 않음. /divisions 페이지가 단일 source.
    } catch {
      setError("대회 정보를 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadTournament();
  }, [loadTournament]);

  // 본인 보유 시리즈 목록 로드 — 드롭다운 옵션 (2026-05-12 PR2).
  // 이유: wizard 진입 시 1회만 호출, 변경 없음. 실패해도 wizard 자체는 계속 사용 가능 (드롭다운만 빈 상태).
  useEffect(() => {
    let cancelled = false;
    async function loadSeries() {
      try {
        const res = await fetch("/api/web/series/my");
        if (!res.ok) {
          // 401/500 등 — 드롭다운 비활성 상태로 두고 wizard 진행은 허용.
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
    loadSeries();
    return () => {
      cancelled = true;
    };
  }, []);

  // 2026-05-13 UI-1.2 — 본인 owner/admin 단체 목록 로드 (인라인 시리즈 생성 폼용).
  // 이유: 시리즈 생성 시 단체 선택 dropdown 옵션 필요. GET /api/web/organizations 응답에서
  //   myRole 이 owner/admin 인 항목만 통과 (서버 POST 가 다시 검증하므로 클라이언트는 UX 만 책임).
  useEffect(() => {
    let cancelled = false;
    async function loadOrgs() {
      try {
        const res = await fetch("/api/web/organizations");
        if (!res.ok) return;
        const json = await res.json();
        const list = (json.data?.organizations ?? json.organizations ?? []) as Array<{
          id: string;
          name: string;
          // GET 응답 키는 myRole — apiSuccess 가 camelCase → snake_case 변환하지만 본 키는 단일 단어 my_role.
          // 안전하게 두 경로 모두 검사.
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
        // 실패해도 wizard 자체는 계속 사용 가능 — 단체 dropdown 만 안 보임 (개인 시리즈로 생성 가능).
      }
    }
    loadOrgs();
    return () => {
      cancelled = true;
    };
  }, []);

  // 인라인 폼에서 시리즈 생성 성공 시 — seriesOptions 갱신 + 자동 선택 + 폼 닫기.
  function handleSeriesCreated(created: CreatedSeries) {
    setSeriesOptions((prev) => [created, ...prev]);
    setSeriesId(created.id);
    setShowSeriesForm(false);
  }

  // 2026-05-13 UI-3 — format 동기화 useEffect 제거 (format/bracketSettings state 자체 제거됨)

  // 시리즈 드롭다운 status 가드 (2026-05-12 PR2)
  // 이유: 진행 중/종료된 대회는 시리즈 "변경" 금지 (PR1 API status 가드와 동일).
  //   다만 "분리(null)" 는 항상 허용 — UI 에서는 변경 자체를 disabled 하고,
  //   사용자가 분리를 원하면 안내 텍스트로 "현재 대회 상태 변경 후 시도" 안내.
  //   (분리만 활성화는 후순위 — 본 PR 은 단순 disabled 처리.)
  const seriesEditAllowed = status === "draft" || status === "registration_open" || status === "registration";

  // 드롭다운 변경 시 confirm 모달용 state.
  const [pendingSeriesChange, setPendingSeriesChange] = useState<{
    newSeriesId: string | null;
    message: string;
  } | null>(null);

  // 드롭다운 onChange 핸들러 — 즉시 반영 X, 모달 띄워 확인 후 반영.
  function handleSeriesChange(rawValue: string) {
    // value="" → null(분리), value="<id>" → 연결
    const newId: string | null = rawValue === "" ? null : rawValue;

    // 변경 없음 → 모달 skip
    if (newId === seriesId) return;

    // 메시지 동적 분기 (사용자 결재 §confirm 모달 룰):
    //   - 시리즈 → 시리즈: "선택한 시리즈가 'X 단체'에 속해 있어요. 'X 단체' events 탭에 노출됩니다."
    //   - 시리즈 → null: "현재 'X 단체' events 탭에서 사라집니다."
    //   - null → 시리즈: "'X 단체' events 탭에 노출됩니다."
    const currentOption = seriesId ? seriesOptions.find((s) => s.id === seriesId) : null;
    const newOption = newId ? seriesOptions.find((s) => s.id === newId) : null;
    const currentOrgName = currentOption?.organization?.name;
    const newOrgName = newOption?.organization?.name;

    let message = "";
    if (newId === null) {
      // 분리
      if (currentOrgName) {
        message = `현재 '${currentOrgName}' events 탭에서 사라집니다. 진행하시겠어요?`;
      } else {
        message = "이 대회를 시리즈에서 분리합니다. 진행하시겠어요?";
      }
    } else if (seriesId === null) {
      // 신규 연결
      if (newOrgName) {
        message = `'${newOrgName}' events 탭에 노출됩니다. 진행하시겠어요?`;
      } else {
        message = `선택한 시리즈 '${newOption?.name}' 에 연결합니다 (단체 미연결). 진행하시겠어요?`;
      }
    } else {
      // 시리즈 → 시리즈
      if (newOrgName) {
        message = `선택한 시리즈가 '${newOrgName}' 에 속해 있어요. '${newOrgName}' events 탭에 노출됩니다. 진행하시겠어요?`;
      } else {
        message = `선택한 시리즈 '${newOption?.name}' 으로 이동합니다 (단체 미연결). 진행하시겠어요?`;
      }
    }

    setPendingSeriesChange({ newSeriesId: newId, message });
  }

  // confirm 모달 확정 → state 반영 (실제 PATCH 는 wizard 최종 저장 시).
  function confirmSeriesChange() {
    if (pendingSeriesChange) {
      setSeriesId(pendingSeriesChange.newSeriesId);
    }
    setPendingSeriesChange(null);
  }

  // 다음 단계 이동 — Step 0에서 대회명 필수 검증
  function goNext() {
    if (currentStep === 0 && !name.trim()) {
      setError("대회 이름을 입력하세요.");
      return;
    }
    setError(null);
    setCurrentStep(currentStep + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 대회 저장 API 호출 — PATCH
  async function handleSave() {
    setSaving(true);
    setError(null);

    const effectiveMaxTeams =
      teamSettings.autoCalcMaxTeams && totalDivCaps > 0
        ? totalDivCaps
        : Number(teamSettings.maxTeams) || 16;

    try {
      const res = await fetch(`/api/web/tournaments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // 2026-05-13 UI-3 — format 키 제거 (운영 방식은 /divisions 단일 source)
          // 2026-05-13 UI-4 — is_public 키 제거 (사이트 공개여부는 /site 단일 source)
          name,
          status,
          // 시리즈 연결 (2026-05-12 PR2) — null=분리, "8"=연결.
          // PR1 API 는 series_id 키 (snake_case) 그대로 받음 + 카운터 동기화/$transaction 처리.
          series_id: seriesId,
          description: description || null,
          organizer: organizer || null,
          host: host || null,
          sponsors: sponsors || null,
          gender: gender || null,
          rules: rules || null,
          prize_info: prizeInfo || null,
          // 일정
          startDate: schedule.startDate || null,
          endDate: schedule.endDate || null,
          registration_start_at: schedule.registrationStartAt || null,
          registration_end_at: schedule.registrationEndAt || null,
          // 장소
          venue_name: schedule.venueName || null,
          venue_address: schedule.venueAddress || null,
          city: schedule.city || null,
          places: schedule.places.length > 0 ? schedule.places : null,
          // 경기 설정
          game_time: gameTime || null,
          game_ball: gameBall || null,
          game_method: gameMethod || null,
          // 접수 설정
          categories: registration.categories,
          div_caps: registration.divCaps,
          div_fees: registration.divFees,
          allow_waiting_list: registration.allowWaitingList,
          waiting_list_cap: registration.waitingListCap ? Number(registration.waitingListCap) : null,
          entry_fee: Number(registration.entryFee) || 0,
          bank_name: registration.bankName || null,
          bank_account: registration.bankAccount || null,
          bank_holder: registration.bankHolder || null,
          fee_notes: registration.feeNotes || null,
          // 팀 설정
          maxTeams: effectiveMaxTeams,
          team_size: Number(teamSettings.teamSize) || 5,
          roster_min: Number(teamSettings.rosterMin) || 5,
          roster_max: Number(teamSettings.rosterMax) || 12,
          auto_approve_teams: teamSettings.autoApproveTeams,
          // 2026-05-13 UI-4 — 디자인 5종 (design_template / logo_url / banner_url / primary_color / secondary_color) 박제 제거.
          //   사이트 설정은 /site 페이지 단일 source.
          // settings JSON — 기존 값(rawSettings) 보존 + 문의 연락처만 갱신.
          //   2026-05-13 UI-3 — settings.bracket 박제 제거. 기존 키는 rawSettings 안에 보존되므로
          //   /divisions 페이지 또는 별도 경로가 유일한 갱신 통로.
          settings: {
            ...rawSettings,
            contact_phone: contactPhone || null,
          },
        }),
      });

      if (res.ok) {
        router.push(`/tournament-admin/tournaments/${id}`);
      } else {
        const err = await res.json();
        setError(err.error ?? "저장에 실패했습니다.");
        setSaving(false);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
      setSaving(false);
    }
  }

  // 로딩 상태
  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="text-[var(--color-text-muted)]">불러오는 중...</div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* === 헤더: 뒤로가기 + 타이틀 === */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push(`/tournament-admin/tournaments/${id}`)}
          className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
        >
          <span className="material-symbols-outlined text-base align-middle">arrow_back</span>
          대회 관리
        </button>
      </div>
      <h1 className="mb-6 text-xl font-bold sm:text-2xl">대회 설정</h1>

      {/* === 3단계 탭 인디케이터 (생성 위자드와 동일) === */}
      <div className="mb-6 flex gap-2">
        {STEPS.map((step, i) => (
          <button
            key={step.key}
            onClick={() => {
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
                  ? "cursor-pointer bg-[rgba(74,222,128,0.15)] text-[var(--color-success)]"
                  : "cursor-not-allowed bg-[var(--color-elevated)] text-[var(--color-text-muted)]"
            }`}
          >
            <span className="material-symbols-outlined text-lg">
              {i < currentStep ? "check_circle" : step.icon}
            </span>
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
       * ================================================================ */}
      {currentStep === 0 && (
        <div className="space-y-4">
          {/* --- 섹션 1: 기본 정보 --- */}
          <TossCard className="space-y-4 hover:scale-100">
            <SectionTitle icon="edit_note">기본 정보</SectionTitle>

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

            {/* 상태 — 편집에서만 있는 필드 */}
            <div>
              <label className={labelCls}>상태</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className={inputCls}
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/*
              소속 시리즈 (2026-05-12 PR2)
              - 운영자 본인 시리즈 목록에서 선택 / 미연결 옵션 포함
              - 라벨 형식: "시리즈명 (단체명)" — 단체 미연결 시리즈는 "(단체 미연결)"
              - status 가 in_progress/completed 면 disabled + 안내 텍스트 ("진행 중인 대회는 분리만 가능")
              - 변경 시 confirm 모달 → 확정 후 state 반영, PATCH 는 wizard 저장 시점에 일괄 호출
            */}
            <div>
              <label className={labelCls}>소속 시리즈</label>
              <select
                value={seriesId ?? ""}
                onChange={(e) => handleSeriesChange(e.target.value)}
                className={inputCls}
                disabled={!seriesEditAllowed || !seriesLoaded}
              >
                <option value="">— 미연결 —</option>
                {seriesOptions.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.organization?.name ?? "단체 미연결"})
                  </option>
                ))}
              </select>
              {!seriesEditAllowed && (
                <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                  진행 중인 대회는 분리만 가능합니다 (현재 상태 변경 후 재시도).
                </p>
              )}
              {/* 2026-05-13 UI-1.2 — 빈 상태에서 wizard 안에서 즉석 시리즈 생성 가능.
                  편집 가능한 status (draft/registration) 일 때만 노출. */}
              {seriesEditAllowed && seriesOptions.length === 0 && seriesLoaded && !showSeriesForm && (
                <div className="mt-2">
                  <p className="mb-2 text-xs text-[var(--color-text-muted)]">
                    아직 보유한 시리즈가 없습니다.
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowSeriesForm(true)}
                    className="inline-flex items-center gap-1 rounded-[4px] border border-[var(--color-border)] px-3 py-1.5 text-sm text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
                  >
                    <span className="material-symbols-outlined text-base">add</span>
                    새 시리즈 만들기
                  </button>
                </div>
              )}

              {/* 인라인 시리즈 생성 폼 — 시리즈가 이미 있어도 새로 만들 수 있도록 별도 노출 가능.
                  단 빈 상태가 아니면 dropdown 옆 작은 트리거 (아래 분기) 로 표시. */}
              {seriesEditAllowed && seriesOptions.length > 0 && seriesLoaded && !showSeriesForm && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={() => setShowSeriesForm(true)}
                    className="inline-flex items-center gap-1 text-xs text-[var(--color-info)] hover:underline"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    새 시리즈 만들기
                  </button>
                </div>
              )}

              {/* InlineSeriesForm — UI-1.2 + UI-1.3 공통 컴포넌트 */}
              {seriesEditAllowed && showSeriesForm && (
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

            {/*
              2026-05-13 UI-4 — 공개 여부 토글 제거.
              사유: 사이트 공개여부(is_public) 는 /site 페이지 단일 source.
              wizard 가 박제하던 is_public 키 제거 + 안내 박스로 운영자 이동 유도.
            */}
            <div className="rounded-[4px] border border-[var(--color-info)] bg-[color-mix(in_srgb,var(--color-info)_8%,transparent)] p-3">
              <p className="mb-2 text-sm text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined align-middle text-base text-[var(--color-info)]">info</span>{" "}
                대회 공개 여부 / 서브도메인 / 배너 / 색상 등 사이트 노출 설정은 별도 페이지에서 진행합니다.
              </p>
              <Link
                href={`/tournament-admin/tournaments/${id}/site`}
                className="text-sm font-medium text-[var(--color-info)] hover:underline"
              >
                사이트 설정 페이지로 이동 →
              </Link>
            </div>
          </TossCard>

          {/* --- 섹션 2: 일정 및 장소 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="calendar_month">일정 및 장소</SectionTitle>
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
            <SectionTitle icon="sports_basketball">경기 설정</SectionTitle>

            {/*
              2026-05-13 UI-3 — 대회 방식(FORMAT select) + 대진 포맷 세부 설정(BracketSettingsForm) +
              듀얼 정합성 경고 모두 제거.
              사유: 운영 방식(format / 조 크기 / 본선 진출 팀 등) 은 종별별로 다르므로
                /divisions 페이지(division_rules.format) 단일 source 에서 박제.
                wizard 가 중복 박제하던 settings.bracket / format 컬럼 갱신 제거.
            */}
            <div className="rounded-[4px] border border-[var(--color-info)] bg-[color-mix(in_srgb,var(--color-info)_8%,transparent)] p-3">
              <p className="mb-2 text-sm text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined align-middle text-base text-[var(--color-info)]">info</span>{" "}
                종별별 운영 방식(대회 포맷 · 조 크기 · 본선 진출 팀 등)은 종별 운영 페이지에서 설정합니다.
              </p>
              <Link
                href={`/tournament-admin/tournaments/${id}/divisions`}
                className="text-sm font-medium text-[var(--color-info)] hover:underline"
              >
                종별 운영 페이지로 이동 →
              </Link>
            </div>

            {/* 경기시간 프리셋 */}
            <GameTimeInput value={gameTime} onChange={setGameTime} />

            {/* 경기구 선택 */}
            <GameBallInput value={gameBall} onChange={setGameBall} />

            {/*
              2026-05-13 UI-1.1 — 경기 룰 (비고) textarea.
              이유: 기존 GameMethodInput 컴포넌트는 FORMAT_OPTIONS 4종 pill 과 100% 중복 구조라
                wizard 의 "비고/룰" 용도와 맞지 않음. 단순 textarea 로 game_method state 활용 — 회귀 0.
              저장 흐름: state(gameMethod) → PATCH body.game_method (L518 기존 박제) → DB tournaments.game_method.
              새로고침 후 loadTournament 가 t.game_method 폴백 복원 (L257 기존).
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
            <div className="flex items-center justify-between mb-4">
              <SectionTitle icon="category">종별 / 디비전</SectionTitle>
              <button
                type="button"
                onClick={() => setShowDivisionGenerator(true)}
                className="flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-bold text-white transition-all hover:opacity-90 active:scale-95"
                style={{ backgroundColor: "var(--color-primary)" }}
              >
                <span className="material-symbols-outlined text-lg">add_circle</span>
                종별 추가
              </button>
            </div>
            <div>
              <RegistrationSettingsForm
                data={registration}
                onChange={(updates) => setRegistration((prev) => ({ ...prev, ...updates }))}
              />
            </div>
          </TossCard>

          {/* --- 섹션 2: 팀 설정 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="groups">팀 설정</SectionTitle>
            <div className="mt-4">
              <TeamSettingsForm
                data={teamSettings}
                totalDivCaps={totalDivCaps}
                onChange={(field, value) =>
                  setTeamSettings((prev) => ({ ...prev, [field]: value }))
                }
              />
            </div>
          </TossCard>

          {/* --- 섹션 3: 문의 연락처 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="call">문의 연락처</SectionTitle>
            <div className="mt-4">
              <label className={labelCls}>전화번호 (선택)</label>
              {/* 2026-05-09: PhoneInput 마이그 4순위 — 자동 하이픈 포맷 / 11자리 제한
                   onChange 시그니처: (val: string) => void (이벤트 e.target.value 추출 X) */}
              <PhoneInput
                value={contactPhone}
                onChange={setContactPhone}
                className={inputCls}
              />
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                입력하면 대회 페이지에 문의 전화 아이콘이 표시됩니다
              </p>
            </div>
          </TossCard>
        </div>
      )}

      {/* ================================================================
       * Step 3: 확인 및 저장
       * 2026-05-13 UI-4 — 디자인 카드 (템플릿/로고/배너/색상/미리보기) 통째로 제거.
       *   사이트 설정은 /site 페이지 단일 source. wizard 는 "확인 및 저장" 만 보존.
       * ================================================================ */}
      {currentStep === 2 && (
        <div className="space-y-4">
          {/* --- 사이트 설정 안내 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="palette">사이트 설정</SectionTitle>
            <div className="mt-4 rounded-[4px] border border-[var(--color-info)] bg-[color-mix(in_srgb,var(--color-info)_8%,transparent)] p-3">
              <p className="mb-2 text-sm text-[var(--color-text-secondary)]">
                <span className="material-symbols-outlined align-middle text-base text-[var(--color-info)]">info</span>{" "}
                서브도메인 · 배너 · 색상 · 로고 · 공개 여부 등 사이트 표시 설정은 별도 페이지에서 진행합니다.
              </p>
              <Link
                href={`/tournament-admin/tournaments/${id}/site`}
                className="text-sm font-medium text-[var(--color-info)] hover:underline"
              >
                사이트 설정 페이지로 이동 →
              </Link>
            </div>
          </TossCard>

          {/* --- 전체 요약 미리보기 --- */}
          <TossCard className="hover:scale-100">
            <SectionTitle icon="fact_check">입력 내용 확인</SectionTitle>

            <div className="mt-4 space-y-3 text-sm">
              {/* 기본 정보 */}
              {/* 2026-05-13 UI-3 — "형식" Row 제거 (format 컬럼은 /divisions 단일 source) */}
              <div className="rounded-md bg-[var(--color-elevated)] p-4 space-y-2">
                <p className="text-xs font-semibold text-[var(--color-text-muted)] uppercase tracking-wide">대회 정보</p>
                <Row label="대회명" value={name || "미입력"} />
                <Row label="상태" value={STATUS_OPTIONS.find((s) => s.value === status)?.label ?? status} />
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
            </div>
          </TossCard>

          {/* === 저장 버튼 (풀와이드 CTA) === 2026-05-12: admin 빨강 본문 금지 → btn--primary */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn--primary w-full disabled:opacity-50"
          >
            {saving ? "저장 중..." : "변경사항 저장"}
          </button>
        </div>
      )}

      {/* === 하단 네비게이션: 이전/다음 (마지막 단계 제외) === */}
      {currentStep < 2 && (
        <div className="mt-6 flex justify-between">
          <button
            onClick={() => {
              setCurrentStep(Math.max(0, currentStep - 1));
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            disabled={currentStep === 0}
            className="rounded-[4px] border border-[var(--color-border)] px-6 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-30"
          >
            이전
          </button>
          {/* 2026-05-12: admin 빨강 본문 금지 → btn--primary */}
          <button onClick={goNext} className="btn btn--primary">
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

      {/*
        시리즈 변경 confirm 모달 (2026-05-12 PR2)
        - 단체 events 탭 노출/제거 영향을 명시적으로 알림
        - 취소 시 드롭다운 값 변경 X (handleSeriesChange 는 setSeriesId 전에 모달만 띄움)
        - 확정 시 setSeriesId — 실제 PATCH 는 wizard 최종 저장 버튼에서
        - 디자인: var(--color-*) 토큰만, rounded-md, 44px+ 터치 영역
      */}
      {pendingSeriesChange && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          onClick={() => setPendingSeriesChange(null)}
        >
          <div
            className="w-full max-w-md rounded-md bg-[var(--color-surface)] p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-3 flex items-center gap-2 text-base font-bold text-[var(--color-text-primary)]">
              <span className="material-symbols-outlined text-lg text-[var(--color-accent)]">info</span>
              시리즈 변경 확인
            </h3>
            <p className="mb-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {pendingSeriesChange.message}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPendingSeriesChange(null)}
                className="flex-1 rounded-[4px] border border-[var(--color-border)] px-4 py-3 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)]"
              >
                취소
              </button>
              {/* 2026-05-12: admin 빨강 본문 금지 → btn--primary */}
              <button
                type="button"
                onClick={confirmSeriesChange}
                className="btn btn--primary flex-1"
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 종별 자동생성기 모달 */}
      <DivisionGeneratorModal
        open={showDivisionGenerator}
        onClose={() => setShowDivisionGenerator(false)}
        onApply={(newCategories) => {
          setRegistration((prev) => {
            const merged = { ...prev.categories };
            for (const [cat, divs] of Object.entries(newCategories)) {
              merged[cat] = [...(merged[cat] ?? []), ...divs.filter((d) => !(merged[cat] ?? []).includes(d))];
            }
            return { ...prev, categories: merged };
          });
        }}
      />
    </div>
  );
}
