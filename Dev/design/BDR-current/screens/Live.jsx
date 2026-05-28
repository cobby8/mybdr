/* global React */
// ============================================================
// BDR v2.20 — Live (Phase 2B · UA5)
// 운영 박제 대상: /live/[id]
// 진입: UC2 Home / UA1 Games LIVE chip / GameDetail '라이브 보기' / 알림
// 복귀: 종료 시 GameResult variant (UB1) 자동 / 일반 픽업 = 종료 시 /games/[id] 단순 진입
// 에러: 데이터 패칭 실패 시 placeholder + 재시도
//
// BG7 = Hero 라벨 강화 — 대회 매치 vs 일반 경기 시각 분리
//   대회 = 🏆 [대회명] · [라운드] (var(--cafe-blue))
//   일반 = 🏀 [종별] · [경기유형] (var(--accent))
// + 하단 "다음 경기" / "관련 경기" 영역 신규
// A 등급
// ============================================================

function Live() {
  // 대회 매치 (BG7 메인 분기)
  const [mode, setMode] = React.useState('tn'); // 'tn' | 'pickup'
  const isTn = mode === 'tn';

  return (
    <div className="gm-page" style={{padding:0}}>
      <div className="gm-page__inner" style={{padding:'0 0 60px', maxWidth:1100}}>
        {/* 시안 데모 토글 */}
        <div className="ctrl" style={{marginLeft:24, marginRight:24, marginTop:14}}>
          <div className="ctrl__group">
            <div className="ctrl__lbl">시안 데모 — BG7 라이브 종류 분기</div>
            <div className="ctrl__btns">
              <button className={'ctrl__btn' + (mode === 'tn' ? ' is-on' : '')} onClick={() => setMode('tn')}>
                🏆 대회 매치 view
              </button>
              <button className={'ctrl__btn' + (mode === 'pickup' ? ' is-on' : '')} onClick={() => setMode('pickup')}>
                🏀 일반 픽업 view
              </button>
            </div>
          </div>
        </div>

        {/* BG7 — Hero 라벨 강화 */}
        <div className={'lv-hero' + (isTn ? ' lv-hero--tn' : ' lv-hero--pickup')}>
          <div className="lv-hero__band">
            <span className="lv-hero__label">
              {isTn ? '🏆' : '🏀'}
              {isTn ? '강남구협회장배 봄 · 결승' : '5x5 · 픽업'}
            </span>
            <span className="lv-hero__live">
              <window.LiveDot />
              LIVE
              <span className="lv-hero__live-min">{isTn ? '3분 전 시작' : '12분 진행'}</span>
            </span>
          </div>
          <div className="lv-hero__scoreboard">
            <div className="lv-hero__team">
              <div className="lv-hero__team-logo" style={{background:'var(--cafe-blue)'}}>강</div>
              <div className="lv-hero__team-name">{isTn ? '강남BC' : '홈팀'}</div>
              <div className="lv-hero__team-sub">{isTn ? '경기도 강남구' : '5명'}</div>
            </div>
            <div className="lv-hero__score">
              <div className="lv-hero__score-num">
                <span>{isTn ? 14 : 22}</span>
                <em>:</em>
                <span>{isTn ? 10 : 18}</span>
              </div>
              <div className="lv-hero__quarter">{isTn ? 'Q3 · 5:42' : '2쿼터 · 진행'}</div>
            </div>
            <div className="lv-hero__team lv-hero__team--away">
              <div className="lv-hero__team-logo" style={{background:'var(--accent)'}}>마</div>
              <div className="lv-hero__team-name">{isTn ? '마포FC' : '어웨이팀'}</div>
              <div className="lv-hero__team-sub">{isTn ? '서울 마포구' : '5명'}</div>
            </div>
          </div>
          <div className="lv-hero__meta">
            <span><span className="ico material-symbols-outlined">place</span> 잠실학생체육관</span>
            <span><span className="ico material-symbols-outlined">person</span> 관전 124명</span>
            {isTn && <span><span className="ico material-symbols-outlined">military_tech</span> 결승 · BO3</span>}
          </div>
        </div>

        {/* 본문 */}
        <div className="lv-grid">
          {/* 좌 — 통계 */}
          <div className="gm-card">
            <h3 className="gm-card__h"><span className="ico material-symbols-outlined">analytics</span> 팀 통계</h3>
            <div className="lv-stats">
              {[
                { l:'슈팅 성공률', h:'48%', a:'42%' },
                { l:'3점 시도', h:'8/14', a:'6/15' },
                { l:'리바운드', h:'22', a:'18' },
                { l:'어시스트', h:'10', a:'7' },
                { l:'턴오버', h:'5', a:'8' },
                { l:'파울', h:'6', a:'9' },
              ].map(s => (
                <div key={s.l} className="lv-stat">
                  <div className="lv-stat__h">{s.h}</div>
                  <div className="lv-stat__l">{s.l}</div>
                  <div className="lv-stat__a">{s.a}</div>
                </div>
              ))}
            </div>
          </div>

          {/* 우 — Top 플레이어 */}
          <div className="gm-card">
            <h3 className="gm-card__h"><span className="ico material-symbols-outlined">star</span> Top 5</h3>
            <div className="lv-top">
              {[
                {n:'김지훈', t:'강남BC', s:'12pt · 4as'},
                {n:'이태우', t:'강남BC', s:'10pt · 3rb'},
                {n:'윤호석', t:'마포FC', s:'9pt · 4rb'},
                {n:'박재현', t:'강남BC', s:'6pt · 5rb'},
                {n:'한지원', t:'마포FC', s:'5pt · 3as'},
              ].map((p, i) => (
                <div key={p.n} className="lv-top__row">
                  <span className="lv-top__rank">{i + 1}</span>
                  <div className="lv-top__av">{p.n[0]}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="lv-top__name">{p.n}</div>
                    <div className="lv-top__team">{p.t}</div>
                  </div>
                  <div className="lv-top__stat">{p.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BG7 신규 — 다음 경기 / 관련 경기 */}
        <div className="gm-card" style={{margin:'14px 24px 0'}}>
          <h3 className="gm-card__h">
            <span className="ico material-symbols-outlined">arrow_forward</span>
            {isTn ? '같은 대회 다음 매치' : '같은 호스트 다음 경기'}
            <span style={{fontFamily:'var(--ff-mono)', fontSize:10.5, color:'var(--ink-dim)', fontWeight:700, marginLeft:'auto', letterSpacing:'0.04em'}}>BG7</span>
          </h3>
          <div className="lv-next">
            {isTn ? (
              <>
                <div className="lv-next__card">
                  <div className="lv-next__when">
                    <span className="lv-next__d">28</span>
                    <span className="lv-next__t">20:30</span>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="lv-next__round">U15 · 4강</div>
                    <div className="lv-next__title">서초유스 vs 용산레전드</div>
                    <div className="lv-next__court">잠실학생체육관 · B 코트</div>
                  </div>
                  <button className="btn btn--sm btn--ghost">예약</button>
                </div>
                <div className="lv-next__card">
                  <div className="lv-next__when">
                    <span className="lv-next__d">29</span>
                    <span className="lv-next__t">14:00</span>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="lv-next__round">결승 · 결승전</div>
                    <div className="lv-next__title">우승팀 결정전</div>
                    <div className="lv-next__court">잠실학생체육관 · 메인</div>
                  </div>
                  <button className="btn btn--sm btn--ghost">예약</button>
                </div>
              </>
            ) : (
              <>
                <div className="lv-next__card">
                  <div className="lv-next__when">
                    <span className="lv-next__d">30</span>
                    <span className="lv-next__t">21:00</span>
                  </div>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="lv-next__round">픽업 · 5x5</div>
                    <div className="lv-next__title">강남 평일 픽업 (정기)</div>
                    <div className="lv-next__court">강남구민체육센터</div>
                  </div>
                  <button className="btn btn--sm btn--ghost">신청</button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

window.Live = Live;
