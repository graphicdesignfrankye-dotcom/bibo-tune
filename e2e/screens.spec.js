const { test, expect } = require('@playwright/test');
const { guard, axe, handleBlockers, begin, detail } = require('./helpers');

const SCREENS = [['Panoramica', 'Messa a punto'], ['Pulizia', 'Pulizia'], ['Velocità', 'Velocità'], ['Protezione', 'Protezione'], ['Programmi', 'Programmi']];
for (const [nav, head] of SCREENS) {
  test(`S-${nav}: si apre, senza errori e senza violazioni WCAG AA`, async ({ page }) => {
    const ok = guard(page); await page.goto('/');
    await page.getByRole('button', { name: nav, exact: true }).click();
    await expect(page.getByRole('heading', { name: head, level: 1 })).toBeVisible();
    expect(await axe(page)).toEqual([]); // benvenuto, se la schermata lo ha
    await begin(page, nav); await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible();
    await expect(page.locator('.skeleton')).toHaveCount(0, { timeout: 5000 });
    expect(await axe(page)).toEqual([]); // riepilogo
    await detail(page, nav); await expect(page.locator('.skeleton')).toHaveCount(0, { timeout: 5000 });
    expect(await axe(page)).toEqual([]); ok();
  });
}

test('S-Pulizia: benvenuto, riepilogo a riquadri, dettaglio a colonne e ritorno', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Pulizia', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Scansiona', exact: true })).toBeVisible();
  await expect(page.getByRole('checkbox')).toHaveCount(0); // nessun elenco prima della scansione
  expect(await axe(page)).toEqual([]);
  await page.getByRole('button', { name: 'Scansiona', exact: true }).click();
  await expect(page.getByRole('heading', { name: /Puoi liberare/ })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Cestino' }).getByRole('button', { name: 'Pulisci Cestino' })).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole('button', { name: 'Rivedi Cache dei browser' }).click(); // il dettaglio si apre sul tipo scelto
  await expect(page.getByRole('region', { name: 'Elementi' }).getByRole('checkbox', { name: /Cache di Google Chrome/ })).toBeVisible();
  await page.getByRole('button', { name: 'Indietro' }).click();
  await expect(page.getByRole('heading', { name: /Puoi liberare/ })).toBeVisible();
  await page.getByRole('button', { name: 'Ricomincia' }).click();
  await expect(page.getByRole('button', { name: 'Scansiona', exact: true })).toBeVisible(); ok();
});
test('S-Pulizia: Pulisci su un riquadro chiede conferma, elimina solo quello e Annulla non tocca nulla', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Pulizia', exact: true }).click(); await page.getByRole('button', { name: 'Scansiona', exact: true }).click();
  const card = page.getByRole('region', { name: 'Cestino' }); await card.getByRole('button', { name: 'Pulisci Cestino' }).click();
  const dlg = page.getByRole('dialog', { name: 'Eliminare questi file?' }); await expect(dlg.getByRole('listitem')).toHaveCount(1);
  await dlg.getByRole('button', { name: 'Annulla' }).click(); await expect(card).toBeVisible();
  await card.getByRole('button', { name: 'Pulisci Cestino' }).click(); await page.getByRole('dialog').getByRole('button', { name: 'Sì, pulisci' }).click();
  await expect(card).toHaveCount(0, { timeout: 8000 }); // sparito solo il Cestino
  await expect(page.getByRole('region', { name: 'Cache dei browser' })).toBeVisible(); ok();
});
test('S-Pulizia: tre colonne, si sceglie un solo elemento, conferma con elenco, gli altri restano', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Pulizia', exact: true }).click(); await page.getByRole('button', { name: 'Scansiona', exact: true }).click(); await page.getByRole('button', { name: 'Controlla tutto' }).click();
  await expect(page.getByRole('navigation', { name: 'Categorie' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Tipi di file' })).toBeVisible();
  const boxes = page.getByRole('region', { name: 'Elementi' }).getByRole('checkbox'); await expect(boxes.first()).toBeVisible();
  const n = await boxes.count(); expect(n).toBe(2); // File temporanei: cartella dell'utente + Temp di Windows
  await expect(page.getByRole('status')).toContainText('elementi selezionati');
  await page.getByRole('button', { name: 'Nessuno' }).click(); // nessuno in questo tipo, gli altri tipi restano spuntati
  await boxes.first().check();
  await page.getByRole('button', { name: 'Pulisci', exact: true }).click();
  const dlg = page.getByRole('dialog'); await expect(dlg).toBeVisible();
  await expect(dlg.getByRole('listitem').filter({ hasText: /^File temporanei di Windows/ })).toHaveCount(1);
  await dlg.getByRole('button', { name: 'Sì, pulisci' }).click();
  const open = page.getByRole('dialog', { name: 'Ci sono programmi aperti' }); // restano spuntati i browser: il popup compare
  await expect(open).toBeVisible(); await open.getByRole('button', { name: 'Pulisci senza chiuderli' }).click();
  await expect(boxes).toHaveCount(n - 1, { timeout: 8000 });
});
test('S-Pulizia: cambiando categoria e tipo cambiano le colonne', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Pulizia', exact: true }).click(); await page.getByRole('button', { name: 'Scansiona', exact: true }).click(); await page.getByRole('button', { name: 'Controlla tutto' }).click();
  const catnav = page.getByRole('navigation', { name: 'Categorie' }); await catnav.getByRole('button', { name: 'Browser' }).click();
  const items = page.getByRole('region', { name: 'Elementi' });
  await expect(items.getByRole('checkbox', { name: /Cache di Google Chrome/ })).toBeVisible();
  await expect(items.getByRole('checkbox', { name: /Cache di Microsoft Edge/ })).toBeVisible();
  await catnav.getByRole('button', { name: 'Cestino' }).click();
  await expect(items.getByRole('checkbox', { name: /Seleziona Cestino/ })).toBeChecked();
});
test('S-Pulizia: senza nessuna voce spuntata il pulsante è disattivato', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Pulizia', exact: true }).click(); await page.getByRole('button', { name: 'Scansiona', exact: true }).click(); await page.getByRole('button', { name: 'Controlla tutto' }).click();
  const cats = page.getByRole('navigation', { name: 'Categorie' }).getByRole('button'); await expect(cats.first()).toBeVisible();
  for (let c = 0; c < await cats.count(); c++) {
    await cats.nth(c).click();
    const types = page.getByRole('region', { name: 'Tipi di file' }).getByRole('button');
    for (let t = 0; t < await types.count(); t++) { await types.nth(t).click(); await page.getByRole('button', { name: 'Nessuno' }).click(); }
  }
  await expect(page.getByRole('button', { name: 'Pulisci', exact: true })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('0 elementi selezionati');
});
test('S-Velocità: riepilogo a riquadri, Libera memoria, Rivedi apre il dettaglio e Indietro torna', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Velocità', exact: true }).click(); await begin(page, 'Velocità');
  await expect(page.getByRole('heading', { name: /l'avvio|rallent/ , level: 2 })).toBeVisible();
  for (const n of ['Memoria', 'Avvio rallentato', "Programmi all'avvio", 'Programmi aperti pesanti']) await expect(page.getByRole('region', { name: n })).toBeVisible();
  await page.getByRole('button', { name: 'Libera memoria' }).click(); await expect(page.getByText(/liberati|Niente da liberare/)).toBeVisible({ timeout: 8000 });
  await page.getByRole('button', { name: "Rivedi programmi all'avvio" }).click();
  await expect(page.getByRole('switch', { name: /Widget meteo/ })).toBeVisible();
  await page.getByRole('button', { name: 'Indietro' }).click();
  await expect(page.getByRole('region', { name: 'Memoria' })).toBeVisible(); ok();
});
test('S-Protezione: riepilogo a riquadri, Vai alla scansione apre la schermata con Defender e Indietro torna', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Protezione', exact: true }).click(); await begin(page, 'Protezione');
  await expect(page.getByRole('heading', { name: /difes/, level: 2 })).toBeVisible();
  for (const n of ['Scansione con Defender', 'Firewall e antivirus', 'Aggiornamenti di sistema']) await expect(page.getByRole('region', { name: n })).toBeVisible();
  await page.getByRole('button', { name: 'Vai alla scansione' }).click();
  await expect(page.getByRole('button', { name: /Scansione rapida con Defender/ })).toBeVisible();
  await page.getByRole('button', { name: 'Indietro' }).click();
  await expect(page.getByRole('region', { name: 'Firewall e antivirus' })).toBeVisible(); ok();
});
test('S-Programmi: riepilogo a riquadri, Rivedi apre l\'elenco con Rimuovi e Indietro torna', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Programmi', exact: true }).click(); await begin(page, 'Programmi');
  await expect(page.getByRole('heading', { name: /Hai \d+ programm/, level: 2 })).toBeVisible();
  for (const n of ['I più pesanti', 'Per liberare spazio', 'Programmi installati', 'Spazio occupato']) await expect(page.getByRole('region', { name: n })).toBeVisible();
  await page.getByRole('button', { name: 'Rivedi i programmi installati' }).click();
  await expect(page.getByRole('button', { name: 'Rimuovi' }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Indietro' }).click();
  await expect(page.getByRole('region', { name: 'Spazio occupato' })).toBeVisible(); ok();
});
test('S-Velocità il toggle cambia stato', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Velocità', exact: true }).click(); await begin(page, 'Velocità'); await detail(page, 'Velocità');
  const t = page.getByRole('switch', { name: /Widget meteo/ }); await expect(t).toBeChecked();
  await t.click(); await expect(t).not.toBeChecked();
});
test('S-Programmi la rimozione chiede conferma e rimuove la riga', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Programmi', exact: true }).click(); await begin(page, 'Programmi'); await detail(page, 'Programmi');
  await page.getByRole('button', { name: 'Rimuovi' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Rimuovi' }).click();
  await expect(page.getByRole('dialog', { name: /Disinstallazione avviata/ })).toBeVisible({ timeout: 5000 });
  await page.getByRole('button', { name: 'Ho finito' }).click();
  await expect(page.getByText('Editor video Pro è stato disinstallato.')).toBeVisible({ timeout: 5000 });
  await expect(page.getByText('Editor video Pro', { exact: true })).toHaveCount(1); // ancora in lista finché non si chiude il popup
  await page.getByRole('button', { name: 'OK' }).click();
  await expect(page.getByText('Editor video Pro')).toHaveCount(0, { timeout: 5000 });
});
test('Bibo non blocca i click: la card sotto di lui resta cliccabile', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => { const b = document.querySelector('.bibo'); b.style.transition = 'none'; b.style.transform = 'translate(300px, 330px)'; });
  const card = page.getByRole('button', { name: /Pulizia/ }).first();
  const box = await card.boundingBox();
  await page.evaluate(([x, y]) => { const b = document.querySelector('.bibo'); b.style.transform = `translate(${x}px, ${y}px)`; }, [box.x + 20, box.y + 20]);
  await card.click({ position: { x: 25, y: 25 } });
  await expect(page.getByRole('heading', { name: 'Pulizia', level: 1 })).toBeVisible();
});
test('Bibo: è decorativo, il fumetto non è un secondo annuncio', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Pulizia', exact: true }).click();
  await expect(page.getByRole('status')).toHaveCount(0); // nessun annuncio finché non succede qualcosa
  await expect(page.getByRole('img', { name: /Bibo/ })).toBeVisible();
  await expect(page.locator('.bibo-bubble')).toHaveAttribute('aria-hidden', 'true');
});
test('Bibo: con "riduci animazioni" resta fermo', async ({ browser }) => {
  const ctx = await browser.newContext({ reducedMotion: 'reduce' }); const p = await ctx.newPage(); await p.goto('http://127.0.0.1:5181/');
  await p.waitForTimeout(1000);
  const t1 = await p.locator('.bibo').evaluate((e) => e.style.transform); await p.waitForTimeout(6500);
  expect(await p.locator('.bibo').evaluate((e) => e.style.transform)).toBe(t1); await ctx.close();
});

