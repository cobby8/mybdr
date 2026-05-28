/* global React */
// ============================================================
// BDR v2.20 — GuestApply (Phase 2B · UA4)
// 운영 박제 대상: /games/[id]/guest-apply
// 진입: GameDetail (UA2) ApplyPanel '게스트 신청'
// 복귀: 신청 완료 → /games/[id] / 취소 → 이전 페이지
// 에러: skill_level 없으면 수동 입력 fallback / 약관 미동의 = submit disabled
//
// BG3 = user.skill_level → experience_years 자동 추론 + prefill
//   skill 1 → 1년 (입문) / 2 → 2년 / 3 → 5년 / 4 → 10년 / 5 → 15년+
//   추론 옆 ⓘ "내 프로필 실력에서 자동" — 수정 가능
// BG1 사후 = "호스트 승인 시 알림으로 알려드립니다" 1줄
// A 등급
// ============================================================

function GuestApply() {
  const userSkill = 3;  // 가정 — user.skill_level
  const inferredYears = { 1: 1, 2: 2, 3: 5, 4: 10, 5: 15 }[userSkill];
  const [years, setYears] = React.useState(inferredYears);
  const [agreeTerms, setAgreeTerms] = React.useState(false);
  const [agreePolicy, setAgreePolicy] = React.useState(false);
  const [greeting, setGreeting] = React.useState('');

  return (
    <div className="gm-page">
      <div className="gm-page__inner" style={{maxWidth:760}}>
        <header className="gm-page__head">
          <div className="eyebrow">/games/gm-2/guest-apply · 게스트 신청</div>
          <h1 className="gm-page__title">게스트 신청</h1>
          <p className="gm-page__sub">마포 평일 야간 5x5 · 김도현 호스트 · 5/30 (토) 21:00.</p>
        </header>

        <div className="gm-card" style={{marginBottom:14}}>
          <h3 className="gm-card__h"><span className="ico material-symbols-outlined">badge</span> 내 정보</h3>
          <div className="awz-form" style={{padding:0, border:0, background:'transparent', gap:14}}>
            <div className="awz-form__row">
              <label className="awz-form__lbl">닉네임</label>
              <input className="awz-form__input" value="박수빈" readOnly style={{background:'var(--bg-alt)'}} />
            </div>

            {/* BG3 핵심 — skill_level 자동 채우기 */}
            <div className="awz-form__row">
              <label className="awz-form__lbl">
                농구 경력
                <span className="awz-form__req">필수</span>
                <span className="ga-auto-fill">
                  <span className="ico material-symbols-outlined">auto_awesome</span>
                  내 프로필 실력 (L.{userSkill}) 에서 자동
                </span>
              </label>
              <div style={{display:'flex', gap:8, alignItems:'center'}}>
                <input
                  className="awz-form__input"
                  value={years}
                  onChange={e => setYears(e.target.value)}
                  type="number"
                  style={{maxWidth:120}}
                />
                <span style={{fontSize:13, color:'var(--ink-soft)', fontWeight:600}}>년</span>
                <button className="btn btn--sm" onClick={() => setYears(inferredYears)} disabled={years === inferredYears} style={{marginLeft:'auto'}}>
                  <span className="ico material-symbols-outlined">restart_alt</span> 자동값으로
                </button>
              </div>
              <div className="awz-form__hint">
                {years === inferredYears
                  ? `자동 추론값 = L.${userSkill} · 약 ${inferredYears}년 (수정 가능)`
                  : `수정됨 — 원래 자동값은 ${inferredYears}년`}
              </div>
            </div>

            <div className="awz-form__row">
              <label className="awz-form__lbl">알러지 / 특이사항</label>
              <input className="awz-form__input" placeholder="없음" style={{fontSize:14}} />
              <div className="awz-form__hint">호스트가 사전 인지하면 좋을 정보 — 선택</div>
            </div>
          </div>
        </div>

        {/* 호스트 인사말 */}
        <div className="gm-card" style={{marginBottom:14}}>
          <h3 className="gm-card__h"><span className="ico material-symbols-outlined">edit_note</span> 호스트 인사말</h3>
          <textarea
            className="awz-form__input"
            placeholder="간단한 자기소개 / 참가 동기"
            value={greeting}
            onChange={e => setGreeting(e.target.value)}
            style={{minHeight:80, resize:'vertical', fontSize:14}}
          />
          <div className="awz-form__hint" style={{marginTop:4}}>호스트가 신청 검토 시 참고</div>
        </div>

        {/* 약관 스냅샷 (기존 보존) */}
        <div className="gm-card" style={{marginBottom:14}}>
          <h3 className="gm-card__h"><span className="ico material-symbols-outlined">gavel</span> 약관 동의</h3>
          <div className="ga-terms">
            <label className="ga-terms__row">
              <input type="checkbox" checked={agreeTerms} onChange={e => setAgreeTerms(e.target.checked)} />
              <span><strong>게스트 약관</strong> · 부상 면책 / 매너 의무 / 데이터 활용 동의 <a href="#">[전문 보기]</a></span>
            </label>
            <label className="ga-terms__row">
              <input type="checkbox" checked={agreePolicy} onChange={e => setAgreePolicy(e.target.checked)} />
              <span><strong>호스트 정책</strong> · 약속 시간 5분 늦으면 다음 신청자에게 자리 양보 <a href="#">[전문 보기]</a></span>
            </label>
          </div>
        </div>

        {/* BG1 사후 안내 — 호스트 승인 통보 */}
        <div style={{
          padding:'12px 14px', marginBottom:14,
          background:'var(--cafe-blue-soft)', borderLeft:'3px solid var(--cafe-blue)',
          borderRadius:'0 var(--r-sm) var(--r-sm) 0',
          fontSize:12.5, color:'var(--cafe-blue-deep)',
          display:'flex', gap:8,
        }}>
          <span className="ico material-symbols-outlined" style={{fontSize:18, flexShrink:0}}>notifications_active</span>
          <div>
            <strong>호스트 승인 시 알림으로 알려드립니다</strong> — 마이페이지 "내 경기" 의 step indicator (BG1) 도 함께 갱신됩니다.
          </div>
        </div>

        <div className="awz-actions">
          <button className="btn">취소</button>
          <button
            className="btn btn--accent btn--touch"
            disabled={!agreeTerms || !agreePolicy}
            style={{opacity: (!agreeTerms || !agreePolicy) ? 0.5 : 1}}
          >
            <span className="ico material-symbols-outlined">how_to_reg</span>
            게스트 신청 완료
          </button>
        </div>
      </div>
    </div>
  );
}

window.GuestApply = GuestApply;
