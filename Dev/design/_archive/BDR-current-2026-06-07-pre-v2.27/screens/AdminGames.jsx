/* global React */
// ============================================================
// BDR v2.20 — AdminGames (Phase 2A · UD1)
// 운영 박제 대상: /admin/games
// 진입: 관리자 sidebar '경기' → AdminGames / super_admin only
// 복귀: AdminShell 어디든 / 행 클릭 → /admin/games/[id] (별 phase)
// 에러: pending_apps null = 0 표시 / last_changed_by null = '-'
//
// BG1 = status 변경 모달 + 알림 체크박스 (UA2 GameDetail step + UC1 마이 와 같은 데이터)
// BG5 = 액션 출처 컬럼 (호스트 🏠 / super_admin 🛡️ / 시스템 🤖) + filter
// E 등급 (AppNav 적용 외)
// ============================================================

function AdminGames() {
  const [openModal, setOpenModal] = React.useState(false);
  const [modalGame, setModalGame] = React.useState(null);
  const [srcFilter, setSrcFilter] = React.useState('all');
  const list = window.ADMIN_GAMES_LIST || [];
  const filtered = srcFilter === 'all' ? list : list.filter(g => g.last_changed_by?.role === srcFilter);
  const totalPending = list.reduce((s, g) => s + (g.pending_apps || 0), 0);

  return (
    <div className="admin-page">
      <div className="admin-page__inner">
        <header className="admin-page__head">
          <div className="admin-page__title-row">
            <div>
              <div className="admin-page__eyebrow">UD1 · /admin/games</div>
              <h1 className="admin-page__title">전체 경기 관리</h1>
              <p className="admin-page__sub">
                BG1 status 변경 모달 + 알림 발송 / BG5 액션 출처 컬럼 + filter.
                {totalPending > 0 && <strong style={{color:'var(--accent)', marginLeft:8}}>
                  · 신청 대기 {totalPending}건
                </strong>}
              </p>
            </div>
            <div className="admin-page__actions">
              <button className="btn btn--sm"><span className="ico material-symbols-outlined">file_download</span>CSV</button>
              <button className="btn btn--sm btn--primary"><span className="ico material-symbols-outlined">add</span>경기 생성</button>
            </div>
          </div>
        </header>

        {/* BG1 — 신청 대기 알림 큐 (상단 배너) */}
        {totalPending > 0 && (
          <div className="atm-notify-bar" style={{marginTop:0, marginBottom:14}}>
            <div className="atm-notify-bar__left">
              <span className="ico material-symbols-outlined">notifications_active</span>
              <div>
                <div className="atm-notify-bar__title">신청 대기 {totalPending}건 — 호스트 승인 필요</div>
                <div className="atm-notify-bar__sub">사용자에게 알림 발송됨 / 마이페이지 "내 경기" 와 동기</div>
              </div>
            </div>
            <div className="atm-notify-bar__right">
              <button className="btn btn--sm">대기 큐만 보기</button>
            </div>
          </div>
        )}

        {/* Filter toolbar — BG5 출처 filter 신규 */}
        <div className="atm-toolbar">
          <span className="atm-toolbar__lbl">상태</span>
          <button className="atm-toolbar__chip is-on">전체 <span className="atm-toolbar__count">{list.length}</span></button>
          <button className="atm-toolbar__chip">모집중 <span className="atm-toolbar__count">3</span></button>
          <button className="atm-toolbar__chip">라이브 <span className="atm-toolbar__count">1</span></button>
          <button className="atm-toolbar__chip">종료 <span className="atm-toolbar__count">1</span></button>
          <button className="atm-toolbar__chip">취소 <span className="atm-toolbar__count">1</span></button>

          <span className="atm-toolbar__lbl" style={{marginLeft:14, borderLeft:'1px solid var(--border)', paddingLeft:14}}>출처 (BG5)</span>
          {[
            ['all', '전체'],
            ['host', '🏠 호스트'],
            ['admin', '🛡️ super_admin'],
            ['system', '🤖 시스템'],
          ].map(([k, lbl]) => (
            <button key={k} className={'atm-toolbar__chip' + (srcFilter === k ? ' is-on' : '')} onClick={() => setSrcFilter(k)}>
              {lbl}
            </button>
          ))}

          <div className="atm-toolbar__search">
            <span className="ico material-symbols-outlined">search</span>
            <input placeholder="경기명, 호스트 검색" />
          </div>
        </div>

        {/* 테이블 */}
        <div className="atm-table-wrap">
          <table className="atm-table">
            <thead>
              <tr>
                <th>경기명</th>
                <th>종별</th>
                <th>시작</th>
                <th>인원</th>
                <th>상태</th>
                <th>신청 대기</th>
                <th>최근 변경자 (BG5)</th>
                <th style={{textAlign:'right'}}>액션</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(g => (
                <tr key={g.id}>
                  <td>
                    <div className="atm-table__team">{g.title}</div>
                    <div className="atm-table__captain">{g.host_name} · {g.city}</div>
                  </td>
                  <td><window.GMKindBadge kind={g.kind} /></td>
                  <td style={{fontFamily:'var(--ff-mono)', fontSize:12, color:'var(--ink-soft)'}}>{g.starts_at}</td>
                  <td style={{fontFamily:'var(--ff-mono)', fontWeight:700}}>{g.spots}</td>
                  <td>
                    <window.GMStatusBadge
                      status={g.status === 3 ? 'completed' : g.status === 2 ? 'cancelled' : (g.status_label === '라이브' ? 'live' : 'open')}
                      label={g.status_label}
                    />
                  </td>
                  <td>
                    {g.pending_apps > 0 ? (
                      <span style={{
                        display:'inline-flex', alignItems:'center', gap:4,
                        background:'var(--accent-soft)', color:'var(--accent)',
                        padding:'2px 8px', borderRadius:'var(--r-xs)',
                        fontFamily:'var(--ff-mono)', fontSize:12, fontWeight:800,
                      }}>
                        <span className="ico material-symbols-outlined" style={{fontSize:14}}>person_add</span>
                        {g.pending_apps}
                      </span>
                    ) : (
                      <span style={{color:'var(--ink-dim)', fontFamily:'var(--ff-mono)', fontSize:12}}>—</span>
                    )}
                  </td>
                  <td>
                    {g.last_changed_by ? <ActionSource src={g.last_changed_by} /> : <span style={{color:'var(--ink-dim)'}}>—</span>}
                  </td>
                  <td style={{textAlign:'right'}}>
                    <div className="atm-action-row" style={{justifyContent:'flex-end'}}>
                      <button
                        className="btn btn--sm"
                        onClick={() => { setModalGame(g); setOpenModal(true); }}
                      >
                        상태 변경
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* BG1 — 상태 변경 모달 */}
        {openModal && modalGame && (
          <StatusChangeModal game={modalGame} onClose={() => setOpenModal(false)} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// ActionSource — BG5 액션 출처 (호스트 / super_admin / 시스템)
// ============================================================
function ActionSource({ src }) {
  const icon = { host:'🏠', admin:'🛡️', system:'🤖' }[src.role] || '·';
  return (
    <div className={'act-src act-src--' + src.role}>
      <span className="act-src__icon">{icon}</span>
      <span className="act-src__name">{src.name}</span>
      {src.note && <span className="act-src__note">{src.note}</span>}
      <span className="act-src__time">{src.at}</span>
    </div>
  );
}

// ============================================================
// StatusChangeModal — BG1 핵심
// "사용자에게 알림 보내기" 체크박스 (기본 ✅)
// ============================================================
function StatusChangeModal({ game, onClose }) {
  const [notify, setNotify] = React.useState(true);
  const [newStatus, setNewStatus] = React.useState('1');
  const [reason, setReason] = React.useState('');

  return (
    <div style={{
      position:'fixed', inset:0, background:'rgba(15,23,42,.5)',
      display:'flex', alignItems:'center', justifyContent:'center',
      zIndex:100, padding:20,
    }} onClick={onClose}>
      <div style={{
        background:'var(--bg-elev)', borderRadius:'var(--r-md)',
        maxWidth:520, width:'100%', boxShadow:'var(--sh-md)',
        overflow:'hidden',
      }} onClick={e => e.stopPropagation()}>
        {/* Modal head */}
        <header style={{
          padding:'18px 22px',
          borderBottom:'1px solid var(--border)',
          display:'flex', alignItems:'center', justifyContent:'space-between',
        }}>
          <div>
            <div style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:800, color:'var(--accent)', letterSpacing:'0.1em'}}>STATUS 변경 — BG1</div>
            <h2 style={{margin:'4px 0 0', fontFamily:'var(--ff-display)', fontSize:18, fontWeight:800}}>{game.title}</h2>
            <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>현재 — <window.GMStatusBadge status={game.status_label === '라이브' ? 'live' : 'open'} label={game.status_label} /></div>
          </div>
          <button onClick={onClose} style={{background:'transparent', border:0, cursor:'pointer', color:'var(--ink-mute)', padding:4}}>
            <span className="ico material-symbols-outlined" style={{fontSize:22}}>close</span>
          </button>
        </header>

        {/* Modal body */}
        <div style={{padding:'22px', display:'flex', flexDirection:'column', gap:16}}>
          <div className="awz-form__row">
            <label className="awz-form__lbl">새 상태 <span className="awz-form__req">필수</span></label>
            <select className="awz-form__input" value={newStatus} onChange={e => setNewStatus(e.target.value)}>
              <option value="1">1 · 모집중 → 모집 진행</option>
              <option value="2">2 · 취소 → 모집 종료</option>
              <option value="3">3 · 종료 → 경기 종료</option>
              <option value="live">LIVE · 라이브 전환</option>
            </select>
          </div>

          {/* BG1 핵심 — 알림 체크박스 */}
          <div style={{
            background:'var(--accent-soft)',
            border:'1px solid var(--accent-hair)',
            borderRadius:'var(--r-sm)',
            padding:'12px 14px',
            display:'flex', alignItems:'center', gap:10,
          }}>
            <input
              type="checkbox"
              id="notif"
              checked={notify}
              onChange={e => setNotify(e.target.checked)}
              style={{width:18, height:18, accentColor:'var(--accent)', flexShrink:0}}
            />
            <label htmlFor="notif" style={{flex:1, fontSize:13, fontWeight:700, color:'var(--ink)', cursor:'pointer'}}>
              사용자에게 알림 보내기
              <span style={{display:'inline-block', marginLeft:6}} title="신청자 N명에게 이메일+앱 알림 발송">
                <span className="ico material-symbols-outlined" style={{fontSize:14, color:'var(--ink-dim)', verticalAlign:'-2px'}}>info</span>
              </span>
              <div style={{fontWeight:500, fontSize:11.5, color:'var(--ink-mute)', marginTop:2}}>
                신청자 {game.pending_apps || 0}명에게 이메일 + 앱 알림 발송
              </div>
            </label>
          </div>

          <div className="awz-form__row">
            <label className="awz-form__lbl">변경 사유 <span style={{fontSize:10, color:'var(--ink-dim)', fontWeight:500, marginLeft:4}}>(선택)</span></label>
            <input
              className="awz-form__input"
              placeholder="사유 또는 메모"
              value={reason}
              onChange={e => setReason(e.target.value)}
              style={{fontSize:14}}
            />
          </div>

          {/* BG5 미리보기 — 이 변경은 super_admin 액션으로 기록됨 */}
          <div style={{
            padding:'10px 12px',
            background:'var(--cafe-blue-soft)',
            borderLeft:'3px solid var(--cafe-blue)',
            borderRadius:'0 var(--r-sm) var(--r-sm) 0',
            fontSize:11.5, color:'var(--cafe-blue-deep)',
            display:'flex', gap:6,
          }}>
            <span className="ico material-symbols-outlined" style={{fontSize:16, flexShrink:0}}>shield_person</span>
            <div>
              이 변경은 <strong>🛡️ super_admin (강제 변경)</strong> 으로 기록됩니다 — BG5 액션 출처 컬럼에 반영
            </div>
          </div>
        </div>

        {/* Modal footer */}
        <footer style={{
          padding:'14px 22px',
          borderTop:'1px solid var(--border)',
          background:'var(--bg-alt)',
          display:'flex', gap:8, justifyContent:'flex-end',
        }}>
          <button className="btn" onClick={onClose}>취소</button>
          <button className="btn btn--accent" onClick={onClose}>
            <span className="ico material-symbols-outlined">{notify ? 'send' : 'check'}</span>
            {notify ? '변경 + 알림' : '변경만'}
          </button>
        </footer>
      </div>
    </div>
  );
}

window.AdminGames = AdminGames;
