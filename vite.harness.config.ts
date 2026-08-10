import { defineConfig } from "vite";

export default defineConfig({
  root: "harness",
  server: {
    port: 8123,
    // The harness imports from ../src and ../src/wasm, both outside its root.
    fs: { allow: [".."] },
  },
});