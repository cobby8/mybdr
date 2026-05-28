/* global React */

// =====================================================================
// components-admin-checklist.jsx — v2.14 신규 admin 컴포넌트 3종
//   AdminProgressBar     — 진행도 바 (completed/total + %)
//   AdminChecklistCard   — 체크리스트 카드 (상태 + 잠금 + 진입)
//   AdminInlineForm      — inline 추가 폼 (시리즈 / 단체 등)
//
// 사용 영역: AdminTournamentSetupHub / AdminTournamentWizard1Step / AdminTournamentEditWizard
// 의존: React 만. AdminShell / DataTable 등 v2.7.1 기존 컴포넌트와 독립.
// =====================================================================

// ─────────────────────────────────────────────────────────────────────
// AdminProgressBar — 진행도 바
//   props:
//     completed: number (현재 완료 항목 수)
//     total: number (전체 항목 수)
//     label: string (선택 — 좌측 라벨)
//     size: 'sm' | 'md' (기본 'md')
//     showCount: bool (기본 true — "N/M" 표시)
//     showPercent: bool (기본 true — "%" 표시)
//     tone: 'accent' | 'ok' | 'warn' (기본 'accent')
// ─────────────────────────────────────────────────────────────────────
function AdminProgressBar({ completed, total, label, size = 'md', showCount = true, showPercent = true, tone = 'accent' }) {
  const pct = total > 0 ? Math.round(completed / total * 100) : 0;
  const isDone = completed >= total && total > 0;
  const barTone = isDone ? 'var(--ok)' : tone === 'ok' ? 'var(--ok)' : tone === 'warn' ? 'var(--accent)' : 'var(--accent)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {(label || showCount || showPercent) &&
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          {label && <span style={{ fontSize: size === 'sm' ? 11 : 12.5, color: 'var(--ink-soft)', fontWeight: 500 }}>{label}</span>}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginLeft: 'auto' }}>
            {showCount &&
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: size === 'sm' ? 11 : 12.5, fontWeight: 700, color: isDone ? 'var(--ok)' : 'var(--ink)' }}>
                {completed}<span style={{ color: 'var(--ink-mute)', fontWeight: 400 }}>/{total}</span>
              </span>
          }
            {showPercent &&
          <span style={{ fontFamily: 'var(--ff-mono)', fontSize: size === 'sm' ? 10 : 11, color: 'var(--ink-mute)' }}>({pct}%)</span>
          }
          </div>
        </div>
      }
      <div style={{ height: size === 'sm' ? 4 : 8, background: 'var(--bg-alt)', borderRadius: size === 'sm' ? 2 : 4, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barTone,
          borderRadius: 'inherit',
          transition: 'width .2s ease'
        }} />
      </div>
    </div>);

}

