import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { WebSocketTransport } from "./websocket";

class FakeSocket {
  static OPEN = 1;
  static instances: FakeSocket[] = [];

  readyState = 1;
  binaryType = "";
  readonly sent: Array<string | Uint8Array> = [];
  readonly #listeners = new Map<string, Set<(event: unknown) => void>>();

  constructor(
    readonly url: string | URL,
    readonly protocols?: string | string[],
  ) {
    FakeSocket.instances.push(this);
  }

  addEventListener(type: string, cb: (event: unknown) => void): void {
    const set = this.#listeners.get(type) ?? new Set();
    set.add(cb);
    this.#listeners.set(type, set);
  }

  send(payload: string | Uint8Array): void {
    this.sent.push(payload);
  }

  close(): void {
    this.readyState = 3;
  }

  emit(type: string, event: unknown): void {
    for (const cb of this.#listeners.get(type) ?? []) cb(event);
  }
}

beforeEach(() => {
  FakeSocket.instances = [];
  vi.stubGlobal("WebSocket", FakeSocket);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function connect() {
  const transport = new WebSocketTransport("ws://localhost/term");
  const socket = FakeSocket.instances[0];
  if (socket === undefined) throw new Error("no socket was constructed");
  return { transport, socket };
}

describe("WebSocketTransport", () => {
  it("requests binary frames as ArrayBuffer", () => {
    const { socket } = connect();
    expect(socket.binaryType).toBe("arraybuffer");
  });

  it("sends process bytes as a binary frame, not JSON", () => {
    const { transport, socket } = connect();

    transport.write(new Uint8Array([0x1b, 0x5b, 0x41]));

    expect(socket.sent).toHaveLength(1);
    expect(socket.sent[0]).toBeInstanceOf(Uint8Array);
  });

  it("sends resize as a JSON text frame", () => {
    const { transport, socket } = connect();

    transport.resize(100, 30);

    expect(socket.sent[0]).toBe('{"type":"resize","columns":100,"rows":30}');
  });

  it("delivers binary frames to data listeners", () => {
    const { transport, socket } = connect();
    const received: Uint8Array[] = [];
    transport.onData((bytes) => received.push(bytes));

    socket.emit("message", { data: new Uint8Array([1, 2, 3]).buffer });

    expect(Array.from(received[0] ?? [])).toEqual([1, 2, 3]);
  });

  it("stops delivering after unsubscribe", () => {
    const { transport, socket } = connect();
    const listener = vi.fn();
    transport.onData(listener)();

    socket.emit("message", { data: new Uint8Array([1]).buffer });

    expect(listener).not.toHaveBeenCalled();
  });

  it("surfaces a server error message as a close reason", () => {
    const { transport, socket } = connect();
    const reasons: Array<string | undefined> = [];
    transport.onClose((reason) => reasons.push(reason));

    socket.emit("message", { data: '{"type":"error","message":"no such directory"}' });

    expect(reasons).toEqual(["no such directory"]);
  });

  it("reports a close after exit as clean", () => {
    const { transport, socket } = connect();
    const reasons: Array<string | undefined> = [];
    transport.onClose((reason) => reasons.push(reason));

    socket.emit("message", { data: '{"type":"exit","code":0}' });
    socket.emit("close", { wasClean: false, reason: "" });

    // The process finished; the socket dropping afterwards is not a failure.
    expect(reasons).toEqual([undefined]);
  });

  it("reports an unexpected close with a reason", () => {
    const { transport, socket } = connect();
    const reasons: Array<string | undefined> = [];
    transport.onClose((reason) => reasons.push(reason));

    socket.emit("close", { wasClean: false, reason: "" });

    expect(reasons).toEqual(["the terminal connection was lost"]);
  });

  it("does not silently ignore an unreadable control frame", () => {
    const { transport, socket } = connect();
    const reasons: Array<string | undefined> = [];
    transport.onClose((reason) => reasons.push(reason));

    socket.emit("message", { data: "{not json" });

    expect(reasons[0]).toContain("unreadable message");
  });
});
