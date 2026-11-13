import React, { useEffect, useState } from 'react';
import { Sparkles, Globe, FileText, Trash2, Archive, Layers, Zap, ShieldCheck, LayoutGrid, Power, Cpu, Gauge, Flame, Shield, RefreshCw, Package, Database, HardDrive, Copy, EyeOff, Download, PieChart, Folder } from 'lucide-react';
import { Button, Card, Chip, Toggle, Skeleton, Empty, BackButton } from '../components/ui.jsx';
import Modal from '../components/Modal.jsx';
import { TOUR_EVENT } from '../components/Tour.jsx';
import { useBibo } from '../components/Bibo.jsx';
import { getTheme, applyTheme, PALETTES, getPalette, applyPalette } from '../theme.js';
import { getUiVersion, setUiVersion, getFolderChildren, getJunk, cleanJunk, getStartupApps, setStartupEnabled, openStartupSettings, getProtection, getPrograms, removeProgram, getLargeFiles, trashLargeFiles, getDuplicates, trashDuplicates, getReminder, setReminder, getPrivacy, cleanPrivacy, getBlockers, terminateBrowsers, getMemoryApps, closeApp, freeMemory, createRestorePoint, RESTORE_TEXT, getLeftovers, trashLeftovers, deleteRegistry, protectionScan, getDiskUsage, getAppUpdates, updateApp, getAppInfo, setKeepInTray, testNotification, canQuit, quitApp, fmtBytes } from '../data/api.js';

function useLoad(fn) {
  const [d, setD] = useState(null); const [err, setErr] = useState(null);
  const load = () => { setErr(null); fn().then(setD).catch((e) => setErr(e.message)); };
  useEffect(load, []);
  return [d, setD, err, load];
}
const Err = ({ msg, retry }) => <div className="state-error" role="alert"><h2>Qualcosa non ha funzionato</h2><p>{msg}</p><Button variant="primary" onClick={retry}>Riprova</Button></div>;
const Rows = () => <ul className="list">{[0, 1, 2, 3].map((i) => <li key={i}><Skeleton h={22} /></li>)}</ul>;

/** Casella "Crea prima un punto di ripristino" per le conferme di pulizia. Spenta di default: Windows chiede una conferma ogni volta. */
export function RestoreOption({ checked, onChange }) {
  return (<label className="restore-opt"><input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} /> <span>Crea prima un punto di ripristino <small>Windows ti chiederà una conferma</small></span></label>);
}
/** Crea il punto di ripristino e dice se si può procedere con la pulizia. Se l'utente annulla o non riesce, la pulizia non parte. */
export async function ensureRestorePoint() {
  try { const { status } = await createRestorePoint(); return { ok: status === 'created' || status === 'recent', text: RESTORE_TEXT[status] || RESTORE_TEXT.failed }; }
  catch (e) { return { ok: false, text: 'Non sono riuscito a creare il punto di ripristino: ' + e.message }; }
}

/** Browser aperti che impediscono di pulire bene. Se la ricerca fallisce, si procede come prima (i file in uso vengono lasciati stare). */
export async function findBlockers(sel) { try { return await getBlockers(sel); } catch { return []; } }
export async function closeBlockers(bl) {
  try { return await terminateBrowsers(bl.map((b) => b.key)); } catch (e) { return bl.map((b) => ({ key: b.key, name: b.name, closed: false, reason: e.message })); }
}
export const blockersNote = (rs) => { const f = rs.filter((r) => !r.closed); return f.length ? `${f[0].name} ${f[0].reason || 'non si è chiuso'}` : ''; };
/** Popup: programmi aperti che bloccano la pulizia. Chiude solo se l'utente lo chiede. */
export function BlockersModal({ blockers, onCancel, onSkip, onClose }) {
  return (<Modal title="Ci sono programmi aperti" onClose={onCancel} actions={<><Button onClick={onCancel}>Annulla</Button><Button onClick={onSkip}>Pulisci senza chiuderli</Button><Button variant="primary" onClick={onClose}>Chiudi e pulisci</Button></>}>
    <p className="sub">Per pulire bene questi programmi devono essere chiusi:</p>
    <ul className="plain">{blockers.map((b) => <li key={b.key}>{b.name} <small>{b.windowed ? '(finestra aperta: ti verrà chiesto di salvare)' : '(attivo in background, senza finestre)'}</small></li>)}</ul>
    <p className="sub">Chiusi, i programmi in background vengono terminati; per quelli con una finestra chiedo a Windows di chiuderli, come con la X. Senza chiuderli, i file che usano vengono lasciati stare.</p></Modal>);
}

/** Le tre colonne di Pulizia: categorie, tipi di file, elementi con casella. */
const CLEAN_CATS = [
  { id: 'sistema', label: 'Spazzatura di sistema', text: 'File superflui che occupano spazio e rallentano il PC.', ids: ['tmp', 'update', 'logs', 'thumbs'] },
  { id: 'browser', label: 'Browser', text: 'Dati temporanei dei browser: si rigenerano da soli.', ids: ['cache-browser'] },
  { id: 'cestino', label: 'Cestino', text: 'File che hai già buttato via.', ids: ['recycle'] },
];
const JUNK_TEXT = { tmp: 'Avanzi dei programmi: puoi eliminarli senza rischi.', 'cache-browser': 'Pagine e immagini salvate per aprire i siti più in fretta.', update: 'Copie degli aggiornamenti già installati. Servono i permessi di amministratore.', recycle: 'Svuotare il Cestino non si può annullare.', logs: 'Rapporti di errore e registri che nessuno legge più.', thumbs: "Anteprime delle immagini: Windows le ricrea quando servono." };
/** Riquadri del riepilogo dopo la scansione: ognuno raggruppa uno o più tipi di file. */
const CLEAN_CARDS = [
  { id: 'tmp', label: 'File temporanei', ids: ['tmp'], Icon: FileText, big: true, text: 'Avanzi dei programmi e di Windows: si possono eliminare senza rischi.' },
  { id: 'browser', label: 'Cache dei browser', ids: ['cache-browser'], Icon: Globe },
  { id: 'update', label: 'Vecchi aggiornamenti', ids: ['update'], Icon: Archive },
  { id: 'cestino', label: 'Cestino', ids: ['recycle'], Icon: Trash2 },
  { id: 'altro', label: 'Registri e miniature', ids: ['logs', 'thumbs'], Icon: Layers },
];
const leavesOf = (j) => (j.parts && j.parts.length ? j.parts.map((p) => ({ key: `${j.id}/${p.id}`, item: j.id, label: p.label, bytes: p.bytes, name: `${j.label}: ${p.label}` })) : [{ key: j.id, item: j.id, label: j.label, bytes: j.bytes, name: j.label }]);

