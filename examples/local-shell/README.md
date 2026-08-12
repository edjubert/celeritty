# Local shell example

Runs your login shell in the browser.

```bash
pnpm install
pnpm server   # ws://localhost:8080, one PTY per connection
pnpm dev      # http://localhost:5173
```

Two processes: `server.mjs` speaks the protocol in `../../PROTOCOL.md` over a
real PTY, and Vite serves the page.

No authentication and no origin check. It spawns a shell for anyone who
connects to port 8080. Local use only.
