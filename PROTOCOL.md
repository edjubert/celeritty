# cathode reference transport protocol

What a backend must do to work with `WebSocketTransport`, the optional
transport shipped with cathode.

**This protocol is optional.** The component itself has no network code — it
takes any object satisfying `TerminalTransport`. A host with its own protocol
implements that interface and ignores this document entirely.

## Frames

One WebSocket connection carries two kinds of frame, told apart by frame type.

| Direction | Content | Frame |
|---|---|---|
| server → client | raw process output | **binary** |
| server → client | `ready`, `exit`, `error` | text, JSON |
| client → server | bytes for the process | **binary** |
| client → server | `resize` | text, JSON |

### Why binary, and not JSON with a string payload

Process output is not valid UTF-8. Programs emit binary, and a multi-byte
sequence is regularly split across a read boundary — an accented character or
a Nerd Font glyph straddling two reads becomes a permanent `U+FFFD` once
decoded lossily. The corruption depends on chunk sizes, so it survives testing
and shows up in use. Base64 inside JSON would be correct but costs a third
more bytes on the hottest path there is.

## Server messages

### `ready`

Sent once, before any output.

```json
{ "type": "ready", "columns": 80, "rows": 24 }
```

`columns` and `rows` are the size the process was actually spawned at. The
client sends its own `resize` immediately on connecting, so treat this as
informational.

### `exit`

The process ended. The server should close the socket afterwards.

```json
{ "type": "exit", "code": 0 }
```

### `error`

Something failed that the user should be told about — the process could not
be spawned, the working directory does not exist.

```json
{ "type": "error", "message": "no such directory: /tmp/gone" }
```

## Client messages

### `resize`

Sent on connect, and whenever the grid changes size.

```json
{ "type": "resize", "columns": 100, "rows": 30 }
```

## Ordering

- `ready` precedes every output frame.
- The client's first `resize` may arrive before or after `ready`. A server
  must accept it either way; a server that ignores a `resize` received before
  the process is fully spawned leaves it drawing for the wrong grid.
- After `exit`, a server sends nothing further and closes.

## Closing

Either side may close at any time. The client surfaces an unexpected close to
its host; a close following `exit` is expected and is not an error.

## Configuration

Terminal options — font, colours, cursor, scrollback — are **not** part of
this protocol. They are resolved by the host and handed to the component
directly. If your backend resolves them from an `alacritty.toml`, the
`alacritty-config` crate in this repository does exactly that, and the JSON
schema it emits is the component's `TerminalOptions`.
