# cathode

A terminal for the web. ANSI parsing and terminal emulation run in Rust
compiled to WebAssembly — a vendored, patched `alacritty_terminal` — and the
grid is drawn on the GPU.

**Status: pre-release.** The public API is not stable until `1.0.0`.

## Why

Terminal emulation is subtle: modes, scroll regions, wide characters, mouse
reporting protocols. `alacritty_terminal` already implements it correctly and
is exercised by a widely used terminal. Compiling it to wasm reuses that work
instead of reimplementing it in JavaScript.

## Layout

- `crates/terminal-core/` — the wasm engine: ANSI grid, keyboard and mouse
  encoding, snapshot packing, `wasm-bindgen` façade
- `crates/terminal-core/vendor/alacritty_terminal/` — patched upstream copy
- `src/renderer/` — WebGPU renderer: glyph atlas, palette, shader, metrics
- `harness/` — standalone browser demo, the only way to exercise the real GPU
  path

The glyph atlas stores coverage only; color is applied per cell in the
shader. Changing theme therefore never rebuilds the atlas — only changing
font does.

## Requirements

- Rust 1.85 with the `wasm32-unknown-unknown` target, and `wasm-pack`
- Node 22.18

## Commands

```bash
pnpm install
pnpm build          # wasm module, bundled ES output, type declarations
pnpm test           # Rust and TypeScript suites
pnpm harness        # interactive demo on :8123
pnpm lint
pnpm ts-check
```

`dist/`, `target/`, `node_modules/` and `src/wasm/` are build artifacts and
are not committed.

## Rendering

Rendering requires WebGPU. There is no Canvas 2D or DOM fallback; the
renderer sits behind an interface so one can be added without touching the
engine.

## License

Apache-2.0.
