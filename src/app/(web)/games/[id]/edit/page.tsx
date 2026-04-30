"use client";

/* ============================================================
 * GameEditPage — /games/[id]/edit (BDR v2.2 P0-2 박제)
 *
 * 시안 출처: Dev/design/BDR v2.2/screens/GameEdit.jsx
 *
 * Why: 본인 호스트 경기 수정 (날짜·코트·인원·회비·모집 조건)
 * Pattern: CreateGame v2 의 3카드 분할 (정보/조건/고급) + prefill + edge case
 *
 * 진입: /games/[id] '경기 수정' 버튼 (호스트 본인일 때만 노출)
 * 복귀: 저장/취소 → /games/[id]
 *
 * Edge cases (시안 §5-2-2 정확히):
 *   - 호스트 아님            → noPermission view (서버 PATCH 403도 동시 가드)
 *   - gameStatus === 종료/완료 → noEdit view (`/games/[id]/report` 진입 링크)
 *   - applicantCount === 0   → 모든 필드 편집 가능
 *   - applicantCount >= 1    → 인원·회비·날짜 잠금 + 안내 배너
 *   - 경기 시작 < 24시간      → "취소만 가능" + danger 카드 (저장 비활성)
 *
 * 회귀 검수 매트릭스:
 *   기능              | v1 | v2.2                  | 진입점         | 모바일
 *   기본 정보 수정    | ✅ | ✅ prefill + 잠금       | host btn      | 1열
 *   신청 조건 수정    | ✅ | ✅ checkbox 그룹        | host btn      | 2→1열
 *   경기 취소         | ✅ | ✅ 위험 액션 카드       | host btn      | OK
 *   호스트 권한 체크  | -  | ✅ noPermission view    | -             | OK
 *   applicantCount 잠금 | - | ✅ 안내 배너            | applicantCount≥1 | OK
 *   24h 이내          | -  | ✅ '취소만 가능' danger | <24h          | OK
 *   finished noEdit   | -  | ✅ noEdit view          | finished      | -
 *
 * 데이터/API 가드 0 변경 (GET 응답에 current_participants 1필드만 추가):
 *   - GET /api/web/games/[id] (mount 시 1회)
 *   - PATCH /api/web/games/[id] (submit 시) — 서버에서도 status·organizer 가드
 *   - DELETE /api/web/games/[id] (취소 액션) — 서버에서 호스트 검증
 * ============================================================ */

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

// 경기 데이터 타입 (API 응답 기반)
// 신규 필드 current_participants 추가 — 잠금 배너용
interface GameData {
  id: string;
  uuid: string;
  title: string | null;
  description: string | null;
  game_type: number;
  status: number;
  city: string | null;
  district: string | null;
  venue_name: string | null;
  venue_address: string | null;
  scheduled_at: string | null;
  duration_hours: number | null;
  max_participants: number | null;
  min_participants: number | null;
  fee_per_person: number | null;
  skill_level: string | null;
  requirements: string | null;
  notes: string | null;
  contact_phone: string | null;
  organizer_id: string;
  // BDR v2.2 P0-2: 잠금 배너에 사용할 신청자/참가자 수
  current_participants: number;
}

// 실력 수준 옵션 — 기존 4단계 그대로 유지 (edit이 다루는 값 범위 보존)
const SKILL_OPTIONS = [
  { value: "all", label: "모든 수준" },
  { value: "beginner", label: "초급" },
  { value: "intermediate", label: "중급" },
  { value: "advanced", label: "상급" },
];

// 시안 신청 조건 6개 — ConditionsSection과 동일 키워드
const CONDITION_OPTIONS = [
  "초보 환영",
  "레이팅 1400 이상",
  "여성 우대",
  "학생 우대",
  "자차 가능자",
  "프로필 공개 필수",
] as const;
type ConditionOption = (typeof CONDITION_OPTIONS)[number];

// game_type 코드 → 라벨 (read-only 칩용)
const GAME_TYPE_LABELS: Record<number, string> = {
  0: "픽업",
  1: "게스트",
  2: "스크림",
};

