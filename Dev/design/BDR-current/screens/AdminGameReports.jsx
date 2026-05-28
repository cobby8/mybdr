/* global React */
// ============================================================
// BDR v2.20 — AdminGameReports (Phase 2A · UD2)
// 운영 박제 대상: /admin/game-reports
// 진입: 관리자 sidebar '신고 검토' / super_admin only
// 복귀: 행 클릭 → 상세 모달 / 사용자 클릭 → /admin/users/[id]
// 에러: queue 비어 있으면 빈 상태 / stats 0건이면 hidden
//
// BG2 (사용자 결재 룰) = 평균 평점 + flag 종류만 / 개별 건수 ❌
// 3 탭: 신고 큐 (기존) / 매너 통계 (신규) / 30일 추세 (신규)
// E 등급 (AppNav 적용 외)
// ============================================================

function AdminGameReports() {
  const [tab, setTab] = React.useState('stats'); // 'queue' | 'stats' | 'trend'
  const queue = window.AGR_REPORT_QUEUE || [];
  const stats = window.AGR_STATS_30D || {};
  const trend = window.AGR_TREND_30D || [];

  return (
    <div className="admin-page">
      <div className="admin-page__inner">
        <header className="admin-page__head">
          <div className="admin-page__title-row">
            <div>
              <div className="admin-page__eyebrow">UD2 · /admin/game-reports</div>
              <h1 className="admin-page__title">매너 평가 검토</h1>
              <p className="admin-page__sub">
                <strong style={{color:'var(--accent)'}}>BG2 사용자 결재 룰</strong> — 평균 평점 + 받은 flag 종류만 노출 / 개별 평가 건수 ❌. 마이페이지 "내 매너" 카드 (UC1) 와 동일 룰.
              </p>
            </div>
          </div>
        </header>

        {/* 3 탭 */}
        <div className="apl-tabs" style={{marginBottom:14}}>
          <button className={'apl-tabs__tab' + (tab === 'queue' ? ' is-on' : '')} onClick={() => setTab('queue')}>
            <span className="ico material-symbols-outlined" style={{fontSize:16}}>flag</span>
            신고 큐
            <span className="apl-tabs__num">{queue.filter(q => q.status === 'submitted').length}</span>
          </button>
          <button className={'apl-tabs__tab' + (tab === 'stats' ? ' is-on' : '')} onClick={() => setTab('stats')}>
            <span className="ico material-symbols-outlined" style={{fontSize:16}}>insights</span>
            매너 통계 <span style={{fontSize:10, fontWeight:600, opacity:.7, marginLeft:2}}>(BG2)</span>
            <span className="apl-tabs__num">NEW</span>
          </button>
          <button className={'apl-tabs__tab' + (tab === 'trend' ? ' is-on' : '')} onClick={() => setTab('trend')}>
            <span className="ico material-symbols-outlined" style={{fontSize:16}}>trending_up</span>
            최근 30일 추세
            <span className="apl-tabs__num">NEW</span>
          </button>
        </div>

        {/* 신고 큐 탭 (기존 보존) */}
        {tab === 'queue' && <ReportQueueTab queue={queue} />}

        {/* 매너 통계 탭 (신규 · BG2 핵심) */}
        {tab === 'stats' && <ManneStatsTab stats={stats} />}

        {/* 30일 추세 탭 (신규 · 보조) */}
        {tab === 'trend' && <TrendTab trend={trend} stats={stats} />}
      </div>
    </div>
  );
}

