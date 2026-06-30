// ============================================================
// referee-console/_referee-format.ts — 심판 콘솔 순수 표시/포맷 헬퍼 (RSC 경계 분리)
//   ★server 전용 import(next/headers·prisma·getWebSession) 절대 없음 — client/server 양쪽
//     에서 안전하게 import 가능한 "순수 함수"만 모음. (③-A RSC 경계 위반 빌드 블로커 수정)
//   ★기존 _referee-data.ts 에서 그대로 이동(로직 0변경). _referee-data.ts 는 본 파일을
//     re-export 하여 서버측 기존 import 호환을 유지한다.
// ============================================================

// ── 표시 헬퍼(서버 단일 매핑) ────────────────────────────────────────

export type Tone = "ok" | "primary" | "warn" | "danger" | "grey";

// 아바타 색 팔레트(데이터 주입용 — 컴포넌트 하드코딩 아님)
export const AV = [
  "#3182F6",
  "#15B86A",
  "#6D5AE6",
  "#FF9500",
  "#F04452",
  "#00B8D9",
  "#E0457B",
  "#8B5CF6",
];
export function avColor(i: number): string {
  return AV[((i % AV.length) + AV.length) % AV.length];
}

// KST 날짜 "2026.06.15". 없으면 "—".
export function fmtDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return d
    .toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
    .replace(/\.\s/g, ".")
    .replace(/\.$/, "");
}

