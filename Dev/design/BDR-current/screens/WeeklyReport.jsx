/* global React */
// ============================================================
// BDR v2.26 — WeeklyReport (GU2 · Phase 6.3 · 보강 · BG2 ★★★)
// 운영: /profile/weekly-report (1125 · v2.4 D-3 Hybrid 박제 ✅) — placeholder 정리.
//
// 01 KPI 4 (PU3 시즌 stat 정합) · 02 Highlight (곧 제공) · 03 인사이트 ·
// 04 TOP 3 코트 (진짜) · 05 다음 주 추천 (곧 제공) · 06 지난주 비교 (진짜)
// GU2-A placeholder = warn-soft 통일 · GU2-B 구독 관리 → GU3 ?section=notify.
// ============================================================
function GwSection({ no, title, children }) {
  return (
    <section className="gw-section">
      <div className="gw-section__head">
        <span className="gw-section__no">{no}</span>
        <h2 className="gw-section__t">{title}</h2>
        <span className="gw-section__line"></span>
      </div>
      {children}
    </section>
  );
}

function WeeklyReport() {
  const w = window.WEEKLY;
  const tw = w.this_week, lw = w.last_week;
  const compareRows = [
    { l: '경기 수', prev: lw.session_count + '회', now: tw.session_count + '회' },
    { l: '활동 시간', prev: Math.round(lw.total_minutes / 60) + '시간', now: Math.round(tw.total_minutes / 60) + '시간' },
    { l: '방문 코트', prev: lw.unique_courts + '곳', now: tw.unique_courts + '곳' },
    { l: '활동일', prev: lw.active_days + '일', now: tw.active_days + '일' },
  ];

  return (
    <div className="pm-page">
      <div className="pm-page__inner">
        <div className="gw-report">
          <window.PageBackBilling />

          {/* head */}
          <header className="gw-report__head">
            <div className="gw-report__emoji">{w.emoji}</div>
            <div className="gw-report__title">{w.nickname}님의 주간 리포트</div>
            <div className="gw-report__period">{w.week_label} · {w.period}</div>
          </header>

          {/* 01 KPI */}
          <GwSection no="01" title="이번 주 요약">
            <div className="gw-kpis">
              {w.kpis.map((k, i) => <window.KpiCard key={i} k={k} prevLabel={w.prev_label} />)}
            </div>
          </GwSection>

          {/* 02 Highlight (곧 제공) */}
          <GwSection no="02" title="이번 주 하이라이트">
            <div className="gw-ph">
              <span className="gw-ph__ico ico material-symbols-outlined">stars</span>
              <div className="gw-ph__body">
                <div className="gw-ph__t">베스트 경기 <window.ComingSoon /></div>
                <div className="gw-ph__d">한 주의 베스트 1경기를 하이라이트로 보여드릴게요. 경기 평가 데이터가 모이면 자동으로 표시됩니다.</div>
              </div>
            </div>
          </GwSection>

          {/* 03 인사이트 */}
          <GwSection no="03" title="인사이트">
            {w.insights.map((it, i) => (
              <div key={i} className="gw-insight">
                <span className="gw-insight__ico ico material-symbols-outlined">{it.ico}</span>
                <span className="gw-insight__t">{it.text}</span>
              </div>
            ))}
          </GwSection>

          {/* 04 TOP 3 코트 (진짜) */}
          <GwSection no="04" title="자주 방문한 코트 TOP 3">
            {w.top_courts.map((c, i) => (
              <div key={i} className="gw-court">
                <span className="gw-court__rank">{i + 1}</span>
                <div className="gw-court__body">
                  <div className="gw-court__name">{c.name}</div>
                  <div className="gw-court__addr">{c.addr}</div>
                </div>
                <span className="gw-court__visits">{c.visits}회</span>
              </div>
            ))}
          </GwSection>

          {/* 05 다음 주 추천 (곧 제공) */}
          <GwSection no="05" title="다음 주 추천">
            <div className="gw-ph">
              <span className="gw-ph__ico ico material-symbols-outlined">recommend</span>
              <div className="gw-ph__body">
                <div className="gw-ph__t">맞춤 추천 <window.ComingSoon /></div>
                <div className="gw-ph__d">활동 패턴에 맞춘 다음 주 경기·코트 추천이 곧 제공됩니다.</div>
              </div>
            </div>
          </GwSection>

          {/* 06 지난주 비교 (진짜) */}
          <GwSection no="06" title="지난주 대비">
            <div className="gw-compare">
              {compareRows.map((r, i) => (
                <div key={i} className="gw-compare__row">
                  <span className="gw-compare__l">{r.l}</span>
                  <span className="gw-compare__v"><span className="gw-compare__prev">{r.prev}</span><span className="gw-compare__arr">→</span><span className="gw-compare__now">{r.now}</span></span>
                </div>
              ))}
            </div>
          </GwSection>

          {/* footer — GU2-B 구독 관리 → GU3 notify */}
          <div className="gw-report__foot">
            매주 월요일 오전 9시에 받아보고 있어요.<br />
            <a href="gu3-profile-settings.html">이메일 구독 관리</a> · <a href="gu1-profile-growth.html">12주 성장 추이 보기 →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

window.WeeklyReport = WeeklyReport;
