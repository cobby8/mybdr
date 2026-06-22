/* global React, window */
// ============================================================
// BDR v2.33 — records-shared.jsx
// 기록 공통 컴포넌트: 세그먼트 토글 · sortable 테이블 · 슛차트 · 시즌요약 · 상태
// 토큰만 사용 · Material Symbols · 720px 분기는 records.css
// ============================================================
(function () {
  const R = window.RECORDS;

  // 존별 효율 컬러스케일 (Stats.jsx zc 재사용) — pct>=50 accent / >=40 warn / else mute
  const zoneColor = (p) => (p >= 50 ? 'var(--accent)' : p >= 40 ? 'var(--warn)' : 'var(--ink-mute)');
  const fmt1 = (n) => (n == null ? '–' : Number(n).toFixed(1));
  const fmtPct = (n) => (n == null ? '–' : Number(n).toFixed(1) + '%');

  // ── 세그먼트 토글 (3단위) — radius 4px (pill 금지) ──
  function RecSeg({ value, onChange, options }) {
    return (
      <div className="rec-seg" role="tablist" aria-label="집계 단위">
        {options.map(o => (
          <button key={o.v} role="tab" aria-selected={value === o.v}
            className={'rec-seg__btn' + (value === o.v ? ' is-on' : '')}
            onClick={() => onChange(o.v)}>
            <span className="ico material-symbols-outlined">{o.ico}</span>
            <span className="rec-seg__lbl">{o.l}</span>
          </button>
        ))}
      </div>
    );
  }

  // ── 공통 sortable 테이블 ──
  // columns: { key, label, align:'left'|'right', sticky?, sortable?, render?(r), sortVal?(r), sub? }
  function RecTable({ columns, rows, getKey, onRowClick, initialSort, pinnedRows }) {
    const [sort, setSort] = React.useState(initialSort || { key: columns.find(c => c.align === 'right')?.key || columns[0].key, dir: 'desc' });
    const sorted = React.useMemo(() => {
      const col = columns.find(c => c.key === sort.key);
      if (!col) return rows;
      const val = col.sortVal || ((r) => r[sort.key]);
      const dir = sort.dir === 'asc' ? 1 : -1;
      return rows.slice().sort((a, b) => {
        const va = val(a), vb = val(b);
        if (typeof va === 'string' || typeof vb === 'string') return String(va).localeCompare(String(vb), 'ko') * dir;
        return ((va ?? 0) - (vb ?? 0)) * dir;
      });
    }, [rows, sort, columns]);

    const clickHead = (c) => {
      if (c.sortable === false) return;
      setSort(s => s.key === c.key ? { key: c.key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key: c.key, dir: c.align === 'left' ? 'asc' : 'desc' });
    };

    return (
      <div className="rec-tablewrap">
        <table className="rec-table">
          <thead>
            <tr>
              {columns.map(c => {
                const active = sort.key === c.key;
                return (
                  <th key={c.key}
                    className={'rec-th' + (c.align === 'left' ? ' rec-th--l' : '') + (c.sticky ? ' rec-th--sticky' : '') + (c.sortable === false ? '' : ' rec-th--sort') + (active ? ' is-active' : '')}
                    onClick={() => clickHead(c)}
                    title={c.sortable === false ? '' : '정렬'}>
                    <span className="rec-th__lbl">{c.label}</span>
                    {c.sortable !== false && active && (
                      <span className="ico material-symbols-outlined rec-th__arrow is-on">
                        {sort.dir === 'asc' ? 'arrow_drop_up' : 'arrow_drop_down'}
                      </span>
                    )}
                  </th>
                );
              })}
              <th className="rec-th rec-th--spacer" aria-hidden="true"></th>
            </tr>
          </thead>
          <tbody>
            {(pinnedRows || []).map((r, i) => (
              <tr key={'pin-' + i} className="rec-tr--pinned">
                {columns.map(c => (
                  <td key={c.key} className={'rec-td' + (c.align === 'left' ? ' rec-td--l' : '') + (c.sticky ? ' rec-td--sticky' : '') + (c.strong ? ' rec-td--strong' : '')}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
                <td className="rec-td rec-td--spacer"></td>
              </tr>
            ))}
            {sorted.map(r => (
              <tr key={getKey(r)}
                className={(onRowClick && !r._noClick) ? 'is-clickable' : ''}
                onClick={(onRowClick && !r._noClick) ? () => onRowClick(r) : undefined}>
                {columns.map(c => (
                  <td key={c.key} className={'rec-td' + (c.align === 'left' ? ' rec-td--l' : '') + (c.sticky ? ' rec-td--sticky' : '') + (c.strong ? ' rec-td--strong' : '')}>
                    {c.render ? c.render(r) : r[c.key]}
                  </td>
                ))}
                <td className="rec-td rec-td--spacer"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  // W/L 결과 뱃지
  function ResultBadge({ r }) {
    return <span className={'rec-wl rec-wl--' + (r === 'W' ? 'w' : 'l')}>{r}</span>;
  }

  // ── 시즌 요약 (UserSeasonStat) ──
  function SeasonSummary({ s }) {
    if (!s) return null;
    const cells = [
      { l: '경기', v: s.games_played, sub: '시즌 출전' },
      { l: '전적', v: s.wins + '–' + s.losses, sub: '승–패', tone: 'var(--ok)' },
      { l: '평점', v: fmt1(s.avg_rating), sub: '매너·기여' },
      { l: 'MVP', v: s.mvp_count, sub: '이달의 MVP', tone: 'var(--warn)' },
      { l: '순위', v: '#' + s.rank_position, sub: '/ ' + s.rank_of + '명', tone: 'var(--accent)' },
    ];
    return (
      <div className="rec-summary">
        {cells.map(c => (
          <div key={c.l} className="rec-summary__cell">
            <div className="rec-summary__l">{c.l}</div>
            <div className="rec-summary__v" style={c.tone ? { color: c.tone } : null}>{c.v}</div>
            <div className="rec-summary__s">{c.sub}</div>
          </div>
        ))}
      </div>
    );
  }

  // ── 슛차트 (ShotZoneStat) — 하프코트 + 존 효율 ──
  function ShotChart({ zones }) {
    const Z = R.ZONE_META;
    const data = (zones || []).map(z => {
      const pct = R.pct(z.made, z.attempts);
      return { ...z, pct, meta: Z[z.zone_code] || { label: z.zone_code, x: 150, y: 140 } };
    });
    const rad = (att) => 11 + Math.min(att, 60) / 60 * 12;

    return (
      <div className="rec-shot">
        <div className="rec-shot__court">
          <svg viewBox="0 0 300 280" className="rec-shot__svg" role="img" aria-label="슛차트 — 존별 효율">
            {/* 코트 라인 (basket = 상단) */}
            <rect x="2" y="2" width="296" height="276" rx="6" className="rec-court__bg" />
            {/* 페인트 / 키 */}
            <rect x="110" y="24" width="80" height="120" className="rec-court__line" fill="none" />
            <circle cx="150" cy="144" r="30" className="rec-court__line" fill="none" />
            {/* 백보드 + 림 */}
            <line x1="128" y1="28" x2="172" y2="28" className="rec-court__line" />
            <circle cx="150" cy="40" r="7" className="rec-court__line" fill="none" />
            {/* 제한구역 */}
            <path d="M122 40 A28 28 0 0 0 178 40" className="rec-court__line" fill="none" />
            {/* 3점 라인 */}
            <path d="M24 24 L24 120 A132 132 0 0 0 276 120 L276 24" className="rec-court__line rec-court__arc" fill="none" />
            {/* 존 마커 */}
            {data.map(z => (
              <g key={z.zone_code} className="rec-zone-g">
                <circle cx={z.meta.x} cy={z.meta.y} r={rad(z.attempts)}
                  fill={zoneColor(z.pct)} fillOpacity="0.9" stroke="var(--bg-elev)" strokeWidth="2" />
                <text x={z.meta.x} y={z.meta.y + 4} className="rec-zone__pct">{z.pct}</text>
              </g>
            ))}
          </svg>
          <div className="rec-shot__legend">
            <span><i style={{ background: 'var(--accent)' }} />50%+</span>
            <span><i style={{ background: 'var(--warn)' }} />40–49%</span>
            <span><i style={{ background: 'var(--ink-mute)' }} />–40%</span>
          </div>
        </div>
        <div className="rec-shot__table">
          {data.slice().sort((a, b) => b.pct - a.pct).map(z => (
            <div key={z.zone_code} className="rec-zone">
              <div className="rec-zone__top">
                <span className="rec-zone__name">{z.meta.label}</span>
                <span className="rec-zone__pctv" style={{ color: zoneColor(z.pct) }}>{z.pct}%</span>
              </div>
              <div className="rec-zone__bar"><div className="rec-zone__fill" style={{ width: z.pct + '%', background: zoneColor(z.pct) }} /></div>
              <div className="rec-zone__sub">{z.made}/{z.attempts}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── 상태 ──
  function RecEmpty({ icon = 'query_stats', title = '아직 기록이 없습니다', desc }) {
    return (
      <div className="rec-state">
        <span className="ico material-symbols-outlined">{icon}</span>
        <h4>{title}</h4>
        {desc && <p>{desc}</p>}
      </div>
    );
  }
  function RecLoading({ rows = 6, cols = 8 }) {
    return (
      <div className="rec-skel">
        <div className="rec-skel__head" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="rec-skel__row">
            {Array.from({ length: cols }).map((__, j) => <div key={j} className="rec-skel__cell" style={{ animationDelay: (i * 60 + j * 20) + 'ms' }} />)}
          </div>
        ))}
      </div>
    );
  }
  function RecUnclaimed({ name }) {
    return (
      <div className="rec-unclaimed">
        <span className="ico material-symbols-outlined">link_off</span>
        <div>
          <div className="rec-unclaimed__t">개인 기록 연동 전</div>
          <div className="rec-unclaimed__s">{name ? name + ' 선수는 ' : ''}계정 연동(클레임) 후 개인 박스 기록이 집계됩니다. 현재는 대회 내 이름만 표시됩니다.</div>
        </div>
      </div>
    );
  }

  // ── 표준 박스스코어 컬럼 팩토리 ──
  // 모든 기록표(경기별·대회별·시즌별·팀 로스터·대회 기록실)가 글자 그대로 동일한 양식을 쓰도록
  // 단일 정의: MIN · PTS · FGM · FGA · FG% · 3PM · 3PA · 3P% · FTM · FTA · FT% · OR · DR · REB · AST · STL · BLK · TO · PF · 평점.
  //   avg=false → 경기별(raw 정수) · avg=true → 집계(평균, 소수 1자리)
  //   미연동/무기록 행은 각 값이 null → '–' 로 렌더 + 정렬 시 최하위.
  function statCols({ avg = false } = {}) {
    const has = (v) => v != null && !(typeof v === 'number' && isNaN(v));
    const f = (v) => (!has(v) ? <span className="rec-na">–</span> : (avg ? Number(v).toFixed(1) : v));
    const sv = (k) => (r) => (has(r[k]) ? r[k] : -1);
    const n = (k, label) => ({ key: k, label, align: 'right', sortVal: sv(k), render: r => f(r[k]) });
    const p = (k, label, mk, ak) => {
      const val = (r) => (has(r[k]) ? r[k] : (has(r[mk]) && has(r[ak]) ? (r[ak] ? Math.round(r[mk] / r[ak] * 1000) / 10 : 0) : null));
      return {
        key: k, label, align: 'right', sortVal: r => { const v = val(r); return has(v) ? v : -1; },
        render: r => { const v = val(r); return !has(v) ? <span className="rec-na">–</span> : (v ? Number(v).toFixed(1) + '%' : '–'); },
      };
    };
    const rebVal = (r) => (has(r.reb) ? r.reb : (has(r.oreb) && has(r.dreb) ? Math.round((r.oreb + r.dreb) * 10) / 10 : null));
    return [
      n('min', 'MIN'),
      { key: 'pts', label: 'PTS', align: 'right', sortVal: sv('pts'),
        render: r => { if (!has(r.pts)) return <span className="rec-na">–</span>; const hi = avg ? r.pts >= 15 : r.pts >= 20; return <b className={hi ? 'rec-hi' : ''}>{f(r.pts)}</b>; } },
      n('fgm', 'FGM'), n('fga', 'FGA'), p('fg_pct', 'FG%', 'fgm', 'fga'),
      n('tpm', '3PM'), n('tpa', '3PA'), p('tp_pct', '3P%', 'tpm', 'tpa'),
      n('ftm', 'FTM'), n('fta', 'FTA'), p('ft_pct', 'FT%', 'ftm', 'fta'),
      n('oreb', 'OR'), n('dreb', 'DR'),
      { key: 'reb', label: 'REB', align: 'right', sortVal: r => { const v = rebVal(r); return has(v) ? v : -1; }, render: r => { const v = rebVal(r); return has(v) ? f(v) : <span className="rec-na">–</span>; } },
      n('ast', 'AST'), n('stl', 'STL'), n('blk', 'BLK'), n('tov', 'TO'), n('pf', 'PF'),
      { key: 'pm', label: '+/-', align: 'right', sortVal: sv('pm'),
        render: r => { if (!has(r.pm)) return <span className="rec-na">–</span>; const v = avg ? Number(r.pm).toFixed(1) : r.pm; const sign = r.pm > 0 ? '+' : ''; const cls = r.pm > 0 ? 'rec-pm rec-pm--pos' : (r.pm < 0 ? 'rec-pm rec-pm--neg' : 'rec-pm'); return <span className={cls}>{sign}{v}</span>; } },
      { key: 'rating', label: '평점', align: 'right', sortVal: sv('rating'),
        render: r => (!has(r.rating) ? <span className="rec-na">–</span> : <span className="rec-rating">{Number(r.rating).toFixed(1)}</span>) },
    ];
  }

  // ── 링크 (선수/팀 페이지) ── 행 클릭과 충돌 방지 위해 stopPropagation
  function Lnk({ href, className, children }) {
    return <a className={'rec-link ' + (className || '')} href={href || '#'} onClick={e => e.stopPropagation()}>{children}</a>;
  }
  const userHref = (id) => (id ? '/users/' + id + '?tab=records' : null);
  const teamHref = (name) => '/teams/' + encodeURIComponent(name || '') + '?tab=records';

  window.RecShared = { RecSeg, RecTable, ResultBadge, SeasonSummary, ShotChart, RecEmpty, RecLoading, RecUnclaimed, statCols, Lnk, userHref, teamHref, zoneColor, fmt1, fmtPct };
})();
