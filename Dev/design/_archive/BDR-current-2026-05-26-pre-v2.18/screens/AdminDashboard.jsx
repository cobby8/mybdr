/* global React, AdminShell, AdminPageHeader, AdminStatCard, AdminStatusTabs, AdminDetailModal, AdminEmptyState */

// =====================================================================
// AdminDashboard.jsx — admin 영역 home (Phase A)
//   진입: setRoute('adminDashboard')
//   복귀: setRoute('home') = 사이트 home / sidebar foot 의 "사이트로 돌아가기"
//   에러: state='error' = "데이터 로드 실패" + 재시도 CTA
// =====================================================================

// snake_case mock
const ADMIN_STATS_FILLED = {
  users_total: 18243,
  users_delta: '+312 / 7d',
  users_trend: 'up',
  tournaments_total: 47,
  tournaments_delta: '+3 / 7d',
  tournaments_trend: 'up',
  games_active: 124,
  games_delta: '−6 / 7d',
  games_trend: 'down',
  teams_total: 842,
  teams_delta: '+24 / 7d',
  teams_trend: 'up'
};

const ADMIN_CHART_FILLED = [
{ date: '05-09', count: 42 },
{ date: '05-10', count: 58 },
{ date: '05-11', count: 31 },
{ date: '05-12', count: 71 },
{ date: '05-13', count: 64 },
{ date: '05-14', count: 89 },
{ date: '05-15', count: 53 }];


const ADMIN_LOGS_FILLED = [
{
  log_id: 'lg_01', severity: 'success',
  action: '대회 생성',
  description: 'BDR 서머 오픈 #4 — 종별 4개 / 정원 44팀',
  admin_name: '김도훈', created_at: '2분 전'
},
{
  log_id: 'lg_02', severity: 'warning',
  action: '신고 검토 보류',
  description: '게시글 #4821 — 욕설 신고 3건 / 검토 대기',
  admin_name: '이박재', created_at: '12분 전'
},
{
  log_id: 'lg_03', severity: 'info',
  action: '유저 권한 변경',
  description: 'user_id=u_lee_park → tournament_admin 부여',
  admin_name: '김도훈', created_at: '38분 전'
},
{
  log_id: 'lg_04', severity: 'error',
  action: '결제 실패 발생',
  description: '캠페인 cm_2025_winter — 신용카드 인증 실패 7건',
  admin_name: '시스템', created_at: '1시간 전'
},
{
  log_id: 'lg_05', severity: 'info',
  action: '코트 등록',
  description: '장충체육관 — 외부 단체 등록 / 승인 대기',
  admin_name: '정세훈', created_at: '3시간 전'
}];


