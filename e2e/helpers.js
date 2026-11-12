const AxeBuilder = require('@axe-core/playwright').default;
const { expect } = require('@playwright/test');
/** Ogni test: nessun errore in console e nessuna risposta 5xx. */
exports.guard = (page) => {
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  page.on('pageerror', (e) => errs.push(String(e)));
  page.on('response', (r) => r.status() >= 500 && errs.push(`5xx ${r.url()}`));
  return () => expect(errs, 'errori in console').toEqual([]);
};
exports.axe = async (page) => {
  const r = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
  return r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`);
};

/** Se compare il popup dei programmi aperti, sceglie "Chiudi e pulisci" (nei dati finti Edge e Firefox risultano aperti). */
exports.handleBlockers = async (page) => {
  const b = page.getByRole('button', { name: 'Chiudi e pulisci' });
  try { await b.waitFor({ timeout: 2500 }); await b.click(); } catch { /* nessun popup */ }
};

/** Dopo aver aperto Pulizia, Velocità, Protezione o Programmi si vede il benvenuto: preme il tasto che avvia l'analisi. Le altre schermate non hanno benvenuto. */
exports.begin = async (page, nav) => {
  const label = { Pulizia: 'Scansiona', 'Velocità': 'Analizza', Protezione: 'Controlla', Programmi: 'Scansiona', 'Caos': 'Cerca', Privacy: 'Controlla', Aggiornamenti: 'Controlla', 'Mappa del disco': 'Analizza' }[nav];
  if (label) await page.getByRole('button', { name: label, exact: true }).click();
};

/** Dal riepilogo di Pulizia o Velocità apre il dettaglio. */
exports.detail = async (page, nav) => {
  const label = { Pulizia: 'Controlla tutto', 'Velocità': 'Mostra tutto', Protezione: 'Mostra tutto', Programmi: 'Mostra tutto', 'Caos': 'Rivedi file grandi' }[nav];
  if (label) await page.getByRole('button', { name: label, exact: true }).click();
};
