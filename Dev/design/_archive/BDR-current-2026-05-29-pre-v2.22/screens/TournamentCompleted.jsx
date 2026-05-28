/* global React */
// ============================================================
// TournamentCompleted.jsx — UB1 (신규 / status='completed' variant)
//   진입: setRoute('tournamentDetail', { id }) — same route, status 분기
//   복귀: setRoute('tournaments')
//
//   B6 종료 발표 해소.
//   같은 라우트 status 분기 (신규 라우트 X / 더보기 가짜링크 X — 룰 §2 통과).
//
//   Layout:
//     Hero band   = 🏆 우승팀 + 부제
//     5 카드 grid = 최종 standings / MVP & 베스트5 / 사진 / 알기자 / 다음 대회
//     하단 CTA    = 공유 + 다른 대회
// ============================================================

(function () {
  const T = window.TN_COMPLETED;

  function ChampHero() {
    return (
      <div className="tc-hero">
        <div className="tc-hero__bg" />
        <div className="tc-hero__pattern" />
        <div className="tc-hero__content">
          <div className="tc-hero__eyebrow">
            <span className="tc-hero__trophy">🏆</span>
            <span>{T.name} · {T.edition} CHAMPION</span>
          </div>

          <div className="tc-hero__team">
            <div className="tc-hero__logo">{T.champion.logo}</div>
            <h1 className="tc-hero__name">{T.champion.name}</h1>
          </div>

          <div className="tc-hero__meta">
            <span>{T.ended_at}</span>
            <span className="tc-hero__sep">·</span>
            <span>{T.venue}</span>
            <span className="tc-hero__sep">·</span>
            <span>{T.divisions.join(' · ')}</span>
          </div>

          <div className="tc-hero__stats">
            <div className="tc-hero__stat">
              <span className="tc-hero__stat-v">{T.champion.roster_count}</span>
              <span className="tc-hero__stat-l">엔트리</span>
            </div>
            <div className="tc-hero__stat">
              <span className="tc-hero__stat-v">7</span>
              <span className="tc-hero__stat-l">경기 무패</span>
            </div>
            <div className="tc-hero__stat">
              <span className="tc-hero__stat-v">68.2</span>
              <span className="tc-hero__stat-l">평균 득점</span>
            </div>
            <div className="tc-hero__stat">
              <span className="tc-hero__stat-v">+12.4</span>
              <span className="tc-hero__stat-l">평균 마진</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  function StandingsCard() {
    const list = [
      { rank: 1, label: '🥇 우승', team: T.champion },
      { rank: 2, label: '🥈 준우승', team: T.runner_up },
      { rank: 3, label: '🥉 공동 3위', team: T.third[0] },
      { rank: 3, label: '🥉 공동 3위', team: T.third[1] },
    ];
    return (
      <article className="tc-card tc-card--standings">
        <header className="tc-card__head">
          <span className="tc-card__num">01</span>
          <h2 className="tc-card__h">최종 순위</h2>
          <span className="tc-card__sub">{T.divisions[0]} 종별</span>
        </header>
        <ol className="tc-stand">
          {list.map((s, i) => (
            <li key={i} className={'tc-stand__row' + (s.rank === 1 ? ' is-champ' : '')}>
              <span className="tc-stand__label">{s.label}</span>
              <span className="tc-stand__logo">{s.team.logo}</span>
              <span className="tc-stand__team">{s.team.name}</span>
            </li>
          ))}
        </ol>
        <button className="btn btn--ghost btn--sm tc-card__more">전체 8강 보기 →</button>
      </article>
    );
  }

  function MVPCard() {
    return (
      <article className="tc-card tc-card--mvp">
        <header className="tc-card__head">
          <span className="tc-card__num">02</span>
          <h2 className="tc-card__h">MVP · 베스트5</h2>
        </header>
        <div className="tc-mvp">
          <div className="tc-mvp__av">⭐</div>
          <div className="tc-mvp__body">
            <div className="tc-mvp__title">MVP {T.mvp.name}</div>
            <div className="tc-mvp__team">{T.mvp.team}</div>
            <div className="tc-mvp__stat">{T.mvp.stat}</div>
          </div>
        </div>
        <div className="tc-best5">
          {T.best5.map(p => (
            <div key={p.name} className="tc-best5__row">
              <span className="tc-best5__pos">{p.pos}</span>
              <span className="tc-best5__name">{p.name}</span>
              <span className="tc-best5__team">{p.team}</span>
              <span className="tc-best5__stat">{p.stat}</span>
            </div>
          ))}
        </div>
      </article>
    );
  }

  function PhotoCard() {
    return (
      <article className="tc-card tc-card--photos">
        <header className="tc-card__head">
          <span className="tc-card__num">03</span>
          <h2 className="tc-card__h">명장면 갤러리</h2>
          <span className="tc-card__sub">{T.photos.length}장</span>
        </header>
        <div className="tc-photos">
          {T.photos.map((p, i) => (
            <div key={p.id} className="tc-photo" style={{'--i': i}}>
              <span className="tc-photo__cap">{p.caption}</span>
              <span className="ico material-symbols-outlined">image</span>
            </div>
          ))}
        </div>
        <button className="btn btn--ghost btn--sm tc-card__more">전체 보기 →</button>
      </article>
    );
  }

  function StoryCard() {
    return (
      <article className="tc-card tc-card--story">
        <header className="tc-card__head">
          <span className="tc-card__num">04</span>
          <h2 className="tc-card__h">대회 알기자</h2>
          <span className="tc-card__sub">커뮤니티 연결</span>
        </header>
        <div className="tc-story">
          <div className="tc-story__chip">📰 종료 발표문</div>
          <h3 className="tc-story__title">{T.story.title}</h3>
          <p className="tc-story__excerpt">{T.story.excerpt}</p>
          <button className="btn btn--primary btn--touch">전문 보기</button>
        </div>
      </article>
    );
  }

  function NextCard() {
    if (!T.next) return null;
    return (
      <article className="tc-card tc-card--next">
        <header className="tc-card__head">
          <span className="tc-card__num">05</span>
          <h2 className="tc-card__h">다음 회차</h2>
          <span className="tc-card__sub">시리즈 연결</span>
        </header>
        <div className="tc-next">
          <div className="tc-next__d">D-{T.next.d_day}</div>
          <div className="tc-next__name">{T.next.name}</div>
          <div className="tc-next__date">{T.next.starts_at} 시작</div>
          <button className="btn btn--accent btn--touch">알림 받기</button>
        </div>
      </article>
    );
  }

  function ShareBar() {
    return (
      <div className="tc-share">
        <span className="tc-share__lbl">대회 결과 공유</span>
        <div className="tc-share__btns">
          <button className="btn"><span className="ico material-symbols-outlined">link</span>URL 복사</button>
          <button className="btn"><span className="ico material-symbols-outlined">chat_bubble</span>카카오톡</button>
          <button className="btn"><span className="ico material-symbols-outlined">photo_camera</span>인스타그램</button>
        </div>
        <button className="btn btn--primary">다른 대회 둘러보기 →</button>
      </div>
    );
  }

  window.TournamentCompleted = function TournamentCompleted({ setRoute }) {
    return (
      <div className="tc-page">
        <div className="tc-inner">
          <window.Crumbs trail={['홈', '대회', T.name + ' ' + T.edition]} />

          <ChampHero />

          <div className="tc-grid">
            <StandingsCard />
            <MVPCard />
            <PhotoCard />
            <StoryCard />
            <NextCard />
          </div>

          <ShareBar />
        </div>
      </div>
    );
  };
})();
