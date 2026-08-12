/**
 * Finding URLs in a row of terminal output.
 *
 * Pure string work, deliberately kept away from the DOM: the column
 * arithmetic is where the bugs are, and it is only cheap to test in
 * isolation.
 */

/**
 * http(s) URLs. Deliberately simple — this is terminal output, not arbitrary
 * user text, so it does not need to handle every edge case a general-purpose
 * URL parser would (IDN, unusual schemes, and so on).
 */
const URL_PATTERN = /https?:\/\/[^\s]+/g;

/**
 * Trailing characters that are almost always punctuation wrapping the URL
 * rather than part of it — a closing paren after `(https://x.com)`, a period
 * ending a sentence.
 */
const TRAILING_PUNCTUATION = /[).,;:!?]+$/;

export interface DetectedLink {
  url: string;
  /** Inclusive start column. */
  start: number;
  /** Inclusive end column. */
  end: number;
}

/**
 * The URL, if any, covering `column` in `rowText`. `null` when the column is
 * not inside a detected URL — including when the row contains none.
 */
export function findLinkAtColumn(rowText: string, column: number): DetectedLink | null {
  URL_PATTERN.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = URL_PATTERN.exec(rowText)) !== null) {
    const raw = match[0];
    const trimmed = raw.replace(TRAILING_PUNCTUATION, "");
    if (trimmed.length === 0) continue;
    const start = match.index;
    const end = start + trimmed.length - 1;
    if (column >= start && column <= end) {
      return { url: trimmed, start, end };
    }
  }
  return null;
}
