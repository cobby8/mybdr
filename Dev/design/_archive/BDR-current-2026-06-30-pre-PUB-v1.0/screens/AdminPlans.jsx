/* global React */
// ============================================================
// BDR v2.25 — AdminPlans (BA2 · Phase 6.2A · 신규 · BB1 · super-admin)
// 운영: /admin/plans (397 · plans CRUD) · 박제 ❌ → 신규.
// 측: Site Operator (super-admin)
//
// Hero (전체/활성/구독자 합계 + Site Operator badge) + 플랜 카드 grid
//   (이름 + 가격 + 혜택 + 구독자 수 + 활성/비활성 + 수정·복제·비활성화) +
//   "+ 새 플랜" → 생성/수정 모달 (이름/유형/가격/혜택/활성 토글).
// BB1 = BU1 list = BU3 현재 구독 동일 PLANS 컬럼.
// ============================================================
const FEATURE_LABEL = {
  pickup_game: '픽업게임', team_create: '팀 생성권', court_rental: '체육관 대관', tournament_create: '대회 생성',
};

function PlanAdminCard({ plan, onEdit }) {
  return (
    <div className={'bl-pcard' + (plan.is_active ? '' : ' bl-pcard--off')}>
      <div className="bl-pcard__top">
        <span className="bl-pcard__name">{plan.name}</span>
        <span className="bl-pcard__active" data-on={plan.is_active}>{plan.is_active ? '활성' : '비활성'}</span>
      </div>
      <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
        <span className="bl-tag">{window.PLAN_TYPE_LABEL[plan.plan_type]}</span>
        <span className="bl-tag" style={{ background: 'var(--bg-head)', color: 'var(--ink-soft)' }}>{FEATURE_LABEL[plan.feature_key]}</span>
      </div>
      <div className="bl-pcard__price">
        <span className="bl-pcard__price-v">{plan.price === 0 ? '무료' : window.wonRaw(plan.price)}</span>
        {plan.price > 0 && <span className="bl-pcard__price-p">/ 월</span>}
      </div>
      <div className="bl-pcard__subs">
        <span className="ico material-symbols-outlined">group</span>
        <span className="bl-pcard__subs-v">{plan.subscribers.toLocaleString('ko-KR')}</span>
        <span className="bl-pcard__subs-l">명 구독 중</span>
      </div>
      <ul className="bl-pcard__feats">
        {plan.features.slice(0, 4).map((f, i) => (
          <li key={i}><span className="ico material-symbols-outlined">check_small</span>{f}</li>
        ))}
      </ul>
      <div className="bl-pcard__actions">
        <button className="btn btn--sm" onClick={() => onEdit(plan)}><span className="ico material-symbols-outlined">edit</span>수정</button>
        <button className="btn btn--sm"><span className="ico material-symbols-outlined">content_copy</span>복제</button>
        <button className="btn btn--sm">{plan.is_active ? '비활성화' : '활성화'}</button>
      </div>
    </div>
  );
}

function AdminPlans() {
  const plans = window.PLANS;
  const [modal, setModal] = React.useState(null); // null | {plan} | 'new'
  const [active, setActive] = React.useState(true);

  const totalSubs = plans.reduce((a, p) => a + p.subscribers, 0);
  const openEdit = (p) => { setModal(p); setActive(p.is_active); };
  const openNew = () => { setModal('new'); setActive(true); };
  const editing = modal && modal !== 'new' ? modal : null;

  return (
    <div className="oa1-page">
      {/* Hero */}
      <header className="oa1-hero">
        <div>
          <window.OperatorBadge />
          <h1 className="oa1-hero__title" style={{ marginTop: 8 }}>요금제 관리</h1>
          <div className="oa1-hero__sub">ADMIN · 비즈니스 · 멤버십 플랜</div>
        </div>
        <div className="oa1-hero__stats">
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--approved">{plans.length}</div><div className="oa1-hero__stat-lbl">전체 플랜</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--pending">{plans.filter(p => p.is_active).length}</div><div className="oa1-hero__stat-lbl">활성</div></div>
          <div className="oa1-hero__stat"><div className="oa1-hero__stat-num oa1-hero__stat-num--archived">{totalSubs.toLocaleString('ko-KR')}</div><div className="oa1-hero__stat-lbl">구독자 합계</div></div>
        </div>
      </header>

      {/* 액션 바 */}
      <div className="oa1-filter" style={{ justifyContent: 'space-between' }}>
        <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700, color: 'var(--ink-mute)' }}>plans · user_subscriptions 실 데이터</span>
        <button className="btn btn--primary" onClick={openNew}><span className="ico material-symbols-outlined">add</span>새 플랜 생성</button>
      </div>

      {/* 플랜 grid */}
      <div className="bl-pgrid" style={{ marginTop: 14 }}>
        {plans.map(p => <PlanAdminCard key={p.id} plan={p} onEdit={openEdit} />)}
      </div>

      {/* 생성/수정 모달 */}
      {modal && (
        <div className="bl-modal-stage" onClick={() => setModal(null)}>
          <div className="bl-modal bl-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="bl-modal__head">
              <h3 className="bl-modal__title"><span className="ico material-symbols-outlined">{editing ? 'edit' : 'add_circle'}</span>{editing ? editing.name + ' 수정' : '새 플랜 생성'}</h3>
              <button className="bl-modal__close" onClick={() => setModal(null)} aria-label="닫기"><span className="ico material-symbols-outlined">close</span></button>
            </div>
            <div className="bl-modal__body">
              <div className="pm-field">
                <label className="pm-field__l">플랜 이름</label>
                <input className="pm-input" defaultValue={editing ? editing.name : ''} placeholder="BDR PRO" />
              </div>
              <div className="bl-modal-row2">
                <div className="pm-field">
                  <label className="pm-field__l">결제 유형</label>
                  <select className="pm-select" defaultValue={editing ? editing.plan_type : 'monthly'}>
                    <option value="monthly">월 구독</option>
                    <option value="one_time">1회 구매</option>
                  </select>
                </div>
                <div className="pm-field">
                  <label className="pm-field__l">기능 (feature_key)</label>
                  <select className="pm-select" defaultValue={editing ? editing.feature_key : 'team_create'}>
                    {Object.entries(FEATURE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
              </div>
              <div className="pm-field">
                <label className="pm-field__l">금액 (원)</label>
                <input className="pm-input" type="number" defaultValue={editing ? editing.price : ''} placeholder="9900" />
              </div>
              <div className="pm-field">
                <label className="pm-field__l">혜택 (줄바꿈으로 구분)</label>
                <textarea className="pm-textarea" defaultValue={editing ? editing.features.join('\n') : ''} placeholder="팀 생성 무제한&#10;코트 예약 수수료 면제" />
              </div>
              <div className="pm-priv__row" style={{ marginBottom: 0 }}>
                <div className="pm-priv__body">
                  <div className="pm-priv__t">플랜 활성화</div>
                  <div className="pm-priv__d">비활성 시 신규 구독을 받지 않습니다 (기존 구독자 유지)</div>
                </div>
                <span className="pm-priv__state" data-on={active}>{active ? '활성' : '비활성'}</span>
                <button className="pm-toggle" data-on={active} onClick={() => setActive(a => !a)} aria-label="활성 토글"><span className="pm-toggle__h"></span></button>
              </div>
            </div>
            <div className="bl-modal__foot">
              <button className="btn btn--sm" onClick={() => setModal(null)}>취소</button>
              <button className="btn btn--sm btn--primary"><span className="ico material-symbols-outlined">save</span>저장</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

window.AdminPlans = AdminPlans;
