import { describe, expect, it } from "vitest";
import { findLinkAtColumn } from "./link-detection";

describe("findLinkAtColumn", () => {
  it("finds a bare https URL and its exact column span", () => {
    const row = "see https://example.com/path for details";
    // Verified by running the regex, not counted by hand: "see " is 4 chars
    // (indices 0-3) and the URL is 24 chars, so the span is [4, 27].
    expect(findLinkAtColumn(row, 10)).toEqual({
      url: "https://example.com/path",
      start: 4,
      end: 27,
    });
  });

  it("returns null when the column falls outside any URL", () => {
    const row = "see https://example.com/path for details";
    expect(findLinkAtColumn(row, 2)).toBeNull();
    expect(findLinkAtColumn(row, 35)).toBeNull();
  });

  it("returns null when the row has no URL at all", () => {
    expect(findLinkAtColumn("just plain text here", 5)).toBeNull();
  });

  it("trims trailing punctuation that is not part of the URL", () => {
    expect(findLinkAtColumn("check (https://example.com/x).", 10)?.url).toBe(
      "https://example.com/x",
    );
  });

  it("matches http as well as https", () => {
    expect(findLinkAtColumn("http://example.com works too", 3)?.url).toBe("http://example.com");
  });

  it("picks the correct one of two URLs on the same line", () => {
    const row = "first https://a.example.com then https://b.example.com";
    expect(findLinkAtColumn(row, 8)?.url).toBe("https://a.example.com");
    expect(findLinkAtColumn(row, 40)?.url).toBe("https://b.example.com");
  });
});
