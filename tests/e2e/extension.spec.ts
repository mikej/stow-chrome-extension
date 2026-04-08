import { expect, test } from '@playwright/test';
import {
  createExtensionTest,
  ExtensionTest
} from './extensionUtils';

const extensionTest: ExtensionTest = createExtensionTest(test);

extensionTest('popup loads in extension context', async ({ extensionPage }) => {
  await expect(
    extensionPage.getByText(/Enter your API key to get started/i)
  ).toBeVisible();
  await expect(
    extensionPage.getByText(/Dev mode: chrome APIs unavailable/i)
  ).toHaveCount(0);
});
