/* global React, AdminShell, TournamentAdminWizard */

// =====================================================================
// AdminWizardTournament.jsx — 대회 운영자 도구 (v2.8.1 — sidebar 유지)
//   진입: setRoute('adminWizardTournament')
//   복귀: setRoute('adminDashboard') / sidebar 메뉴 클릭
//   에러: 권한 미보유 시 wizard 자체의 mockRole 토글로 노출
//
// v2.7 풀스크린 → v2.8.1 sidebar 유지 (사용자 결정 2026-05-15):
//   - AdminShell sidebarVariant='default' — 좌측 sidebar 정상 노출
//   - WizardShell shellMode='admin' — 내부 breadcrumb 자동 숨김 (admin pageheader 가 컨텍스트 제공)
//   - topbar 우측 = "× 종료" (작성 중단 시 dashboard 복귀) 만 유지 (좌상단 백 링크 제거)
//   - sidebar 의 "대회 관리 > 대회 운영자 도구" 항목이 활성 표시
// =====================================================================
function AdminWizardTournament({ setRoute, theme, setTheme }) {
  return (
    <AdminShell
      route="adminWizardTournament"
      setRoute={setRoute}
      theme={theme}
      setTheme={setTheme}
      hideHeader={true}
      topbarRight={
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
          fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
          color: 'var(--accent)', textTransform: 'uppercase',
          fontFamily: 'var(--ff-mono)'
        }}>
            대회 운영자 도구 · 마법사 진행 중
          </span>
          <button
          type="button"
          onClick={() => {
            if (confirm('진행 중인 작성을 종료하시겠습니까?')) setRoute('adminDashboard');
          }}
          style={{
            background: 'transparent', border: 0, padding: '6px 8px',
            color: 'var(--ink-mute)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 13
          }}>

            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
            종료
          </button>
        </div>
      }>

      <TournamentAdminWizard
        setRoute={setRoute}
        backRoute="adminDashboard"
        backLabel="Admin 대시보드로"
        shellMode="admin" />

    </AdminShell>);

}

window.AdminWizardTournament = AdminWizardTournament;
