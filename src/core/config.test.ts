import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { resolveAlacrittyToml } from "./config";
import { loadEngine } from "./wasm";
import type { TerminalOptions, TerminalPalette } from "./types";

const FIXTURES = join(import.meta.dirname, "..", "..", "fixtures");

function read(...parts: string[]): string {
  return readFileSync(join(FIXTURES, ...parts), "utf8");
}

const fallback = JSON.parse(read("fallback.json")) as TerminalPalette;

beforeAll(async () => {
  // vitest rewrites import.meta.url to a dead dev-server address, so the
  // module's own URL resolution cannot work here — pass the bytes instead.
  await loadEngine(readFileSync(join(import.meta.dirname, "..", "wasm", "cathode_bg.wasm")));
});

describe.each(["minimal", "no-scrolling", "full-theme"])("fixture %s", (name) => {
  it("resolves to the expected options", () => {
    const expected = JSON.parse(read(name, "expected.json")) as TerminalOptions;

    expect(resolveAlacrittyToml(read(name, "alacritty.toml"), fallback)).toEqual(expected);
  });
});

describe("fixture malformed", () => {
  it("throws rather than returning silently defaulted options", () => {
    expect(() => resolveAlacrittyToml(read("malformed", "alacritty.toml"), fallback)).toThrow(
      /failed to parse alacritty config/,
    );
  });
});
