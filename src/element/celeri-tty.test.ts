// @vitest-environment happy-dom
import { beforeAll, describe, expect, it } from "vitest";
import { CeleriTtyElement, defineCeleriTty } from "./celeri-tty";

beforeAll(() => {
  defineCeleriTty();
});

function mount(): CeleriTtyElement {
  const element = document.createElement("celeri-tty") as CeleriTtyElement;
  document.body.appendChild(element);
  return element;
}

describe("<celeri-tty>", () => {
  it("registers the tag once, tolerating a second call", () => {
    expect(() => defineCeleriTty()).not.toThrow();
    expect(customElements.get("celeri-tty")).toBe(CeleriTtyElement);
  });

  it("constructs a terminal when connected", () => {
    const element = mount();
    expect(element.terminal).toBeDefined();
  });

  it("keeps the same terminal across a reparent", async () => {
    // The lifecycle trap: appendChild on a connected element fires
    // disconnect then connect. Losing the terminal here would destroy the GPU
    // context and the session every time the host rearranges its layout.
    const element = mount();
    const before = element.terminal;

    const other = document.createElement("div");
    document.body.appendChild(other);
    other.appendChild(element);
    await Promise.resolve();

    expect(element.terminal).toBe(before);
  });

  it("disposes the terminal on a real removal", async () => {
    const element = mount();
    element.remove();
    await Promise.resolve();

    expect(element.terminal).toBeUndefined();
  });

  it("reports a failed startup as an error event rather than silently", async () => {
    const element = mount();
    const errors: Event[] = [];
    element.addEventListener("error", (event) => errors.push(event));

    // `ready` rejects here: happy-dom has no WebGPU.
    await element.terminal?.ready.catch(() => {});
    await Promise.resolve();
    await Promise.resolve();

    expect(errors.length).toBeGreaterThan(0);
  });

  it("prefers the options property over attributes", () => {
    const element = mount();
    element.setAttribute("font-size", "13");
    element.options = { font: { family: "Iosevka", size: 20 } };

    expect(element.options?.font?.size).toBe(20);
  });
});
