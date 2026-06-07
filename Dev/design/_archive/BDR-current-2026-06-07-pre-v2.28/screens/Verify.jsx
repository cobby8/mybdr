/* global React */
// ============================================================
// BDR v2.27 — Verify (AU4 · Phase 7 · 보강 · BA4 + BA5 ★★★)
// 운영: /verify (438 · v2(1) 박제 ✅) — 단계 progress + 카운트다운.
//
// AU4-A 사후 hero (verified 카드: name/phone/birth/일자) + 프로필 진입 CTA
// AU4-B 실패 retry (warn-soft) · AU4-C cross-domain (PU2/GU3 IdentityVerifyButton 정합)
// ============================================================
function Verify() {
  const [phase, setPhase] = React.useState('input'); // input / code / done
  const [result, setResult] = React.useState('ok');  // ok / fail (데모)
  const [phone, setPhone] = React.useState('');
  const [code, setCode] = React.useState('');
  const [left, setLeft] = React.useState(180);

  React.useEffect(() => {
    if (phase !== 'code') return;
    setLeft(180);
    const t = setInterval(() => setLeft(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, [phase]);
  const fmt = (s) => String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0');
  const stepActive = phase === 'code' ? 2 : phase === 'done' ? 2 : 1;

  return (
    <div className="au-page">
      <div className="au-wrap">
        <window.AuthBrand slogan="본인 인증" />

        {/* 데모 토글 — 운영은 인증 결과로 분기 */}
        {phase === 'done' && (
          <div style={{ textAlign: 'center' }}>
            <div className="au-demo">
              <button className={result === 'ok' ? 'is-on' : ''} onClick={() => setResult('ok')}>인증 성공</button>
              <button className={result === 'fail' ? 'is-on' : ''} onClick={() => setResult('fail')}>인증 실패</button>
            </div>
          </div>
        )}

        <div className="au-card">
          <div className="au-card__body">
            {phase !== 'done' && (
              <>
                <div className="au-step-head" style={{ textAlign: 'left', marginBottom: 16 }}>
                  <div className="au-step-eyebrow">온보딩 1 / 2 · VERIFY</div>
                  <h1 className="au-step-title" style={{ fontSize: 21 }}>전화번호 인증</h1>
                  <p className="au-step-desc">매치 신청·대회 알림을 받으려면 전화번호 인증이 필요해요. SMS로 6자리 코드를 보냅니다.</p>
                </div>
                {/* 2-step bar */}
                <div style={{ display: 'flex', gap: 6, marginBottom: 18 }}>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: stepActive >= 1 ? 'var(--accent)' : 'var(--border)' }}></div>
                  <div style={{ flex: 1, height: 4, borderRadius: 2, background: stepActive >= 2 ? 'var(--accent)' : 'var(--border)' }}></div>
                </div>
              </>
            )}

            {phase === 'input' && (
              <>
                <div className="au-field">
                  <label className="au-label">휴대전화번호 <span style={{ color: 'var(--accent)' }}>*</span></label>
                  <input className="au-input" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="010-1234-5678" />
                  <div className="au-hint">※ 본인 확인과 알림 외 목적으로 사용되지 않습니다.</div>
                </div>
                <button className="au-btn" style={{ marginTop: 6 }} onClick={() => setPhase('code')}><span className="ico material-symbols-outlined">sms</span>인증번호 받기</button>
              </>
            )}

            {phase === 'code' && (
              <>
                <div className="au-field">
                  <label className="au-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>인증번호 6자리</span>
                    <span className="au-countdown"><span className="ico material-symbols-outlined">timer</span>{fmt(left)}</span>
                  </label>
                  <input className="au-input au-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} placeholder="000000" />
                  <div className="au-hint">{phone || '010-1234-5678'}로 발송했어요. 코드가 안 오면 재전송하세요.</div>
                </div>
                <button className="au-btn" style={{ marginTop: 6 }} disabled={code.length !== 6} onClick={() => setPhase('done')}>인증 확인</button>
                <div className="au-foot" style={{ marginTop: 12 }}><button onClick={() => setLeft(180)}>인증번호 재전송</button></div>
              </>
            )}

            {phase === 'done' && result === 'ok' && (
              <div className="au-result au-result--ok">
                <div className="au-result__icon"><span className="ico material-symbols-outlined">verified</span></div>
                <h1 className="au-result__title">본인 인증 완료</h1>
                <p className="au-result__desc">인증이 완료됐어요. 이제 대회 참가와 안전한 매칭을 이용할 수 있어요.</p>
                <div className="au-verified" style={{ textAlign: 'left' }}>
                  <div className="au-verified__bar"><span className="ico material-symbols-outlined">verified</span><span className="au-verified__bar-t">인증 정보</span></div>
                  <div className="au-verified__rows">
                    <div className="au-vrow"><span className="au-vrow__l">실명</span><span className="au-vrow__v">{window.VERIFIED.name}</span></div>
                    <div className="au-vrow"><span className="au-vrow__l">휴대폰</span><span className="au-vrow__v">{window.VERIFIED.phone}</span></div>
                    <div className="au-vrow"><span className="au-vrow__l">생년월일</span><span className="au-vrow__v">{window.VERIFIED.birth}</span></div>
                    <div className="au-vrow"><span className="au-vrow__l">인증 일자</span><span className="au-vrow__v">{window.VERIFIED.at}</span></div>
                  </div>
                </div>
                <a className="au-btn" href="pu1-profile.html">프로필로 이동</a>
                <p className="au-hint" style={{ marginTop: 12 }}>인증 완료 시 <a href="pu2-profile-edit.html" style={{ color: 'var(--cafe-blue-deep)', fontWeight: 700 }}>PU2 편집</a> · <a href="gu3-profile-settings.html" style={{ color: 'var(--cafe-blue-deep)', fontWeight: 700 }}>GU3 설정</a>의 본인인증 배지가 자동으로 표시됩니다.</p>
              </div>
            )}

            {phase === 'done' && result === 'fail' && (
              <div className="au-result au-result--warn">
                <div className="au-result__icon"><span className="ico material-symbols-outlined">error</span></div>
                <h1 className="au-result__title">인증에 실패했어요</h1>
                <p className="au-result__desc">인증번호가 일치하지 않거나 시간이 만료됐어요. 다시 시도해 주세요.</p>
                <div className="gw-ph" style={{ textAlign: 'left', marginBottom: 16 }}>
                  <span className="gw-ph__ico ico material-symbols-outlined">info</span>
                  <div className="gw-ph__body"><div className="gw-ph__d" style={{ color: '#8B5A0F' }}>오류 사유 — 인증번호 불일치 (CODE_MISMATCH)</div></div>
                </div>
                <button className="au-btn au-btn--accent" onClick={() => { setPhase('input'); setCode(''); }}><span className="ico material-symbols-outlined">refresh</span>다시 인증하기</button>
              </div>
            )}
          </div>
        </div>

        {phase !== 'done' && (
          <div style={{ textAlign: 'center' }}>
            <a className="au-back" href="p2-uc2-home.html">나중에 (홈으로)</a>
          </div>
        )}
      </div>
    </div>
  );
}

window.Verify = Verify;
