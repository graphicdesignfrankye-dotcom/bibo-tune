import React, { useEffect, useRef } from 'react';
export default function Modal({ title, children, actions, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    const prev = document.activeElement;
    ref.current?.querySelector('button')?.focus();
    const k = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Tab') { // trappola del focus
        const f = ref.current.querySelectorAll('button,input,[tabindex]'); if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', k);
    return () => { document.removeEventListener('keydown', k); prev?.focus?.(); };
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2>{title}</h2>{children}<div className="modal-actions">{actions}</div>
      </div>
    </div>
  );
}
