import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { computeCellPoint } from "./input-handlers";

describe("computeCellPoint", () => {
  const atlas = { cell: { width: 10, height: 20 } };
  const dpr = 2;

  beforeAll(() => {
    vi.stubGlobal("window", { devicePixelRatio: dpr });
  });
  afterAll(() => {
    vi.unstubAllGlobals();
  });

  it("computes a cell from the given hostBounds, ignoring event.currentTarget", () => {
    const hostBounds = () => ({ left: 100, top: 50 }) as DOMRect;
    const event = { clientX: 130, clientY: 90, currentTarget: null } as unknown as MouseEvent;

    const cell = computeCellPoint(atlas, hostBounds, event);

    expect(cell).not.toBeNull();
    expect(cell?.column).toBe(Math.floor(((130 - 100) * dpr) / 10));
    expect(cell?.line).toBe(Math.floor(((90 - 50) * dpr) / 20));
  });

  it("clamps negative coordinates to 0", () => {
    const hostBounds = () => ({ left: 500, top: 500 }) as DOMRect;
    const event = { clientX: 0, clientY: 0, currentTarget: null } as unknown as MouseEvent;

    const cell = computeCellPoint(atlas, hostBounds, event);

    expect(cell).toEqual({ column: 0, line: 0 });
  });
});