function CleanResults({ onBack }) {
  const bibo = useBibo(); const [items, setItems, err, load] = useLoad(getJunk); const [busy, setBusy] = useState(false);
  const [picked, setPicked] = useState(null); const [confirm, setConfirm] = useState(false); const [msg, setMsg] = useState(''); const [restore, setRestore] = useState(false);
  const [catId, setCatId] = useState('sistema'); const [typeId, setTypeId] = useState(null);
  const [blockers, setBlockers] = useState(null); const [view, setView] = useState('summary'); const [only, setOnly] = useState(null);
  const leaves = (items || []).flatMap(leavesOf);
  useEffect(() => { if (items && picked === null) setPicked(Object.fromEntries(items.flatMap(leavesOf).map((l) => [l.key, true]))); }, [items]);
  if (err) return <Err msg={err} retry={load} />;
  const P = picked || {};
  const cats = CLEAN_CATS.map((c) => ({ ...c, types: (items || []).filter((j) => c.ids.includes(j.id)) })).filter((c) => c.types.length);
  const known = new Set(CLEAN_CATS.flatMap((c) => c.ids)); const others = (items || []).filter((j) => !known.has(j.id));
  if (others.length) { const sis = cats.find((c) => c.id === 'sistema'); if (sis) sis.types = [...sis.types, ...others]; else cats.unshift({ ...CLEAN_CATS[0], types: others }); }
  const cat = cats.find((c) => c.id === catId) || cats[0];
  const type = cat && (cat.types.find((j) => j.id === typeId) || cat.types[0]);
  const S = only || P; const sel = leaves.filter((l) => S[l.key]); const bytes = sel.reduce((s, l) => s + l.bytes, 0);
  // Per il sistema: se di un tipo sono spuntati tutti gli elementi mando l'ID del tipo, altrimenti solo gli elementi scelti.
  const ids = () => (items || []).flatMap((j) => { const ls = leavesOf(j), on = ls.filter((l) => S[l.key]); return on.length === ls.length ? [j.id] : on.map((l) => l.key); });
  const doClean = async () => {
    setBusy(true); bibo.act('scanning', .6, .6, 'Pulisco…');
    try { const r = await cleanJunk(ids()); bibo.release(); bibo.act('happy', .5, .6, `Liberati ${fmtBytes(r.freedBytes)}!`); setMsg((m) => (m && /Non pulisco|chiuso|Esiste|Punto/.test(m) ? m + ' · ' : '') + `${fmtBytes(r.freedBytes)} liberati`); setPicked(null); setOnly(null); setBusy(false); load(); }
    catch (e) { bibo.release(); setBusy(false); bibo.say('Non ci sono riuscito: ' + e.message); }
  };
  const run = async () => {
    setConfirm(false); setBusy(true); bibo.act('scanning', .6, .6, restore ? 'Creo il punto di ripristino…' : 'Controllo…');
    if (restore) { const rp = await ensureRestorePoint(); setMsg(rp.text); if (!rp.ok) { bibo.release(); setBusy(false); bibo.say('Non pulisco: ' + rp.text); return; } }
    const bl = await findBlockers({ junk: ids() });
    if (bl.length) { bibo.release(); setBusy(false); setBlockers(bl); return; }
    await doClean();
  };
  const closeAndClean = async () => { const bl = blockers; setBlockers(null); setBusy(true); bibo.act('scanning', .6, .6, 'Chiudo i programmi…'); const rs = await closeBlockers(bl); const n = blockersNote(rs); if (n) setMsg(n); await doClean(); };
  const setAll = (ls, v) => setPicked({ ...P, ...Object.fromEntries(ls.map((l) => [l.key, v])) });
  const typeLeaves = type ? leavesOf(type) : [];
  const count = (j) => leavesOf(j).filter((l) => P[l.key]).length;
  const cardList = CLEAN_CARDS.map((c) => ({ ...c, types: (items || []).filter((j) => c.ids.includes(j.id) || (c.id === 'altro' && !known.has(j.id))) })).filter((c) => c.types.length)
    .map((c) => ({ ...c, bytes: c.types.reduce((x, j) => x + j.bytes, 0) }));
  const total = (items || []).reduce((x, j) => x + j.bytes, 0);
  const review = (c) => { const t = c.types[0]; const k = cats.find((x) => x.types.some((y) => y.id === t.id)); if (k) setCatId(k.id); setTypeId(t.id); setView('detail'); };
  const cleanCard = (c) => { setOnly(Object.fromEntries(c.types.flatMap(leavesOf).map((l) => [l.key, true]))); setConfirm(true); };
  const topLink = view === 'detail' ? <BackButton onClick={() => setView('summary')} /> : <BackButton label="Ricomincia" onClick={onBack} keys={false} />;
  return (<div className="screen clean"><div className="backbar">{topLink}</div><h1 className="h1s">Pulizia</h1><p className="sub">File che puoi eliminare senza rischi per liberare spazio. Prima di eliminare ti faccio vedere l'elenco.</p>
    {!items ? <div role="status" aria-live="polite"><p className="sub">Cerco i file inutili…</p><Rows /></div> : items.length === 0 ? <Empty title="Tutto pulito" text="Non c'è nulla da eliminare, bel lavoro." /> : view === 'summary' ? <div className="summary">
      <h2 className="sumtitle">Puoi liberare {fmtBytes(total)}</h2>{msg && <Chip tone="ok">{msg}</Chip>}
      <Button onClick={() => setView('detail')}>Controlla tutto</Button>
      <div className="sumgrid">{cardList.map((c) => <section key={c.id} className={'sumcard' + (c.big ? ' big' : '')} aria-label={c.label}>
        <div className="sumtop"><div><h3>{c.label}</h3><p className="sumnum">{fmtBytes(c.bytes)}</p></div><span className="fic" aria-hidden="true"><c.Icon size={22} /></span></div>
        {c.text && <p className="sub tight">{c.text}</p>}
        <div className="sumact"><Button aria-label={`Rivedi ${c.label}`} onClick={() => review(c)}>Rivedi</Button><Button variant="primary" loading={busy} aria-label={`Pulisci ${c.label}`} onClick={() => cleanCard(c)}>Pulisci</Button></div></section>)}</div></div>
      : <>
      <div className="cols3">
        <nav className="col col-cat" aria-label="Categorie">{cats.map((c) => <button key={c.id} className={'catbtn' + (c.id === cat.id ? ' on' : '')} aria-current={c.id === cat.id ? 'true' : undefined} onClick={() => { setCatId(c.id); setTypeId(null); }}>{c.label}</button>)}</nav>
        <section className="col col-type" aria-label="Tipi di file"><h2>{cat.label}</h2><p className="sub tight">{cat.text}</p>
          <ul className="typelist">{cat.types.map((j) => <li key={j.id}><button className={'typebtn' + (j.id === type.id ? ' on' : '')} aria-current={j.id === type.id ? 'true' : undefined} onClick={() => setTypeId(j.id)}><span className="grow">{j.label}<small>{count(j)} di {leavesOf(j).length} selezionati</small></span><span className="mono">{fmtBytes(j.bytes)}</span></button></li>)}</ul></section>
        <section className="col col-items" aria-label="Elementi"><h2>{type.label}</h2><p className="sub tight">{JUNK_TEXT[type.id] || ''}{type.note ? ` ${type.note}.` : ''}</p>
          <div className="pick">Seleziona: <button className="linkbtn" onClick={() => setAll(typeLeaves, true)}>Tutto</button><button className="linkbtn" onClick={() => setAll(typeLeaves, false)}>Nessuno</button></div>
          <ul className="list">{typeLeaves.map((l) => <li key={l.key}><label><input type="checkbox" aria-label={`Seleziona ${l.name}`} checked={!!P[l.key]} onChange={(e) => setPicked({ ...P, [l.key]: e.target.checked })} />
            <span className="grow">{l.label}</span><span className="mono">{fmtBytes(l.bytes)}</span></label></li>)}</ul></section>
      </div>
      <div className="bar" role="status"><span><b>{sel.length}</b> {sel.length === 1 ? 'elemento selezionato' : 'elementi selezionati'}<i aria-hidden="true">|</i><span className="mono">{fmtBytes(bytes)}</span></span>
        {msg && <Chip tone="ok">{msg}</Chip>}<Button variant="primary" loading={busy} disabled={!sel.length} onClick={() => setConfirm(true)}>Pulisci</Button></div></>}
    {confirm && <Modal title="Eliminare questi file?" onClose={() => { setConfirm(false); setOnly(null); }} actions={<><Button onClick={() => { setConfirm(false); setOnly(null); }}>Annulla</Button><Button variant="primary" onClick={run}>Sì, pulisci</Button></>}>
      <p className="sub">Verranno eliminati {fmtBytes(bytes)} da:</p><ul className="plain">{sel.map((l) => <li key={l.key}>{l.name}</li>)}</ul><RestoreOption checked={restore} onChange={setRestore} /></Modal>}
    {blockers && <BlockersModal blockers={blockers} onCancel={() => { setBlockers(null); setOnly(null); }} onSkip={() => { setBlockers(null); doClean(); }} onClose={closeAndClean} />}
  </div>);
}

/** Pagina di benvenuto: si vede prima del contenuto e l'analisi parte solo quando l'utente la chiede. */
export function Welcome({ Icon, orb, title, text, feats, action, onStart, extra }) {
  return (<div className="screen welcome"><div className="hero2"><div className="orb" aria-hidden="true">{orb || <Icon size={84} strokeWidth={1.5} />}</div>
    <div className="hero2-text"><h1 className="h1s">{title}</h1><p className="sub">{text}</p>
      <ul className="feats">{feats.map(([I, t, d]) => <li key={t}><span className="fic" aria-hidden="true"><I size={20} /></span><span><b>{t}</b><small>{d}</small></span></li>)}</ul></div></div>
    {extra}
    <div className="startbar"><Button variant="primary" onClick={onStart}>{action}</Button></div></div>);
}
/** Quando si arriva da "Rivedi" della Panoramica la scansione l'ha già fatta Bibo: il benvenuto si salta una volta. */
const skipWelcome = new Set();
export const skipWelcomeOnce = (id) => skipWelcome.add(id);
const useSkip = (id) => { const [v] = useState(() => skipWelcome.has(id)); useEffect(() => { skipWelcome.delete(id); }, []); return v; };
const WELCOME = {
  clean: { Icon: Sparkles, title: 'Pulizia', text: "Libera spazio togliendo i file che non servono più. Prima di eliminare ti faccio vedere l'elenco e scegli tu.", action: 'Scansiona',
    feats: [[FileText, 'File temporanei e registri', 'Avanzi dei programmi e di Windows'], [Globe, 'Cache dei browser', 'Pagine salvate che si rigenerano da sole'], [Trash2, 'Cestino', 'Quello che hai già buttato via']] },
  speed: { Icon: Zap, title: 'Velocità', text: "Guarda cosa rallenta il PC all'avvio e quanta memoria usano i programmi aperti. Le scelte le fai tu.", action: 'Analizza',
    feats: [[Power, "Programmi all'avvio", 'Quelli che partono insieme al PC'], [Cpu, 'Memoria in uso', 'Chi occupa più RAM adesso'], [Gauge, 'Impatto', "Quanto ciascuno rallenta l'avvio"]] },
  protection: { Icon: ShieldCheck, title: 'Protezione', text: 'Controlla lo stato delle difese di Windows. La scansione la fa Microsoft Defender, non Bibo.', action: 'Controlla',
    feats: [[Flame, 'Firewall', 'Acceso o spento'], [Shield, 'Antivirus', 'Se Defender è attivo'], [RefreshCw, 'Aggiornamenti', "Quando Windows è stato aggiornato l'ultima volta"]] },
  programs: { Icon: LayoutGrid, title: 'Programmi', text: 'Vedi i programmi installati, disinstallali e controlla gli avanzi che lasciano.', action: 'Scansiona',
    feats: [[Package, 'Disinstallazione', "Con il programma di rimozione dell'app"], [Trash2, 'Avanzi', 'Cartelle e cache rimaste'], [Database, 'Voci di registro', 'Le togli con una copia di sicurezza']] },
};
/** Mostra il benvenuto e, dopo il tasto di avvio, la schermata vera. */
function Gate({ id, cfg, children }) {
  const skip = useSkip(id); const [on, setOn] = useState(skip);
  return on ? children : <Welcome {...cfg} onStart={() => setOn(true)} />;
}

