/* global React, AdminShell, AdminStatusTabs, AdminFilterBar, AdminEmptyState */

// =====================================================================
// AdminTournamentMatches.jsx — Admin-E · 경기 목록 (v2.15 신규)
//   진입: setRoute('adminTournamentMatches')
//   복귀: setRoute('adminTournamentSetupHub')
//
// 패턴: 일자별 그룹화된 경기 카드 list (DataTable 대신 timeline 스타일)
//   각 카드 = 시간 / 코트 / 종별 / 양팀 / 점수 / 기록원 / 상태
//   상태: scheduled / live / done / canceled
// 운영 source: src/app/(admin)/tournament-admin/tournaments/[id]/matches/page.tsx
// =====================================================================

const TM_TOURNAMENT = { tournament_id: 'tn_2026_summer_4', name: 'BDR 서머 오픈 #4' };

const TM_DATA = [
{ match_id: 'm_001', date: '2026-06-15', time: '13:00', court: '잠실 1번', division: '오픈', group: 'A조 1경기',
  a: '강남 윙스', b: '서초 라이저', a_score: 72, b_score: 68, status: 'done', status_label: '완료', status_tone: 'mute',
  recorder: '박기록', stream_url: null },
{ match_id: 'm_002', date: '2026-06-15', time: '14:30', court: '잠실 1번', division: '오픈', group: 'B조 1경기',
  a: '신촌 ULSAN', b: '한양 메디컬', a_score: 64, b_score: 64, status: 'live', status_label: '진행중', status_tone: 'ok',
  recorder: '정현우', stream_url: 'https://stream.bdr.kr/m_002' },
{ match_id: 'm_003', date: '2026-06-15', time: '16:00', court: '잠실 2번', division: '오픈', group: 'A조 2경기',
  a: '용산 베어스', b: '강동 샤크', a_score: null, b_score: null, status: 'scheduled', status_label: '예정', status_tone: 'info',
  recorder: '서민기', stream_url: null },
{ match_id: 'm_004', date: '2026-06-15', time: '17:30', court: '잠실 1번', division: 'U18', group: 'A조 1경기',
  a: '관악 펠리컨', b: '성동 그리즐리', a_score: null, b_score: null, status: 'scheduled', status_label: '예정', status_tone: 'info',
  recorder: null, stream_url: null },
{ match_id: 'm_005', date: '2026-06-16', time: '13:00', court: '잠실 1번', division: '오픈', group: 'C조 1경기',
  a: '마포 호크스', b: '잠실 토네이도', a_score: null, b_score: null, status: 'scheduled', status_label: '예정', status_tone: 'info',
  recorder: null, stream_url: null },
{ match_id: 'm_006', date: '2026-06-16', time: '14:30', court: '잠실 2번', division: '오픈', group: 'D조 1경기',
  a: '분당 캡틴', b: '안양 라이트닝', a_score: null, b_score: null, status: 'scheduled', status_label: '예정', status_tone: 'info',
  recorder: '박기록', stream_url: null },
{ match_id: 'm_007', date: '2026-06-16', time: '16:00', court: '잠실 1번', division: 'U15', group: '결승',
  a: '동작 미니히어로', b: '광진 호빗즈', a_score: null, b_score: null, status: 'canceled', status_label: '취소', status_tone: 'err',
  recorder: null, stream_url: null, cancel_reason: '한 팀 기권' }];



