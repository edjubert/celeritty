/**
 * The optional reference transport: one WebSocket speaking the protocol in
 * PROTOCOL.md.
 *
 * Deliberately minimal. It connects once, forwards bytes, and reports the
 * connection ending. It has no session identity, no reconnection, no
 * scrollback replay — a host that needs those is implementing
 * `TerminalTransport` itself, and pulling its requirements in here would make
 * them everyone's.
 */

import type { TerminalTransport } from "./types";

export type ServerMessage =
  | { type: "ready"; columns: number; rows: number }
  | { type: "exit"; code: number }
  | { type: "error"; message: string };

export interface WebSocketTransportOptions {
  /** Sub-protocols to request, e.g. for token authentication. */
  protocols?: string | string[];
  /** Called on `ready`. */
  onReady?: (columns: number, rows: number) => void;
  /** Called on `exit`. The socket closes right after. */
  onExit?: (code: number) => void;
}

type DataListener = (bytes: Uint8Array) => void;
type CloseListener = (reason?: string) => void;

export class WebSocketTransport implements TerminalTransport {
  readonly #socket: WebSocket;
  readonly #options: WebSocketTransportOptions;
  readonly #dataListeners = new Set<DataListener>();
  readonly #closeListeners = new Set<CloseListener>();
  /** Set by an `exit` message: a close after one is expected, not a failure. */
  #exited = false;

  constructor(url: string | URL, options: WebSocketTransportOptions = {}) {
    this.#options = options;
    this.#socket = new WebSocket(url, options.protocols);
    // Binary frames arrive as ArrayBuffer rather than Blob, so no async
    // unwrap sits on the output path.
    this.#socket.binaryType = "arraybuffer";

    this.#socket.addEventListener("message", (event) => this.#onMessage(event));
    this.#socket.addEventListener("close", (event) => this.#onClose(event));
    this.#socket.addEventListener("error", () => {
      // A WebSocket `error` event carries no detail by design; the `close`
      // that follows is where the reason surfaces. Recorded here only so the
      // failure is never silent if a browser omits the close.
      this.#emitClose("the terminal connection failed");
    });
  }

  /** Resolves once the socket is open, rejects if it closes first. */
  get opened(): Promise<void> {
    if (this.#socket.readyState === WebSocket.OPEN) return Promise.resolve();
    return new Promise((resolve, reject) => {
      this.#socket.addEventListener("open", () => resolve(), { once: true });
      this.#socket.addEventListener(
        "close",
        () => reject(new Error("the terminal connection closed before opening")),
        { once: true },
      );
    });
  }

  write(bytes: Uint8Array): void {
    if (this.#socket.readyState !== WebSocket.OPEN) return;
    this.#socket.send(bytes);
  }

  resize(columns: number, rows: number): void {
    if (this.#socket.readyState !== WebSocket.OPEN) return;
    this.#socket.send(JSON.stringify({ type: "resize", columns, rows }));
  }

  onData(cb: DataListener): () => void {
    this.#dataListeners.add(cb);
    return () => {
      this.#dataListeners.delete(cb);
    };
  }

  onClose(cb: CloseListener): () => void {
    this.#closeListeners.add(cb);
    return () => {
      this.#closeListeners.delete(cb);
    };
  }

  /** Close the socket. The terminal's `detach` does not do this for you. */
  close(): void {
    this.#socket.close();
  }

  #onMessage(event: MessageEvent<unknown>): void {
    if (event.data instanceof ArrayBuffer) {
      const bytes = new Uint8Array(event.data);
      for (const listener of this.#dataListeners) listener(bytes);
      return;
    }
    if (typeof event.data !== "string") return;

    const message = parseServerMessage(event.data);
    if (message === null) {
      this.#emitClose(`the terminal server sent an unreadable message: ${event.data}`);
      return;
    }

    switch (message.type) {
      case "ready":
        this.#options.onReady?.(message.columns, message.rows);
        return;
      case "exit":
        this.#exited = true;
        this.#options.onExit?.(message.code);
        return;
      case "error":
        this.#emitClose(message.message);
        return;
    }
  }

  #onClose(event: CloseEvent): void {
    // A close after `exit` is the process having finished — expected, and not
    // something to surface as a failure.
    if (this.#exited || event.wasClean) {
      this.#emitClose(undefined);
      return;
    }
    this.#emitClose(
      event.reason === "" ? "the terminal connection was lost" : event.reason,
    );
  }

  #emitClose(reason: string | undefined): void {
    for (const listener of this.#closeListeners) listener(reason);
  }
}

/** `null` when the payload is not a server message this protocol defines. */
function parseServerMessage(raw: string): ServerMessage | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const candidate = parsed as Record<string, unknown>;
  if (candidate.type === "ready" && typeof candidate.columns === "number" && typeof candidate.rows === "number") {
    return { type: "ready", columns: candidate.columns, rows: candidate.rows };
  }
  if (candidate.type === "exit" && typeof candidate.code === "number") {
    return { type: "exit", code: candidate.code };
  }
  if (candidate.type === "error" && typeof candidate.message === "string") {
    return { type: "error", message: candidate.message };
  }
  return null;
}
