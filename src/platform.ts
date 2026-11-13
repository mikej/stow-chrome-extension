export interface TabInfo {
  url: string;
  title: string;
}

const hasChromeStorage =
  typeof chrome !== "undefined" && !!chrome.storage?.local;
const hasChromeTabs = typeof chrome !== "undefined" && !!chrome.tabs?.query;

export const isExtensionEnvironment = hasChromeStorage || hasChromeTabs;

export async function getActiveTabInfo(): Promise<TabInfo> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return {
    url: tab?.url ?? "",
    title: tab?.title ?? "",
  };
}

export const apiKeyStorage = {
  async get(): Promise<string | undefined> {
    if (hasChromeStorage) {
      const result = (await chrome.storage.local.get("apiKey")) as {
        apiKey?: string;
      };
      return result.apiKey;
    }

    const value = window.localStorage.getItem("apiKey");
    return value ?? undefined;
  },
  async set(apiKey: string): Promise<void> {
    if (hasChromeStorage) {
      await chrome.storage.local.set({ apiKey });
      return;
    }

    window.localStorage.setItem("apiKey", apiKey);
  },
  async clear(): Promise<void> {
    if (hasChromeStorage) {
      await chrome.storage.local.remove("apiKey");
      return;
    }

    window.localStorage.removeItem("apiKey");
  },
};
