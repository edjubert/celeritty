import { describe, expect, it } from "vitest";
import { buildPaletteOverrides } from "./palette";
import type { TerminalPalette } from "./types";

// Each colour is its own slot index in hex, so a mis-ordering is obvious.
const PALETTE: TerminalPalette = {
  black: "#000000",
  red: "#000001",
  green: "#000002",
  yellow: "#000003",
  blue: "#000004",
  magenta: "#000005",
  cyan: "#000006",
  white: "#000007",
  brightBlack: "#000008",
  brightRed: "#000009",
  brightGreen: "#00000a",
  brightYellow: "#00000b",
  brightBlue: "#00000c",
  brightMagenta: "#00000d",
  brightCyan: "#00000e",
  brightWhite: "#00000f",
  foreground: "#ff0000",
  background: "#00ff00",
  cursor: "#0000ff",
};

describe("buildPaletteOverrides", () => {
  it("places the sixteen ANSI colours in NamedColor order", () => {
    const overrides = buildPaletteOverrides(PALETTE);

    for (let slot = 0; slot < 16; slot++) {
      expect(overrides.get(slot)).toBe(`#${slot.toString(16).padStart(6, "0")}`);
    }
  });

  it("places the three defaults at 256, 257 and 258", () => {
    const overrides = buildPaletteOverrides(PALETTE);

    expect(overrides.get(256)).toBe("#ff0000");
    expect(overrides.get(257)).toBe("#00ff00");
    expect(overrides.get(258)).toBe("#0000ff");
  });

  it("produces exactly nineteen entries and nothing else", () => {
    expect(buildPaletteOverrides(PALETTE).size).toBe(19);
  });
});
