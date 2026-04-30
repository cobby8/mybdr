"use client";

/* ============================================================
 * GameEditPage — BDR v2 경기 수정 페이지 (시안 톤 박제)
 *
 * 왜 이 구조를 택했는가:
 * `/games/new` v2 폼(3카드 단일 페이지 + 우측 액션 버튼)과 톤을 맞춤.
 * 단, 편집 페이지는 다음 점에서 "새 경기"와 다르므로 단순 박제:
 *   - game_type 변경 불가 → KindSelector는 read-only "현재 유형" 칩만 노출
 *   - 임시저장/지난 경기 복사/권한 업그레이드 모달 불필요
 *   - 카카오 postcode 미연동 (기존 edit 로직에 없었음)
 *
 * 데이터/API/권한 가드 0 변경:
 *   - GET /api/web/games/[id] (mount 시 1회)
 *   - PATCH /api/web/games/[id] (submit 시)
 *   - 호스트 아님 → 서버에서 403 → 상세로 fallback
 * ============================================================ */

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

// 경기 데이터 타입 (API 응답 기반) — 변경 없음
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
  const [error, setError] = useState<string | null>(null);

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

  // 로딩 상태 — 시안 톤
  if (loading) {
    return (
      <div className="page">
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 0", textAlign: "center" }}>
          <span style={{ fontSize: 13, color: "var(--ink-mute)" }}>불러오는 중...</span>
        </div>
      </div>
    );
  }

  // 에러 상태 — 시안 톤
  if (error || !game) {
    return (
      <div className="page">
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "80px 0", textAlign: "center" }}>
          <p style={{ fontSize: 13, color: "var(--bdr-red)", marginBottom: 16 }}>
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

  // 현재 게임 유형 라벨 (read-only 칩)
  const kindLabel = GAME_TYPE_LABELS[game.game_type] ?? "경기";

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
          <div className="eyebrow">경기 수정 · EDIT GAME</div>
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
            기존 경기 정보를 수정합니다 (경기 종류는 변경할 수 없습니다)
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 시안 1번 카드 — 경기 종류 (read-only 칩) */}
          <section className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              1. 경기 종류
            </h2>
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
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>lock</span>
              {kindLabel}
            </div>
          </section>

          {/* 시안 2번 카드 — 경기 정보 */}
          <section className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              2. 경기 정보
            </h2>

            {/* 제목 — 1열 풀폭 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 14 }}>
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
                />
              </div>
            </div>

            {/* 일시 + 시간(소요) — 2열 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <div>
                <label className="label">경기 일시</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={scheduledAt}
                  onChange={(e) => setScheduledAt(e.target.value)}
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
                />
              </div>
            </div>

            {/* 코트 + 지역 — 2열 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
              <div>
                <label className="label">코트(장소명)</label>
                <input
                  className="input"
                  type="text"
                  value={venueName}
                  onChange={(e) => setVenueName(e.target.value)}
                  placeholder="미사강변체육관"
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
                />
              </div>
            </div>

            {/* 수준 + 정원 + 참가비 — 3열 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, marginTop: 14 }}>
              <div>
                <label className="label">수준</label>
                <select
                  className="input"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  style={{ appearance: "auto" }}
                >
                  {SKILL_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">정원</label>
                <input
                  className="input"
                  type="number"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  min={2}
                  max={50}
                />
              </div>
              <div>
                <label className="label">참가비 (원)</label>
                <input
                  className="input"
                  type="number"
                  value={feePerPerson}
                  onChange={(e) => setFeePerPerson(Number(e.target.value))}
                  min={0}
                  step={1000}
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
              />
            </div>
          </section>

          {/* 시안 3번 카드 — 신청 조건 */}
          <section className="card" style={{ padding: "24px 26px", marginBottom: 14 }}>
            <h2 style={{ margin: "0 0 14px", fontSize: 16, fontWeight: 700, color: "var(--ink)" }}>
              3. 신청 조건
            </h2>

            {/* 2열 체크박스 그리드 — 시안 동일 */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
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
                      cursor: "pointer",
                      border: isChecked ? "1px solid var(--cafe-blue)" : "1px solid transparent",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleCondition(opt)}
                      style={{ cursor: "pointer" }}
                    />
                    <span style={{ fontSize: 13, fontWeight: 600, color: "var(--ink)" }}>{opt}</span>
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
                {/* 최소 인원 + 연락처 */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
                  <div>
                    <label className="label">최소 인원</label>
                    <input
                      className="input"
                      type="number"
                      value={minParticipants}
                      onChange={(e) => setMinParticipants(Number(e.target.value))}
                      min={1}
                      max={50}
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
                  />
                </div>
              </div>
            )}
          </section>

          {/* 액션 버튼 — 시안 우측 정렬 (취소 / 수정 완료) */}
          <div
            style={{
              display: "flex",
              gap: 10,
              justifyContent: "flex-end",
              marginBottom: 40,
            }}
          >
            <button
              type="button"
              className="btn"
              onClick={() => router.back()}
            >
              취소
            </button>
            <button
              type="submit"
              className="btn btn--accent"
              disabled={saving}
              style={saving ? { opacity: 0.6, cursor: "not-allowed" } : undefined}
            >
              {saving ? "저장 중..." : "수정 완료 →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
