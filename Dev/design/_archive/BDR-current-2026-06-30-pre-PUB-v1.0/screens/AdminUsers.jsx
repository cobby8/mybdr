/* global React */
// ============================================================
// BDR v2.24 — AdminUsers (PA1 · Phase 6.1A · 신규 · BP5 · super-admin)
// 운영: /admin/users (152 line · 박제 ❌) — Phase 4 OA1 + Phase 5 CA1 답습 hub.
// 측: Site Operator (super-admin)
//
// Hero — 전체 / 활성 / 정지 / 관리자·봇 / 신규 + Site Operator badge
// 검색 + 필터 (상태 / 가입 / 활동도 / 매너) + 4 탭 + 사용자 카드 + status 모달
// 모달 = Phase 2 UD1 답습 (알림 ✅ 체크박스 + "변경 + 알림" CTA)
// 가드: 본인 자기 정지 ❌ / 결제(subscription)·은행(bank) read-only
// E 등급
// ============================================================
const PA1_TABS = [
  { key: 'active',    lbl: '활성',      ico: 'check_circle' },
  { key: 'suspended', lbl: '정지',      ico: 'block' },
  { key: 'admin',     lbl: '관리자/봇', ico: 'verified_user' },
  { key: 'new',       lbl: '신규 가입', ico: 'fiber_new' },
];
const PA1_JOIN = ['전체', '이번달', '최근 30일', '최근 90일', '1년'];
const PA1_LOGIN = ['전체', '7일', '30일', '90일+', '무로그인'];
const PA1_MANNER = ['전체', '4.5+', '3.5~4.5', '3.5-'];

function MannerStars({ rating }) {
  if (rating == null) return <span className="pm-stars pm-stars--none">평가 없음</span>;
  const tone = rating >= 4.5 ? 'ok' : rating >= 3.5 ? 'warn' : 'err';
  return <span className="pm-stars" data-tone={tone}><span className="ico material-symbols-outlined">star</span>{rating.toFixed(1)}</span>;
}

