import type { TabInfo } from "./platform";

// In dev mode there's no active tab, so the initial details come from optional
// query params, e.g. ?url=https://example.com&title=Example
export function getDevTabInfo(search = window.location.search): TabInfo {
  const params = new URLSearchParams(search);

  return {
    url: params.get("url") ?? "",
    title: params.get("title") ?? "",
  };
}
