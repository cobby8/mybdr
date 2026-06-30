/* global React */
// ============================================================
// BDR v2.24 — ProfileEdit (PU2 · Phase 6.1B · 보강 · BP4)
// 운영: /profile/edit (1689 line · v2.3 박제 · 단일 스크롤 5섹션 Hybrid) — 거대 carry-over.
//   시각 작은 변경만 (신규 LOC 최소):
//   PU2-A 결제 섹션 = Phase 6.2 link out + "준비 중"
//   PU2-B privacy_settings 토글 명확화 (공개 vs 비공개)
//   PU2-C 저장 = "저장 + PU1 새로고침" 시각 명확화
//
// 진입: PU1 "프로필 편집" / 더보기
// 복귀: PageBack → PU1 (저장 후 PU1 동기화)
// ============================================================
function PrivacyToggle({ item }) {
  const [on, setOn] = React.useState(item.on);
  return (
    <div className="pm-priv__row">
      <div className="pm-priv__body">
        <div className="pm-priv__t">{item.label}</div>
        <div className="pm-priv__d">{item.desc}</div>
      </div>
      <span className="pm-priv__state" data-on={on}>{on ? '공개' : '비공개'}</span>
      <button className="pm-toggle" data-on={on} onClick={() => setOn(!on)} aria-label={item.label}><span className="pm-toggle__h" /></button>
    </div>
  );
}

