import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, type BrowserContext, type Page, type TestType } from '@playwright/test';

export const EXTENSION_NAME = 'Stow Chrome Extension';

export function getExtensionPath() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(__dirname, '../../dist');
}

export async function launchExtensionContext() {
  const extensionPath = getExtensionPath();

  return chromium.launchPersistentContext('', {
    headless: false,
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });
}

export type BaseTest = TestType<object>;

export function skipIfHeadless(test: BaseTest) {
  const isHeadless = process.env.PLAYWRIGHT_HEADLESS === '1';
  test.skip(isHeadless, 'Chrome extensions require headed mode.');
}

export async function withExtensionContext(
  fn: (context: BrowserContext) => Promise<void>
) {
  const context = await launchExtensionContext();
  try {
    await fn(context);
  } finally {
    await context.close();
  }
}

export async function withExtensionPage(
  fn: (page: Awaited<ReturnType<typeof openExtensionPage>>) => Promise<void>,
  pagePath = 'index.html',
  extensionName = EXTENSION_NAME
) {
  await withExtensionContext(async (context) => {
    const page = await openExtensionPage(context, pagePath, extensionName);
    await fn(page);
  });
}

export type ExtensionTest = TestType<{ extensionPage: Page }>;

export function createExtensionTest(baseTest: BaseTest): ExtensionTest {
  return baseTest.extend<{ extensionPage: Page }>({
    extensionPage: async (_fixtures, use, testInfo) => {
      if (process.env.PLAYWRIGHT_HEADLESS === '1') {
        testInfo.skip('Chrome extensions require headed mode.');
      }

      await withExtensionPage(async (page) => {
        await use(page);
      });
    }
  });
}

export async function getExtensionId(
  context: BrowserContext,
  extensionName = EXTENSION_NAME
) {
  const extensionsPage = await context.newPage();
  await extensionsPage.goto('chrome://extensions/');

  const extensionId = await extensionsPage.evaluate((targetName) => {
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

      if (name === targetName && id) {
        return id;
      }
    }

    return null;
  }, extensionName);

  await extensionsPage.close();

  if (!extensionId) {
    throw new Error('Failed to resolve extension ID from chrome://extensions/.');
  }

  return extensionId;
}

export async function openExtensionPage(
  context: BrowserContext,
  pagePath = 'index.html',
  extensionName = EXTENSION_NAME
) {
  const extensionId = await getExtensionId(context, extensionName);
  const normalizedPath = pagePath.replace(/^\/+/, '');
  const page = await context.newPage();
  await page.goto(`chrome-extension://${extensionId}/${normalizedPath}`);
  return page;
}
