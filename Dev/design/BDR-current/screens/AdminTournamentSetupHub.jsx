/* global React, AdminShell, AdminProgressBar, AdminChecklistCard */

// =====================================================================
// AdminTournamentSetupHub.jsx — Admin-E · 대회 설정 hub (v2.14 신규)
//   진입: setRoute('adminTournamentSetupHub')  (운영 /tournament-admin/tournaments/[id])
//   복귀: setRoute('adminTournamentAdminList')
//
// 운영 5/14 commit 반영:
//   - c3474db UI-1: 8 항목 체크리스트 hub + 진행도 바 + 공개 가드
//   - 3d8d5bf UI-5: 공개 게이트 7 항목 (1·3·4·5·6·7·8 — 2 시리즈는 선택)
//
// 패턴: 진행도 바 (상단) + 8 카드 grid (2x4) + 하단 공개 버튼 + 보조 액션 4
// 차별화: progression mock (3/8 / 7/8 / 8/8 단계 토글 가능)
// =====================================================================

const TSH_TOURNAMENT = {
  tournament_id: 'tn_2026_summer_4',
  name: 'BDR 서머 오픈 #4',
  series: 'BDR 서머 오픈 시리즈',
  edition: 4,
  d_day: 31,
  status: 'live',
  status_label: '진행중',
  status_tone: 'ok',
  starts_at: '2026-06-15'
};

// 8 항목 정의 (운영 명세 그대로)
const TSH_ITEMS = [
{ num: '1', key: 'basic', label: '기본 정보', icon: 'info', desc: '대회명·시작일·경기장 등 핵심 정보', required: true, depends_on: null },
{ num: '2', key: 'series', label: '시리즈 연결', icon: 'collections_bookmark', desc: '시리즈에 연결하거나 단독 운영', required: false, depends_on: null },
{ num: '3', key: 'divisions', label: '종별 정의', icon: 'category', desc: '오픈·U18 등 종별 1건 이상 정의', required: true, depends_on: null },
{ num: '4', key: 'format', label: '운영 방식', icon: 'tune', desc: '토너먼트·리그 형식 + 그룹 설정', required: true, depends_on: '3' },
{ num: '5', key: 'apply_policy', label: '신청 정책', icon: 'how_to_reg', desc: '최대 팀 수·참가비·자동 승인', required: true, depends_on: null },
{ num: '6', key: 'site', label: '사이트 설정', icon: 'public', desc: '공개 사이트 메타데이터·서브도메인', required: true, depends_on: '1' },
{ num: '7', key: 'recording', label: '기록 설정', icon: 'edit_note', desc: '기본 기록 방식 (점수 시트·앱)', required: true, depends_on: '4' },
{ num: '8', key: 'bracket', label: '대진표 생성', icon: 'account_tree', desc: '경기 1건 이상 생성', required: true, depends_on: '4' }];


// progression 단계별 mock — 각 항목의 status 매핑
const TSH_PROGRESSION = {
  '3/8': {
    basic: 'done', series: 'done', divisions: 'done',
    format: 'idle', apply_policy: 'idle', site: 'idle', recording: 'locked', bracket: 'locked'
  },
  '7/8': {
    basic: 'done', series: 'done', divisions: 'done',
    format: 'done', apply_policy: 'done', site: 'done', recording: 'done', bracket: 'progress'
  },
  '8/8': {
    basic: 'done', series: 'done', divisions: 'done',
    format: 'done', apply_policy: 'done', site: 'done', recording: 'done', bracket: 'done'
  },
  '0/8': {
    basic: 'idle', series: 'idle', divisions: 'idle',
    format: 'locked', apply_policy: 'idle', site: 'locked', recording: 'locked', bracket: 'locked'
  }
};

