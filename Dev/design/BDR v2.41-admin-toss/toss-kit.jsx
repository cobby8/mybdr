/* global React, window */

// =====================================================================
// toss-kit.jsx — Toss 디자인시스템 공용 컴포넌트 키트
//   Icon(lucide) · Btn · Badge · Toggle · Check · StepDots · Modal · Toast
// =====================================================================

// lucide 아이콘 래퍼 — React가 빈 span 소유, effect로 lucide svg 주입
function Icon({ name, size = 20, color, style, className }) {
  const ref = React.useRef(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el || !window.lucide) return;
    el.innerHTML = `<i data-lucide="${name}"></i>`;
    try { window.lucide.createIcons(); } catch (e) {}
    const svg = el.querySelector('svg');
    if (svg) { svg.setAttribute('width', size); svg.setAttribute('height', size); if (color) svg.style.color = color; }
  }, [name, size, color]);
  return <span ref={ref} className={'licon' + (className ? ' ' + className : '')} style={{ width: size, height: size, color, ...style }} />;
}

function Btn({ variant = 'primary', size, block, icon, iconRight, children, ...rest }) {
  const cls = ['ts-btn', `ts-btn--${variant}`];
  if (size) cls.push(`ts-btn--${size}`);
  if (block) cls.push('ts-btn--block');
  return (
    <button type="button" className={cls.join(' ')} {...rest}>
      {icon && <Icon name={icon} size={size === 'sm' ? 15 : 17} />}
      {children}
      {iconRight && <Icon name={iconRight} size={size === 'sm' ? 15 : 17} />}
    </button>);
}

function Badge({ tone = 'grey', icon, children }) {
  return <span className={`ts-badge ts-badge--${tone}`}>{icon && <Icon name={icon} size={12} />}{children}</span>;
}

function Toggle({ on, onChange }) {
  return <button type="button" className="ts-toggle" data-on={on ? 'true' : 'false'} onClick={() => onChange(!on)} aria-pressed={on}><span className="ts-toggle__knob" /></button>;
}

function Check({ on, onChange }) {
  return <button type="button" className="ts-check" data-on={on ? 'true' : 'false'} onClick={() => onChange(!on)}>{on && <Icon name="check" size={15} />}</button>;
}

function StepDots({ step, total }) {
  return <div className="ts-steps">{Array.from({ length: total }).map((_, i) => <div key={i} className="ts-steps__seg" data-on={i <= step ? 'true' : 'false'} />)}</div>;
}

function Empty({ icon = 'inbox', title, desc, children }) {
  return (
    <div className="ts-empty">
      <div className="ts-empty__icon"><Icon name={icon} size={30} /></div>
      <div className="ts-empty__title">{title}</div>
      {desc && <div className="ts-empty__desc">{desc}</div>}
      {children && <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'center' }}>{children}</div>}
    </div>);
}

function Modal({ open, onClose, title, sub, children, foot, maxWidth = 520 }) {
  React.useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="ts-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ts-modal" style={{ maxWidth }} role="dialog" aria-modal="true">
        <div className="ts-modal__head">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
            <div><div className="ts-modal__title">{title}</div>{sub && <div className="ts-modal__sub">{sub}</div>}</div>
            <button type="button" className="ts-btn ts-btn--ghost ts-btn--sm" style={{ padding: 8, marginRight: -8, marginTop: -4 }} onClick={onClose}><Icon name="x" size={20} /></button>
          </div>
        </div>
        <div className="ts-modal__body">{children}</div>
        {foot && <div className="ts-modal__foot">{foot}</div>}
      </div>
    </div>);
}

Object.assign(window, { Icon, Btn, Badge, Toggle, Check, StepDots, Empty, Modal });
