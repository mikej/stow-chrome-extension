import path from 'path';
import { fileURLToPath } from 'url';
import { chromium, type BrowserContext } from '@playwright/test';

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
