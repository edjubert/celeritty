/**
 * Deciding whether a pointer event concerns the running program, and which
 * cell it landed on.
 *
 * Kept free of wasm and of the DOM so the hot-path guarantee below can be
 * asserted in a unit test.
 */

import type { CellMetrics } from "../renderer/atlas-layout";
import { cellAtPixel } from "../renderer/grid-metrics";
import type { CellPoint } from "./types";

/** Event kinds, matching `encode_mouse_js`'s discriminants. */
export const MOUSE_PRESS = 0;
export const MOUSE_RELEASE = 1;
export const MOUSE_MOVE = 2;
export const MOUSE_SCROLL_UP = 3;
export const MOUSE_SCROLL_DOWN = 4;

/** `MouseReporting::None` — the program wants no mouse events at all. */
const MOUSE_REPORTING_NONE = 0;

/** The terminal flags the mouse encoder needs. Structural, so tests can stub it. */
export interface MouseReportingState {
  readonly mouseReporting: number;
  readonly sgrMouse: boolean;
  readonly alternateScroll: boolean;
  readonly altScreen: boolean;
  readonly applicationCursor: boolean;
}

/** DOM buttons are 0/1/2 (left/middle/right); the encoder wants 1/2/3. */
export function toEncoderButton(domButton: number): number {
  return domButton + 1;
}

/**
 * The cell a pointer event landed on, or `null` when the running program
 * asked for no mouse reporting — in which case the caller must leave the
 * event to the browser rather than swallowing it with `preventDefault`.
 *
 * `measure` is a thunk, not a value, and that is the point: it is only
 * invoked once reporting is known to be on. `mousemove` fires continuously
 * and most programs want nothing, so a layout read on every event would be a
 * measurable regression on the hottest path this component has. Task 10
 * asserts the thunk is not called.
 */
export function pointerTarget(
  state: MouseReportingState,
  measure: () => { left: number; top: number },
  cell: CellMetrics,
  devicePixelRatio: number,
  event: { clientX: number; clientY: number },
): CellPoint | null {
  if (state.mouseReporting === MOUSE_REPORTING_NONE) return null;

  const bounds = measure();
  return cellAtPixel(
    { x: event.clientX - bounds.left, y: event.clientY - bounds.top },
    cell,
    devicePixelRatio,
  );
}
