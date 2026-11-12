import React, { useEffect, useState } from 'react';
import { Home, Sparkles, Zap, ShieldCheck, LayoutGrid, Folder, EyeOff, PieChart, Download, Settings as SettingsIcon } from 'lucide-react';
import { BiboProvider } from './components/Bibo.jsx';
import Overview from './screens/Overview.jsx';
import { Clean, Speed, Protection, Programs, Disordine, Privacy, Disk, Updates, Info } from './screens/Others.jsx';

const NAV = [
  { id: 'home', label: 'Panoramica', icon: Home },
  { id: 'pulizia', label: 'Pulizia', icon: Sparkles },
  { id: 'velocita', label: 'Velocità', icon: Zap },
  { id: 'protezione', label: 'Protezione', icon: ShieldCheck },
  { id: 'privacy', label: 'Privacy', icon: EyeOff },
  { id: 'programmi', label: 'Programmi', icon: LayoutGrid },
  { id: 'aggiornamenti', label: 'Aggiornamenti', icon: Download },
  { id: 'disordine', label: 'Caos', icon: Folder },
  { id: 'spazio', label: 'Mappa del disco', icon: PieChart },
  { id: 'info', label: 'Impostazioni', icon: SettingsIcon }, // apre Informazioni, dove stanno le impostazioni
];

export default function App() {
  // 'info' (Informazioni e Impostazioni) si apre dal menu laterale, dal menu dell'icona nella barra o da #info.
  const START = typeof location !== 'undefined' && location.hash === '#info' ? 'info' : 'home';
  const [page, setPage] = useState(START);
  useEffect(() => window.bibo?.onNav?.((id) => { if (id === 'info') setPage('info'); }), []);
  useEffect(() => { const h = () => { if (location.hash === '#info') setPage('info'); }; window.addEventListener('hashchange', h); return () => window.removeEventListener('hashchange', h); }, []);
  const View = { home: () => <Overview go={setPage} />, pulizia: Clean, disordine: Disordine, spazio: Disk, aggiornamenti: Updates, privacy: Privacy, velocita: Speed, protezione: Protection, programmi: Programs, info: Info }[page];
  const navBtn = ({ id, label, icon: I }) => (
    <button key={id} aria-current={page === id ? 'page' : undefined} aria-label={label} title={label} onClick={() => setPage(id)}><I size={22} aria-hidden="true" /><span className="navlabel">{label}</span></button>);
  return (
    <BiboProvider>
      <div className="app">
        <div className="drag" />
        <nav aria-label="Principale">
          {NAV.filter((n) => n.id !== 'info').map(navBtn)}
          <div className="navgap" aria-hidden="true" />
          {navBtn(NAV.find((n) => n.id === 'info'))}
        </nav>
        <main key={page} tabIndex={0} aria-label="Contenuto"><View /></main>
      </div>
    </BiboProvider>
  );
}
