/* global React, PWAInstallBanner, PushPermissionPrompt, ProfileCompletionBanner, ImageUploader, SlideMenu, KakaoMapPlaceholder, PlaceAutocomplete, UserDropdown, Avatar */
/**
 * GlobalComponents — Phase E 글로벌 공유 컴포넌트 시안 (showcase)
 *
 * 진입: route='globalComponents' (테스트용 — 출시 X)
 * 복귀: AppNav 더보기 또는 전역 헤더
 * Why: 8 글로벌 컴포넌트 라이트·다크 양쪽 시각 검수
 */
function GlobalComponents({ setRoute }) {
  const { useState, useMemo } = React;

  // 1. PWA banner
  const [pwaPlatform, setPwaPlatform] = useState('android');
  const [pwaOpen, setPwaOpen] = useState(true);

  // 2. Push prompt
  const [pushOpen, setPushOpen] = useState(false);
  const [pushReason, setPushReason] = useState('match');

  // 3. Profile completion
  const [steps, setSteps] = useState([
    { id: 'avatar',   label: '프로필 사진',   done: true  },
    { id: 'nickname', label: '닉네임',        done: true  },
    { id: 'region',   label: '활동 지역',     done: true  },
    { id: 'position', label: '포지션',        done: false, reward: '+50 BDR P' },
    { id: 'bio',      label: '자기소개',      done: false },
    { id: 'notify',   label: '알림 설정',     done: false },
  ]);
  const [profileDismissed, setProfileDismissed] = useState(false);

  // 4. ImageUploader
  const [photos, setPhotos] = useState([
    { id: 'demo1', name: 'court-01.jpg', url: null },
    { id: 'demo2', name: 'jump-shot.jpg', url: null },
  ]);

  // 5. SlideMenu
  const [slideOpen, setSlideOpen] = useState(false);
  const [slideSide, setSlideSide] = useState('auto');
  const [filterTone, setFilterTone] = useState(['active', 'moderate']);

  // 6. KakaoMap
  const markers = [
    { id: 'm1', x: 28, y: 38, name: '한강 잠원지구 농구장', subtitle: '서울 서초구 잠원동',  tone: 'active',   distance: 1.2, label: 'A',  meta: ['풀코트 2면', '주차 가능', '24h'] },
    { id: 'm2', x: 58, y: 30, name: '응봉체육공원',         subtitle: '서울 성동구 응봉동',  tone: 'moderate', distance: 3.4, label: 'M',  meta: ['하프 3면', '주차 X'] },
    { id: 'm3', x: 72, y: 58, name: 'BDR 코트 강남',        subtitle: '서울 강남구 역삼동',  tone: 'brand',    distance: 4.1, label: 'B',  meta: ['예약제', '실내'] },
    { id: 'm4', x: 18, y: 70, name: '여의도공원',           subtitle: '서울 영등포구 여의도', tone: 'active',  distance: 6.0, label: 'A',  meta: ['풀코트 1면'] },
  ];
  const [selMarker, setSelMarker] = useState('m1');

  // 7. PlaceAutocomplete
  const [places, setPlaces] = useState([
    { id: 'gangnam-gu', name: '강남구', region: '서울특별시', kind: '구' },
  ]);

  // 8. UserDropdown — within member card
  const member = { id: 'u1', name: '김주장', tag: 'KJ', position: 'PG · #11', role: 'captain' };

  return (
    <div className="page page--wide" style={{ display: 'grid', gap: 24 }}>
      <header style={{ display: 'flex', alignItems: 'baseline', gap: 12, flexWrap: 'wrap' }}>
        <div>
          <div className="eyebrow">Phase E · 글로벌 컴포넌트</div>
          <h1 style={{ margin: '6px 0 4px', fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 28, letterSpacing: '-0.015em' }}>
            8 Global Shared Components
          </h1>
          <p style={{ margin: 0, color: 'var(--ink-mute)', fontSize: 13.5 }}>
            토큰 var(--*) 만 / 핑크·살몬·lucide·9999px(live 외) 0건. 라이트·다크 양쪽 검증.
          </p>
        </div>
        <div style={{ marginLeft: 'auto', fontFamily: 'var(--ff-mono)', fontSize: 11, color: 'var(--ink-dim)' }}>
          /globalComponents
        </div>
      </header>

      {/* 3. Profile completion — page top */}
      <section>
        <SectionTitle n="3" title="ProfileCompletionBanner" sub="홈 / 마이페이지 상단 진행률 막대" />
        <ProfileCompletionBanner
          steps={steps}
          dismissed={profileDismissed}
          onGo={(id) => alert(`이동: ${id}`)}
          onDismiss={() => setProfileDismissed(true)}
        />
        <Controls>
          <button className="btn btn--sm" onClick={() => setProfileDismissed(false)}>다시 보기</button>
          {steps.map((s, i) => (
            <button key={s.id} className="btn btn--sm" onClick={() => {
              const next = steps.slice(); next[i] = { ...s, done: !s.done }; setSteps(next);
            }}>
              {s.done ? '✓' : '○'} {s.label}
            </button>
          ))}
        </Controls>
      </section>

      {/* 1 + 2 */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
        <div>
          <SectionTitle n="1" title="PWAInstallBanner" sub="모바일 하단 고정 / iOS 안내" />
          <Frame label="bottom-fixed (모바일)">
            <div style={{ position: 'relative', height: 100 }}>
              {pwaOpen && (
                <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }}>
                  {/* render inline copy of banner since position:fixed 는 frame 밖에서 나옴 */}
                  <PWAInstallBanner defaultOpen platform={pwaPlatform} onDismiss={() => setPwaOpen(false)} onInstall={() => alert('install prompt')}/>
                </div>
              )}
            </div>
          </Frame>
          <Controls>
            <button className="btn btn--sm" data-active={pwaPlatform === 'android'} onClick={() => setPwaPlatform('android')}>Android</button>
            <button className="btn btn--sm" data-active={pwaPlatform === 'ios'} onClick={() => setPwaPlatform('ios')}>iOS (안내 모달)</button>
            <button className="btn btn--sm" onClick={() => setPwaOpen(true)}>다시 보기</button>
          </Controls>
        </div>

        <div>
          <SectionTitle n="2" title="PushPermissionPrompt" sub="알림 권한 모달 (3 reasons)" />
          <Frame label="modal preview">
            <button className="btn btn--accent" onClick={() => setPushOpen(true)}>알림 모달 열기</button>
          </Frame>
          <Controls>
            {['match', 'booking', 'team'].map((r) => (
              <button key={r} className="btn btn--sm" data-active={pushReason === r} onClick={() => setPushReason(r)}>{r}</button>
            ))}
          </Controls>
          <PushPermissionPrompt open={pushOpen} reason={pushReason}
            onAllow={() => { setPushOpen(false); alert('Notification.requestPermission()'); }}
            onLater={() => setPushOpen(false)} />
        </div>
      </section>

      {/* 4 */}
      <section>
        <SectionTitle n="4" title="ImageUploader" sub="드래그앤드롭 + 압축 진행률 + 매치당 15장 제한" />
        <ImageUploader items={photos} onChange={setPhotos} max={15} hint="JPG · PNG · WebP · HEIC · 1장당 10MB · 매치당 15장" />
      </section>

      {/* 5 */}
      <section>
        <SectionTitle n="5" title="SlideMenu" sub="페이지 내 보조 슬라이드 (drawer 와 분리)" />
        <Frame label="trigger">
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn--primary" onClick={() => { setSlideSide('auto'); setSlideOpen(true); }}>auto (모바일=bottom)</button>
            <button className="btn" onClick={() => { setSlideSide('right'); setSlideOpen(true); }}>right (PC drawer)</button>
            <button className="btn" onClick={() => { setSlideSide('bottom'); setSlideOpen(true); }}>bottom sheet</button>
          </div>
        </Frame>
        <SlideMenu open={slideOpen} side={slideSide} title="필터 · 정렬"
          onClose={() => setSlideOpen(false)}
          footer={
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn" style={{ flex: 1 }} onClick={() => setFilterTone([])}>초기화</button>
              <button className="btn btn--primary" style={{ flex: 2 }} onClick={() => setSlideOpen(false)}>적용</button>
            </div>
          }>
          <div style={{ display: 'grid', gap: 14 }}>
            <FilterRow label="혼잡도" options={[
              { id: 'active',   label: '활발',   tone: 'var(--ok)' },
              { id: 'moderate', label: '적당',   tone: 'var(--warn)' },
              { id: 'brand',    label: 'BDR 코트', tone: 'var(--accent)' },
            ]} value={filterTone} onChange={setFilterTone} />
            <FilterRow label="유형" options={[
              { id: 'full', label: '풀코트' }, { id: 'half', label: '하프' }, { id: 'indoor', label: '실내' },
            ]} value={['full']} onChange={() => {}} />
          </div>
        </SlideMenu>
      </section>

      {/* 6 */}
      <section>
        <SectionTitle n="6" title="KakaoMap placeholder" sub="인포윈도 마커 — var(--ok) 활발 / var(--warn) 적당 / var(--accent) 브랜드" />
        <KakaoMapPlaceholder markers={markers} selectedId={selMarker} onSelect={setSelMarker} height={360} level={5} />
      </section>

      {/* 7 */}
      <section style={{ maxWidth: 520 }}>
        <SectionTitle n="7" title="PlaceAutocomplete" sub="회원가입 활동지역 / 코트·매치 검색" />
        <label className="label">활동 지역 (최대 3개)</label>
        <PlaceAutocomplete value={places} onChange={setPlaces} max={3} />
      </section>

      {/* 8 */}
      <section>
        <SectionTitle n="8" title="UserDropdown" sub="회원 카드 ⋮ — overflow:visible 룰 (02 §10-7)" />
        <div className="member-card" style={{
          background: 'var(--bg-card)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-card)', padding: '14px 14px 18px',
          maxWidth: 360, position: 'relative',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <Avatar tag={member.tag} name={member.name} color="var(--cafe-blue)" size={48} radius={6} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--ink)' }}>{member.name}</span>
              <span className="badge badge--soft">주장</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--ink-mute)', marginTop: 2 }}>{member.position}</div>
          </div>
          <UserDropdown user={member} role="member" viewerRole="captain"
            onAction={(id) => alert(`action: ${id} → ${member.name}`)} />
          <span className="member-pending-anchor">
            <span className="badge badge--soft">유니폼 신청 중</span>
          </span>
        </div>
      </section>

      <footer style={{
        marginTop: 12, padding: 16, background: 'var(--bg-card)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-card)',
        fontSize: 12, color: 'var(--ink-mute)', lineHeight: 1.7,
      }}>
        <b style={{ color: 'var(--ink)' }}>tokens.css 정합 검수 (02 §1~§9)</b><br/>
        §1 색상 — accent · cafe-blue · bg / bg-alt / bg-card / ink / ink-soft / ink-mute / ink-dim · border · ok / warn / danger 모두 사용 ✓<br/>
        §3 타이포 — ff-display / ff-body / ff-mono ✓ (3 패밀리만 등록)<br/>
        §4 라운딩 — radius-card / radius-chip 사용. nav-badge--live 만 9999px (예외 허용)<br/>
        §5 그림자 — sh-xs / sh-sm / sh-md / sh-lg ✓<br/>
        §9 deprecated — --color-* / --surface 사용 0건 (tokens.css 상단 매핑 표 박제 유지)
      </footer>
    </div>
  );
}

