/** Wiring DOM events to handlers, and unwiring them again. */

export interface InputHandlers {
  onKeyDown(event: KeyboardEvent): void;
  onMouseDown(event: MouseEvent): void;
  onMouseUp(event: MouseEvent): void;
  onMouseMove(event: MouseEvent): void;
  onWheel(event: WheelEvent): void;
}

/**
 * Bind every input event a terminal cares about. Returns the unbind function.
 *
 * Two decisions worth knowing:
 *
 * - `mousemove` and `mouseup` go on `window`, not on the surface. A drag that
 *   leaves the terminal and releases outside it must still end the selection;
 *   bound to the surface, the `mouseup` never arrives and the terminal stays
 *   stuck in a dragging state forever.
 * - `wheel` is registered non-passive. The default is passive in every modern
 *   browser, and a passive listener cannot call `preventDefault`, so the page
 *   would scroll underneath the terminal.
 */
export function bindInput(surface: HTMLElement, handlers: InputHandlers): () => void {
  const onKeyDown = (event: KeyboardEvent): void => handlers.onKeyDown(event);
  const onMouseDown = (event: MouseEvent): void => handlers.onMouseDown(event);
  const onMouseUp = (event: MouseEvent): void => handlers.onMouseUp(event);
  const onMouseMove = (event: MouseEvent): void => handlers.onMouseMove(event);
  const onWheel = (event: WheelEvent): void => handlers.onWheel(event);

  surface.addEventListener("keydown", onKeyDown);
  surface.addEventListener("mousedown", onMouseDown);
  surface.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);

  return () => {
    surface.removeEventListener("keydown", onKeyDown);
    surface.removeEventListener("mousedown", onMouseDown);
    surface.removeEventListener("wheel", onWheel);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  };
}