// requirements 문자열 → 체크박스 + 기타로 분해
function parseRequirements(raw: string): { checked: Set<ConditionOption>; extra: string } {
  const checked = new Set<ConditionOption>();
  const extras: string[] = [];
  if (!raw) return { checked, extra: "" };
  // 줄바꿈 또는 쉼표로 split
  const tokens = raw.split(/\n|,/).map((t) => t.trim()).filter(Boolean);
  for (const t of tokens) {
    if ((CONDITION_OPTIONS as readonly string[]).includes(t)) {
      checked.add(t as ConditionOption);
    } else {
      extras.push(t);
    }
  }
  return { checked, extra: extras.join("\n") };
}

// 체크박스 + 기타 → requirements 문자열로 합성 (줄바꿈 JOIN)
function buildRequirements(checked: Set<ConditionOption>, extra: string): string {
  const parts: string[] = CONDITION_OPTIONS.filter((opt) => checked.has(opt));
  const extraTrim = extra.trim();
  if (extraTrim) parts.push(extraTrim);
  return parts.join("\n");
}

// 경기 시작까지 남은 시간(시간 단위) 계산 — null/과거시간이면 null 반환
function getHoursUntilStart(scheduledAt: string | null): number | null {
  if (!scheduledAt) return null;
  const start = new Date(scheduledAt).getTime();
  if (isNaN(start)) return null;
  const diffMs = start - Date.now();
  return diffMs / (1000 * 60 * 60);
}

