/* global React, AdminShell, AdminEmptyState, ADMIN_NAV */

// =====================================================================
// AdminComingSoon.jsx — Phase A 범위 외 admin 라우트 placeholder
//   진입: setRoute('adminAnalytics' | 'adminTournaments' | 'adminUsers' | …)
//   복귀: setRoute('adminDashboard')
//   에러: 없음 (placeholder)
//
// Phase B~E (콘텐츠 / 사용자 + 비즈니스 / 시스템 + me / tournament-admin) 에서 박제 예정.
// 본 화면은 sidebar nav 와 페이지 라우터 사이의 gap 을 메우기 위한 임시 셸.
// =====================================================================

const COMING_SOON_LABELS = {
  adminAnalytics: { eyebrow: 'ADMIN · 시스템', title: '분석', phase: 'Phase D · 시스템 그룹', icon: 'analytics' },
  adminTournaments: { eyebrow: 'ADMIN · 콘텐츠', title: '대회 관리', phase: 'Phase B · 콘텐츠 그룹', icon: 'emoji_events' },
  adminGames: { eyebrow: 'ADMIN · 콘텐츠', title: '경기 관리', phase: 'Phase B · 콘텐츠 그룹', icon: 'sports_basketball' },
  adminTeams: { eyebrow: 'ADMIN · 콘텐츠', title: '팀 관리', phase: 'Phase B · 콘텐츠 그룹', icon: 'groups' },
  adminCourts: { eyebrow: 'ADMIN · 콘텐츠', title: '코트 관리', phase: 'Phase B · 콘텐츠 그룹', icon: 'location_on' },
  adminCommunity: { eyebrow: 'ADMIN · 콘텐츠', title: '커뮤니티', phase: 'Phase B · 콘텐츠 그룹', icon: 'forum' },
  adminNews: { eyebrow: 'ADMIN · 콘텐츠', title: 'BDR NEWS', phase: 'Phase B · 콘텐츠 그룹', icon: 'newspaper' },
  adminUsers: { eyebrow: 'ADMIN · 사용자', title: '유저 관리', phase: 'Phase C · 사용자 그룹', icon: 'group' },
  adminGameReports: { eyebrow: 'ADMIN · 사용자', title: '신고 검토', phase: 'Phase C · 사용자 그룹', icon: 'report' },
  adminSuggestions: { eyebrow: 'ADMIN · 사용자', title: '건의사항', phase: 'Phase C · 사용자 그룹', icon: 'lightbulb' },
  adminPlans: { eyebrow: 'ADMIN · 비즈니스', title: '요금제 관리', phase: 'Phase C · 비즈니스 그룹', icon: 'payments' },
  adminPayments: { eyebrow: 'ADMIN · 비즈니스', title: '결제', phase: 'Phase C · 비즈니스 그룹', icon: 'credit_card' },
  adminCampaigns: { eyebrow: 'ADMIN · 비즈니스', title: '광고 캠페인', phase: 'Phase C · 비즈니스 그룹', icon: 'campaign' },
  adminPartners: { eyebrow: 'ADMIN · 비즈니스', title: '파트너 관리', phase: 'Phase C · 비즈니스 그룹', icon: 'handshake' },
  adminSettings: { eyebrow: 'ADMIN · 시스템', title: '시스템 설정', phase: 'Phase D · 시스템 그룹', icon: 'settings' },
  adminLogs: { eyebrow: 'ADMIN · 시스템', title: '활동 로그', phase: 'Phase D · 시스템 그룹', icon: 'list_alt' },
  adminMe: { eyebrow: 'ADMIN · me', title: '마이페이지', phase: 'Phase D · 시스템 + me + 알림', icon: 'account_circle' },
  partnerAdminEntry: { eyebrow: 'ADMIN · 외부 관리', title: '협력업체 관리', phase: 'Phase C · 외부 관리', icon: 'storefront' },
  adminTournamentDetail: { eyebrow: 'ADMIN · 콘텐츠', title: '대회 상세', phase: 'v2.13 · B-2 신규', icon: 'emoji_events' },
  adminTournamentAuditLog: { eyebrow: 'ADMIN · 콘텐츠', title: '대회 감사 로그', phase: 'v2.13 · B-4 신규', icon: 'history' },
  adminTournamentTransferOrganizer: { eyebrow: 'ADMIN · 콘텐츠', title: '운영자 이전', phase: 'v2.13 · B-3 신규', icon: 'swap_horiz' },
  adminOrganizations: { eyebrow: 'ADMIN · 외부 관리', title: '단체 관리', phase: 'v2.13 · C-9 신규', icon: 'domain' },
  adminNotifications: { eyebrow: 'ADMIN · 시스템', title: '알림 발송', phase: 'v2.13 · D-5 신규', icon: 'notifications_active' },
  adminTournamentAdminHome: { eyebrow: 'ADMIN · 대회 운영', title: '대회 운영자 도구', phase: 'v2.14 · E-1 신규', icon: 'manage_accounts' },
  adminTournamentAdminList: { eyebrow: 'ADMIN · 대회 운영', title: '내 대회 목록', phase: 'v2.14 · E-2 신규', icon: 'list' },
  adminTournamentSetupHub: { eyebrow: 'ADMIN · 대회 운영', title: '대회 설정 hub', phase: 'v2.14 · E-3 신규 (UI-1+5)', icon: 'checklist' },
  adminTournamentNew: { eyebrow: 'ADMIN · 대회 운영', title: '새 대회 만들기 (1-step)', phase: 'v2.14 · E-10 신규 (UI-1+2)', icon: 'add_circle' },
  adminTournamentEditWizard: { eyebrow: 'ADMIN · 대회 운영', title: '대회 수정 wizard', phase: 'v2.14 · E-11 신규 (UI-3+4)', icon: 'edit_note' }
};

