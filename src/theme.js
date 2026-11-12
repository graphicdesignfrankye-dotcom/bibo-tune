// Tema dell'app: 'dark' (predefinito) o 'light'. Si ricorda in localStorage e si applica subito, prima del primo disegno.
const KEY = 'bibo-theme';
export const getTheme = () => { try { return localStorage.getItem(KEY) === 'light' ? 'light' : 'dark'; } catch { return 'dark'; } };
// Palette: 'teal' è quella di base (tokens.css); le altre sono in palettes.css e cambiano solo i colori.
export const PALETTES = [
  { id: 'teal', name: 'Verde-acqua e arancio', dots: ['#2DD4BF', '#FF8A3D', '#67E8F9'] },
  { id: 'viola', name: 'Viola e rosa', dots: ['#7C6BFF', '#FF6FB5', '#3FD8FF'] },
  { id: 'oceano', name: 'Oceano e oro', dots: ['#60A5FA', '#FBBF24', '#7DD3FC'] },
  { id: 'foresta', name: 'Foresta e limone', dots: ['#4ADE80', '#FACC15', '#BEF264'] },
  { id: 'rubino', name: 'Rubino e sabbia', dots: ['#FB7185', '#FDBA74', '#FDE68A'] },
];
const PKEY = 'bibo-palette';
export const getPalette = () => { try { const p = localStorage.getItem(PKEY); return PALETTES.some((x) => x.id === p) ? p : 'teal'; } catch { return 'teal'; } };
// la barra del titolo di Windows prende i colori dai token della palette in uso
function syncBar(theme) {
  try {
    const cs = getComputedStyle(document.documentElement);
    window.bibo?.setTheme?.(theme, { bg: cs.getPropertyValue('--bar-bg').trim(), fg: cs.getPropertyValue('--bar-fg').trim() })?.catch?.(() => {});
  } catch { /* solo la barra del titolo di Windows */ }
}
export function applyTheme(t) {
  const theme = t === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(KEY, theme); } catch { /* senza memoria locale il tema dura solo questa sessione */ }
  syncBar(theme);
  return theme;
}
export function applyPalette(p) {
  const id = PALETTES.some((x) => x.id === p) ? p : 'teal';
  document.documentElement.dataset.palette = id;
  try { localStorage.setItem(PKEY, id); } catch { /* senza memoria locale la palette dura solo questa sessione */ }
  syncBar(document.documentElement.dataset.theme === 'light' ? 'light' : 'dark');
  return id;
}