// ─────────────────────────────────────────────────────────────────────
// AdminChecklistCard — 체크리스트 카드 (SetupHub 용)
//   props:
//     num: string ("1" ~ "8")
//     label: string (제목)
//     desc: string (설명)
//     icon: string (Material Symbol)
//     status: 'done' | 'progress' | 'idle' | 'locked'
//     required: bool (공개 가드 필수 항목 표시)
//     locked_reason: string (잠금 시 사유 — "4. 운영 방식 선행")
//     onClick: () => void (진입)
// ─────────────────────────────────────────────────────────────────────
function AdminChecklistCard({ num, label, desc, icon, status = 'idle', required, locked_reason, onClick }) {
  const cfg = {
    done: { bg: 'var(--bg-card)', border: 'var(--ok)', iconColor: 'var(--ok)', statusIcon: 'check_circle', statusLabel: '완료' },
    progress: { bg: 'var(--bg-card)', border: 'var(--accent)', iconColor: 'var(--accent)', statusIcon: 'pending', statusLabel: '진행중' },
    idle: { bg: 'var(--bg-card)', border: 'var(--border)', iconColor: 'var(--ink-mute)', statusIcon: 'radio_button_unchecked', statusLabel: '미시작' },
    locked: { bg: 'var(--bg-alt)', border: 'var(--border)', iconColor: 'var(--ink-dim)', statusIcon: 'lock', statusLabel: '잠금' }
  }[status];

  const clickable = status !== 'locked';

  return (
    <button
      type="button"
      onClick={clickable ? onClick : undefined}
      disabled={!clickable}
      style={{
        display: 'flex', flexDirection: 'column', gap: 8,
        padding: 14,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        borderLeft: status === 'done' ? `3px solid ${cfg.border}` : status === 'progress' ? `3px solid ${cfg.border}` : `1px solid ${cfg.border}`,
        borderRadius: 6,
        cursor: clickable ? 'pointer' : 'not-allowed',
        opacity: status === 'locked' ? 0.6 : 1,
        textAlign: 'left',
        width: '100%',
        fontFamily: 'inherit',
        transition: 'transform .12s ease',
        position: 'relative'
      }}
      onMouseDown={(e) => { if (clickable) e.currentTarget.style.transform = 'translateY(1px)'; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}>

      <header style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{
          width: 22, height: 22, borderRadius: 50,
          background: 'var(--bg-alt)',
          color: 'var(--ink-mute)',
          display: 'grid', placeItems: 'center',
          fontFamily: 'var(--ff-mono)', fontSize: 11, fontWeight: 700,
          flexShrink: 0
        }}>{num}</span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: cfg.iconColor }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 13.5, color: 'var(--ink)', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        {required && <span style={{ fontSize: 10, color: 'var(--err)', fontWeight: 700 }}>*</span>}
        <span className="material-symbols-outlined" style={{ fontSize: 18, color: cfg.iconColor, flexShrink: 0 }}>{cfg.statusIcon}</span>
      </header>
      <div style={{ fontSize: 11.5, color: 'var(--ink-mute)', lineHeight: 1.5 }}>{desc}</div>
      {status === 'locked' && locked_reason &&
      <div style={{ fontSize: 10.5, color: 'var(--ink-dim)', fontFamily: 'var(--ff-mono)', marginTop: 2 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 11, verticalAlign: '-2px', marginRight: 3 }}>lock</span>
          {locked_reason}
        </div>
      }
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
        <span className="admin-stat-pill" data-tone={status === 'done' ? 'ok' : status === 'progress' ? 'accent' : status === 'locked' ? 'mute' : 'mute'}>
          {cfg.statusLabel}
        </span>
        {clickable &&
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--ink-mute)' }}>chevron_right</span>
        }
      </div>
    </button>);

}

// ─────────────────────────────────────────────────────────────────────
// AdminInlineForm — inline 추가 폼
//   props:
//     label: string (라벨)
//     placeholder: string
//     icon: string (선택)
//     onAdd: (value: string) => void
//     ctaLabel: string (기본 '추가')
//     value / onChange: controlled mode (선택)
// ─────────────────────────────────────────────────────────────────────
function AdminInlineForm({ label, placeholder, icon = 'add', onAdd, ctaLabel = '추가', initialValue = '' }) {
  const [v, setV] = React.useState(initialValue);
  const [open, setOpen] = React.useState(false);

  const submit = () => {
    if (!v.trim()) return;
    onAdd?.(v.trim());
    setV('');
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '8px 12px',
          background: 'transparent',
          border: '1px dashed var(--border)',
          borderRadius: 4,
          color: 'var(--accent)',
          fontSize: 12.5, fontWeight: 600,
          cursor: 'pointer', fontFamily: 'inherit'
        }}>

        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
        {label || `${ctaLabel}`}
      </button>);

  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: 12, background: 'var(--bg-alt)', borderRadius: 4, border: '1px solid var(--accent)' }}>
      {label &&
      <span style={{ fontSize: 11, color: 'var(--ink-mute)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
      }
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          type="text"
          autoFocus
          value={v}
          onChange={(e) => setV(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') submit(); else if (e.key === 'Escape') { setOpen(false); setV(''); } }}
          placeholder={placeholder}
          style={{
            flex: 1,
            padding: '8px 10px',
            border: '1px solid var(--border)',
            borderRadius: 4,
            fontSize: 13,
            background: 'var(--bg-card)',
            color: 'var(--ink)',
            fontFamily: 'inherit'
          }} />

        <button type="button" onClick={submit} disabled={!v.trim()} className="btn btn--sm btn--primary" style={{ opacity: v.trim() ? 1 : 0.5 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check</span>
          {ctaLabel}
        </button>
        <button type="button" onClick={() => { setOpen(false); setV(''); }} className="btn btn--sm">
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>close</span>
        </button>
      </div>
    </div>);

}

Object.assign(window, {
  AdminProgressBar,
  AdminChecklistCard,
  AdminInlineForm
});
