import { getMeApiUrl, normalizeApiBaseUrl } from "./config";

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
