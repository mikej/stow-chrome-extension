import {
  getCheckItemApiUrl,
  getItemApiUrl,
  getMeApiUrl,
  normalizeApiBaseUrl,
} from "./config";

describe("normalizeApiBaseUrl", () => {
  it("uses the production URL by default", () => {
    expect(normalizeApiBaseUrl()).toBe("https://stow.is");
    expect(normalizeApiBaseUrl("")).toBe("https://stow.is");
    expect(normalizeApiBaseUrl("   ")).toBe("https://stow.is");
  });

  it("trims whitespace and trailing slashes from custom URLs", () => {
    expect(normalizeApiBaseUrl(" http://localhost:3000/// ")).toBe(
      "http://localhost:3000",
    );
  });
});

describe("getMeApiUrl", () => {
  it("uses the configured base URL", () => {
    expect(getMeApiUrl()).toBe("https://stow.is/v1/me");
  });
});

describe("item API URLs", () => {
  it("builds the check and item URLs from the configured base URL", () => {
    expect(getCheckItemApiUrl()).toBe("https://stow.is/v1/items/check");
    expect(getItemApiUrl(42)).toBe("https://stow.is/v1/items/42");
  });
});