// KST 날짜+시각 "06.28 (토) 09:00". 없으면 "—".
export function fmtDateTime(d: Date | null | undefined): string {
  if (!d) return "—";
  const date = d
    .toLocaleDateString("ko-KR", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit",
      weekday: "short",
    })
    .replace(/\.\s?/g, ".")
    .replace(/\.\(/, " (")
    .replace(/\.$/, "");
  const time = d.toLocaleTimeString("ko-KR", {
    timeZone: "Asia/Seoul",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  return `${date} ${time}`;
}

// 원 단위 정수 → "₩1,080,000". null/0 정직 표기.
export function won(amount: number | null | undefined): string {
  return "₩" + (amount ?? 0).toLocaleString();
}

// 천단위 콤마(0 도 "0").
export function n(v: number | null | undefined): string {
  return (v ?? 0).toLocaleString();
}

// ── 심판(Referee) 표시 매핑 ──────────────────────────────────────────

// 심판 표시명: 사전등록명 > 교차검증명 > "심판".
export function refereeName(r: {
  registered_name?: string | null;
  verified_name?: string | null;
}): string {
  return r.registered_name || r.verified_name || "심판";
}

// referee.level(enum) → 등급 라벨/톤. ★DB level 직접 매핑(정본의 1/2/3급은
//   cert_grade 데모값 — 본 컬럼은 beginner/intermediate/advanced/international).
export function levelBadge(level: string | null | undefined): {
  label: string;
  tone: Tone;
} {
  switch (level) {
    case "international":
      return { label: "국제", tone: "primary" };
    case "advanced":
      return { label: "상급", tone: "ok" };
    case "intermediate":
      return { label: "중급", tone: "warn" };
    case "beginner":
      return { label: "입문", tone: "grey" };
    default:
      return { label: "미지정", tone: "grey" };
  }
}

// referee.status → ad-dot 상태 라벨/톤(status 셀).
export function refereeStatus(s: string | null | undefined): {
  st: string;
  sttone: string;
} {
  if (s === "active") return { st: "활동중", sttone: "ok" };
  if (s === "pending_review") return { st: "검토중", sttone: "warn" };
  if (s === "inactive") return { st: "휴면", sttone: "mute" };
  return { st: s || "활동중", sttone: "ok" };
}

// referee.role_type → 직군 라벨.
export function roleTypeLabel(t: string | null | undefined): string {
  if (t === "game_official") return "경기원";
  return "심판";
}

// 활동 지역 "서울 강남·송파" 형태. 둘 다 없으면 "—".
export function regionLabel(
  sido: string | null | undefined,
  sigungu: string | null | undefined
): string {
  if (sido && sigungu) return `${sido} ${sigungu}`;
  if (sido) return sido;
  if (sigungu) return sigungu;
  return "—";
}

// ── 배정(RefereeAssignment) 표시 매핑 ────────────────────────────────

// 배정 역할 코드 → 라벨.
export function assignRoleLabel(role: string | null | undefined): string {
  switch (role) {
    case "main":
      return "주심";
    case "sub":
      return "부심";
    case "recorder":
      return "기록";
    case "timer":
      return "타이머";
    default:
      return role || "—";
  }
}

// 배정 상태 → 라벨/톤(badge 셀).
export function assignStatusBadge(s: string | null | undefined): {
  label: string;
  tone: Tone;
} {
  switch (s) {
    case "confirmed":
      return { label: "확정", tone: "ok" };
    case "completed":
      return { label: "완료", tone: "ok" };
    case "assigned":
      return { label: "배정", tone: "warn" };
    case "declined":
      return { label: "거절", tone: "danger" };
    case "cancelled":
      return { label: "취소", tone: "grey" };
    default:
      return { label: s || "배정", tone: "grey" };
  }
}

// 경기 표시명: 라운드명 > 매치코드 > "경기 #id".
export function matchLabel(m: {
  roundName?: string | null;
  match_code?: string | null;
  id: bigint;
}): string {
  return m.roundName || m.match_code || `경기 #${m.id.toString()}`;
}

// ── 정산(RefereeSettlement) 표시 매핑 ────────────────────────────────

// 정산 상태 → 라벨/톤(badge 셀).
export function settleStatusBadge(s: string | null | undefined): {
  label: string;
  tone: Tone;
} {
  switch (s) {
    case "paid":
      return { label: "지급 완료", tone: "ok" };
    case "scheduled":
      return { label: "지급 예정", tone: "primary" };
    case "pending":
      return { label: "지급 대기", tone: "warn" };
    case "cancelled":
      return { label: "취소", tone: "grey" };
    case "refunded":
      return { label: "환수", tone: "danger" };
    default:
      return { label: s || "지급 대기", tone: "grey" };
  }
}

// ── 평가 리포트(RefereeEvaluation) 표시 매핑 ─────────────────────────

// 평가 상태 → 라벨/톤(badge 셀). DB status = submitted/confirmed/review_needed.
//   정본 RF_EVAL 배지("확정" ok / "검토 필요" amber) 매핑.
export function evalStatusBadge(s: string | null | undefined): {
  label: string;
  tone: Tone;
} {
  switch (s) {
    case "confirmed":
      return { label: "확정", tone: "ok" };
    case "review_needed":
      return { label: "검토 필요", tone: "warn" };
    case "submitted":
      return { label: "제출됨", tone: "primary" };
    default:
      return { label: s || "제출됨", tone: "grey" };
  }
}

// ── 자격·서류 검증(RefereeCertificate / RefereeDocument) 표시 매핑 ───

// 자격증 검증 상태 → 라벨/톤. 만료 임박(verified+만료30일내)도 표시.
export function certVerifyBadge(
  verified: boolean,
  expiresAt: Date | null | undefined
): { label: string; tone: Tone } {
  if (!verified) return { label: "검증 대기", tone: "warn" };
  // 만료 임박 판정(30일 이내) — verified 라도 만료 임박이면 경고.
  if (expiresAt) {
    const days = (expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    if (days < 0) return { label: "만료", tone: "danger" };
    if (days <= 30) return { label: "만료 임박", tone: "warn" };
  }
  return { label: "검증 완료", tone: "ok" };
}

// 서류 종류 코드 → 라벨.
export function docTypeLabel(t: string | null | undefined): string {
  switch (t) {
    case "certificate":
      return "자격증";
    case "id_card":
      return "신분증";
    case "bankbook":
      return "통장 사본";
    default:
      return t || "서류";
  }
}

// OCR 처리 상태 → 라벨/톤.
export function ocrStatusBadge(s: string | null | undefined): {
  label: string;
  tone: Tone;
} {
  switch (s) {
    case "completed":
      return { label: "인식 완료", tone: "ok" };
    case "failed":
      return { label: "인식 실패", tone: "danger" };
    case "skipped":
      return { label: "건너뜀", tone: "grey" };
    case "pending":
      return { label: "대기", tone: "warn" };
    default:
      return { label: s || "대기", tone: "grey" };
  }
}