test('S-File grandi: selezione, conferma, spostamento nel Cestino', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Caos', exact: true }).click(); await begin(page, 'Caos'); await detail(page, 'Caos');
  await expect(page.getByRole('heading', { name: 'File grandi', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Sposta nel Cestino/ })).toBeDisabled();
  await page.getByRole('checkbox', { name: /backup-telefono/ }).check();
  await page.getByRole('button', { name: /^Sposta nel Cestino/ }).click();
  const d = page.getByRole('dialog'); await expect(d.getByText('backup-telefono.zip')).toBeVisible(); await d.getByRole('button', { name: 'Sposta' }).click();
  await expect(page.getByText('backup-telefono.zip')).toHaveCount(0, { timeout: 5000 });
  expect(await axe(page)).toEqual([]); ok();
});
test('S-Privacy: con il browser aperto compare il popup; senza chiuderlo non si pulisce quel browser', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Privacy', exact: true }).click(); await begin(page, 'Privacy');
  await expect(page.getByText('Browser aperto: chiudilo')).toBeVisible();
  await page.getByRole('checkbox', { name: /Edge: cronologia/ }).check(); await page.getByRole('checkbox', { name: /Chrome: cronologia/ }).check();
  await page.getByRole('button', { name: 'Pulisci selezionati' }).click();
  const dlg = page.getByRole('dialog', { name: 'Ci sono programmi aperti' }); await expect(dlg).toBeVisible();
  await expect(dlg.getByText('Microsoft Edge')).toBeVisible(); await expect(dlg.getByText('Google Chrome')).toHaveCount(0); // Chrome non è aperto
  expect(await axe(page)).toEqual([]);
  await dlg.getByRole('button', { name: 'Annulla' }).click();
  await expect(page.getByText('Google Chrome: cronologia')).toBeVisible(); // annullando non si è pulito nulla
  await page.getByRole('button', { name: 'Pulisci selezionati' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Pulisci senza chiuderli' }).click();
  await expect(page.getByText(/Chiudi Microsoft Edge e riprova/)).toBeVisible();
  await expect(page.getByText('Google Chrome: cronologia')).toHaveCount(0);
  ok();
});
test('S-Privacy: "Chiudi e pulisci" chiude il browser e poi pulisce', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Privacy', exact: true }).click(); await begin(page, 'Privacy');
  await page.getByRole('checkbox', { name: /Edge: cronologia/ }).check();
  await page.getByRole('button', { name: 'Pulisci selezionati' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Chiudi e pulisci' }).click();
  await expect(page.getByText('Microsoft Edge: cronologia')).toHaveCount(0, { timeout: 6000 });
  ok();
});
test('S-Velocità: memoria, chiudere un programma pesante', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Velocità', exact: true }).click(); await begin(page, 'Velocità'); await detail(page, 'Velocità');
  await expect(page.getByRole('heading', { name: 'Memoria (RAM)' })).toBeVisible();
  await page.getByRole('button', { name: 'Chiudi' }).first().click();
  await expect(page.getByText('Browser (24 schede)')).toHaveCount(0, { timeout: 6000 });
  expect(await axe(page)).toEqual([]); ok();
});

test('S-Protezione: scansione rapida con Defender', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Protezione', exact: true }).click(); await begin(page, 'Protezione'); await detail(page, 'Protezione');
  await page.getByRole('button', { name: 'Scansione rapida con Defender' }).click();
  await expect(page.getByText('Nessuna minaccia trovata')).toBeVisible({ timeout: 10000 });
  expect(await axe(page)).toEqual([]); ok();
});
test('S-File grandi e Duplicati: un solo riepilogo a riquadri, Rivedi apre l\'elenco giusto e Indietro torna', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Caos', exact: true }).click(); await begin(page, 'Caos');
  await expect(page.getByRole('heading', { name: /Hai \d+ file da esaminare/, level: 2 })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Duplicati' })).toBeVisible(); await expect(page.getByRole('region', { name: 'File grandi' })).toBeVisible();
  await page.getByRole('button', { name: 'Rivedi file grandi' }).click(); await expect(page.getByRole('heading', { name: 'File grandi', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Indietro' }).click();
  await page.getByRole('button', { name: 'Rivedi duplicati' }).click(); await expect(page.getByRole('heading', { name: 'Duplicati', level: 1 })).toBeVisible();
  await page.getByRole('button', { name: 'Indietro' }).click(); await expect(page.getByRole('region', { name: 'File grandi' })).toBeVisible(); ok();
});
test('S-Mappa del disco: cliccando una cartella (elenco o bolla) si apre il suo contenuto e si torna indietro', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Mappa del disco', exact: true }).click(); await begin(page, 'Mappa del disco');
  await expect(page.getByRole('img', { name: /Mappa a bolle/ })).toBeVisible();
  await page.getByRole('button', { name: /^Apri Dati delle app/ }).click(); // dall'elenco
  await expect(page.getByRole('navigation', { name: 'Percorso' }).getByText('Dati delle app')).toBeVisible();
  await expect(page.getByRole('button', { name: /^Apri Chrome/ })).toBeVisible();
  await expect(page.getByRole('img', { name: /Mappa a bolle: .*Chrome/ })).toBeVisible(); // le bolle mostrano il contenuto della cartella aperta
  await expect(page.getByRole('img', { name: /Mappa a bolle: .*Video/ })).toHaveCount(0);
  const bar = await page.getByRole('navigation', { name: 'Percorso' }).boundingBox(); expect(bar.height).toBeLessThan(80); // una riga sola: non deve prendere gli stili della barra laterale
  await page.getByRole('button', { name: /^Apri Chrome/ }).click(); // secondo livello
  await expect(page.getByRole('navigation', { name: 'Percorso' }).getByText('Chrome')).toBeVisible();
  expect(await axe(page)).toEqual([]);
  await page.getByRole('button', { name: 'Indietro' }).click(); await page.getByRole('button', { name: 'Indietro' }).click();
  await expect(page.getByRole('button', { name: /^Apri Video/ })).toBeVisible(); // di nuovo il primo livello
  await page.locator('.bub').first().click(); // dalla bolla più grande
  await expect(page.getByRole('navigation', { name: 'Percorso' }).getByText('Dati delle app')).toBeVisible();
  await page.getByRole('button', { name: 'Questo PC' }).click(); await expect(page.getByRole('button', { name: /^Apri Video/ })).toBeVisible(); ok();
});
test('S-Spazio: dischi e cartelle, sola lettura', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Mappa del disco', exact: true }).click(); await begin(page, 'Mappa del disco');
  await expect(page.getByRole('heading', { name: 'Disco C:' })).toBeVisible();
  await expect(page.getByRole('group', { name: /Disco C: .* usati su .*, \d+%/ })).toBeVisible(); // ciambella con testo equivalente
  await expect(page.getByText('Quasi pieno')).toHaveCount(1); // solo E: è sopra il 90%
  await expect(page.getByRole('region', { name: 'Le tue cartelle' }).getByText('Download', { exact: true })).toBeVisible(); // nell'elenco; la bolla ripete lo stesso nome
  await expect(page.getByRole('button', { name: /elimina|pulisci/i })).toHaveCount(0);
  expect(await axe(page)).toEqual([]); ok();
});
test('S-Aggiornamenti: aggiorna un programma', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Aggiornamenti', exact: true }).click(); await begin(page, 'Aggiornamenti');
  await page.getByRole('button', { name: 'Aggiorna', exact: true }).first().click();
  await expect(page.getByRole('listitem')).toHaveCount(2, { timeout: 6000 });
  expect(await axe(page)).toEqual([]); ok();
});

