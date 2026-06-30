/* global React */
// ============================================================
// BDR v2.23 — CommunityWizard / CommunityNew (CU3 · Phase 5B · 신규 · BC3)
// 운영 박제 대상: /community/new (단일 form → 5-step 마법사)
// 패턴: Phase 1B UA3 (대회 신청 5-step) + Phase 4 OU3 (단체 등록 5-step) 답습
//
//   STEP 1 — 카테고리 선택 (작성 가능 7종 · notice 제외)
//   STEP 2 — 유형 선택 (텍스트 / 이미지 / 영상)
//   STEP 3 — 본문 (제목 + 내용 + 첨부)
//   STEP 4 — 메타 (카테고리별 분기: 알기자=대회 선택 / 팀 선택 cross-domain)
//   STEP 5 — 미리보기 + 제출
//   → 사후 안내 hero ("게시되었습니다" + "글 보기" CTA → CU2)
//
// CU4 (수정) = 본 컴포넌트 재사용 (mode="edit" · prefill 만 차이 · 별 컴포넌트 ❌)
// A 등급
// ============================================================

const CW_STEPS = [
  { id: 1, key: 'cat',     lbl: '카테고리', ico: 'category' },
  { id: 2, key: 'type',    lbl: '유형',     ico: 'tune' },
  { id: 3, key: 'body',    lbl: '본문',     ico: 'edit' },
  { id: 4, key: 'meta',    lbl: '추가 정보', ico: 'sell' },
  { id: 5, key: 'review',  lbl: '미리보기',  ico: 'visibility' },
];