function AdminTournamentMatches({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [mockState, setMockState] = React.useState('filled');
  const [statusTab, setStatusTab] = React.useState('all');
  const [divFilter, setDivFilter] = React.useState('all');
  const [search, setSearch] = React.useState('');

  const filtered = React.useMemo(() => {
    if (mockState === 'empty') return [];
    let rows = TM_DATA.slice();
    if (statusTab !== 'all') rows = rows.filter((r) => r.status === statusTab);
    if (divFilter !== 'all') rows = rows.filter((r) => r.division === divFilter);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((r) => r.a.toLowerCase().includes(q) || r.b.toLowerCase().includes(q) || (r.group || '').toLowerCase().includes(q));
    }
    return rows;
  }, [statusTab, divFilter, search, mockState]);

  const counts = React.useMemo(() => {
    const base = mockState === 'empty' ? [] : TM_DATA;
    const by = (k) => base.filter((r) => r.status === k).length;
    return { all: base.length, scheduled: by('scheduled'), live: by('live'), done: by('done'), canceled: by('canceled') };
  }, [mockState]);

  // 일자별 그룹화
  const grouped = React.useMemo(() => {
    const map = {};
    filtered.forEach((m) => {
      (map[m.date] = map[m.date] || []).push(m);
    });
    return Object.entries(map).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filtered]);

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>MOCK</span>
        <select value={mockState} onChange={(e) => setMockState(e.target.value)} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="filled">D · filled</option>
          <option value="empty">D · empty</option>
        </select>
      </div>
      <button className="admin-user" type="button">
        <div className="admin-user__avatar">OY</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.2 }}>
          <span style={{ fontWeight: 600, fontSize: 13 }}>오영진</span>
          <span className="admin-user__role">tournament admin</span>
        </div>
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--ink-mute)' }}>expand_more</span>
      </button>
    </div>;


  return (
    <AdminShell route="adminTournamentMatches" setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영" title="경기 목록"
      subtitle={`${TM_TOURNAMENT.name} · 총 ${counts.all}경기 · 진행중 ${counts.live} · 완료 ${counts.done}`}
      adminRole={adminRole} setAdminRole={setAdminRole} theme={theme} setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: TM_TOURNAMENT.name, onClick: () => setRoute('adminTournamentSetupHub') },
      { label: '경기' }]
      }
      actions={
      <>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>file_download</span>
            일정 PDF
          </button>
          <button type="button" className="btn">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>schedule</span>
            일정 재배치
          </button>
        </>
      }>

      <AdminStatusTabs
        tabs={[
        { key: 'all', label: '전체', count: counts.all },
        { key: 'scheduled', label: '예정', count: counts.scheduled },
        { key: 'live', label: '진행중', count: counts.live },
        { key: 'done', label: '완료', count: counts.done },
        { key: 'canceled', label: '취소', count: counts.canceled }]
        }
        current={statusTab} onChange={setStatusTab} />


      <AdminFilterBar
        search={{ value: search, onChange: setSearch, placeholder: '팀명·그룹 검색' }}
        filters={[
        { key: 'division', label: '종별', value: divFilter, onChange: setDivFilter,
          options: [
          { value: 'all', label: '전체' },
          { value: '오픈', label: '오픈' },
          { value: 'U18', label: 'U18' },
          { value: 'U15', label: 'U15' }] }]

        }
        onReset={() => { setSearch(''); setDivFilter('all'); setStatusTab('all'); }} />


      {grouped.length === 0 ?
      <AdminEmptyState icon="sports_basketball" title="조건에 맞는 경기가 없어요"
        description={mockState === 'empty' ? '대진표를 먼저 생성하면 경기가 표시됩니다.' : '필터를 초기화하거나 다른 조건을 입력하세요.'}
        ctaLabel={mockState === 'empty' ? '대진표 생성' : '필터 초기화'}
        onCta={() => mockState === 'empty' ? setRoute('adminTournamentBracket') : (setSearch(''), setDivFilter('all'), setStatusTab('all'))} /> :


      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {grouped.map(([date, matches]) =>
        <div key={date}>
              {/* 일자 헤더 */}
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8, paddingBottom: 8, borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 16, fontWeight: 700, color: 'var(--ink)' }}>
                  {date}
                </span>
                <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>
                  ({formatWeekday(date)}) · {matches.length}경기
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {matches.map((m) =>
            <MatchRow key={m.match_id} m={m} />
            )}
              </div>
            </div>
        )}
        </div>
      }
    </AdminShell>);

}

