# celeritty

Terminal emulator for the web. ANSI parsing runs in Rust compiled to
WebAssembly (a vendored `alacritty_terminal`); the grid is drawn with WebGPU.

Ships as a class and as a custom element. It has no network code: you supply a
transport.

## Requirements

- A browser with WebGPU. There is no Canvas 2D or DOM fallback.
- A backend that speaks [`PROTOCOL.md`](PROTOCOL.md), or your own transport.

## Install

```bash
pnpm add celeritty
```

## Example

A complete, runnable client and server are in
[`examples/local-shell/`](examples/local-shell). The two halves:

```js
// main.js
import "celeritty/element";
import { WebSocketTransport } from "celeritty/transport/websocket";

const term = document.getElementById("term");

term.options = {
  font: { family: "monospace", size: 13 },
  colors: {
    black: "#000000", red: "#cd0000", green: "#00cd00", yellow: "#cdcd00",
    blue: "#0000ee", magenta: "#cd00cd", cyan: "#00cdcd", white: "#e5e5e5",
    brightBlack: "#7f7f7f", brightRed: "#ff0000", brightGreen: "#00ff00",
    brightYellow: "#ffff00", brightBlue: "#5c5cff", brightMagenta: "#ff00ff",
    brightCyan: "#00ffff", brightWhite: "#ffffff",
    foreground: "#e5e5e5", background: "#000000", cursor: "#e5e5e5",
  },
  cursor: { style: "block", blink: false },
  scrollback: 10000,
};

term.transport = new WebSocketTransport("ws://localhost:8080");

term.addEventListener("link-activate", (event) => {
  window.open(event.detail.url, "_blank", "noopener");
});
```

```js
// server.mjs
import pty from "node-pty";
import { WebSocketServer } from "ws";

new WebSocketServer({ port: 8080 }).on("connection", (socket) => {
  // encoding: null gives Buffers. Decoding as UTF-8 corrupts binary output
  // and multi-byte characters split across a read boundary.
  const term = pty.spawn(process.env.SHELL ?? "/bin/bash", [], {
    name: "xterm-256color", cols: 80, rows: 24, env: process.env, encoding: null,
  });

  socket.send(JSON.stringify({ type: "ready", columns: 80, rows: 24 }));
  term.onData((chunk) => socket.send(chunk, { binary: true }));
  term.onExit(({ exitCode }) => {
    socket.send(JSON.stringify({ type: "exit", code: exitCode }));
    socket.close();
  });

  socket.on("message", (payload, isBinary) => {
    if (isBinary) return term.write(payload);
    const message = JSON.parse(payload.toString("utf8"));
    if (message.type === "resize") term.resize(message.columns, message.rows);
  });

  socket.on("close", () => term.kill());
});
```

## Element

```html
<celeri-tty font-family="JetBrains Mono" font-size="13"></celeri-tty>
```

| Attribute | Default |
|---|---|
| `font-family` | `monospace` |
| `font-size` | `13` |
| `scrollback` | `10000` |

| Property | Type |
|---|---|
| `options` | `Partial<TerminalOptions>`, wins over attributes, applies live |
| `transport` | `TerminalTransport \| undefined`; assigning attaches, `undefined` detaches |
| `terminal` | the underlying `Terminal`, or `undefined` before it is connected |

| Event | `detail` |
|---|---|
| `data` | `Uint8Array` headed to the process |
| `resize` | `{ columns, lines }` |
| `selection-change` | `string \| null` |
| `link-activate` | `{ url, modifiers: { ctrl, alt, shift, meta } }` |
| `link-hover` | `string \| null` — the URL under the pointer, or `null` on leave |
| `error` | `Error` |

Attributes cover font and scrollback only. A page that never assigns
`options` gets no colours.

Importing `celeritty/element` registers the tag. Importing the package
root does not.

## Class

```ts
import { Terminal } from "celeritty";

const term = new Terminal(document.getElementById("host"), options);
await term.ready;

term.attach(myTransport);
```

| Method | |
|---|---|
| `attach(transport)` / `detach()` | connect and disconnect |
| `feed(bytes)` | process output in |
| `write(text)` | inject text locally; does not reach the process |
| `setOptions(patch)` | applies live; a colour change does not rebuild the glyph atlas |
| `focus()` / `blur()` / `clearScreen()` | |
| `getSelection()` / `copySelection()` | |
| `scrollLines(delta)` / `scrollToBottom()` | |
| `on(event, cb)` | returns an unsubscribe function |
| `dispose()` | |

## Transport

```ts
interface TerminalTransport {
  write(bytes: Uint8Array): void;
  resize(columns: number, rows: number): void;
  onData(cb: (bytes: Uint8Array) => void): () => void;
  onClose(cb: (reason?: string) => void): () => void;
}
```

`WebSocketTransport` implements it against [`PROTOCOL.md`](PROTOCOL.md). Hosts
with their own protocol — session reattachment, exit codes, scrollback replay
— implement the interface directly and do not import it.

## Configuration

`options` is fully resolved. The component applies it and resolves nothing:
which source won, and which overrides applied, is the host's decision.

To resolve an `alacritty.toml`:

```ts
import { loadEngine, resolveAlacrittyToml } from "celeritty";

await loadEngine();
const options = resolveAlacrittyToml(tomlText, fallbackPalette);
```

`fallbackPalette` supplies every colour the file does not set. Alacritty
documents its scalar defaults, so those are built in; it documents no default
palette.

The same resolver is the Rust crate `alacritty-config`, for backends reading
the file from disk — the one part of this a browser cannot do.

## Limits

- WebGPU only; no fallback renderer.
- No IME or composition. Dead keys and CJK input are not handled.
- No accessibility tree. The grid is a canvas; a screen reader sees nothing.
- No addon API.
- One font face. The atlas rasterizes `font.normal`; bold and italic render in
  the same face.
- `cursor.style` and `cursor.blink` are carried in the options but not drawn.
- No `bell` or `title` events; the engine does not surface them.

## Development

```bash
pnpm install
pnpm build      # wasm module, bundled ES output, type declarations
pnpm test       # cargo test --workspace, then vitest
pnpm harness    # http://localhost:8123
```

Requires Rust 1.85 with the `wasm32-unknown-unknown` target, `wasm-pack`, and
Node 22.18.

| Path | Contents |
|---|---|
| `crates/terminal-core/` | wasm engine: ANSI grid, key and mouse encoding, snapshot packing |
| `crates/alacritty-config/` | `alacritty.toml` to `TerminalOptions`, no wasm dependency |
| `src/core/` | the `Terminal` class |
| `src/renderer/` | WebGPU renderer |
| `src/element/`, `src/transport/` | the element and the reference transport |
| `fixtures/` | configuration fixtures asserted from both Rust and TypeScript |

## License

Apache-2.0.
