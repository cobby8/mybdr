/* global React */
// ============================================================
// MyRegistrationStatus.jsx — 사용자 신청 현황 카드
//   B1 갭 해소 — sidebar (UA2) + 마이페이지 (UC1) 양쪽 재사용
//
//   props:
//     reg          신청 데이터 (status, step_idx, next_action, ...)
//     variant      'sidebar' | 'compact' (sidebar = 큰 카드 / compact = 마이페이지 list 셀)
//     onOpenMy     "내 대회" 진입 핸들러
// ============================================================

(function () {
  // 5 단계 step (신청 → 대기 → 승인 → 결제 → 진행 중)
  const STEPS = [
    { idx: 0, label: '신청', short: '신청' },
    { idx: 1, label: '승인 대기', short: '대기' },
    { idx: 2, label: '승인', short: '승인' },
    { idx: 3, label: '결제 완료', short: '결제' },
    { idx: 4, label: '진행 중', short: '진행' },
  ];

  const STATUS_META = {
    pending:     { label: '승인 대기', tone: 'warn',   ico: 'schedule' },
    approved:    { label: '결제 대기', tone: 'accent', ico: 'payments' },
    paid:        { label: '결제 완료', tone: 'ok',     ico: 'verified' },
    in_progress: { label: '진행 중',   tone: 'navy',   ico: 'sports_basketball' },
    completed:   { label: '종료',      tone: 'mute',   ico: 'flag' },
    rejected:    { label: '거절됨',    tone: 'err',    ico: 'cancel' },
    waitlist:    { label: '대기자',    tone: 'mute',   ico: 'queue' },
  };

  function Steps({ stepIdx, status }) {
    const isRejected = status === 'rejected';
    return (
      <ol className="mrs-steps" aria-label="신청 진행 단계">
        {STEPS.map((s, i) => {
          const done = !isRejected && i < stepIdx;
          const cur  = !isRejected && i === stepIdx;
          const state = isRejected
            ? (i === 0 ? 'err' : 'mute')
            : done ? 'done' : cur ? 'cur' : 'mute';
          return (
            <li key={s.idx} className={'mrs-step is-' + state}>
              <span className="mrs-step__dot">
                {state === 'done' && <span className="ico material-symbols-outlined">check</span>}
                {state === 'cur'  && <span className="mrs-step__cur" />}
                {state === 'err'  && <span className="ico material-symbols-outlined">close</span>}
                {state === 'mute' && <span className="mrs-step__idx">{i + 1}</span>}
              </span>
              <span className="mrs-step__lbl">{s.short}</span>
              {i < STEPS.length - 1 && <span className="mrs-step__line" />}
            </li>
          );
        })}
      </ol>
    );
  }

  window.MyRegistrationStatus = function MyRegistrationStatus({
    reg,
    variant = 'sidebar',
    onOpenMy = () => {},
    onOpenTn = () => {},
  }) {
    if (!reg) return null;
    const meta = STATUS_META[reg.status] || STATUS_META.pending;

    if (variant === 'compact') {
      return (
        <article className="mrs mrs--compact" data-status={reg.status}>
          <header className="mrs__head">
            <div className="mrs__title-row">
              <h3 className="mrs__name" onClick={onOpenTn}>{reg.tn_name}</h3>
              <span className={'mrs__pill is-' + meta.tone}>
                <span className="ico material-symbols-outlined">{meta.ico}</span>
                {meta.label}
              </span>
            </div>
            <div className="mrs__meta">
              <span className="mrs__div">{reg.division}</span>
              <span className="mrs__sep">·</span>
              <span>{reg.team_name}</span>
              <span className="mrs__sep">·</span>
              <span className="mrs__sub">신청 {reg.submitted_at}</span>
            </div>
          </header>
          <Steps stepIdx={reg.step_idx} status={reg.status} />
          <footer className="mrs__foot">
            <span className="mrs__next">{reg.next_action}</span>
            <button className="btn btn--sm" onClick={onOpenTn}>대회 상세</button>
          </footer>
        </article>
      );
    }

    // sidebar variant (UA2)
    return (
      <aside className="mrs mrs--sidebar" data-status={reg.status}>
        <div className="mrs__sb-head">
          <span className="mrs__eyebrow">내 참가 현황</span>
          <span className={'mrs__pill is-' + meta.tone}>
            <span className="ico material-symbols-outlined">{meta.ico}</span>
            {meta.label}
          </span>
        </div>
        <div className="mrs__sb-team">
          <div className="mrs__div mrs__div--lg">{reg.division}</div>
          <div className="mrs__sb-team-name">{reg.team_name}</div>
        </div>
        <Steps stepIdx={reg.step_idx} status={reg.status} />
        <div className="mrs__sb-next">
          <span className="ico material-symbols-outlined">arrow_forward</span>
          <span>{reg.next_action}</span>
        </div>
        <button className="btn btn--primary btn--touch mrs__sb-cta" onClick={onOpenMy}>
          마이페이지 → 내 대회
        </button>
      </aside>
    );
  };
})();
