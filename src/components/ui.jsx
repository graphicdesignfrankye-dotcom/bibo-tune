import React from 'react';

export const Button = ({ variant = 'ghost', loading, children, ...p }) => (
  <button className={`btn ${variant}`} aria-busy={loading || undefined} disabled={p.disabled || loading} {...p}>{children}</button>
);

export const Card = ({ icon: Icon, grad, title, text, meter, onClick, children }) => (
  <div className="card" onClick={onClick} tabIndex={onClick ? 0 : undefined} role={onClick ? 'button' : undefined}
    onKeyDown={onClick ? (e) => (e.key === 'Enter' || e.key === ' ') && onClick() : undefined}>
    {Icon && <div className="ico" style={{ background: `var(--grad-${grad})` }}><Icon size={22} aria-hidden="true" /></div>}
    <h3>{title}</h3>
    {text && <p>{text}</p>}
    {meter != null && <div className="meter" role="progressbar" aria-label={`Livello ${title}`} aria-valuenow={Math.round(meter)} aria-valuemin={0} aria-valuemax={100}><i style={{ '--v': meter + '%', background: `var(--grad-${grad})` }} /></div>}
    {children}
  </div>
);

export const Chip = ({ tone, children }) => <span className={`chip ${tone || ''}`}>{tone ? '● ' : ''}{children}</span>;

export const Toggle = ({ checked, onChange, label, disabled }) => (
  <button role="switch" aria-checked={checked} aria-label={label} disabled={disabled} className={`toggle ${checked ? 'on' : ''}`} onClick={() => onChange(!checked)}><i /></button>
);

export const Skeleton = ({ h = 20, w = '100%' }) => <div className="skeleton" style={{ height: h, width: w }} />;
export const Empty = ({ title, text }) => <div className="empty"><h3>{title}</h3><p>{text}</p></div>;

/* Tasto per tornare indietro, uguale in tutta l'app. Alt+← e Esc fanno lo stesso (se non c'è una finestra aperta o un campo in uso). */
export function BackButton({ onClick, label = 'Indietro', disabled = false, keys = true }) {
  const fn = React.useRef(onClick); fn.current = onClick;
  React.useEffect(() => {
    if (!keys || disabled) return undefined;
    const h = (e) => {
      const t = e.target; const typing = t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
      if (typing || e.defaultPrevented || document.querySelector('[role="dialog"]')) return;
      if ((e.key === 'ArrowLeft' && e.altKey) || (e.key === 'Escape' && !e.altKey && !e.ctrlKey && !e.metaKey)) { e.preventDefault(); fn.current(); }
    };
    window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h);
  }, [keys, disabled]);
  return <button type="button" className="backpill" aria-label={label} title={`${label} (Esc)`} disabled={disabled} onClick={onClick}><span aria-hidden="true">‹</span> {label}</button>;
}
