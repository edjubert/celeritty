import { WORDS_PER_CELL } from "../renderer/instance-data";
import type { CellPoint } from "./types";

/**
 * Bit 0 of the flags word — matches alacritty's `Flags::INVERSE`, the same
 * bit the Rust side already sets for the cursor cell. Reusing it means the
 * selection needs no new shader path and no new palette slot.
 */
const FLAG_INVERSE = 1;

/**
 * OR the `INVERSE` flag into every cell between `start` and `end`
 * (inclusive), normalizing their order first — a mouse drag can go in any of
 * four directions. No-ops when either point is `null` (no active selection).
 *
 * Mutates `packed` in place: this runs once per animation frame against the
 * engine's live snapshot view, so it must not allocate.
 */
export function applySelectionHighlight(
  packed: Uint32Array,
  columns: number,
  start: CellPoint | null,
  end: CellPoint | null,
): void {
  if (start === null || end === null) return;

  const [top, bottom] =
    start.line < end.line || (start.line === end.line && start.column <= end.column)
      ? [start, end]
      : [end, start];

  for (let line = top.line; line <= bottom.line; line++) {
    const fromColumn = line === top.line ? top.column : 0;
    const toColumn = line === bottom.line ? bottom.column : columns - 1;
    for (let column = fromColumn; column <= toColumn; column++) {
      const flagsIndex = (line * columns + column) * WORDS_PER_CELL + 3;
      packed[flagsIndex] |= FLAG_INVERSE;
    }
  }
}
