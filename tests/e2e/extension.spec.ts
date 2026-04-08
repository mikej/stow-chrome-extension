import { expect, test } from '@playwright/test';
import { getExtensionId, launchExtensionContext } from './extensionUtils';

test('popup loads in extension context', async () => {
  const isHeadless = process.env.PLAYWRIGHT_HEADLESS === '1';
  test.skip(isHeadless, 'Chrome extensions require headed mode.');

  const context = await launchExtensionContext();
  const extensionId = await getExtensionId(context);

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
