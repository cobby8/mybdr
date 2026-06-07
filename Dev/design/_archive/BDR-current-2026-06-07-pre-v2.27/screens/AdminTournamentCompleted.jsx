/* global React */
// ============================================================
// AdminTournamentCompleted.jsx — D1 (Phase 1A 종료 후 hub — 신규)
//   /tournament-admin/tournaments/[id] · status='completed'
//
// 진입: 셋업 hub (status='completed' 자동 전환) / sidebar 직접 라우팅
// 복귀: AdminTournamentAdminList
// 에러: 권한 없음 = 일반 사용자 redirect / 미종료 = 셋업 hub redirect
//
// S5 사각지대 해소: 종료 후 분산된 진입점 (결과/통계/알기자/사진/사이트) 5 카드 hub 로 통합.
// ============================================================

(function () {
  // 종료 대회 mock — shared.jsx TN_COMPLETED 와 결합
  const TN = {
    name: '봄맞이 마포컵', edition: 'Vol.7',
    ended_at: '2026-03-16',
    champion: '강남BC',
    mvp: '김지훈',
  };

  // 5 카드 — 결과 / 통계 / 알기자 / 사진영상 / 사이트 archive
  const CARDS = [
    {
      num: '1',
      title: '결과 박제',
      icon: 'emoji_events',
      desc: '우승팀 · 준우승 · 4강 · 베스트5 · MVP. 자동 채움 + 수동 보정.',
      state: 'done',
      stateLabel: '완료',
      metrics: [
        { v: '강남BC', l: '우승' },
        { v: '김지훈', l: 'MVP' },
        { v: '5', l: '베스트' },
      ],
      cta: '결과 수정',
    },
    {
      num: '2',
      title: '통계 대시보드',
      icon: 'analytics',
      desc: '매치 수 · 득점 분포 · 베스트 플레이어 차트. 알기자 / 시즌 통계로 재사용.',
      state: 'auto',
      stateLabel: '자동 집계',
      metrics: [
        { v: '24', l: '매치' },
        { v: '1,847', l: '총 득점' },
        { v: '24.3', l: 'MVP 평균' },
      ],
      cta: '대시보드 열기',
    },
    {
      num: '3',
      title: '알기자 발행',
      icon: 'newspaper',
      desc: '결과 + 통계 기반 종료 알기자 draft 자동 생성. /admin/news 에서 검수 후 발행.',
      state: 'idle',
      stateLabel: 'draft 생성 가능',
      metrics: [
        { v: 'draft', l: '상태' },
        { v: '0', l: '발행' },
      ],
      cta: '알기자 draft 생성',
    },
    {
      num: '4',
      title: '사진 · 영상',
      icon: 'photo_library',
      desc: '경기 사진 업로드 + LIVE 영상 매핑 (YouTube/AfreecaTV 등). 종료 사이트에 노출.',
      state: 'idle',
      stateLabel: '6 장 업로드됨',
      metrics: [
        { v: '6', l: '사진' },
        { v: '0', l: '영상' },
      ],
      cta: '사진 추가',
    },
    {
      num: '5',
      title: '사이트 archive',
      icon: 'public',
      desc: '공개 사이트 종료 상태 박제 — 우승팀 hero / 5 카드 / 다음 회차 예고.',
      state: 'done',
      stateLabel: '공개됨',
      metrics: [
        { v: 'on', l: '공개' },
        { v: '342', l: '조회' },
      ],
      cta: '사용자 화면 보기',
    },
  ];

  function Card({ c }) {
    return (
      <div className="acp-card">
        <div className="acp-card__head">
          <span className="acp-card__icon ico material-symbols-outlined">{c.icon}</span>
          <div style={{ flex: 1 }}>
            <div className="acp-card__num">STEP {c.num}</div>
            <h3 className="acp-card__title">{c.title}</h3>
          </div>
          <span className={'acp-card__state acp-card__state--' + c.state}>{c.stateLabel}</span>
        </div>
        <p className="acp-card__desc">{c.desc}</p>
        <div className="acp-card__meta">
          {c.metrics.map((m, i) => (
            <span key={i} className="acp-card__metric">
              <b>{m.v}</b>
              {m.l}
            </span>
          ))}
        </div>
        <button className="acp-card__cta">
          {c.cta}
          <span className="ico material-symbols-outlined">arrow_forward</span>
        </button>
      </div>
    );
  }

  window.AdminTournamentCompleted = function AdminTournamentCompleted() {
    return (
      <window.AdminShell active="setup" tournamentName={TN.name} crumbTrail={['대회 관리', TN.name, '종료 후 hub']}>
        <div className="admin-page">
          <div className="admin-page__inner">
            <header className="admin-page__head">
              <div className="admin-page__title-row">
                <div>
                  <div className="admin-page__eyebrow">D1 · Phase 1A · 종료 후 hub (NEW)</div>
                  <h1 className="admin-page__title">종료 후 정리 · {TN.name} {TN.edition}</h1>
                  <p className="admin-page__sub">
                    종료 직후 처리해야 할 5 가지를 한 곳에서. 모두 완료하면 다음 회차 박제를 시작할 수 있어요.
                  </p>
                </div>
                <div className="admin-page__actions">
                  <button className="btn">
                    <span className="ico material-symbols-outlined">file_download</span>
                    종료 보고서
                  </button>
                  <button className="btn btn--primary">
                    <span className="ico material-symbols-outlined">arrow_forward</span>
                    다음 회차 박제
                  </button>
                </div>
              </div>
            </header>

            {/* Hero — 우승팀 + MVP + 종료 일자 */}
            <div className="acp-hero">
              <div className="acp-hero__trophy">
                <span style={{ fontSize: 44 }}>🏆</span>
              </div>
              <div className="acp-hero__body">
                <div className="acp-hero__eyebrow">CHAMPION · {TN.name} {TN.edition}</div>
                <div className="acp-hero__title">{TN.champion}</div>
                <div className="acp-hero__name">우승 · 결승전 78 : 65 서초파이브</div>
                <div className="acp-hero__mvp">
                  <span style={{ fontFamily: 'var(--ff-mono)', fontSize: 10.5, opacity: .7, letterSpacing: '0.06em' }}>MVP</span>
                  <b>{TN.mvp}</b>
                  <span style={{ opacity: .8 }}>· 평균 24.3득점 · 8어시</span>
                </div>
              </div>
              <div className="acp-hero__date">
                종료
                <b>03·16</b>
                2026
              </div>
            </div>

            {/* 5 카드 grid */}
            <div className="acp-grid">
              {CARDS.map(c => <Card key={c.num} c={c} />)}
            </div>

            {/* 진행도 요약 footer */}
            <div className="atsh-gate" style={{ marginTop: 14 }}>
              <div className="atsh-gate__left">
                <div className="atsh-gate__title">종료 정리 진행도 · 2/5 완료</div>
                <div className="atsh-gate__sub">알기자 · 사진 · 사이트 archive 까지 완료하면 다음 회차로 진행 가능.</div>
              </div>
              <div>
                <button className="btn">
                  <span className="ico material-symbols-outlined">share</span>
                  결과 공유
                </button>
              </div>
            </div>
          </div>
        </div>
      </window.AdminShell>
    );
  };
})();
