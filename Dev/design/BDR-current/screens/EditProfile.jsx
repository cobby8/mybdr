/* global React */
/*
  EditProfile — 통합 단일 스크롤 프로필 편집 페이지 (v2.3 재구성)

  변경 핵심:
  - 5탭 사이드바(기본/플레이/연락/사진/공개) 제거 → 단일 스크롤
  - Hero: 큰 RDM 아바타(좌) + 우측 닉네임/실명/포지션·번호/시즌 등 기본 정보 (첨부 사진 레이아웃)
  - 카메라 아이콘(아바타 우하단) 클릭 → 파일 picker 열림 (UI mock)
  - Settings 와의 중복 정리: 닉네임·실명·포지션·신장·주력손·공개 범위는 EditProfile 단독,
    비밀번호·2단계·알림 ON/OFF·결제는 Settings 단독
  - 13 룰: 4px 라운딩(아바타 50% 예외), 토큰만, 모바일 720px 분기 + 44px 터치
*/

const { useState, useRef } = React;

function EditProfile({ setRoute }) {
  const [profile, setProfile] = useState({
    nickname: 'rdm_captain',
    realName: '리딤',
    bio: '좌공 좌포 · 스팟업 슈터. 주말 아침 코트 즐겨찾기.',
    pos: 'G',
    posDetail: 'PG',
    number: 7,
    height: 182,
    weight: 78,
    hand: 'R',
    level: 'L.8',
    season: '2026 Spring',
    since: 2019,
    birth: '1998-05-12',
    area: '서울 성동구',
    phone: '010-****-**89',
    email: 'rdm@example.com',
    instagram: '',
    youtube: '',
    avatar: null,
  });
  const [strengths, setStrengths] = useState(new Set(['3점슛', '스팟업']));
  const [privacy, setPrivacy] = useState({
    profile: 'all',
    realName: 'none',
    contact: 'friends',
    record: 'all',
    review: 'all',
    area: 'all',
    body: 'friends',
  });
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);

  const update = (k, v) => setProfile(p => ({ ...p, [k]: v }));
  const toggleStrength = (s) => {
    const next = new Set(strengths);
    next.has(s) ? next.delete(s) : next.add(s);
    setStrengths(next);
  };
  const setPriv = (k, v) => setPrivacy(p => ({ ...p, [k]: v }));

  const onPickFile = () => fileRef.current?.click();
  const onFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => update('avatar', reader.result);
    reader.readAsDataURL(f);
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page edit-profile">
      {/* Breadcrumb */}
      <div className="edit-profile__crumb">
        <a onClick={() => setRoute('home')}>홈</a>
        <span>›</span>
        <a onClick={() => setRoute('mypage')}>마이페이지</a>
        <span>›</span>
        <span className="edit-profile__crumb-current">프로필 편집</span>
      </div>

      {/* Page header + Save bar */}
      <div className="edit-profile__topbar">
        <div>
          <div className="eyebrow">EDIT PROFILE · 프로필 편집</div>
          <h1 className="edit-profile__title">프로필 편집</h1>
        </div>
        <div className="edit-profile__actions">
          {saved && <span className="edit-profile__saved">✓ 저장됨</span>}
          <button className="btn" onClick={() => setRoute('mypage')}>취소</button>
          <button className="btn btn--primary" onClick={handleSave}>저장</button>
        </div>
      </div>

      {/* ============================================================
          HERO — 큰 아바타(좌) + 기본 정보(우)
          첨부 2번 사진 레이아웃: 좌측 원형 RDM 아바타 + 우측 정보 스택
          카메라 아이콘 클릭으로 사진 교체
          ============================================================ */}
      <section className="edit-profile__hero">
        <div className="edit-profile__avatar-wrap">
          <div
            className="edit-profile__avatar"
            role="img"
            aria-label="프로필 사진"
          >
            {profile.avatar ? (
              <img src={profile.avatar} alt="프로필" />
            ) : (
              <span className="edit-profile__avatar-mono">RDM</span>
            )}
          </div>
          <button
            type="button"
            className="edit-profile__camera"
            onClick={onPickFile}
            aria-label="프로필 사진 교체"
            title="사진 교체"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={onFile}
            style={{ display: 'none' }}
          />
        </div>

        <div className="edit-profile__hero-info">
          <div className="edit-profile__hero-eyebrow">
            <span className="eyebrow-mark"/>
            MY PAGE · 마이페이지
          </div>
          <h2 className="edit-profile__hero-title">
            <span className="edit-profile__hero-nick">{profile.nickname}</span>
            <span className="edit-profile__hero-particle">의 농구</span>
          </h2>
          <div className="edit-profile__hero-meta">
            <span>{profile.realName}</span>
            <span className="dot">·</span>
            <span>{profile.posDetail || posLabel(profile.pos)}</span>
            <span className="dot">·</span>
            <span className="t-mono">#{profile.number}</span>
            <span className="dot">·</span>
            <span>{profile.season}</span>
          </div>
          <div className="edit-profile__hero-badges">
            <span className="badge badge--red">{profile.level}</span>
            <span className="badge badge--blue">PRO 멤버</span>
            <span className="badge badge--ok">✓ 본인인증</span>
          </div>
        </div>
      </section>

      {/* ============================================================
          단일 스크롤 — 5섹션 (앵커 네비)
          ============================================================ */}
      <nav className="edit-profile__anchors" aria-label="페이지 내 섹션">
        <a href="#sec-basic">기본 정보</a>
        <a href="#sec-play">플레이 정보</a>
        <a href="#sec-contact">연락 정보</a>
        <a href="#sec-privacy">공개 설정</a>
      </nav>

      {/* ===== ① 기본 정보 ===== */}
      <section id="sec-basic" className="edit-profile__sec">
        <header className="edit-profile__sec-head">
          <h3>① 기본 정보</h3>
          <p>커뮤니티에 표시되는 핵심 정보. 닉네임은 매칭·랭킹·게시판에 노출됩니다.</p>
        </header>
        <div className="edit-profile__grid edit-profile__grid--2">
          <Field label="닉네임 *" sub="커뮤니티에 표시되는 이름">
            <input className="input" value={profile.nickname} onChange={e => update('nickname', e.target.value)} />
          </Field>
          <Field label="실명" sub="본인인증으로 자동 입력 · 수정 불가">
            <input className="input" value={profile.realName} disabled readOnly />
          </Field>
          <Field label="활동 지역" sub="주 활동 시·구">
            <input className="input" value={profile.area} onChange={e => update('area', e.target.value)} />
          </Field>
          <Field label="등번호" sub="매칭·게스트 모집 시 표시">
            <input className="input t-mono" type="number" value={profile.number} onChange={e => update('number', Number(e.target.value))} />
          </Field>
          <Field label="농구 시작 연도">
            <select className="input" value={profile.since} onChange={e => update('since', Number(e.target.value))}>
              {Array.from({ length: 30 }, (_, i) => 2026 - i).map(y => (
                <option key={y} value={y}>{y}년</option>
              ))}
            </select>
          </Field>
          <Field label="생년월일" sub="비공개 · 나이별 대회 자격용">
            <input className="input" type="date" value={profile.birth} onChange={e => update('birth', e.target.value)} />
          </Field>
          <Field label="자기소개" sub={`${profile.bio.length}/200`} full>
            <textarea
              className="input"
              rows={3}
              value={profile.bio}
              onChange={e => update('bio', e.target.value)}
              maxLength={200}
              style={{ resize: 'vertical' }}
            />
          </Field>
        </div>
      </section>

      {/* ===== ② 플레이 정보 ===== */}
      <section id="sec-play" className="edit-profile__sec">
        <header className="edit-profile__sec-head">
          <h3>② 플레이 정보</h3>
          <p>매칭·게스트 모집에 노출됩니다. 자체 평가 — 레이팅에 영향 없음.</p>
        </header>

        <Field label="주 포지션 *" sub="게스트·매칭 필터링에 사용">
          <div className="edit-profile__chips">
            {[
              { v: 'PG', l: 'PG' }, { v: 'SG', l: 'SG' }, { v: 'SF', l: 'SF' },
              { v: 'PF', l: 'PF' }, { v: 'C',  l: 'C'  },
            ].map(p => (
              <button
                key={p.v}
                type="button"
                className={`chip ${profile.posDetail === p.v ? 'chip--active' : ''}`}
                onClick={() => update('posDetail', p.v)}
              >{p.l}</button>
            ))}
          </div>
        </Field>

        <div className="edit-profile__grid edit-profile__grid--2" style={{ marginTop: 16 }}>
          <Field label="신장 (cm)">
            <input className="input t-mono" type="number" value={profile.height} onChange={e => update('height', Number(e.target.value))} />
          </Field>
          <Field label="체중 (kg)" sub="비공개">
            <input className="input t-mono" type="number" value={profile.weight} onChange={e => update('weight', Number(e.target.value))} />
          </Field>
        </div>

        <Field label="주 사용 손" style={{ marginTop: 16 }}>
          <div className="edit-profile__chips">
            {[{ v: 'L', l: '왼손' }, { v: 'R', l: '오른손' }, { v: 'B', l: '양손' }].map(h => (
              <button
                key={h.v}
                type="button"
                className={`chip ${profile.hand === h.v ? 'chip--active' : ''}`}
                onClick={() => update('hand', h.v)}
              >{h.l}</button>
            ))}
          </div>
        </Field>

        <Field label="실력 수준 *" sub="자체 평가 · 레이팅 반영 안 됨" style={{ marginTop: 16 }}>
          <div className="edit-profile__chips">
            {['초보', '초-중급', '중급', '중-상급', '상급', '선출급'].map(l => (
              <button
                key={l}
                type="button"
                className={`chip ${profile.level === l ? 'chip--active' : ''}`}
                onClick={() => update('level', l)}
              >{l}</button>
            ))}
          </div>
        </Field>

        <Field label="강점 (복수 선택)" sub="게스트 지원 시 호스트에게 보임" style={{ marginTop: 16 }}>
          <div className="edit-profile__chips">
            {['3점슛', '돌파', '미드레인지', '스크린', '리바운드', '스틸', '패싱', '체력', '수비', '스팟업'].map(s => (
              <button
                key={s}
                type="button"
                className={`chip ${strengths.has(s) ? 'chip--active' : ''}`}
                onClick={() => toggleStrength(s)}
              >{s}</button>
            ))}
          </div>
        </Field>
      </section>

      {/* ===== ③ 연락 정보 ===== */}
      <section id="sec-contact" className="edit-profile__sec">
        <header className="edit-profile__sec-head">
          <h3>③ 연락 정보</h3>
          <p>공개 여부는 [공개 설정] 섹션에서 조정합니다. 비밀번호·2단계 인증은 <a onClick={() => setRoute('settings')}>환경 설정</a>으로.</p>
        </header>
        <div className="edit-profile__grid edit-profile__grid--2">
          <Field label="이메일 *" sub="계정 로그인·알림용">
            <input className="input" type="email" value={profile.email} onChange={e => update('email', e.target.value)} />
          </Field>
          <Field label="휴대폰" sub="본인인증으로 자동 입력 · 수정 불가">
            <div className="edit-profile__inline">
              <input className="input" value={profile.phone} disabled readOnly />
              <span className="edit-profile__verified">✓ 인증 완료</span>
            </div>
          </Field>
          <Field label="인스타그램" sub="@아이디만 (선택)">
            <input className="input" placeholder="@rdm_hoops" value={profile.instagram} onChange={e => update('instagram', e.target.value)} />
          </Field>
          <Field label="유튜브" sub="개인 채널 (선택)">
            <input className="input" placeholder="https://…" value={profile.youtube} onChange={e => update('youtube', e.target.value)} />
          </Field>
        </div>
      </section>

      {/* ===== ④ 공개 설정 ===== */}
      <section id="sec-privacy" className="edit-profile__sec">
        <header className="edit-profile__sec-head">
          <h3>④ 공개 설정</h3>
          <p>
            항목별 노출 범위. <strong>전체 공개 / 친구 공개 / 비공개</strong> 3단계.
            계정 보안·알림 ON/OFF·결제는 <a onClick={() => setRoute('settings')}>환경 설정</a> 에서 관리합니다.
          </p>
        </header>
        <div className="edit-profile__priv">
          {[
            { id: 'profile',  l: '프로필 전체',   d: '나의 프로필 페이지 자체' },
            { id: 'realName', l: '실명',         d: profile.realName },
            { id: 'contact',  l: '연락처',       d: '휴대폰 · 이메일' },
            { id: 'record',   l: '경기 기록',    d: '스탯 · 이력' },
            { id: 'review',   l: '매너 평가',    d: '받은 리뷰' },
            { id: 'area',     l: '활동 지역',    d: profile.area },
            { id: 'body',     l: '신장 · 체중',  d: '프로필 정보' },
          ].map(r => (
            <div key={r.id} className="edit-profile__priv-row">
              <div className="edit-profile__priv-info">
                <div className="edit-profile__priv-label">{r.l}</div>
                <div className="edit-profile__priv-desc">{r.d}</div>
              </div>
              <div className="edit-profile__priv-options">
                {[{ v: 'all', l: '전체' }, { v: 'friends', l: '친구' }, { v: 'none', l: '비공개' }].map(o => (
                  <button
                    key={o.v}
                    type="button"
                    className={`chip ${privacy[r.id] === o.v ? 'chip--active' : ''}`}
                    onClick={() => setPriv(r.id, o.v)}
                  >{o.l}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Footer save bar (sticky) ===== */}
      <div className="edit-profile__sticky">
        <div>변경사항이 있으면 저장을 눌러주세요.</div>
        <div className="edit-profile__actions">
          {saved && <span className="edit-profile__saved">✓ 저장됨</span>}
          <button className="btn" onClick={() => setRoute('mypage')}>취소</button>
          <button className="btn btn--primary" onClick={handleSave}>저장</button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================
function Field({ label, sub, children, full, style }) {
  return (
    <div className={`edit-profile__field ${full ? 'edit-profile__field--full' : ''}`} style={style}>
      <div className="edit-profile__field-head">
        <label>{label}</label>
        {sub && <span className="edit-profile__field-sub">{sub}</span>}
      </div>
      {children}
    </div>
  );
}

function posLabel(p) {
  return ({ G: '가드', F: '포워드', C: '센터' })[p] || p;
}

window.EditProfile = EditProfile;