function AdminComingSoon({ setRoute, routeKey }) {
  const info = COMING_SOON_LABELS[routeKey] || {
    eyebrow: 'ADMIN',
    title: '준비 중',
    phase: '후속 Phase',
    icon: 'construction'
  };

  return (
    <AdminShell
      route={routeKey}
      setRoute={setRoute}
      eyebrow={info.eyebrow}
      title={info.title}
      subtitle={`이 페이지는 ${info.phase} 의뢰에서 박제 예정입니다. 현재는 Sidebar nav + 셸 미리보기 용 placeholder.`}
      actions={
      <button type="button" className="btn" onClick={() => setRoute('adminDashboard')}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          대시보드로
        </button>
      }>

      <div style={{
        background: 'var(--bg-card)',
        border: '1px dashed var(--border-strong)',
        borderRadius: 8,
        padding: '64px 32px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14
      }}>
        <div style={{
          width: 80, height: 80, borderRadius: 50,
          background: 'var(--bg-alt)',
          display: 'grid', placeItems: 'center',
          color: 'var(--ink-mute)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 40 }}>{info.icon}</span>
        </div>
        <div style={{
          fontSize: 11, fontWeight: 800, letterSpacing: '0.12em',
          textTransform: 'uppercase', color: 'var(--accent)',
          fontFamily: 'var(--ff-mono)'
        }}>
          {info.phase}
        </div>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-0.01em' }}>
          {info.title} — 박제 예정
        </h2>
        <p style={{ margin: 0, color: 'var(--ink-mute)', fontSize: 14, maxWidth: 480, lineHeight: 1.6 }}>
          본 화면은 Admin Phase A (Shell + 대시보드 + Wizard) 범위 외입니다.<br />
          상세 의뢰가 도착하면 본 자리에 박제됩니다.
        </p>

        <div style={{
          display: 'inline-flex', gap: 8,
          padding: '10px 14px', marginTop: 6,
          background: 'var(--bg-alt)',
          borderRadius: 6,
          fontSize: 12, color: 'var(--ink-soft)',
          fontFamily: 'var(--ff-mono)'
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: '-3px' }}>info</span>
          route: <code style={{ color: 'var(--accent)' }}>{routeKey}</code>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
          <button type="button" className="btn btn--primary" onClick={() => setRoute('adminDashboard')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>dashboard</span>
            대시보드로 돌아가기
          </button>
        </div>
      </div>
    </AdminShell>);

}

window.AdminComingSoon = AdminComingSoon;
// Phase A~D 박제 완료 — 모든 admin 라우트가 박제되어 ComingSoon placeholder 미사용.
// (안전망 — 정의되지 않은 admin route 가 들어오면 ComingSoon 으로 fallback)
// Phase A~D + v2.13 신규 — 23 admin 라우트 안전망 (B-2/3/4 + C-9 + D-5 추가)
const ADMIN_LIVE_ROUTES = new Set([
  // Phase B · 콘텐츠 그룹 (6 + 신규 3 = 9)
  'adminTournaments', 'adminGames', 'adminTeams',
  'adminCourts', 'adminCommunity', 'adminNews',
  'adminTournamentDetail', 'adminTournamentAuditLog', 'adminTournamentTransferOrganizer',
  // Phase C · 사용자 + 비즈니스 + 외부 그룹 (8 + 신규 1 = 9)
  'adminUsers', 'adminGameReports', 'adminSuggestions',
  'adminPlans', 'adminPayments', 'adminCampaigns',
  'adminPartners', 'partnerAdminEntry', 'adminOrganizations',
  // Phase D · 시스템 + me (4 + 신규 1 = 5)
  'adminAnalytics', 'adminSettings', 'adminLogs', 'adminMe', 'adminNotifications',
  // v2.14 · Phase E 핵심 (5)
  'adminTournamentAdminHome', 'adminTournamentAdminList', 'adminTournamentSetupHub',
  'adminTournamentNew', 'adminTournamentEditWizard'
]);
window.ADMIN_COMING_SOON_ROUTES = Object.keys(COMING_SOON_LABELS).filter((k) => !ADMIN_LIVE_ROUTES.has(k));
