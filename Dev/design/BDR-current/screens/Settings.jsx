/* global React */
/*
  Settings — 시스템 설정 단독 페이지 (v2.3 재구성)

  EditProfile 과의 책임 분리:
  - EditProfile = 닉네임/실명/포지션/신장/주력손/소개/공개 범위 (프로필 콘텐츠)
  - Settings    = 비밀번호/2단계/연결계정/로그인기기/알림 ON/OFF/결제/계정관리 (시스템·보안)

  변경:
  - "프로필" 섹션 삭제 (중복 제거)
  - "공개 범위" 섹션 삭제 (EditProfile §5 로 이전)
  - 5섹션 유지: 계정 / 알림 / 결제·멤버십 / 표시·접근성 / 계정 관리
  - 표시·접근성 신규 (시스템 영역) — 언어, 시간대, 다크모드 모드 고정 옵션
  - 표시·접근성 안에 "하단 자주가기 (모바일)" 편집기 추가 — Phase 19
  - 13 룰: 4px 라운딩, 토큰만, 모바일 720px 분기
*/

const { useState } = React;

function BottomNavEditor() {
  const [slots, setSlots] = React.useState(window.getBottomNavSlots());

  const update = (next) => {
    setSlots(next);
    window.setBottomNavSlots(next);
  };

  const move = (idx, dir) => {
    const j = idx + dir;
    if (j < 0 || j >= slots.length) return;
    const next = [...slots];
    [next[idx], next[j]] = [next[j], next[idx]];
    update(next);
  };

  const removeSlot = (idx) => {
    if (slots.length <= 1) return;     // never empty the bar
    update(slots.filter((_, i) => i !== idx));
  };

  const toggleCatalog = (id) => {
    if (slots.includes(id)) {
      update(slots.filter(s => s !== id));
    } else {
      if (slots.length >= 5) return;   // hard cap at 5
      update([...slots, id]);
    }
  };

  const reset = () => update(window.BOTTOM_NAV_DEFAULT);

  const filled = slots.length;
  const empty = 5 - filled;

  return (
    <div className="bn-editor">
      <p className="bn-editor__lead">
        모바일 하단에 항상 노출되는 자주가기 5개를 선택하고 순서를 정합니다.
        선택은 이 기기에 저장됩니다.
      </p>

      <div className="bn-editor__section-h">
        <span>현재 자주가기</span>
        <small>{filled}/5{empty > 0 ? ` · 빈 슬롯 ${empty}` : ''}</small>
      </div>
      <div className="bn-editor__slots">
        {slots.map((id, idx) => {
          const item = window.BOTTOM_NAV_CATALOG.find(c => c.id === id);
          if (!item) return null;
          const IconComp = window.Icon[item.icon] || window.Icon.navHome;
          return (
            <div key={id} className="bn-editor__slot">
              <span className="bn-editor__slot-icon"><IconComp/></span>
              <span className="bn-editor__slot-label">{item.label}</span>
              <span className="bn-editor__slot-pos">{idx + 1}</span>
              <div className="bn-editor__slot-actions">
                <button
                  type="button"
                  className="bn-editor__icon-btn"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  aria-label="왼쪽으로 이동"
                  title="왼쪽으로"
                ><window.Icon.navUp style={{transform: 'rotate(-90deg)'}}/></button>
                <button
                  type="button"
                  className="bn-editor__icon-btn"
                  onClick={() => move(idx, 1)}
                  disabled={idx === slots.length - 1}
                  aria-label="오른쪽으로 이동"
                  title="오른쪽으로"
                ><window.Icon.navUp style={{transform: 'rotate(90deg)'}}/></button>
                <button
                  type="button"
                  className="bn-editor__icon-btn bn-editor__icon-btn--remove"
                  onClick={() => removeSlot(idx)}
                  disabled={slots.length <= 1}
                  aria-label="제거"
                  title="제거"
                ><window.Icon.navX/></button>
              </div>
            </div>
          );
        })}
        {Array.from({ length: empty }).map((_, i) => (
          <div key={`empty-${i}`} className="bn-editor__slot" style={{opacity: 0.4, borderStyle: 'dashed'}}>
            <span className="bn-editor__slot-pos">{filled + i + 1}</span>
            <span className="bn-editor__slot-label" style={{color: 'var(--ink-dim)', marginTop: 6}}>비어있음</span>
          </div>
        ))}
      </div>
      <div className="bn-editor__hint">
        <span>← → 화살표로 순서 변경 · × 로 제거</span>
        <button type="button" className="bn-editor__reset" onClick={reset}>기본값으로 복원</button>
      </div>

      <div className="bn-editor__section-h">
        <span>전체 메뉴</span>
        <small>탭으로 추가 / 제거</small>
      </div>
      <div className="bn-editor__catalog">
        {window.BOTTOM_NAV_CATALOG.map(item => {
          const selectedIdx = slots.indexOf(item.id);
          const selected = selectedIdx >= 0;
          const disabled = !selected && slots.length >= 5;
          const IconComp = window.Icon[item.icon] || window.Icon.navHome;
          return (
            <button
              key={item.id}
              type="button"
              className={`bn-editor__cat-btn ${selected ? 'is-selected' : ''}`}
              onClick={() => toggleCatalog(item.id)}
              disabled={disabled}
              title={disabled ? '5개까지만 선택할 수 있어요' : ''}
            >
              {selected && <span className="bn-editor__cat-pos">{selectedIdx + 1}</span>}
              <IconComp/>
              <span className="bn-editor__cat-name">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="bn-editor__notice">
        ✓ 변경사항이 즉시 적용됩니다. 페이지 하단을 확인하세요.
      </div>
    </div>
  );
}

function Settings({ setRoute }) {
  const [section, setSection] = useState('account');
  const sections = [
    { id: 'account',    label: '계정 · 보안' },
    { id: 'feed',       label: '맞춤설정' },
    { id: 'notify',     label: '알림' },
    { id: 'bottomNav',  label: '하단 자주가기' },
    { id: 'billing',    label: '결제 · 멤버십' },
    { id: 'display',    label: '표시 · 접근성' },
    { id: 'danger',     label: '계정 관리' },
  ];

  // 맞춤설정 — 홈·피드·경기·대회 노출 필터
  const [feed, setFeed] = useState({
    gender: 'all',
    type: ['5x5', '3x3'],
    division: ['amateur'],
    region: ['seoul'],
  });
  const setFeedKey = (k, v) => setFeed(p => ({ ...p, [k]: v }));
  const toggleFeed = (k, v) => {
    setFeed(p => ({
      ...p,
      [k]: p[k].includes(v) ? p[k].filter(x => x !== v) : [...p[k], v],
    }));
  };

  const Toggle = ({ label, desc, defaultChecked }) => {
    const [on, setOn] = useState(!!defaultChecked);
    return (
      <div className="settings__row">
        <div>
          <div className="settings__row-label">{label}</div>
          {desc && <div className="settings__row-desc">{desc}</div>}
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          onClick={() => setOn(v => !v)}
          className={`settings__switch ${on ? 'is-on' : ''}`}
        >
          <span className="settings__switch-dot"/>
        </button>
      </div>
    );
  };

  const Row = ({ label, value, action, onClick }) => (
    <div className="settings__row">
      <div className="settings__row-label">{label}</div>
      <div className="settings__row-action">
        <span className="settings__row-value">{value}</span>
        <button className="btn" onClick={onClick}>{action}</button>
      </div>
    </div>
  );

  return (
    <div className="page settings">
      <div className="settings__container">
        <div className="settings__head">
          <div className="eyebrow">SETTINGS · 환경 설정</div>
          <h1 className="settings__title">환경 설정</h1>
          <div className="settings__sub">
            계정·보안·알림·결제 등 시스템 설정. 프로필 콘텐츠 편집은
            {' '}<a onClick={() => setRoute('editProfile')}>프로필 편집</a> 으로 이동.
          </div>
        </div>

        <div className="settings__body">
          <nav className="settings__nav card">
            {sections.map(s => (
              <button
                key={s.id}
                onClick={() => setSection(s.id)}
                className={`settings__nav-btn ${section === s.id ? 'is-active' : ''}`}
              >
                {s.label}
              </button>
            ))}
          </nav>

          <div className="settings__panel card">
            {section === 'account' && (
              <>
                <h2 className="settings__h2">계정 · 보안</h2>
                <p className="settings__lead">로그인·인증·연결된 계정 관리</p>
                <Row label="이메일" value="rdm_captain@mybdr.kr" action="변경"/>
                <Row label="비밀번호" value="마지막 변경 3개월 전" action="변경"/>
                <Row label="2단계 인증" value="비활성" action="켜기"/>
                <Row label="연결된 계정" value="카카오 · 구글" action="관리"/>
                <Row label="로그인 기기" value="3대 (iPhone · MacBook · 크롬)" action="관리"/>
                <Row label="활동 로그" value="최근 30일" action="보기"/>
              </>
            )}
            {section === 'feed' && (
              <>
                <h2 className="settings__h2">맞춤설정</h2>
                <p className="settings__lead">선택한 조건에 맞는 경기 · 대회 · 픽업만 홈 · 피드에 노출됩니다 · 언제든 변경 가능</p>

                <div className="settings__feed-group">
                  <div className="settings__feed-label">성별</div>
                  <div className="settings__feed-desc">선수구성 기준 경기 종별</div>
                  <div className="settings__feed-chips">
                    {[
                      { v: 'all',    l: '전체' },
                      { v: 'male',   l: '남자' },
                      { v: 'female', l: '여자' },
                      { v: 'mixed',  l: '혼성' },
                    ].map(o => (
                      <button
                        key={o.v}
                        type="button"
                        className={`chip ${feed.gender === o.v ? 'chip--active' : ''}`}
                        onClick={() => setFeedKey('gender', o.v)}
                      >{o.l}</button>
                    ))}
                  </div>
                </div>

                <div className="settings__feed-group">
                  <div className="settings__feed-label">종별</div>
                  <div className="settings__feed-desc">경기 형식 · 복수 선택</div>
                  <div className="settings__feed-chips">
                    {[
                      { v: '5x5',       l: '5x5 풀코트' },
                      { v: '3x3',       l: '3x3' },
                      { v: 'halfcourt', l: '하프코트' },
                      { v: 'league',    l: '리그' },
                      { v: 'tour',      l: '투어 · 대회' },
                    ].map(o => (
                      <button
                        key={o.v}
                        type="button"
                        className={`chip ${feed.type.includes(o.v) ? 'chip--active' : ''}`}
                        onClick={() => toggleFeed('type', o.v)}
                      >{o.l}</button>
                    ))}
                  </div>
                </div>

                <div className="settings__feed-group">
                  <div className="settings__feed-label">디비전</div>
                  <div className="settings__feed-desc">실력 · 경력 등급 · 복수 선택</div>
                  <div className="settings__feed-chips">
                    {[
                      { v: 'open',    l: 'OPEN 제한없음' },
                      { v: 'amateur', l: 'AMATEUR 비선출' },
                      { v: 'rookie',  l: 'ROOKIE 입문' },
                      { v: 'master',  l: 'MASTER 35+' },
                      { v: 'women',   l: 'WOMEN' },
                    ].map(o => (
                      <button
                        key={o.v}
                        type="button"
                        className={`chip ${feed.division.includes(o.v) ? 'chip--active' : ''}`}
                        onClick={() => toggleFeed('division', o.v)}
                      >{o.l}</button>
                    ))}
                  </div>
                </div>

                <div className="settings__feed-group">
                  <div className="settings__feed-label">지역</div>
                  <div className="settings__feed-desc">관심 지역 · 복수 선택</div>
                  <div className="settings__feed-chips">
                    {[
                      { v: 'seoul',      l: '서울' },
                      { v: 'gyeonggi',   l: '경기' },
                      { v: 'incheon',    l: '인천' },
                      { v: 'busan',      l: '부산' },
                      { v: 'daegu',      l: '대구' },
                      { v: 'gwangju',    l: '광주' },
                      { v: 'daejeon',    l: '대전' },
                      { v: 'ulsan',      l: '울산' },
                      { v: 'gangwon',    l: '강원' },
                      { v: 'chungcheong',l: '충청' },
                      { v: 'jeolla',     l: '전라' },
                      { v: 'gyeongsang', l: '경상' },
                      { v: 'jeju',       l: '제주' },
                    ].map(o => (
                      <button
                        key={o.v}
                        type="button"
                        className={`chip ${feed.region.includes(o.v) ? 'chip--active' : ''}`}
                        onClick={() => toggleFeed('region', o.v)}
                      >{o.l}</button>
                    ))}
                  </div>
                </div>

                <div className="settings__feed-summary">
                  <div>
                    <div className="settings__feed-summary-label">현재 설정</div>
                    <div className="settings__feed-summary-val">
                      {[
                        feed.gender === 'all' ? '전체 성별' : ({ male: '남자', female: '여자', mixed: '혼성' })[feed.gender],
                        `종별 ${feed.type.length}개`,
                        `디비전 ${feed.division.length}개`,
                        `지역 ${feed.region.length}개`,
                      ].join(' · ')}
                    </div>
                  </div>
                  <button
                    className="btn"
                    onClick={() => setFeed({ gender: 'all', type: [], division: [], region: [] })}
                  >초기화</button>
                </div>
              </>
            )}
            {section === 'notify' && (
              <>
                <h2 className="settings__h2">알림</h2>
                <p className="settings__lead">받을 알림 종류 ON/OFF</p>
                <Toggle label="이메일 알림" desc="주요 알림을 이메일로 받음" defaultChecked/>
                <Toggle label="푸시 알림" desc="모바일 앱 푸시" defaultChecked/>
                <Toggle label="대회 접수 마감 D-3" defaultChecked/>
                <Toggle label="경기 신청 승인 / 거절" defaultChecked/>
                <Toggle label="댓글 · 멘션" defaultChecked/>
                <Toggle label="좋아요"/>
                <Toggle label="팀 소식" defaultChecked/>
                <Toggle label="마케팅 · 프로모션"/>
              </>
            )}
            {section === 'billing' && (
              <>
                <h2 className="settings__h2">결제 · 멤버십</h2>
                <p className="settings__lead">현재 플랜과 결제 정보</p>
                <div className="settings__plan">
                  <div className="settings__plan-eyebrow">현재 플랜</div>
                  <div className="settings__plan-name">BDR+</div>
                  <div className="settings__plan-meta">₩4,900 / 월 · 다음 결제 2026.05.20</div>
                </div>
                <Row label="결제수단" value="카드 **** 8822" action="변경"/>
                <Row label="결제 내역" value="최근 6건" action="보기"/>
                <Row label="영수증 · 세금계산서" value="월말 발행" action="발급"/>
                <div className="settings__plan-actions">
                  <button className="btn" onClick={() => setRoute('pricing')}>플랜 변경</button>
                  <button className="btn">구독 취소</button>
                </div>
              </>
            )}
            {section === 'display' && (
              <>
                <h2 className="settings__h2">표시 · 접근성</h2>
                <p className="settings__lead">언어 · 시간대 · 다크모드 · 폰트 크기</p>
                <Row label="언어" value="한국어" action="변경"/>
                <Row label="시간대" value="GMT+9 (서울)" action="변경"/>
                <Row label="다크모드" value="시스템 설정 따름" action="변경"/>
                <Row label="폰트 크기" value="기본" action="변경"/>
                <Toggle label="모션 줄이기" desc="화면 전환 애니메이션 감소"/>
                <Toggle label="고대비 모드" desc="명도 대비 강화"/>
              </>
            )}
            {section === 'bottomNav' && (
              <>
                <h2 className="settings__h2">하단 자주가기 <span style={{fontSize: 13, fontWeight: 500, color: 'var(--ink-mute)', marginLeft: 8}}>모바일 전용</span></h2>
                <p className="settings__lead">모바일 화면 하단에 항상 노출되는 빠른 이동 버튼 5개를 직접 고르세요.</p>
                <BottomNavEditor/>
              </>
            )}
            {section === 'danger' && (
              <>
                <h2 className="settings__h2 settings__h2--danger">계정 관리</h2>
                <p className="settings__lead">신중히 결정하세요 — 되돌릴 수 없는 작업</p>
                <div className="settings__danger-card">
                  <div className="settings__danger-title">데이터 내보내기</div>
                  <div className="settings__danger-desc">프로필 · 경기 기록 · 게시물 전체를 ZIP 으로 받기</div>
                  <button className="btn">요청하기</button>
                </div>
                <div className="settings__danger-card">
                  <div className="settings__danger-title">계정 비활성화</div>
                  <div className="settings__danger-desc">30 일간 숨김 처리 · 로그인 시 복구 가능</div>
                  <button className="btn">비활성화</button>
                </div>
                <div className="settings__danger-card settings__danger-card--final">
                  <div className="settings__danger-title settings__danger-title--final">계정 삭제</div>
                  <div className="settings__danger-desc">모든 데이터 영구 삭제 · 복구 불가</div>
                  <button className="btn btn--primary">계정 삭제</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Settings = Settings;
