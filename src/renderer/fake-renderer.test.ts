import { describe, expect, it } from "vitest";
import { createFakeRenderer, FakeRenderer } from "./fake-renderer";

function grid(columns: number, lines: number, packed: Uint32Array) {
  return { columns, lines, packed };
}

describe("FakeRenderer", () => {
  it("records the dimensions of every frame", () => {
    const renderer = new FakeRenderer();

    renderer.render(grid(80, 24, new Uint32Array(4)));
    renderer.render(grid(100, 30, new Uint32Array(4)));

    expect(renderer.frames).toHaveLength(2);
    expect(renderer.frames[0]).toMatchObject({ columns: 80, lines: 24 });
    expect(renderer.frames[1]).toMatchObject({ columns: 100, lines: 30 });
  });

  it("copies the packed buffer instead of holding the caller's view", () => {
    const renderer = new FakeRenderer();
    // One buffer, mutated between frames — exactly what the engine does with
    // its wasm-backed snapshot.
    const shared = new Uint32Array([1, 0, 0, 0]);

    renderer.render(grid(1, 1, shared));
    shared[0] = 2;
    renderer.render(grid(1, 1, shared));

    expect(renderer.frames[0]?.packed[0]).toBe(1);
    expect(renderer.frames[1]?.packed[0]).toBe(2);
  });

  it("copies each palette it is handed", () => {
    const renderer = new FakeRenderer();
    const overrides = new Map([[0, "#000000"]]);

    renderer.setPalette(overrides);
    overrides.set(0, "#ffffff");

    expect(renderer.palettes[0]?.get(0)).toBe("#000000");
  });

  it("records every atlas it is handed", () => {
    const renderer = new FakeRenderer();
    const atlas = {} as unknown as Parameters<FakeRenderer["setAtlas"]>[0];

    renderer.setAtlas(atlas);

    expect(renderer.atlases).toEqual([atlas]);
  });

  it("throws when used after dispose", () => {
    const renderer = new FakeRenderer();
    renderer.dispose();

    expect(renderer.disposed).toBe(true);
    expect(() => renderer.render(grid(1, 1, new Uint32Array(4)))).toThrow(
      "FakeRenderer.render() was called after dispose().",
    );
  });

  it("is built by the factory", async () => {
    const renderer = await createFakeRenderer(
      undefined as unknown as HTMLCanvasElement,
      undefined as unknown as Parameters<FakeRenderer["setAtlas"]>[0],
    );

    expect(renderer).toBeInstanceOf(FakeRenderer);
  });
});