function AdminDashboard({ setRoute, theme, setTheme }) {
  // mock 4 상태군 토글
  const [mockState, setMockState] = React.useState('filled');
  const [adminRole, setAdminRole] = React.useState('super_admin');
  const [statusTab, setStatusTab] = React.useState('all');
  const [openDetail, setOpenDetail] = React.useState(null); // detail modal demo

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{
      padding: '4px 10px', background: 'var(--bg-card)',
      border: '1px solid var(--border)', borderRadius: 4,
      display: 'flex', gap: 6, alignItems: 'center',
      fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)'
    }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>MOCK</span>
        <select value={mockState} onChange={(e) => setMockState(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="empty">D · empty</option>
          <option value="filled">D · filled</option>
          <option value="error">B · error</option>
          <option value="loading">C · loading</option>
        </select>
      </div>
      <button type="button" style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: 'var(--bg-card)', border: '1px solid var(--border)',
      borderRadius: 6, padding: '4px 10px',
      fontSize: 13, cursor: 'pointer'
    }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>notifications</span>
        <span className="badge badge--red" style={{ padding: '0 5px', fontSize: 10 }}>3</span>
      </button>
      <button className="admin-user" type="button">
        <div className="admin-user__avatar">DH</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>김도훈</span>
          <span className="admin-user__role">{adminRole.replace('_', ' ')}</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
      </button>
    </div>;


  return (
    <AdminShell
      route="adminDashboard"
      setRoute={setRoute}
      eyebrow="ADMIN · 대시보드"
      title="관리자 대시보드"
      subtitle="유저 · 토너먼트 · 경기 · 팀 통계와 최근 활동을 한 눈에 확인합니다."
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            리포트
          </button>
          <button type="button" className="btn btn--primary" onClick={() => setRoute('adminWizardTournament')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>add</span>
            새 대회 만들기
          </button>
        </>
      }>

      {/* 권한 부족 — partner_member 는 dashboard 그룹 자체가 안 보이지만 진입 시 fallback */}
      {filterNavByRole(adminRole).length === 0 &&
      <AdminEmptyState
        icon="lock"
        title="관리 권한이 없습니다"
        description="현재 계정에는 관리자 권한이 없어요. 다른 계정으로 로그인하거나 super_admin 에게 권한 요청을 보내세요."
        ctaLabel="사이트로 돌아가기"
        onCta={() => setRoute('home')} />

      }

      {filterNavByRole(adminRole).length > 0 &&
      <>
          {/* 통계 카드 4종 */}
          <div className="admin-section-title">통계 · 최근 7일</div>
          <DashStatRow state={mockState} />

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', gap: 16, marginTop: 24 }} className="admin-dash-grid">
            <DashChart state={mockState} />
            <DashLogs state={mockState} onLogClick={(l) => setOpenDetail(l)} />
          </div>

          {/* StatusTabs demo (components 박제 검증용) */}
          <div className="admin-section-title">관리 대기 · 상태별</div>
          <AdminStatusTabs
          tabs={[
          { key: 'all', label: '전체', count: 86 },
          { key: 'active', label: '진행중', count: 24 },
          { key: 'pending', label: '대기', count: 47 },
          { key: 'done', label: '완료', count: 12 },
          { key: 'reports', label: '신고', count: 3 }]}

          current={statusTab}
          onChange={setStatusTab} />


          <div style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 18, marginTop: 0
        }}>
            <div style={{ fontSize: 13, color: 'var(--ink-mute)' }}>
              "{ {all: '전체', active: '진행중', pending: '대기', done: '완료', reports: '신고'}[statusTab] }" 탭 선택됨 — 후속 의뢰 (B/C/D) 에서 실 데이터 테이블 박제 예정.
            </div>
          </div>
        </>
      }

      {/* DetailModal demo (slide-in 박제 검증용) */}
      <AdminDetailModal
        open={!!openDetail}
        onClose={() => setOpenDetail(null)}
        title={openDetail ? `로그 #${openDetail.log_id}` : ''}
        footer={
        <>
            <button type="button" className="btn" onClick={() => setOpenDetail(null)}>닫기</button>
            <button type="button" className="btn btn--primary">처리하기</button>
          </>
        }>

        {openDetail &&
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, fontSize: 13.5 }}>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>액션</div>
              <div style={{ fontSize: 16, fontWeight: 700 }}>{openDetail.action}</div>
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>설명</div>
              <div>{openDetail.description}</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>처리자</div>
                <div style={{ fontWeight: 600 }}>{openDetail.admin_name}</div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4 }}>시각</div>
                <div style={{ fontFamily: 'var(--ff-mono)' }}>{openDetail.created_at}</div>
              </div>
            </div>
            <div style={{
            padding: 12, background: 'var(--bg-alt)', borderRadius: 6,
            fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.55
          }}>
              <span className="material-symbols-outlined" style={{ fontSize: 14, verticalAlign: '-3px', marginRight: 4 }}>info</span>
              슬라이드 인 패널 — admin 의 모든 상세 화면 (유저 상세 / 신고 상세 / 캠페인 상세 등) 에서 재사용 예정.
            </div>
          </div>
        }
      </AdminDetailModal>
    </AdminShell>);

}

// =====================================================================
// helpers (top of dashboard)
// =====================================================================
function DashStatRow({ state }) {
  if (state === 'loading') {
    return (
      <div className="admin-stat-grid">
        {[1, 2, 3, 4].map((i) => <AdminStatCard key={i} skeleton />)}
      </div>);

  }
  if (state === 'error') {
    return (
      <AdminEmptyState
        icon="cloud_off"
        title="데이터 로드 실패"
        description="통계 데이터를 불러올 수 없습니다. 잠시 후 다시 시도하세요."
        ctaLabel="다시 시도"
        onCta={() => alert('재시도 (시안)')} />);


  }
  const s = state === 'empty' ?
  { users_total: 0, users_delta: '0 / 7d', users_trend: 'flat', tournaments_total: 0, tournaments_delta: '0 / 7d', tournaments_trend: 'flat', games_active: 0, games_delta: '0 / 7d', games_trend: 'flat', teams_total: 0, teams_delta: '0 / 7d', teams_trend: 'flat' } :
  ADMIN_STATS_FILLED;
  return (
    <div className="admin-stat-grid">
      <AdminStatCard icon="group" label="전체 유저" value={s.users_total.toLocaleString()} delta={s.users_delta} trend={s.users_trend} link />
      <AdminStatCard icon="emoji_events" label="토너먼트" value={s.tournaments_total} delta={s.tournaments_delta} trend={s.tournaments_trend} link />
      <AdminStatCard icon="sports_basketball" label="진행중 경기" value={s.games_active} delta={s.games_delta} trend={s.games_trend} link />
      <AdminStatCard icon="groups" label="등록 팀" value={s.teams_total.toLocaleString()} delta={s.teams_delta} trend={s.teams_trend} link />
    </div>);

}

