/**
 * Public surface of cathode.
 *
 * Everything a consumer can import from the package root is re-exported here.
 * Deep imports into `src/` are not part of the contract and are not covered
 * by semver.
 */

export * from "./renderer/index";
export { Terminal } from "./core/terminal";
export type {
  TerminalOptions,
  TerminalFont,
  TerminalPalette,
  TerminalCursor,
  TerminalEvent,
  TerminalEventMap,
  CellPoint,
} from "./core/types";
export type { TerminalTransport } from "./transport/types";
export type { GridSize } from "./renderer/grid-metrics";
