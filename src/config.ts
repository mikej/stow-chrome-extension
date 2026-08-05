const DEFAULT_API_BASE_URL = "https://stow.is";

export function getItemsApiUrl() {
  return `${getApiBaseUrl()}/v1/items`;
}

export function getApiBaseUrl() {
  return normalizeApiBaseUrl(import.meta.env.VITE_STOW_API_BASE_URL);
}

export function normalizeApiBaseUrl(value?: string) {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return DEFAULT_API_BASE_URL;
  }

  return trimmedValue.replace(/\/+$/, "");
}