function DashChart({ state }) {
  if (state === 'loading') {
    return (
      <div className="admin-chart">
        <div className="admin-skel" style={{ height: 16, width: 140, marginBottom: 18 }}></div>
        <div className="admin-skel" style={{ height: 160 }}></div>
      </div>);

  }
  if (state === 'error') {
    return (
      <div className="admin-chart">
        <AdminEmptyState icon="cloud_off" title="차트 로드 실패" description="" ctaLabel="재시도" onCta={() => {}} />
      </div>);

  }
  const data = state === 'empty' ? ADMIN_CHART_FILLED.map((d) => ({ ...d, count: 0 })) : ADMIN_CHART_FILLED;
  const max = Math.max(...data.map((d) => d.count)) || 1;
  return (
    <div className="admin-chart">
      <div className="admin-chart__head">
        <span className="admin-chart__title">활동 추이</span>
        <span className="admin-chart__sub">신규 가입 · 최근 7일</span>
      </div>
      <div className="admin-chart__body">
        {data.map((d, i) => {
          const h = (d.count / max) * 100;
          return (
            <div
              key={i}
              className="admin-chart__bar"
              data-zero={d.count === 0 ? 'true' : 'false'}
              style={{ height: `${Math.max(h, 2)}%` }}
              title={`${d.date} · ${d.count}`}>

              <span className="admin-chart__bar-value">{d.count}</span>
            </div>);

        })}
      </div>
      <div className="admin-chart__x">
        {data.map((d, i) => <span key={i}>{d.date}</span>)}
      </div>
    </div>);

}

function DashLogs({ state, onLogClick }) {
  if (state === 'loading') {
    return (
      <div className="admin-log-card">
        <div className="admin-log-card__head">
          <span className="admin-log-card__title">최근 활동</span>
        </div>
        {[1, 2, 3, 4, 5].map((i) =>
        <div key={i} className="admin-log-row">
            <div className="admin-log-row__dot"></div>
            <div className="admin-log-row__body">
              <div className="admin-skel" style={{ height: 14, width: '60%', marginBottom: 6 }}></div>
              <div className="admin-skel" style={{ height: 12, width: '85%' }}></div>
            </div>
            <div className="admin-skel" style={{ height: 12, width: 56 }}></div>
          </div>
        )}
      </div>);

  }
  const logs = state === 'empty' ? [] : ADMIN_LOGS_FILLED;
  return (
    <div className="admin-log-card">
      <div className="admin-log-card__head">
        <span className="admin-log-card__title">최근 활동</span>
        <button
          type="button"
          style={{ background: 'transparent', border: 0, color: 'var(--ink-mute)', fontSize: 12, cursor: 'pointer' }}>

          전체 보기 →
        </button>
      </div>
      {logs.length === 0 ?
      <div style={{ padding: 28, textAlign: 'center', color: 'var(--ink-mute)', fontSize: 13 }}>
          아직 기록된 활동이 없습니다.
        </div> :

      logs.map((l) =>
      <button
        key={l.log_id}
        type="button"
        className="admin-log-row"
        onClick={() => onLogClick?.(l)}
        style={{ width: '100%', textAlign: 'left', background: 'transparent', border: 0, borderBottom: '1px solid var(--border)', cursor: 'pointer' }}>

            <span className="admin-log-row__dot" data-severity={l.severity}></span>
            <div className="admin-log-row__body">
              <div className="admin-log-row__action">{l.action}</div>
              <div className="admin-log-row__desc">{l.description}</div>
            </div>
            <div className="admin-log-row__meta">
              <div>{l.admin_name}</div>
              <div style={{ opacity: 0.7 }}>{l.created_at}</div>
            </div>
          </button>
      )
      }
    </div>);

}

window.AdminDashboard = AdminDashboard;
