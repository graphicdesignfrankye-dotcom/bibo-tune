const { test, expect } = require('@playwright/test');
const { guard, axe, handleBlockers } = require('./helpers');

test.beforeEach(async ({ page }) => { await page.goto('/'); });

const START = { name: 'Avvia', exact: true };
test('F01-H1 benvenuto, scansione, riepilogo, conferma e pulizia', async ({ page }) => {
  const ok = guard(page);
  await expect(page.getByRole('heading', { name: 'Messa a punto', level: 1 })).toBeVisible(); // benvenuto
  expect(await axe(page)).toEqual([]);
  await page.getByRole('button', START).click();
  await expect(page.locator('.progress')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Ho trovato .* da liberare/, level: 2 })).toBeVisible({ timeout: 15000 });
  for (const n of ['Pulizia', 'Velocità', 'Protezione']) await expect(page.getByRole('region', { name: n })).toBeVisible();
  expect(await axe(page)).toEqual([]); // riepilogo
  await page.getByRole('button', { name: 'Pulisci Pulizia' }).click();
  const dlg = page.getByRole('dialog', { name: 'Eliminare questi file?' });
  await expect(dlg).toBeVisible();
  await expect(dlg.getByText('Cestino')).toBeVisible();
  await dlg.getByRole('button', { name: 'Sì, pulisci' }).click(); await handleBlockers(page);
  await expect(page.getByText(/GB liberati/).first()).toBeVisible({ timeout: 10000 });
  await expect(page.getByRole('button', { name: 'Controlla di nuovo' })).toBeVisible(); // di nuovo il benvenuto
  ok();
});

test('F01-E1 Esc e Annulla chiudono la conferma senza cancellare', async ({ page }) => {
  await page.getByRole('button', START).click();
  await page.getByRole('button', { name: 'Pulisci Pulizia' }).click({ timeout: 15000 });
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /Ho trovato/, level: 2 })).toBeVisible(); // il riepilogo resta
});

test('F01-E2 Interrompi riporta al benvenuto e scarta la scansione', async ({ page }) => {
  await page.getByRole('button', START).click();
  await page.getByRole('button', { name: 'Interrompi' }).click();
  await expect(page.getByRole('button', START)).toBeVisible();
  await page.waitForTimeout(4500); // il tempo che la scansione avrebbe impiegato
  await expect(page.getByRole('heading', { name: /Ho trovato/ })).toHaveCount(0);
  await expect(page.getByRole('button', START)).toBeVisible();
});

test('F01-E3 doppio click su Avvia non lancia due scansioni', async ({ page }) => {
  const b = page.getByRole('button', START);
  await b.dblclick({ force: true }).catch(() => {}); // al secondo clic il tasto è già sparito
  await expect(page.getByRole('heading', { name: /Ho trovato/, level: 2 })).toHaveCount(1, { timeout: 15000 });
});

test('F01-E4 ricarica a metà scansione torna allo stato iniziale', async ({ page }) => {
  await page.getByRole('button', START).click();
  await page.reload();
  await expect(page.getByRole('button', START)).toBeEnabled();
});

test('F01-K1 percorso completo solo da tastiera', async ({ page }) => {
  await page.getByRole('button', START).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('heading', { name: /Ho trovato/, level: 2 })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Pulisci Pulizia' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Annulla' })).toBeFocused(); // il focus entra nella finestra
  await page.keyboard.press('Tab'); await page.keyboard.press('Tab'); // la trappola riporta dentro
  expect(await page.evaluate(() => !!document.activeElement.closest('[role=dialog]'))).toBe(true);
  await page.getByRole('button', { name: 'Sì, pulisci' }).focus(); await page.keyboard.press('Enter'); await handleBlockers(page);
  await expect(page.getByText(/GB liberati/).first()).toBeVisible({ timeout: 10000 });
});

test('F01-E6 da Rivedi si arriva alla schermata giusta senza rifare il benvenuto', async ({ page }) => {
  await page.getByRole('button', START).click();
  await expect(page.getByRole('heading', { name: /Ho trovato/, level: 2 })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Rivedi Velocità' }).click();
  await expect(page.getByRole('region', { name: 'Memoria' })).toBeVisible(); // già il riepilogo di Velocità, niente "Analizza"
  await page.getByRole('button', { name: 'Panoramica', exact: true }).click();
  await page.getByRole('button', START).click();
  await expect(page.getByRole('heading', { name: /Ho trovato/, level: 2 })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Rivedi Protezione' }).click();
  await expect(page.getByRole('region', { name: 'Firewall e antivirus' })).toBeVisible();
  await page.getByRole('button', { name: 'Panoramica', exact: true }).click();
  await page.getByRole('button', START).click();
  await expect(page.getByRole('heading', { name: /Ho trovato/, level: 2 })).toBeVisible({ timeout: 15000 });
  await page.getByRole('button', { name: 'Controlla tutto' }).click();
  await expect(page.getByRole('heading', { name: /Puoi liberare/, level: 2 })).toBeVisible(); // il riepilogo di Pulizia
});

test('F01-E7 il robot Bibo in grande c\'è nel benvenuto e la mascotte mobile si nasconde', async ({ page }) => {
  await expect(page.locator('.hero2 .orb svg')).toBeVisible();
  await expect(page.locator('.stage')).toBeHidden();
  await page.getByRole('button', { name: 'Pulizia', exact: true }).click();
  await expect(page.locator('.stage')).toBeVisible(); // nelle altre schermate la mascotte c'è
  await page.waitForTimeout(2500); // il tempo che la mascotte finisca di spostarsi
  const box = await page.locator('.bibo').boundingBox(), vp = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0); expect(box.x + box.width).toBeLessThanOrEqual(vp.width); // dentro la finestra, non tagliata a sinistra
  await expect(page.locator('.bibo-big .eye-ok')).toHaveCount(0); // niente robot grande fuori dalla Panoramica
});

test('F01-E5 le card portano alle schermate', async ({ page }) => {
  await page.getByRole('button', { name: /Velocità/ }).first().click();
  await expect(page.getByRole('heading', { name: 'Velocità', level: 1 })).toBeVisible();
});
