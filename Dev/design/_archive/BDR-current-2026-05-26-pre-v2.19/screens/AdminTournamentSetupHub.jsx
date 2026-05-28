/* global React */
// ============================================================
// AdminTournamentSetupHub.jsx — UD3 (보강)
//   /tournament-admin/tournaments/[id]
//
//   Phase 1A B1 (depends_on 시각화 + 진행도) 보존
//   + B7 "사용자 미리보기" link 카드 신규
// ============================================================

(function () {
  const TN = { name: 'BDR 서머 오픈 #4', d_day: 31 };

  // 8 셋업 항목 (운영 명세) + 9번째 = B7 사용자 미리보기 (신규)
  const ITEMS = [
    { num: '1', label: '기본 정보',   icon: 'info',                desc: '대회명·시작일·경기장 등',   state: 'done',   required: true },
    { num: '2', label: '시리즈 연결', icon: 'collections_bookmark', desc: '시리즈에 연결 또는 단독',   state: 'done',   required: false },
    { num: '3', label: '종별 정의',   icon: 'category',            desc: '오픈 / 아마추어 / U18',     state: 'done',   required: true },
    { num: '4', label: '운영 방식',   icon: 'tune',                desc: '토너먼트 + 그룹 설정',       state: 'done',   required: true },
    { num: '5', label: '신청 정책',   icon: 'how_to_reg',          desc: '최대 32팀·참가비·자동 승인', state: 'done',   required: true },
    { num: '6', label: '사이트 설정', icon: 'public',              desc: '공개 사이트 메타데이터',     state: 'done',   required: true },
    { num: '7', label: '기록 설정',   icon: 'edit_note',           desc: '기본 기록 방식 (점수 시트)', state: 'done',   required: true },
    { num: '8', label: '대진표 생성', icon: 'account_tree',        desc: '경기 1건 이상 생성',         state: 'cur',    required: true },
  ];

  const STATE_LABEL = {
    done: '완료',
    cur: '진행 중',
    idle: '대기',
    locked: '잠김',
  };

  const completed = ITEMS.filter(i => i.required && i.state === 'done').length;
  const requiredTotal = ITEMS.filter(i => i.required).length;
  const pct = Math.round((completed / requiredTotal) * 100);

  window.AdminTournamentSetupHub = function AdminTournamentSetupHub() {
    return (
      <window.AdminShell active="setup" tournamentName={TN.name} crumbTrail={['대회 관리', TN.name, '셋업 hub']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div className="admin-page__title-row">
                <div>
                  <div className="admin-page__eyebrow">UD3 / Phase 1A B1 + B7 보강</div>
                  <h1 className="admin-page__title">셋업 hub · {TN.name}</h1>
                  <p className="admin-page__sub">필수 항목 {completed}/{requiredTotal} 완료. 대진표 생성 후 공개 가능. <b style={{color:'var(--accent)'}}>D-{TN.d_day}</b></p>
                </div>
                <div className="admin-page__actions">
                  <button className="btn"><span className="ico material-symbols-outlined">history</span>변경 이력</button>
                  <button className="btn"><span className="ico material-symbols-outlined">visibility</span>공개 미리보기</button>
                </div>
              </div>
            </header>

            {/* Phase 1A B1 — 진행도 바 (보존) */}
            <div className="atsh-progress">
              <div className="atsh-progress__big">{completed}<small>/{requiredTotal}</small></div>
              <div>
                <div className="atsh-progress__title">필수 항목 진행도</div>
                <div className="atsh-progress__sub">{requiredTotal - completed}개 더 완료하면 공개 가능 · 대진표 생성 진행 중</div>
                <div className="atsh-progress__bar"><div className="atsh-progress__fill" style={{width: pct + '%'}} /></div>
              </div>
              <div style={{fontFamily:'var(--ff-mono)', fontSize:13, fontWeight:800, color:'var(--ink-soft)'}}>
                {pct}%
              </div>
            </div>

            {/* 8 카드 grid + B7 9번째 카드 */}
            <div className="atsh-grid">
              {ITEMS.map(it => (
                <div key={it.num} className={'atsh-item is-' + it.state}>
                  <div className="atsh-item__num">STEP {it.num}{it.required ? '' : ' · 선택'}</div>
                  <span className="atsh-item__icon ico material-symbols-outlined">{it.icon}</span>
                  <div className="atsh-item__title">{it.label}</div>
                  <div className="atsh-item__desc">{it.desc}</div>
                  <span className={'atsh-item__state atsh-item__state--' + it.state}>{STATE_LABEL[it.state]}</span>
                </div>
              ))}

              {/* B7 — 사용자 미리보기 카드 (신규) */}
              <div className="atsh-item atsh-item--preview">
                <div className="atsh-item__num" style={{color:'var(--cafe-blue-deep)'}}>
                  PREVIEW · 새 탭
                </div>
                <span className="atsh-item__icon ico material-symbols-outlined">visibility</span>
                <div className="atsh-item__title">사용자가 본 화면</div>
                <div className="atsh-item__desc">
                  현재 publish 상태에서 사용자에게 어떻게 보이는지 새 탭으로 확인 (운영자 권한 hidden 시뮬레이션).
                </div>
                <span className="atsh-item__preview-chip">
                  <span className="ico material-symbols-outlined">open_in_new</span>
                  ?preview=user
                </span>
              </div>
            </div>

            {/* Publish gate (보존) */}
            <div className="atsh-gate">
              <div className="atsh-gate__left">
                <div className="atsh-gate__title">공개 게이트 · 7/8 통과</div>
                <div className="atsh-gate__sub">대진표 생성 (STEP 8) 완료 시 공개 버튼 활성화.</div>
              </div>
              <div>
                <button className="btn btn--accent" disabled style={{opacity:.55, cursor:'not-allowed'}}>
                  <span className="ico material-symbols-outlined">public</span>
                  대회 공개
                </button>
              </div>
            </div>
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