export default function GameEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();

  // 폼 상태
  const [game, setGame] = useState<GameData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // 권한 체크: 서버 세션을 클라에서 직접 못 보므로, fetch 후 organizer_id와 내 sub 비교
  // 단, 이 페이지에는 클라 세션 객체가 없으므로 PATCH 시 403으로 잡거나 별도 me 호출 필요
  // 실용상: 진입점이 호스트만 보이고, 서버 PATCH/DELETE 모두 403 가드 — 클라는 낙관적 진행
  const [forbidden, setForbidden] = useState(false);

  // 수정 가능한 필드 상태 — 기존 동일
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  // datetime-local 단일 값 유지 (PATCH는 ISO 변환만 함)
  const [scheduledAt, setScheduledAt] = useState("");
  const [durationHours, setDurationHours] = useState(2);
  const [maxParticipants, setMaxParticipants] = useState(10);
  const [minParticipants, setMinParticipants] = useState(4);
  const [feePerPerson, setFeePerPerson] = useState(0);
  const [skillLevel, setSkillLevel] = useState("all");
  const [venueName, setVenueName] = useState("");
  const [venueAddress, setVenueAddress] = useState("");
  // requirements를 체크박스 + 기타로 분리 관리
  const [reqChecked, setReqChecked] = useState<Set<ConditionOption>>(new Set());
  const [reqExtra, setReqExtra] = useState("");
  const [notes, setNotes] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  // 고급 설정 아코디언 토글
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // 기존 데이터 로드 — 호출/에러 처리 0 변경
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/web/games/${id}`);
        if (res.status === 404) {
          setError("존재하지 않는 경기입니다.");
          return;
        }
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        if (!res.ok) throw new Error();
        const json = await res.json();
        const data: GameData = json.data;
        setGame(data);

        // 폼 초기값 설정
        setTitle(data.title ?? "");
        setDescription(data.description ?? "");
        // ISO 날짜를 datetime-local 형식으로 변환
        if (data.scheduled_at) {
          const d = new Date(data.scheduled_at);
          const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
          setScheduledAt(local.toISOString().slice(0, 16));
        }
        setDurationHours(data.duration_hours ?? 2);
        setMaxParticipants(data.max_participants ?? 10);
        setMinParticipants(data.min_participants ?? 4);
        setFeePerPerson(data.fee_per_person ?? 0);
        setSkillLevel(data.skill_level ?? "all");
        setVenueName(data.venue_name ?? "");
        setVenueAddress(data.venue_address ?? "");
        // requirements 파싱 → 체크박스 + 기타로 분리
        const parsed = parseRequirements(data.requirements ?? "");
        setReqChecked(parsed.checked);
        setReqExtra(parsed.extra);
        setNotes(data.notes ?? "");
        setContactPhone(data.contact_phone ?? "");
      } catch {
        setError("경기 정보를 불러올 수 없습니다.");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  // 체크박스 토글
  const toggleCondition = (opt: ConditionOption) => {
    setReqChecked((prev) => {
      const next = new Set(prev);
      if (next.has(opt)) next.delete(opt);
      else next.add(opt);
      return next;
    });
  };

  // 수정 제출 핸들러 — PATCH 호출/페이로드 0 변경
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!game) return;

    // 제목 필수 검증 (기존 그대로)
    if (title.trim().length < 2) {
      alert("제목은 2자 이상 입력해주세요.");
      return;
    }

    // requirements 합성 — 체크박스 + 기타
    const requirements = buildRequirements(reqChecked, reqExtra);

    setSaving(true);
    try {
      const res = await fetch(`/api/web/games/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || null,
          // datetime-local 값을 ISO 형식으로 변환
          scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          duration_hours: durationHours,
          max_participants: maxParticipants,
          min_participants: minParticipants,
          fee_per_person: feePerPerson,
          skill_level: skillLevel,
          venue_name: venueName.trim() || null,
          venue_address: venueAddress.trim() || null,
          requirements: requirements || null,
          notes: notes.trim() || null,
          contact_phone: contactPhone.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // 403 → 호스트 권한 없음으로 view 전환
        if (res.status === 403) {
          setForbidden(true);
          return;
        }
        alert(data.message ?? "수정 중 오류가 발생했습니다.");
        return;
      }
      // 수정 성공 → 상세 페이지로 이동
      router.push(`/games/${id}`);
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  }

  // 경기 취소 핸들러 — DELETE (soft delete: status=5)
  async function handleCancelGame() {
    if (!game) return;
    // 신청자 있으면 경고 강화
    const msg =
      game.current_participants > 0
        ? `정말 경기를 취소하시겠어요?\n신청자 ${game.current_participants}명에게 자동으로 취소 알림이 전송됩니다.\n이 작업은 되돌릴 수 없습니다.`
        : "정말 경기를 취소하시겠어요?\n이 작업은 되돌릴 수 없습니다.";
    if (!confirm(msg)) return;

    setCancelling(true);
    try {
      const res = await fetch(`/api/web/games/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.message ?? "경기 취소 중 오류가 발생했습니다.");
        return;
      }
      // 취소 성공 → 상세로 (서버에서 status=5로 변경됨)
      router.push(`/games/${id}`);
      router.refresh();
    } catch {
      alert("네트워크 오류가 발생했습니다.");
    } finally {
      setCancelling(false);
    }
  }

  // ─────────────────────────────────────────────
  // 로딩 상태 — 시안 톤
  // ─────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page">
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 0", textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>불러오는 중...</span>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Edge case 1: 호스트 아님 (서버 403 또는 organizer_id 불일치)
  // 시안 §5-2-2 noPermission view
  // ─────────────────────────────────────────────
  if (forbidden) {
    return (
      <div className="page">
        <div
          className="card"
          style={{
            padding: "48px 28px",
            textAlign: "center",
            maxWidth: 520,
            margin: "40px auto",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 56, color: "var(--ink-dim)" }}
          >
            lock
          </span>
          <h2 style={{ margin: "14px 0 8px", fontSize: 20 }}>
            호스트만 수정할 수 있습니다
          </h2>
          <p
            style={{
              margin: "0 0 20px",
              color: "var(--ink-mute)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            이 경기를 개설한 호스트만 수정 권한이 있어요.
            <br />
            게스트 신청을 원하시면 상세 페이지로 돌아가 주세요.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => router.push(`/games/${id}`)}
          >
            경기 상세로
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // 에러 상태 — 시안 톤 (404/네트워크)
  // ─────────────────────────────────────────────
  if (error || !game) {
    return (
      <div className="page">
        <div
          style={{
            maxWidth: 760,
            margin: "0 auto",
            padding: "80px 0",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--bdr-red)",
              marginBottom: 16,
            }}
          >
            {error ?? "경기를 찾을 수 없습니다."}
          </p>
          <button
            type="button"
            className="btn"
            onClick={() => router.back()}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────
  // Edge case 2: 종료/완료된 경기 → noEdit view
  // status 코드: 3=종료, 4=완료, 5=취소 — 모두 수정 불가
  // 시안 §5-2-2: finished view + report 진입 링크
  // ─────────────────────────────────────────────
  const isFinished = game.status === 3 || game.status === 4;
  const isCancelled = game.status === 5;
  if (isFinished || isCancelled) {
    return (
      <div className="page">
        <div
          className="card"
          style={{
            padding: "48px 28px",
            textAlign: "center",
            maxWidth: 520,
            margin: "40px auto",
          }}
        >
          <span
            className="material-symbols-outlined"
            style={{ fontSize: 56, color: "var(--ink-dim)" }}
          >
            event_busy
          </span>
          <h2 style={{ margin: "14px 0 8px", fontSize: 20 }}>
            {isCancelled
              ? "취소된 경기는 수정할 수 없어요"
              : "종료된 경기는 수정할 수 없어요"}
          </h2>
          <p
            style={{
              margin: "0 0 20px",
              color: "var(--ink-mute)",
              fontSize: 14,
              lineHeight: 1.6,
            }}
          >
            {isCancelled
              ? "이 경기는 이미 취소되었습니다."
              : "경기가 끝나면 결과·기록만 작성할 수 있습니다."}
          </p>
          <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="btn"
              onClick={() => router.push(`/games/${id}`)}
            >
              경기 상세
            </button>
            {/* 종료(3)일 때만 평가 작성 진입점 노출 — 취소(5)는 평가 의미 없음 */}
            {isFinished && (
              <button
                type="button"
                className="btn btn--primary"
                onClick={() => router.push(`/games/${id}/report`)}
              >
                경기 결과 작성
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 현재 게임 유형 라벨 (read-only 칩)
  const kindLabel = GAME_TYPE_LABELS[game.game_type] ?? "경기";

  // ─────────────────────────────────────────────
  // Edge case 3: applicantCount >= 1 → 인원·회비·날짜 잠금 + 안내 배너
  // current_participants(games 테이블) = 호스트 제외 신청/참가 인원
  // ─────────────────────────────────────────────
  const applicantCount = game.current_participants ?? 0;
  const lockedByApplicants = applicantCount > 0;

  // ─────────────────────────────────────────────
  // Edge case 4: 경기 시작 < 24시간 → "취소만 가능" + danger 카드 (저장 비활성)
  // ─────────────────────────────────────────────
  const hoursUntilStart = getHoursUntilStart(game.scheduled_at);
  const within24h = hoursUntilStart !== null && hoursUntilStart < 24 && hoursUntilStart > 0;

  return (
    /* === v2 시안 레이아웃: page + maxWidth 760 중앙 정렬 === */
    <div className="page">
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        {/* Breadcrumb — v2 톤 */}
        <div
          style={{
            display: "flex",
            gap: 6,
            fontSize: 12,
            color: "var(--ink-mute)",
            marginBottom: 12,
            flexWrap: "wrap",
          }}
        >
          <a
            onClick={() => router.push("/games")}
            style={{ cursor: "pointer" }}
          >
            경기
          </a>
          <span>›</span>
          <a
            onClick={() => router.push(`/games/${id}`)}
            style={{ cursor: "pointer" }}
          >
            {game.title ?? "경기"}
          </a>
          <span>›</span>
          <span style={{ color: "var(--ink)" }}>수정</span>
        </div>

        {/* 헤더 — eyebrow + h1 + 보조 설명 */}
        <div style={{ marginBottom: 20 }}>
          <div className="eyebrow">EDIT · GAME</div>
          <h1
            style={{
              margin: "6px 0 4px",
              fontSize: 30,
              fontWeight: 800,
              letterSpacing: "-0.015em",
              color: "var(--ink)",
            }}
          >
            경기 수정
          </h1>
          <div style={{ fontSize: 13, color: "var(--ink-mute)" }}>
            호스트 본인만 수정할 수 있습니다
          </div>
        </div>

        {/* ── Edge case 4: 24시간 이내 → "취소만 가능" 위험 배너 (최우선) ── */}
        {within24h && (
          <div
            className="card"
            style={{
              padding: "14px 18px",
              marginBottom: 14,
              background: "color-mix(in oklab, var(--bdr-red) 12%, transparent)",
              borderColor: "var(--bdr-red)",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--bdr-red)", fontSize: 22, flexShrink: 0 }}
            >
              schedule
            </span>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <b>경기 시작까지 24시간이 남지 않았어요.</b>
              <br />
              <span style={{ color: "var(--ink-mute)" }}>
                정보 수정은 잠겨 있고, 취소만 가능합니다. 부득이한 변경이 필요하면
                경기를 취소하고 다시 개설해 주세요.
              </span>
            </div>
          </div>
        )}

        {/* ── Edge case 3: 신청자 있는 경우 잠금 배너 ── */}
        {lockedByApplicants && !within24h && (
          <div
            className="card"
            style={{
              padding: "14px 18px",
              marginBottom: 14,
              background: "color-mix(in oklab, var(--bdr-red) 8%, transparent)",
              borderColor: "var(--bdr-red)",
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <span
              className="material-symbols-outlined"
              style={{ color: "var(--bdr-red)", fontSize: 22, flexShrink: 0 }}
            >
              warning
            </span>
            <div style={{ fontSize: 13, lineHeight: 1.6 }}>
              <b>이미 {applicantCount}명이 신청했습니다.</b>
              <br />
              <span style={{ color: "var(--ink-mute)" }}>
                날짜·인원·참가비는 변경할 수 없어요. 변경이 필요하면 경기를
                취소하고 다시 개설해 주세요.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* 시안 1번 카드 — 경기 종류 (read-only 칩) */}
          <section className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                marginBottom: 14,
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
                1. 경기 종류
              </h2>
              <span style={{ fontSize: 11, color: "var(--ink-dim)" }}>
                경기 종류는 변경할 수 없습니다
              </span>
            </div>
            {/* 편집 시 game_type 변경 불가 → 현재 종류만 비활성 칩으로 표시 */}
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 16px",
                background: "var(--bg-alt)",
                border: "2px solid var(--border)",
                borderRadius: 8,
                color: "var(--ink-mute)",
                fontSize: 14,
                fontWeight: 700,
                cursor: "not-allowed",
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                lock
              </span>
              {kindLabel}
            </div>
          </section>

          {/* 시안 2번 카드 — 경기 정보 (prefill + 일부 잠금)
           * 모바일(≤600px)에서 grid 다열은 1열로 자동 축소 — 인라인 스타일은 PC 기준,
           * .input/.card 스타일과 page 내 글로벌 미디어쿼리(공통 v2 시안)에서 처리.
           * 명시적 모바일 분기를 위해 1열/2열/3열 모두 minmax(0,1fr) 사용. */}
          <section className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              2. 경기 정보
            </h2>

            {/* 제목 — 1열 풀폭 */}
            <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr)", gap: 14 }}>
              <div>
                <label className="label">
                  제목 <span style={{ color: "var(--bdr-red)", fontWeight: 600 }}>*</span>
                </label>
                <input
                  className="input"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  maxLength={100}
                  required
                  disabled={within24h}
                />
              </div>
            </div>

            {/* 일시 + 시간(소요) — 2열 (모바일에서는 자동 1열) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
                gap: 14,
                marginTop: 14,
              }}
            >
              <div>
                <label className="label">
                  경기 일시
                  {(lockedByApplicants || within24h) && (
                    <span style={{ color: "var(--bdr-red)", fontSize: 10, marginLeft: 6 }}>
                      · 잠김
                    </span>
                  )}
                </label>
                <input
                  className="input"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
                  disabled={lockedByApplicants || within24h}
                />
              </div>
              <div>
                <label className="label">경기 시간 (시간 단위)</label>
                <input
                  className="input"
                  type="number"
                  value={durationHours}
                  onChange={(e) => setDurationHours(Number(e.target.value))}
                  min={1}
                  max={12}
                  disabled={within24h}
                />
              </div>
            </div>

            {/* 코트 + 지역 — 2열 (모바일 1열) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
                gap: 14,
                marginTop: 14,
              }}
            >
              <div>
                <label className="label">코트(장소명)</label>
                <input
                  className="input"
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="미사강변체육관"
                  disabled={within24h}
                />
              </div>
              <div>
                <label className="label">주소</label>
                <input
                  className="input"
                  type="text"
                  value={venueAddress}
                  onChange={(e) => setVenueAddress(e.target.value)}
                  placeholder="경기 하남시 ..."
                  disabled={within24h}
                />
              </div>
            </div>

            {/* 수준 + 정원 + 참가비 — 3열 (모바일 1열) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(180px, 100%), 1fr))",
                gap: 14,
                marginTop: 14,
              }}
            >
              <div>
                <label className="label">수준</label>
                <select
                  className="input"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  style={{ appearance: "auto" }}
                  disabled={within24h}
                >
                  {SKILL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">
                  정원
                  {(lockedByApplicants || within24h) && (
                    <span style={{ color: "var(--bdr-red)", fontSize: 10, marginLeft: 6 }}>
                      · 잠김
                    </span>
                  )}
                </label>
                <input
                  className="input"
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  min={2}
                  max={50}
                  disabled={lockedByApplicants || within24h}
                />
              </div>
              <div>
                <label className="label">
                  참가비 (원)
                  {(lockedByApplicants || within24h) && (
                    <span style={{ color: "var(--bdr-red)", fontSize: 10, marginLeft: 6 }}>
                      · 잠김
                    </span>
                  )}
                </label>
                <input
                  className="input"
                  type="number"
                  value={feePerPerson}
                  onChange={(e) => setFeePerPerson(Number(e.target.value))}
                  min={0}
                  step={1000}
                  disabled={lockedByApplicants || within24h}
                />
              </div>
            </div>

            {/* 상세 설명 */}
            <div style={{ marginTop: 14 }}>
              <label className="label">상세 설명</label>
              <textarea
                className="textarea"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                style={{ resize: "vertical" }}
                disabled={within24h}
              />
            </div>
          </section>

          {/* 시안 3번 카드 — 신청 조건 */}
          <section className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              3. 신청 조건
            </h2>

            {/* 2열 체크박스 그리드 — 시안 동일 (모바일 자동 1열) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
                gap: 10,
              }}
            >
              {CONDITION_OPTIONS.map((opt) => {
                const isChecked = reqChecked.has(opt);
                return (
                  <label
                    key={opt}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      background: "var(--bg-alt)",
                      borderRadius: 6,
                      cursor: within24h ? "not-allowed" : "pointer",
                      border: isChecked
                        ? "1px solid var(--cafe-blue)"
                        : "1px solid transparent",
                      opacity: within24h ? 0.6 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCondition(opt)}
                      style={{ cursor: within24h ? "not-allowed" : "pointer" }}
                      disabled={within24h}
                    />
                    <span
                      style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}
                    >
                      {opt}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* 기타 조건 자유 텍스트 — 기존 데이터 보존 */}
            <div style={{ marginTop: 14 }}>
              <label className="label">
                기타 조건{" "}
                <span style={{ color: "var(--ink-dim)", fontWeight: 400 }}>(선택)</span>
              </label>
              <textarea
                className="textarea"
                rows={2}
                value={reqExtra}
                onChange={(e) => setReqExtra(e.target.value)}
                placeholder="예: 실내화 필수, 유니폼 지참"
                style={{ minHeight: 64, resize: "vertical" }}
                disabled={within24h}
              />
            </div>
          </section>

          {/* 고급 설정 — 비고 / 연락처 / 최소 인원 (DB 필드 보존) */}
          <section
            className="card"
            style={{ marginBottom: 14, overflow: "hidden" }}
          >
            <button
              type="button"
              onClick={() => setAdvancedOpen(!advancedOpen)}
              aria-expanded={advancedOpen}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "16px 26px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--ink)",
                fontSize: 16,
                fontWeight: 700,
              }}
            >
              <span>
                고급 설정{" "}
                <span style={{ fontSize: 12, color: "var(--ink-dim)", fontWeight: 400 }}>
                  (선택)
                </span>
              </span>
              <span
                className="material-symbols-outlined"
                style={{
                  fontSize: 20,
                  color: "var(--ink-mute)",
                  transition: "transform .2s",
                  transform: advancedOpen ? "rotate(180deg)" : undefined,
                }}
              >
                expand_more
              </span>
            </button>

            {advancedOpen && (
              <div style={{ borderTop: "1px solid var(--border)", padding: "18px 26px 22px" }}>
                {/* 최소 인원 + 연락처 (모바일 1열) */}
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))",
                    gap: 14,
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <label className="label">최소 인원</label>
                    <input
                      className="input"
                      type="number"
                      value={minParticipants}
                      onChange={(e) => setMinParticipants(Number(e.target.value))}
                      min={1}
                      max={50}
                      disabled={within24h}
                    />
                  </div>
                  <div>
                    <label className="label">연락처</label>
                    <input
                      className="input"
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="010-0000-0000"
                      disabled={within24h}
                    />
                  </div>
                </div>

                {/* 비고 */}
                <div>
                  <label className="label">비고</label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="기타 안내사항"
                    style={{ minHeight: 64, resize: "vertical" }}
                    disabled={within24h}
                  />
                </div>
              </div>
            )}
          </section>

          {/* ── 시안 4번 카드 — 위험 액션 (경기 취소) ──
           * 시안 §3-2-4: borderColor: bdr-red. 24h 이내거나 신청자 있을 때 안내 강화. */}
          <section
            className="card"
            style={{
              padding: "18px 26px",
              marginBottom: 14,
              borderColor: "var(--bdr-red)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 14,
                flexWrap: "wrap",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--bdr-red)",
                    marginBottom: 2,
                  }}
                >
                  경기 취소
                </div>
                <div style={{ fontSize: 12, color: "var(--ink-mute)", lineHeight: 1.5 }}>
                  {applicantCount > 0
                    ? `신청자 ${applicantCount}명에게 자동으로 취소 알림이 전송됩니다.`
                    : "아직 신청자가 없어 안전하게 취소할 수 있습니다."}
                </div>
              </div>
              <button
                type="button"
                className="btn"
                onClick={handleCancelGame}
                disabled={cancelling}
                style={{
                  color: "var(--bdr-red)",
                  borderColor: "var(--bdr-red)",
                  opacity: cancelling ? 0.6 : 1,
                  cursor: cancelling ? "not-allowed" : "pointer",
                }}
              >
                {cancelling ? "처리 중..." : "경기 취소하기"}
              </button>
            </div>
          </section>

          {/* 액션 버튼 — 시안 우측 정렬 (취소 / 변경사항 저장)
           * 24h 이내면 저장 비활성 — 취소 액션 카드만 사용 */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginBottom: 40,
              flexWrap: "wrap",
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => router.push(`/games/${id}`)}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn--primary"
              disabled={saving || within24h}
              style={
                saving || within24h ? { opacity: 0.6, cursor: "not-allowed" } : undefined
              }
              title={within24h ? "경기 시작 24시간 전부터는 수정할 수 없습니다" : undefined}
            >
              {saving ? "저장 중..." : "변경사항 저장"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
