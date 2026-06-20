"use client";

/**
 * TournamentJoin — Track B Phase4 참가신청 3단계 (Toss 리스킨)
 *
 * 시안: Dev/design/BDR-current/_handoff-admin-toss-P0/design-files/Apply.jsx
 * 원칙(이유):
 *  - API/Prisma 0 변경 — GET/POST /api/web/tournaments/[id]/join 그대로 재사용.
 *    클라가 보내는 POST body(teamId/category/division/uniformHome/uniformAway/
 *    managerName/managerPhone/players[]) 형태도 동일 유지 → 서버 회귀 0.
 *  - 5단계 → 3단계 축소:
 *      ① 참가팀 선택 + 정보 확인 (대표자 입력칸 폐지 → user_info 자동값 전송)
 *      ② 종별·디비전 (정원/대기 — tournament.categories 단일소스)
 *      ③ 출전 선수(로스터) + 약관 동의 2종(제출 게이트) → 제출 → 완료(입금 안내)
 *  - 부문 미설정 대회는 ② 스킵(adaptive 2단계).
 *  - 유니폼 color picker 폐지 → team.primary/secondary_color 를 uniformHome/Away 로 자동 전송.
 *  - 서류 step 폐지 / 입금안내는 완료화면(EnrollSuccessHero)으로 흡수.
 *  - MIN_PLAYERS_GUARD / ALLOW_GUEST = false 고정(클라 가드 UI 미노출).
 *    단, 서버 roster_min 가드는 존속 → 제출 실패 시 setError 표시.
 *  - snake_case 접근자 유지(my_teams/div_caps/division_counts/user_info/is_registration_open).
 *  - 본인인증 사전 redirect + 주장 가드는 기존 그대로 보존.
 *  - Toss 스킨은 .te-enroll[data-skin="toss"] 루트 스코프로 격리(_v2/tournament-enroll.css).
 *    아이콘 = lucide-react 직접 import(CDN/window.lucide 금지).
 */

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import {
  Shield,
  CheckCircle2,
  Check,
  Users,
  AlertTriangle,
} from "lucide-react";

import { EnrollStepper, type StepDef } from "./_v2/enroll-stepper";
import { EnrollSuccessHero } from "./_v2/enroll-success-hero";
// 시안 te-* + Toss .ts-* 클래스 박제 css (join 루트 스코프 self-contained)
import "./_v2/tournament-enroll.css";
import { getDisplayName } from "@/lib/utils/player-display-name";

/* ------------------------------------------------------------------ */
/*  Types — 기존과 동일 (snake_case 응답 그대로)                          */
/* ------------------------------------------------------------------ */

interface TeamMember {
  id: number;
  user_id: number;
  jersey_number: number | null;
  position: string | null;
  role: string;
  user: {
    id: number;
    name: string | null;
    nickname: string | null;
    position: string | null;
    height: number | null;
    birth_date: string | null;
  };
}

interface MyTeam {
  id: number;
  name: string;
  primary_color: string | null;
  secondary_color: string | null;
  team_members: TeamMember[];
}

interface DivisionCount {
  division: string | null;
  _count: { id: number };
}

interface TournamentInfo {
  id: string;
  name: string;
  status: string;
  categories: Record<string, string[]> | null;
  div_caps: Record<string, number> | null;
  div_fees: Record<string, number> | null;
  allow_waiting_list: boolean | null;
  entry_fee: number | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_holder: string | null;
  fee_notes: string | null;
  roster_min: number | null;
  roster_max: number | null;
  registration_end_at?: string | null;
  edition_label?: string | null;
}

interface JoinData {
  tournament: TournamentInfo;
  is_registration_open: boolean;
  my_teams: MyTeam[];
  existing_entries: { team_id: number; status: string }[];
  division_counts: DivisionCount[];
  user_info: { name: string | null; phone: string | null };
}

interface PlayerEntry {
  userId: number;
  name: string;
  jerseyNumber: number | null;
  position: string | null;
  birthDate: string;
  isElite: boolean;
  selected: boolean;
}

/* ------------------------------------------------------------------ */
/*  토글 — 추후 정책 확정용 (현재 OFF 고정)                              */
/* ------------------------------------------------------------------ */
// 시안 주석대로 출전 최소인원 가드 / 게스트 추가 = 추후 확정.
// 클라는 false 고정 → 가드 UI / 게스트 버튼 미노출. (서버 roster_min 가드는 별도 존속)
const MIN_PLAYERS_GUARD = false;
const ALLOW_GUEST = false;

