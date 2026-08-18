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
| `vectorize-wordmark.py` | Regenerates both wordmarks from a TTF. |

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

## Wordmark

Set in Iosevka ExtraBold (SIL OFL 1.1), condensed enough that the mark keeps
its weight in the lockup. The glyphs are baked into `<path>`, so the wordmark
carries no live `<text>` and needs no font installed to render correctly.

To change the typeface or the wording, edit and re-run the generator rather
than editing the SVGs by hand:

```sh
pip install fonttools
python3 assets/vectorize-wordmark.py ~/Library/Fonts/IosevkaNerdFont-ExtraBold.ttf
```

It reads `mark.svg` for the mark half of the lockup, so a change to the mark
propagates to both wordmarks on the next run.
