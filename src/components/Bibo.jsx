import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';

const Ctx = createContext(null);
export const useBibo = () => useContext(Ctx);

const reduce = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const CHATTER = ['Tutto sotto controllo!', 'Il PC respira meglio.', 'Cerco cose da sistemare…', null, null, null];

/** Contiene lo stato di Bibo e il "palcoscenico" in cui si muove. */
export function BiboProvider({ children }) {
  const stage = useRef(null);
  const [mood, setMood] = useState('idle'); // idle | scanning | happy | worried
  const [line, setLine] = useState('Ciao, sono Bibo!');
  const [pos, setPos] = useState({ x: 140, y: 420 });
  const [flip, setFlip] = useState(false);
  const [walking, setWalking] = useState(false);
  const [hidden, setHidden] = useState(false); // la Panoramica mostra Bibo in grande: la mascotte mobile si nasconde
  const pinned = useRef(false);
  const posRef = useRef(pos);
  posRef.current = pos;

  const goTo = useCallback((fx, fy, text) => {
    const el = stage.current; if (!el) return;
    const W = el.clientWidth, H = el.clientHeight;
    // Bibo vive in una colonna libera sul lato destro: il testo non ci arriva mai.
    const narrow = W <= 700;
    const x = W - (narrow ? 80 : 120);
    const y = Math.max(H * 0.35, Math.min(H - (narrow ? 100 : 130), fy * H));
    setFlip(true);
    setPos({ x, y });
    if (text !== undefined) setLine(text);
    setWalking(true);
    setTimeout(() => setWalking(false), reduce ? 0 : 1800);
  }, []);

  /** Per le azioni lunghe: Bibo si ferma lì e smette di vagare. */
  const act = useCallback((m, fx, fy, text) => {
    pinned.current = m === 'scanning';
    setMood(m);
    goTo(fx, fy, text);
  }, [goTo]);
  const say = useCallback((t) => setLine(t), []);
  const release = useCallback(() => { pinned.current = false; setMood('idle'); }, []);

  useEffect(() => {
    if (reduce) return;
    const t = setInterval(() => {
      if (pinned.current || mood !== 'idle') return;
      goTo(0.1 + Math.random() * 0.75, 0.45 + Math.random() * 0.5, CHATTER[Math.floor(Math.random() * CHATTER.length)]);
    }, 5200);
    return () => clearInterval(t);
  }, [mood, goTo]);

  useEffect(() => { const t = setTimeout(() => goTo(0.15, 0.7), 300); return () => clearTimeout(t); }, [goTo]);

  const hide = useCallback((v) => setHidden(!!v), []);
  const value = { act, say, release, hide, mood, line };
  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="stage" ref={stage} aria-hidden={false} style={hidden ? { visibility: 'hidden' } : undefined}>
        <div className="bibo-shadow" style={{ transform: `translate(${pos.x + 13}px, ${pos.y + 104}px)` }} />
        <div className={`bibo-bubble ${line ? 'on' : ''}`} style={{ transform: `translate(${pos.x - 50}px, ${pos.y + 4}px) translateY(-100%)` }} aria-hidden="true">{line}</div>
        <div
          className={`bibo ${walking ? 'walking' : ''} ${mood} ${flip ? 'flip' : ''}`}
          style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
          role="img"
          aria-label="Bibo, la mascotte robot"
        >
          <BiboSvg />
        </div>
      </div>
    </Ctx.Provider>
  );
}

export function BiboSvg({ width = 96, height = 112 }) {
  return (
    <svg viewBox="0 0 96 112" width={width} height={height} aria-hidden="true">
      <defs>
        <linearGradient id="bb" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#FFFFFF" /><stop offset="1" stopColor="var(--bibo-arm)" /></linearGradient>
        <linearGradient id="bv" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="var(--bibo-visor-a)" /><stop offset="1" stopColor="var(--bibo-visor-b)" /></linearGradient>
      </defs>
      <g className="bob">
        <g className="ant"><rect x="46" y="6" width="4" height="16" rx="2" fill="var(--bibo-ant)" /><circle className="bulb" cx="48" cy="6" r="5" fill="var(--bibo-bulb)" /></g>
        <g className="legL"><rect x="32" y="84" width="12" height="20" rx="6" fill="var(--bibo-leg)" /></g>
        <g className="legR"><rect x="52" y="84" width="12" height="20" rx="6" fill="var(--bibo-leg)" /></g>
        <g className="armL"><rect x="9" y="66" width="10" height="20" rx="5" fill="var(--bibo-arm)" /></g>
        <g className="armR"><rect x="77" y="66" width="10" height="20" rx="5" fill="var(--bibo-arm)" /></g>
        <rect x="27" y="62" width="42" height="30" rx="14" fill="url(#bb)" />
        <circle cx="48" cy="77" r="5" fill="var(--bibo-leg)" /><circle cx="48" cy="77" r="2" fill="var(--bibo-eye)" />
        <rect x="12" y="20" width="72" height="52" rx="26" fill="url(#bb)" />
        <rect x="20" y="30" width="56" height="34" rx="17" fill="url(#bv)" />
        <ellipse className="eye" cx="38" cy="47" rx="6" ry="8" fill="var(--bibo-eye)" />
        <ellipse className="eye" cx="58" cy="47" rx="6" ry="8" fill="var(--bibo-eye)" />
        <path className="eye-ok" d="M31 49 Q38 40 45 49" stroke="#4ADE80" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path className="eye-ok" d="M51 49 Q58 40 65 49" stroke="#4ADE80" strokeWidth="4" fill="none" strokeLinecap="round" />
        <circle cx="26" cy="56" r="3.5" fill="var(--bibo-bulb)" opacity=".6" /><circle cx="70" cy="56" r="3.5" fill="var(--bibo-bulb)" opacity=".6" />
      </g>
    </svg>
  );
}