const WELCOME2 = {
  disordine: { Icon: Folder, title: 'Caos', text: 'Metti ordine tra i tuoi file: trova i più pesanti e le copie identiche. Vanno nel Cestino, quindi puoi sempre recuperarli.', action: 'Cerca',
    feats: [[HardDrive, 'File grandi', 'I più pesanti nelle tue cartelle'], [Copy, 'Duplicati', 'Copie identiche: gli originali restano'], [Trash2, 'Nel Cestino', 'Niente si cancella per sempre']] },
  privacy: { Icon: EyeOff, title: 'Privacy', text: 'Cancella le tracce dei browser: cronologia e cookie. Segnalibri e password restano al loro posto.', action: 'Controlla',
    feats: [[Globe, 'Cronologia', 'Le pagine che hai visitato'], [Database, 'Cookie', 'Le tracce lasciate dai siti'], [ShieldCheck, 'Segnalibri e accessi', 'Non si toccano']] },
  updates: { Icon: Download, title: 'Aggiornamenti', text: 'Controlla se i programmi installati hanno una versione più nuova e aggiornali.', action: 'Controlla',
    feats: [[RefreshCw, 'Versioni nuove', 'Per i programmi installati'], [Package, 'Uno alla volta', 'Scegli cosa aggiornare'], [ShieldCheck, 'Più sicuri', 'Le correzioni arrivano con gli aggiornamenti']] },
  disk: { Icon: PieChart, title: 'Mappa del disco', text: 'Vedi cosa occupa spazio sul disco, cartella per cartella, per capire da dove cominciare a liberarne.', action: 'Analizza',
    feats: [[PieChart, 'Mappa del disco', 'Quanto occupa ogni cartella'], [Folder, 'Cartelle grandi', 'Le più pesanti in cima'], [HardDrive, 'Spazio libero', 'Quanto ne resta']] },
};
export const Disk = () => <Gate cfg={WELCOME2.disk}><DiskInner /></Gate>;
export const Updates = () => <Gate cfg={WELCOME2.updates}><UpdatesInner /></Gate>;
export const Disordine = () => <Gate cfg={WELCOME2.disordine}><DisordineHub first="large" /></Gate>;
export const Privacy = () => <Gate cfg={WELCOME2.privacy}><PrivacyInner /></Gate>;

export function Clean() {
  const skip = useSkip('pulizia'); const [started, setStarted] = useState(skip);
  return started ? <CleanResults onBack={() => setStarted(false)} /> : <Welcome {...WELCOME.clean} onStart={() => setStarted(true)} />;
}
export const Speed = () => <Gate id="velocita" cfg={WELCOME.speed}><SpeedInner /></Gate>;
export const Protection = () => <Gate id="protezione" cfg={WELCOME.protection}><ProtectionHub /></Gate>;
export const Programs = () => <Gate id="programmi" cfg={WELCOME.programs}><ProgramsHub /></Gate>;

/** Riepilogo di Protezione: stato delle difese in riquadri; Rivedi apre la schermata di sempre (dove si lancia la scansione con Defender). */
function ProtectionHub() {
  const [view, setView] = useState('summary'); const [p, , err, load] = useLoad(getProtection);
  if (err) return <Err msg={err} retry={load} />;
  if (view === 'detail') return (<><div className="backbar"><BackButton onClick={() => setView('summary')} /></div><ProtectionInner /></>);
  const checks = p ? [p.firewall, p.antivirus, p.updates] : []; const bad = checks.filter((x) => !x).length;
  return (<div className="screen"><h1 className="h1s">Protezione</h1><p className="sub">Lo stato delle difese del tuo PC. La scansione la esegue Microsoft Defender, non Bibo.</p>
    {!p ? <div role="status" aria-live="polite"><p className="sub">Controllo le difese…</p><Rows /></div> : <div className="summary">
      <h2 className="sumtitle">{bad ? `${bad} ${bad === 1 ? 'difesa da sistemare' : 'difese da sistemare'}` : 'Le difese sono attive'}</h2>
      <Button onClick={() => setView('detail')}>Mostra tutto</Button>
      <div className="sumgrid">
        <section className="sumcard big" aria-label="Scansione con Defender"><div className="sumtop"><div><h3>Scansione con Defender</h3><p className="sumnum">Rapida</p></div><span className="fic" aria-hidden="true"><ShieldCheck size={22} /></span></div>
          <p className="sub tight">La fa Microsoft Defender, non Bibo: controlla il PC alla ricerca di minacce e dura qualche minuto. La lanci dalla schermata completa.</p>
          <div className="sumact"><Button variant="primary" aria-label="Vai alla scansione" onClick={() => setView('detail')}>Vai alla scansione</Button></div></section>
        <section className="sumcard wide" aria-label="Firewall e antivirus"><div className="sumtop"><div><h3>Firewall e antivirus</h3><p className="sumnum">{[p.firewall, p.antivirus].filter(Boolean).length} su 2 attivi</p></div><span className="fic" aria-hidden="true"><Flame size={22} /></span></div>
          <div className="sumact"><Button aria-label="Rivedi firewall e antivirus" onClick={() => setView('detail')}>Rivedi</Button></div></section>
        <section className="sumcard wide" aria-label="Aggiornamenti di sistema"><div className="sumtop"><div><h3>Aggiornamenti di sistema</h3><p className="sumnum">{p.updates ? (p.lastUpdate || 'Aggiornato') : 'Da sistemare'}</p></div><span className="fic" aria-hidden="true"><RefreshCw size={22} /></span></div>
          <div className="sumact"><Button aria-label="Rivedi aggiornamenti di sistema" onClick={() => setView('detail')}>Rivedi</Button></div></section>
      </div></div>}</div>);
}

/** Riepilogo di Programmi: quanti sono e quali pesano di più; Rivedi apre l'elenco con la disinstallazione di sempre. */
function ProgramsHub() {
  const [view, setView] = useState('summary'); const [list, , err, load] = useLoad(getPrograms);
  if (err) return <Err msg={err} retry={load} />;
  if (view === 'detail') return (<><div className="backbar"><BackButton onClick={() => setView('summary')} /></div><ProgramsInner /></>);
  const sized = (list || []).filter((x) => x.bytes > 0).sort((a, b) => b.bytes - a.bytes); const total = sized.reduce((x, y) => x + y.bytes, 0);
  return (<div className="screen"><h1 className="h1s">Programmi</h1><p className="sub">I programmi installati sul PC. Puoi disinstallarli e controllare gli avanzi che lasciano.</p>
    {!list ? <div role="status" aria-live="polite"><p className="sub">Leggo i programmi installati…</p><Rows /></div> : <div className="summary">
      <h2 className="sumtitle">Hai {list.length} {list.length === 1 ? 'programma installato' : 'programmi installati'}</h2>
      <Button onClick={() => setView('detail')}>Mostra tutto</Button>
      <div className="sumgrid">
        <section className="sumcard big" aria-label="I più pesanti"><div className="sumtop"><div><h3>I più pesanti</h3><p className="sumnum">{fmtBytes(sized.slice(0, 5).reduce((x, y) => x + y.bytes, 0))}</p></div><span className="fic" aria-hidden="true"><Package size={22} /></span></div>
          {sized.length ? <ul className="plain sumlist">{sized.slice(0, 5).map((x) => <li key={x.id}><span className="grow">{x.name}</span><span className="mono">{fmtBytes(x.bytes)}</span></li>)}</ul> : <p className="sub tight">Windows non ha indicato le dimensioni.</p>}
          <div className="sumact"><Button aria-label="Rivedi i più pesanti" onClick={() => setView('detail')}>Rivedi</Button></div></section>
        <section className="sumcard wide" aria-label="Per liberare spazio"><div className="sumtop"><div><h3>Per liberare spazio</h3><p className="sumnum">{sized.length ? sized[0].name : 'Nessun dato'}</p></div><span className="fic" aria-hidden="true"><Trash2 size={22} /></span></div>
          <p className="sub tight">{sized.length ? `Disinstallare il programma più pesante libera circa ${fmtBytes(sized[0].bytes)}. Dopo la rimozione cerco gli avanzi e le voci di registro.` : 'Dopo ogni rimozione cerco gli avanzi e le voci di registro.'}</p>
          <div className="sumact"><Button aria-label="Rivedi per liberare spazio" onClick={() => setView('detail')}>Rivedi</Button></div></section>
        <section className="sumcard" aria-label="Programmi installati"><div className="sumtop"><div><h3>Programmi installati</h3><p className="sumnum">{list.length}</p></div><span className="fic" aria-hidden="true"><LayoutGrid size={22} /></span></div>
          <div className="sumact"><Button aria-label="Rivedi i programmi installati" onClick={() => setView('detail')}>Rivedi</Button></div></section>
        <section className="sumcard" aria-label="Spazio occupato"><div className="sumtop"><div><h3>Spazio occupato</h3><p className="sumnum">{total ? fmtBytes(total) : 'n.d.'}</p></div><span className="fic" aria-hidden="true"><Database size={22} /></span></div>
          <div className="sumact"><Button aria-label="Rivedi lo spazio occupato" onClick={() => setView('detail')}>Rivedi</Button></div></section>
      </div></div>}</div>);
}

