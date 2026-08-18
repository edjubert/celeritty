#!/usr/bin/env python3
"""Rasterise the CeleriTTY SVGs into PNGs and a favicon.ico.

The SVGs are the source of truth; everything here is derived and can be
regenerated at will. Needs librsvg on PATH:

    brew install librsvg
    python3 build-rasters.py

Writes png/ and favicon.ico next to the SVGs.
"""
import os
import struct
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "png")

# s / m / l / xl, expressed as pixel heights.
MARK_STEPS = {"s": 64, "m": 128, "l": 256, "xl": 512}
WORDMARK_STEPS = {"s": 48, "m": 96, "l": 192, "xl": 384}
# Square, and the three sizes a .ico actually carries.
FAVICON_STEPS = {"s": 16, "m": 32, "l": 48, "xl": 128}
ICO_SIZES = (16, 32, 48)


def render(svg, out, height=None, square=None):
    args = ["rsvg-convert"]
    if square:
        args += ["-w", str(square), "-h", str(square)]
    else:
        args += ["-h", str(height)]
    args += [os.path.join(HERE, svg), "-o", out]
    subprocess.run(args, check=True)


def write_ico(png_paths, out):
    """Assemble a PNG-in-ICO container: 6-byte header, 16 bytes per entry."""
    blobs = [open(p, "rb").read() for p in png_paths]
    offset = 6 + 16 * len(blobs)
    header = struct.pack("<HHH", 0, 1, len(blobs))
    entries, payload = b"", b""
    for size, blob in zip(ICO_SIZES, blobs):
        # 0 in the width/height byte means 256; every size here is smaller.
        entries += struct.pack("<BBBBHHII", size, size, 0, 0, 1, 32,
                               len(blob), offset)
        payload += blob
        offset += len(blob)
    open(out, "wb").write(header + entries + payload)


def main():
    if subprocess.run(["which", "rsvg-convert"], capture_output=True).returncode:
        sys.exit("rsvg-convert not found — brew install librsvg")
    os.makedirs(OUT, exist_ok=True)

    for step, h in MARK_STEPS.items():
        render("mark.svg", os.path.join(OUT, f"mark-{step}.png"), height=h)
    for step, px in FAVICON_STEPS.items():
        render("mark-favicon.svg", os.path.join(OUT, f"favicon-{step}.png"),
               square=px)
    for ground in ("dark", "light"):
        for step, h in WORDMARK_STEPS.items():
            render(f"wordmark-{ground}.svg",
                   os.path.join(OUT, f"wordmark-{ground}-{step}.png"), height=h)
    render("social-card.svg", os.path.join(OUT, "social-card.png"), height=640)

    ico_srcs = []
    for size in ICO_SIZES:
        tmp = os.path.join(OUT, f".ico-{size}.png")
        render("mark-favicon.svg", tmp, square=size)
        ico_srcs.append(tmp)
    write_ico(ico_srcs, os.path.join(HERE, "favicon.ico"))
    for tmp in ico_srcs:
        os.remove(tmp)

    print(f"{len(os.listdir(OUT))} PNGs in png/, plus favicon.ico")


if __name__ == "__main__":
    main()
