import { join } from "path";

const jsPaths = [
  "bind_polyfill.js",
  "classlist_polyfill.js",
  "animframe_polyfill.js",
  "keyboard_input_manager.js",
  "html_actuator.js",
  "grid.js",
  "tile.js",
  "local_storage_manager.js",
  "game_manager.js",
  "application.js",
];

await Promise.all(jsPaths.map((path) => Bun.file(join("./js", path)).text()))
  .then((c) => c.join("\n"))
  .then((code) => Bun.write("./_main.js", code));

const js = await Bun.build({
  entrypoints: ["./_main.js"],
  minify: true,
  format: "iife",
});

const css = await Bun.build({
  entrypoints: ["./style/main.css"],
  minify: true,
});

const html = await Bun.file("./index.html").text();
const newHtml = html
  .replace(/<!--JS-->/, `<script>${await js.outputs[0]!.text()}</script>`)
  .replace(/<!--CSS-->/, `<style>${await css.outputs[0]!.text()}</style>`);

await Bun.write("./index.out.html", newHtml);