function SpeedInner() {
  const bibo = useBibo(); const [apps, setApps, err, load] = useLoad(getStartupApps); const [mem, , , loadMem] = useLoad(getMemoryApps);
  const [view, setView] = useState('summary'); const [freeing, setFreeing] = useState(false); const [freed, setFreed] = useState(null);
  if (err) return <Err msg={err} retry={load} />;
  const tone = { alto: 'bad', medio: 'warn', basso: 'ok' };
  const heavy = (apps || []).filter((a) => a.impact === 'alto' && a.enabled).length, active = (apps || []).filter((a) => a.enabled).length;
  const memBytes = (mem || []).reduce((x, m) => x + m.bytes, 0);
  const freeNow = async () => { setFreeing(true); setFreed(null); try { const r = await freeMemory(); setFreed(r.freedBytes); bibo.act('happy', .5, .7, r.freedBytes > 0 ? `Liberati ${fmtBytes(r.freedBytes)}!` : 'Memoria già a posto'); loadMem(); } catch (e) { bibo.say('Non ci sono riuscito: ' + e.message); } setFreeing(false); };
  if (view === 'summary') return (<div className="screen"><h1 className="h1s">Velocità</h1><p className="sub">Cosa rallenta il PC: programmi che partono con Windows e programmi aperti che occupano memoria. Le scelte le fai tu.</p>
    {!apps || !mem ? <div role="status" aria-live="polite"><p className="sub">Analizzo il PC…</p><Rows /></div> : <div className="summary">
      <h2 className="sumtitle">{heavy ? `${heavy} ${heavy === 1 ? 'programma rallenta' : 'programmi rallentano'} l'avvio` : "L'avvio è a posto"}</h2>{freed !== null && <Chip tone="ok">{freed > 0 ? `${fmtBytes(freed)} liberati` : 'Niente da liberare'}</Chip>}
      <Button onClick={() => setView('detail')}>Mostra tutto</Button>
      <div className="sumgrid">
        <section className="sumcard big" aria-label="Memoria"><div className="sumtop"><div><h3>Memoria (RAM)</h3><p className="sumnum">{fmtBytes(memBytes)}</p></div><span className="fic" aria-hidden="true"><Cpu size={22} /></span></div>
          <p className="sub tight">Usata dai programmi aperti più pesanti. "Libera memoria" non chiude niente e non fa perdere dati.</p>
          <div className="sumact"><Button aria-label="Rivedi memoria" onClick={() => setView('detail')}>Rivedi</Button><Button variant="primary" loading={freeing} aria-label="Libera memoria" onClick={freeNow}>Libera memoria</Button></div></section>
        <section className="sumcard wide" aria-label="Avvio rallentato"><div className="sumtop"><div><h3>Impatto alto all'avvio</h3><p className="sumnum">{heavy}</p></div><span className="fic" aria-hidden="true"><Gauge size={22} /></span></div>
          <p className="sub tight">Programmi attivi che fanno partire il PC più lentamente. Spegnili per avviarlo più in fretta.</p>
          <div className="sumact"><Button aria-label="Rivedi avvio rallentato" onClick={() => setView('detail')}>Rivedi</Button></div></section>
        <section className="sumcard" aria-label="Programmi all'avvio"><div className="sumtop"><div><h3>Programmi all'avvio</h3><p className="sumnum">{active} su {apps.length}</p></div><span className="fic" aria-hidden="true"><Power size={22} /></span></div>
          <div className="sumact"><Button aria-label="Rivedi programmi all'avvio" onClick={() => setView('detail')}>Rivedi</Button></div></section>
        <section className="sumcard" aria-label="Programmi aperti pesanti"><div className="sumtop"><div><h3>Programmi aperti pesanti</h3><p className="sumnum">{mem.length}</p></div><span className="fic" aria-hidden="true"><Layers size={22} /></span></div>
          <div className="sumact"><Button aria-label="Rivedi programmi aperti" onClick={() => setView('detail')}>Rivedi</Button></div></section>
      </div></div>}</div>);
  return (<div className="screen"><div className="backbar"><BackButton onClick={() => setView('summary')} /></div><h1 className="h1s">Velocità</h1><p className="sub">Questi programmi partono insieme al PC. Spegni quelli che non ti servono subito.</p>
    <MemoryPanel />
    <h2>Programmi all'avvio</h2>
    {!apps ? <Rows /> : <ul className="list">{apps.map((a) => (
      <li key={a.id}><div className="row"><span className="grow">{a.name}{a.detail && a.detail !== a.name && <small>{a.detail}</small>}</span>{a.impact !== 'sconosciuto' && <Chip tone={tone[a.impact]}>impatto {a.impact}</Chip>}
        {a.store ? <Button onClick={() => openStartupSettings()}>Cambia in Impostazioni</Button> : a.canToggle === false && <span className="mono">solo amministratore</span>}<Toggle disabled={a.canToggle === false || !!a.store} label={`Avvio automatico di ${a.name}`} checked={a.enabled} onChange={async (v) => { setApps(apps.map((x) => x.id === a.id ? { ...x, enabled: v } : x)); await setStartupEnabled(a.id, v); if (!v) bibo.act('happy', .5, .7, 'Avvio più leggero!'); }} /></div></li>))}</ul>}
  </div>);
}

function ProtectionInner() {
  const bibo = useBibo(); const [p, , err, load] = useLoad(getProtection); const [scan, setScan] = useState({ phase: 'idle' });
  if (err) return <Err msg={err} retry={load} />;
  const row = (l, ok, extra) => <li><div className="row"><span className="grow">{l}</span><Chip tone={ok ? 'ok' : 'warn'}>{ok ? 'Attivo' : 'Da sistemare'}</Chip>{extra && <span className="mono">{extra}</span>}</div></li>;
  async function run() {
    setScan({ phase: 'running' }); bibo.act('scanning', .6, .6, 'Defender sta controllando…');
    try { const r = await protectionScan(); setScan({ phase: 'done', threats: r.threats }); bibo.release(); bibo.act(r.threats.length ? 'idle' : 'happy', .5, .6, r.threats.length ? `Trovate ${r.threats.length} minacce` : 'Nessuna minaccia!'); }
    catch (e) { setScan({ phase: 'error', msg: e.message }); bibo.release(); }
  }
  return (<div className="screen"><h1 className="h1s">Protezione</h1><p className="sub">Lo stato delle difese del tuo PC. La scansione la esegue Microsoft Defender, non Bibo.</p>
    {!p ? <Rows /> : <ul className="list">{row('Firewall', p.firewall)}{row('Antivirus', p.antivirus)}{row('Aggiornamenti di sistema', p.updates, p.lastUpdate)}</ul>}
    <div className="actions"><Button variant="primary" loading={scan.phase === 'running'} onClick={run}>{scan.phase === 'running' ? 'Scansione in corso…' : 'Scansione rapida con Defender'}</Button>
      {scan.phase === 'done' && (scan.threats.length === 0 ? <Chip tone="ok">Nessuna minaccia trovata</Chip> : <Chip tone="bad">{scan.threats.length} minacce: apri Sicurezza di Windows per rimuoverle</Chip>)}</div>
    {scan.phase === 'done' && scan.threats.length > 0 && <ul className="list">{scan.threats.map((t, i) => <li key={i}><div className="row"><span className="grow">{t.name}</span></div></li>)}</ul>}
    {scan.phase === 'error' && <div className="state-error" role="alert"><p>{scan.msg}</p></div>}
  </div>);
}

/** Ciambella: parte colorata = spazio usato, grigio = libero. Il testo al centro e la legenda dicono gli stessi numeri (mai solo il colore). */
function Donut({ used, total, id, hot }) {
  const r = 52, c = 2 * Math.PI * r, frac = total ? Math.min(1, used / total) : 0;
  return (<svg viewBox="0 0 140 140" className="donut" aria-hidden="true">
    <defs><linearGradient id={id} x1="0" y1="0" x2="1" y2="1"><stop offset="0" style={{ stopColor: hot ? 'var(--chart-hot-a)' : 'var(--chart-a)' }} /><stop offset="1" style={{ stopColor: hot ? 'var(--chart-hot-b)' : 'var(--chart-b)' }} /></linearGradient></defs>
    <circle cx="70" cy="70" r={r} fill="none" stroke="var(--color-surface-raised)" strokeWidth="16" />
    <circle cx="70" cy="70" r={r} fill="none" stroke={`url(#${id})`} strokeWidth="16" strokeLinecap="round" transform="rotate(-90 70 70)"
      strokeDasharray={`${Math.max(frac * c, frac > 0 ? 1 : 0)} ${c}`} className="donut-arc" />
    <text x="70" y="68" textAnchor="middle" className="donut-pct">{Math.round(frac * 100)}%</text>
    <text x="70" y="88" textAnchor="middle" className="donut-lbl">usato</text>
  </svg>);
}
const BARS = ['var(--grad-hero)', 'var(--grad-clean)', 'var(--grad-speed)', 'var(--grad-scan)'];
const FOLDER_NAMES = { Downloads: 'Download', Documents: 'Documenti', Desktop: 'Desktop', Videos: 'Video', Pictures: 'Immagini', Music: 'Musica' };

