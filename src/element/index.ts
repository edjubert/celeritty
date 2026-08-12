/**
 * Importing this module registers `<celeri-tty>`.
 *
 * The side effect is why this is a separate entry point: importing the
 * package root must not touch the custom-element registry, since a host using
 * the class directly has no reason to reserve a tag name.
 */

import { defineCeleriTty } from "./celeri-tty";

defineCeleriTty();

export { CeleriTtyElement, defineCeleriTty } from "./celeri-tty";