test('S-Duplicati: l\'originale non si può selezionare, le copie vanno nel Cestino con conferma', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Caos', exact: true }).click(); await begin(page, 'Caos'); await page.getByRole('button', { name: 'Rivedi duplicati' }).click();
  await expect(page.getByText('Originale: resta qui')).toHaveCount(2);
  await expect(page.getByRole('checkbox')).toHaveCount(3); // 1 + 2 copie, mai gli originali
  expect(await axe(page)).toEqual([]);
  await page.getByRole('checkbox', { name: /copia vacanza-2024/ }).check();
  await page.getByRole('button', { name: /Sposta le copie nel Cestino/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Sposta', exact: true }).click();
  await expect(page.getByText('Originale: resta qui')).toHaveCount(1, { timeout: 6000 });
  ok();
});
test('S-Versione: due carte, la classica si seleziona e si applica, si apre l\'interfaccia 0.1.27', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Impostazioni', exact: true }).click();
  const grp = page.getByRole('radiogroup', { name: 'Versione' }); await expect(grp).toBeVisible();
  const recent = grp.getByRole('radio', { name: /^Recente · / }), classic = grp.getByRole('radio', { name: /^Classica · 0\.1\.27/ });
  await expect(recent).toHaveAttribute('aria-checked', 'true'); await expect(classic).toHaveAttribute('aria-checked', 'false');
  const apply = page.getByRole('button', { name: 'Applica e riapri' }); await expect(apply).toBeDisabled(); // già in uso: niente da applicare
  await expect(page.getByText('Ctrl', { exact: true })).toBeVisible(); // il ritorno è spiegato
  await classic.click(); await expect(classic).toHaveAttribute('aria-checked', 'true'); await expect(apply).toBeEnabled();
  expect(await axe(page)).toEqual([]);
  await apply.click(); await page.waitForURL(/\/classic\/index\.html/);
  // interfaccia classica: barra a sole icone, voci a parte, nessun benvenuto
  const nav = page.getByRole('navigation', { name: 'Principale' }); await expect(nav).toBeVisible();
  for (const n of ['Panoramica', 'Pulizia', 'File grandi', 'Duplicati', 'Cestino', 'Spazio']) await expect(nav.getByRole('button', { name: n, exact: true })).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Caos' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Avvia messa a punto' })).toBeVisible(); // la Panoramica di allora
  await nav.getByRole('button', { name: 'Pulizia', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Pulizia', level: 1 })).toBeVisible();
  await expect(page.getByRole('checkbox').first()).toBeVisible(); // elenco piatto con le caselle, niente benvenuto
  await page.getByRole('button', { name: 'Torna alla versione recente' }).click(); // il ritorno sta dentro la finestra
  await expect(page.getByRole('heading', { name: 'Messa a punto', level: 1 })).toBeVisible(); await expect(page).not.toHaveURL(/classic/);
  ok();
});
test('S-Versione: dalla classica si torna alla recente anche con Ctrl+Maiusc+V (nel browser)', async ({ page }) => {
  const ok = guard(page); await page.goto('/classic/index.html'); await expect(page.getByRole('button', { name: 'Avvia messa a punto' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Torna alla versione recente' })).toBeVisible();
  await page.keyboard.press('Control+Shift+V');
  await expect(page.getByRole('heading', { name: 'Messa a punto', level: 1 })).toBeVisible(); await expect(page).not.toHaveURL(/classic/); ok();
});
test('S-Versione: nella classica la voce Versione sta in Impostazioni e riporta alla recente', async ({ page }) => {
  const ok = guard(page); await page.goto('/classic/index.html');
  await page.getByRole('navigation', { name: 'Principale' }).getByRole('button', { name: 'Impostazioni', exact: true }).click();
  const sec = page.getByRole('region', { name: 'Versione' }); await expect(sec).toBeVisible();
  const grp = sec.getByRole('radiogroup', { name: 'Versione' });
  const recent = grp.getByRole('radio', { name: /^Recente/ }), classic = grp.getByRole('radio', { name: /^Classica · 0\.1\.27/ });
  await expect(classic).toHaveAttribute('aria-checked', 'true'); await expect(recent).toHaveAttribute('aria-checked', 'false');
  const apply = sec.getByRole('button', { name: 'Applica e riapri' }); await expect(apply).toBeDisabled(); // la classica è già in uso
  await page.getByRole('radio', { name: 'Chiaro' }).click(); // un cambio di tema ridisegna la pagina: la voce deve restare
  await expect(page.getByRole('region', { name: 'Versione' })).toBeVisible();
  await page.getByRole('region', { name: 'Versione' }).getByRole('radio', { name: /^Recente/ }).click();
  await expect(page.getByRole('region', { name: 'Versione' }).getByRole('button', { name: 'Applica e riapri' })).toBeEnabled();
  await page.getByRole('region', { name: 'Versione' }).getByRole('button', { name: 'Applica e riapri' }).click();
  await expect(page.getByRole('heading', { name: 'Messa a punto', level: 1 })).toBeVisible(); await expect(page).not.toHaveURL(/classic/); ok();
});
test('S-Versione: tornando all\'indirizzo normale si vede ancora la versione recente', async ({ page }) => {
  const ok = guard(page); await page.goto('/classic/index.html'); await expect(page.getByRole('button', { name: 'Avvia messa a punto' })).toBeVisible();
  await page.goto('/'); await expect(page.getByRole('heading', { name: 'Messa a punto', level: 1 })).toBeVisible(); ok();
});
test('S-Promemoria: si sceglie la frequenza da Impostazioni', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Impostazioni', exact: true }).click();
  const weekly = page.getByRole('radio', { name: 'Ogni settimana' });
  await expect(weekly).toBeEnabled(); await weekly.click();
  await expect(weekly).toHaveAttribute('aria-checked', 'true');
  expect(await axe(page)).toEqual([]); ok();
});
test('S-Barra: Impostazioni sta in fondo, staccata dalle altre voci', async ({ page }) => {
  await page.goto('/'); const items = page.getByRole('navigation', { name: 'Principale' }).getByRole('button');
  const n = await items.count(); expect(await items.nth(n - 1).getAttribute('aria-label')).toBe('Impostazioni');
  const last = await items.nth(n - 1).boundingBox(), prev = await items.nth(n - 2).boundingBox();
  expect(last.y - (prev.y + prev.height)).toBeGreaterThanOrEqual(40); // distanza dalla voce precedente
  const nav = await page.getByRole('navigation', { name: 'Principale' }).boundingBox(); expect(last.y + last.height).toBeGreaterThan(nav.y + nav.height - 40); // in fondo
});

test('S-Programmi: dopo la disinstallazione si propongono gli avanzi e vanno nel Cestino solo se scelti', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Programmi', exact: true }).click(); await begin(page, 'Programmi'); await detail(page, 'Programmi');
  await page.getByRole('button', { name: 'Rimuovi' }).first().click();
  await page.getByRole('dialog').getByRole('button', { name: 'Rimuovi' }).click();
  await page.getByRole('button', { name: 'Ho finito' }).click();
  await expect(page.getByText('è stato disinstallato.')).toBeVisible({ timeout: 5000 });
  const boxes = page.getByRole('dialog').getByRole('checkbox'); await expect(boxes).toHaveCount(4); // 2 cartelle + 2 voci di registro
  await expect(boxes.first()).not.toBeChecked(); // di default non si sposta nulla
  await expect(page.getByRole('button', { name: 'Sposta nel Cestino' })).toBeDisabled();
  await boxes.first().check(); await page.getByRole('button', { name: 'Sposta nel Cestino' }).click();
  await expect(page.getByText(/spostati nel Cestino/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('dialog').getByRole('checkbox')).toHaveCount(3);
  await expect(page.getByRole('button', { name: 'Cancella voci di registro' })).toBeDisabled();
  await page.getByRole('checkbox', { name: /^Seleziona HKLM/ }).check(); await expect(page.getByRole('button', { name: 'Cancella come amministratore' })).toBeEnabled(); await page.getByRole('checkbox', { name: /^Seleziona HKLM/ }).uncheck();
  await page.getByRole('checkbox', { name: /^Seleziona HKCU/ }).check(); await page.getByRole('button', { name: 'Cancella voci di registro' }).click();
  await expect(page.getByText(/voce cancellata/)).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole('dialog').getByRole('checkbox')).toHaveCount(2);
  expect(await axe(page)).toEqual([]); ok();
});
test('S-Velocità: Libera memoria mostra quanto è stato liberato', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Velocità', exact: true }).click(); await begin(page, 'Velocità'); await detail(page, 'Velocità');
  await page.getByRole('button', { name: 'Libera memoria' }).click();
  await expect(page.getByText(/liberati/)).toBeVisible({ timeout: 6000 });
  ok();
});

