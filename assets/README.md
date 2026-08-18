# Brand assets

A celery bunch planted in a square terminal window — `celeritty` is `celerity`
with a `tty` in it, and `céleri` is the French for celery.

## Files

| File | Use |
|---|---|
| `mark.svg` | The mark, full cut. Title bar, prompt, four text lines. 48px and up. |
| `mark-favicon.svg` | Small cut: three ribs instead of five, thicker outlines, no title bar or text lines, enlarged prompt. Below 48px. |
| `mark-mono-light.svg` | One ink, dark on light. |
| `mark-mono-dark.svg` | One ink, light on dark. |
| `wordmark-dark.svg` | Horizontal lockup for dark grounds. |
| `wordmark-light.svg` | Horizontal lockup for light grounds. |

There are two cuts because the full mark's title bar and text lines close up
into mush below roughly 32px. Swap to `mark-favicon.svg` rather than scaling
the full mark down.

## Palette

| Token | Value | Where |
|---|---|---|
| Outline | `#17300f` | Every contour |
| Rib, outer | `#8cb93f` | Ribs 1 and 5 |
| Rib, middle | `#a9d155` | Ribs 2 and 4 |
| Rib, centre | `#c4e277` | Rib 3, prompt, cursor |
| Leaf, back | `#2b7030` | Rear foliage |
| Leaf, front | `#48ab45` | Front foliage |
| Screen | `#131416` | Terminal window fill |

The greens are the mark's own — they are deliberately not tied to any host
application's palette.

## Known gap

The wordmarks still carry live `<text>` on a system monospace stack, so they
render differently from machine to machine. Vectorise the glyphs to `<path>`
(and pick a real typeface while doing it) before using a wordmark anywhere
public.
