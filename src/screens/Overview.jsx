import React, { useEffect, useState } from 'react';
import { FileText, Zap, ShieldCheck } from 'lucide-react';
import { Button, Chip, Skeleton } from '../components/ui.jsx';
import Modal from '../components/Modal.jsx';
import { useBibo, BiboSvg } from '../components/Bibo.jsx';
import { getOverview, scanPC, cleanJunk, fmtBytes } from '../data/api.js';
import { Welcome, skipWelcomeOnce, RestoreOption, ensureRestorePoint, BlockersModal, findBlockers, closeBlockers, blockersNote } from './Others.jsx';

export default function Overview({ go }) {
  const bibo = useBibo();
  const [ov, setOv] = useState(null);
  const [error, setError] = useState(null);
  const [restore, setRestore] = useState(false); const [restoreNote, setRestoreNote] = useState(''); const [blockers, setBlockers] = useState(null);
  const [phase, setPhase] = useState('idle'); // idle | scanning | results | cleaning | done
  const [progress, setProgress] = useState({ v: 0, label: '' });
  const [result, setResult] = useState(null);
  const [picked, setPicked] = useState({});
  const [confirm, setConfirm] = useState(false);
  const [freed, setFreed] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const cancelled = React.useRef(false);

  const load = () => getOverview().then(setOv).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);
  // Bibo in grande compare nelle schermate di benvenuto e di controllo: la mascotte che gira per la pagina si nasconde.
  useEffect(() => { bibo.hide(phase !== 'results'); return () => bibo.hide(false); }, [phase]);

  async function start() {
    cancelled.current = false; setPhase('scanning'); setProgress({ v: 0, label: 'Parto…' });
    bibo.act('scanning', 0.62, 0.55, 'Scansione in corso…');
    try {
      const r = await scanPC((v, label) => { setProgress({ v, label }); bibo.say(label + '…'); });
      if (cancelled.current) return; // l'utente ha premuto Interrompi: il risultato si scarta
      setResult(r); setPicked(Object.fromEntries(r.junk.map((j) => [j.id, j.safe])));
      setPhase('results'); bibo.release(); bibo.act('idle', 0.5, 0.82, `Ho trovato ${fmtBytes(r.junk.reduce((s, j) => s + j.bytes, 0))} da liberare`);
    } catch (e) { if (cancelled.current) return; setError(e.message); setPhase('idle'); bibo.release(); }
  }
  function cancelScan() { cancelled.current = true; setPhase('idle'); bibo.release(); }
  const review = (id) => { skipWelcomeOnce(id); go(id); };
  async function clean() {
    setConfirm(false); setPhase('cleaning'); bibo.act('scanning', 0.62, 0.55, restore ? 'Creo il punto di ripristino…' : 'Controllo…');
    if (restore) { const rp = await ensureRestorePoint(); if (!rp.ok) { setPhase('results'); bibo.release(); bibo.say('Non pulisco: ' + rp.text); setRestoreNote(rp.text); return; } setRestoreNote(rp.text); }
    const bl = await findBlockers({ junk: Object.keys(picked).filter((k) => picked[k]) });
    if (bl.length) { setPhase('results'); bibo.release(); setBlockers(bl); return; }
    await doClean();
  }
  async function closeAndClean() {
    const bl = blockers; setBlockers(null); setPhase('cleaning'); bibo.act('scanning', 0.62, 0.55, 'Chiudo i programmi…');
    const rs = await closeBlockers(bl); const n = blockersNote(rs); if (n) setRestoreNote(n);
    await doClean();
  }
  async function doClean() {
    setPhase('cleaning'); bibo.act('scanning', 0.62, 0.55, 'Pulisco con cura…');
    const ids = Object.keys(picked).filter((k) => picked[k]);
    try {
      const { freedBytes, skipped: sk } = await cleanJunk(ids);
      setFreed(freedBytes); setSkipped(sk || 0); setPhase('done'); bibo.release(); bibo.act('happy', 0.45, 0.6, `Fatto! ${fmtBytes(freedBytes)} liberati`);
      load();
    } catch (e) { setError(e.message); setPhase('results'); bibo.release(); }
  }
  const selBytes = result ? result.junk.filter((j) => picked[j.id]).reduce((s, j) => s + j.bytes, 0) : 0;
  const selCount = Object.values(picked).filter(Boolean).length;

  if (error) return <div className="state-error" role="alert"><h2>Qualcosa non ha funzionato</h2><p>{error}</p><Button variant="primary" onClick={() => { setError(null); load(); }}>Riprova</Button></div>;

  const total = result ? result.junk.reduce((x, j) => x + j.bytes, 0) : 0;
  const orb = <div className="bibo-big"><BiboSvg width={150} height={175} /></div>;
  const modals = (<>
    {confirm && (
      <Modal title="Eliminare questi file?" onClose={() => setConfirm(false)}
        actions={<><Button onClick={() => setConfirm(false)}>Annulla</Button><Button variant="primary" onClick={clean}>Sì, pulisci</Button></>}>
        <p className="sub">Verranno eliminati {fmtBytes(selBytes)} da:</p>
        <ul className="plain">{result.junk.filter((j) => picked[j.id]).map((j) => <li key={j.id}>{j.label}</li>)}</ul>
        <RestoreOption checked={restore} onChange={setRestore} />
      </Modal>)}
    {blockers && <BlockersModal blockers={blockers} onCancel={() => setBlockers(null)} onSkip={() => { setBlockers(null); doClean(); }} onClose={closeAndClean} />}</>);

  if (phase === 'idle' || phase === 'done') {
    const health = ov ? (ov.unusedPrograms + ov.startupHeavy > 5 ? 'il PC può andare meglio' : 'PC in buona salute') : '';
    const extra = (<>
      {phase === 'done' && <div className="donechips"><Chip tone="ok">{fmtBytes(freed)} liberati</Chip>{skipped > 0 && <Chip tone="warn">{skipped} elementi in uso, lasciati stare</Chip>}</div>}
      <div className="last">{ov ? `${ov.lastCheck ? 'Ultima messa a punto: ' + ov.lastCheck.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) : 'Mai messo a punto'} · ${health}` : <Skeleton h={20} w={280} />}</div></>);
    return (<>
      <Welcome orb={orb} title="Messa a punto" text="Un controllo rapido di tutto il PC: file inutili, programmi che rallentano e difese di Windows. Poi scegli tu cosa fare."
        feats={[[FileText, 'File inutili', 'Avanzi, cache e Cestino'], [Zap, 'Velocità', "Programmi all'avvio e memoria"], [ShieldCheck, 'Protezione', 'Firewall, antivirus, aggiornamenti']]}
        action={phase === 'done' ? 'Controlla di nuovo' : 'Avvia'} onStart={start} extra={extra} />{modals}</>);
  }
  if (phase === 'scanning' || phase === 'cleaning') {
    return (<div className="screen scanscreen"><div className="scanbox"><div className="orb" aria-hidden="true">{orb}</div>
      <h1 className="h1s">{phase === 'cleaning' ? 'Pulizia in corso…' : 'Controllo il PC…'}</h1>
      <div className="progress" role="status" aria-live="polite">
        <div className="meter big"><i style={{ '--v': (phase === 'cleaning' ? 100 : progress.v * 100) + '%', background: 'var(--grad-scan)' }} /></div>
        <p>{phase === 'cleaning' ? 'Pulisco con cura…' : progress.label + '…'}</p>
      </div>
      {phase === 'scanning' && <Button onClick={cancelScan}>Interrompi</Button>}</div>{modals}</div>);
  }
  // risultati: riepilogo a riquadri
  const heavy = ov ? ov.startupHeavy : 0, threats = ov ? ov.threats : 0;
  return (
    <div className="screen">
      <h1 className="h1s">Messa a punto</h1>
      <p className="sub">Ecco cosa ho trovato. Non ho cambiato niente: scegli tu cosa fare.</p>
      <section className="summary" aria-label="Risultati">
        <h2 className="sumtitle">{total > 0 ? `Ho trovato ${fmtBytes(total)} da liberare` : 'Tutto pulito'}</h2>
        {restoreNote && <p className="sub" role="status">{restoreNote}</p>}
        <Button onClick={() => review('pulizia')}>Controlla tutto</Button>
        <div className="sumgrid">
          <section className="sumcard" aria-label="Pulizia"><div className="sumtop"><div><h3>Pulizia</h3><p className="sumnum">{fmtBytes(total)}</p></div><span className="fic" aria-hidden="true"><FileText size={22} /></span></div>
            <p className="sub tight">{total > 0 ? 'File inutili, cache dei browser e Cestino.' : 'Non c\'è nulla da eliminare.'}</p>
            <div className="sumact"><Button aria-label="Rivedi Pulizia" onClick={() => review('pulizia')}>Rivedi</Button><Button variant="primary" aria-label="Pulisci Pulizia" disabled={!selCount} onClick={() => setConfirm(true)}>Pulisci</Button></div></section>
          <section className="sumcard" aria-label="Velocità"><div className="sumtop"><div><h3>Velocità</h3><p className="sumnum">{heavy ? `${heavy} da guardare` : 'A posto'}</p></div><span className="fic" aria-hidden="true"><Zap size={22} /></span></div>
            <p className="sub tight">{heavy ? `${heavy} ${heavy === 1 ? 'programma rallenta' : 'programmi rallentano'} l'avvio.` : "Nessun programma rallenta l'avvio."}</p>
            <div className="sumact"><Button aria-label="Rivedi Velocità" onClick={() => review('velocita')}>Rivedi</Button></div></section>
          <section className="sumcard" aria-label="Protezione"><div className="sumtop"><div><h3>Protezione</h3><p className="sumnum">{threats ? `${threats} minacce` : 'Nessuna minaccia'}</p></div><span className="fic" aria-hidden="true"><ShieldCheck size={22} /></span></div>
            <p className="sub tight">{threats ? 'Apri Protezione per vedere cosa fare.' : 'Firewall, antivirus e aggiornamenti si controllano da Protezione.'}</p>
            <div className="sumact"><Button aria-label="Rivedi Protezione" onClick={() => review('protezione')}>Rivedi</Button></div></section>
        </div>
      </section>
      {modals}
    </div>
  );
}
