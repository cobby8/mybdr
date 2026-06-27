/* ============================================================
 * RecordingModeBadge — 기록 모드 인증 뱃지 (대회/경기 기록 공용)
 *
 * 이유 (왜):
 *   기록 방식별 신뢰도를 시각적으로 구분 (사용자 결정 2026-06-27):
 *     - flutter (BDR 기록앱, 풀스탯) = "BDR full" 골드 인증
 *     - paper   (웹 전자기록지, 간이) = "BDR" 실버 인증
 *     - manual / 기타                = 뱃지 없음 (BDR 시스템 미사용)
 *   mode 판정은 getRecordingMode / getTournamentDefaultMode 결과 문자열을 그대로 전달.
 *
 * 어떻게:
 *   - 골드/실버는 운영 var(--color-*) 토큰에 없어 hex 인라인 박제
 *     (SiteOperatorBadge 와 동일 정책 — 의도된 예외, components/admin/site-operator-badge.tsx 참조)
 *   - 아이콘 = Material Symbols Outlined (lucide 금지) / border-radius 4px (pill 9999px 금지)
 *   - 웹·라이브 공용 — Material Symbols span 직접 사용 (admin-toss Icon 미의존)
 * ============================================================ */

type RecordingBadgeSize = "sm" | "md";

const STYLE = {
  flutter: {
    label: "BDR full",
    // dark gradient + 골드 테두리/아이콘 — 풀스탯(상위) 식별
    background: "linear-gradient(135deg, #1A1E27 0%, #3B3320 100%)",
    border: "#C9A24B",
    icon: "#F4C76C",
  },
  paper: {
    label: "BDR",
    // navy gradient + 실버 테두리/아이콘 — 전자기록지(하위) 식별
    background: "linear-gradient(135deg, #1B2A4A 0%, #2C3E63 100%)",
    border: "#9AA7BD",
    icon: "#C7D0DC",
  },
} as const;

export function RecordingModeBadge({
  mode,
  size = "md",
}: {
  mode: string | null | undefined;
  size?: RecordingBadgeSize;
}) {
  // flutter / paper 만 뱃지 표시 — manual·null·기타는 미표시
  if (mode !== "flutter" && mode !== "paper") return null;
  const s = STYLE[mode];
  const iconPx = size === "sm" ? 12 : 13;
  const textCls = size === "sm" ? "text-[9.5px]" : "text-[10.5px]";
  const padCls = size === "sm" ? "px-2 py-0.5" : "px-2.5 py-1";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-extrabold uppercase tracking-wider ${textCls} ${padCls}`}
      style={{ background: s.background, border: `1px solid ${s.border}`, color: "#fff" }}
      title={mode === "flutter" ? "BDR 기록앱 — 풀스탯 기록" : "웹 전자기록지 — 간이 기록"}
    >
      <span
        className="material-symbols-outlined"
        style={{ fontSize: iconPx, color: s.icon, lineHeight: 1 }}
        aria-hidden="true"
      >
        verified
      </span>
      {s.label}
    </span>
  );
}