// ============================================================
// 신고 큐 (기존)
// ============================================================
function ReportQueueTab({ queue }) {
  return (
    <div className="atm-table-wrap">
      <table className="atm-table">
        <thead>
          <tr>
            <th>대상 / 신고자</th>
            <th>경기</th>
            <th>받은 flag</th>
            <th>평점</th>
            <th>제출</th>
            <th>상태</th>
            <th style={{textAlign:'right'}}>액션</th>
          </tr>
        </thead>
        <tbody>
          {queue.map(r => (
            <tr key={r.id}>
              <td>
                <div className="atm-table__team">{r.target}</div>
                <div className="atm-table__captain">신고자 · {r.reporter}</div>
              </td>
              <td style={{fontSize:12.5, color:'var(--ink-soft)', maxWidth:200}}>{r.game_title}</td>
              <td>
                <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                  {r.flags.map(f => {
                    const lab = window.MANNER_FLAG_LABELS[f] || { label:f, emoji:'·', tone:'warn' };
                    return <span key={f} className={'manner-flag manner-flag--' + lab.tone} style={{fontSize:10.5}}>{lab.emoji} {lab.label}</span>;
                  })}
                </div>
              </td>
              <td style={{fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:14, color: r.overall < 2.5 ? 'var(--err)' : r.overall < 3.5 ? 'var(--warn)' : 'var(--ok)'}}>
                {r.overall.toFixed(1)} / 5
              </td>
              <td style={{fontFamily:'var(--ff-mono)', fontSize:11.5, color:'var(--ink-mute)'}}>{r.submitted_at}</td>
              <td>
                <span className={'atm-status atm-status--' + (r.status === 'submitted' ? 'pending' : r.status === 'dismissed' ? 'rejected' : 'approved')}>
                  {{submitted:'대기', reviewed:'처리됨', dismissed:'기각'}[r.status]}
                </span>
              </td>
              <td style={{textAlign:'right'}}>
                <div className="atm-action-row" style={{justifyContent:'flex-end'}}>
                  <button className="btn btn--sm">상세</button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================
// 매너 통계 (BG2 핵심) — 평균 + flag 종류만 / 개별 건수 ❌
// ============================================================
function ManneStatsTab({ stats }) {
  const topFlagLabel = window.MANNER_FLAG_LABELS[stats.top_flag] || { label: stats.top_flag, emoji:'·' };

  return (
    <div style={{display:'flex', flexDirection:'column', gap:16}}>
      {/* 요약 카드 4개 — BG2 룰 적용: 평균 + 종류 / 개별 건수 ❌ */}
      <div className="agr-summary">
        <SummaryCard label="전체 평가 수" value={stats.total_evaluations?.toLocaleString()} sub="최근 30일" color="ink" />
        <SummaryCard label="평균 평점" value={stats.avg_rating?.toFixed(1)} sub="/ 5.0" color={stats.avg_rating >= 4.0 ? 'ok' : stats.avg_rating >= 3.0 ? 'warn' : 'err'} />
        <SummaryCard label="신고 발생률" value={stats.report_rate + '%'} sub="flags 있는 평가" color="warn" />
        <SummaryCard label="가장 많이 받은 flag" value={`${topFlagLabel.emoji} ${topFlagLabel.label}`} sub="키워드만 / 개별 건수 ❌" color="accent" small />
      </div>

      <div className="agr-grid">
        {/* 평점 분포 */}
        <div className="gm-card">
          <h3 className="gm-card__h"><span className="ico material-symbols-outlined">bar_chart</span> 평점 분포</h3>
          <div className="agr-dist">
            {(stats.distribution || []).map(d => (
              <div key={d.score} className="agr-dist__row">
                <div className="agr-dist__lbl">
                  <span className="agr-dist__star">★</span>
                  {d.score}
                </div>
                <div className="agr-dist__bar">
                  <div className="agr-dist__fill" style={{width: d.pct + '%', background: d.score >= 4 ? 'var(--ok)' : d.score >= 3 ? 'var(--warn)' : 'var(--err)'}} />
                </div>
                <div className="agr-dist__pct">{d.pct}%</div>
              </div>
            ))}
          </div>
          <div className="agr-dist__note">
            <span className="ico material-symbols-outlined">info</span>
            구간별 비율만 노출 — 개별 평가자 / 평가 본문 ❌
          </div>
        </div>

        {/* 상위 매너 사용자 — 평균만 노출 (BG2) */}
        <div className="gm-card">
          <h3 className="gm-card__h">
            <span className="ico material-symbols-outlined" style={{color:'var(--ok)'}}>workspace_premium</span>
            상위 매너 사용자
            <span style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'0.04em', marginLeft:'auto'}}>평균 4.5+ · 평가 10+</span>
          </h3>
          <div className="agr-user-list">
            {(stats.top_users || []).map((u, i) => (
              <div key={u.name} className="agr-user-row">
                <span className="agr-user-row__rank">{i + 1}</span>
                <span className="agr-user-row__name">{u.name}</span>
                <span className="agr-user-row__avg" style={{color:'var(--ok)'}}>{u.avg.toFixed(1)}</span>
                <span className="agr-user-row__count">{u.eval_count}건 평가</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하위 매너 사용자 — 평균 + flag 종류만 / 개별 건수 ❌ */}
      <div className="gm-card">
        <h3 className="gm-card__h">
          <span className="ico material-symbols-outlined" style={{color:'var(--err)'}}>report</span>
          하위 매너 사용자 — 운영진 액션 검토
          <span style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:700, color:'var(--ink-dim)', letterSpacing:'0.04em', marginLeft:'auto'}}>평균 3.0- 또는 flags 5+</span>
        </h3>
        <div style={{overflowX:'auto'}}>
          <table className="atm-table" style={{minWidth:600}}>
            <thead>
              <tr>
                <th style={{width:60}}>#</th>
                <th>사용자</th>
                <th>평균</th>
                <th>받은 flag 종류 <small style={{textTransform:'none', color:'var(--ink-dim)', fontWeight:500, letterSpacing:0}}>(BG2 — 종류만)</small></th>
                <th style={{textAlign:'right'}}>액션</th>
              </tr>
            </thead>
            <tbody>
              {(stats.low_users || []).map((u, i) => (
                <tr key={u.name}>
                  <td style={{fontFamily:'var(--ff-mono)', fontWeight:800, color:'var(--ink-dim)'}}>{i + 1}</td>
                  <td>
                    <div className="atm-table__team">{u.name}</div>
                    <div className="atm-table__captain">{u.eval_count}건 평가</div>
                  </td>
                  <td style={{fontFamily:'var(--ff-mono)', fontWeight:800, fontSize:14, color: u.avg < 2.5 ? 'var(--err)' : 'var(--warn)'}}>
                    {u.avg.toFixed(1)}
                  </td>
                  <td>
                    <div style={{display:'flex', gap:4, flexWrap:'wrap'}}>
                      {u.flags.map(f => {
                        const lab = window.MANNER_FLAG_LABELS[f] || { label:f, emoji:'·', tone:'warn' };
                        return <span key={f} className={'manner-flag manner-flag--' + lab.tone} style={{fontSize:10.5}}>{lab.emoji} {lab.label}</span>;
                      })}
                    </div>
                  </td>
                  <td style={{textAlign:'right'}}>
                    <div className="atm-action-row" style={{justifyContent:'flex-end'}}>
                      <button className="btn btn--sm">경고</button>
                      <button className="btn btn--sm" style={{background:'var(--err)', color:'#fff', borderColor:'var(--err)'}}>정지</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div style={{
          marginTop:12, padding:'10px 12px',
          background:'var(--cafe-blue-soft)', borderLeft:'3px solid var(--cafe-blue)',
          borderRadius:'0 var(--r-sm) var(--r-sm) 0',
          fontSize:11.5, color:'var(--cafe-blue-deep)',
          display:'flex', gap:6,
        }}>
          <span className="ico material-symbols-outlined" style={{fontSize:16, flexShrink:0}}>verified_user</span>
          <div>
            <strong>사용자 결재 룰 (BG2)</strong> — 평균 평점 + 받은 flag 종류만 표시. 개별 평가 건수 / 평가 본문은 신고 큐 탭에서만 (flags 배열 있는 ratings 한정).
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, sub, color = 'ink', small }) {
  const colorMap = {
    ink: 'var(--ink)', ok: 'var(--ok)', warn: 'var(--warn)', err: 'var(--err)', accent: 'var(--accent)',
  };
  return (
    <div className="agr-sum-card">
      <div className="agr-sum-card__lbl">{label}</div>
      <div className="agr-sum-card__v" style={{color: colorMap[color], fontSize: small ? 18 : 32}}>{value}</div>
      <div className="agr-sum-card__sub">{sub}</div>
    </div>
  );
}

// ============================================================
// 30일 추세
// ============================================================
function TrendTab({ trend, stats }) {
  const maxCount = Math.max(...trend.map(d => d.count));
  const avgRange = { min: 3.5, max: 5.0 };
  return (
    <div style={{display:'flex', flexDirection:'column', gap:16}}>
      <div className="gm-card">
        <h3 className="gm-card__h">
          <span className="ico material-symbols-outlined">timeline</span>
          평균 평점 추세 (30일)
          <span style={{marginLeft:'auto', fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ink-dim)', fontWeight:700, letterSpacing:'0.04em'}}>
            범위 {avgRange.min}–{avgRange.max}
          </span>
        </h3>
        <div className="agr-trend">
          {trend.map((d, i) => {
            const ratio = (d.avg - avgRange.min) / (avgRange.max - avgRange.min);
            const h = Math.max(20, ratio * 100);
            return (
              <div key={d.d} className="agr-trend__col">
                <div className="agr-trend__v">{d.avg.toFixed(1)}</div>
                <div className="agr-trend__bar-wrap">
                  <div className="agr-trend__bar" style={{height: h + '%', background: d.avg >= 4.5 ? 'var(--ok)' : d.avg >= 4.0 ? 'var(--cafe-blue)' : 'var(--warn)'}} />
                </div>
                <div className="agr-trend__d">{d.d}</div>
                <div className="agr-trend__c">{d.count}건</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="agr-grid">
        <div className="gm-card">
          <h3 className="gm-card__h"><span className="ico material-symbols-outlined">trending_flat</span> 30일 요약</h3>
          <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, padding:'8px 0'}}>
            <div>
              <div style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:800, color:'var(--ink-dim)', letterSpacing:'0.08em', textTransform:'uppercase'}}>평균 평점</div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:28, fontWeight:900, color:'var(--ok)', marginTop:4, lineHeight:1}}>{stats.avg_rating?.toFixed(1)}</div>
              <div style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--ok)', fontWeight:700, marginTop:4}}>▲ +0.1 vs 이전 30일</div>
            </div>
            <div>
              <div style={{fontFamily:'var(--ff-mono)', fontSize:10.5, fontWeight:800, color:'var(--ink-dim)', letterSpacing:'0.08em', textTransform:'uppercase'}}>총 평가 수</div>
              <div style={{fontFamily:'var(--ff-display)', fontSize:28, fontWeight:900, color:'var(--ink)', marginTop:4, lineHeight:1}}>{stats.total_evaluations?.toLocaleString()}</div>
              <div style={{fontFamily:'var(--ff-mono)', fontSize:11, color:'var(--cafe-blue)', fontWeight:700, marginTop:4}}>▲ +18% vs 이전 30일</div>
            </div>
          </div>
        </div>

        <div className="gm-card">
          <h3 className="gm-card__h"><span className="ico material-symbols-outlined">warning</span> 신고 발생률</h3>
          <div style={{padding:'8px 0'}}>
            <div style={{fontFamily:'var(--ff-display)', fontSize:36, fontWeight:900, color:'var(--warn)', lineHeight:1}}>{stats.report_rate}%</div>
            <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:6}}>flags 배열 있는 평가 비율 (전체 대비)</div>
            <div style={{marginTop:12, padding:'8px 12px', background:'var(--bg-alt)', borderRadius:'var(--r-sm)', fontSize:11.5, color:'var(--ink-soft)'}}>
              <strong>가장 많이 받은 flag</strong> · {(window.MANNER_FLAG_LABELS[stats.top_flag] || {label:stats.top_flag}).label}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

window.AdminGameReports = AdminGameReports;
