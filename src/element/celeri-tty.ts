/**
 * `<celeri-tty>` — the terminal as an HTML element.
 *
 * A façade over the `Terminal` class, which stays the real API. Scalars are
 * attributes, objects are properties, and everything the terminal reports is
 * a `CustomEvent`.
 */

import { Terminal } from "../core/terminal";
import type { TerminalOptions } from "../core/types";
import type { TerminalTransport } from "../transport/types";

const DEFAULT_FONT_FAMILY = "monospace";
const DEFAULT_FONT_SIZE = 13;
const DEFAULT_SCROLLBACK = 10_000;

export class CeleriTtyElement extends HTMLElement {
  static readonly observedAttributes = ["font-family", "font-size", "scrollback"];

  #terminal: Terminal | undefined;
  #transport: TerminalTransport | undefined;
  #options: Partial<TerminalOptions> | undefined;
  #pendingTeardown = false;

  /**
   * A fully resolved configuration. Assigning after the terminal is running
   * applies the change live.
   */
  get options(): Partial<TerminalOptions> | undefined {
    return this.#options;
  }

  set options(value: Partial<TerminalOptions> | undefined) {
    this.#options = value;
    if (value !== undefined) this.#terminal?.setOptions(value);
  }

  /** Assigning attaches; assigning `undefined` detaches. */
  get transport(): TerminalTransport | undefined {
    return this.#transport;
  }

  set transport(value: TerminalTransport | undefined) {
    this.#transport = value;
    const terminal = this.#terminal;
    if (terminal === undefined) return;
    if (value === undefined) {
      terminal.detach();
      return;
    }
    void terminal.ready
      .then(() => terminal.attach(value))
      .catch(() => {
        // `ready` rejecting is already reported through the error event below;
        // swallowing it here only prevents an unhandled rejection for the
        // attach path specifically.
      });
  }

  /** The underlying class, for anything the element does not surface. */
  get terminal(): Terminal | undefined {
    return this.#terminal;
  }

  connectedCallback(): void {
    // A reparent fires disconnect then connect. Cancel the pending teardown
    // rather than destroying and rebuilding the GPU context and the session.
    this.#pendingTeardown = false;
    if (this.#terminal !== undefined) return;

    if (this.style.display === "") this.style.display = "block";

    const terminal = new Terminal(this, this.#resolveOptions());
    this.#terminal = terminal;

    terminal.on("data", (bytes) => this.#dispatch("data", bytes));
    terminal.on("resize", (grid) => this.#dispatch("resize", grid));
    terminal.on("selection-change", (text) => this.#dispatch("selection-change", text));
    terminal.on("link-activate", (link) => this.#dispatch("link-activate", link));
    terminal.on("link-hover", (url) => this.#dispatch("link-hover", url));
    terminal.on("error", (error) => this.#dispatch("error", error));

    terminal.ready.catch((error: unknown) => {
      this.#dispatch("error", error instanceof Error ? error : new Error(String(error)));
    });

    const transport = this.#transport;
    if (transport !== undefined) {
      void terminal.ready
        .then(() => terminal.attach(transport))
        .catch(() => {
          // Reported by the `ready.catch` above; nothing to add here.
        });
    }
  }

  disconnectedCallback(): void {
    this.#pendingTeardown = true;
    queueMicrotask(() => {
      if (!this.#pendingTeardown) return;
      this.#pendingTeardown = false;
      this.#terminal?.dispose();
      this.#terminal = undefined;
    });
  }

  attributeChangedCallback(): void {
    this.#terminal?.setOptions(this.#resolveOptions());
  }

  #resolveOptions(): TerminalOptions {
    const fromAttributes = {
      font: {
        family: this.getAttribute("font-family") ?? DEFAULT_FONT_FAMILY,
        size: Number(this.getAttribute("font-size") ?? DEFAULT_FONT_SIZE),
      },
      scrollback: Number(this.getAttribute("scrollback") ?? DEFAULT_SCROLLBACK),
    };

    // The `options` property wins over attributes: it carries a fully
    // resolved configuration, while attributes are the convenience path for
    // a page that only wants a font.
    return { ...fromAttributes, ...this.#options } as TerminalOptions;
  }

  #dispatch(type: string, detail: unknown): void {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }));
  }
}

/** Register `<celeri-tty>`. Idempotent. */
export function defineCeleriTty(): void {
  if (customElements.get("celeri-tty") === undefined) {
    customElements.define("celeri-tty", CeleriTtyElement);
  }
}
