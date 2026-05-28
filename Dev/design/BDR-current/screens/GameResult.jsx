/* global React */
// ============================================================
// BDR v2.20 — GameResult (Phase 2B · UB1 신규)
// 운영 박제 대상: /games/[id] · status='completed' variant
// 진입: 종료된 경기 → GameDetail (UA2) status 분기 자동 → 본 variant
// 복귀: '다른 경기 둘러보기' → /games / '공유' → 공유 시트 / '평가 제출' → /games/[id]/report
// 에러: final_mvp_user_id null → MVP hero 부분만 hidden / fallback "🏆 우승팀 only"
//
// BG4 ★★★★★ — 같은 라우트 (/games/[id]) status 분기 / 신규 라우트 ❌
//   recomputeFinalMvp() 결과 + games.final_mvp_user_id 데이터 출처
// MVP / Best / 참가자 (Concept B 보존) / 매너 평가 진입 / 호스트 한마디
// A 등급
// ============================================================

function GameResult() {
  const d = window.GM_COMPLETED;
  return (
    <div className="gm-page" style={{padding:0}}>
      <div className="gm-page__inner" style={{padding:'0', maxWidth:1100}}>

        {/* BG4 Hero — 🏆 + MVP (Pretendard 900) + score */}
        <div className="gr-hero">
          <div className="gr-hero__band">
            <span className="gr-hero__tag">🏆 결과 발표</span>
            <span className="gr-hero__tn">{d.tn?.name} · {d.tn?.round}</span>
            <span className="gr-hero__date">{d.ended_at} 종료</span>
          </div>

          <div className="gr-hero__main">
            <div className="gr-hero__teams">
              <div className="gr-hero__team gr-hero__team--win">
                <div className="gr-hero__logo" style={{background: d.home.color}}>{d.home.logo}</div>
                <div className="gr-hero__team-name">{d.home.name}</div>
                <div className="gr-hero__team-tag">우승</div>
              </div>
              <div className="gr-hero__score">
                <div className="gr-hero__score-num">
                  <span className="is-win">{d.final_score.home}</span>
                  <em>:</em>
                  <span>{d.final_score.away}</span>
                </div>
                <div className="gr-hero__duration">{d.duration}분 · {d.court}</div>
              </div>
              <div className="gr-hero__team">
                <div className="gr-hero__logo" style={{background: d.away.color, opacity: .55}}>{d.away.logo}</div>
                <div className="gr-hero__team-name" style={{opacity:.7}}>{d.away.name}</div>
                <div className="gr-hero__team-tag" style={{opacity:.5}}>준우승</div>
              </div>
            </div>

            {/* MVP 강조 — Pretendard 900 큰 */}
            <div className="gr-hero__mvp">
              <div className="gr-hero__mvp-trophy">🏆</div>
              <div style={{minWidth:0}}>
                <div className="gr-hero__mvp-lbl">MVP</div>
                <div className="gr-hero__mvp-name">{d.mvp.name}</div>
                <div className="gr-hero__mvp-stat">{d.mvp.team} · {d.mvp.stat}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 본문 4 카드 */}
        <div className="gr-grid">
          {/* 1. 참가자 (Concept B 5×2 보존) */}
          <div className="gm-card">
            <h3 className="gm-card__h">
              <span className="ico material-symbols-outlined">group</span>
              참가자 ({d.participants.reduce((s, t) => s + t.members.length, 0)}명)
              <span style={{marginLeft:'auto', display:'inline-flex', alignItems:'center', gap:4, fontFamily:'var(--ff-mono)', fontSize:11, fontWeight:700, color:'var(--ok)'}}>
                <span className="ico material-symbols-outlined" style={{fontSize:14}}>star</span>
                평균 매너 {d.avg_manner.toFixed(1)}
              </span>
            </h3>
            {d.participants.map(t => (
              <div key={t.team} className="gr-team-block">
                <div className="gr-team-block__h">{t.team}</div>
                <div className="gd-slots">
                  {t.members.map(m => (
                    <div key={m} className="gd-slot is-filled">
                      <div className="gd-slot__avatar">{m[0]}</div>
                      <div className="gd-slot__name">{m}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* 2. MVP / 베스트 플레이어 */}
          <div className="gm-card">
            <h3 className="gm-card__h"><span className="ico material-symbols-outlined" style={{color:'var(--accent)'}}>workspace_premium</span> MVP · Best</h3>
            <div className="gr-mvp-row">
              <div className="gr-mvp-row__av" style={{background:'linear-gradient(135deg, #F4C76C, #B47A11)'}}>{d.mvp.avatar}</div>
              <div style={{flex:1}}>
                <div className="gr-mvp-row__chip">🏆 MVP</div>
                <div className="gr-mvp-row__name">{d.mvp.name}</div>
                <div className="gr-mvp-row__stat">{d.mvp.team} · {d.mvp.stat}</div>
              </div>
            </div>
            <div style={{marginTop:10, paddingTop:10, borderTop:'1px dashed var(--border)', display:'flex', flexDirection:'column', gap:6}}>
              <div style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:800, color:'var(--ink-dim)', letterSpacing:'0.06em', textTransform:'uppercase', marginBottom:2}}>Best 3</div>
              {d.best.map((b, i) => (
                <div key={b.name} className="gr-best-row">
                  <span className="gr-best-row__rank">{i + 1}</span>
                  <div className="gr-best-row__av">{b.avatar}</div>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="gr-best-row__name">{b.name}</div>
                    <div className="gr-best-row__team">{b.team}</div>
                  </div>
                  <span className="gr-best-row__stat">{b.stat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. 매너 평가 진입 */}
          <div className="gm-card gr-rate">
            <h3 className="gm-card__h"><span className="ico material-symbols-outlined">how_to_vote</span> 매너 평가</h3>
            <p style={{margin:'4px 0 12px', color:'var(--ink-soft)', fontSize:13, lineHeight:1.6}}>
              경기에 참가한 선수들의 매너를 평가해주세요. 평균 + flag 종류만 노출 — 개별 평가 본문은 외부 공개 ❌.
            </p>
            <div className="gr-rate__progress">
              <div className="gr-rate__bar">
                <div className="gr-rate__fill" style={{width:'40%'}} />
              </div>
              <span className="gr-rate__num">4/10명 평가 완료</span>
            </div>
            <button className="btn btn--accent btn--touch" style={{width:'100%', marginTop:10}}>
              <span className="ico material-symbols-outlined">edit_note</span>
              평가 제출하기
            </button>
            <div style={{marginTop:8, fontSize:11, color:'var(--ink-mute)', textAlign:'center'}}>
              제출 후 마이페이지 "내 매너" 에 반영 (BG2 룰 적용)
            </div>
          </div>

          {/* 4. 호스트 한마디 */}
          <div className="gm-card">
            <h3 className="gm-card__h"><span className="ico material-symbols-outlined">forum</span> 호스트 한마디</h3>
            <div className="gr-host">
              <div className="gr-host__av">강</div>
              <div style={{flex:1, minWidth:0}}>
                <div className="gr-host__name">강남구협회 · 호스트</div>
                <p className="gr-host__msg">"{d.host_message}"</p>
              </div>
            </div>
          </div>
        </div>

        {/* 하단 CTA */}
        <div className="gr-cta">
          <button className="btn">
            <span className="ico material-symbols-outlined">share</span>
            공유하기
          </button>
          <button className="btn btn--primary btn--touch">
            <span className="ico material-symbols-outlined">explore</span>
            다른 경기 둘러보기
          </button>
        </div>
      </div>
    </div>
  );
}

window.GameResult = GameResult;
