/* global React, AdminShell, AssociationWizard */

// =====================================================================
// AdminWizardAssociation.jsx — 협회 마법사 (v2.8.1 — sidebar 유지)
//   진입: setRoute('adminWizardAssociation')
//   복귀: setRoute('adminDashboard') / sidebar 메뉴
//   에러: 권한 미보유 = AssociationWizard mockHasPermission=false 토글
//
// v2.7 풀스크린 → v2.8.1 sidebar 유지 (사용자 결정 2026-05-15)
// =====================================================================
function AdminWizardAssociation({ setRoute, theme, setTheme }) {
  return (
    <AdminShell
      route="adminWizardAssociation"
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
            협회 마법사 · 진행 중
          </span>
          <button
          type="button"
          onClick={() => setRoute('adminWizardTournament')}
          style={{
            background: 'transparent', border: 0, padding: '6px 8px',
            color: 'var(--ink-mute)', cursor: 'pointer',
            display: 'inline-flex', alignItems: 'center', gap: 4,
            fontSize: 12, textDecoration: 'underline',
            textUnderlineOffset: 3
          }}>

            일반 대회 마법사로
          </button>
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

      <AssociationWizard
        setRoute={setRoute}
        backRoute="adminDashboard"
        backLabel="Admin 대시보드로"
        shellMode="admin" />

    </AdminShell>);

}

window.AdminWizardAssociation = AdminWizardAssociation;
