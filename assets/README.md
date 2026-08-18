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
| `social-card.svg` | 1280×640 GitHub social preview. |
| `favicon.ico` | 16/32/48 bundle. See the note below before using it. |
| `png/` | Rasters at four steps: `s` `m` `l` `xl`. |
| `vectorize-wordmark.py` | Regenerates the wordmarks and social card from a TTF. |
| `build-rasters.py` | Regenerates `png/` and `favicon.ico` from the SVGs. |

There are two cuts because the full mark's title bar and text lines close up
into mush below roughly 32px. Swap to `mark-favicon.svg` rather than scaling
the full mark down. The favicon cut is square; the full mark is 200×236.

## Rasters

The SVGs are the source of truth. Everything in `png/` and `favicon.ico` is
derived, so regenerate rather than edit:

```sh
brew install librsvg
python3 assets/build-rasters.py
```

Steps are pixel heights: mark `64/128/256/512`, wordmark `48/96/192/384`,
favicon `16/32/48/128` (square).

### On favicon.ico

It exists because it was asked for, not because anything needs it. A `.ico`
earns its place when browsers and crawlers fetch `/favicon.ico` from a site
root without being told to. celeritty is an npm package with no site, so
until a docs site appears this file is dead weight — prefer `mark-favicon.svg`
or the `png/favicon-*.png` steps.

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

## License

CC BY 4.0, not the repository's Apache-2.0 — see [`LICENSE`](LICENSE) in this
directory. Derivatives are allowed deliberately, so the mascot stays something
a community can pick up and rework. The name is a separate matter that no
copyright licence speaks to.
