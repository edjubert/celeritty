/**
 * Maps a `TerminalPalette` onto the renderer's palette slot indices, which
 * follow alacritty's `vte::ansi::NamedColor` ordering: 0-7 normal ANSI, 8-15
 * bright ANSI, 256 default foreground, 257 default background, 258 cursor.
 */

import type { TerminalPalette } from "./types";

const ANSI_SLOT_ORDER: Array<keyof TerminalPalette> = [
  "black",
  "red",
  "green",
  "yellow",
  "blue",
  "magenta",
  "cyan",
  "white",
  "brightBlack",
  "brightRed",
  "brightGreen",
  "brightYellow",
  "brightBlue",
  "brightMagenta",
  "brightCyan",
  "brightWhite",
];

const FOREGROUND_SLOT = 256;
const BACKGROUND_SLOT = 257;
const CURSOR_SLOT = 258;

export function buildPaletteOverrides(palette: TerminalPalette): Map<number, string> {
  const overrides = new Map<number, string>();
  ANSI_SLOT_ORDER.forEach((key, index) => overrides.set(index, palette[key]));
  overrides.set(FOREGROUND_SLOT, palette.foreground);
  overrides.set(BACKGROUND_SLOT, palette.background);
  overrides.set(CURSOR_SLOT, palette.cursor);
  return overrides;
}
