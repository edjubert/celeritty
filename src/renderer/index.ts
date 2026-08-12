/** Public surface of the terminal renderer. */

export { AtlasLayout } from "./atlas-layout";
export type { AtlasSlot, CellMetrics, TextureRect } from "./atlas-layout";
export { GlyphAtlas, measureCell } from "./atlas";
export type { FontSpec } from "./atlas";
export { buildInstanceData, FLOATS_PER_INSTANCE, WORDS_PER_CELL } from "./instance-data";
export type { GlyphSource } from "./instance-data";
export { buildPaletteBuffer, decodeColor, PALETTE_ENTRIES } from "./palette";
export type { DecodedColor } from "./palette";
export { cellAtPixel, gridSizeFor, pixelSizeFor } from "./grid-metrics";
export type { CssSize, GridSize, PixelSize } from "./grid-metrics";
export { createWebGpuRenderer, TerminalRenderer } from "./renderer";
export type { AtlasTexture, Renderer, RendererFactory, RendererGrid } from "./renderer-interface";
export { createFakeRenderer, FakeRenderer } from "./fake-renderer";
export type { RecordedFrame } from "./fake-renderer";
