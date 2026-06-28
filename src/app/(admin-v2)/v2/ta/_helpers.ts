// ============================================================
// ta/_helpers.ts — 대회 콘솔 서버 공용 헬퍼 (표시 변환만 · 백엔드 0)
//   서버 컴포넌트에서 snake DB 값 → 표시 도메인으로 단일 매핑(snake 함정 차단).
// ============================================================

export type Tone = "ok" | "primary" | "warn" | "grey" | "danger";

// 대회 status → 표시 라벨/톤 (정본 필터 라벨: 진행중/접수중/준비중/종료)
export function tournamentStatus(s: string | null | undefined): {
  label: string;
  tone: Tone;
} {
  switch (s) {
    case "in_progress":
      return { label: "진행중", tone: "ok" };
    case "published":
      return { label: "접수중", tone: "primary" };
    case "draft":
      return { label: "준비중", tone: "grey" };
    case "completed":
      return { label: "종료", tone: "grey" };
    case "cancelled":
      return { label: "취소", tone: "danger" };
    default:
      return { label: s || "준비중", tone: "grey" };
  }
}

// KST 날짜 "2026.06.15" (서버=UTC → Asia/Seoul 고정). 없으면 "미정".
export function fmtDate(d: Date | null | undefined): string {
  if (!d) return "미정";
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

// 아바타/로고 색 팔레트(정본 av — 데이터 주입용, 컴포넌트 하드코딩 아님)
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