function AdminTournamentSetupHub({ setRoute, theme, setTheme }) {
  const [adminRole, setAdminRole] = React.useState('tournament_admin');
  const [progression, setProgression] = React.useState('7/8');
  const [isPublished, setIsPublished] = React.useState(false);
  const [publishToast, setPublishToast] = React.useState(false);

  const statusMap = TSH_PROGRESSION[progression];
  const t = TSH_TOURNAMENT;

  // 항목별 status 계산 (depends_on 잠금 자동 반영)
  const itemsWithStatus = TSH_ITEMS.map((it) => ({
    ...it,
    status: statusMap[it.key],
    locked_reason: statusMap[it.key] === 'locked' ?
    `${it.depends_on}. ${TSH_ITEMS.find((x) => x.num === it.depends_on)?.label} 선행 필요` :
    null
  }));

  // 완료 카운트
  const requiredItems = itemsWithStatus.filter((i) => i.required);
  const completedRequired = requiredItems.filter((i) => i.status === 'done').length;
  const totalItems = itemsWithStatus.filter((i) => i.status === 'done').length;
  const canPublish = completedRequired === requiredItems.length;
  const missingRequired = requiredItems.filter((i) => i.status !== 'done').map((i) => `${i.num}. ${i.label}`);

  const handlePublish = () => {
    if (!canPublish) return;
    setIsPublished(true);
    setPublishToast(true);
    setTimeout(() => setPublishToast(false), 3000);
  };

  const dashTopbarRight =
  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
      <div style={{ padding: '4px 10px', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 4, display: 'flex', gap: 6, alignItems: 'center', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)' }}>
        <span style={{ fontWeight: 700, color: 'var(--accent)' }}>PROG</span>
        <select value={progression} onChange={(e) => { setProgression(e.target.value); setIsPublished(false); }} style={{ fontSize: 11, padding: '2px 4px', border: 0, background: 'transparent', color: 'inherit' }}>
          <option value="0/8">D · 0/8 (신규 draft)</option>
          <option value="3/8">D · 3/8 (초반)</option>
          <option value="7/8">D · 7/8 (거의 완료)</option>
          <option value="8/8">D · 8/8 (전부 완료)</option>
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
    <AdminShell
      route="adminTournamentSetupHub"
      setRoute={setRoute}
      eyebrow="ADMIN · 대회 운영"
      title={t.name}
      subtitle={`${t.series} #${t.edition} · 본선 ${t.starts_at} · D-${t.d_day}`}
      adminRole={adminRole}
      setAdminRole={setAdminRole}
      theme={theme}
      setTheme={setTheme}
      topbarRight={dashTopbarRight}
      breadcrumbs={[
      { label: 'ADMIN', onClick: () => setRoute('adminDashboard') },
      { label: '대회 운영자 도구', onClick: () => setRoute('adminTournamentAdminHome') },
      { label: '내 대회', onClick: () => setRoute('adminTournamentAdminList') },
      { label: t.name }]
      }
      actions={
      <>
          <button type="button" className="btn" onClick={() => setRoute('adminTournamentEditWizard')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>edit</span>
            wizard 로 수정
          </button>
          <button type="button" className="btn" onClick={() => setRoute('adminTournamentAuditLog')}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>history</span>
            감사 로그
          </button>
        </>
      }>

      {/* publish toast */}
      {publishToast &&
      <div style={{ position: 'fixed', top: 80, right: 24, zIndex: 100, background: 'var(--ok)', color: '#fff', padding: '12px 16px', borderRadius: 4, display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>check_circle</span>
          <span style={{ fontSize: 13, fontWeight: 600 }}>대회가 공개되었습니다.</span>
        </div>
      }

      {/* ─────── 상단 · 진행도 바 ─────── */}
      <section style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <span className="admin-stat-pill" data-tone={isPublished ? 'ok' : 'mute'}>
            <span className="material-symbols-outlined" style={{ fontSize: 11 }}>{isPublished ? 'public' : 'lock'}</span>
            {isPublished ? '공개' : '비공개'}
          </span>
          <span className="admin-stat-pill" data-tone={t.status_tone}>{t.status_label}</span>
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '4px 10px', background: 'var(--bg-alt)', borderRadius: 4,
            fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)'
          }}>
            D−{t.d_day}
          </div>
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)', marginLeft: 'auto' }}>{t.tournament_id}</span>
        </div>
        <AdminProgressBar
          completed={totalItems}
          total={8}
          label="설정 체크리스트"
          tone={canPublish ? 'ok' : 'accent'} />

        {!canPublish && missingRequired.length > 0 &&
        <div style={{ marginTop: 10, fontSize: 11.5, color: 'var(--ink-mute)' }}>
            <span style={{ color: 'var(--accent)', fontWeight: 600 }}>공개까지 남은 필수 항목:</span>{' '}
            {missingRequired.join(', ')}
          </div>
        }
      </section>

      {/* ─────── 8 체크리스트 카드 grid (2x4) ─────── */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10, marginBottom: 16 }}>
        {itemsWithStatus.map((it) =>
        <AdminChecklistCard
          key={it.num}
          num={it.num}
          label={it.label}
          desc={it.desc}
          icon={it.icon}
          status={it.status}
          required={it.required}
          locked_reason={it.locked_reason}
          onClick={() => {
            // mock — 운영에선 각 항목의 상세 폼 페이지로 이동
            // E-10 / E-11 wizard 진입 또는 별도 상세 페이지
            if (it.key === 'basic' || it.key === 'apply_policy') setRoute('adminTournamentEditWizard');
            else if (it.key === 'site') setRoute('adminTournamentDetail'); // mock — 운영 / E-7
          }} />

        )}
      </section>

      {/* ─────── 하단 공개 버튼 + 보조 액션 ─────── */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {/* 좌 — 공개 가드 */}
        <div style={{ ...cardStyle, ...canPublish ? { borderLeft: '3px solid var(--ok)' } : { borderLeft: '3px solid var(--warn, var(--accent))' } }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 20, color: canPublish ? 'var(--ok)' : 'var(--accent)' }}>
              {canPublish ? 'verified' : 'pending'}
            </span>
            <span style={{ fontWeight: 700, fontSize: 14 }}>공개 게이트</span>
          </div>
          <p style={{ margin: '0 0 12px 0', fontSize: 12.5, color: 'var(--ink-mute)', lineHeight: 1.6 }}>
            필수 7항목 (1·3·4·5·6·7·8) 이 모두 완료되어야 공개할 수 있습니다. 시리즈 (2) 는 선택 항목입니다.
          </p>
          <button
            type="button"
            disabled={!canPublish || isPublished}
            onClick={handlePublish}
            className="btn btn--primary"
            style={{
              width: '100%', justifyContent: 'center',
              opacity: !canPublish || isPublished ? 0.5 : 1,
              cursor: !canPublish || isPublished ? 'not-allowed' : 'pointer'
            }}>

            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>{isPublished ? 'check_circle' : 'public'}</span>
            {isPublished ? '공개 완료' : canPublish ? '공개하기' : `미완료 (${requiredItems.length - completedRequired}건)`}
          </button>
        </div>

        {/* 우 — 보조 액션 4 */}
        <div style={cardStyle}>
          <div style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontWeight: 600 }}>관련 페이지</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <SubAction icon="groups" label="참가팀" desc="38팀" onClick={() => {}} />
            <SubAction icon="manage_accounts" label="관리자" desc="3명" onClick={() => {}} />
            <SubAction icon="edit_note" label="기록원" desc="2명" onClick={() => {}} />
            <SubAction icon="public" label="공개 사이트" desc={isPublished ? '미리보기' : '비공개'} onClick={() => {}} disabled={!isPublished} />
          </div>
        </div>
      </section>
    </AdminShell>);

}

function SubAction({ icon, label, desc, onClick, disabled }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: 10, background: 'var(--bg-alt)',
        border: 0, borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        textAlign: 'left', fontFamily: 'inherit'
      }}>

      <div style={{ width: 28, height: 28, borderRadius: 4, background: 'var(--bg-card)', display: 'grid', placeItems: 'center' }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-soft)' }}>{icon}</span>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--ink)' }}>{label}</div>
        <div style={{ fontSize: 10.5, color: 'var(--ink-mute)' }}>{desc}</div>
      </div>
      <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--ink-mute)' }}>chevron_right</span>
    </button>);

}

const cardStyle = { background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 6, padding: 16 };

window.AdminTournamentSetupHub = AdminTournamentSetupHub;
