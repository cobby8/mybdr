import { Icon } from "@/components/admin-toss";

/* ============================================================
 * SiteOperatorBadge — super-admin "Site Operator" 뱃지 (8C-6 박제 2026-06-07)
 *
 * 박제 source: Dev/design/BDR-current/team-shared.jsx (.operator-badge)
 *              + team-shared.css (dark gradient + gold 아이콘)
 * 박제 target: /admin/courts + /admin/partners (VA1 AdminCourtsPartners)
 *
 * 이유 (왜):
 *   - VA1 시안의 super-admin 측 식별 뱃지 = dark+gold (Site Operator).
 *     파트너 측 Court Operator(navy+silver, 8C-1)와 hex 를 명확히 분리해야
 *     함 (Phase 8 lock: "2 측 badge 시각 통합 금지").
 *   - courts/partners 두 라우트에서 동일하게 박제하므로 인라인 대신
 *     공용 컴포넌트로 단일화 (중복 hex 박제 방지 + 분리 유지 보장).
 *
 * 어떻게:
 *   - 운영 var(--color-*) 토큰에 dark+gold 그라디언트가 없어 시안 hex 를
 *     그대로 인라인 박제 (의도된 예외 — Court Operator 측과 동일 정책).
 *   - dark: linear-gradient(135deg, #1A1E27 → #404755) / border #5B6271
 *   - gold 아이콘: #F4C76C (verified_user) — Site Operator 식별 색
 * ============================================================ */
export function SiteOperatorBadge() {
  return (
    <span
      // 시안 .operator-badge 박제 — dark gradient (Court Operator navy 와 분리)
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[10.5px] font-extrabold uppercase tracking-wider"
      style={{
        background: "linear-gradient(135deg, #1A1E27 0%, #404755 100%)",
        border: "1px solid #5B6271",
        color: "#fff",
      }}
    >
      {/* gold 아이콘 (#F4C76C) — Site Operator 측 구분 색 */}
      <Icon name="verified_user" size={13} color="#F4C76C" />
      Site Operator
    </span>
  );
}