const BUB = ['var(--color-accent)', 'var(--color-accent-cyan)', 'var(--color-accent-pink)', 'var(--color-success)'];
/** Disposizione a bolle: area proporzionale alla dimensione, senza sovrapposizioni. Restituisce posizioni e riquadro. */
function packBubbles(items) {
  const maxB = Math.max(...items.map((i) => i.bytes), 1), placed = [];
  for (const it of [...items].sort((x, y) => y.bytes - x.bytes)) {
    const r = Math.max(34, Math.sqrt(it.bytes / maxB) * 100); let best = null;
    if (!placed.length) best = { x: 0, y: 0 };
    else for (const q of placed) for (let g = 0; g < 360; g += 9) {
      const x = q.x + Math.cos(g * Math.PI / 180) * (q.r + r + 6), y = q.y + Math.sin(g * Math.PI / 180) * (q.r + r + 6);
      if (placed.some((o) => Math.hypot(o.x - x, o.y - y) < o.r + r + 4)) continue;
      const d = Math.hypot(x, y * 1.25); if (!best || d < best.d) best = { x, y, d };
    }
    placed.push({ ...it, r, x: best.x, y: best.y });
  }
  const minx = Math.min(...placed.map((o) => o.x - o.r)), maxx = Math.max(...placed.map((o) => o.x + o.r)), miny = Math.min(...placed.map((o) => o.y - o.r)), maxy = Math.max(...placed.map((o) => o.y + o.r));
  return { placed, box: [minx - 8, miny - 8, maxx - minx + 16, maxy - miny + 16] };
}

function DiskInner() {
  const [d, , err, load] = useLoad(getDiskUsage);
  const [path, setPath] = useState([]); // [] = primo livello; altrimenti [cartella, ...sottocartelle]
  const [sub, setSub] = useState(null); const [serr, setSerr] = useState(null); const [hover, setHover] = useState(null);
  const key = path.join('/');
  useEffect(() => {
    if (!path.length) { setSub(null); setSerr(null); return undefined; }
    let live = true; setSub(null); setSerr(null);
    getFolderChildren(path[0], path.slice(1)).then((r) => live && setSub(r)).catch((e) => live && setSerr(e.message));
    return () => { live = false; };
  }, [key]);
  if (err) return <Err msg={err} retry={load} />;
  const top = path.length === 0;
  const nm = (f) => (top ? FOLDER_NAMES[f.name] || f.name : f.name);
  const crumb = (n, i) => (i === 0 ? FOLDER_NAMES[n] || n : n);
  let items = [];
  if (d && top) items = [...d.folders].sort((x, y) => y.bytes - x.bytes);
  else if (sub) items = [...sub.children, ...(sub.others > 0 ? [{ name: 'Altri elementi', bytes: sub.others, leaf: true }] : [])];
  const sum = items.reduce((t, f) => t + f.bytes, 0);
  const ready = d && (top || sub);
  const map = ready && items.length && sum > 0 ? packBubbles(items.filter((f) => f.bytes > 0)) : null;
  const open = (f) => { if (!f.leaf) setPath([...path, f.name]); setHover(null); };
  return (<div className="screen"><h1 className="h1s">Mappa del disco</h1><p className="sub">Dove va lo spazio del tuo PC. Clicca una cartella per vedere cosa contiene. Solo lettura: qui non si elimina nulla.</p>
    {!d ? <Rows /> : <>
      <div role="navigation" className="crumbs" aria-label="Percorso"><BackButton disabled={top} onClick={() => setPath(path.slice(0, -1))} />
        <button className="linkbtn" aria-current={top ? 'page' : undefined} onClick={() => setPath([])}>Questo PC</button>
        {path.map((n, i) => <React.Fragment key={i}><span aria-hidden="true">›</span>{i === path.length - 1 ? <span className="here" aria-current="page">{crumb(n, i)}</span> : <button className="linkbtn" onClick={() => setPath(path.slice(0, i + 1))}>{crumb(n, i)}</button>}</React.Fragment>)}</div>
      <div className="space">
        <section className="panel" aria-label="Le tue cartelle"><h2>{top ? 'Le tue cartelle' : crumb(path[path.length - 1], path.length - 1)}</h2>
          <p className="sub tight">{ready ? `${fmtBytes(sum)}${items.filter((f) => !f.leaf).length ? ` in ${items.filter((f) => !f.leaf).length} ${items.filter((f) => !f.leaf).length === 1 ? 'cartella' : 'cartelle'}` : ''}` : 'Calcolo le dimensioni…'}{sub && sub.partial ? ' · dimensioni parziali: la cartella è molto grande' : ''}</p>
          {serr ? <div className="state-error" role="alert"><p>{serr}</p></div> : !ready ? <Rows /> : items.length === 0 ? <Empty title="Cartella vuota" text="Qui dentro non c'è niente." /> :
            <ul className="flist">{items.map((f) => <li key={f.name}>{f.leaf ? <div className="frow leaf"><span className="grow">{f.name}</span><small>{sum ? Math.round(f.bytes / sum * 100) : 0}%</small><span className="mono">{fmtBytes(f.bytes)}</span></div>
              : <button className={'frow' + (hover === f.name ? ' on' : '')} aria-label={`Apri ${nm(f)}, ${fmtBytes(f.bytes)}`} onClick={() => open(f)} onMouseEnter={() => setHover(f.name)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(f.name)} onBlur={() => setHover(null)}><span className="grow">{nm(f)}</span><small>{sum ? Math.round(f.bytes / sum * 100) : 0}%</small><span className="mono">{fmtBytes(f.bytes)}</span><span aria-hidden="true">›</span></button>}</li>)}</ul>}</section>
        <section className="panel bubmap" aria-label="Mappa delle cartelle">{map && <svg viewBox={map.box.join(' ')} role="img" aria-label={`Mappa a bolle: ${items.map((f) => `${nm(f)} ${fmtBytes(f.bytes)}`).join(', ')}`}>
          {map.placed.map((o, i) => <g key={o.name} className={'bub' + (hover === o.name ? ' on' : '') + (o.leaf ? ' leaf' : '')} onClick={() => open(o)} onMouseEnter={() => setHover(o.name)} onMouseLeave={() => setHover(null)}><circle cx={o.x} cy={o.y} r={o.r} fill={BUB[i % BUB.length]} />
            <title>{`${nm(o)}, ${fmtBytes(o.bytes)}`}</title>
            {(() => { const big = o.r > 40, fs = big ? Math.min(16, o.r / 3.2) : 9.5, max = Math.max(3, Math.floor(o.r * 1.8 / (fs * .6))), n = nm(o), t = n.length > max ? n.slice(0, max - 1) + '…' : n;
              return <><text x={o.x} y={big ? o.y - 2 : o.y + fs / 3} textAnchor="middle" fontSize={fs}>{t}</text>{big && <text x={o.x} y={o.y + fs + 2} textAnchor="middle" fontSize={Math.min(14, o.r / 3.6)}>{fmtBytes(o.bytes)}</text>}</>; })()}</g>)}</svg>}</section>
      </div>
      <div className="drives">{d.drives.map((v) => { const used = v.total - v.free, pct = Math.round(used / v.total * 100), hot = used / v.total > .9; return (
        <div className="drive" key={v.letter} role="group" aria-label={`Disco ${v.letter} ${fmtBytes(used)} usati su ${fmtBytes(v.total)}, ${pct}%`}>
          <h3>Disco {v.letter}</h3><span className="bartrack" aria-hidden="true"><i style={{ width: pct + '%', background: hot ? 'var(--color-warning)' : 'var(--grad-hero)' }} /></span>
          <span className="mono">{fmtBytes(used)} di {fmtBytes(v.total)} usati</span>{hot && <Chip tone="warn">Quasi pieno</Chip>}</div>); })}</div></>}
  </div>);
}

/** Riepilogo unico di File grandi e Duplicati: due riquadri, Rivedi apre l'elenco con la selezione e il Cestino di sempre. */
function DisordineHub({ first }) {
  const [view, setView] = useState('summary'); const [files, , e1, l1] = useLoad(getLargeFiles); const [groups, , e2, l2] = useLoad(getDuplicates);
  if (e1 || e2) return <Err msg={e1 || e2} retry={() => { l1(); l2(); }} />;
  if (view !== 'summary') return (<><div className="backbar"><BackButton onClick={() => setView('summary')} /></div>{view === 'large' ? <LargeFilesInner /> : <DuplicatesInner />}</>);
  const nLarge = (files || []).length, bLarge = (files || []).reduce((x, f) => x + f.bytes, 0);
  const copies = (groups || []).flatMap((g) => g.files.filter((f) => !f.keep).map(() => g.bytes)); const nDup = copies.length, bDup = copies.reduce((x, y) => x + y, 0);
  return (<div className="screen"><h1 className="h1s">Caos</h1><p className="sub">I file che pesano di più e le copie identiche. Vanno nel Cestino, quindi puoi sempre recuperarli.</p>
    {!files || !groups ? <div role="status" aria-live="polite"><p className="sub">Cerco nelle tue cartelle…</p><Rows /></div> : <div className="summary">
      <h2 className="sumtitle">{nLarge + nDup ? `Hai ${nLarge + nDup} file da esaminare` : 'Niente da mettere in ordine'}</h2>
      <Button onClick={() => setView(first)}>Controlla tutti i file</Button>
      <div className="sumgrid">
        <section className="sumcard big" aria-label="Duplicati"><div className="sumtop"><div><h3>Duplicati</h3><p className="sumnum">{nDup} {nDup === 1 ? 'copia' : 'copie'}</p></div><span className="fic" aria-hidden="true"><Copy size={22} /></span></div>
          <p className="sub tight">{nDup ? `Le copie occupano ${fmtBytes(bDup)}. Di ogni gruppo l'originale più vecchio resta sempre.` : 'Non ho trovato file identici sopra 1 MB.'}</p>
          <div className="sumact"><Button variant="primary" aria-label="Rivedi duplicati" onClick={() => setView('dup')}>Rivedi</Button></div></section>
        <section className="sumcard wide tall" aria-label="File grandi"><div className="sumtop"><div><h3>File grandi</h3><p className="sumnum">{fmtBytes(bLarge)}</p></div><span className="fic" aria-hidden="true"><HardDrive size={22} /></span></div>
          <p className="sub tight">{nLarge ? `${nLarge} ${nLarge === 1 ? 'file sopra' : 'file sopra'} 100 MB nelle tue cartelle. Valuta cosa non ti serve più.` : 'Non ho trovato file sopra i 100 MB.'}</p>
          <div className="sumact"><Button aria-label="Rivedi file grandi" onClick={() => setView('large')}>Rivedi</Button></div></section>
      </div></div>}</div>);
}

