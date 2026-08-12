// Minimal backend for PROTOCOL.md: one PTY per connection, no auth, no
// session reuse. Enough to run a real shell in the browser, and small enough
// to read in one sitting.

import pty from "node-pty";
import { WebSocketServer } from "ws";

const SHELL = process.env.SHELL ?? "/bin/bash";
const PORT = 8080;

const server = new WebSocketServer({ port: PORT });
console.log(`terminal server on ws://localhost:${PORT}`);

server.on("connection", (socket) => {
  let term;
  try {
    term = pty.spawn(SHELL, [], {
      name: "xterm-256color",
      cols: 80,
      rows: 24,
      cwd: process.env.HOME,
      env: process.env,
      // Buffers, not strings. node-pty decodes as UTF-8 by default, which
      // corrupts binary output and any multi-byte character split across a
      // read boundary. This is the same reason PROTOCOL.md uses binary frames.
      encoding: null,
    });
  } catch (error) {
    // A failed spawn must not take the server down with it — one bad
    // connection would otherwise disconnect every other client. Report it on
    // the protocol's own error channel and close just this socket.
    socket.send(
      JSON.stringify({ type: "error", message: `could not start ${SHELL}: ${error.message}` }),
    );
    socket.close();
    return;
  }

  socket.send(JSON.stringify({ type: "ready", columns: 80, rows: 24 }));

  const data = term.onData((chunk) => {
    if (socket.readyState === socket.OPEN) socket.send(chunk, { binary: true });
  });

  const exit = term.onExit(({ exitCode }) => {
    if (socket.readyState !== socket.OPEN) return;
    socket.send(JSON.stringify({ type: "exit", code: exitCode }));
    socket.close();
  });

  socket.on("message", (payload, isBinary) => {
    if (isBinary) {
      term.write(payload);
      return;
    }
    let message;
    try {
      message = JSON.parse(payload.toString("utf8"));
    } catch {
      socket.send(JSON.stringify({ type: "error", message: "unreadable control frame" }));
      return;
    }
    if (message.type === "resize") term.resize(message.columns, message.rows);
  });

  socket.on("close", () => {
    data.dispose();
    exit.dispose();
    term.kill();
  });
});