function ProfileEdit() {
  const u = window.USER_ME;
  const p = u.privacy_settings;
  const privacyItems = [
    { key: 'bio', label: '소개글 · 포지션', desc: '공개 프로필 상단에 표시', on: p.bio },
    { key: 'region', label: '활동 지역', desc: '시/구 단위 노출', on: p.region !== false },
    { key: 'height_weight', label: '키 · 몸무게', desc: '신체 정보 공개', on: p.height_weight },
    { key: 'season_stat', label: '시즌 기록 · 통산', desc: '경기 stat / 평점 공개', on: p.season_stat },
    { key: 'teams', label: '소속 팀 · 단체', desc: '소속 정보 공개', on: p.teams },
    { key: 'activity', label: '최근 활동', desc: '최근 경기 · 게시글 공개', on: p.activity },
    { key: 'email', label: '이메일', desc: '항상 비공개 권장', on: p.email },
    { key: 'phone', label: '연락처', desc: '항상 비공개 권장', on: p.phone },
  ];

  return (
    <div className="pm-page">
      <div className="pm-page__inner" style={{ maxWidth: 820 }}>
        <window.PageBack />

        {/* Hero (편집 모드) */}
        <header className="pm-hero" style={{ paddingBottom: 20 }}>
          <div className="pm-hero__row">
            <div className="pm-hero__av">{u.avatar}</div>
            <div className="pm-hero__body">
              <div className="pm-hero__namerow">
                <h1 className="pm-hero__name">프로필 편집</h1>
                <window.LevelBadge level={u.level} pro={u.subscription_status === 'active'} />
              </div>
              <div className="pm-hero__meta"><span><span className="ico material-symbols-outlined">badge</span>{u.public_id}</span></div>
              <div className="pm-hero__actions" style={{ marginTop: 12 }}>
                <button className="pm-hbtn"><span className="ico material-symbols-outlined">photo_camera</span>사진 변경</button>
              </div>
            </div>
          </div>
        </header>

        {/* 섹션 1 — 기본 정보 */}
        <div className="pm-edit-sec">
          <div className="pm-edit-sec__bar"><span className="pm-edit-sec__num">1</span><span className="pm-edit-sec__t">기본 정보</span></div>
          <div className="pm-edit-sec__body">
            <div className="pm-row2">
              <div className="pm-field"><label className="pm-field__l">닉네임</label><input className="pm-input" defaultValue={u.nickname} /></div>
              <div className="pm-field"><label className="pm-field__l">아이디 (public_id)</label><input className="pm-input" defaultValue={u.public_id} /></div>
            </div>
            <div className="pm-row2">
              <div className="pm-field"><label className="pm-field__l">활동 지역 (시)</label><input className="pm-input" defaultValue={u.city} /></div>
              <div className="pm-field"><label className="pm-field__l">활동 지역 (구)</label><input className="pm-input" defaultValue={u.district} /></div>
            </div>
            <div className="pm-field"><label className="pm-field__l">소개글</label><textarea className="pm-textarea" defaultValue={u.bio} /></div>
          </div>
        </div>

        {/* 섹션 2 — 농구 정보 */}
        <div className="pm-edit-sec">
          <div className="pm-edit-sec__bar"><span className="pm-edit-sec__num">2</span><span className="pm-edit-sec__t">농구 정보</span></div>
          <div className="pm-edit-sec__body">
            <div className="pm-row2">
              <div className="pm-field"><label className="pm-field__l">주 사용 손</label>
                <select className="pm-select" defaultValue={u.dominant_hand}><option value="right">오른손</option><option value="left">왼손</option><option value="both">양손</option></select>
              </div>
              <div className="pm-field"><label className="pm-field__l">실력 수준</label>
                <select className="pm-select" defaultValue={u.skill_level}><option value="beginner">입문</option><option value="intermediate">중급</option><option value="advanced">고급</option><option value="pro">선출/프로</option></select>
              </div>
            </div>
            <div className="pm-row2">
              <div className="pm-field"><label className="pm-field__l">키 (cm)</label><input className="pm-input" type="number" defaultValue={u.height} /></div>
              <div className="pm-field"><label className="pm-field__l">몸무게 (kg)</label><input className="pm-input" type="number" defaultValue={u.weight} /></div>
            </div>
            <div className="pm-field">
              <label className="pm-field__l">강점 (선택)</label>
              <div className="pm-strengths">
                {u.strengths.map(st => <span key={st} className="pm-strength"><span className="ico material-symbols-outlined">bolt</span>{st}</span>)}
                <button className="pm-chip"><span className="ico material-symbols-outlined">add</span>추가</button>
              </div>
            </div>
            <a className="pm-card__more" href="pu3-profile-basketball.html" style={{ marginTop: 4 }}>선호 정보(종별·지역·요일 등) 편집 →</a>
          </div>
        </div>

        {/* 섹션 3 — 공개 범위 (PU2-B privacy 명확화) */}
        <div className="pm-edit-sec">
          <div className="pm-edit-sec__bar"><span className="pm-edit-sec__num">3</span><span className="pm-edit-sec__t">공개 범위 (privacy)</span></div>
          <div className="pm-edit-sec__body">
            <div className="pm-locked-note" style={{ marginBottom: 12 }}>
              <span className="ico material-symbols-outlined">visibility</span>
              <span><strong>공개</strong>로 둔 항목만 다른 사람의 공개 프로필에 표시됩니다.</span>
              <a href="pu5-user-public.html">미리보기</a>
            </div>
            <div className="pm-priv">
              {privacyItems.map(it => <PrivacyToggle key={it.key} item={it} />)}
            </div>
          </div>
        </div>

        {/* 섹션 4 — 알림 */}
        <div className="pm-edit-sec">
          <div className="pm-edit-sec__bar"><span className="pm-edit-sec__num">4</span><span className="pm-edit-sec__t">알림</span></div>
          <div className="pm-edit-sec__body">
            <div className="pm-priv">
              <PrivacyToggle item={{ label: '카카오 알림톡', desc: '경기 승인 · 대회 일정 · 정산', on: true }} />
              <PrivacyToggle item={{ label: '이메일 알림', desc: '주간 리포트 · 공지', on: false }} />
            </div>
          </div>
        </div>

        {/* 섹션 5 — 결제·정산 (PU2-A · Phase 6.2 link out) */}
        <div className="pm-edit-sec">
          <div className="pm-edit-sec__bar"><span className="pm-edit-sec__num">5</span><span className="pm-edit-sec__t">결제 · 정산</span></div>
          <div className="pm-edit-sec__body">
            <div className="pm-locked-note">
              <span className="ico material-symbols-outlined">schedule</span>
              <span><strong>준비 중</strong> — 구독·결제·정산 설정은 별도 페이지에서 관리합니다 (Phase 6.2).</span>
              <a href="#">결제 관리 →</a>
            </div>
          </div>
        </div>

        {/* PU2-C — 저장 (PU1 동기화 명확화) */}
        <div className="pm-savebar">
          <span className="pm-savebar__note"><span className="ico material-symbols-outlined">sync</span>저장하면 마이페이지·공개 프로필에 바로 반영됩니다.</span>
          <button className="btn btn--sm">취소</button>
          <button className="btn btn--sm btn--accent"><span className="ico material-symbols-outlined">save</span>저장</button>
        </div>
      </div>
    </div>
  );
}

window.ProfileEdit = ProfileEdit;
