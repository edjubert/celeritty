#!/usr/bin/env python3
"""Regenerate the CeleriTTY wordmarks with outlined glyphs.

The wordmark carries no live <text>: the glyphs are baked into <path> so the
lockup renders identically everywhere, with no font to install. Re-run this
only to change the typeface, the wording, or the colours.

    pip install fonttools
    python3 vectorize-wordmark.py /path/to/IosevkaNerdFont-ExtraBold.ttf

Writes wordmark-dark.svg and wordmark-light.svg next to mark.svg.
"""
import os
import sys

from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

TEXT = "CeleriTTY"
SPLIT = 6  # "Celeri" | "TTY"
SIZE = 70
BASELINE = (168, 122)
MARK_SCALE = 0.593


def outline_groups(font_path):
    """Return (path_data_per_group, total_advance_px, font_units_to_px)."""
    font = TTFont(font_path)
    cmap = font.getBestCmap()
    glyphs = font.getGlyphSet()
    hmtx = font["hmtx"]
    scale = SIZE / font["head"].unitsPerEm

    groups, pen_x = [], 0.0
    for chunk in (TEXT[:SPLIT], TEXT[SPLIT:]):
        pen = SVGPathPen(glyphs)
        for ch in chunk:
            name = cmap[ord(ch)]
            # Glyph outlines start at the origin; shift each one to its own
            # advance position before it reaches the path pen.
            glyphs[name].draw(TransformPen(pen, (1, 0, 0, 1, pen_x, 0)))
            pen_x += hmtx[name][0]
        groups.append(pen.getCommands())
    return groups, pen_x * scale, scale


def mark_body(here):
    src = open(os.path.join(here, "mark.svg")).read()
    inner = src.split(">", 1)[1].rsplit("</svg>", 1)[0]
    return "\n".join("    " + l.strip() for l in inner.splitlines() if l.strip())


def build(font_path, body, celeri, tty, out):
    (celeri_d, tty_d), width, scale = outline_groups(font_path)
    bx, by = BASELINE
    w = int(bx + width + 20)
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} 180"
     width="{w}" height="180">
  <!-- CeleriTTY wordmark. Glyphes vectorises depuis
       {os.path.basename(font_path)} par vectorize-wordmark.py :
       aucune dependance a une fonte systeme. -->
  <g transform="translate(20 20) scale({MARK_SCALE})">
{body}
  </g>
  <g transform="translate({bx} {by}) scale({scale} {-scale})">
    <path fill="{celeri}" d="{celeri_d}"/>
    <path fill="{tty}" d="{tty_d}"/>
  </g>
</svg>
'''
    open(out, "w").write(svg)


def main():
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    font_path = sys.argv[1]
    here = os.path.dirname(os.path.abspath(__file__))
    body = mark_body(here)
    build(font_path, body, "#e7f0c2", "#8cb93f",
          os.path.join(here, "wordmark-dark.svg"))
    build(font_path, body, "#17300f", "#4c8f24",
          os.path.join(here, "wordmark-light.svg"))
    print("wordmark-dark.svg, wordmark-light.svg")


if __name__ == "__main__":
    main()