function UpdatesInner() {
  const bibo = useBibo(); const [list, setList, err, load] = useLoad(getAppUpdates); const [busy, setBusy] = useState(null);
  if (err) return <Err msg={err} retry={load} />;
  return (<div className="screen"><h1 className="h1s">Aggiornamenti</h1><p className="sub">Programmi con una versione più recente. Aggiorni uno alla volta, quando vuoi.</p>
    {!list ? <Rows /> : list.length === 0 ? <Empty title="Tutto aggiornato" text="Non ci sono aggiornamenti disponibili." /> :
      <ul className="list">{list.map((u) => <li key={u.id}><div className="row"><span className="grow">{u.name}<small>{u.version} → {u.available}</small></span>
        <Button loading={busy === u.id} onClick={async () => { setBusy(u.id); try { await updateApp(u.id); setList(list.filter((x) => x.id !== u.id)); bibo.act('happy', .5, .7, `${u.name} aggiornato!`); } catch (e) { bibo.say('Non ci sono riuscito: ' + e.message); } setBusy(null); }}>Aggiorna</Button></div></li>)}</ul>}
  </div>);
}

function ProgramsInner() {
  const [list, setList, err, load] = useLoad(getPrograms); const [target, setTarget] = useState(null);
  const [step, setStep] = useState(null); // { phase: 'wait' | 'result', p, removed, fresh, left }
  const [pickedL, setPickedL] = useState({}); const [movedMsg, setMovedMsg] = useState(''); const [pickedR, setPickedR] = useState({}); const [regMsg, setRegMsg] = useState(''); const [forceAdmin, setForceAdmin] = useState(false);
  const bibo = useBibo();
  if (err) return <Err msg={err} retry={load} />;
  const start = async () => {
    const t = target; setTarget(null);
    try { await removeProgram(t.id); bibo.act('idle', .5, .7, 'Segui la finestra di Windows per finire'); setStep({ phase: 'wait', p: t }); }
    catch (e) { bibo.say('Non ci sono riuscito: ' + e.message); }
  };
  // Quando l'utente ha finito (o chiude il popup) si rilegge l'elenco e si dice com'è andata.
  const check = async () => {
    if (step.checking) return; // un solo controllo alla volta: il secondo clic non fa nulla
    setStep({ ...step, checking: true });
    const p = step.p; let fresh = list;
    try { fresh = await getPrograms(); } catch { /* resta l'elenco di prima */ }
    const removed = !fresh.some((x) => x.id === p.id);
    bibo.act(removed ? 'happy' : 'idle', .5, .7, removed ? 'Programma rimosso!' : 'Non è stato rimosso');
    let left = [], regs = []; setPickedL({}); setMovedMsg(''); setPickedR({}); setRegMsg('');
    if (removed) { try { const l = await getLeftovers(p); left = l.items; regs = l.reg || []; } catch { /* nessun avanzo da mostrare */ } }
    setStep({ phase: 'result', p, removed, fresh, left, regs });
  };
  const closeResult = () => { setList(step.fresh); setStep(null); };
  const moveLeftovers = async () => {
    const ids = step.left.filter((x) => pickedL[x.id]).map((x) => x.id);
    try {
      const r = await trashLeftovers(ids);
      const moved = r.moved || (r.failed ? [] : ids);
      setMovedMsg(r.failed ? `Non spostato${r.failed > 1 ? 'e' : ''}: ${(r.errors && r.errors[0]) || 'file in uso o protetti'}` : `${fmtBytes(r.freedBytes)} spostati nel Cestino`);
      setStep({ ...step, left: step.left.filter((x) => !moved.includes(x.id)) }); setPickedL({});
      bibo.act(r.failed ? 'idle' : 'happy', .5, .7, r.failed ? 'Qualcosa non si è spostato' : 'Avanzi nel Cestino!');
    } catch (e) { setMovedMsg('Non ci sono riuscito: ' + e.message); }
  };
  // Le chiavi di HKLM (e ogni nuovo tentativo dopo "serve amministratore") si cancellano con una richiesta di Windows (UAC).
  const needAdmin = forceAdmin || !!step?.regs?.some((x) => pickedR[x.id] && /^HKLM/i.test(x.key));
  const delRegs = async () => {
    const ids = step.regs.filter((x) => pickedR[x.id]).map((x) => x.id);
    try {
      const r = await deleteRegistry(ids, needAdmin); const gone = r.moved || []; if (needAdmin) setForceAdmin(false); else if (r.needsAdmin) setForceAdmin(true);
      setRegMsg(r.failed ? `Non cancellat${r.failed > 1 ? 'e' : 'a'}: ${(r.errors && r.errors[0]) || 'protetta'}` : `${r.deleted} ${r.deleted === 1 ? 'voce cancellata' : 'voci cancellate'}. Copia salvata in ${r.backupDir}`);
      setStep({ ...step, regs: step.regs.filter((x) => !gone.includes(x.id)) }); setPickedR({});
    } catch (e) { setRegMsg('Non ci sono riuscito: ' + e.message); }
  };
  return (<div className="screen"><h1 className="h1s">Programmi</h1><p className="sub">I programmi installati, dal più pesante. Rimuovendone uno si apre il suo disinstallatore.</p>
    {!list ? <Rows /> : list.length === 0 ? <Empty title="Nessun programma trovato" text="Non ho trovato programmi installati." /> :
      <ul className="list">{list.map((p) => <li key={p.id}><div className="row"><span className="grow">{p.name}</span>{p.bytes > 0 && <span className="mono">{fmtBytes(p.bytes)}</span>}<Button onClick={() => setTarget(p)}>Rimuovi</Button></div></li>)}</ul>}
    {target && <Modal title={`Rimuovere ${target.name}?`} onClose={() => setTarget(null)} actions={<><Button onClick={() => setTarget(null)}>Annulla</Button>
      <Button variant="primary" onClick={start}>Rimuovi</Button></>}>
      <p className="sub">Si aprirà il disinstallatore di questo programma{target.bytes > 0 ? ` (libera circa ${fmtBytes(target.bytes)})` : ''}: sarà lui a chiederti conferma.</p></Modal>}
    {step?.phase === 'wait' && <Modal title="Disinstallazione avviata" onClose={check} actions={<Button variant="primary" loading={!!step.checking} onClick={check}>{step.checking ? 'Controllo…' : 'Ho finito'}</Button>}>
      <p className="sub">Segui la finestra di {step.p.name}. Quando hai finito, premi "Ho finito": controllo se il programma è stato rimosso.</p></Modal>}
    {step?.phase === 'result' && <Modal title={step.removed ? 'Programma rimosso' : 'Programma ancora installato'} onClose={closeResult}
      actions={<>{step.left?.length > 0 && <Button disabled={!step.left.some((x) => pickedL[x.id])} onClick={moveLeftovers}>Sposta nel Cestino</Button>}{step.regs?.length > 0 && <Button disabled={!step.regs.some((x) => pickedR[x.id])} onClick={delRegs}>{needAdmin ? 'Cancella come amministratore' : 'Cancella voci di registro'}</Button>}
        {step.removed ? <Button variant="primary" onClick={closeResult}>OK</Button> : <><Button onClick={closeResult}>Chiudi</Button><Button variant="primary" onClick={() => setStep({ phase: 'wait', p: step.p })}>OK</Button></>}</>}>
      <p className="sub" role="status">{step.removed ? `${step.p.name} è stato disinstallato.` : `${step.p.name} risulta ancora installato: forse la disinstallazione non è finita o l'hai annullata. Premi OK per tornare indietro e aspettare, oppure Chiudi.`}</p>
      {movedMsg && <Chip tone={/^(Non|Qualcosa)/.test(movedMsg) ? 'warn' : 'ok'}>{movedMsg}</Chip>}
      {step.left?.length > 0 && <><p className="sub">Sono rimaste queste cartelle del programma. Se vuoi, le sposto nel Cestino (puoi ripristinarle).</p>
        <ul className="plain left">{step.left.map((x) => <li key={x.id}><label><input type="checkbox" aria-label={`Seleziona ${x.dir}`} checked={!!pickedL[x.id]} onChange={(e) => setPickedL({ ...pickedL, [x.id]: e.target.checked })} /> <span className="grow">{x.dir}</span> <span className="mono">{fmtBytes(x.bytes)}</span></label></li>)}</ul></>}
      {regMsg && <Chip tone={/^(Non)/.test(regMsg) ? 'warn' : 'ok'}>{regMsg}</Chip>}
      {step.regs?.length > 0 && <><p className="sub">Sono rimaste anche queste voci nel registro di Windows. Le cancello solo se le scegli, e prima salvo una copia (file .reg) che si ripristina con un doppio clic. Per le voci che iniziano con HKLM Windows chiede il permesso di amministratore.</p>
        <ul className="plain left">{step.regs.map((x) => <li key={x.id}><label><input type="checkbox" aria-label={`Seleziona ${x.key}`} checked={!!pickedR[x.id]} onChange={(e) => setPickedR({ ...pickedR, [x.id]: e.target.checked })} /> <span className="grow">{x.key}</span></label></li>)}</ul></>}</Modal>}
  </div>);
}

