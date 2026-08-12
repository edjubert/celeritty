/**
 * Turning a surface's box into a canvas size and a cell count.
 *
 * Split out of the class because the two conditions that matter here — a
 * zero-sized box, and a resize that does not change the cell count — are
 * exactly the ones that are painful to reproduce in a browser.
 */

import type { CellMetrics } from "../renderer/atlas-layout";
import { gridSizeFor, pixelSizeFor } from "../renderer/grid-metrics";
import type { GridSize, PixelSize } from "../renderer/grid-metrics";

export interface SurfaceMeasurement {
  pixels: PixelSize;
  grid: GridSize;
}

/** `null` when the cell count is unchanged, so callers can skip a redundant resize. */
export function computeGridResize(previous: GridSize, next: GridSize): GridSize | null {
  if (previous.columns === next.columns && previous.lines === next.lines) return null;
  return next;
}

/**
 * Canvas pixel size and cell count for a surface box.
 *
 * Returns `null` for a zero-sized box. A hidden container — a `display: none`
 * tab, a collapsed panel — reports 0×0, and measuring it would clamp the grid
 * to 1×1. A full-screen program then tears down its layout ("E36: Not enough
 * room" in Neovim) every time the user looks at something else.
 */
export function measureSurface(
  bounds: { width: number; height: number },
  cell: CellMetrics,
  devicePixelRatio: number,
): SurfaceMeasurement | null {
  if (bounds.width === 0 || bounds.height === 0) return null;

  const size = { cssWidth: bounds.width, cssHeight: bounds.height };
  return {
    pixels: pixelSizeFor(size, devicePixelRatio),
    grid: gridSizeFor(size, cell, devicePixelRatio),
  };
}
