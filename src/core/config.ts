/**
 * Resolving an `alacritty.toml` in the browser.
 *
 * The same Rust code a backend would call, compiled into the same wasm module
 * the terminal already loads. Only reading a file from disk actually needs a
 * server; a bundled theme or one stored in a database is resolved here.
 */

import type { TerminalOptions, TerminalPalette } from "./types";
import { resolveAlacrittyToml as resolveRaw } from "../wasm/celeritty.js";

/**
 * Resolve TOML text into terminal options.
 *
 * `fallback` supplies every colour the file does not set. Throws when the
 * TOML is malformed — that means the user's real settings are silently not
 * being honored, which a host must be able to surface.
 *
 * `loadEngine()` must have resolved first; this shares the terminal's wasm
 * module rather than loading a second one.
 */
export function resolveAlacrittyToml(
  source: string,
  fallback: TerminalPalette,
): TerminalOptions {
  return resolveRaw(source, fallback) as TerminalOptions;
}
