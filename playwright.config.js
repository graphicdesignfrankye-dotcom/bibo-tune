const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './e2e', timeout: 40000, retries: 0, reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:5181', storageState: { cookies: [], origins: [{ origin: 'http://127.0.0.1:5181', localStorage: [{ name: 'bibo-tour', value: 'done' }] }] }, screenshot: 'only-on-failure', trace: 'off' },
  webServer: { command: 'npx vite --port 5181 --host 127.0.0.1', url: 'http://127.0.0.1:5181', reuseExistingServer: true },
});