test('S-Ripristino: la casella è spenta di default e con il punto di ripristino la pulizia procede', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Pulizia', exact: true }).click(); await page.getByRole('button', { name: 'Scansiona', exact: true }).click(); await page.getByRole('button', { name: 'Controlla tutto' }).click();
  await expect(page.getByRole('checkbox').first()).toBeVisible();
  await page.getByRole('button', { name: /^Pulisci/ }).click();
  const box = page.getByRole('dialog').getByRole('checkbox', { name: /punto di ripristino/ });
  await expect(box).not.toBeChecked();
  await box.check(); expect(await axe(page)).toEqual([]);
  await page.getByRole('dialog').getByRole('button', { name: 'Sì, pulisci' }).click(); await handleBlockers(page);
  await expect(page.getByText('Tutto pulito')).toBeVisible({ timeout: 10000 });
  ok();
});
test('S-Privacy: Firefox compare con i cookie e senza cronologia', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Privacy', exact: true }).click(); await begin(page, 'Privacy');
  await expect(page.getByText('Mozilla Firefox: cookie (esce dai siti)')).toBeVisible();
  await expect(page.getByText('Mozilla Firefox: cronologia')).toHaveCount(0);
  ok();
});


test('S-Pulizia: il popup dei programmi aperti compare con la cache dei browser e Annulla non pulisce', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Pulizia', exact: true }).click(); await page.getByRole('button', { name: 'Scansiona', exact: true }).click(); await page.getByRole('button', { name: 'Controlla tutto' }).click();
  await expect(page.getByRole('checkbox').first()).toBeVisible();
  await page.getByRole('button', { name: 'Pulisci', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Sì, pulisci' }).click();
  const dlg = page.getByRole('dialog', { name: 'Ci sono programmi aperti' }); await expect(dlg).toBeVisible();
  await expect(dlg.getByText('Mozilla Firefox')).toHaveCount(0); // la cache riguarda solo Chrome ed Edge
  await expect(dlg.getByText('Microsoft Edge')).toBeVisible();
  await dlg.getByRole('button', { name: 'Annulla' }).click();
  await expect(page.getByRole('checkbox').first()).toBeVisible(); // nulla è stato pulito
  ok();
});
test('S-Informazioni: versione, tema Scuro e Chiaro, cinque palette (Impostazioni sta qui)', async ({ page }) => {
  const ok = guard(page); await page.goto('/');
  await page.getByRole('button', { name: 'Impostazioni', exact: true }).click(); // la voce sta nel menu laterale e apre Informazioni
  await expect(page.getByRole('heading', { name: 'Informazioni', level: 1 })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Impostazioni', level: 2 })).toBeVisible();
  await expect(page.locator('dt', { hasText: 'Versione' })).toBeVisible(); // la riga con la versione dell'app (la sezione Versione ha un titolo a parte)
  await expect(page.getByRole('radio', { name: 'Scuro' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio', { name: /Verde-acqua e arancio/ })).toHaveAttribute('aria-checked', 'true');
  await expect(page.getByRole('radio')).toHaveCount(2 + 5 + 3 + 2); // tema, palette, le tre frequenze del promemoria e le due versioni
  await page.getByRole('radio', { name: /Oceano e oro/ }).click();
  await expect(page.locator('html')).toHaveAttribute('data-palette', 'oceano');
  await page.getByRole('radio', { name: 'Chiaro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.reload(); // si ricordano tema e palette
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light'); await expect(page.locator('html')).toHaveAttribute('data-palette', 'oceano');
  await page.getByRole('button', { name: 'Impostazioni', exact: true }).click();
  await page.getByRole('radio', { name: /Verde-acqua e arancio/ }).click(); await page.getByRole('radio', { name: 'Scuro' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  ok();
});
test('S-Palette: ogni palette, scura e chiara, senza violazioni di contrasto WCAG AA', async ({ page }) => {
  test.setTimeout(240000);
  for (const pal of ['teal', 'viola', 'oceano', 'foresta', 'rubino']) for (const th of ['dark', 'light']) {
    await page.addInitScript(([p, t]) => { localStorage.setItem('bibo-palette', p); localStorage.setItem('bibo-theme', t); }, [pal, th]);
    await page.goto('/#info'); await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-palette', pal);
    expect(await axe(page), `Informazioni ${pal}/${th}`).toEqual([]);
    for (const nav of ['Panoramica', 'Pulizia', 'Mappa del disco']) { await page.getByRole('button', { name: nav, exact: true }).click(); await page.waitForTimeout(900); expect(await axe(page), `${nav} ${pal}/${th}`).toEqual([]); }
  }
});
test('S-Tema chiaro: tutte le schermate senza violazioni di contrasto WCAG AA', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bibo-theme', 'light'));
  await page.goto('/'); await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  for (const nav of ['Panoramica', 'Pulizia', 'Caos', 'Velocità', 'Protezione', 'Privacy', 'Programmi', 'Aggiornamenti', 'Mappa del disco', 'Impostazioni']) {
    await page.getByRole('button', { name: nav, exact: true }).click(); await page.waitForTimeout(900);
    expect(await axe(page), `contrasto nel tema chiaro: ${nav}`).toEqual([]);
    await begin(page, nav); await page.waitForTimeout(600); expect(await axe(page), `contrasto nel tema chiaro dopo l'avvio: ${nav}`).toEqual([]);
    await detail(page, nav); await page.waitForTimeout(600); expect(await axe(page), `contrasto nel tema chiaro nel dettaglio: ${nav}`).toEqual([]);
  }
  await page.goto('/#info'); await page.reload(); expect(await axe(page), 'contrasto nel tema chiaro: Informazioni').toEqual([]);
});

test('Tasto Indietro uguale ovunque: sopra il titolo, con Esc e Alt+Freccia sinistra', async ({ page }) => {
  const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: 'Velocità', exact: true }).click(); await begin(page, 'Velocità');
  for (const key of ['Escape', 'Alt+ArrowLeft']) {
    await page.getByRole('button', { name: "Rivedi programmi all'avvio" }).click();
    const back = page.getByRole('button', { name: 'Indietro' });
    await expect(back).toHaveClass(/backpill/);
    const [b, h] = await Promise.all([back.boundingBox(), page.getByRole('heading', { level: 1 }).boundingBox()]);
    expect(b.y).toBeLessThan(h.y);
    await page.keyboard.press(key);
    await expect(page.getByRole('region', { name: 'Memoria' })).toBeVisible();
  }
  ok();
});

test.describe('Giro guidato al primo avvio', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test('compare al primo avvio, si scorre con Avanti e con "Non visualizzare di nuovo" non torna più', async ({ page }) => {
    const ok = guard(page); await page.goto('/');
    const tour = page.getByRole('dialog', { name: 'Ciao, sono Bibo!' }); await expect(tour).toBeVisible();
    await expect(tour.getByRole('checkbox', { name: 'Non visualizzare di nuovo' })).toBeChecked();
    expect(await axe(page)).toEqual([]);
    const inside = async () => { const d = await page.getByRole('dialog').boundingBox(); for (const b of await page.getByRole('dialog').getByRole('button').all()) { const r = await b.boundingBox(); expect(r.x).toBeGreaterThanOrEqual(d.x); expect(r.x + r.width).toBeLessThanOrEqual(d.x + d.width - 8); } };
    await inside(); // i tasti stanno dentro il riquadro
    await tour.getByRole('button', { name: 'Iniziamo' }).click(); await inside();
    const t2 = page.getByRole('dialog', { name: 'Messa a punto' }); await expect(t2).toBeVisible(); await expect(t2.getByText('Passo 2 di 8')).toBeVisible();
    await t2.getByRole('button', { name: 'Indietro' }).click(); await expect(page.getByRole('dialog', { name: 'Ciao, sono Bibo!' })).toBeVisible();
    for (let n = 0; n < 7; n++) await page.getByRole('button', { name: /^(Iniziamo|Avanti)$/ }).click();
    await expect(page.getByRole('dialog', { name: 'Impostazioni' })).toBeVisible();
    await page.getByRole('button', { name: 'Inizia' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.reload(); await expect(page.getByRole('heading', { name: 'Messa a punto', level: 1 })).toBeVisible(); await expect(page.getByRole('dialog')).toHaveCount(0);
    ok();
  });
  test('Salta con la casella tolta lo ripropone; si può rivedere da Impostazioni', async ({ page }) => {
    const ok = guard(page); await page.goto('/');
    const tour = page.getByRole('dialog', { name: 'Ciao, sono Bibo!' }); await tour.getByRole('checkbox', { name: 'Non visualizzare di nuovo' }).uncheck();
    await tour.getByRole('button', { name: 'Salta' }).click(); await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.reload(); await expect(page.getByRole('dialog', { name: 'Ciao, sono Bibo!' })).toBeVisible();
    await page.getByRole('button', { name: 'Salta' }).click(); // casella spuntata: non torna più
    await page.reload(); await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByRole('button', { name: 'Impostazioni', exact: true }).click();
    await page.getByRole('button', { name: 'Rivedi il giro' }).click(); await expect(page.getByRole('dialog', { name: 'Ciao, sono Bibo!' })).toBeVisible();
    await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toHaveCount(0); ok();
  });
});