function AdminUsers() {
  const users = window.ADMIN_USERS;
  const [tab, setTab] = React.useState('active');
  const [selected, setSelected] = React.useState(null);
  const [notify, setNotify] = React.useState(true);
  const [nextStatus, setNextStatus] = React.useState('suspended');

  const counts = {
    total: users.length,
    active: users.filter(u => u.status === 'active' && !u.isAdmin).length,
    suspended: users.filter(u => u.status === 'suspended').length,
    admin: users.filter(u => u.isAdmin).length,
    new: users.filter(u => u.is_new).length,
  };

  let rows = users;
  if (tab === 'active') rows = users.filter(u => u.status === 'active');
  else if (tab === 'suspended') rows = users.filter(u => u.status === 'suspended');
  else if (tab === 'admin') rows = users.filter(u => u.isAdmin);
  else if (tab === 'new') rows = users.filter(u => u.is_new);

  const openModal = (u) => { setSelected(u); setNextStatus(u.status === 'active' ? 'suspended' : 'active'); setNotify(true); };

  return (
    <div className="oa1-page">
      {/* Hero — Site Operator + stats */}
      <header className="oa1-hero">
        <div>
          <window.OperatorBadge />
          <h1 className="oa1-hero__title" style={{ marginTop: 8 }}>유저 관리</h1>
          <div className="oa1-hero__sub">ADMIN · 사용자 · 슈퍼관리자 {counts.admin}/4</div>
        </div>
        <div className="oa1-hero__stats">
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--approved">{counts.total}</div><div className="oa1-hero__stat-lbl">전체</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--approved">{counts.active}</div><div className="oa1-hero__stat-lbl">활성</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--rejected">{counts.suspended}</div><div className="oa1-hero__stat-lbl">정지</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--pending">{counts.admin}</div><div className="oa1-hero__stat-lbl">관리자/봇</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--archived">{counts.new}</div><div className="oa1-hero__stat-lbl">신규</div></div>
        </div>
      </header>

      {/* 검색 + 필터 row */}
      <div className="oa1-filter">
        <div className="tu1-filter__search" style={{ minWidth: 220, maxWidth: 300 }}>
          <span className="ico material-symbols-outlined">search</span>
          <input placeholder="닉네임 / 이메일 / 아이디" />
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="tu1-filter__lbl">가입</span>
          <select className="ga-filter__sel">{PA1_JOIN.map(o => <option key={o}>{o}</option>)}</select>
          <span className="tu1-filter__lbl">활동</span>
          <select className="ga-filter__sel">{PA1_LOGIN.map(o => <option key={o}>{o}</option>)}</select>
          <span className="tu1-filter__lbl">매너</span>
          <select className="ga-filter__sel">{PA1_MANNER.map(o => <option key={o}>{o}</option>)}</select>
        </div>
      </div>

      {/* tabs */}
      <div className="ca1-tabs">
        {PA1_TABS.map(t => {
          const c = counts[t.key];
          return (
            <button key={t.key} className={'ca1-tab' + (tab === t.key ? ' is-on' : '')} data-active={tab === t.key} onClick={() => setTab(t.key)}>
              <span className="ico material-symbols-outlined">{t.ico}</span>{t.lbl}
              <span className="ca1-tab__count">{c}</span>
            </button>
          );
        })}
      </div>

      {/* user table */}
      <div className="oa1-table">
        <div className="pm-utable__head">
          <div>사용자</div><div>상태</div><div>매너 · 최근접속</div><div>경기 · 호스트</div><div>우승</div><div>액션</div>
        </div>
        {rows.map(u => (
          <div key={u.id} className="pm-utable__row" data-me={u.is_me ? 'true' : 'false'} onClick={() => openModal(u)}>
            <div className="pm-u-user" data-label="사용자">
              <span className="pm-u-av" data-suspended={u.status === 'suspended'}>{u.avatar}</span>
              <div style={{ minWidth: 0 }}>
                <div className="pm-u-name">{u.nickname} {u.is_me && <span className="pm-u-me">나</span>}</div>
                <div className="pm-u-handle">@{u.public_id} · {window.pmDateShort(u.created)} 가입</div>
              </div>
            </div>
            <div data-label="상태"><window.UserStatusBadge status={u.status} isAdmin={u.isAdmin} isOfficial={u.is_official} /></div>
            <div data-label="매너 · 접속">
              <MannerStars rating={u.rating} />
              <div className="pm-u-handle" style={{ marginTop: 2 }}>{window.pmRelLogin(u.last_login)}</div>
            </div>
            <div className="pm-u-stat" data-label="경기 · 호스트">경기 {u.games} · 호스트 {u.hosted}</div>
            <div className="pm-u-stat" data-label="우승">{u.titles > 0 ? '🏆 ' + u.titles : '—'}</div>
            <div className="pm-u-actions" data-label="액션" onClick={(e) => e.stopPropagation()}>
              {u.is_me
                ? <span className="pm-readonly"><span className="ico material-symbols-outlined">person</span>본인</span>
                : u.status === 'suspended'
                  ? <button className="btn btn--sm btn--primary" onClick={() => openModal(u)}>활성 복구</button>
                  : <button className="btn btn--sm btn-suspend" onClick={() => openModal(u)}>상태 변경</button>}
            </div>
          </div>
        ))}
        {rows.length === 0 && <div className="pm-empty"><span className="ico material-symbols-outlined">group_off</span><p>해당 조건의 사용자가 없습니다</p></div>}
      </div>

      {/* status 변경 모달 (Phase 2 UD1 답습) */}
      {selected && (
        <section className="oa1-modal-stage" aria-modal="true">
          <div className="oa1-modal">
            <div className="oa1-modal__head">
              <div className="oa1-modal__head-body">
                <h3 className="oa1-modal__title">사용자 검수 <window.UserStatusBadge status={selected.status} isAdmin={selected.isAdmin} isOfficial={selected.is_official} /></h3>
                <div className="oa1-modal__sub">@{selected.public_id} · {selected.email}</div>
              </div>
              <button className="oa1-modal__close" onClick={() => setSelected(null)} aria-label="닫기"><span className="ico material-symbols-outlined">close</span></button>
            </div>

            <div className="oa1-modal__body">
              {/* 사용자 정보 */}
              <div className="ou2-card" style={{ padding: 0, border: 0, marginBottom: 14 }}>
                <h4 className="ou2-card__h" style={{ margin: '0 0 8px' }}><span className="ico material-symbols-outlined">person</span>사용자 정보</h4>
                <div className="ou2-info-row"><span className="ou2-info-row__l">닉네임</span><span className="ou2-info-row__v" style={{ fontWeight: 700, color: 'var(--ink)' }}>{selected.nickname}</span></div>
                <div className="ou2-info-row"><span className="ou2-info-row__l">매너 평점</span><span className="ou2-info-row__v"><MannerStars rating={selected.rating} /></span></div>
                <div className="ou2-info-row"><span className="ou2-info-row__l">활동</span><span className="ou2-info-row__v" style={{ fontFamily: 'var(--ff-mono)' }}>경기 {selected.games} · 호스트 {selected.hosted} · 우승 {selected.titles}</span></div>
                <div className="ou2-info-row"><span className="ou2-info-row__l">최근 접속</span><span className="ou2-info-row__v">{window.pmRelLogin(selected.last_login)} · {window.pmDateShort(selected.last_login)}</span></div>
                <div className="ou2-info-row"><span className="ou2-info-row__l">결제·은행</span><span className="ou2-info-row__v"><span className="pm-readonly"><span className="ico material-symbols-outlined">lock</span>읽기 전용 (수정 불가)</span></span></div>
              </div>

              {/* 본인 자기 정지 ❌ 가드 OR 상태 변경 */}
              {selected.is_me ? (
                <div className="pm-guard"><span className="ico material-symbols-outlined">shield_person</span>본인 계정은 정지·권한 변경할 수 없습니다 (자기 정지 방지).</div>
              ) : selected.isAdmin ? (
                <div className="pm-guard"><span className="ico material-symbols-outlined">admin_panel_settings</span>관리자/봇 계정 검수는 별도 super-admin 권한이 필요합니다 (준비 중).</div>
              ) : (
                <div className="ou2-card" style={{ padding: 0, border: 0 }}>
                  <h4 className="ou2-card__h" style={{ margin: '0 0 8px' }}><span className="ico material-symbols-outlined">gavel</span>상태 변경</h4>
                  <label className={'pm-radio-row' + (nextStatus === 'active' ? ' is-on' : '')}>
                    <input type="radio" name="pa1-status" checked={nextStatus === 'active'} onChange={() => setNextStatus('active')} />
                    <div><div className="pm-radio-row__t">활성 (active)</div><div className="pm-radio-row__d">정상 이용 — 모든 기능 사용 가능</div></div>
                  </label>
                  <label className={'pm-radio-row' + (nextStatus === 'suspended' ? ' is-on' : '')}>
                    <input type="radio" name="pa1-status" checked={nextStatus === 'suspended'} onChange={() => setNextStatus('suspended')} />
                    <div><div className="pm-radio-row__t">정지 (suspended)</div><div className="pm-radio-row__d">로그인·경기 신청 제한 · 정지 사유 안내</div></div>
                  </label>
                  {nextStatus === 'suspended' && (
                    <div className="pm-field" style={{ marginTop: 12, marginBottom: 0 }}>
                      <label className="pm-field__l">정지 사유 (사용자 안내용)</label>
                      <input className="pm-input" placeholder="매너 신고 누적 / 광고성 활동 등" />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 알림 체크박스 + Footer CTA */}
            {!selected.is_me && !selected.isAdmin && (
              <div className="oa1-modal__foot">
                <div className="oa1-modal__notify">
                  <input type="checkbox" checked={notify} onChange={() => setNotify(!notify)} id="pa1-notify" />
                  <div>
                    <strong>변경 결과를 사용자에게 알림 발송</strong>
                    <div style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, color: 'var(--ink-mute)', marginTop: 2, letterSpacing: '0.02em' }}>카카오 알림톡 + 이메일 ({selected.nickname})</div>
                  </div>
                </div>
                <div className="oa1-modal__cta">
                  <button className="btn btn--sm" onClick={() => setSelected(null)}>취소</button>
                  {nextStatus === 'suspended'
                    ? <button className="btn btn--sm btn-reject"><span className="ico material-symbols-outlined">block</span>정지 + 알림</button>
                    : <button className="btn btn--sm btn--primary"><span className="ico material-symbols-outlined">check</span>활성 + 알림</button>}
                </div>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

window.AdminUsers = AdminUsers;
