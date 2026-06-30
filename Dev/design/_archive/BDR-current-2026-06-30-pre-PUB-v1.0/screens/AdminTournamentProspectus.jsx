/* global React */
// ============================================================
// AdminTournamentProspectus.jsx — E2 (Phase 1A PDF→AI→wizard — 신규)
//   /tournament-admin/tournaments/new/wizard/prospectus
//
// 진입: A1 / A2 sub-tab 3번째 옵션 (PDF 요강)
// 복귀: AdminTournamentSetupHub (생성 후) / AdminTournamentAdminList (취소)
// 에러: AI 분석 실패 = 수동 입력으로 전환 (Legacy wizard)
//
// G2/G3 갭 해소: PDF 업로드 → AI 분석 → 미리보기 → wizard 자동 채움 4-step.
// ============================================================

(function () {
  const STEPS = [
    { n: 1, lbl: 'PDF 업로드' },
    { n: 2, lbl: 'AI 분석' },
    { n: 3, lbl: '미리보기' },
    { n: 4, lbl: 'wizard 진입' },
  ];

  // AI 추출 mock — 신뢰도 분기
  const FIELDS = [
    { k: 'name',  lbl: '대회명', v: '강남구협회장배 봄 농구대회', conf: 'high' },
    { k: 'host',  lbl: '주최', v: '강남구농구협회', conf: 'high' },
    { k: 'date',  lbl: '일시', v: '2026-05-09 ~ 05-10', conf: 'high' },
    { k: 'venue', lbl: '경기장', v: '잠실학생체육관', conf: 'high' },
    { k: 'divs',  lbl: '종별', v: 'U12 / U15 / U18 / 오픈 (4종)', conf: 'high' },
    { k: 'fee',   lbl: '참가비', v: '25,000 ~ 60,000원', conf: 'mid', sub: '종별별 차이 — 검토 필요' },
    { k: 'apply', lbl: '신청 마감', v: '2026-05-01', conf: 'high' },
    { k: 'max',   lbl: '정원', v: '종별당 6~8팀 (총 24~32)', conf: 'mid', sub: '문서에 명확치 않음' },
    { k: 'rule',  lbl: '경기 룰', v: 'FIBA 5x5 표준', conf: 'high' },
    { k: 'prize', lbl: '시상', v: '우승 / 준우승 / MVP / 베스트5', conf: 'low', sub: '상금 명시 없음 — 운영자 보강' },
  ];

  window.AdminTournamentProspectus = function AdminTournamentProspectus() {
    const [step, setStep] = React.useState(3); // 1 upload / 2 analyzing / 3 preview
    const [over, setOver] = React.useState(false);

    return (
      <window.AdminShell active="list" tournamentName="" crumbTrail={['대회 관리', '내 대회 목록', '새 대회 만들기', 'PDF 요강']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div>
                <div className="admin-page__eyebrow">E2 · Phase 1A · Prospectus (NEW · G2+G3)</div>
                <h1 className="admin-page__title">PDF 요강에서 자동 생성</h1>
                <p className="admin-page__sub">
                  협회 요강 PDF 를 업로드하면 AI 가 대회명·종별·신청 정책을 추출하고 wizard 를 자동으로 채웁니다.
                </p>
              </div>
            </header>

            {/* draft 복구 배너 */}
            <div className="awz-draft">
              <div className="awz-draft__left">
                <span className="awz-draft__icon ico material-symbols-outlined">history</span>
                <div>
                  <div className="awz-draft__title">이전 분석 이어하기</div>
                  <div className="awz-draft__sub">강남구협회장배_요강.pdf · 어제 분석 · 미리보기 단계</div>
                </div>
              </div>
              <button className="awz-draft__cta">
                <span className="ico material-symbols-outlined">arrow_forward</span>
                이어하기
              </button>
            </div>

            {/* 4-step 진행도 */}
            <div className="apr-progress">
              {STEPS.map(s => {
                const cls = step > s.n ? 'is-done' : step === s.n ? 'is-cur' : '';
                return (
                  <div key={s.n} className={'apr-progress__step ' + cls}>
                    <span className="apr-progress__dot"><span className="num">{s.n}</span></span>
                    <span className="apr-progress__lbl">{s.lbl}</span>
                  </div>
                );
              })}
            </div>

            {/* Step demo toggle */}
            <div style={{
              display: 'flex', gap: 6, marginBottom: 14,
              padding: 10, background: 'var(--bg-elev)', border: '1px dashed var(--border)',
              borderRadius: 'var(--r-sm)', alignItems: 'center', fontSize: 11.5, color: 'var(--ink-mute)',
            }}>
              <span style={{ fontFamily: 'var(--ff-mono)', fontWeight: 800, color: 'var(--accent)', letterSpacing: '0.06em' }}>DEMO STEP</span>
              {[1, 2, 3].map(n => (
                <button key={n} className={'btn btn--sm' + (step === n ? ' btn--primary' : '')}
                  onClick={() => setStep(n)}>STEP {n}</button>
              ))}
            </div>

            {/* STEP 1 — Upload */}
            {step === 1 && (
              <div className={'apr-drop' + (over ? ' is-over' : '')}
                onDragOver={e => { e.preventDefault(); setOver(true); }}
                onDragLeave={() => setOver(false)}
                onDrop={e => { e.preventDefault(); setOver(false); setStep(2); }}>
                <span className="apr-drop__icon ico material-symbols-outlined">upload_file</span>
                <div className="apr-drop__h">PDF 요강 파일을 끌어 놓거나 클릭하세요</div>
                <p className="apr-drop__sub">최대 10MB · 협회 요강 / 대회 안내문 / 참가 신청 양식 등</p>
                <button className="btn btn--primary" onClick={() => setStep(2)}>
                  <span className="ico material-symbols-outlined">attach_file</span>
                  파일 선택
                </button>
                <div className="apr-drop__samples">
                  <span style={{ fontSize: 11, color: 'var(--ink-mute)', marginRight: 4 }}>샘플:</span>
                  <span className="apr-drop__sample">강남구협회장배.pdf</span>
                  <span className="apr-drop__sample">루키컵_요강.pdf</span>
                  <span className="apr-drop__sample">FIBA_규정.pdf</span>
                </div>
              </div>
            )}

            {/* STEP 2 — Analyzing */}
            {step === 2 && (
              <div className="apr-analyzing">
                <div className="apr-analyzing__spinner" />
                <h3 className="apr-analyzing__h">강남구협회장배_요강.pdf 를 분석하는 중</h3>
                <p className="apr-analyzing__sub">평균 30초 · 8개 항목 추출 중...</p>
                <div className="apr-analyzing__items">
                  <div className="apr-analyzing__item is-done">
                    <span className="ico material-symbols-outlined">check_circle</span>
                    대회명 · 일시 · 경기장 추출 완료
                  </div>
                  <div className="apr-analyzing__item is-done">
                    <span className="ico material-symbols-outlined">check_circle</span>
                    종별 4개 식별 (U12 / U15 / U18 / 오픈)
                  </div>
                  <div className="apr-analyzing__item is-cur">
                    <span className="ico material-symbols-outlined">autorenew</span>
                    신청 정책 추출 중...
                  </div>
                  <div className="apr-analyzing__item is-pend">
                    <span className="ico material-symbols-outlined">schedule</span>
                    시상 / 룰 추출 대기
                  </div>
                </div>
                <button className="btn btn--sm" style={{ marginTop: 18 }} onClick={() => setStep(3)}>
                  미리보기로 (demo)
                </button>
              </div>
            )}

            {/* STEP 3 — Preview */}
            {step === 3 && (
              <>
                <div className="apr-preview">
                  <div className="apr-preview__head">
                    <h3 className="apr-preview__h">분석 결과 · 10 항목 추출</h3>
                    <span className="apr-preview__meta">
                      신뢰도 high <b style={{ color: 'var(--ok)' }}>7</b> · mid <b style={{ color: '#8B5A0F' }}>2</b> · low <b style={{ color: 'var(--err)' }}>1</b>
                    </span>
                  </div>
                  <div className="apr-preview__grid">
                    {FIELDS.map(f => (
                      <div key={f.k} className="apr-field">
                        <div className="apr-field__lbl">
                          {f.lbl}
                          <span className={'apr-field__chip apr-field__chip--' + f.conf}>{f.conf}</span>
                        </div>
                        <div className="apr-field__v">{f.v}</div>
                        {f.sub && <div className="apr-field__sub">⚠ {f.sub}</div>}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="apr-fallback">
                  <div className="apr-fallback__t">
                    추출이 부족한가요? <b>수동 입력으로 전환</b>해서 처음부터 작성할 수 있습니다.
                  </div>
                  <button className="btn btn--sm">단계별 마법사로 전환</button>
                </div>

                <div className="awz-actions">
                  <button className="btn" onClick={() => setStep(1)}>
                    <span className="ico material-symbols-outlined">arrow_back</span>
                    PDF 다시 선택
                  </button>
                  <button className="btn btn--accent">
                    wizard 자동 채움 → 검토 시작
                    <span className="ico material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