function MemoryPanel() {
  const bibo = useBibo(); const [apps, setApps, err, load] = useLoad(getMemoryApps); const [busy, setBusy] = useState(null); const [freeing, setFreeing] = useState(false); const [freed, setFreed] = useState(null);
  if (err) return <Err msg={err} retry={load} />;
  return (<section aria-label="Memoria" className="screen" style={{ gap: 12 }}>
    <h2>Memoria (RAM)</h2>
    <p className="sub">I programmi aperti che usano più memoria. Chiudendoli come con la X della finestra, ti verrà chiesto di salvare.</p>
    <div className="actions"><Button variant="primary" loading={freeing} onClick={async () => { setFreeing(true); setFreed(null); try { const r = await freeMemory(); setFreed(r.freedBytes); bibo.act('happy', .5, .7, r.freedBytes > 0 ? `Liberati ${fmtBytes(r.freedBytes)}!` : 'Memoria già a posto'); load(); } catch (e) { bibo.say('Non ci sono riuscito: ' + e.message); } setFreeing(false); }}>Libera memoria</Button>
      {freed !== null && <Chip tone="ok">{freed > 0 ? `${fmtBytes(freed)} liberati` : 'Niente da liberare'}</Chip>}</div>
    <p className="sub">"Libera memoria" non chiude niente e non fa perdere dati: chiede a Windows di tenere in RAM solo il necessario. L'effetto dura finché i programmi non ne chiedono di nuovo.</p>
    {!apps ? <Rows /> : apps.length === 0 ? <Empty title="Niente di pesante aperto" text="La memoria è libera." /> :
      <ul className="list">{apps.map((a) => <li key={a.pid}><div className="row"><span className="grow">{a.title || a.name}<small>{a.name}</small></span><span className="mono">{fmtBytes(a.bytes)}</span>
        <Button loading={busy === a.pid} onClick={async () => { setBusy(a.pid); try { await closeApp(a.pid); bibo.act('happy', .5, .7, 'Chiesto di chiudersi'); setTimeout(load, 1200); } catch (e) { bibo.say('Non ci sono riuscito: ' + e.message); } setBusy(null); }}>Chiudi</Button></div></li>)}</ul>}
  </section>);
}

function LargeFilesInner() {
  const bibo = useBibo(); const [files, setFiles, err, load] = useLoad(getLargeFiles); const [picked, setPicked] = useState({}); const [confirm, setConfirm] = useState(false); const [msg, setMsg] = useState('');
  if (err) return <Err msg={err} retry={load} />;
  const sel = (files || []).filter((f) => picked[f.id]); const bytes = sel.reduce((s, f) => s + f.bytes, 0);
  const age = (iso) => { const m = Math.max(0, Math.round((Date.now() - new Date(iso)) / 2629800000)); return m < 1 ? 'questo mese' : m < 12 ? `${m} mesi fa` : `${Math.floor(m / 12)} anni fa`; };
  return (<div className="screen"><h1 className="h1s">File grandi</h1><p className="sub">I file più pesanti nelle tue cartelle. Vanno nel Cestino, quindi puoi sempre recuperarli.</p>
    {!files ? <Rows /> : files.length === 0 ? <Empty title="Nessun file enorme" text="Non ho trovato file sopra i 100 MB." /> : <>
      <ul className="list">{files.map((f) => <li key={f.id}><label><input type="checkbox" aria-label={`Seleziona ${f.name}`} checked={!!picked[f.id]} onChange={(e) => setPicked({ ...picked, [f.id]: e.target.checked })} />
        <span className="grow">{f.name}<small>{f.dir} · modificato {age(f.modified)}</small></span><span className="mono">{fmtBytes(f.bytes)}</span></label></li>)}</ul>
      <div className="actions"><Button variant="primary" disabled={!sel.length} onClick={() => setConfirm(true)}>Sposta nel Cestino {sel.length ? `(${fmtBytes(bytes)})` : ''}</Button>{msg && <Chip tone="ok">{msg}</Chip>}</div></>}
    {confirm && <Modal title="Spostare nel Cestino?" onClose={() => setConfirm(false)} actions={<><Button onClick={() => setConfirm(false)}>Annulla</Button>
      <Button variant="primary" onClick={async () => { setConfirm(false); const r = await trashLargeFiles(sel.map((f) => f.id)); setMsg(`${fmtBytes(r.freedBytes)} spostati`); setPicked({}); bibo.act('happy', .5, .6, 'Fatto! Sono nel Cestino'); load(); }}>Sposta</Button></>}>
      <p className="sub">{sel.length} file ({fmtBytes(bytes)}):</p><ul className="plain">{sel.map((f) => <li key={f.id}>{f.name}</li>)}</ul></Modal>}
  </div>);
}

function PrivacyInner() {
  const bibo = useBibo(); const [items, , err, load] = useLoad(getPrivacy); const [picked, setPicked] = useState({}); const [res, setRes] = useState(null);
  const [blockers, setBlockers] = useState(null); const [note, setNote] = useState('');
  if (err) return <Err msg={err} retry={load} />;
  const ids = Object.keys(picked).filter((k) => picked[k]);
  const doClean = async () => { const r = await cleanPrivacy(ids); setRes(r); setPicked({}); bibo.act(r.blocked.length ? 'idle' : 'happy', .5, .6, r.blocked.length ? 'Chiudi il browser e riprova' : 'Privacy ripulita!'); load(); };
  const start = async () => { setNote(''); const bl = await findBlockers({ privacy: ids }); if (bl.length) { setBlockers(bl); return; } await doClean(); };
  const closeAndClean = async () => { const bl = blockers; setBlockers(null); const rs = await closeBlockers(bl); setNote(blockersNote(rs)); await doClean(); };
  return (<div className="screen"><h1 className="h1s">Privacy</h1><p className="sub">Cancella cronologia e cookie dei browser. Il browser deve essere chiuso; con i cookie uscirai dai siti. Di Firefox pulisco solo i cookie: la sua cronologia è nello stesso file dei segnalibri e non la tocco.</p>
    {!items ? <Rows /> : items.length === 0 ? <Empty title="Niente da pulire" text="Non ho trovato dati dei browser." /> : <>
      <ul className="list">{items.map((i) => <li key={i.id}><label><input type="checkbox" aria-label={`Seleziona ${i.label}`} checked={!!picked[i.id]} onChange={(e) => setPicked({ ...picked, [i.id]: e.target.checked })} />
        <span className="grow">{i.label}{i.running && <small>{i.windowed === false ? 'Browser ancora attivo in background: chiudilo da Gestione attività (Termina attività) o spegni «Avvio rapido» nelle sue impostazioni' : 'Browser aperto: chiudilo per poter pulire'}</small>}</span><span className="mono">{fmtBytes(i.bytes)}</span></label></li>)}</ul>
      <div className="actions"><Button variant="primary" disabled={!ids.length} onClick={start}>Pulisci selezionati</Button>
        {res && <Chip tone="ok">{fmtBytes(res.freedBytes)} liberati</Chip>}{res?.blocked?.length > 0 && <Chip tone="warn">Chiudi {res.blocked.join(', ')} e riprova</Chip>}</div></>}
    {note && <p className="sub" role="status">{note}</p>}
    {blockers && <BlockersModal blockers={blockers} onCancel={() => setBlockers(null)} onSkip={() => { setBlockers(null); doClean(); }} onClose={closeAndClean} />}
  </div>);
}

