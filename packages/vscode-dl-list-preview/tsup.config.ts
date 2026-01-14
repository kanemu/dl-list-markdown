import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/extension.ts"],
  format: ["cjs"],
  platform: "node",
  target: "node18",
  outDir: "dist",
  clean: true,

  // VS Code API は外部扱い
  external: ["vscode"],

  // 依存をバンドルする
  noExternal: ["markdown-it-dl-list"],
});
