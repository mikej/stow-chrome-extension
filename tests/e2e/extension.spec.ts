import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, expect, test } from '@playwright/test';

test('popup loads in extension context', async () => {
  const isHeadless = process.env.PLAYWRIGHT_HEADLESS === '1';
  test.skip(isHeadless, 'Chrome extensions require headed mode.');

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const extensionPath = path.resolve(__dirname, '../../dist');

  const context = await chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });

  const extensionsPage = await context.newPage();
  await extensionsPage.goto('chrome://extensions/');

  const extensionId = await extensionsPage.evaluate(() => {
    const manager = document.querySelector('extensions-manager');
    const managerShadow = manager?.shadowRoot;
    const itemList = managerShadow?.querySelector('extensions-item-list');
    const itemListShadow = itemList?.shadowRoot;
    const items = itemListShadow?.querySelectorAll('extensions-item') ?? [];

    for (const item of items) {
      const itemShadow = item.shadowRoot;
      const nameEl = itemShadow?.querySelector('#name');
      const name = nameEl?.textContent?.trim();
      const id =
        item.getAttribute('id') ||
        item.getAttribute('data-extension-id') ||
        (item as HTMLElement).dataset?.id;

      if (name === 'Stow Chrome Extension' && id) {
        return id;
      }
    }

    return null;
  });

  await extensionsPage.close();

  if (!extensionId) {
    throw new Error('Failed to resolve extension ID from chrome://extensions/.');
  }

  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/index.html`);

  await expect(
    page.getByText(/Enter your API key to get started/i)
  ).toBeVisible();
  await expect(page.getByText(/Dev mode: chrome APIs unavailable/i)).toHaveCount(
    0
  );

  await context.close();
});