/* ------------------------------------------------------------------ */
/*  유틸                                                                */
/* ------------------------------------------------------------------ */

function formatWon(n: number | null | undefined): string {
  if (!n) return "무료";
  return `₩${Number(n).toLocaleString()}`;
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function TournamentJoinPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  // step 은 1-based. 3단계(부문 있으면) / 2단계(부문 없으면) adaptive
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<JoinData | null>(null);

  // ① 팀 선택
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  // 대표자 — 입력칸 폐지. user_info 자동값을 state에 담아 POST 전송만 한다.
  const [managerName, setManagerName] = useState("");
  const [managerPhone, setManagerPhone] = useState("");

  // ② 부문/디비전
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedDivision, setSelectedDivision] = useState("");

  // ③ 유니폼 — color picker 폐지. 팀 색상 자동값을 POST 로만 전송.
  const [uniformHome, setUniformHome] = useState("#E31B23");
  const [uniformAway, setUniformAway] = useState("#FFFFFF");
  const [players, setPlayers] = useState<PlayerEntry[]>([]);

  // 약관 동의 2종 — ③ 로스터 단계 하단의 제출 게이트
  const [agreeRules, setAgreeRules] = useState(false);
  const [agreeMedia, setAgreeMedia] = useState(false);

  // 완료 상태
  const [done, setDone] = useState(false);
  const [result, setResult] = useState<{
    id: number;
    status: string;
    waiting_number: number | null;
    message: string;
  } | null>(null);

  // 본인인증 사전 redirect — 진입 즉시 me fetch + 미인증이면 redirect (보존)
  const { data: me } = useSWR<{ id?: string; name_verified?: boolean } | null>(
    "/api/web/me",
    { dedupingInterval: 30000 },
  );
  useEffect(() => {
    if (me && me.id && me.name_verified === false) {
      router.push(`/onboarding/identity?returnTo=/tournaments/${id}/join`);
    }
  }, [me, router, id]);

  // 데이터 로드 — 기존과 동일 (snake_case 응답)
  useEffect(() => {
    fetch(`/api/web/tournaments/${id}/join`)
      .then((r) => r.json())
      .then((json) => {
        if (json.error) {
          setError(json.error);
        } else {
          setData(json);
          // 대표자 자동값 — user_info.name/phone 을 state 에 채워 둠(입력칸 없이 POST 전송)
          if (json.user_info) {
            setManagerName(json.user_info.name ?? "");
            setManagerPhone(json.user_info.phone ?? "");
          }
        }
        setLoading(false);
      })
      .catch(() => {
        setError("데이터를 불러오는 데 실패했습니다.");
        setLoading(false);
      });
  }, [id]);

  // 팀 선택 시 멤버 로드 + 유니폼 색상 자동 세팅(기존 로직 그대로)
  const handleTeamSelect = useCallback(
    (teamId: number) => {
      setSelectedTeamId(teamId);
      const team = data?.my_teams.find((t) => t.id === teamId);
      if (team) {
        // 유니폼 color picker 폐지 → 팀 색상 자동값. POST 에 그대로 전송된다.
        setUniformHome(team.primary_color ?? "#E31B23");
        setUniformAway(team.secondary_color ?? "#FFFFFF");
        setPlayers(
          team.team_members.map((m) => ({
            userId: m.user_id,
            name: getDisplayName(m.user, { jerseyNumber: m.jersey_number }),
            jerseyNumber: m.jersey_number,
            position: m.position ?? m.user.position ?? null,
            birthDate: m.user.birth_date
              ? new Date(m.user.birth_date)
                  .toISOString()
                  .slice(2, 10)
                  .replace(/-/g, "")
              : "",
            isElite: false,
            selected: true,
          })),
        );
      }
    },
    [data],
  );

  // 디비전 잔여석 계산 — 기존과 동일
  const getDivisionRemaining = useCallback(
    (division: string) => {
      if (!data) return null;
      const caps = data.tournament.div_caps;
      if (!caps || !caps[division]) return null;
      const cap = caps[division];
      const count =
        data.division_counts.find((d) => d.division === division)?._count.id ?? 0;
      return { cap, count, remaining: cap - count };
    },
    [data],
  );

  // 제출 — POST 그대로 (body 형태 동일 유지)
  const handleSubmit = async () => {
    if (!selectedTeamId || !data) return;

    const selectedPlayers = players.filter((p) => p.selected);

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(`/api/web/tournaments/${id}/join`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: selectedTeamId,
          category: selectedCategory || undefined,
          division: selectedDivision || undefined,
          // 유니폼 = 팀 색상 자동값 (편집칸 폐지)
          uniformHome,
          uniformAway,
          // 대표자 = user_info 자동값 (입력칸 폐지)
          managerName,
          managerPhone,
          // jerseyNumber/position 미전송 — 서버가 team_members 에서 자동 복사(single source)
          players: selectedPlayers.map((p) => ({
            userId: p.userId,
            playerName: p.name,
            birthDate: p.birthDate,
            isElite: p.isElite,
          })),
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        // 서버 roster_min 가드 등 실패 → 에러 표시 (클라 가드는 OFF)
        setError(json.error ?? "참가신청에 실패했습니다.");
      } else {
        setResult(json);
        setDone(true);
      }
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ---------------------------------------------------------------- */
  /*  Loading / Error 가드                                              */
  /* ---------------------------------------------------------------- */

  if (loading) {
    return (
      <div className="te-enroll" data-skin="toss">
        <div
          style={{
            display: "flex",
            minHeight: "50vh",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent"
            style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
          />
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="te-enroll" data-skin="toss">
        <div className="te-enroll__inner">
          <div className="ts-card" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--danger)", fontWeight: 600 }}>{error}</p>
            <button
              type="button"
              className="ts-btn ts-btn--secondary"
              style={{ marginTop: 16 }}
              onClick={() => router.back()}
            >
              돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { tournament } = data;
  const categories = (tournament.categories ?? {}) as Record<string, string[]>;
  const hasCategories = Object.keys(categories).length > 0;

  /* ---------------------------------------------------------------- */
  /*  완료 화면 (입금 안내 흡수)                                          */
  /* ---------------------------------------------------------------- */
  if (done && result) {
    return (
      <div className="te-enroll" data-skin="toss">
        <div className="te-enroll__inner">
          <EnrollSuccessHero
            result={result}
            bankName={tournament.bank_name}
            bankAccount={tournament.bank_account}
            bankHolder={tournament.bank_holder}
            feeText={formatWon(feeForSelected())}
            onMyApplications={() => router.push("/games/my-games")}
            onTournamentDetail={() => router.push(`/tournaments/${id}`)}
          />
        </div>
      </div>
    );
  }

  /* ---------------------------------------------------------------- */
  /*  Step 정의 (3단계 / 2단계 adaptive)                                */
  /* ---------------------------------------------------------------- */
  // hasCategories=true: ① 대회 확인 / ② 디비전 / ③ 로스터
  // hasCategories=false: ① 대회 확인 / ② 로스터 (부문 스킵)
  const steps: StepDef[] = hasCategories
    ? [
        { n: 1, l: "참가팀" },
        { n: 2, l: "디비전" },
        { n: 3, l: "로스터" },
      ]
    : [
        { n: 1, l: "참가팀" },
        { n: 2, l: "로스터" },
      ];

  const lastStep = steps[steps.length - 1].n;
  // 단계 → 화면 분기 (2단계 모드 보정)
  const stage: "info" | "division" | "roster" = (() => {
    if (hasCategories) {
      if (step === 1) return "info";
      if (step === 2) return "division";
      return "roster";
    }
    if (step === 1) return "info";
    return "roster";
  })();

  /* ---------------------------------------------------------------- */
  /*  파생값                                                            */
  /* ---------------------------------------------------------------- */

  const selectedTeam = data.my_teams.find((t) => t.id === selectedTeamId) ?? null;
  const selectedRosterCount = players.filter((p) => p.selected).length;

  // 디비전 목록 — tournament.categories 단일소스(admin_categories 미참조)
  const divisionList: Array<{
    key: string;
    fee: number | null;
    cap: number | null;
    count: number;
    isFull: boolean;
  }> =
    selectedCategory && categories[selectedCategory]
      ? categories[selectedCategory].map((divKey) => {
          const info = getDivisionRemaining(divKey);
          const divFees = (tournament.div_fees ?? {}) as Record<string, number>;
          const fee = divFees[divKey] ?? tournament.entry_fee ?? null;
          return {
            key: divKey,
            fee,
            cap: info?.cap ?? null,
            count: info?.count ?? 0,
            isFull: info ? info.remaining <= 0 : false,
          };
        })
      : [];

  // 선택 디비전 참가비
  function feeForSelected(): number | null {
    if (!selectedDivision) return tournament.entry_fee;
    const divFees = (tournament.div_fees ?? {}) as Record<string, number>;
    return divFees[selectedDivision] ?? tournament.entry_fee;
  }

  // 다음 버튼 활성 조건 (stage별)
  // ① info: 팀 선택 + 접수중 + 대표자 이름/연락처(서버 joinSchema min(1) 필수와 정합).
  //    user.phone 이 null 인 카카오/구글 가입자는 자동값이 빈값이라, 입력 전엔 다음 단계로 못 넘어가게 막아
  //    제출 시 422("대표자 연락처를 입력하세요") 영구 차단을 사전 차단한다.
  const canNext = (() => {
    if (stage === "info")
      return (
        !!selectedTeamId &&
        data.is_registration_open &&
        managerName.trim().length > 0 &&
        managerPhone.trim().length > 0
      );
    if (stage === "division") return !!selectedCategory && !!selectedDivision;
    return true; // roster
  })();

  // 마지막(로스터) 제출 게이트 — 약관 2종 동의 + 접수중 + (클라 최소인원 토글 OFF)
  const minOk = !MIN_PLAYERS_GUARD || selectedRosterCount >= (tournament.roster_min ?? 5);
  const canSubmit =
    !submitting &&
    data.is_registration_open &&
    agreeRules &&
    agreeMedia &&
    minOk;

  /* ---------------------------------------------------------------- */
  /*  Render                                                          */
  /* ---------------------------------------------------------------- */
  return (
    <div className="te-enroll" data-skin="toss">
      <div className="te-enroll__inner">
        {/* 헤더 */}
        <div className="ts-ph" style={{ marginBottom: 18 }}>
          <div className="ts-ph__eyebrow">대회 참가신청</div>
          <h1 className="ts-ph__title">{tournament.name}</h1>
          <p className="ts-ph__sub">
            가입된 팀 로스터에서 출전 선수를 선택합니다. 팀 정보는 자동으로
            채워집니다.
          </p>
        </div>

        <div className="ts-card">
          {/* StepDots */}
          <EnrollStepper steps={steps} current={step} />

          {/* 접수 불가 안내 */}
          {!data.is_registration_open && (
            <div
              className="ts-badge ts-badge--danger"
              style={{ marginBottom: 16, display: "block", padding: "10px 14px" }}
            >
              현재 접수 기간이 아닙니다. (안내용 화면)
            </div>
          )}

          {/* 에러 */}
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--danger-weak)",
                color: "var(--danger)",
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}

          {/* ============= ① 참가팀 선택 + 정보 확인 ============= */}
          {stage === "info" && (
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>
                참가할 팀을 선택하세요
              </h2>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--ink-mute)",
                  marginBottom: 18,
                }}
              >
                가입된 팀에서 선택하면 팀 정보가 자동으로 채워집니다.
              </p>

              {data.my_teams.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    fontSize: 13.5,
                    color: "var(--ink-mute)",
                    padding: "24px 0",
                  }}
                >
                  <p style={{ margin: 0 }}>주장으로 등록된 팀이 없습니다.</p>
                  <button
                    type="button"
                    className="ts-btn ts-btn--secondary ts-btn--sm"
                    style={{ marginTop: 12 }}
                    onClick={() => router.push("/teams")}
                  >
                    팀 만들기
                  </button>
                </div>
              ) : (
                <div
                  style={{ display: "flex", flexDirection: "column", gap: 10 }}
                >
                  {data.my_teams.map((team) => {
                    const alreadyApplied = data.existing_entries.some(
                      (e) => e.team_id === team.id,
                    );
                    const isSelected = selectedTeamId === team.id;
                    return (
                      <button
                        key={team.id}
                        type="button"
                        className="ts-selrow"
                        data-on={isSelected ? "true" : "false"}
                        disabled={alreadyApplied}
                        onClick={() => handleTeamSelect(team.id)}
                      >
                        {/* 팀 색상 타일 + shield 아이콘 */}
                        <span
                          style={{
                            width: 46,
                            height: 46,
                            borderRadius: 14,
                            background:
                              team.primary_color ?? "var(--primary)",
                            border: "2px solid var(--border)",
                            display: "grid",
                            placeItems: "center",
                            flex: "0 0 auto",
                          }}
                        >
                          <Shield
                            size={22}
                            color={
                              team.primary_color === "#FFFFFF"
                                ? "var(--ink-dim)"
                                : "#fff"
                            }
                          />
                        </span>
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              display: "block",
                              fontWeight: 800,
                              fontSize: 16,
                              color: "var(--ink)",
                            }}
                          >
                            {team.name}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: 13,
                              color: "var(--ink-mute)",
                              marginTop: 3,
                            }}
                          >
                            로스터 {team.team_members.length}명
                            {alreadyApplied && " · 이미 신청됨"}
                          </span>
                        </span>
                        {isSelected && (
                          <CheckCircle2 size={22} color="var(--primary)" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 팀 정보 확인 — 선택 후 표시만(대표자 입력칸 폐지) */}
              {selectedTeam && (
                <div
                  className="ts-card ts-card--flat"
                  style={{ marginTop: 16, padding: 18 }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--ink-soft)",
                      marginBottom: 8,
                    }}
                  >
                    팀 정보 확인
                  </div>
                  <div className="ts-inforow">
                    <span className="ts-inforow__label">팀명</span>
                    <span className="ts-inforow__value">{selectedTeam.name}</span>
                  </div>
                  {/* 대표자 — user_info 값이 있으면 표시만, 비어있으면(카카오/구글 가입자 등)
                      편집 입력칸 노출. 서버 joinSchema 가 managerName/Phone min(1) 필수라
                      빈값으로 제출하면 422 영구 차단되므로 직접 채울 UI 를 반드시 제공한다. */}
                  <div className="ts-inforow">
                    <span className="ts-inforow__label">대표자</span>
                    {managerName.trim().length > 0 ? (
                      <span className="ts-inforow__value">{managerName}</span>
                    ) : (
                      <input
                        type="text"
                        value={managerName}
                        onChange={(e) => setManagerName(e.target.value)}
                        placeholder="대표자 이름"
                        style={{
                          flex: 1,
                          maxWidth: 220,
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "var(--bg-elev)",
                          color: "var(--ink)",
                          fontSize: 14,
                          fontWeight: 600,
                          textAlign: "right",
                        }}
                      />
                    )}
                  </div>
                  <div className="ts-inforow">
                    <span className="ts-inforow__label">연락처</span>
                    {managerPhone.trim().length > 0 ? (
                      <span className="ts-inforow__value">{managerPhone}</span>
                    ) : (
                      <input
                        type="tel"
                        value={managerPhone}
                        onChange={(e) => setManagerPhone(e.target.value)}
                        placeholder="예: 010-1234-5678"
                        style={{
                          flex: 1,
                          maxWidth: 220,
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                          background: "var(--bg-elev)",
                          color: "var(--ink)",
                          fontSize: 14,
                          fontWeight: 600,
                          textAlign: "right",
                        }}
                      />
                    )}
                  </div>
                  <div className="ts-inforow">
                    <span className="ts-inforow__label">유니폼</span>
                    <span style={{ display: "flex", gap: 6 }}>
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: uniformHome,
                          border: "1px solid var(--border)",
                        }}
                      />
                      <span
                        style={{
                          width: 22,
                          height: 22,
                          borderRadius: 6,
                          background: uniformAway,
                          border: "1px solid var(--border)",
                        }}
                      />
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============= ② 종별·디비전 ============= */}
          {stage === "division" && (
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>
                종별·디비전을 선택하세요
              </h2>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--ink-mute)",
                  marginBottom: 18,
                }}
              >
                디비전별 모집 정원을 확인하세요. 정원 초과 시 대기 접수됩니다.
              </p>

              {/* 종별 칩 */}
              <div style={{ marginBottom: 18 }}>
                <div className="ts-field__label">종별</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {Object.keys(categories).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className="ts-chip"
                      data-active={selectedCategory === cat ? "true" : "false"}
                      onClick={() => {
                        setSelectedCategory(cat);
                        setSelectedDivision("");
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* 디비전 카드 (모집정원) */}
              {selectedCategory && (
                <div>
                  <div className="ts-field__label">디비전 (모집정원)</div>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 8,
                    }}
                  >
                    {divisionList.length === 0 && (
                      <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
                        모집 디비전이 없습니다.
                      </div>
                    )}
                    {divisionList.map((d) => {
                      const isSel = selectedDivision === d.key;
                      // 만석이지만 대기접수 허용이면 선택 가능(대기), 불허면 차단
                      const blocked = d.isFull && !tournament.allow_waiting_list;
                      return (
                        <button
                          key={d.key}
                          type="button"
                          className="ts-selrow"
                          data-on={isSel ? "true" : "false"}
                          data-warn={d.isFull ? "true" : "false"}
                          disabled={blocked}
                          onClick={() => setSelectedDivision(d.key)}
                          style={{ justifyContent: "space-between" }}
                        >
                          <span
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              style={{
                                fontWeight: 800,
                                fontSize: 15,
                                color: "var(--ink)",
                              }}
                            >
                              {d.key}
                            </span>
                            {d.isFull && (
                              <span className="ts-badge ts-badge--warn">
                                {tournament.allow_waiting_list
                                  ? "대기접수"
                                  : "마감"}
                              </span>
                            )}
                          </span>
                          <span style={{ textAlign: "right" }}>
                            <span
                              style={{
                                display: "block",
                                fontSize: 13,
                                fontWeight: 700,
                                color: d.isFull
                                  ? "var(--warn)"
                                  : "var(--ink-mute)",
                              }}
                            >
                              {d.cap !== null
                                ? `${d.count}/${d.cap}팀`
                                : "정원 미정"}
                            </span>
                            <span
                              style={{
                                display: "block",
                                fontSize: 12,
                                color: "var(--ink-dim)",
                                marginTop: 2,
                              }}
                            >
                              {d.fee ? `₩${d.fee.toLocaleString()}` : "무료"}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============= ③ 출전 선수(로스터) + 약관 동의 ============= */}
          {stage === "roster" && (
            <div>
              <h2 style={{ fontSize: 19, fontWeight: 800, marginBottom: 4 }}>
                출전 선수를 선택하세요
              </h2>
              <p
                style={{
                  fontSize: 13.5,
                  color: "var(--ink-mute)",
                  marginBottom: 16,
                }}
              >
                {selectedTeam?.name ?? "팀"} 로스터에서 이번 대회 출전 선수를
                선택합니다. 선수 정보는 이미 등록되어 있어요.
              </p>

              {/* 선택 수 + 전체 선택 토글 */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 12,
                }}
              >
                <span
                  className={
                    selectedRosterCount > 0
                      ? "ts-badge ts-badge--primary"
                      : "ts-badge ts-badge--grey"
                  }
                >
                  {selectedRosterCount}명 선택
                </span>
                <button
                  type="button"
                  className="ts-btn ts-btn--ghost ts-btn--sm"
                  onClick={() => {
                    const allSelected =
                      players.length > 0 &&
                      players.every((p) => p.selected);
                    setPlayers((prev) =>
                      prev.map((p) => ({ ...p, selected: !allSelected })),
                    );
                  }}
                >
                  {players.length > 0 && players.every((p) => p.selected)
                    ? "전체 해제"
                    : "전체 선택"}
                </button>
              </div>

              {players.length === 0 ? (
                <p
                  style={{
                    textAlign: "center",
                    fontSize: 13.5,
                    color: "var(--ink-mute)",
                    padding: "20px 0",
                  }}
                >
                  팀 멤버가 없습니다. 먼저 팀을 선택하세요.
                </p>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {players.map((p, idx) => {
                    const on = p.selected;
                    return (
                      <button
                        key={p.userId}
                        type="button"
                        className="ts-selrow"
                        data-on={on ? "true" : "false"}
                        onClick={() => {
                          setPlayers((prev) =>
                            prev.map((pp, i) =>
                              i === idx
                                ? { ...pp, selected: !pp.selected }
                                : pp,
                            ),
                          );
                        }}
                      >
                        {/* 체크 */}
                        <span className="ts-check" data-on={on ? "true" : "false"}>
                          {on && <Check size={15} />}
                        </span>
                        {/* 등번호 */}
                        <span
                          style={{
                            width: 30,
                            textAlign: "center",
                            fontFamily: "var(--ff-mono)",
                            fontWeight: 800,
                            fontSize: 15,
                            color: on ? "var(--primary)" : "var(--ink-mute)",
                          }}
                        >
                          {p.jerseyNumber ?? "—"}
                        </span>
                        <span style={{ flex: 1 }}>
                          <span
                            style={{
                              fontWeight: 700,
                              fontSize: 15,
                              color: "var(--ink)",
                            }}
                          >
                            {p.name}
                          </span>
                          {p.position && (
                            <span
                              style={{
                                fontSize: 12.5,
                                color: "var(--ink-mute)",
                                marginLeft: 8,
                              }}
                            >
                              {p.position}
                            </span>
                          )}
                        </span>
                        {/* 선출 토글 (배지 클릭) */}
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => {
                            // 카드 선택과 분리 — 선출 토글만
                            e.stopPropagation();
                            setPlayers((prev) =>
                              prev.map((pp, i) =>
                                i === idx
                                  ? { ...pp, isElite: !pp.isElite }
                                  : pp,
                              ),
                            );
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.stopPropagation();
                              e.preventDefault();
                              setPlayers((prev) =>
                                prev.map((pp, i) =>
                                  i === idx
                                    ? { ...pp, isElite: !pp.isElite }
                                    : pp,
                                ),
                              );
                            }
                          }}
                          className={
                            p.isElite
                              ? "ts-badge ts-badge--danger"
                              : "ts-badge ts-badge--grey"
                          }
                          style={{ cursor: "pointer" }}
                        >
                          선출
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* 게스트 추가 — ALLOW_GUEST OFF 고정으로 미노출 */}
              {ALLOW_GUEST && (
                <button
                  type="button"
                  className="ts-btn ts-btn--secondary ts-btn--block"
                  style={{ marginTop: 10 }}
                >
                  <Users size={16} /> 게스트 선수 추가
                </button>
              )}

              {/* 서버 roster_min 가드 안내 — 클라 가드(MIN_PLAYERS_GUARD) OFF지만
                  제출 실패를 줄이기 위한 안내만 표시(차단 X) */}
              <p
                style={{
                  fontSize: 11.5,
                  color: "var(--ink-dim)",
                  marginTop: 12,
                  lineHeight: 1.5,
                }}
              >
                ※ 출전 최소 인원·게스트(팀원 외) 추가 정책은 추후 확정됩니다.
                {tournament.roster_min
                  ? ` 현재 최소 ${tournament.roster_min}명 등록이 필요합니다.`
                  : ""}
              </p>

              {/* 약관 동의 2종 — 제출 게이트(동의 없이 제출 차단) */}
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                }}
              >
                <label className="ts-agree">
                  <input
                    type="checkbox"
                    checked={agreeRules}
                    onChange={(e) => setAgreeRules(e.target.checked)}
                  />
                  <span>대회 규정·환불 정책에 동의합니다</span>
                </label>
                <label className="ts-agree">
                  <input
                    type="checkbox"
                    checked={agreeMedia}
                    onChange={(e) => setAgreeMedia(e.target.checked)}
                  />
                  <span>경기 촬영·중계·사진 공개에 동의합니다</span>
                </label>
              </div>

              {/* 최소인원 미달 경고 — MIN_PLAYERS_GUARD ON일 때만(현재 OFF) */}
              {MIN_PLAYERS_GUARD && !minOk && (
                <div
                  style={{
                    marginTop: 12,
                    padding: "10px 14px",
                    background: "var(--warn-weak)",
                    color: "var(--warn)",
                    borderRadius: 12,
                    fontSize: 12.5,
                    fontWeight: 600,
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                  }}
                >
                  <AlertTriangle size={15} />
                  최소 {tournament.roster_min ?? 5}명을 선택해야 접수가
                  가능합니다.
                </div>
              )}
            </div>
          )}

          {/* ---------- 하단 네비게이션 ---------- */}
          <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
            <button
              type="button"
              className="ts-btn ts-btn--secondary"
              style={{ flex: 1 }}
              onClick={() => {
                if (step > 1) {
                  setError(null);
                  setStep(step - 1);
                } else {
                  router.back();
                }
              }}
            >
              {step > 1 ? "이전" : "취소"}
            </button>

            {step < lastStep ? (
              <button
                type="button"
                className="ts-btn ts-btn--primary"
                style={{ flex: 2 }}
                disabled={!canNext}
                onClick={() => {
                  setError(null);
                  setStep(step + 1);
                }}
              >
                다음
              </button>
            ) : (
              <button
                type="button"
                className="ts-btn ts-btn--primary"
                style={{ flex: 2 }}
                disabled={!canSubmit}
                onClick={handleSubmit}
              >
                {submitting
                  ? "제출 중…"
                  : `신청서 제출 · ${formatWon(feeForSelected())}`}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