function CommunityWizard({ mode = 'new', initialStep = 1, success = false, prefill }) {
  const isEdit = mode === 'edit';
  const [step, setStep] = React.useState(initialStep);
  const [form, setForm] = React.useState(prefill || {
    category: 'review',
    type: 'image',
    title: '',
    content: '',
    image_count: 0,
    tournament_id: '',
    team_id: '',
  });
  const setF = (k, v) => setForm({ ...form, [k]: v });

  // 작성 가능 카테고리 / 유형 / 대회 목록
  const cats = window.COMM_WRITE_CATEGORIES;
  const types = window.COMM_TYPES;
  const tns = (window.TN_DATA ? window.TN_DATA.list : []).slice(0, 5);
  const teams = window.RANK_TEAMS;
  const isAlkija = form.category === 'news';
  const catDef = window.commCat(form.category);
  const detailHref = 'cu2-community-detail.html';

  // ── 사후 안내 (success) ──
  if (success) {
    return (
      <div className="ou3-page">
        <div className="ou3-success">
          <div className="ou3-success__icon material-symbols-outlined">check_circle</div>
          <h2 className="ou3-success__h">{isEdit ? '수정되었습니다' : '게시되었습니다'}</h2>
          <p className="ou3-success__sub">
            <b style={{ color: 'var(--ink)' }}>{form.title || '게시글'}</b> 이(가) {isEdit ? '수정' : '커뮤니티에 등록'}되었습니다.<br />
            {isAlkija
              ? <>BDR NEWS(알기자) 글은 운영자 검수 후 공개됩니다.</>
              : <>{window.commCat(form.category).label}에서 확인할 수 있습니다.</>}
          </p>
          <div className="ou3-success__cta">
            <a className="btn" href="cu1-community-list.html"><span className="ico material-symbols-outlined">list</span>목록으로</a>
            <a className="btn btn--primary" href={detailHref}>글 보기<span className="ico material-symbols-outlined">arrow_forward</span></a>
          </div>
          <div className="cw-success-meta">
            <span className="ico material-symbols-outlined">{isAlkija ? 'schedule' : 'visibility'}</span>
            <div>
              {isAlkija
                ? <><b>검수 대기</b> — 알기자 기사는 status=draft로 접수되어 운영자 확인 후 published 됩니다.</>
                : <><b>공개 완료</b> — 작성한 글은 즉시 노출되며, 본인은 상세에서 수정·삭제할 수 있습니다.</>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cur = CW_STEPS.find(s => s.id === step);

  return (
    <div className="ou3-page">
      <header className="ou3-head">
        <div className="eyebrow">{isEdit ? '게시글 수정 · COMMUNITY / EDIT' : '글쓰기 · COMMUNITY / NEW'}</div>
        <h1 className="ou3-head__title">{isEdit ? '게시글을 수정합니다' : '커뮤니티 글을 작성합니다'}</h1>
        <p className="ou3-head__sub">
          {isEdit
            ? '기존 내용이 채워져 있습니다. 단계별로 확인하고 수정하세요.'
            : '5단계로 카테고리 · 유형 · 본문 · 추가 정보를 입력하고 게시합니다.'}
        </p>
      </header>

      {/* step indicator */}
      <div className="ou3-steps">
        {CW_STEPS.map(s => (
          <div key={s.id} className="ou3-step" data-active={s.id === step} data-done={s.id < step}>
            <div className="ou3-step__num">{s.id < step ? '✓' : s.id}</div>
            <div className="ou3-step__lbl">{s.lbl}</div>
          </div>
        ))}
      </div>

      <div className="ou3-card">
        <h2 className="ou3-card__h">
          <span className="ico material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', verticalAlign: '-4px', marginRight: 6, fontSize: 22, color: 'var(--accent)' }}>{cur.ico}</span>
          STEP {step} · {cur.lbl}
        </h2>

        {/* STEP 1 — 카테고리 */}
        {step === 1 && (
          <>
            <div className="ou3-card__sub">어떤 게시판에 글을 올릴지 선택합니다. 공지사항은 운영진 전용입니다.</div>
            <div className="cw-cat-grid">
              {cats.map(c => (
                <div key={c.key} className={'cw-cat' + (form.category === c.key ? ' is-on' : '')} onClick={() => setF('category', c.key)}>
                  <div className="cw-cat__ico"><span className="ico material-symbols-outlined">{c.icon}</span></div>
                  <div className="cw-cat__lbl">{c.label}</div>
                  {c.alkija && <span className="cw-cat__tag">대회 연결</span>}
                </div>
              ))}
            </div>
            {isAlkija && (
              <div className="cw-alkija-note">
                <span className="ico material-symbols-outlined">info</span>
                <div>BDR NEWS(알기자)는 대회 기록과 연결되는 기사입니다. STEP 4에서 대회를 선택하며, 게시 전 운영자 검수를 거칩니다.</div>
              </div>
            )}
          </>
        )}

        {/* STEP 2 — 유형 */}
        {step === 2 && (
          <>
            <div className="ou3-card__sub">글의 형식을 선택합니다. 유형에 따라 본문 첨부 방식이 달라집니다.</div>
            <div className="cw-type-grid">
              {types.map(t => (
                <div key={t.key} className={'cw-type' + (form.type === t.key ? ' is-on' : '')} onClick={() => setF('type', t.key)}>
                  <span className="cw-type__ico ico material-symbols-outlined">{t.icon}</span>
                  <div className="cw-type__lbl">{t.label}</div>
                  <div className="cw-type__desc">{t.desc}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* STEP 3 — 본문 */}
        {step === 3 && (
          <>
            <div className="ou3-card__sub">제목과 내용을 입력합니다. {form.type !== 'text' && '이미지·영상은 URL로 첨부합니다.'}</div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">제목<span className="ou3-field__lbl-req">*</span></label>
              <input className="ou3-input" value={form.title} onChange={e => setF('title', e.target.value)} placeholder="제목" maxLength={80} />
            </div>
            <div className="ou3-field">
              <label className="ou3-field__lbl">내용<span className="ou3-field__lbl-req">*</span></label>
              <textarea className="ou3-textarea" style={{ minHeight: 200, lineHeight: 1.7 }} value={form.content} onChange={e => setF('content', e.target.value)} placeholder="내용을 입력하세요" />
              <div className="cw-charcount">{form.content.length.toLocaleString()} / 20,000자</div>
            </div>
            {form.type !== 'text' && (
              <div className="ou3-field">
                <label className="ou3-field__lbl">{form.type === 'video' ? '영상 링크' : '이미지 URL'} <span style={{ color: 'var(--ink-dim)', fontSize: 9.5 }}>(최대 5장)</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input className="ou3-input" inputMode="url" placeholder="https://..." style={{ flex: 1 }} />
                  <button className="btn btn--primary" style={{ flexShrink: 0 }} onClick={() => setF('image_count', Math.min(5, form.image_count + 1))}>
                    <span className="ico material-symbols-outlined">add</span>추가
                  </button>
                </div>
                <div className="ou3-help">{form.image_count}장 첨부됨 · 이미지 호스팅 URL을 입력하세요</div>
              </div>
            )}
          </>
        )}

        {/* STEP 4 — 메타 (카테고리별 분기) */}
        {step === 4 && (
          <>
            <div className="ou3-card__sub">카테고리에 맞는 추가 정보를 입력합니다. 모두 선택 사항입니다.</div>

            {/* 알기자 = 대회 선택 (BC2 cross-domain Phase 1A) */}
            {isAlkija && (
              <div className="ou3-field">
                <label className="ou3-field__lbl">연결 대회<span className="ou3-field__lbl-req">*</span></label>
                <div className="cw-tn-list">
                  {tns.map(t => (
                    <div key={t.id} className={'cw-tn' + (form.tournament_id === t.id ? ' is-on' : '')} onClick={() => setF('tournament_id', t.id)}>
                      <span className="cw-tn__logo">{t.org.avatar}</span>
                      <div className="cw-tn__body">
                        <div className="cw-tn__name">{t.name}</div>
                        <div className="cw-tn__org">{t.org.name} · {t.starts_at}</div>
                      </div>
                      <span className="cw-tn__check ico material-symbols-outlined">check_circle</span>
                    </div>
                  ))}
                </div>
                <div className="ou3-help">선택한 대회의 기록·프로스펙터스와 자동 연결됩니다</div>
              </div>
            )}

            {/* 팀 선택 (cross-domain Phase 3 — team_id) */}
            <div className="ou3-field">
              <label className="ou3-field__lbl">소속 팀 <span style={{ color: 'var(--ink-dim)', fontSize: 9.5 }}>(선택)</span></label>
              <div className="cw-tn-list">
                <div className={'cw-tn' + (form.team_id === '' ? ' is-on' : '')} onClick={() => setF('team_id', '')}>
                  <span className="cw-tn__logo" style={{ background: 'var(--bg-head)', color: 'var(--ink-mute)' }}>—</span>
                  <div className="cw-tn__body"><div className="cw-tn__name">팀 연결 안 함</div></div>
                  <span className="cw-tn__check ico material-symbols-outlined">check_circle</span>
                </div>
                {teams.slice(0, 3).map(t => (
                  <div key={t.id} className={'cw-tn' + (form.team_id === t.id ? ' is-on' : '')} onClick={() => setF('team_id', t.id)}>
                    <span className="cw-tn__logo" style={{ background: t.color }}>{t.logo}</span>
                    <div className="cw-tn__body"><div className="cw-tn__name">{t.name}</div><div className="cw-tn__org">{t.city}</div></div>
                    <span className="cw-tn__check ico material-symbols-outlined">check_circle</span>
                  </div>
                ))}
              </div>
            </div>

            {form.category === 'qna' && (
              <div className="cw-alkija-note" style={{ background: 'var(--cafe-blue-soft)', borderColor: 'var(--cafe-blue-hair)', color: 'var(--cafe-blue-deep)' }}>
                <span className="ico material-symbols-outlined">help</span>
                <div>질문답변 글은 채택된 답변이 상단에 고정됩니다. 답변이 달리면 알림을 받습니다.</div>
              </div>
            )}
          </>
        )}

        {/* STEP 5 — 미리보기 */}
        {step === 5 && (
          <>
            <div className="ou3-card__sub">게시 전 최종 확인합니다. {isAlkija ? '검수 후 공개됩니다.' : '게시 후에도 수정할 수 있습니다.'}</div>
            <div className="cw-preview">
              <div className="cw-preview__badges">
                <window.CategoryBadge cat={form.category} withIcon />
                <window.PostTypeIcon type={form.type} count={form.image_count} />
              </div>
              <h3 className="cw-preview__title">{form.title || '(제목 미입력)'}</h3>
              {form.image_count > 0 && (
                <div className="cw-preview__media"><span className="ico material-symbols-outlined">{form.type === 'video' ? 'play_circle' : 'image'}</span>{form.type === 'video' ? '영상 첨부' : form.image_count + '장 첨부'}</div>
              )}
              <p className="cw-preview__body" style={{ marginTop: 12 }}>{form.content || '(내용 미입력)'}</p>
            </div>
            <div className="ou3-review">
              <div className="ou3-review__row"><span className="ou3-review__l">카테고리</span><span className="ou3-review__v">{catDef.label}</span></div>
              <div className="ou3-review__row"><span className="ou3-review__l">유형</span><span className="ou3-review__v">{(types.find(t => t.key === form.type) || {}).label}</span></div>
              {isAlkija && (
                <div className="ou3-review__row"><span className="ou3-review__l">연결 대회</span>
                  <span className={'ou3-review__v' + (!form.tournament_id ? ' ou3-review__v--empty' : '')}>{(tns.find(t => t.id === form.tournament_id) || {}).name || '미선택'}</span>
                </div>
              )}
              <div className="ou3-review__row"><span className="ou3-review__l">소속 팀</span>
                <span className={'ou3-review__v' + (!form.team_id ? ' ou3-review__v--empty' : '')}>{(teams.find(t => t.id === form.team_id) || {}).name || '연결 안 함'}</span>
              </div>
            </div>
            {isAlkija && (
              <div style={{ padding: '10px 12px', background: 'var(--warn-soft)', border: '1px solid var(--warn-hair)', borderRadius: 'var(--r-sm)', fontSize: 12, color: '#8B5A0F', display: 'flex', gap: 8 }}>
                <span className="ico material-symbols-outlined" style={{ fontFamily: 'Material Symbols Outlined', fontSize: 16, flexShrink: 0 }}>info</span>
                <div style={{ lineHeight: 1.55 }}>알기자 기사는 status=<b>draft</b>로 접수되어 운영자 검수 후 공개됩니다.</div>
              </div>
            )}
          </>
        )}

        {/* footer nav */}
        <div className="ou3-foot">
          <button className="btn" onClick={() => setStep(Math.max(1, step - 1))} disabled={step === 1}
            style={{ opacity: step === 1 ? 0.4 : 1, cursor: step === 1 ? 'not-allowed' : 'pointer' }}>
            <span className="ico material-symbols-outlined">arrow_back</span>이전
          </button>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-mute)', fontWeight: 700 }}>{step}/5 단계</span>
            {step < 5 && (
              <button className="btn btn--primary" onClick={() => setStep(Math.min(5, step + 1))}>
                다음<span className="ico material-symbols-outlined">arrow_forward</span>
              </button>
            )}
            {step === 5 && (
              <button className="btn btn--primary">
                <span className="ico material-symbols-outlined">{isEdit ? 'check' : 'send'}</span>{isEdit ? '수정 완료' : '게시하기'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.CommunityWizard = CommunityWizard;
window.CommunityNew = function CommunityNew() { return <CommunityWizard mode="new" />; };