function MatchRow({ m }) {
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '80px 100px 1fr 90px 1fr 120px 100px 24px',
      alignItems: 'center', gap: 10,
      background: m.status === 'live' ? 'var(--bg-card)' : 'var(--bg-card)',
      border: m.status === 'live' ? '1px solid var(--accent)' : '1px solid var(--border)',
      borderRadius: 4,
      padding: '12px 14px',
      cursor: 'pointer'
    }}>
      {/* time */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 15, fontWeight: 700, color: 'var(--ink)' }}>{m.time}</span>
        <span style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 11, verticalAlign: 'middle' }}>place</span>
          {m.court}
        </span>
      </div>
      {/* division + group */}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span className="admin-stat-pill" data-tone="mute" style={{ fontSize: 9.5, alignSelf: 'flex-start' }}>{m.division}</span>
        <span style={{ fontSize: 11, color: 'var(--ink-mute)', marginTop: 4 }}>{m.group}</span>
      </div>
      {/* team A */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 10 }}>
        <span style={{ fontWeight: m.status === 'done' && m.a_score > m.b_score ? 700 : 500, color: 'var(--ink)', textAlign: 'right' }}>{m.a}</span>
        <span style={{
          fontFamily: 'var(--ff-mono)', fontSize: 18, fontWeight: 700, minWidth: 30, textAlign: 'right',
          color: m.a_score == null ? 'var(--ink-dim)' : m.status === 'done' && m.a_score > m.b_score ? 'var(--ink)' : 'var(--ink-soft)'
        }}>{m.a_score ?? '—'}</span>
      </div>
      {/* vs / status */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 10, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)' }}>VS</div>
        {m.status === 'live' &&
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 6px', background: 'var(--accent)', color: '#fff', borderRadius: 3, fontSize: 9.5, fontWeight: 700, fontFamily: 'var(--ff-mono)', marginTop: 4, animation: 'pulse 1.5s infinite' }}>
            <span style={{ width: 5, height: 5, background: '#fff', borderRadius: 50 }} />
            LIVE
          </div>
        }
      </div>
      {/* team B */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: 10 }}>
        <span style={{
          fontFamily: 'var(--ff-mono)', fontSize: 18, fontWeight: 700, minWidth: 30,
          color: m.b_score == null ? 'var(--ink-dim)' : m.status === 'done' && m.b_score > m.a_score ? 'var(--ink)' : 'var(--ink-soft)'
        }}>{m.b_score ?? '—'}</span>
        <span style={{ fontWeight: m.status === 'done' && m.b_score > m.a_score ? 700 : 500, color: 'var(--ink)' }}>{m.b}</span>
      </div>
      {/* recorder */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
        {m.recorder ?
        <>
            <span className="material-symbols-outlined" style={{ fontSize: 13, color: 'var(--ink-soft)' }}>edit_note</span>
            <span style={{ color: 'var(--ink-soft)' }}>{m.recorder}</span>
          </> :

        <span style={{ color: 'var(--err)', fontWeight: 600 }}>기록원 미배정</span>
        }
      </div>
      {/* status */}
      <div style={{ textAlign: 'right' }}>
        <span className="admin-stat-pill" data-tone={m.status_tone}>{m.status_label}</span>
        {m.cancel_reason && <div style={{ fontSize: 9.5, color: 'var(--err)', marginTop: 2 }}>{m.cancel_reason}</div>}
      </div>
      {/* chevron */}
      <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>chevron_right</span>
    </div>);

}

function formatWeekday(dateStr) {
  const d = new Date(dateStr);
  const wd = ['일', '월', '화', '수', '목', '금', '토'][d.getDay()];
  return wd;
}

window.AdminTournamentMatches = AdminTournamentMatches;
