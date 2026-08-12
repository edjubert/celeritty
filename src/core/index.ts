/** Re-exports from the core package. */

export type {
  CellPoint,
  LinkActivation,
  LinkModifiers,
  TerminalEvent,
  TerminalEventMap,
  TerminalFont,
  TerminalOptions,
  TerminalPalette,
} from "./types";
export { findLinkAtColumn } from "./link-detection";
export type { DetectedLink } from "./link-detection";
export { resolveAlacrittyToml } from "./config";