function SectionTitle({ n, title, sub }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 10 }}>
      <span style={{
        fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 800,
        color: 'var(--accent)', background: 'var(--accent-soft)',
        padding: '2px 6px', borderRadius: 4,
      }}>0{n}</span>
      <span style={{ fontFamily: 'var(--ff-display)', fontWeight: 800, fontSize: 17, color: 'var(--ink)' }}>{title}</span>
      <span style={{ fontSize: 12, color: 'var(--ink-mute)' }}>· {sub}</span>
    </div>
  );
}
function Frame({ label, children }) {
  return (
    <div style={{
      background: 'var(--bg-card)', border: '1px dashed var(--border-strong)',
      borderRadius: 'var(--radius-card)', padding: 16, position: 'relative',
    }}>
      <span style={{
        position: 'absolute', top: -8, left: 12, padding: '0 6px',
        background: 'var(--bg)', fontFamily: 'var(--ff-mono)', fontSize: 10,
        color: 'var(--ink-dim)', textTransform: 'uppercase', letterSpacing: '.08em',
      }}>{label}</span>
      {children}
    </div>
  );
}
function Controls({ children }) {
  return (
    <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>{children}</div>
  );
}
function FilterRow({ label, options, value, onChange }) {
  const toggle = (id) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id]);
  return (
    <div>
      <div className="label">{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {options.map((o) => {
          const active = value.includes(o.id);
          return (
            <button key={o.id} onClick={() => toggle(o.id)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '7px 12px', borderRadius: 6, cursor: 'pointer',
                background: active ? 'var(--cafe-blue-soft)' : 'var(--bg-elev)',
                border: `1px solid ${active ? 'var(--cafe-blue)' : 'var(--border-strong)'}`,
                color: active ? 'var(--cafe-blue-deep)' : 'var(--ink-soft)',
                fontWeight: active ? 700 : 600, fontSize: 13,
                whiteSpace: 'nowrap',
              }}>
              {o.tone && <span style={{ width: 10, height: 10, borderRadius: '50%', background: o.tone }} />}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.GlobalComponents = GlobalComponents;
