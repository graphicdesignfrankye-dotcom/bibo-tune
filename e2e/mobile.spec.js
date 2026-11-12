const { test, expect } = require('@playwright/test');
const { guard, axe, handleBlockers, begin, detail } = require('./helpers');
test.use({ viewport: { width: 390, height: 844 } });

for (const nav of ['Panoramica', 'Pulizia', 'Il mio disordine', 'Velocità', 'Protezione', 'Privacy', 'Programmi', 'Aggiornamenti', 'Lente spaziale', 'Impostazioni']) {
  test(`M-${nav}: a 390px niente scroll orizzontale e contenuto visibile`, async ({ page }) => {
    const ok = guard(page); await page.goto('/'); await page.getByRole('button', { name: nav, exact: true }).click();
    await page.waitForTimeout(700);
    const measure = () => page.evaluate(() => ({ doc: document.documentElement.scrollWidth - innerWidth, main: document.querySelector('main').scrollWidth - document.querySelector('main').clientWidth }));
    let over = await measure(); expect(over.doc).toBeLessThanOrEqual(0); expect(over.main).toBeLessThanOrEqual(0);
    expect(await axe(page)).toEqual([]);
    await begin(page, nav); await page.waitForTimeout(700); // dopo il benvenuto, se c'è
    over = await measure(); expect(over.doc).toBeLessThanOrEqual(0); expect(over.main).toBeLessThanOrEqual(0);
    expect(await axe(page)).toEqual([]);
    await detail(page, nav); await page.waitForTimeout(700); // e nel dettaglio, se c'è
    over = await measure(); expect(over.doc).toBeLessThanOrEqual(0); expect(over.main).toBeLessThanOrEqual(0);
    expect(await axe(page)).toEqual([]); ok();
  });
}
test('M-Informazioni: a 390px niente scroll orizzontale e contenuto visibile', async ({ page }) => {
  const ok = guard(page); await page.goto('/#info'); await page.waitForTimeout(700);
  const over = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth - innerWidth, main: document.querySelector('main').scrollWidth - document.querySelector('main').clientWidth }));
  expect(over.doc).toBeLessThanOrEqual(0); expect(over.main).toBeLessThanOrEqual(0);
  expect(await axe(page)).toEqual([]); ok();
});
test('M-flow: scansione e pulizia a 390px', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Avvia', exact: true }).click();
  await page.getByRole('button', { name: 'Pulisci Pulizia' }).scrollIntoViewIfNeeded({ timeout: 15000 });
  await page.getByRole('button', { name: 'Pulisci Pulizia' }).click();
  const dlg = page.getByRole('dialog'); await expect(dlg).toBeVisible();
  const box = await dlg.boundingBox(); expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(390);
  await dlg.getByRole('button', { name: 'Sì, pulisci' }).click(); await handleBlockers(page); await expect(page.getByText(/GB liberati/).first()).toBeVisible({ timeout: 10000 });
});
test('M-testo lungo: nomi di 60 caratteri non rompono la riga', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Programmi', exact: true }).click(); await begin(page, 'Programmi'); await detail(page, 'Programmi');
  await page.locator('.grow').first().waitFor();
  await page.evaluate(() => { document.querySelector('.grow').firstChild.textContent = 'Programma_con_un_nome_incredibilmente_lungo_senza_spazi_1234567890'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
});
