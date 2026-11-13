import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Button } from './ui.jsx';

// Giro guidato al primo avvio. Si ricorda in localStorage che è stato fatto (o che non va più mostrato).
const KEY = 'bibo-tour';
export const tourDone = () => { try { return localStorage.getItem(KEY) === 'done'; } catch { return false; } };
const setDone = (v) => { try { if (v) localStorage.setItem(KEY, 'done'); else localStorage.removeItem(KEY); } catch { /* senza memoria locale il giro si ripropone */ } };
export const TOUR_EVENT = 'bibo:tour';

const STEPS = [
  { title: 'Ciao, sono Bibo!', text: 'Ti faccio fare un giro veloce, mezzo minuto, per vedere dove sta ogni cosa. Puoi saltarlo quando vuoi.' },
  { nav: 'Panoramica', title: 'Messa a punto', text: 'Qui parte il controllo rapido: guardo il PC e ti dico cosa si può sistemare, con un riepilogo di Pulizia, Velocità e Protezione.' },
  { nav: 'Pulizia', title: 'Pulizia', text: 'File temporanei, cache dei browser, Cestino e altro. Prima di eliminare ti mostro l\'elenco, e scegli tu cosa togliere.' },
  { nav: 'Velocità', title: 'Velocità', text: 'I programmi che partono con Windows e la memoria in uso. Spegni quelli che non ti servono subito.' },
  { nav: 'Protezione', title: 'Protezione', text: 'Controllo firewall, antivirus e aggiornamenti di Windows, con una scansione rapida di Microsoft Defender.' },
  { nav: 'Programmi', title: 'Programmi', text: 'Disinstalla i programmi e, dopo, cerco gli avanzi che lasciano. Prima di toccare il registro salvo una copia.' },
  { nav: 'Mappa del disco', title: 'Mappa del disco', text: 'Vedi dove va lo spazio: cartelle e bolle da aprire. Qui si guarda soltanto, non si elimina nulla. I file grandi e i doppioni stanno in Caos.' },
  { nav: 'Impostazioni', title: 'Impostazioni', text: 'Tema chiaro o scuro, colori, promemoria e la versione dell\'interfaccia. Da qui puoi anche rivedere questo giro.' },
];

export default function Tour() {
  const [open, setOpen] = useState(() => !tourDone()); const [i, setI] = useState(0); const [never, setNever] = useState(true);
  const [rect, setRect] = useState(null); const nextRef = useRef(null);
  useEffect(() => { const h = () => { setI(0); setNever(true); setOpen(true); }; window.addEventListener(TOUR_EVENT, h); return () => window.removeEventListener(TOUR_EVENT, h); }, []);
  const step = STEPS[i]; const last = i === STEPS.length - 1;
  const measure = () => { const el = step?.nav ? document.querySelector(`nav button[aria-label="${step.nav}"]`) : null; setRect(el ? el.getBoundingClientRect() : null); };
  useLayoutEffect(() => { if (!open) return undefined; measure(); window.addEventListener('resize', measure); return () => window.removeEventListener('resize', measure); }, [open, i]);
  useEffect(() => { if (open) nextRef.current?.focus(); }, [open, i]);
  const close = (finished) => { setOpen(false); if (finished || never) setDone(true); else setDone(false); };
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => {
      if (e.key === 'Escape') close(false);
      else if (e.key === 'ArrowRight') setI((n) => Math.min(n + 1, STEPS.length - 1));
      else if (e.key === 'ArrowLeft') setI((n) => Math.max(n - 1, 0));
      else if (e.key === 'Tab') { const f = [...document.querySelectorAll('.tour button,.tour input')]; if (!f.length) return; const a = f[0], z = f[f.length - 1]; if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
    };
    document.addEventListener('keydown', k); return () => document.removeEventListener('keydown', k);
  });
  if (!open) return null;
  const narrow = typeof window !== 'undefined' && window.innerWidth < 700;
  const pos = rect && !narrow ? { left: Math.min(rect.right + 18, window.innerWidth - 410), top: Math.max(16, Math.min(rect.top + rect.height / 2 - 90, window.innerHeight - 280)) } : null;
  return (
    <div className="tourwrap">
      {rect ? <div className="tourspot" aria-hidden="true" style={{ left: rect.left - 6, top: rect.top - 6, width: rect.width + 12, height: rect.height + 12 }} /> : <div className="tourdim" aria-hidden="true" />}
      <div className={'tour' + (pos ? '' : ' center')} role="dialog" aria-modal="true" aria-labelledby="tour-t" style={pos || undefined}>
        <p className="tourcount" aria-live="polite">Passo {i + 1} di {STEPS.length}</p>
        <h2 id="tour-t">{step.title}</h2>
        <p>{step.text}</p>
        <label className="tournever"><input type="checkbox" checked={never} onChange={(e) => setNever(e.target.checked)} /> Non visualizzare di nuovo</label>
        <div className="touract">
          <Button onClick={() => close(false)}>Salta</Button>
          <span className="grow" />
          {i > 0 && <Button onClick={() => setI(i - 1)}>Indietro</Button>}
          <Button variant="primary" ref={nextRef} onClick={() => (last ? close(true) : setI(i + 1))}>{last ? 'Inizia' : i === 0 ? 'Iniziamo' : 'Avanti'}</Button>
        </div>
      </div>
    </div>
  );
}
