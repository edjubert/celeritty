# Local shell example

Runs your login shell in the browser.

```bash
pnpm install
pnpm server   # ws://localhost:8080, one PTY per connection
pnpm dev      # http://localhost:5173
```

Two processes: `server.mjs` speaks the protocol in `../../PROTOCOL.md` over a
real PTY, and Vite serves the page.

Requires a browser with WebGPU.

## If the server reports `posix_spawnp failed`

`node-pty` ships prebuilt binaries whose `spawn-helper` needs its executable
bit set by the package's own install script, and pnpm blocks install scripts
by default. `package.json` lists `node-pty` under `pnpm.onlyBuiltDependencies`
for that reason; if your pnpm version still skips it, either approve it
interactively or set the bit yourself:

```bash
pnpm approve-builds
# or
chmod +x node_modules/.pnpm/node-pty@*/node_modules/node-pty/prebuilds/*/spawn-helper
```

A failed spawn closes only the offending socket — it reports `{"type":
"error"}` on the protocol's error channel and leaves the server running for
other clients.

## Security

No authentication and no origin check. It spawns a shell for anyone who
connects to port 8080. Local use only.