function DuplicatesInner() {
  const bibo = useBibo(); const [groups, , err, load] = useLoad(getDuplicates); const [picked, setPicked] = useState({}); const [confirm, setConfirm] = useState(false); const [msg, setMsg] = useState('');
  if (err) return <Err msg={err} retry={load} />;
  const all = (groups || []).flatMap((g) => g.files.filter((f) => !f.keep).map((f) => ({ ...f, bytes: g.bytes })));
  const sel = all.filter((f) => picked[f.id]); const bytes = sel.reduce((s, f) => s + f.bytes, 0);
  return (<div className="screen"><h1 className="h1s">Duplicati</h1><p className="sub">File identici nelle tue cartelle (stesso contenuto, non solo stesso nome). Di ogni gruppo l'originale più vecchio resta sempre: le copie vanno nel Cestino.</p>
    {!groups ? <Rows /> : groups.length === 0 ? <Empty title="Nessun duplicato" text="Non ho trovato file identici sopra 1 MB." /> : <>
      {groups.map((g) => <section key={g.id} className="group" aria-label={`Gruppo ${g.files[0].name}`}><h2 className="h2s">{g.files[0].name} <small>{fmtBytes(g.bytes)} ciascuno</small></h2>
        <ul className="list">{g.files.map((f) => <li key={f.id}>{f.keep
          ? <div className="row"><span className="grow">{f.name}<small>{f.dir}</small></span><Chip tone="ok">Originale: resta qui</Chip></div>
          : <label><input type="checkbox" aria-label={`Seleziona copia ${f.name} in ${f.dir}`} checked={!!picked[f.id]} onChange={(e) => setPicked({ ...picked, [f.id]: e.target.checked })} />
            <span className="grow">{f.name}<small>{f.dir}</small></span><span className="mono">{fmtBytes(g.bytes)}</span></label>}</li>)}</ul></section>)}
      <div className="actions"><Button variant="primary" disabled={!sel.length} onClick={() => setConfirm(true)}>Sposta le copie nel Cestino {sel.length ? `(${fmtBytes(bytes)})` : ''}</Button>{msg && <Chip tone="ok">{msg}</Chip>}</div></>}
    {confirm && <Modal title="Spostare le copie nel Cestino?" onClose={() => setConfirm(false)} actions={<><Button onClick={() => setConfirm(false)}>Annulla</Button>
      <Button variant="primary" onClick={async () => { setConfirm(false); const r = await trashDuplicates(sel.map((f) => f.id)); setMsg(`${fmtBytes(r.freedBytes)} spostati`); setPicked({}); bibo.act('happy', .5, .6, 'Fatto! Le copie sono nel Cestino'); load(); }}>Sposta</Button></>}>
      <p className="sub">{sel.length} copie ({fmtBytes(bytes)}):</p><ul className="plain">{sel.map((f) => <li key={f.id}>{f.name} ({f.dir})</li>)}</ul></Modal>}
  </div>);
}

export function ReminderCard() {
  const [r, setR] = useState(null); const [err, setErr] = useState('');
  useEffect(() => { getReminder().then(setR).catch((e) => setErr(e.message)); }, []);
  const change = (v) => setReminder(v).then(setR).catch((e) => setErr(e.message));
  const opts = [['off', 'Mai'], ['weekly', 'Ogni settimana'], ['monthly', 'Ogni mese']];
  return (<section className="reminder" aria-label="Promemoria"><h2 className="h2s">Promemoria di manutenzione</h2>
    <p className="sub">Una notifica se non fai la messa a punto da un po'. Funziona finché Bibo Tune resta attivo nella barra.</p>
    <div role="radiogroup" aria-label="Frequenza promemoria" className="seg">{opts.map(([v, l]) => <button key={v} role="radio" aria-checked={r?.reminder === v} disabled={!r} className={r?.reminder === v ? 'on' : ''} onClick={() => change(v)}>{l}</button>)}</div>
    {err && <p role="alert" className="sub">{err}</p>}</section>);
}

export function Info() {
  const [theme, setTheme] = useState(getTheme()); const [pal, setPal] = useState(getPalette());
  const [info, setInfo] = useState(null); const [keep, setKeep] = useState(true); const [note, setNote] = useState('');
  useEffect(() => {
    let on = true; const load = () => getAppInfo().then((i) => { if (on) { setInfo(i); setKeep(i.keepInTray); } }).catch(() => {});
    load(); const t = setInterval(() => getAppInfo().then((i) => on && setInfo(i)).catch(() => {}), 5000);
    return () => { on = false; clearInterval(t); };
  }, []);
  const [uiv, setUiv] = useState(null); const [pickV, setPickV] = useState('recent'); const [vmsg, setVmsg] = useState('');
  useEffect(() => { getUiVersion().then((r) => { setUiv(r); setPickV(r.version); }).catch(() => {}); }, []);
  const applyV = async () => { setVmsg(''); try { await setUiVersion(pickV); } catch (e) { setVmsg(e.message); } };
  const pickKeep = async (v) => { setKeep(v); try { await setKeepInTray(v); } catch (e) { setKeep(!v); setNote(e.message); } };
  const test = async () => { setNote(''); try { const r = await testNotification(); setNote(r && r.ok === false ? 'Questo sistema non mostra notifiche.' : 'Notifica inviata: se non la vedi, controlla le notifiche di Windows.'); } catch (e) { setNote(e.message); } };
  return (<div className="screen"><h1 className="h1s">Informazioni</h1><p className="sub">Bibo Tune e le sue preferenze. Ci arrivi anche dal menu dell'icona nella barra, voce Impostazioni.</p>
    <section aria-label="Informazioni sull'app" className="reminder"><h2 className="h2s">Bibo Tune</h2>
      <dl className="facts">
        <div><dt>Versione</dt><dd>{info ? info.version : '…'}</dd></div>
        <div><dt>Processore ora</dt><dd>{info ? `${info.cpu}%` : '…'}</dd></div>
        <div><dt>Memoria ora</dt><dd>{info ? `${info.ram}%` : '…'}</dd></div>
      </dl>
      <p className="sub">Messa a punto del PC con il robot Bibo. Tutto avviene sul tuo computer: Bibo Tune non invia nulla in rete.</p></section>
    <h2 className="h2s sect">Impostazioni</h2>
    <section aria-label="Versione" className="reminder tight"><h2 className="h2s">Versione</h2>
      <p className="sub">Scegli come appare l'app. I tuoi dati e le funzioni di pulizia sono gli stessi in entrambe.</p>
      <div role="radiogroup" aria-label="Versione" className="verchoice">
        {[['recent', `Recente · ${uiv ? uiv.current : info ? info.version : '…'}`, "L'interfaccia di adesso.", ['Barra con i nomi accanto alle icone', 'Benvenuto e riepilogo a riquadri', 'Caos e Mappa del disco']],
          ['classic', `Classica · ${uiv ? uiv.classic : '0.1.27'}`, "Com'era prima del rifacimento.", ['Barra a sole icone', 'Panoramica con le tre schede', 'Elenchi con le caselle, File grandi e Duplicati a parte']]].map(([id, title, sub, pts]) => (
          <button key={id} role="radio" aria-checked={pickV === id} className={'vopt' + (pickV === id ? ' on' : '')} disabled={id === 'classic' && !!uiv && !uiv.classicAvailable} onClick={() => setPickV(id)}>
            <b>{title}</b><small>{sub}</small>{pts.map((t) => <span className="vpt" key={t}>{t}</span>)}</button>))}
      </div>
      <p className="sub tight">Cambiando versione la finestra si riapre. Per tornare: voce <b>Versione recente</b> nel menu dell'icona, oppure <kbd>Ctrl</kbd> + <kbd>Maiusc</kbd> + <kbd>V</kbd>.</p>
      <div className="actions"><Button variant="primary" disabled={!uiv || pickV === uiv.version} onClick={applyV}>Applica e riapri</Button>{vmsg && <Chip tone="bad">{vmsg}</Chip>}</div></section>
    <section aria-label="Tema" className="reminder tight"><h2 className="h2s">Tema</h2>
      <p className="sub">Scegli come appare l'app.</p>
      <div role="radiogroup" aria-label="Tema" className="seg">
        <button role="radio" aria-checked={theme === 'dark'} className={theme === 'dark' ? 'on' : ''} onClick={() => setTheme(applyTheme('dark'))}>Scuro</button>
        <button role="radio" aria-checked={theme === 'light'} className={theme === 'light' ? 'on' : ''} onClick={() => setTheme(applyTheme('light'))}>Chiaro</button>
      </div></section>
    <section aria-label="Palette" className="reminder tight"><h2 className="h2s">Palette</h2>
      <p className="sub">I colori dell'app, in tema scuro e chiaro.</p>
      <div role="radiogroup" aria-label="Palette" className="pal">{PALETTES.map((p) => (
        <button key={p.id} role="radio" aria-checked={pal === p.id} className={pal === p.id ? 'on' : ''} onClick={() => setPal(applyPalette(p.id))}>
          <span className="dots" aria-hidden="true">{p.dots.map((c) => <i key={c} style={{ background: c }} />)}</span>{p.name}</button>))}</div></section>
    <section aria-label="Barra delle applicazioni" className="reminder tight"><h2 className="h2s">Barra delle applicazioni</h2>
      <div className="row"><span className="grow">Resta nella barra quando chiudo la finestra<small>Così controlla CPU e RAM e manda i promemoria.</small></span><Toggle label="Resta nella barra quando chiudo la finestra" checked={keep} onChange={pickKeep} /></div>
      <div className="row"><span className="grow">Notifica di prova<small>Per controllare che Windows mostri le notifiche di Bibo Tune.</small></span><Button onClick={test}>Invia</Button></div>
      {note && <p className="sub" role="status">{note}</p>}</section>
    <section aria-label="Giro guidato" className="reminder tight"><div className="row"><span className="grow">Giro guidato<small>Rivedi dove sta ogni cosa, in mezzo minuto.</small></span><Button onClick={() => window.dispatchEvent(new Event(TOUR_EVENT))}>Rivedi il giro</Button></div></section>
    <ReminderCard />
    {canQuit() && <section aria-label="Chiudi" className="reminder tight"><div className="row"><span className="grow">Esci da Bibo Tune<small>Chiude anche l'icona nella barra.</small></span><Button onClick={() => quitApp()}>Esci</Button></div></section>}
  </div>);
}
