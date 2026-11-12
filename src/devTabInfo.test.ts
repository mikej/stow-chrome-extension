import { getDevTabInfo } from "./devTabInfo";

describe("getDevTabInfo", () => {
  it("reads the url and title from query params", () => {
    expect(
      getDevTabInfo("?url=https%3A%2F%2Fexample.com&title=Example%20page"),
    ).toEqual({ url: "https://example.com", title: "Example page" });
  });

  it("defaults to empty values", () => {
    expect(getDevTabInfo("")).toEqual({ url: "", title: "" });
  });
});
