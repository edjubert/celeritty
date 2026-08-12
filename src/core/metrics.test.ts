import { describe, expect, it } from "vitest";
import { computeGridResize, measureSurface } from "./metrics";

const CELL = { width: 8, height: 16 };

describe("computeGridResize", () => {
  it("returns null when the cell count did not change", () => {
    expect(computeGridResize({ columns: 80, lines: 24 }, { columns: 80, lines: 24 })).toBeNull();
  });

  it("returns the new size when it changed", () => {
    expect(computeGridResize({ columns: 80, lines: 24 }, { columns: 100, lines: 24 })).toEqual({
      columns: 100,
      lines: 24,
    });
  });
});

describe("measureSurface", () => {
  it("returns null for a zero-width box", () => {
    expect(measureSurface({ width: 0, height: 400 }, CELL, 1)).toBeNull();
  });

  it("returns null for a zero-height box", () => {
    expect(measureSurface({ width: 640, height: 0 }, CELL, 1)).toBeNull();
  });

  it("converts a box into canvas pixels and whole cells", () => {
    expect(measureSurface({ width: 640, height: 400 }, CELL, 1)).toEqual({
      pixels: { width: 640, height: 400 },
      grid: { columns: 80, lines: 25 },
    });
  });

  it("scales by the device pixel ratio", () => {
    expect(measureSurface({ width: 640, height: 400 }, CELL, 2)).toEqual({
      pixels: { width: 1280, height: 800 },
      grid: { columns: 160, lines: 50 },
    });
  });

  it("floors partial cells rather than clipping a half row", () => {
    // 645 physical px / 8 = 80.6 → 80 columns, with 5px of padding left over.
    expect(measureSurface({ width: 645, height: 400 }, CELL, 1)?.grid.columns).toBe(80);
  });
});
